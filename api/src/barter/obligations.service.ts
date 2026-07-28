import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { computePartialAcceptance, IllegalStateTransitionError, InvalidPartialAcceptanceError, serializeRial } from "@hatef/domain";
import type {
  CreateObligation,
  CreateObligationProposal,
  Deliverable,
  Dispute,
  Obligation,
  ObligationDetail,
  RaiseDispute,
  RespondToObligationProposal,
  ResolveObligationDispute,
  ReviewDeliverable,
  SubmitDeliverable,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ServiceCatalogService } from "./service-catalog.service";
import { obligationStateMachine } from "./obligation-state-machine";

@Injectable()
export class ObligationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly serviceCatalog: ServiceCatalogService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async propose(input: CreateObligation, actor: RequestActor): Promise<Obligation> {
    const activeVersion = await this.serviceCatalog.getActiveVersionOrThrow(input.serviceCatalogItemId);

    const created = await this.prisma.serviceObligation.create({
      data: {
        channelId: input.channelId,
        supportRequestId: input.supportRequestId,
        serviceCatalogItemId: input.serviceCatalogItemId,
        serviceCatalogVersionId: activeVersion.id,
        brief: input.brief,
        output: input.output,
        acceptanceCriteria: input.acceptanceCriteria ?? activeVersion.defaultAcceptanceCriteria,
        valueRial: BigInt(input.valueRial),
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
        responsibleChannelMemberId: input.responsibleChannelMemberId,
        responsibleHatefEmployeeId: input.responsibleHatefEmployeeId,
        terms: input.terms,
        createdById: actor.userId,
        proposals: {
          create: { versionNumber: 1, proposedById: actor.userId, valueRial: BigInt(input.valueRial), brief: input.brief },
        },
        statusEvents: { create: { toStatus: "PROPOSED", createdBy: actor.userId } },
      },
      include: { serviceCatalogItem: true, channel: true },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "obligation.proposed",
      entityType: "service_obligation",
      entityId: created.id,
    });

    await this.notifications.notifyChannelOwner(created.channelId, {
      eventType: "obligation.proposed",
      dedupeKey: `obligation:${created.id}:proposed`,
      title: "پیشنهاد تعهد خدمت متقابل جدید",
      body: input.brief,
      deepLink: `/obligations/${created.id}`,
      linkedEntityType: "service_obligation",
      linkedEntityId: created.id,
      channels: ["IN_APP", "SMS"],
    });

