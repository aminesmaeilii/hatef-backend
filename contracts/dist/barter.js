"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateCardSchema = exports.reviewRateCardItemSchema = exports.createRateCardItemSchema = exports.rateCardItemSchema = exports.rateCardItemStatusSchema = exports.rateCardStatusSchema = exports.disputeSchema = exports.resolveObligationDisputeSchema = exports.raiseDisputeSchema = exports.disputeStatusSchema = exports.deliverableSchema = exports.deliverableReviewSchema = exports.reviewDeliverableSchema = exports.reviewDecisionSchema = exports.submitDeliverableSchema = exports.deliverableStatusSchema = exports.obligationDetailSchema = exports.obligationSchema = exports.transitionObligationSchema = exports.obligationStatusEventSchema = exports.respondToObligationProposalSchema = exports.createObligationProposalSchema = exports.obligationProposalSchema = exports.obligationProposalStatusSchema = exports.createObligationSchema = exports.obligationStatusSchema = exports.createServiceCatalogVersionSchema = exports.createServiceCatalogItemSchema = exports.serviceCatalogItemSchema = exports.serviceCatalogVersionSchema = exports.serviceCatalogVersionStatusSchema = exports.serviceTypeSchema = void 0;
const zod_1 = require("zod");
exports.serviceTypeSchema = zod_1.z.enum([
    "PUBLICATION",
    "REPOST",
    "CONTENT_PRODUCTION",
    "EVENT_COVERAGE",
    "CAMPAIGN_PARTICIPATION",
    "FIELD_OPERATION",
    "NETWORKING",
    "RESEARCH",
    "SURVEY",
    "OTHER",
]);
exports.serviceCatalogVersionStatusSchema = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.serviceCatalogVersionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    status: exports.serviceCatalogVersionStatusSchema,
    unit: zod_1.z.string(),
    valuationMethod: zod_1.z.string(),
    defaultAcceptanceCriteria: zod_1.z.string().nullable(),
    defaultEvidence: zod_1.z.string().nullable(),
    priceGuidanceRial: zod_1.z.string().nullable(),
    publishedAt: zod_1.z.iso.datetime().nullable(),
});
exports.serviceCatalogItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    serviceType: exports.serviceTypeSchema,
    description: zod_1.z.string().nullable(),
    activeVersion: exports.serviceCatalogVersionSchema.nullable(),
});
exports.createServiceCatalogItemSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    serviceType: exports.serviceTypeSchema,
    description: zod_1.z.string().optional(),
    unit: zod_1.z.string().min(1),
    valuationMethod: zod_1.z.string().min(1),
    defaultAcceptanceCriteria: zod_1.z.string().optional(),
    defaultEvidence: zod_1.z.string().optional(),
    priceGuidanceRial: zod_1.z.string().regex(/^\d+$/).optional(),
});
exports.createServiceCatalogVersionSchema = zod_1.z.object({
    unit: zod_1.z.string().min(1),
    valuationMethod: zod_1.z.string().min(1),
    defaultAcceptanceCriteria: zod_1.z.string().optional(),
    defaultEvidence: zod_1.z.string().optional(),
    priceGuidanceRial: zod_1.z.string().regex(/^\d+$/).optional(),
});
exports.obligationStatusSchema = zod_1.z.enum([
    "PROPOSED",
    "NEGOTIATING",
    "ACCEPTED",
    "SCHEDULED",
    "IN_PROGRESS",
    "SUBMITTED",
    "NEEDS_REVISION",
    "PARTIALLY_APPROVED",
    "APPROVED",
    "DISPUTED",
    "SETTLED",
    "CANCELLED",
]);
exports.createObligationSchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    supportRequestId: zod_1.z.string().optional(),
    serviceCatalogItemId: zod_1.z.string(),
    brief: zod_1.z.string().min(1),
    output: zod_1.z.string().optional(),
    acceptanceCriteria: zod_1.z.string().optional(),
    valueRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    startAt: zod_1.z.iso.datetime().optional(),
    deadlineAt: zod_1.z.iso.datetime().optional(),
    responsibleChannelMemberId: zod_1.z.string().optional(),
    responsibleHatefEmployeeId: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
});
exports.obligationProposalStatusSchema = zod_1.z.enum(["PROPOSED", "COUNTERED", "ACCEPTED", "REJECTED"]);
exports.obligationProposalSchema = zod_1.z.object({
    id: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    proposedById: zod_1.z.string(),
    status: exports.obligationProposalStatusSchema,
    valueRial: zod_1.z.string(),
    brief: zod_1.z.string().nullable(),
    deadlineAt: zod_1.z.iso.datetime().nullable(),
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.createObligationProposalSchema = zod_1.z.object({
    valueRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    brief: zod_1.z.string().optional(),
    deadlineAt: zod_1.z.iso.datetime().optional(),
    note: zod_1.z.string().optional(),
});
exports.respondToObligationProposalSchema = zod_1.z.object({
    action: zod_1.z.enum(["ACCEPT", "REJECT"]),
    note: zod_1.z.string().optional(),
});
exports.obligationStatusEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fromStatus: exports.obligationStatusSchema.nullable(),
    toStatus: exports.obligationStatusSchema,
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.transitionObligationSchema = zod_1.z.object({
    toStatus: exports.obligationStatusSchema,
    note: zod_1.z.string().optional(),
});
exports.obligationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    channelTitle: zod_1.z.string(),
    supportRequestId: zod_1.z.string().nullable(),
    serviceCatalogItemId: zod_1.z.string(),
    serviceCatalogItemName: zod_1.z.string(),
    status: exports.obligationStatusSchema,
    brief: zod_1.z.string(),
    output: zod_1.z.string().nullable(),
    acceptanceCriteria: zod_1.z.string().nullable(),
    valueRial: zod_1.z.string(),
    settledValueRial: zod_1.z.string(),
    startAt: zod_1.z.iso.datetime().nullable(),
    deadlineAt: zod_1.z.iso.datetime().nullable(),
    responsibleChannelMemberId: zod_1.z.string().nullable(),
    responsibleHatefEmployeeId: zod_1.z.string().nullable(),
    terms: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    updatedAt: zod_1.z.iso.datetime(),
});
exports.obligationDetailSchema = exports.obligationSchema.extend({
    proposals: zod_1.z.array(exports.obligationProposalSchema),
    statusEvents: zod_1.z.array(exports.obligationStatusEventSchema),
});
exports.deliverableStatusSchema = zod_1.z.enum([
    "SUBMITTED",
    "NEEDS_REVISION",
    "ACCEPTED",
    "PARTIALLY_ACCEPTED",
    "REJECTED",
    "DISPUTED",
]);
exports.submitDeliverableSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    links: zod_1.z.array(zod_1.z.string()).default([]),
    reachOrViews: zod_1.z.number().int().nonnegative().optional(),
    deliveredAt: zod_1.z.iso.datetime().optional(),
    fileIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.reviewDecisionSchema = zod_1.z.enum(["ACCEPT_FULL", "ACCEPT_PARTIAL", "REQUEST_REVISION", "REJECT", "DISPUTE"]);
