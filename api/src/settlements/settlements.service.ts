import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { allocateSettlement, serializeRial, SettlementExceedsAcceptedValueError, type AllocationTarget } from "@hatef/domain";
import type { CreateSettlement, DecideFinancialApproval, Settlement } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Available-to-settle value for one obligation: total accepted (from DeliverableReview rows) minus already settled. */
  private async getAvailableTargets(channelId: string, obligationIds?: string[]): Promise<AllocationTarget[]> {
    const obligations = await this.prisma.serviceObligation.findMany({
      where: { channelId, id: obligationIds ? { in: obligationIds } : undefined, status: { in: ["APPROVED", "PARTIALLY_APPROVED", "SETTLED"] } },
      include: { deliverables: { include: { reviews: true } } },
    });

    return obligations.map((o) => {
      const acceptedTotal = o.deliverables
        .flatMap((d) => d.reviews)
        .reduce((sum, r) => (r.decision === "ACCEPT_FULL" || r.decision === "ACCEPT_PARTIAL" ? sum + (r.acceptedValueRial ?? 0n) : sum), 0n);
      const available = acceptedTotal - o.settledValueRial;
      return { obligationId: o.id, availableRial: available > 0n ? available : 0n };
    });
  }

  async create(input: CreateSettlement, actor: RequestActor): Promise<Settlement> {
    const requestedObligationIds = input.allocations.map((a) => a.obligationId);
    const targets = await this.getAvailableTargets(input.channelId, requestedObligationIds);
    const totalRequested = input.allocations.reduce((sum, a) => sum + BigInt(a.amountRial), 0n);

    // Validate every requested allocation individually against its own obligation's available value,
    // and the aggregate against the sum of available value (spec 27: "settlement cannot exceed accepted service").
    for (const allocation of input.allocations) {
      const target = targets.find((t) => t.obligationId === allocation.obligationId);
      if (!target || BigInt(allocation.amountRial) > target.availableRial) {
        throw new BadRequestException("مبلغ تخصیص‌یافته از ارزش پذیرفته‌شده و تسویه‌نشده تعهد بیشتر است.");
      }
    }
    try {
      allocateSettlement(totalRequested, targets);
    } catch (error) {
      if (error instanceof SettlementExceedsAcceptedValueError) {
        throw new BadRequestException("مجموع تسویه از مجموع ارزش پذیرفته‌شده بیشتر است.");
      }
      throw error;
    }

    const created = await this.prisma.settlement.create({
      data: {
        channelId: input.channelId,
        totalAmountRial: totalRequested,
        statementNote: input.statementNote,
        createdById: actor.userId,
        allocations: {
          create: input.allocations.map((a) => ({
            obligationId: a.obligationId,
            deliverableId: a.deliverableId,
            amountRial: BigInt(a.amountRial),
          })),
        },
      },
      include: { allocations: true },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "settlement.created",
      entityType: "settlement",
      entityId: created.id,
      metadata: { totalAmountRial: totalRequested.toString() },
    });

    return toSettlementDto(created);
  }

  /** Manual settlement always requires dual approval (spec 16.5) — this just opens the gate. */
  async submitForApproval(settlementId: string, actor: RequestActor): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId } });
    if (settlement.status !== "DRAFT") {
      throw new BadRequestException("فقط تسویه‌های پیش‌نویس قابل ارسال برای تأیید هستند.");
    }

    await this.prisma.$transaction([
      this.prisma.settlement.update({ where: { id: settlementId }, data: { status: "PENDING_APPROVAL" } }),
      this.prisma.financialApprovalRequest.create({
        data: {
          type: "MANUAL_SETTLEMENT",
          channelId: settlement.channelId,
          amountRial: settlement.totalAmountRial,
          reason: settlement.statementNote ?? "تسویه دستی",
          payload: { settlementId } as never,
          requestedById: actor.userId,
        },
      }),
    ]);

    return this.getOne(settlementId);
  }

  async decideApproval(settlementId: string, input: DecideFinancialApproval, actor: RequestActor): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId }, include: { allocations: true } });
    if (settlement.status !== "PENDING_APPROVAL") {
      throw new BadRequestException("این تسویه در انتظار تأیید نیست.");
    }
    const approval = await this.prisma.financialApprovalRequest.findFirst({
      where: { type: "MANUAL_SETTLEMENT", status: "PENDING", payload: { path: ["settlementId"], equals: settlementId } },
    });
    if (!approval) throw new NotFoundException("درخواست تأیید یافت نشد.");
    if (approval.requestedById === actor.userId) {
      throw new ForbiddenException("تأییدکننده دوم نمی‌تواند همان درخواست‌دهنده باشد.");
    }

    if (input.action === "REJECT") {
      await this.prisma.$transaction([
        this.prisma.settlement.update({ where: { id: settlementId }, data: { status: "DRAFT" } }),
        this.prisma.financialApprovalRequest.update({
          where: { id: approval.id },
          data: { status: "REJECTED", decidedById: actor.userId, decidedAt: new Date(), decisionNote: input.note },
        }),
      ]);
      return this.getOne(settlementId);
    }

    const ledgerTransaction = await this.ledger.post({
      transactionType: "SETTLEMENT",
      idempotencyKey: `settlement:${settlementId}`,
      sourceType: "settlement",
      sourceId: settlementId,
      description: settlement.statementNote ?? undefined,
      createdBy: actor.userId,
      entries: [
        { channelId: settlement.channelId, accountType: "CHANNEL_SETTLEMENT", direction: "DEBIT", amountRial: settlement.totalAmountRial },
        {
          channelId: settlement.channelId,
          accountType: "CHANNEL_SERVICE_DELIVERED",
          direction: "CREDIT",
          amountRial: settlement.totalAmountRial,
        },
      ],
    });

    await this.prisma.$transaction([
      ...settlement.allocations.map((a) =>
        this.prisma.serviceObligation.update({
          where: { id: a.obligationId },
          data: { settledValueRial: { increment: a.amountRial } },
        }),
      ),
      this.prisma.settlement.update({
        where: { id: settlementId },
        data: { status: "COMPLETED", completedAt: new Date(), ledgerTransactionId: ledgerTransaction.id },
      }),
      this.prisma.financialApprovalRequest.update({
        where: { id: approval.id },
        data: { status: "APPROVED", decidedById: actor.userId, decidedAt: new Date(), decisionNote: input.note },
      }),
    ]);

    for (const allocation of settlement.allocations) {
      const obligation = await this.prisma.serviceObligation.findUniqueOrThrow({
        where: { id: allocation.obligationId },
        include: { deliverables: { include: { reviews: true } } },
      });
      const acceptedTotal = obligation.deliverables
        .flatMap((d) => d.reviews)
        .reduce((sum, r) => (r.decision === "ACCEPT_FULL" || r.decision === "ACCEPT_PARTIAL" ? sum + (r.acceptedValueRial ?? 0n) : sum), 0n);
      if (obligation.settledValueRial >= acceptedTotal && acceptedTotal > 0n) {
        await this.prisma.serviceObligation.update({ where: { id: obligation.id }, data: { status: "SETTLED" } });
      }
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "settlement.completed",
      entityType: "settlement",
      entityId: settlementId,
      metadata: { ledgerTransactionId: ledgerTransaction.id },
    });

    await this.notifications.notifyChannelOwner(settlement.channelId, {
      eventType: "settlement.completed",
      dedupeKey: `settlement:${settlementId}:completed`,
      title: "تسویه‌حساب انجام شد",
      body: settlement.statementNote ?? "تسویه خدمت متقابل کانال شما تکمیل شد.",
      deepLink: "/statement",
      linkedEntityType: "settlement",
      linkedEntityId: settlementId,
      channels: ["IN_APP", "SMS"],
    });

    return this.getOne(settlementId);
  }

  async getOne(settlementId: string): Promise<Settlement> {
    const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId }, include: { allocations: true } });
    return toSettlementDto(settlement);
  }

  async listForChannel(channelId: string): Promise<Settlement[]> {
    const rows = await this.prisma.settlement.findMany({ where: { channelId }, include: { allocations: true }, orderBy: { createdAt: "desc" } });
    return rows.map(toSettlementDto);
  }
}

type SettlementWithAllocations = {
  id: string;
  channelId: string;
  status: string;
  totalAmountRial: bigint;
  statementNote: string | null;
  createdAt: Date;
  completedAt: Date | null;
  allocations: { id: string; obligationId: string; deliverableId: string | null; amountRial: bigint }[];
};

function toSettlementDto(s: SettlementWithAllocations): Settlement {
  return {
    id: s.id,
    channelId: s.channelId,
    status: s.status as Settlement["status"],
    totalAmountRial: serializeRial(s.totalAmountRial),
    statementNote: s.statementNote,
    allocations: s.allocations.map((a) => ({
      id: a.id,
      obligationId: a.obligationId,
      deliverableId: a.deliverableId,
      amountRial: serializeRial(a.amountRial),
    })),
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  };
}
