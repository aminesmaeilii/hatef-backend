import { z } from "zod";

export const ledgerAccountTypeSchema = z.enum([
  "CHANNEL_SUPPORT_VALUE",
  "CHANNEL_SERVICE_OBLIGATION",
  "CHANNEL_SERVICE_DELIVERED",
  "CHANNEL_SETTLEMENT",
  "PLATFORM_SUPPORT_POOL",
  "PLATFORM_SERVICE_POOL",
]);
export type LedgerAccountTypeKey = z.infer<typeof ledgerAccountTypeSchema>;

export const ledgerEntryDirectionSchema = z.enum(["DEBIT", "CREDIT"]);
export type LedgerEntryDirectionKey = z.infer<typeof ledgerEntryDirectionSchema>;

export const ledgerAccountBalanceSchema = z.object({
  accountType: ledgerAccountTypeSchema,
  balanceRial: z.string(),
});
export type LedgerAccountBalance = z.infer<typeof ledgerAccountBalanceSchema>;

export const ledgerTransactionTypeSchema = z.enum(["SUPPORT_GRANTED", "SERVICE_ACCEPTED", "SETTLEMENT", "ADJUSTMENT", "REVERSAL"]);
export type LedgerTransactionTypeKey = z.infer<typeof ledgerTransactionTypeSchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  accountType: ledgerAccountTypeSchema,
  channelId: z.string().nullable(),
  direction: ledgerEntryDirectionSchema,
  amountRial: z.string(),
});
export type LedgerEntryDto = z.infer<typeof ledgerEntrySchema>;

export const ledgerTransactionSchema = z.object({
  id: z.string(),
  transactionType: ledgerTransactionTypeSchema,
  sourceType: z.string(),
  sourceId: z.string().nullable(),
  description: z.string().nullable(),
  reason: z.string().nullable(),
  reversalOfTransactionId: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.iso.datetime(),
  entries: z.array(ledgerEntrySchema),
});
export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>;

/** The plain-language balance sheet for one channel (spec 16.5 "understandable statement"). */
export const channelStatementSchema = z.object({
  channelId: z.string(),
  balances: z.array(ledgerAccountBalanceSchema),
  outstandingObligationRial: z.string(),
  deliveredNotYetSettledRial: z.string(),
  settledRial: z.string(),
  transactions: z.array(ledgerTransactionSchema),
});
export type ChannelStatement = z.infer<typeof channelStatementSchema>;

export const postAdjustmentSchema = z.object({
  channelId: z.string(),
  accountType: ledgerAccountTypeSchema,
  direction: ledgerEntryDirectionSchema,
  amountRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  reason: z.string().min(1),
});
export type PostAdjustment = z.infer<typeof postAdjustmentSchema>;

export const reverseTransactionSchema = z.object({ reason: z.string().min(1) });
export type ReverseTransaction = z.infer<typeof reverseTransactionSchema>;

// ---------------------------------------------------------------------------
// Settlement (spec 16.5)
// ---------------------------------------------------------------------------

export const settlementStatusSchema = z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "COMPLETED", "REVERSED"]);
export type SettlementStatusKey = z.infer<typeof settlementStatusSchema>;

export const settlementAllocationInputSchema = z.object({
  obligationId: z.string(),
  deliverableId: z.string().optional(),
  amountRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
});
export type SettlementAllocationInput = z.infer<typeof settlementAllocationInputSchema>;

export const createSettlementSchema = z.object({
  channelId: z.string(),
  statementNote: z.string().optional(),
  allocations: z.array(settlementAllocationInputSchema).min(1),
});
export type CreateSettlement = z.infer<typeof createSettlementSchema>;

export const settlementAllocationSchema = z.object({
  id: z.string(),
  obligationId: z.string(),
  deliverableId: z.string().nullable(),
  amountRial: z.string(),
});
export type SettlementAllocation = z.infer<typeof settlementAllocationSchema>;

export const settlementSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  status: settlementStatusSchema,
  totalAmountRial: z.string(),
  statementNote: z.string().nullable(),
  allocations: z.array(settlementAllocationSchema),
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});
export type Settlement = z.infer<typeof settlementSchema>;

// ---------------------------------------------------------------------------
// Dual-approval gate for high-value adjustments and manual settlements
// ---------------------------------------------------------------------------

export const financialApprovalTypeSchema = z.enum(["LEDGER_ADJUSTMENT", "MANUAL_SETTLEMENT"]);
export const financialApprovalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const financialApprovalRequestSchema = z.object({
  id: z.string(),
  type: financialApprovalTypeSchema,
  channelId: z.string(),
  amountRial: z.string(),
  reason: z.string(),
  status: financialApprovalStatusSchema,
  requestedById: z.string(),
  requestedAt: z.iso.datetime(),
  decidedById: z.string().nullable(),
  decidedAt: z.iso.datetime().nullable(),
  decisionNote: z.string().nullable(),
});
export type FinancialApprovalRequest = z.infer<typeof financialApprovalRequestSchema>;

export const decideFinancialApprovalSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});
export type DecideFinancialApproval = z.infer<typeof decideFinancialApprovalSchema>;