exports.reviewDeliverableSchema = zod_1.z
    .object({
    decision: exports.reviewDecisionSchema,
    acceptedValueRial: zod_1.z.string().regex(/^\d+$/).optional(),
    note: zod_1.z.string().optional(),
})
    .refine((v) => v.decision !== "ACCEPT_PARTIAL" || v.acceptedValueRial !== undefined, {
    message: "پذیرش جزئی نیازمند مبلغ پذیرفته‌شده است.",
    path: ["acceptedValueRial"],
});
exports.deliverableReviewSchema = zod_1.z.object({
    id: zod_1.z.string(),
    reviewerId: zod_1.z.string(),
    decision: exports.reviewDecisionSchema,
    acceptedValueRial: zod_1.z.string().nullable(),
    remainingValueRial: zod_1.z.string().nullable(),
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.deliverableSchema = zod_1.z.object({
    id: zod_1.z.string(),
    obligationId: zod_1.z.string(),
    submittedById: zod_1.z.string(),
    status: exports.deliverableStatusSchema,
    description: zod_1.z.string().nullable(),
    links: zod_1.z.array(zod_1.z.string()),
    reachOrViews: zod_1.z.number().int().nullable(),
    deliveredAt: zod_1.z.iso.datetime().nullable(),
    fileIds: zod_1.z.array(zod_1.z.string()),
    reviews: zod_1.z.array(exports.deliverableReviewSchema),
    createdAt: zod_1.z.iso.datetime(),
});
exports.disputeStatusSchema = zod_1.z.enum(["OPEN", "RESOLVED_REVERSED", "RESOLVED_UPHELD"]);
exports.raiseDisputeSchema = zod_1.z.object({
    deliverableId: zod_1.z.string().optional(),
    reason: zod_1.z.string().min(1),
});
exports.resolveObligationDisputeSchema = zod_1.z.object({
    outcome: zod_1.z.enum(["REVERSE", "UPHOLD"]),
    note: zod_1.z.string().min(1),
});
exports.disputeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    obligationId: zod_1.z.string(),
    deliverableId: zod_1.z.string().nullable(),
    raisedById: zod_1.z.string(),
    reason: zod_1.z.string(),
    status: exports.disputeStatusSchema,
    resolutionNote: zod_1.z.string().nullable(),
    resolvedById: zod_1.z.string().nullable(),
    resolvedAt: zod_1.z.iso.datetime().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
// ---------------------------------------------------------------------------
// Channel rate cards (spec 17)
// ---------------------------------------------------------------------------
exports.rateCardStatusSchema = zod_1.z.enum(["DRAFT", "SUBMITTED", "APPROVED", "NEGOTIATING", "ARCHIVED"]);
exports.rateCardItemStatusSchema = zod_1.z.enum(["PENDING", "APPROVED", "NEGOTIATING", "ARCHIVED"]);
exports.rateCardItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    serviceType: exports.serviceTypeSchema,
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    priceUnit: zod_1.z.string(),
    amountRial: zod_1.z.string(),
    minimumOrder: zod_1.z.number().int().nullable(),
    leadTimeDays: zod_1.z.number().int().nullable(),
    monthlyCapacity: zod_1.z.number().int().nullable(),
    terms: zod_1.z.string().nullable(),
    sampleWorkUrl: zod_1.z.string().nullable(),
    effectiveFrom: zod_1.z.iso.datetime().nullable(),
    expiresAt: zod_1.z.iso.datetime().nullable(),
    status: exports.rateCardItemStatusSchema,
    adminComment: zod_1.z.string().nullable(),
});
exports.createRateCardItemSchema = zod_1.z.object({
    serviceType: exports.serviceTypeSchema,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    priceUnit: zod_1.z.string().min(1),
    amountRial: zod_1.z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
    minimumOrder: zod_1.z.number().int().positive().optional(),
    leadTimeDays: zod_1.z.number().int().positive().optional(),
    monthlyCapacity: zod_1.z.number().int().positive().optional(),
    terms: zod_1.z.string().optional(),
    sampleWorkUrl: zod_1.z.string().optional(),
    effectiveFrom: zod_1.z.iso.datetime().optional(),
    expiresAt: zod_1.z.iso.datetime().optional(),
});
exports.reviewRateCardItemSchema = zod_1.z.object({
    action: zod_1.z.enum(["APPROVE", "NEGOTIATE", "ARCHIVE"]),
    comment: zod_1.z.string().optional(),
});
exports.rateCardSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    status: exports.rateCardStatusSchema,
    submittedAt: zod_1.z.iso.datetime().nullable(),
    items: zod_1.z.array(exports.rateCardItemSchema),
    createdAt: zod_1.z.iso.datetime(),
});
