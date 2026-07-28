"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportRequestProgressSchema = exports.supportRequestQueueItemSchema = exports.cancelRequestSchema = exports.resolveDisputeSchema = exports.verifyResultSchema = exports.recordExecutionResultSchema = exports.promotionExecutionResultSchema = exports.rescheduleSupportRequestSchema = exports.scheduleSupportRequestSchema = exports.promotionScheduleSchema = exports.promotionScheduleChecklistItemSchema = exports.promotionOrderSchema = exports.respondToQuoteSchema = exports.createQuoteVersionSchema = exports.promotionQuoteSchema = exports.promotionQuoteVersionSchema = exports.promotionQuoteVersionStatusSchema = exports.promotionQuoteStatusSchema = exports.overridePriceSchema = exports.calculatePriceSchema = exports.priceCalculationSchema = exports.priceLineItemSchema = exports.requestChangesSchema = exports.supportRequestStatusEventSchema = exports.supportRequestRevisionSchema = exports.supportRequestSchema = exports.updateSupportRequestSchema = exports.createSupportRequestSchema = exports.supportRequestStatusSchema = exports.createPromotionTypeSchema = exports.promotionTypeSchema = exports.promotionTypeVersionSchema = exports.createPriceRuleSchema = exports.priceRuleSchema = exports.promotionTypeVersionStatusSchema = exports.audienceTypeSchema = exports.promotionPricingModelSchema = void 0;
const zod_1 = require("zod");
exports.promotionPricingModelSchema = zod_1.z.enum(["CALCULATED", "QUOTE"]);
exports.audienceTypeSchema = zod_1.z.enum(["NATIONWIDE", "PROVINCIAL"]);
exports.promotionTypeVersionStatusSchema = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.priceRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    audienceType: exports.audienceTypeSchema.nullable(),
    ratePerViewRial: zod_1.z.string(),
    minAmountRial: zod_1.z.string().nullable(),
    capAmountRial: zod_1.z.string().nullable(),
});
exports.createPriceRuleSchema = zod_1.z.object({
    audienceType: exports.audienceTypeSchema.optional(),
    ratePerViewRial: zod_1.z.string().regex(/^\d+$/, "نرخ باید عدد صحیح باشد."),
    minAmountRial: zod_1.z.string().regex(/^\d+$/).optional(),
    capAmountRial: zod_1.z.string().regex(/^\d+$/).optional(),
});
exports.promotionTypeVersionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    promotionTypeId: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    status: exports.promotionTypeVersionStatusSchema,
    effectiveFrom: zod_1.z.iso.datetime().nullable(),
    publishedAt: zod_1.z.iso.datetime().nullable(),
    priceRules: zod_1.z.array(exports.priceRuleSchema),
});
exports.promotionTypeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    pricingModel: exports.promotionPricingModelSchema,
    draftVersionId: zod_1.z.string().nullable(),
    publishedVersionId: zod_1.z.string().nullable(),
});
exports.createPromotionTypeSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    pricingModel: exports.promotionPricingModelSchema,
});
exports.supportRequestStatusSchema = zod_1.z.enum([
    "DRAFT",
    "SUBMITTED",
    "VALIDATION",
    "NEEDS_PARTNER_CHANGES",
    "PRICING_OR_QUOTE",
    "INTERNAL_APPROVAL",
    "PARTNER_CONFIRMATION",
    "SCHEDULED",
    "RUNNING",
    "RESULT_VERIFICATION",
    "ADJUSTMENT_REQUIRED",
    "COMPLETED",
    "CANCEL_REQUESTED",
    "CANCELLED",
    "DISPUTED",
]);
exports.createSupportRequestSchema = zod_1.z.object({
    promotionTypeId: zod_1.z.string(),
    audienceType: exports.audienceTypeSchema.optional(),
    province: zod_1.z.string().optional(),
    requestedUniqueViews: zod_1.z.number().int().positive().optional(),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
});
exports.updateSupportRequestSchema = zod_1.z.object({
    audienceType: exports.audienceTypeSchema.optional(),
    province: zod_1.z.string().optional(),
    requestedUniqueViews: zod_1.z.number().int().positive().optional(),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.supportRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    promotionTypeId: zod_1.z.string(),
    promotionTypeKey: zod_1.z.string(),
    promotionTypeName: zod_1.z.string(),
    pricingModel: exports.promotionPricingModelSchema,
    status: exports.supportRequestStatusSchema,
    audienceType: exports.audienceTypeSchema.nullable(),
    province: zod_1.z.string().nullable(),
    requestedUniqueViews: zod_1.z.number().int().nullable(),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    currentRevisionNumber: zod_1.z.number().int(),
    submittedAt: zod_1.z.iso.datetime().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.supportRequestRevisionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    revisionNumber: zod_1.z.number().int(),
    snapshot: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    submittedAt: zod_1.z.iso.datetime(),
});
exports.supportRequestStatusEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fromStatus: exports.supportRequestStatusSchema.nullable(),
    toStatus: exports.supportRequestStatusSchema,
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.requestChangesSchema = zod_1.z.object({ message: zod_1.z.string().min(1) });
exports.priceLineItemSchema = zod_1.z.object({ label: zod_1.z.string(), amountRial: zod_1.z.string() });
exports.priceCalculationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    promotionTypeVersionId: zod_1.z.string(),
    requestedUniqueViews: zod_1.z.number().int(),
    audienceType: exports.audienceTypeSchema,
    ratePerViewRial: zod_1.z.string(),
    baseAmountRial: zod_1.z.string(),
    discountRial: zod_1.z.string(),
    multiplierPercent: zod_1.z.number().int(),
    estimatedAmountRial: zod_1.z.string(),
    lineItems: zod_1.z.array(exports.priceLineItemSchema),
    overrideAmountRial: zod_1.z.string().nullable(),
    overrideReason: zod_1.z.string().nullable(),
    requiresSecondApproval: zod_1.z.boolean(),
    approvedAmountRial: zod_1.z.string().nullable(),
    approvedBy: zod_1.z.string().nullable(),
    secondApprovedBy: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.calculatePriceSchema = zod_1.z.object({
    discountRial: zod_1.z.string().regex(/^\d+$/).optional(),
    multiplierPercent: zod_1.z.number().int().min(0).optional(),
});
exports.overridePriceSchema = zod_1.z.object({
    overrideAmountRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    overrideReason: zod_1.z.string().min(1),
});
exports.promotionQuoteStatusSchema = zod_1.z.enum(["DRAFT", "SENT", "NEGOTIATING", "ACCEPTED", "REJECTED", "EXPIRED"]);
exports.promotionQuoteVersionStatusSchema = zod_1.z.enum([
    "PROPOSED",
    "NEGOTIATION_REQUESTED",
    "ACCEPTED",
    "REJECTED",
    "SUPERSEDED",
    "EXPIRED",
]);
exports.promotionQuoteVersionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    status: exports.promotionQuoteVersionStatusSchema,
    estimatedChannelMin: zod_1.z.number().int().nullable(),
    estimatedChannelMax: zod_1.z.number().int().nullable(),
    estimatedViewMin: zod_1.z.number().int().nullable(),
    estimatedViewMax: zod_1.z.number().int().nullable(),
    method: zod_1.z.string(),
    scheduleNote: zod_1.z.string().nullable(),
    amountRial: zod_1.z.string(),
    assumptions: zod_1.z.string().nullable(),
    expiresAt: zod_1.z.iso.datetime().nullable(),
    negotiationNote: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.promotionQuoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    status: exports.promotionQuoteStatusSchema,
    versions: zod_1.z.array(exports.promotionQuoteVersionSchema),
});
exports.createQuoteVersionSchema = zod_1.z.object({
    estimatedChannelMin: zod_1.z.number().int().positive().optional(),
    estimatedChannelMax: zod_1.z.number().int().positive().optional(),
    estimatedViewMin: zod_1.z.number().int().positive().optional(),
    estimatedViewMax: zod_1.z.number().int().positive().optional(),
    method: zod_1.z.string().min(1),
    scheduleNote: zod_1.z.string().optional(),
    amountRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    assumptions: zod_1.z.string().optional(),
    expiresAt: zod_1.z.iso.datetime().optional(),
});
exports.respondToQuoteSchema = zod_1.z.object({
    action: zod_1.z.enum(["ACCEPT", "REJECT", "NEGOTIATE"]),
    note: zod_1.z.string().optional(),
});
exports.promotionOrderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    supportRequestId: zod_1.z.string(),
    channelId: zod_1.z.string(),
    finalAmountRial: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.promotionScheduleChecklistItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    done: zod_1.z.boolean(),
});
exports.promotionScheduleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    operatorId: zod_1.z.string(),
    operatorName: zod_1.z.string(),
    capacityResourceId: zod_1.z.string().nullable(),
    scheduledStartAt: zod_1.z.iso.datetime(),
    scheduledEndAt: zod_1.z.iso.datetime().nullable(),
    checklist: zod_1.z.array(exports.promotionScheduleChecklistItemSchema),
});
exports.scheduleSupportRequestSchema = zod_1.z.object({
    operatorId: zod_1.z.string(),
    capacityResourceId: zod_1.z.string().optional(),
    scheduledStartAt: zod_1.z.iso.datetime(),
    scheduledEndAt: zod_1.z.iso.datetime().optional(),
});
exports.rescheduleSupportRequestSchema = zod_1.z.object({
    scheduledStartAt: zod_1.z.iso.datetime(),
    scheduledEndAt: zod_1.z.iso.datetime().optional(),
});
exports.promotionExecutionResultSchema = zod_1.z.object({
    id: zod_1.z.string(),
    actualUniqueViews: zod_1.z.number().int().nullable(),
    actualChannelsCount: zod_1.z.number().int().nullable(),
    realizedValueRial: zod_1.z.string().nullable(),
    verifiedAt: zod_1.z.iso.datetime().nullable(),
    evidenceFileIds: zod_1.z.array(zod_1.z.string()),
});
exports.recordExecutionResultSchema = zod_1.z.object({
    actualUniqueViews: zod_1.z.number().int().nonnegative().optional(),
    actualChannelsCount: zod_1.z.number().int().nonnegative().optional(),
    evidenceFileIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.verifyResultSchema = zod_1.z.object({
    outcome: zod_1.z.enum(["COMPLETE", "ADJUSTMENT_REQUIRED", "DISPUTE"]),
    note: zod_1.z.string().optional(),
});
exports.resolveDisputeSchema = zod_1.z.object({
    outcome: zod_1.z.enum(["COMPLETE", "CANCEL"]),
    note: zod_1.z.string().optional(),
});
exports.cancelRequestSchema = zod_1.z.object({ reason: zod_1.z.string().min(1) });
/** Queue/Kanban list item — the operational, admin-facing view of a SupportRequest. */
exports.supportRequestQueueItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    channelTitle: zod_1.z.string(),
    promotionTypeKey: zod_1.z.string(),
    promotionTypeName: zod_1.z.string(),
    pricingModel: exports.promotionPricingModelSchema,
    status: exports.supportRequestStatusSchema,
    requestedUniqueViews: zod_1.z.number().int().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    updatedAt: zod_1.z.iso.datetime(),
});
/** Partner-facing progress view — simplified, never the internal 14-status workflow verbatim. */
exports.supportRequestProgressSchema = zod_1.z.object({
    id: zod_1.z.string(),
    status: exports.supportRequestStatusSchema,
    promotionTypeName: zod_1.z.string(),
    latestPriceEstimateRial: zod_1.z.string().nullable(),
    latestQuote: exports.promotionQuoteSchema.nullable(),
    order: exports.promotionOrderSchema.nullable(),
    schedule: zod_1.z.object({ scheduledStartAt: zod_1.z.iso.datetime(), scheduledEndAt: zod_1.z.iso.datetime().nullable() }).nullable(),
    executionResult: exports.promotionExecutionResultSchema.nullable(),
    timeline: zod_1.z.array(exports.supportRequestStatusEventSchema),
});
