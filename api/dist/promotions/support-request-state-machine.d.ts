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
export declare const supportRequestStateMachine: StateMachine<"COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED">;
/** The single, unambiguous "move the queue forward" target for checkpoints that need no extra data. */
export declare const ADVANCE_TARGET: Partial<Record<SupportRequestStatusKey, SupportRequestStatusKey>>;
/** States a partner may request cancellation from. */
export declare const PARTNER_CANCELLABLE_STATUSES: SupportRequestStatusKey[];
//# sourceMappingURL=support-request-state-machine.d.ts.map