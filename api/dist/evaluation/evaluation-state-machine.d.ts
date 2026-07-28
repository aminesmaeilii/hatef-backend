import { StateMachine } from "@hatef/domain";
import { type EvaluationCaseStatusKey } from "@hatef/contracts";
/** Exact transition table from the product spec's channel-assessment workflow. */
export declare const evaluationStateMachine: StateMachine<"DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "IDENTITY_CHECK" | "UNDER_REVIEW" | "NEEDS_CHANGES" | "RESUBMITTED" | "CONDITIONALLY_APPROVED" | "WAITLISTED">;
/** The single, unambiguous "move the queue forward" target for administrative checkpoints (no extra data needed, unlike decide()/requestCorrection()). */
export declare const ADVANCE_TARGET: Partial<Record<EvaluationCaseStatusKey, EvaluationCaseStatusKey>>;
export type PartnerFacingStatus = "IN_REVIEW" | "NEEDS_CHANGES" | "APPROVED" | "CONDITIONALLY_APPROVED" | "WAITLISTED" | "REJECTED";
/** The partner only ever sees this simplified set, never the internal 10-status workflow. */
export declare function toPartnerFacingStatus(status: EvaluationCaseStatusKey): PartnerFacingStatus;
//# sourceMappingURL=evaluation-state-machine.d.ts.map