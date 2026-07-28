import { z } from "zod";
export declare const ledgerAccountTypeSchema: z.ZodEnum<{
    CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
    CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
    CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
    CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
    PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
    PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
}>;
export type LedgerAccountTypeKey = z.infer<typeof ledgerAccountTypeSchema>;
export declare const ledgerEntryDirectionSchema: z.ZodEnum<{
    DEBIT: "DEBIT";
    CREDIT: "CREDIT";
}>;
export type LedgerEntryDirectionKey = z.infer<typeof ledgerEntryDirectionSchema>;
export declare const ledgerAccountBalanceSchema: z.ZodObject<{
    accountType: z.ZodEnum<{
        CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
        CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
        CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
        CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
        PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
        PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
    }>;
    balanceRial: z.ZodString;
}, z.core.$strip>;
export type LedgerAccountBalance = z.infer<typeof ledgerAccountBalanceSchema>;
export declare const ledgerTransactionTypeSchema: z.ZodEnum<{
    SUPPORT_GRANTED: "SUPPORT_GRANTED";
    SERVICE_ACCEPTED: "SERVICE_ACCEPTED";
    SETTLEMENT: "SETTLEMENT";
    ADJUSTMENT: "ADJUSTMENT";
    REVERSAL: "REVERSAL";
}>;
export type LedgerTransactionTypeKey = z.infer<typeof ledgerTransactionTypeSchema>;
export declare const ledgerEntrySchema: z.ZodObject<{
    id: z.ZodString;
    accountType: z.ZodEnum<{
        CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
        CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
        CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
        CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
        PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
        PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
    }>;
    channelId: z.ZodNullable<z.ZodString>;
    direction: z.ZodEnum<{
        DEBIT: "DEBIT";
        CREDIT: "CREDIT";
    }>;
    amountRial: z.ZodString;
}, z.core.$strip>;
export type LedgerEntryDto = z.infer<typeof ledgerEntrySchema>;
export declare const ledgerTransactionSchema: z.ZodObject<{
    id: z.ZodString;
    transactionType: z.ZodEnum<{
        SUPPORT_GRANTED: "SUPPORT_GRANTED";
        SERVICE_ACCEPTED: "SERVICE_ACCEPTED";
        SETTLEMENT: "SETTLEMENT";
        ADJUSTMENT: "ADJUSTMENT";
        REVERSAL: "REVERSAL";
    }>;
    sourceType: z.ZodString;
    sourceId: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    reason: z.ZodNullable<z.ZodString>;
    reversalOfTransactionId: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        accountType: z.ZodEnum<{
            CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
            CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
            CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
            CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
            PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
            PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
        }>;
        channelId: z.ZodNullable<z.ZodString>;
        direction: z.ZodEnum<{
            DEBIT: "DEBIT";
            CREDIT: "CREDIT";
        }>;
        amountRial: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>;
/** The plain-language balance sheet for one channel (spec 16.5 "understandable statement"). */
export declare const channelStatementSchema: z.ZodObject<{
    channelId: z.ZodString;
    balances: z.ZodArray<z.ZodObject<{
        accountType: z.ZodEnum<{
            CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
            CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
            CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
            CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
            PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
            PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
        }>;
        balanceRial: z.ZodString;
    }, z.core.$strip>>;
    outstandingObligationRial: z.ZodString;
    deliveredNotYetSettledRial: z.ZodString;
    settledRial: z.ZodString;
    transactions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        transactionType: z.ZodEnum<{
            SUPPORT_GRANTED: "SUPPORT_GRANTED";
            SERVICE_ACCEPTED: "SERVICE_ACCEPTED";
            SETTLEMENT: "SETTLEMENT";
            ADJUSTMENT: "ADJUSTMENT";
            REVERSAL: "REVERSAL";
        }>;
        sourceType: z.ZodString;
        sourceId: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        reason: z.ZodNullable<z.ZodString>;
        reversalOfTransactionId: z.ZodNullable<z.ZodString>;
        createdBy: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
        entries: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            accountType: z.ZodEnum<{
                CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
                CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
                CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
                CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
                PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
                PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
            }>;
            channelId: z.ZodNullable<z.ZodString>;
            direction: z.ZodEnum<{
                DEBIT: "DEBIT";
                CREDIT: "CREDIT";
            }>;
            amountRial: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ChannelStatement = z.infer<typeof channelStatementSchema>;
export declare const postAdjustmentSchema: z.ZodObject<{
    channelId: z.ZodString;
    accountType: z.ZodEnum<{
        CHANNEL_SUPPORT_VALUE: "CHANNEL_SUPPORT_VALUE";
        CHANNEL_SERVICE_OBLIGATION: "CHANNEL_SERVICE_OBLIGATION";
        CHANNEL_SERVICE_DELIVERED: "CHANNEL_SERVICE_DELIVERED";
        CHANNEL_SETTLEMENT: "CHANNEL_SETTLEMENT";
        PLATFORM_SUPPORT_POOL: "PLATFORM_SUPPORT_POOL";
        PLATFORM_SERVICE_POOL: "PLATFORM_SERVICE_POOL";
    }>;
    direction: z.ZodEnum<{
        DEBIT: "DEBIT";
        CREDIT: "CREDIT";
    }>;
    amountRial: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>;
export type PostAdjustment = z.infer<typeof postAdjustmentSchema>;
export declare const reverseTransactionSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export type ReverseTransaction = z.infer<typeof reverseTransactionSchema>;
export declare const settlementStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    APPROVED: "APPROVED";
    COMPLETED: "COMPLETED";
    PENDING_APPROVAL: "PENDING_APPROVAL";
    REVERSED: "REVERSED";
}>;
export type SettlementStatusKey = z.infer<typeof settlementStatusSchema>;
export declare const settlementAllocationInputSchema: z.ZodObject<{
    obligationId: z.ZodString;
    deliverableId: z.ZodOptional<z.ZodString>;
    amountRial: z.ZodString;
}, z.core.$strip>;
export type SettlementAllocationInput = z.infer<typeof settlementAllocationInputSchema>;
export declare const createSettlementSchema: z.ZodObject<{
    channelId: z.ZodString;
    statementNote: z.ZodOptional<z.ZodString>;
    allocations: z.ZodArray<z.ZodObject<{
        obligationId: z.ZodString;
        deliverableId: z.ZodOptional<z.ZodString>;
        amountRial: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateSettlement = z.infer<typeof createSettlementSchema>;
export declare const settlementAllocationSchema: z.ZodObject<{
    id: z.ZodString;
    obligationId: z.ZodString;
    deliverableId: z.ZodNullable<z.ZodString>;
    amountRial: z.ZodString;
}, z.core.$strip>;
export type SettlementAllocation = z.infer<typeof settlementAllocationSchema>;
export declare const settlementSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        APPROVED: "APPROVED";
        COMPLETED: "COMPLETED";
        PENDING_APPROVAL: "PENDING_APPROVAL";
        REVERSED: "REVERSED";
    }>;
    totalAmountRial: z.ZodString;
    statementNote: z.ZodNullable<z.ZodString>;
    allocations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        obligationId: z.ZodString;
        deliverableId: z.ZodNullable<z.ZodString>;
        amountRial: z.ZodString;
    }, z.core.$strip>>;
    createdAt: z.ZodISODateTime;
    completedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type Settlement = z.infer<typeof settlementSchema>;
export declare const financialApprovalTypeSchema: z.ZodEnum<{
    LEDGER_ADJUSTMENT: "LEDGER_ADJUSTMENT";
    MANUAL_SETTLEMENT: "MANUAL_SETTLEMENT";
}>;
export declare const financialApprovalStatusSchema: z.ZodEnum<{
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
    PENDING: "PENDING";
}>;
export declare const financialApprovalRequestSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        LEDGER_ADJUSTMENT: "LEDGER_ADJUSTMENT";
        MANUAL_SETTLEMENT: "MANUAL_SETTLEMENT";
    }>;
    channelId: z.ZodString;
    amountRial: z.ZodString;
    reason: z.ZodString;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        PENDING: "PENDING";
    }>;
    requestedById: z.ZodString;
    requestedAt: z.ZodISODateTime;
    decidedById: z.ZodNullable<z.ZodString>;
    decidedAt: z.ZodNullable<z.ZodISODateTime>;
    decisionNote: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type FinancialApprovalRequest = z.infer<typeof financialApprovalRequestSchema>;
export declare const decideFinancialApprovalSchema: z.ZodObject<{
    action: z.ZodEnum<{
        REJECT: "REJECT";
        APPROVE: "APPROVE";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DecideFinancialApproval = z.infer<typeof decideFinancialApprovalSchema>;
//# sourceMappingURL=ledger.d.ts.map