import { StateMachine } from "@hatef/domain";
import type { SupportRequestStatusKey } from "@hatef/contracts";

/**
 * The 14-status support-request workflow (spec 13.3), shared by both the
 * first-position pin (CALCULATED pricing) and variable multi-channel
 * (QUOTE pricing) request types. Pricing/quote negotiation happens entirely
 * within PRICING_OR_QUOTE (multiple PriceCalculation/PromotionQuoteVersion
 * rows can be created without a status change); INTERNAL_APPROVAL is a
 * distinct staff sign-off gate reached only once the price is approved (pin)
 * or the quote is ACCEPTED (variable) — see SupportRequestsOpsService.
 */
export const supportRequestStateMachine = new StateMachine<SupportRequestStatusKey>({
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["VALIDATION", "CANCEL_REQUESTED"],
  VALIDATION: ["PRICING_OR_QUOTE", "NEEDS_PARTNER_CHANGES", "CANCEL_REQUESTED"],
  NEEDS_PARTNER_CHANGES: ["SUBMITTED", "CANCEL_REQUESTED"],
  PRICING_OR_QUOTE: ["INTERNAL_APPROVAL", "NEEDS_PARTNER_CHANGES", "CANCEL_REQUESTED"],
  INTERNAL_APPROVAL: ["PARTNER_CONFIRMATION", "PRICING_OR_QUOTE", "CANCEL_REQUESTED"],
  PARTNER_CONFIRMATION: ["SCHEDULED", "PRICING_OR_QUOTE", "CANCEL_REQUESTED"],
  SCHEDULED: ["RUNNING", "CANCEL_REQUESTED"],
  RUNNING: ["RESULT_VERIFICATION"],
  RESULT_VERIFICATION: ["ADJUSTMENT_REQUIRED", "COMPLETED", "DISPUTED"],
  ADJUSTMENT_REQUIRED: ["RESULT_VERIFICATION"],
  COMPLETED: ["DISPUTED"],
  CANCEL_REQUESTED: ["CANCELLED"],
  CANCELLED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
});

/** The single, unambiguous "move the queue forward" target for checkpoints that need no extra data. */
export const ADVANCE_TARGET: Partial<Record<SupportRequestStatusKey, SupportRequestStatusKey>> = {
  SUBMITTED: "VALIDATION",
  SCHEDULED: "RUNNING",
  ADJUSTMENT_REQUIRED: "RESULT_VERIFICATION",
  CANCEL_REQUESTED: "CANCELLED",
};

/** States a partner may request cancellation from. */
export const PARTNER_CANCELLABLE_STATUSES: SupportRequestStatusKey[] = [
  "SUBMITTED",
  "VALIDATION",
  "NEEDS_PARTNER_CHANGES",
  "PRICING_OR_QUOTE",
  "INTERNAL_APPROVAL",
  "PARTNER_CONFIRMATION",
  "SCHEDULED",
];
