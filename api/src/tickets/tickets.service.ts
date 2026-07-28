import { BadRequestException, Injectable } from "@nestjs/common";
import { IllegalStateTransitionError } from "@hatef/domain";
import { INTERNAL_ROLES } from "@hatef/auth";
import type {
  AddTicketInternalNote,
  AddTicketMessage,
  CreateTicket,
  Ticket,
  TicketAdminDetail,
  TicketDetail,
  TicketMessageDto,
  TicketStatusKey,
} from "@hatef/contracts";
import type { Ticket as PrismaTicket } from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { NotificationsService } from "../notifications/notifications.service";
import { LIVE_TICKET_STATUSES, ticketStateMachine } from "./ticket-state-machine";

/** SLA target for a new ticket, by priority (spec 18 "SLA"). */
const SLA_HOURS_BY_PRIORITY: Record<string, number> = { URGENT: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };

export interface TicketListFilters {
  channelId?: string;
  status?: TicketStatusKey;
  assigneeId?: string;
}

function isInternalActor(actor: RequestActor): boolean {
  const internalRoleKeys: readonly string[] = INTERNAL_ROLES;
  return actor.roleAssignments.some((a) => internalRoleKeys.includes(a.role));
}

type TicketWithAttachments = PrismaTicket & { attachments: { fileAssetId: string }[] };

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(input: CreateTicket, actor: RequestActor, channelId?: string): Promise<Ticket> {
    const slaHours = SLA_HOURS_BY_PRIORITY[input.priority] ?? 24;
    const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const created = await this.prisma.ticket.create({
      data: {
        channelId,
        category: input.category,
        priority: input.priority,
        subject: input.subject,
        slaDueAt,
        createdById: actor.userId,
        messages: { create: { authorId: actor.userId, body: input.body } },
        attachments: { create: input.fileIds.map((fileAssetId) => ({ fileAssetId })) },
        statusEvents: { create: { toStatus: "NEW", createdBy: actor.userId } },
      },
      include: { attachments: true },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "ticket.created",
      entityType: "ticket",
      entityId: created.id,
    });

    return toTicketDto(created);
  }

  async list(filters: TicketListFilters): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { channelId: filters.channelId, status: filters.status, assigneeId: filters.assigneeId },
      include: { attachments: true },
      orderBy: [{ slaDueAt: "asc" }, { createdAt: "desc" }],
    });
    return tickets.map(toTicketDto);
  }

  /** Partner-facing detail — never includes internal notes (spec 18's own exit proof). */
  async getDetail(ticketId: string): Promise<TicketDetail> {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: {
        attachments: true,
        messages: { orderBy: { createdAt: "asc" } },
        statusEvents: { orderBy: { createdAt: "asc" } },
      },
    });
    return {
      ...toTicketDto(ticket),
      messages: ticket.messages.map(toMessageDto),
      statusEvents: ticket.statusEvents.map((e) => ({
        id: e.id,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  /** Internal/admin detail — the one path allowed to also carry internal notes. */
  async getAdminDetail(ticketId: string): Promise<TicketAdminDetail> {
    const detail = await this.getDetail(ticketId);
    const notes = await this.prisma.ticketInternalNote.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" } });
    return {
      ...detail,
      internalNotes: notes.map((n) => ({ id: n.id, authorId: n.authorId, body: n.body, createdAt: n.createdAt.toISOString() })),
    };
  }

  async addMessage(ticketId: string, input: AddTicketMessage, actor: RequestActor): Promise<TicketMessageDto> {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    const message = await this.prisma.ticketMessage.create({ data: { ticketId, authorId: actor.userId, body: input.body } });

    const internal = isInternalActor(actor);
    if (LIVE_TICKET_STATUSES.includes(ticket.status)) {
      const target: TicketStatusKey = internal ? "WAITING_FOR_PARTNER" : "WAITING_FOR_HATEF";
      if (ticketStateMachine.canTransition(ticket.status, target)) {
        await this.transition(ticketId, target, undefined, actor, {
          firstResponse: internal && !ticket.firstResponseAt,
        });
      }
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "ticket.message_added",
      entityType: "ticket",
      entityId: ticketId,
    });

    if (!internal) {
      // A partner replied — notify assigned staff (or the whole ops queue via the read-only list if unassigned).
      if (ticket.assigneeId) {
        await this.notifications.notify({
          userId: ticket.assigneeId,
          eventType: "ticket.response",
          dedupeKey: `ticket:${ticketId}:message:${message.id}`,
          title: "پاسخ جدید در تیکت",
          body: input.body.slice(0, 140),
          deepLink: `/tickets/${ticketId}`,
          linkedEntityType: "ticket",
          linkedEntityId: ticketId,
        });
      }
    } else if (ticket.createdById) {
      await this.notifications.notify({
        userId: ticket.createdById,
        eventType: "ticket.response",
        dedupeKey: `ticket:${ticketId}:message:${message.id}`,
        title: "پاسخ جدید در تیکت شما",
        body: input.body.slice(0, 140),
        deepLink: `/tickets/${ticketId}`,
        linkedEntityType: "ticket",
        linkedEntityId: ticketId,
        channels: ["IN_APP", "SMS"],
      });
    }

    return toMessageDto(message);
  }

  /** Internal-only. No partner-facing controller ever calls this. */
  async addInternalNote(ticketId: string, input: AddTicketInternalNote, actor: RequestActor) {
    const note = await this.prisma.ticketInternalNote.create({ data: { ticketId, authorId: actor.userId, body: input.body } });
    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "ticket.internal_note_added",
      entityType: "ticket",
      entityId: ticketId,
    });
    return { id: note.id, authorId: note.authorId, body: note.body, createdAt: note.createdAt.toISOString() };
  }

  async assign(ticketId: string, assigneeId: string | null, actor: RequestActor): Promise<Ticket> {
    if (assigneeId) {
      await this.prisma.user.findUniqueOrThrow({ where: { id: assigneeId } });
    }
    const updated = await this.prisma.ticket.update({ where: { id: ticketId }, data: { assigneeId }, include: { attachments: true } });
    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "ticket.assigned",
      entityType: "ticket",
      entityId: ticketId,
      metadata: { assigneeId },
    });
    return toTicketDto(updated);
  }

  async transition(
    ticketId: string,
    toStatus: TicketStatusKey,
    note: string | undefined,
    actor: RequestActor,
    options?: { firstResponse?: boolean },
  ): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    try {
      ticketStateMachine.assertTransition(ticket.status, toStatus);
    } catch (error) {
      if (error instanceof IllegalStateTransitionError) {
        throw new BadRequestException(`تغییر وضعیت از «${ticket.status}» به «${toStatus}» مجاز نیست.`);
      }
      throw error;
    }

    const data: Record<string, unknown> = { status: toStatus };
    if (options?.firstResponse) data.firstResponseAt = new Date();
    if (toStatus === "RESOLVED") data.resolvedAt = new Date();
    if (toStatus === "CLOSED") data.closedAt = new Date();
    if (toStatus === "REOPENED") data.reopenCount = ticket.reopenCount + 1;

    const [, , updated] = await this.prisma.$transaction([
      this.prisma.ticket.update({ where: { id: ticketId }, data }),
      this.prisma.ticketStatusEvent.create({ data: { ticketId, fromStatus: ticket.status, toStatus, note, createdBy: actor.userId } }),
      this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: { attachments: true } }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "ticket.transitioned",
      entityType: "ticket",
      entityId: ticketId,
      metadata: { from: ticket.status, to: toStatus },
    });

    return toTicketDto(updated);
  }
}

function toMessageDto(m: { id: string; authorId: string; body: string; createdAt: Date }): TicketMessageDto {
  return { id: m.id, authorId: m.authorId, body: m.body, createdAt: m.createdAt.toISOString() };
}

function toTicketDto(ticket: TicketWithAttachments): Ticket {
  const now = new Date();
  const slaBreached = ticket.slaDueAt
    ? ticket.resolvedAt
      ? ticket.resolvedAt > ticket.slaDueAt
      : ticket.status !== "CLOSED" && ticket.slaDueAt < now
    : false;

  return {
    id: ticket.id,
    channelId: ticket.channelId,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    subject: ticket.subject,
    slaDueAt: ticket.slaDueAt?.toISOString() ?? null,
    slaBreached,
    firstResponseAt: ticket.firstResponseAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    reopenCount: ticket.reopenCount,
    assigneeId: ticket.assigneeId,
    watcherIds: ticket.watcherIds,
    linkedEntityType: ticket.linkedEntityType,
    linkedEntityId: ticket.linkedEntityId,
    createdById: ticket.createdById,
    fileIds: ticket.attachments.map((a) => a.fileAssetId),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}
