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
exports.SettlementsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const ledger_service_1 = require("../ledger/ledger.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SettlementsService = class SettlementsService {
    prisma;
    ledger;
    notifications;
    auditLog;
    constructor(prisma, ledger, notifications, auditLog) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.notifications = notifications;
        this.auditLog = auditLog;
    }
    /** Available-to-settle value for one obligation: total accepted (from DeliverableReview rows) minus already settled. */
    async getAvailableTargets(channelId, obligationIds) {
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
    async create(input, actor) {
        const requestedObligationIds = input.allocations.map((a) => a.obligationId);
        const targets = await this.getAvailableTargets(input.channelId, requestedObligationIds);
        const totalRequested = input.allocations.reduce((sum, a) => sum + BigInt(a.amountRial), 0n);
        // Validate every requested allocation individually against its own obligation's available value,
        // and the aggregate against the sum of available value (spec 27: "settlement cannot exceed accepted service").
        for (const allocation of input.allocations) {
            const target = targets.find((t) => t.obligationId === allocation.obligationId);
            if (!target || BigInt(allocation.amountRial) > target.availableRial) {
                throw new common_1.BadRequestException("مبلغ تخصیص‌یافته از ارزش پذیرفته‌شده و تسویه‌نشده تعهد بیشتر است.");
            }
        }
        try {
            (0, domain_1.allocateSettlement)(totalRequested, targets);
        }
        catch (error) {
            if (error instanceof domain_1.SettlementExceedsAcceptedValueError) {
                throw new common_1.BadRequestException("مجموع تسویه از مجموع ارزش پذیرفته‌شده بیشتر است.");
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
    async submitForApproval(settlementId, actor) {
        const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId } });
        if (settlement.status !== "DRAFT") {
            throw new common_1.BadRequestException("فقط تسویه‌های پیش‌نویس قابل ارسال برای تأیید هستند.");
        }
        await this.prisma.$transaction([
            this.prisma.settlement.update({ where: { id: settlementId }, data: { status: "PENDING_APPROVAL" } }),
            this.prisma.financialApprovalRequest.create({
                data: {
                    type: "MANUAL_SETTLEMENT",
                    channelId: settlement.channelId,
                    amountRial: settlement.totalAmountRial,
                    reason: settlement.statementNote ?? "تسویه دستی",
                    payload: { settlementId },
                    requestedById: actor.userId,
                },
            }),
        ]);
        return this.getOne(settlementId);
    }
    async decideApproval(settlementId, input, actor) {
        const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId }, include: { allocations: true } });
        if (settlement.status !== "PENDING_APPROVAL") {
            throw new common_1.BadRequestException("این تسویه در انتظار تأیید نیست.");
        }
        const approval = await this.prisma.financialApprovalRequest.findFirst({
            where: { type: "MANUAL_SETTLEMENT", status: "PENDING", payload: { path: ["settlementId"], equals: settlementId } },
        });
        if (!approval)
            throw new common_1.NotFoundException("درخواست تأیید یافت نشد.");
        if (approval.requestedById === actor.userId) {
            throw new common_1.ForbiddenException("تأییدکننده دوم نمی‌تواند همان درخواست‌دهنده باشد.");
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
            ...settlement.allocations.map((a) => this.prisma.serviceObligation.update({
                where: { id: a.obligationId },
                data: { settledValueRial: { increment: a.amountRial } },
            })),
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
    async getOne(settlementId) {
        const settlement = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settlementId }, include: { allocations: true } });
        return toSettlementDto(settlement);
    }
    async listForChannel(channelId) {
        const rows = await this.prisma.settlement.findMany({ where: { channelId }, include: { allocations: true }, orderBy: { createdAt: "desc" } });
        return rows.map(toSettlementDto);
    }
};
exports.SettlementsService = SettlementsService;
exports.SettlementsService = SettlementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        notifications_service_1.NotificationsService,
        audit_log_service_1.AuditLogService])
], SettlementsService);
function toSettlementDto(s) {
    return {
        id: s.id,
        channelId: s.channelId,
        status: s.status,
        totalAmountRial: (0, domain_1.serializeRial)(s.totalAmountRial),
        statementNote: s.statementNote,
        allocations: s.allocations.map((a) => ({
            id: a.id,
            obligationId: a.obligationId,
            deliverableId: a.deliverableId,
            amountRial: (0, domain_1.serializeRial)(a.amountRial),
        })),
        createdAt: s.createdAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
    };
}
