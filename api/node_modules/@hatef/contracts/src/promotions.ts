import { z } from "zod";

export const promotionPricingModelSchema = z.enum(["CALCULATED", "QUOTE"]);
export type PromotionPricingModelKey = z.infer<typeof promotionPricingModelSchema>;

export const audienceTypeSchema = z.enum(["NATIONWIDE", "PROVINCIAL"]);
export type AudienceTypeKey = z.infer<typeof audienceTypeSchema>;

export const promotionTypeVersionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const priceRuleSchema = z.object({
  id: z.string(),
  audienceType: audienceTypeSchema.nullable(),
  ratePerViewRial: z.string(),
  minAmountRial: z.string().nullable(),
  capAmountRial: z.string().nullable(),
});
export type PriceRule = z.infer<typeof priceRuleSchema>;

export const createPriceRuleSchema = z.object({
  audienceType: audienceTypeSchema.optional(),
  ratePerViewRial: z.string().regex(/^\d+$/, "نرخ باید عدد صحیح باشد."),
  minAmountRial: z.string().regex(/^\d+$/).optional(),
  capAmountRial: z.string().regex(/^\d+$/).optional(),
});
export type CreatePriceRule = z.infer<typeof createPriceRuleSchema>;

export const promotionTypeVersionSchema = z.object({
  id: z.string(),
  promotionTypeId: z.string(),
  versionNumber: z.number().int(),
  status: promotionTypeVersionStatusSchema,
  effectiveFrom: z.iso.datetime().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  priceRules: z.array(priceRuleSchema),
});
export type PromotionTypeVersionDefinition = z.infer<typeof promotionTypeVersionSchema>;

export const promotionTypeSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  pricingModel: promotionPricingModelSchema,
  draftVersionId: z.string().nullable(),
  publishedVersionId: z.string().nullable(),
});
export type PromotionType = z.infer<typeof promotionTypeSchema>;

export const createPromotionTypeSchema = z.object({
  key: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  pricingModel: promotionPricingModelSchema,
});
export type CreatePromotionType = z.infer<typeof createPromotionTypeSchema>;

