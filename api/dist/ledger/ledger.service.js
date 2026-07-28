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
exports.LedgerService = exports.HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
/** Above this amount a manual adjustment cannot post immediately — it must clear a second, distinct approver first (spec 16.1). */
exports.HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL = 1000000000n;
const ALL_CHANNEL_ACCOUNT_TYPES = [
    "CHANNEL_SUPPORT_VALUE",
    "CHANNEL_SERVICE_OBLIGATION",
    "CHANNEL_SERVICE_DELIVERED",
    "CHANNEL_SETTLEMENT",
];
let LedgerService = class LedgerService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    /**
     * Postgres treats every NULL as distinct for a unique constraint, so
     * upsert-by-compound-unique can't be used for the two global
     * (channelId: null) platform accounts — same check-then-create discipline
     * the Phase 1 seed already uses for unscoped RoleAssignment rows.
     */
    async resolveAccount(channelId, accountType) {
        if (channelId === null) {
            const existing = await this.prisma.ledgerAccount.findFirst({ where: { channelId: null, accountType } });
            if (existing)
                return existing;
            return this.prisma.ledgerAccount.create({ data: { channelId: null, accountType } });
        }
        return this.prisma.ledgerAccount.upsert({
            where: { channelId_accountType: { channelId, accountType } },
            update: {},
            create: { channelId, accountType },
        });
    }
    /**
     * Posts one balanced transaction. Immutable once inserted — nothing in
     * this service ever updates a LedgerTransaction/LedgerEntry row after
     * creation, only creates new ones (spec 16.1). `idempotencyKey` carries a
     * real unique DB constraint, so a retried request — even one that races
     * past this in-process check — still cannot double-post; the unique
     * violation is caught below and the already-posted transaction is
     * returned instead.
     */
    async post(input) {
        const lines = input.entries.map((e) => ({
            accountKey: `${e.channelId ?? "platform"}:${e.accountType}`,
            direction: e.direction,
            amountRial: e.amountRial,
        }));
        if (!(0, domain_1.isLedgerTransactionBalanced)(lines)) {
            throw new common_1.BadRequestException("تراکنش دفتر کل باید موازنه (بدهکار = بستانکار) باشد.");
        }
        const existing = await this.prisma.ledgerTransaction.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            include: { entries: { include: { account: true } } },
        });
        if (existing) {
            return toTransactionDto(existing);
        }
        const accountIds = await Promise.all(input.entries.map((e) => this.resolveAccount(e.channelId, e.accountType)));
        try {
            const created = await this.prisma.ledgerTransaction.create({
                data: {
                    transactionType: input.transactionType,
                    idempotencyKey: input.idempotencyKey,
                    sourceType: input.sourceType,
                    sourceId: input.sourceId,
                    description: input.description,
                    reason: input.reason,
                    reversalOfTransactionId: input.reversalOfTransactionId,
                    createdBy: input.createdBy,
                    entries: {
                        create: input.entries.map((e, i) => ({
                            accountId: accountIds[i].id,
                            direction: e.direction,
                            amountRial: e.amountRial,
                        })),
                    },
                },
                include: { entries: { include: { account: true } } },
            });
            await this.auditLog.record({
                actorId: input.createdBy,
                actorType: "user",
                action: "ledger.posted",
                entityType: "ledger_transaction",
                entityId: created.id,
                metadata: { transactionType: input.transactionType, sourceType: input.sourceType, sourceId: input.sourceId },
            });
            return toTransactionDto(created);
        }
        catch (error) {
            // Unique-constraint race on idempotencyKey: another concurrent request won, return its result.
            const again = await this.prisma.ledgerTransaction.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
                include: { entries: { include: { account: true } } },
            });
            if (again)
                return toTransactionDto(again);
            throw error;
        }
    }
    /** Corrections use reversal (spec 16.1) — never an edit of the original. */
    async reverse(transactionId, reason, actorId) {
        const original = await this.prisma.ledgerTransaction.findUnique({
            where: { id: transactionId },
            include: { entries: { include: { account: true } } },
        });
        if (!original)
            throw new common_1.NotFoundException("تراکنش یافت نشد.");
        const alreadyReversed = await this.prisma.ledgerTransaction.findFirst({ where: { reversalOfTransactionId: transactionId } });
        if (alreadyReversed) {
            throw new common_1.BadRequestException("این تراکنش قبلاً برگشت خورده است.");
        }
        const reversedLines = (0, domain_1.buildReversalEntries)(original.entries.map((e) => ({
            accountKey: e.accountId,
            direction: e.direction,
            amountRial: e.amountRial,
        })));
        return this.post({
            transactionType: "REVERSAL",
            idempotencyKey: `reversal:${transactionId}`,
            sourceType: original.sourceType,
            sourceId: original.sourceId ?? undefined,
            description: `برگشت تراکنش ${transactionId}`,
            reason,
            reversalOfTransactionId: transactionId,
            createdBy: actorId,
            entries: original.entries.map((e, i) => ({
                channelId: e.account.channelId,
                accountType: e.account.accountType,
                direction: reversedLines[i].direction,
                amountRial: e.amountRial,
            })),
        });
    }
    /** `sum(debit) - sum(credit)` reconstructed live from LedgerEntry — no cached/editable balance column exists (spec 16.1). */
    async getAccountBalances(channelId) {
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: { channelId, accountType: { in: ALL_CHANNEL_ACCOUNT_TYPES } },
            include: { entries: true },
        });
        return ALL_CHANNEL_ACCOUNT_TYPES.map((accountType) => {
            const account = accounts.find((a) => a.accountType === accountType);
            const balance = (account?.entries ?? []).reduce((sum, e) => (e.direction === "DEBIT" ? sum + e.amountRial : sum - e.amountRial), 0n);
            return { accountType, balanceRial: (0, domain_1.serializeRial)(balance) };
        });
    }
    /** The "understandable statement" both dashboards render (spec 16.5) instead of raw ledger jargon. */
    async getChannelStatement(channelId) {
        const balances = await this.getAccountBalances(channelId);
        const find = (t) => BigInt(balances.find((b) => b.accountType === t)?.balanceRial ?? "0");
        const accounts = await this.prisma.ledgerAccount.findMany({ where: { channelId } });
        const accountIds = accounts.map((a) => a.id);
        const transactions = accountIds.length
            ? await this.prisma.ledgerTransaction.findMany({
                where: { entries: { some: { accountId: { in: accountIds } } } },
                include: { entries: { include: { account: true } } },
                orderBy: { createdAt: "desc" },
                take: 100,
            })
            : [];
        return {
            channelId,
            balances,
            outstandingObligationRial: (0, domain_1.serializeRial)(find("CHANNEL_SERVICE_OBLIGATION")),
            deliveredNotYetSettledRial: (0, domain_1.serializeRial)(find("CHANNEL_SERVICE_DELIVERED")),
            settledRial: (0, domain_1.serializeRial)(find("CHANNEL_SETTLEMENT")),
            transactions: transactions.map(toTransactionDto),
        };
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], LedgerService);
function toTransactionDto(tx) {
    return {
        id: tx.id,
        transactionType: tx.transactionType,
        sourceType: tx.sourceType,
        sourceId: tx.sourceId,
        description: tx.description,
        reason: tx.reason,
        reversalOfTransactionId: tx.reversalOfTransactionId,
        createdBy: tx.createdBy,
        createdAt: tx.createdAt.toISOString(),
        entries: tx.entries.map((e) => ({
            id: e.id,
            accountType: e.account.accountType,
            channelId: e.account.channelId,
            direction: e.direction,
            amountRial: (0, domain_1.serializeRial)(e.amountRial),
        })),
    };
}