    return toObligationDto(created);
  }

  async list(filters: { channelId?: string; status?: string }): Promise<Obligation[]> {
    const rows = await this.prisma.serviceObligation.findMany({
      where: { channelId: filters.channelId, status: filters.status as never },
      include: { serviceCatalogItem: true, channel: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toObligationDto);
  }

  async getDetail(obligationId: string): Promise<ObligationDetail> {
    const row = await this.prisma.serviceObligation.findUniqueOrThrow({
      where: { id: obligationId },
      include: {
        serviceCatalogItem: true,
        channel: true,
        proposals: { orderBy: { versionNumber: "asc" } },
        statusEvents: { orderBy: { createdAt: "asc" } },
      },
    });
    return {
      ...toObligationDto(row),
      proposals: row.proposals.map((p) => ({
        id: p.id,
        versionNumber: p.versionNumber,
        proposedById: p.proposedById,
        status: p.status,
        valueRial: serializeRial(p.valueRial),
        brief: p.brief,
        deadlineAt: p.deadlineAt?.toISOString() ?? null,
        note: p.note,
        createdAt: p.createdAt.toISOString(),
      })),
      statusEvents: row.statusEvents.map((e) => ({
        id: e.id,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  /** A counter-proposal — either side can send one while still PROPOSED/NEGOTIATING (spec 16.3 "negotiate"). */
  async counterPropose(obligationId: string, input: CreateObligationProposal, actor: RequestActor): Promise<Obligation> {
    const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
    this.assertTransition(obligation.status, "NEGOTIATING");

    const last = await this.prisma.obligationProposal.findFirst({ where: { obligationId }, orderBy: { versionNumber: "desc" } });
    await this.prisma.$transaction([
      ...(last && last.status === "PROPOSED"
        ? [this.prisma.obligationProposal.update({ where: { id: last.id }, data: { status: "COUNTERED" } })]
        : []),
      this.prisma.obligationProposal.create({
        data: {
          obligationId,
          versionNumber: (last?.versionNumber ?? 0) + 1,
          proposedById: actor.userId,
          valueRial: BigInt(input.valueRial),
          brief: input.brief,
          deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
          note: input.note,
        },
      }),
    ]);

    return this.transition(obligationId, "NEGOTIATING", "پیشنهاد جدید ثبت شد.", actor);
  }

  async respondToProposal(obligationId: string, input: RespondToObligationProposal, actor: RequestActor): Promise<Obligation> {
    const latest = await this.prisma.obligationProposal.findFirst({ where: { obligationId }, orderBy: { versionNumber: "desc" } });
    if (!latest) throw new NotFoundException("پیشنهادی برای این تعهد یافت نشد.");

    if (input.action === "ACCEPT") {
      await this.prisma.$transaction([
        this.prisma.obligationProposal.update({ where: { id: latest.id }, data: { status: "ACCEPTED", respondedAt: new Date() } }),
        this.prisma.serviceObligation.update({ where: { id: obligationId }, data: { valueRial: latest.valueRial } }),
      ]);
      return this.transition(obligationId, "ACCEPTED", input.note, actor);
    }

    await this.prisma.obligationProposal.update({ where: { id: latest.id }, data: { status: "REJECTED", respondedAt: new Date() } });
    return this.transition(obligationId, "CANCELLED", input.note ?? "پیشنهاد رد شد.", actor);
  }

  async submitDeliverable(obligationId: string, input: SubmitDeliverable, actor: RequestActor): Promise<Deliverable> {
    const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
    if (!["ACCEPTED", "SCHEDULED", "IN_PROGRESS", "NEEDS_REVISION"].includes(obligation.status)) {
      throw new BadRequestException("در این وضعیت امکان ثبت خروجی وجود ندارد.");
    }

    const deliverable = await this.prisma.deliverable.create({
      data: {
        obligationId,
        submittedById: actor.userId,
        description: input.description,
        links: input.links,
        reachOrViews: input.reachOrViews,
        deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : new Date(),
        attachments: { create: input.fileIds.map((fileAssetId) => ({ fileAssetId })) },
      },
      include: { attachments: true, reviews: true },
    });

    if (obligation.status !== "SUBMITTED") {
      await this.transition(obligationId, "SUBMITTED", "خروجی جدید ثبت شد.", actor);
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "deliverable.submitted",
      entityType: "deliverable",
      entityId: deliverable.id,
      metadata: { obligationId },
    });

    return toDeliverableDto(deliverable);
  }

  async listDeliverables(obligationId: string): Promise<Deliverable[]> {
    const rows = await this.prisma.deliverable.findMany({
      where: { obligationId },
      include: { attachments: true, reviews: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDeliverableDto);
  }

  /**
   * Reviewer action (spec 16.4). ACCEPT_FULL/ACCEPT_PARTIAL post a real
   * SERVICE_ACCEPTED LedgerEntry pair immediately — accepted value becomes a
   * ledger fact the moment it's accepted, not deferred until settlement.
   */
  async reviewDeliverable(deliverableId: string, input: ReviewDeliverable, actor: RequestActor): Promise<Deliverable> {
    const deliverable = await this.prisma.deliverable.findUniqueOrThrow({
      where: { id: deliverableId },
      include: { obligation: true },
    });

    let acceptedValueRial: bigint | null = null;
    let remainingValueRial: bigint | null = null;
    let nextDeliverableStatus: Deliverable["status"];
    let nextObligationStatus: Obligation["status"] | null = null;

    switch (input.decision) {
      case "ACCEPT_FULL": {
        const result = computePartialAcceptance({ deliverableValueRial: deliverable.obligation.valueRial, acceptedValueRial: deliverable.obligation.valueRial });
        acceptedValueRial = result.acceptedValueRial;
        remainingValueRial = result.remainingValueRial;
        nextDeliverableStatus = "ACCEPTED";
        nextObligationStatus = "APPROVED";
        break;
      }
      case "ACCEPT_PARTIAL": {
        if (!input.acceptedValueRial) throw new BadRequestException("مبلغ پذیرفته‌شده الزامی است.");
        try {
          const result = computePartialAcceptance({
            deliverableValueRial: deliverable.obligation.valueRial,
            acceptedValueRial: BigInt(input.acceptedValueRial),
          });
          acceptedValueRial = result.acceptedValueRial;
          remainingValueRial = result.remainingValueRial;
        } catch (error) {
          if (error instanceof InvalidPartialAcceptanceError) throw new BadRequestException(error.message);
          throw error;
        }
        nextDeliverableStatus = "PARTIALLY_ACCEPTED";
        nextObligationStatus = "PARTIALLY_APPROVED";
        break;
      }
      case "REQUEST_REVISION":
        nextDeliverableStatus = "NEEDS_REVISION";
        nextObligationStatus = "NEEDS_REVISION";
        break;
      case "REJECT":
        nextDeliverableStatus = "REJECTED";
        nextObligationStatus = "NEEDS_REVISION";
        break;
      case "DISPUTE":
        nextDeliverableStatus = "DISPUTED";
        nextObligationStatus = "DISPUTED";
        break;
    }

    await this.prisma.$transaction([
      this.prisma.deliverableReview.create({
        data: {
          deliverableId,
          reviewerId: actor.userId,
          decision: input.decision,
          acceptedValueRial: acceptedValueRial ?? undefined,
          remainingValueRial: remainingValueRial ?? undefined,
          note: input.note,
        },
      }),
      this.prisma.deliverable.update({ where: { id: deliverableId }, data: { status: nextDeliverableStatus } }),
    ]);

    if (input.decision === "DISPUTE") {
      await this.prisma.dispute.create({
        data: { obligationId: deliverable.obligationId, deliverableId, raisedById: actor.userId, reason: input.note ?? "اختلاف در بازبینی خروجی" },
      });
    }

    if (nextObligationStatus) {
      await this.transition(deliverable.obligationId, nextObligationStatus, input.note, actor);
    }

    if (acceptedValueRial && acceptedValueRial > 0n) {
      await this.ledger.post({
        transactionType: "SERVICE_ACCEPTED",
        idempotencyKey: `deliverable-review:${deliverableId}`,
        sourceType: "deliverable",
        sourceId: deliverableId,
        description: "پذیرش ارزش خروجی خدمت متقابل",
        createdBy: actor.userId,
        entries: [
          {
            channelId: deliverable.obligation.channelId,
            accountType: "CHANNEL_SERVICE_DELIVERED",
            direction: "DEBIT",
            amountRial: acceptedValueRial,
          },
          {
            channelId: deliverable.obligation.channelId,
            accountType: "CHANNEL_SERVICE_OBLIGATION",
            direction: "CREDIT",
            amountRial: acceptedValueRial,
          },
        ],
      });
    }

    const updated = await this.prisma.deliverable.findUniqueOrThrow({
      where: { id: deliverableId },
      include: { attachments: true, reviews: { orderBy: { createdAt: "asc" } } },
    });

    await this.notifications.notify({
      userId: deliverable.submittedById,
      eventType: "deliverable.reviewed",
      dedupeKey: `deliverable:${deliverableId}:review:${updated.reviews.at(-1)?.id}`,
      title: "بازبینی خروجی تعهد خدمت متقابل",
      body: input.note ?? `نتیجه بازبینی: ${input.decision}`,
      deepLink: `/obligations/${deliverable.obligationId}`,
      linkedEntityType: "deliverable",
      linkedEntityId: deliverableId,
      channels: ["IN_APP", "SMS"],
    });

    return toDeliverableDto(updated);
  }

  async raiseDispute(obligationId: string, input: RaiseDispute, actor: RequestActor): Promise<Dispute> {
    const dispute = await this.prisma.dispute.create({
      data: { obligationId, deliverableId: input.deliverableId, raisedById: actor.userId, reason: input.reason },
    });
    await this.transition(obligationId, "DISPUTED", input.reason, actor);
    return toDisputeDto(dispute);
  }

  /** RESOLVED_REVERSED triggers a real ledger reversal of the disputed acceptance posting — never a silent balance edit (spec 16.5). */
  async resolveDispute(disputeId: string, input: ResolveObligationDispute, actor: RequestActor): Promise<Dispute> {
    const dispute = await this.prisma.dispute.findUniqueOrThrow({ where: { id: disputeId } });
    if (dispute.status !== "OPEN") {
      throw new BadRequestException("این اختلاف قبلاً حل شده است.");
    }

    if (input.outcome === "REVERSE" && dispute.deliverableId) {
      const original = await this.prisma.ledgerTransaction.findUnique({
        where: { idempotencyKey: `deliverable-review:${dispute.deliverableId}` },
      });
      if (original) {
        await this.ledger.reverse(original.id, input.note, actor.userId);
      }
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: input.outcome === "REVERSE" ? "RESOLVED_REVERSED" : "RESOLVED_UPHELD",
        resolutionNote: input.note,
        resolvedById: actor.userId,
        resolvedAt: new Date(),
      },
    });

    const nextStatus = input.outcome === "REVERSE" ? "NEEDS_REVISION" : "APPROVED";
    await this.transition(dispute.obligationId, nextStatus, input.note, actor);

    return toDisputeDto(updated);
  }

  async transition(obligationId: string, toStatus: Obligation["status"], note: string | undefined, actor: RequestActor): Promise<Obligation> {
    const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId } });
    this.assertTransition(obligation.status, toStatus);

    const [, , updated] = await this.prisma.$transaction([
      this.prisma.serviceObligation.update({ where: { id: obligationId }, data: { status: toStatus } }),
      this.prisma.obligationStatusEvent.create({
        data: { obligationId, fromStatus: obligation.status, toStatus, note, createdBy: actor.userId },
      }),
      this.prisma.serviceObligation.findUniqueOrThrow({ where: { id: obligationId }, include: { serviceCatalogItem: true, channel: true } }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "obligation.transitioned",
      entityType: "service_obligation",
      entityId: obligationId,
      metadata: { from: obligation.status, to: toStatus },
    });

    return toObligationDto(updated);
  }

  private assertTransition(from: Obligation["status"], to: Obligation["status"]): void {
    try {
      obligationStateMachine.assertTransition(from, to);
    } catch (error) {
      if (error instanceof IllegalStateTransitionError) {
        throw new BadRequestException(`تغییر وضعیت از «${from}» به «${to}» مجاز نیست.`);
      }
      throw error;
    }
  }
}

type ObligationWithJoins = {
  id: string;
  channelId: string;
  channel: { title: string };
  supportRequestId: string | null;
  serviceCatalogItemId: string;
  serviceCatalogItem: { name: string };
  status: string;
  brief: string;
  output: string | null;
  acceptanceCriteria: string | null;
  valueRial: bigint;
  settledValueRial: bigint;
  startAt: Date | null;
  deadlineAt: Date | null;
  responsibleChannelMemberId: string | null;
  responsibleHatefEmployeeId: string | null;
  terms: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toObligationDto(o: ObligationWithJoins): Obligation {
  return {
    id: o.id,
    channelId: o.channelId,
    channelTitle: o.channel.title,
    supportRequestId: o.supportRequestId,
    serviceCatalogItemId: o.serviceCatalogItemId,
    serviceCatalogItemName: o.serviceCatalogItem.name,
    status: o.status as Obligation["status"],
    brief: o.brief,
    output: o.output,
    acceptanceCriteria: o.acceptanceCriteria,
    valueRial: serializeRial(o.valueRial),
    settledValueRial: serializeRial(o.settledValueRial),
    startAt: o.startAt?.toISOString() ?? null,
    deadlineAt: o.deadlineAt?.toISOString() ?? null,
    responsibleChannelMemberId: o.responsibleChannelMemberId,
    responsibleHatefEmployeeId: o.responsibleHatefEmployeeId,
    terms: o.terms,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

type DeliverableWithJoins = {
  id: string;
  obligationId: string;
  submittedById: string;
  status: string;
  description: string | null;
  links: unknown;
  reachOrViews: number | null;
  deliveredAt: Date | null;
  createdAt: Date;
  attachments: { fileAssetId: string }[];
  reviews: {
    id: string;
    reviewerId: string;
    decision: string;
    acceptedValueRial: bigint | null;
    remainingValueRial: bigint | null;
    note: string | null;
    createdAt: Date;
  }[];
};

function toDeliverableDto(d: DeliverableWithJoins): Deliverable {
  return {
    id: d.id,
    obligationId: d.obligationId,
    submittedById: d.submittedById,
    status: d.status as Deliverable["status"],
    description: d.description,
    links: (d.links as string[]) ?? [],
    reachOrViews: d.reachOrViews,
    deliveredAt: d.deliveredAt?.toISOString() ?? null,
    fileIds: d.attachments.map((a) => a.fileAssetId),
    reviews: d.reviews.map((r) => ({
      id: r.id,
      reviewerId: r.reviewerId,
      decision: r.decision as Deliverable["reviews"][number]["decision"],
      acceptedValueRial: r.acceptedValueRial !== null ? serializeRial(r.acceptedValueRial) : null,
      remainingValueRial: r.remainingValueRial !== null ? serializeRial(r.remainingValueRial) : null,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
    createdAt: d.createdAt.toISOString(),
  };
}

function toDisputeDto(d: {
  id: string;
  obligationId: string;
  deliverableId: string | null;
  raisedById: string;
  reason: string;
  status: string;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}): Dispute {
  return {
    id: d.id,
    obligationId: d.obligationId,
    deliverableId: d.deliverableId,
    raisedById: d.raisedById,
    reason: d.reason,
    status: d.status as Dispute["status"],
    resolutionNote: d.resolutionNote,
    resolvedById: d.resolvedById,
    resolvedAt: d.resolvedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}
