import type { ChannelStatement, LedgerAccountBalance, LedgerAccountTypeKey, LedgerEntryDirectionKey, LedgerTransaction, LedgerTransactionTypeKey } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
/** Above this amount a manual adjustment cannot post immediately — it must clear a second, distinct approver first (spec 16.1). */
export declare const HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL = 1000000000n;
export interface PostLedgerTransactionEntry {
    channelId: string | null;
    accountType: LedgerAccountTypeKey;
    direction: LedgerEntryDirectionKey;
    amountRial: bigint;
}
export interface PostLedgerTransactionInput {
    transactionType: LedgerTransactionTypeKey;
    idempotencyKey: string;
    sourceType: string;
    sourceId?: string;
    description?: string;
    reason?: string;
    reversalOfTransactionId?: string;
    createdBy?: string;
    entries: PostLedgerTransactionEntry[];
}
export declare class LedgerService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    /**
     * Postgres treats every NULL as distinct for a unique constraint, so
     * upsert-by-compound-unique can't be used for the two global
     * (channelId: null) platform accounts — same check-then-create discipline
     * the Phase 1 seed already uses for unscoped RoleAssignment rows.
     */
    private resolveAccount;
    /**
     * Posts one balanced transaction. Immutable once inserted — nothing in
     * this service ever updates a LedgerTransaction/LedgerEntry row after
     * creation, only creates new ones (spec 16.1). `idempotencyKey` carries a
     * real unique DB constraint, so a retried request — even one that races
     * past this in-process check — still cannot double-post; the unique
     * violation is caught below and the already-posted transaction is
     * returned instead.
     */
    post(input: PostLedgerTransactionInput): Promise<LedgerTransaction>;
    /** Corrections use reversal (spec 16.1) — never an edit of the original. */
    reverse(transactionId: string, reason: string, actorId: string): Promise<LedgerTransaction>;
    /** `sum(debit) - sum(credit)` reconstructed live from LedgerEntry — no cached/editable balance column exists (spec 16.1). */
    getAccountBalances(channelId: string): Promise<LedgerAccountBalance[]>;
    /** The "understandable statement" both dashboards render (spec 16.5) instead of raw ledger jargon. */
    getChannelStatement(channelId: string): Promise<ChannelStatement>;
}
//# sourceMappingURL=ledger.service.d.ts.map