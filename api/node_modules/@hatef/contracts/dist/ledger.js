"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideFinancialApprovalSchema = exports.financialApprovalRequestSchema = exports.financialApprovalStatusSchema = exports.financialApprovalTypeSchema = exports.settlementSchema = exports.settlementAllocationSchema = exports.createSettlementSchema = exports.settlementAllocationInputSchema = exports.settlementStatusSchema = exports.reverseTransactionSchema = exports.postAdjustmentSchema = exports.channelStatementSchema = exports.ledgerTransactionSchema = exports.ledgerEntrySchema = exports.ledgerTransactionTypeSchema = exports.ledgerAccountBalanceSchema = exports.ledgerEntryDirectionSchema = exports.ledgerAccountTypeSchema = void 0;
const zod_1 = require("zod");
exports.ledgerAccountTypeSchema = zod_1.z.enum([
    "CHANNEL_SUPPORT_VALUE",
    "CHANNEL_SERVICE_OBLIGATION",
    "CHANNEL_SERVICE_DELIVERED",
    "CHANNEL_SETTLEMENT",
    "PLATFORM_SUPPORT_POOL",
    "PLATFORM_SERVICE_POOL",
]);
exports.ledgerEntryDirectionSchema = zod_1.z.enum(["DEBIT", "CREDIT"]);
exports.ledgerAccountBalanceSchema = zod_1.z.object({
    accountType: exports.ledgerAccountTypeSchema,
    balanceRial: zod_1.z.string(),
});
exports.ledgerTransactionTypeSchema = zod_1.z.enum(["SUPPORT_GRANTED", "SERVICE_ACCEPTED", "SETTLEMENT", "ADJUSTMENT", "REVERSAL"]);
exports.ledgerEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    accountType: exports.ledgerAccountTypeSchema,
    channelId: zod_1.z.string().nullable(),
    direction: exports.ledgerEntryDirectionSchema,
    amountRial: zod_1.z.string(),
});
exports.ledgerTransactionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    transactionType: exports.ledgerTransactionTypeSchema,
    sourceType: zod_1.z.string(),
    sourceId: zod_1.z.string().nullable(),
    description: zod_1.z.string().nullable(),
    reason: zod_1.z.string().nullable(),
    reversalOfTransactionId: zod_1.z.string().nullable(),
    createdBy: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    entries: zod_1.z.array(exports.ledgerEntrySchema),
});
/** The plain-language balance sheet for one channel (spec 16.5 "understandable statement"). */
exports.channelStatementSchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    balances: zod_1.z.array(exports.ledgerAccountBalanceSchema),
    outstandingObligationRial: zod_1.z.string(),
    deliveredNotYetSettledRial: zod_1.z.string(),
    settledRial: zod_1.z.string(),
    transactions: zod_1.z.array(exports.ledgerTransactionSchema),
});
exports.postAdjustmentSchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    accountType: exports.ledgerAccountTypeSchema,
    direction: exports.ledgerEntryDirectionSchema,
    amountRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    reason: zod_1.z.string().min(1),
});
exports.reverseTransactionSchema = zod_1.z.object({ reason: zod_1.z.string().min(1) });
// ---------------------------------------------------------------------------
// Settlement (spec 16.5)
// ---------------------------------------------------------------------------
exports.settlementStatusSchema = zod_1.z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "COMPLETED", "REVERSED"]);
exports.settlementAllocationInputSchema = zod_1.z.object({
    obligationId: zod_1.z.string(),
    deliverableId: zod_1.z.string().optional(),
    amountRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
});
exports.createSettlementSchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    statementNote: zod_1.z.string().optional(),
    allocations: zod_1.z.array(exports.settlementAllocationInputSchema).min(1),
});
exports.settlementAllocationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    obligationId: zod_1.z.string(),
    deliverableId: zod_1.z.string().nullable(),
    amountRial: zod_1.z.string(),
});
exports.settlementSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    status: exports.settlementStatusSchema,
    totalAmountRial: zod_1.z.string(),
    statementNote: zod_1.z.string().nullable(),
    allocations: zod_1.z.array(exports.settlementAllocationSchema),
    createdAt: zod_1.z.iso.datetime(),
    completedAt: zod_1.z.iso.datetime().nullable(),
});
// ---------------------------------------------------------------------------
// Dual-approval gate for high-value adjustments and manual settlements
// ---------------------------------------------------------------------------
exports.financialApprovalTypeSchema = zod_1.z.enum(["LEDGER_ADJUSTMENT", "MANUAL_SETTLEMENT"]);
exports.financialApprovalStatusSchema = zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]);
exports.financialApprovalRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: exports.financialApprovalTypeSchema,
    channelId: zod_1.z.string(),
    amountRial: zod_1.z.string(),
    reason: zod_1.z.string(),
    status: exports.financialApprovalStatusSchema,
    requestedById: zod_1.z.string(),
    requestedAt: zod_1.z.iso.datetime(),
    decidedById: zod_1.z.string().nullable(),
    decidedAt: zod_1.z.iso.datetime().nullable(),
    decisionNote: zod_1.z.string().nullable(),
});
exports.decideFinancialApprovalSchema = zod_1.z.object({
    action: zod_1.z.enum(["APPROVE", "REJECT"]),
    note: zod_1.z.string().optional(),
});
