import { z } from "zod";

export const serviceTypeSchema = z.enum([
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
export type ServiceTypeKey = z.infer<typeof serviceTypeSchema>;

export const serviceCatalogVersionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const serviceCatalogVersionSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int(),
  status: serviceCatalogVersionStatusSchema,
  unit: z.string(),
  valuationMethod: z.string(),
  defaultAcceptanceCriteria: z.string().nullable(),
  defaultEvidence: z.string().nullable(),
  priceGuidanceRial: z.string().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});
export type ServiceCatalogVersion = z.infer<typeof serviceCatalogVersionSchema>;

export const serviceCatalogItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  serviceType: serviceTypeSchema,
  description: z.string().nullable(),
  activeVersion: serviceCatalogVersionSchema.nullable(),
});
export type ServiceCatalogItem = z.infer<typeof serviceCatalogItemSchema>;

export const createServiceCatalogItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  serviceType: serviceTypeSchema,
  description: z.string().optional(),
  unit: z.string().min(1),
  valuationMethod: z.string().min(1),
  defaultAcceptanceCriteria: z.string().optional(),
  defaultEvidence: z.string().optional(),
  priceGuidanceRial: z.string().regex(/^\d+$/).optional(),
});
export type CreateServiceCatalogItem = z.infer<typeof createServiceCatalogItemSchema>;

export const createServiceCatalogVersionSchema = z.object({
  unit: z.string().min(1),
  valuationMethod: z.string().min(1),
  defaultAcceptanceCriteria: z.string().optional(),
  defaultEvidence: z.string().optional(),
  priceGuidanceRial: z.string().regex(/^\d+$/).optional(),
});
export type CreateServiceCatalogVersion = z.infer<typeof createServiceCatalogVersionSchema>;