export const supportRequestStatusSchema = z.enum([
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
export type SupportRequestStatusKey = z.infer<typeof supportRequestStatusSchema>;

export const createSupportRequestSchema = z.object({
  promotionTypeId: z.string(),
  audienceType: audienceTypeSchema.optional(),
  province: z.string().optional(),
  requestedUniqueViews: z.number().int().positive().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
});
export type CreateSupportRequest = z.infer<typeof createSupportRequestSchema>;

export const updateSupportRequestSchema = z.object({
  audienceType: audienceTypeSchema.optional(),
  province: z.string().optional(),
  requestedUniqueViews: z.number().int().positive().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateSupportRequest = z.infer<typeof updateSupportRequestSchema>;

export const supportRequestSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  promotionTypeId: z.string(),
  promotionTypeKey: z.string(),
  promotionTypeName: z.string(),
  pricingModel: promotionPricingModelSchema,
  status: supportRequestStatusSchema,
  audienceType: audienceTypeSchema.nullable(),
  province: z.string().nullable(),
  requestedUniqueViews: z.number().int().nullable(),
  details: z.record(z.string(), z.unknown()),
  currentRevisionNumber: z.number().int(),
  submittedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type SupportRequest = z.infer<typeof supportRequestSchema>;

export const supportRequestRevisionSchema = z.object({
  id: z.string(),
  revisionNumber: z.number().int(),
  snapshot: z.record(z.string(), z.unknown()),
  submittedAt: z.iso.datetime(),
});
export type SupportRequestRevision = z.infer<typeof supportRequestRevisionSchema>;

export const supportRequestStatusEventSchema = z.object({
  id: z.string(),
  fromStatus: supportRequestStatusSchema.nullable(),
  toStatus: supportRequestStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type SupportRequestStatusEvent = z.infer<typeof supportRequestStatusEventSchema>;

export const requestChangesSchema = z.object({ message: z.string().min(1) });
export type RequestChanges = z.infer<typeof requestChangesSchema>;

export const priceLineItemSchema = z.object({ label: z.string(), amountRial: z.string() });

export const priceCalculationSchema = z.object({
  id: z.string(),
  promotionTypeVersionId: z.string(),
  requestedUniqueViews: z.number().int(),
  audienceType: audienceTypeSchema,
  ratePerViewRial: z.string(),
  baseAmountRial: z.string(),
  discountRial: z.string(),
  multiplierPercent: z.number().int(),
  estimatedAmountRial: z.string(),
  lineItems: z.array(priceLineItemSchema),
  overrideAmountRial: z.string().nullable(),
  overrideReason: z.string().nullable(),
  requiresSecondApproval: z.boolean(),
  approvedAmountRial: z.string().nullable(),
  approvedBy: z.string().nullable(),
  secondApprovedBy: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type PriceCalculation = z.infer<typeof priceCalculationSchema>;

export const calculatePriceSchema = z.object({
  discountRial: z.string().regex(/^\d+$/).optional(),
  multiplierPercent: z.number().int().min(0).optional(),
});
export type CalculatePrice = z.infer<typeof calculatePriceSchema>;

export const overridePriceSchema = z.object({
  overrideAmountRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  overrideReason: z.string().min(1),
});
export type OverridePrice = z.infer<typeof overridePriceSchema>;

export const promotionQuoteStatusSchema = z.enum(["DRAFT", "SENT", "NEGOTIATING", "ACCEPTED", "REJECTED", "EXPIRED"]);
export const promotionQuoteVersionStatusSchema = z.enum([
  "PROPOSED",
  "NEGOTIATION_REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "SUPERSEDED",
  "EXPIRED",
]);

export const promotionQuoteVersionSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int(),
  status: promotionQuoteVersionStatusSchema,
  estimatedChannelMin: z.number().int().nullable(),
  estimatedChannelMax: z.number().int().nullable(),
  estimatedViewMin: z.number().int().nullable(),
  estimatedViewMax: z.number().int().nullable(),
  method: z.string(),
  scheduleNote: z.string().nullable(),
  amountRial: z.string(),
  assumptions: z.string().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  negotiationNote: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type PromotionQuoteVersion = z.infer<typeof promotionQuoteVersionSchema>;

export const promotionQuoteSchema = z.object({
  id: z.string(),
  status: promotionQuoteStatusSchema,
  versions: z.array(promotionQuoteVersionSchema),
});
export type PromotionQuote = z.infer<typeof promotionQuoteSchema>;

export const createQuoteVersionSchema = z.object({
  estimatedChannelMin: z.number().int().positive().optional(),
  estimatedChannelMax: z.number().int().positive().optional(),
  estimatedViewMin: z.number().int().positive().optional(),
  estimatedViewMax: z.number().int().positive().optional(),
  method: z.string().min(1),
  scheduleNote: z.string().optional(),
  amountRial: z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح باشد."),
  assumptions: z.string().optional(),
  expiresAt: z.iso.datetime().optional(),
});
export type CreateQuoteVersion = z.infer<typeof createQuoteVersionSchema>;

export const respondToQuoteSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT", "NEGOTIATE"]),
  note: z.string().optional(),
});
export type RespondToQuote = z.infer<typeof respondToQuoteSchema>;

export const promotionOrderSchema = z.object({
  id: z.string(),
  supportRequestId: z.string(),
  channelId: z.string(),
  finalAmountRial: z.string(),
  createdAt: z.iso.datetime(),
});
export type PromotionOrder = z.infer<typeof promotionOrderSchema>;

export const promotionScheduleChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
});
export type PromotionScheduleChecklistItem = z.infer<typeof promotionScheduleChecklistItemSchema>;

export const promotionScheduleSchema = z.object({
  id: z.string(),
  operatorId: z.string(),
  operatorName: z.string(),
  capacityResourceId: z.string().nullable(),
  scheduledStartAt: z.iso.datetime(),
  scheduledEndAt: z.iso.datetime().nullable(),
  checklist: z.array(promotionScheduleChecklistItemSchema),
});
export type PromotionSchedule = z.infer<typeof promotionScheduleSchema>;

export const scheduleSupportRequestSchema = z.object({
  operatorId: z.string(),
  capacityResourceId: z.string().optional(),
  scheduledStartAt: z.iso.datetime(),
  scheduledEndAt: z.iso.datetime().optional(),
});
export type ScheduleSupportRequest = z.infer<typeof scheduleSupportRequestSchema>;

export const rescheduleSupportRequestSchema = z.object({
  scheduledStartAt: z.iso.datetime(),
  scheduledEndAt: z.iso.datetime().optional(),
});
export type RescheduleSupportRequest = z.infer<typeof rescheduleSupportRequestSchema>;

export const promotionExecutionResultSchema = z.object({
  id: z.string(),
  actualUniqueViews: z.number().int().nullable(),
  actualChannelsCount: z.number().int().nullable(),
  realizedValueRial: z.string().nullable(),
  verifiedAt: z.iso.datetime().nullable(),
  evidenceFileIds: z.array(z.string()),
});
export type PromotionExecutionResult = z.infer<typeof promotionExecutionResultSchema>;

export const recordExecutionResultSchema = z.object({
  actualUniqueViews: z.number().int().nonnegative().optional(),
  actualChannelsCount: z.number().int().nonnegative().optional(),
  evidenceFileIds: z.array(z.string()).default([]),
});
export type RecordExecutionResult = z.infer<typeof recordExecutionResultSchema>;

export const verifyResultSchema = z.object({
  outcome: z.enum(["COMPLETE", "ADJUSTMENT_REQUIRED", "DISPUTE"]),
  note: z.string().optional(),
});
export type VerifyResult = z.infer<typeof verifyResultSchema>;

export const resolveDisputeSchema = z.object({
  outcome: z.enum(["COMPLETE", "CANCEL"]),
  note: z.string().optional(),
});
export type ResolveDispute = z.infer<typeof resolveDisputeSchema>;

export const cancelRequestSchema = z.object({ reason: z.string().min(1) });
export type CancelRequest = z.infer<typeof cancelRequestSchema>;

/** Queue/Kanban list item — the operational, admin-facing view of a SupportRequest. */
export const supportRequestQueueItemSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  channelTitle: z.string(),
  promotionTypeKey: z.string(),
  promotionTypeName: z.string(),
  pricingModel: promotionPricingModelSchema,
  status: supportRequestStatusSchema,
  requestedUniqueViews: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type SupportRequestQueueItem = z.infer<typeof supportRequestQueueItemSchema>;

/** Partner-facing progress view — simplified, never the internal 14-status workflow verbatim. */
export const supportRequestProgressSchema = z.object({
  id: z.string(),
  status: supportRequestStatusSchema,
  promotionTypeName: z.string(),
  latestPriceEstimateRial: z.string().nullable(),
  latestQuote: promotionQuoteSchema.nullable(),
  order: promotionOrderSchema.nullable(),
  schedule: z.object({ scheduledStartAt: z.iso.datetime(), scheduledEndAt: z.iso.datetime().nullable() }).nullable(),
  executionResult: promotionExecutionResultSchema.nullable(),
  timeline: z.array(supportRequestStatusEventSchema),
});
export type SupportRequestProgress = z.infer<typeof supportRequestProgressSchema>;
