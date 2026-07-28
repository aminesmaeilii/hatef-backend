import { z } from "zod";
export declare const promotionPricingModelSchema: z.ZodEnum<{
    CALCULATED: "CALCULATED";
    QUOTE: "QUOTE";
}>;
export type PromotionPricingModelKey = z.infer<typeof promotionPricingModelSchema>;
export declare const audienceTypeSchema: z.ZodEnum<{
    NATIONWIDE: "NATIONWIDE";
    PROVINCIAL: "PROVINCIAL";
}>;
export type AudienceTypeKey = z.infer<typeof audienceTypeSchema>;
export declare const promotionTypeVersionStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const priceRuleSchema: z.ZodObject<{
    id: z.ZodString;
    audienceType: z.ZodNullable<z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>>;
    ratePerViewRial: z.ZodString;
    minAmountRial: z.ZodNullable<z.ZodString>;
    capAmountRial: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type PriceRule = z.infer<typeof priceRuleSchema>;
export declare const createPriceRuleSchema: z.ZodObject<{
    audienceType: z.ZodOptional<z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>>;
    ratePerViewRial: z.ZodString;
    minAmountRial: z.ZodOptional<z.ZodString>;
    capAmountRial: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePriceRule = z.infer<typeof createPriceRuleSchema>;
export declare const promotionTypeVersionSchema: z.ZodObject<{
    id: z.ZodString;
    promotionTypeId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
    effectiveFrom: z.ZodNullable<z.ZodISODateTime>;
    publishedAt: z.ZodNullable<z.ZodISODateTime>;
    priceRules: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        audienceType: z.ZodNullable<z.ZodEnum<{
            NATIONWIDE: "NATIONWIDE";
            PROVINCIAL: "PROVINCIAL";
        }>>;
        ratePerViewRial: z.ZodString;
        minAmountRial: z.ZodNullable<z.ZodString>;
        capAmountRial: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PromotionTypeVersionDefinition = z.infer<typeof promotionTypeVersionSchema>;
export declare const promotionTypeSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    pricingModel: z.ZodEnum<{
        CALCULATED: "CALCULATED";
        QUOTE: "QUOTE";
    }>;
    draftVersionId: z.ZodNullable<z.ZodString>;
    publishedVersionId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type PromotionType = z.infer<typeof promotionTypeSchema>;
export declare const createPromotionTypeSchema: z.ZodObject<{
    key: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    pricingModel: z.ZodEnum<{
        CALCULATED: "CALCULATED";
        QUOTE: "QUOTE";
    }>;
}, z.core.$strip>;
export type CreatePromotionType = z.infer<typeof createPromotionTypeSchema>;
export declare const supportRequestStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SCHEDULED: "SCHEDULED";
    SUBMITTED: "SUBMITTED";
    DISPUTED: "DISPUTED";
    CANCELLED: "CANCELLED";
    VALIDATION: "VALIDATION";
    NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
    PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
    INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
    PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
    RUNNING: "RUNNING";
    RESULT_VERIFICATION: "RESULT_VERIFICATION";
    ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
    COMPLETED: "COMPLETED";
    CANCEL_REQUESTED: "CANCEL_REQUESTED";
}>;
export type SupportRequestStatusKey = z.infer<typeof supportRequestStatusSchema>;
export declare const createSupportRequestSchema: z.ZodObject<{
    promotionTypeId: z.ZodString;
    audienceType: z.ZodOptional<z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>>;
    province: z.ZodOptional<z.ZodString>;
    requestedUniqueViews: z.ZodOptional<z.ZodNumber>;
    details: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type CreateSupportRequest = z.infer<typeof createSupportRequestSchema>;
export declare const updateSupportRequestSchema: z.ZodObject<{
    audienceType: z.ZodOptional<z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>>;
    province: z.ZodOptional<z.ZodString>;
    requestedUniqueViews: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type UpdateSupportRequest = z.infer<typeof updateSupportRequestSchema>;
export declare const supportRequestSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    promotionTypeId: z.ZodString;
    promotionTypeKey: z.ZodString;
    promotionTypeName: z.ZodString;
    pricingModel: z.ZodEnum<{
        CALCULATED: "CALCULATED";
        QUOTE: "QUOTE";
    }>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        SUBMITTED: "SUBMITTED";
        DISPUTED: "DISPUTED";
        CANCELLED: "CANCELLED";
        VALIDATION: "VALIDATION";
        NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
        PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
        INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
        PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
        RUNNING: "RUNNING";
        RESULT_VERIFICATION: "RESULT_VERIFICATION";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETED: "COMPLETED";
        CANCEL_REQUESTED: "CANCEL_REQUESTED";
    }>;
    audienceType: z.ZodNullable<z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>>;
    province: z.ZodNullable<z.ZodString>;
    requestedUniqueViews: z.ZodNullable<z.ZodNumber>;
    details: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    currentRevisionNumber: z.ZodNumber;
    submittedAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type SupportRequest = z.infer<typeof supportRequestSchema>;
export declare const supportRequestRevisionSchema: z.ZodObject<{
    id: z.ZodString;
    revisionNumber: z.ZodNumber;
    snapshot: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    submittedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type SupportRequestRevision = z.infer<typeof supportRequestRevisionSchema>;
export declare const supportRequestStatusEventSchema: z.ZodObject<{
    id: z.ZodString;
    fromStatus: z.ZodNullable<z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        SUBMITTED: "SUBMITTED";
        DISPUTED: "DISPUTED";
        CANCELLED: "CANCELLED";
        VALIDATION: "VALIDATION";
        NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
        PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
        INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
        PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
        RUNNING: "RUNNING";
        RESULT_VERIFICATION: "RESULT_VERIFICATION";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETED: "COMPLETED";
        CANCEL_REQUESTED: "CANCEL_REQUESTED";
    }>>;
    toStatus: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        SUBMITTED: "SUBMITTED";
        DISPUTED: "DISPUTED";
        CANCELLED: "CANCELLED";
        VALIDATION: "VALIDATION";
        NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
        PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
        INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
        PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
        RUNNING: "RUNNING";
        RESULT_VERIFICATION: "RESULT_VERIFICATION";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETED: "COMPLETED";
        CANCEL_REQUESTED: "CANCEL_REQUESTED";
    }>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type SupportRequestStatusEvent = z.infer<typeof supportRequestStatusEventSchema>;
export declare const requestChangesSchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
export type RequestChanges = z.infer<typeof requestChangesSchema>;
export declare const priceLineItemSchema: z.ZodObject<{
    label: z.ZodString;
    amountRial: z.ZodString;
}, z.core.$strip>;
export declare const priceCalculationSchema: z.ZodObject<{
    id: z.ZodString;
    promotionTypeVersionId: z.ZodString;
    requestedUniqueViews: z.ZodNumber;
    audienceType: z.ZodEnum<{
        NATIONWIDE: "NATIONWIDE";
        PROVINCIAL: "PROVINCIAL";
    }>;
    ratePerViewRial: z.ZodString;
    baseAmountRial: z.ZodString;
    discountRial: z.ZodString;
    multiplierPercent: z.ZodNumber;
    estimatedAmountRial: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        amountRial: z.ZodString;
    }, z.core.$strip>>;
    overrideAmountRial: z.ZodNullable<z.ZodString>;
    overrideReason: z.ZodNullable<z.ZodString>;
    requiresSecondApproval: z.ZodBoolean;
    approvedAmountRial: z.ZodNullable<z.ZodString>;
    approvedBy: z.ZodNullable<z.ZodString>;
    secondApprovedBy: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type PriceCalculation = z.infer<typeof priceCalculationSchema>;
export declare const calculatePriceSchema: z.ZodObject<{
    discountRial: z.ZodOptional<z.ZodString>;
    multiplierPercent: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CalculatePrice = z.infer<typeof calculatePriceSchema>;
export declare const overridePriceSchema: z.ZodObject<{
    overrideAmountRial: z.ZodString;
    overrideReason: z.ZodString;
}, z.core.$strip>;
export type OverridePrice = z.infer<typeof overridePriceSchema>;
export declare const promotionQuoteStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    NEGOTIATING: "NEGOTIATING";
    ACCEPTED: "ACCEPTED";
    REJECTED: "REJECTED";
    SENT: "SENT";
    EXPIRED: "EXPIRED";
}>;
export declare const promotionQuoteVersionStatusSchema: z.ZodEnum<{
    PROPOSED: "PROPOSED";
    ACCEPTED: "ACCEPTED";
    REJECTED: "REJECTED";
    EXPIRED: "EXPIRED";
    NEGOTIATION_REQUESTED: "NEGOTIATION_REQUESTED";
    SUPERSEDED: "SUPERSEDED";
}>;
export declare const promotionQuoteVersionSchema: z.ZodObject<{
    id: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        ACCEPTED: "ACCEPTED";
        REJECTED: "REJECTED";
        EXPIRED: "EXPIRED";
        NEGOTIATION_REQUESTED: "NEGOTIATION_REQUESTED";
        SUPERSEDED: "SUPERSEDED";
    }>;
    estimatedChannelMin: z.ZodNullable<z.ZodNumber>;
    estimatedChannelMax: z.ZodNullable<z.ZodNumber>;
    estimatedViewMin: z.ZodNullable<z.ZodNumber>;
    estimatedViewMax: z.ZodNullable<z.ZodNumber>;
    method: z.ZodString;
    scheduleNote: z.ZodNullable<z.ZodString>;
    amountRial: z.ZodString;
    assumptions: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodISODateTime>;
    negotiationNote: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type PromotionQuoteVersion = z.infer<typeof promotionQuoteVersionSchema>;
export declare const promotionQuoteSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        REJECTED: "REJECTED";
        SENT: "SENT";
        EXPIRED: "EXPIRED";
    }>;
    versions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        versionNumber: z.ZodNumber;
        status: z.ZodEnum<{
            PROPOSED: "PROPOSED";
            ACCEPTED: "ACCEPTED";
            REJECTED: "REJECTED";
            EXPIRED: "EXPIRED";
            NEGOTIATION_REQUESTED: "NEGOTIATION_REQUESTED";
            SUPERSEDED: "SUPERSEDED";
        }>;
        estimatedChannelMin: z.ZodNullable<z.ZodNumber>;
        estimatedChannelMax: z.ZodNullable<z.ZodNumber>;
        estimatedViewMin: z.ZodNullable<z.ZodNumber>;
        estimatedViewMax: z.ZodNullable<z.ZodNumber>;
        method: z.ZodString;
        scheduleNote: z.ZodNullable<z.ZodString>;
        amountRial: z.ZodString;
        assumptions: z.ZodNullable<z.ZodString>;
        expiresAt: z.ZodNullable<z.ZodISODateTime>;
        negotiationNote: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PromotionQuote = z.infer<typeof promotionQuoteSchema>;
export declare const createQuoteVersionSchema: z.ZodObject<{
    estimatedChannelMin: z.ZodOptional<z.ZodNumber>;
    estimatedChannelMax: z.ZodOptional<z.ZodNumber>;
    estimatedViewMin: z.ZodOptional<z.ZodNumber>;
    estimatedViewMax: z.ZodOptional<z.ZodNumber>;
    method: z.ZodString;
    scheduleNote: z.ZodOptional<z.ZodString>;
    amountRial: z.ZodString;
    assumptions: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type CreateQuoteVersion = z.infer<typeof createQuoteVersionSchema>;
export declare const respondToQuoteSchema: z.ZodObject<{
    action: z.ZodEnum<{
        ACCEPT: "ACCEPT";
        REJECT: "REJECT";
        NEGOTIATE: "NEGOTIATE";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RespondToQuote = z.infer<typeof respondToQuoteSchema>;
export declare const promotionOrderSchema: z.ZodObject<{
    id: z.ZodString;
    supportRequestId: z.ZodString;
    channelId: z.ZodString;
    finalAmountRial: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type PromotionOrder = z.infer<typeof promotionOrderSchema>;
export declare const promotionScheduleChecklistItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    done: z.ZodBoolean;
}, z.core.$strip>;
export type PromotionScheduleChecklistItem = z.infer<typeof promotionScheduleChecklistItemSchema>;
export declare const promotionScheduleSchema: z.ZodObject<{
    id: z.ZodString;
    operatorId: z.ZodString;
    operatorName: z.ZodString;
    capacityResourceId: z.ZodNullable<z.ZodString>;
    scheduledStartAt: z.ZodISODateTime;
    scheduledEndAt: z.ZodNullable<z.ZodISODateTime>;
    checklist: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        done: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PromotionSchedule = z.infer<typeof promotionScheduleSchema>;
export declare const scheduleSupportRequestSchema: z.ZodObject<{
    operatorId: z.ZodString;
    capacityResourceId: z.ZodOptional<z.ZodString>;
    scheduledStartAt: z.ZodISODateTime;
    scheduledEndAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type ScheduleSupportRequest = z.infer<typeof scheduleSupportRequestSchema>;
export declare const rescheduleSupportRequestSchema: z.ZodObject<{
    scheduledStartAt: z.ZodISODateTime;
    scheduledEndAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type RescheduleSupportRequest = z.infer<typeof rescheduleSupportRequestSchema>;
export declare const promotionExecutionResultSchema: z.ZodObject<{
    id: z.ZodString;
    actualUniqueViews: z.ZodNullable<z.ZodNumber>;
    actualChannelsCount: z.ZodNullable<z.ZodNumber>;
    realizedValueRial: z.ZodNullable<z.ZodString>;
    verifiedAt: z.ZodNullable<z.ZodISODateTime>;
    evidenceFileIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type PromotionExecutionResult = z.infer<typeof promotionExecutionResultSchema>;
export declare const recordExecutionResultSchema: z.ZodObject<{
    actualUniqueViews: z.ZodOptional<z.ZodNumber>;
    actualChannelsCount: z.ZodOptional<z.ZodNumber>;
    evidenceFileIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RecordExecutionResult = z.infer<typeof recordExecutionResultSchema>;
export declare const verifyResultSchema: z.ZodObject<{
    outcome: z.ZodEnum<{
        DISPUTE: "DISPUTE";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETE: "COMPLETE";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type VerifyResult = z.infer<typeof verifyResultSchema>;
export declare const resolveDisputeSchema: z.ZodObject<{
    outcome: z.ZodEnum<{
        COMPLETE: "COMPLETE";
        CANCEL: "CANCEL";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ResolveDispute = z.infer<typeof resolveDisputeSchema>;
export declare const cancelRequestSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export type CancelRequest = z.infer<typeof cancelRequestSchema>;
/** Queue/Kanban list item — the operational, admin-facing view of a SupportRequest. */
export declare const supportRequestQueueItemSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    channelTitle: z.ZodString;
    promotionTypeKey: z.ZodString;
    promotionTypeName: z.ZodString;
    pricingModel: z.ZodEnum<{
        CALCULATED: "CALCULATED";
        QUOTE: "QUOTE";
    }>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        SUBMITTED: "SUBMITTED";
        DISPUTED: "DISPUTED";
        CANCELLED: "CANCELLED";
        VALIDATION: "VALIDATION";
        NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
        PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
        INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
        PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
        RUNNING: "RUNNING";
        RESULT_VERIFICATION: "RESULT_VERIFICATION";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETED: "COMPLETED";
        CANCEL_REQUESTED: "CANCEL_REQUESTED";
    }>;
    requestedUniqueViews: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type SupportRequestQueueItem = z.infer<typeof supportRequestQueueItemSchema>;
/** Partner-facing progress view — simplified, never the internal 14-status workflow verbatim. */
export declare const supportRequestProgressSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
        SUBMITTED: "SUBMITTED";
        DISPUTED: "DISPUTED";
        CANCELLED: "CANCELLED";
        VALIDATION: "VALIDATION";
        NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
        PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
        INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
        PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
        RUNNING: "RUNNING";
        RESULT_VERIFICATION: "RESULT_VERIFICATION";
        ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
        COMPLETED: "COMPLETED";
        CANCEL_REQUESTED: "CANCEL_REQUESTED";
    }>;
    promotionTypeName: z.ZodString;
    latestPriceEstimateRial: z.ZodNullable<z.ZodString>;
    latestQuote: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            NEGOTIATING: "NEGOTIATING";
            ACCEPTED: "ACCEPTED";
            REJECTED: "REJECTED";
            SENT: "SENT";
            EXPIRED: "EXPIRED";
        }>;
        versions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            versionNumber: z.ZodNumber;
            status: z.ZodEnum<{
                PROPOSED: "PROPOSED";
                ACCEPTED: "ACCEPTED";
                REJECTED: "REJECTED";
                EXPIRED: "EXPIRED";
                NEGOTIATION_REQUESTED: "NEGOTIATION_REQUESTED";
                SUPERSEDED: "SUPERSEDED";
            }>;
            estimatedChannelMin: z.ZodNullable<z.ZodNumber>;
            estimatedChannelMax: z.ZodNullable<z.ZodNumber>;
            estimatedViewMin: z.ZodNullable<z.ZodNumber>;
            estimatedViewMax: z.ZodNullable<z.ZodNumber>;
            method: z.ZodString;
            scheduleNote: z.ZodNullable<z.ZodString>;
            amountRial: z.ZodString;
            assumptions: z.ZodNullable<z.ZodString>;
            expiresAt: z.ZodNullable<z.ZodISODateTime>;
            negotiationNote: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodISODateTime;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    order: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        supportRequestId: z.ZodString;
        channelId: z.ZodString;
        finalAmountRial: z.ZodString;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    schedule: z.ZodNullable<z.ZodObject<{
        scheduledStartAt: z.ZodISODateTime;
        scheduledEndAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
    executionResult: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        actualUniqueViews: z.ZodNullable<z.ZodNumber>;
        actualChannelsCount: z.ZodNullable<z.ZodNumber>;
        realizedValueRial: z.ZodNullable<z.ZodString>;
        verifiedAt: z.ZodNullable<z.ZodISODateTime>;
        evidenceFileIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    timeline: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromStatus: z.ZodNullable<z.ZodEnum<{
            DRAFT: "DRAFT";
            SCHEDULED: "SCHEDULED";
            SUBMITTED: "SUBMITTED";
            DISPUTED: "DISPUTED";
            CANCELLED: "CANCELLED";
            VALIDATION: "VALIDATION";
            NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
            PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
            INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
            PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
            RUNNING: "RUNNING";
            RESULT_VERIFICATION: "RESULT_VERIFICATION";
            ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
            COMPLETED: "COMPLETED";
            CANCEL_REQUESTED: "CANCEL_REQUESTED";
        }>>;
        toStatus: z.ZodEnum<{
            DRAFT: "DRAFT";
            SCHEDULED: "SCHEDULED";
            SUBMITTED: "SUBMITTED";
            DISPUTED: "DISPUTED";
            CANCELLED: "CANCELLED";
            VALIDATION: "VALIDATION";
            NEEDS_PARTNER_CHANGES: "NEEDS_PARTNER_CHANGES";
            PRICING_OR_QUOTE: "PRICING_OR_QUOTE";
            INTERNAL_APPROVAL: "INTERNAL_APPROVAL";
            PARTNER_CONFIRMATION: "PARTNER_CONFIRMATION";
            RUNNING: "RUNNING";
            RESULT_VERIFICATION: "RESULT_VERIFICATION";
            ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED";
            COMPLETED: "COMPLETED";
            CANCEL_REQUESTED: "CANCEL_REQUESTED";
        }>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SupportRequestProgress = z.infer<typeof supportRequestProgressSchema>;
//# sourceMappingURL=promotions.d.ts.map