export const obligationStatusSchema = z.enum([
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
export type ObligationStatusKey = z.infer<typeof obligationStatusSchema>;

export const createObligationSchema = z.object({
  channelId: z.string(),
  supportRequestId: z.string().optional(),
  serviceCatalogItemId: z.string(),
  brief: z.string().min(1),
  output: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  valueRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  startAt: z.iso.datetime().optional(),
  deadlineAt: z.iso.datetime().optional(),
  responsibleChannelMemberId: z.string().optional(),
  responsibleHatefEmployeeId: z.string().optional(),
  terms: z.string().optional(),
});
export type CreateObligation = z.infer<typeof createObligationSchema>;

export const obligationProposalStatusSchema = z.enum(["PROPOSED", "COUNTERED", "ACCEPTED", "REJECTED"]);

export const obligationProposalSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int(),
  proposedById: z.string(),
  status: obligationProposalStatusSchema,
  valueRial: z.string(),
  brief: z.string().nullable(),
  deadlineAt: z.iso.datetime().nullable(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type ObligationProposal = z.infer<typeof obligationProposalSchema>;

export const createObligationProposalSchema = z.object({
  valueRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  brief: z.string().optional(),
  deadlineAt: z.iso.datetime().optional(),
  note: z.string().optional(),
});
export type CreateObligationProposal = z.infer<typeof createObligationProposalSchema>;

export const respondToObligationProposalSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
  note: z.string().optional(),
});
export type RespondToObligationProposal = z.infer<typeof respondToObligationProposalSchema>;

export const obligationStatusEventSchema = z.object({
  id: z.string(),
  fromStatus: obligationStatusSchema.nullable(),
  toStatus: obligationStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type ObligationStatusEvent = z.infer<typeof obligationStatusEventSchema>;

export const transitionObligationSchema = z.object({
  toStatus: obligationStatusSchema,
  note: z.string().optional(),
});
export type TransitionObligation = z.infer<typeof transitionObligationSchema>;

export const obligationSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  channelTitle: z.string(),
  supportRequestId: z.string().nullable(),
  serviceCatalogItemId: z.string(),
  serviceCatalogItemName: z.string(),
  status: obligationStatusSchema,
  brief: z.string(),
  output: z.string().nullable(),
  acceptanceCriteria: z.string().nullable(),
  valueRial: z.string(),
  settledValueRial: z.string(),
  startAt: z.iso.datetime().nullable(),
  deadlineAt: z.iso.datetime().nullable(),
  responsibleChannelMemberId: z.string().nullable(),
  responsibleHatefEmployeeId: z.string().nullable(),
  terms: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Obligation = z.infer<typeof obligationSchema>;

export const obligationDetailSchema = obligationSchema.extend({
  proposals: z.array(obligationProposalSchema),
  statusEvents: z.array(obligationStatusEventSchema),
});
export type ObligationDetail = z.infer<typeof obligationDetailSchema>;

export const deliverableStatusSchema = z.enum([
  "SUBMITTED",
  "NEEDS_REVISION",
  "ACCEPTED",
  "PARTIALLY_ACCEPTED",
  "REJECTED",
  "DISPUTED",
]);
export type DeliverableStatusKey = z.infer<typeof deliverableStatusSchema>;

export const submitDeliverableSchema = z.object({
  description: z.string().optional(),
  links: z.array(z.string()).default([]),
  reachOrViews: z.number().int().nonnegative().optional(),
  deliveredAt: z.iso.datetime().optional(),
  fileIds: z.array(z.string()).default([]),
});
export type SubmitDeliverable = z.infer<typeof submitDeliverableSchema>;

export const reviewDecisionSchema = z.enum(["ACCEPT_FULL", "ACCEPT_PARTIAL", "REQUEST_REVISION", "REJECT", "DISPUTE"]);
export type ReviewDecisionKey = z.infer<typeof reviewDecisionSchema>;

export const reviewDeliverableSchema = z
  .object({
    decision: reviewDecisionSchema,
    acceptedValueRial: z.string().regex(/^\d+$/).optional(),
    note: z.string().optional(),
  })
  .refine((v) => v.decision !== "ACCEPT_PARTIAL" || v.acceptedValueRial !== undefined, {
    message: "پذیرش جزئی نیازمند مبلغ پذیرفته‌شده است.",
    path: ["acceptedValueRial"],
  });
export type ReviewDeliverable = z.infer<typeof reviewDeliverableSchema>;

export const deliverableReviewSchema = z.object({
  id: z.string(),
  reviewerId: z.string(),
  decision: reviewDecisionSchema,
  acceptedValueRial: z.string().nullable(),
  remainingValueRial: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type DeliverableReview = z.infer<typeof deliverableReviewSchema>;

export const deliverableSchema = z.object({
  id: z.string(),
  obligationId: z.string(),
  submittedById: z.string(),
  status: deliverableStatusSchema,
  description: z.string().nullable(),
  links: z.array(z.string()),
  reachOrViews: z.number().int().nullable(),
  deliveredAt: z.iso.datetime().nullable(),
  fileIds: z.array(z.string()),
  reviews: z.array(deliverableReviewSchema),
  createdAt: z.iso.datetime(),
});
export type Deliverable = z.infer<typeof deliverableSchema>;

export const disputeStatusSchema = z.enum(["OPEN", "RESOLVED_REVERSED", "RESOLVED_UPHELD"]);
export type DisputeStatusKey = z.infer<typeof disputeStatusSchema>;

export const raiseDisputeSchema = z.object({
  deliverableId: z.string().optional(),
  reason: z.string().min(1),
});
export type RaiseDispute = z.infer<typeof raiseDisputeSchema>;

export const resolveObligationDisputeSchema = z.object({
  outcome: z.enum(["REVERSE", "UPHOLD"]),
  note: z.string().min(1),
});
export type ResolveObligationDispute = z.infer<typeof resolveObligationDisputeSchema>;

export const disputeSchema = z.object({
  id: z.string(),
  obligationId: z.string(),
  deliverableId: z.string().nullable(),
  raisedById: z.string(),
  reason: z.string(),
  status: disputeStatusSchema,
  resolutionNote: z.string().nullable(),
  resolvedById: z.string().nullable(),
  resolvedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type Dispute = z.infer<typeof disputeSchema>;

// ---------------------------------------------------------------------------
// Channel rate cards (spec 17)
// ---------------------------------------------------------------------------

export const rateCardStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "NEGOTIATING", "ARCHIVED"]);
export const rateCardItemStatusSchema = z.enum(["PENDING", "APPROVED", "NEGOTIATING", "ARCHIVED"]);

export const rateCardItemSchema = z.object({
  id: z.string(),
  serviceType: serviceTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  priceUnit: z.string(),
  amountRial: z.string(),
  minimumOrder: z.number().int().nullable(),
  leadTimeDays: z.number().int().nullable(),
  monthlyCapacity: z.number().int().nullable(),
  terms: z.string().nullable(),
  sampleWorkUrl: z.string().nullable(),
  effectiveFrom: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  status: rateCardItemStatusSchema,
  adminComment: z.string().nullable(),
});
export type RateCardItem = z.infer<typeof rateCardItemSchema>;

export const createRateCardItemSchema = z.object({
  serviceType: serviceTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  priceUnit: z.string().min(1),
  amountRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  minimumOrder: z.number().int().positive().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  monthlyCapacity: z.number().int().positive().optional(),
  terms: z.string().optional(),
  sampleWorkUrl: z.string().optional(),
  effectiveFrom: z.iso.datetime().optional(),
  expiresAt: z.iso.datetime().optional(),
});
export type CreateRateCardItem = z.infer<typeof createRateCardItemSchema>;

export const reviewRateCardItemSchema = z.object({
  action: z.enum(["APPROVE", "NEGOTIATE", "ARCHIVE"]),
  comment: z.string().optional(),
});
export type ReviewRateCardItem = z.infer<typeof reviewRateCardItemSchema>;

export const rateCardSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  versionNumber: z.number().int(),
  status: rateCardStatusSchema,
  submittedAt: z.iso.datetime().nullable(),
  items: z.array(rateCardItemSchema),
  createdAt: z.iso.datetime(),
});
export type RateCard = z.infer<typeof rateCardSchema>;
