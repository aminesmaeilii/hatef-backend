import { StateMachine } from "@hatef/domain";
import { EVALUATION_TRANSITIONS, type EvaluationCaseStatusKey } from "@hatef/contracts";

/** Exact transition table from the product spec's channel-assessment workflow. */
export const evaluationStateMachine = new StateMachine<EvaluationCaseStatusKey>(EVALUATION_TRANSITIONS);

/** The single, unambiguous "move the queue forward" target for administrative checkpoints (no extra data needed, unlike decide()/requestCorrection()). */
export const ADVANCE_TARGET: Partial<Record<EvaluationCaseStatusKey, EvaluationCaseStatusKey>> = {
  SUBMITTED: "IDENTITY_CHECK",
  IDENTITY_CHECK: "UNDER_REVIEW",
  RESUBMITTED: "UNDER_REVIEW",
  WAITLISTED: "UNDER_REVIEW",
};

export type PartnerFacingStatus =
  | "IN_REVIEW"
  | "NEEDS_CHANGES"
  | "APPROVED"
  | "CONDITIONALLY_APPROVED"
  | "WAITLISTED"
  | "REJECTED";

const PARTNER_STATUS_MAP: Record<EvaluationCaseStatusKey, PartnerFacingStatus> = {
  DRAFT: "IN_REVIEW",
  SUBMITTED: "IN_REVIEW",
  IDENTITY_CHECK: "IN_REVIEW",
  UNDER_REVIEW: "IN_REVIEW",
  RESUBMITTED: "IN_REVIEW",
  NEEDS_CHANGES: "NEEDS_CHANGES",
  APPROVED: "APPROVED",
  CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED",
  WAITLISTED: "WAITLISTED",
  REJECTED: "REJECTED",
};

/** The partner only ever sees this simplified set, never the internal 10-status workflow. */
export function toPartnerFacingStatus(status: EvaluationCaseStatusKey): PartnerFacingStatus {
  return PARTNER_STATUS_MAP[status];
}
