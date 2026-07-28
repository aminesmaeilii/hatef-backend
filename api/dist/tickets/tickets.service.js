"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const notifications_service_1 = require("../notifications/notifications.service");
const ticket_state_machine_1 = require("./ticket-state-machine");
/** SLA target for a new ticket, by priority (spec 18 "SLA"). */
const SLA_HOURS_BY_PRIORITY = { URGENT: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };
function isInternalActor(actor) {
    const internalRoleKeys = auth_1.INTERNAL_ROLES;
    return actor.roleAssignments.some((a) => internalRoleKeys.includes(a.role));
}
let TicketsService = class TicketsService {
    prisma;
    auditLog;
    notifications;
    constructor(prisma, auditLog, notifications) {
        this.prisma = prisma;
        this.auditLog = auditLog;
        this.notifications = notifications;
    }
    async create(input, actor, channelId) {
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
    async list(filters) {
        const tickets = await this.prisma.ticket.findMany({
            where: { channelId: filters.channelId, status: filters.status, assigneeId: filters.assigneeId },
            include: { attachments: true },
            orderBy: [{ slaDueAt: "asc" }, { createdAt: "desc" }],
        });
        return tickets.map(toTicketDto);
    }
    /** Partner-facing detail — never includes internal notes (spec 18's own exit proof). */
    async getDetail(ticketId) {
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
    async getAdminDetail(ticketId) {
        const detail = await this.getDetail(ticketId);
        const notes = await this.prisma.ticketInternalNote.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" } });
        return {
            ...detail,
            internalNotes: notes.map((n) => ({ id: n.id, authorId: n.authorId, body: n.body, createdAt: n.createdAt.toISOString() })),
        };
    }
    async addMessage(ticketId, input, actor) {
        const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
        const message = await this.prisma.ticketMessage.create({ data: { ticketId, authorId: actor.userId, body: input.body } });
        const internal = isInternalActor(actor);
        if (ticket_state_machine_1.LIVE_TICKET_STATUSES.includes(ticket.status)) {
            const target = internal ? "WAITING_FOR_PARTNER" : "WAITING_FOR_HATEF";
            if (ticket_state_machine_1.ticketStateMachine.canTransition(ticket.status, target)) {
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
        }
        else if (ticket.createdById) {
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
    async addInternalNote(ticketId, input, actor) {
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
    async assign(ticketId, assigneeId, actor) {
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
    async transition(ticketId, toStatus, note, actor, options) {
        const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
        try {
            ticket_state_machine_1.ticketStateMachine.assertTransition(ticket.status, toStatus);
        }
        catch (error) {
            if (error instanceof domain_1.IllegalStateTransitionError) {
                throw new common_1.BadRequestException(`تغییر وضعیت از «${ticket.status}» به «${toStatus}» مجاز نیست.`);
            }
            throw error;
        }
        const data = { status: toStatus };
        if (options?.firstResponse)
            data.firstResponseAt = new Date();
        if (toStatus === "RESOLVED")
            data.resolvedAt = new Date();
        if (toStatus === "CLOSED")
            data.closedAt = new Date();
        if (toStatus === "REOPENED")
            data.reopenCount = ticket.reopenCount + 1;
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
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        notifications_service_1.NotificationsService])
], TicketsService);
function toMessageDto(m) {
    return { id: m.id, authorId: m.authorId, body: m.body, createdAt: m.createdAt.toISOString() };
}
function toTicketDto(ticket) {
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
