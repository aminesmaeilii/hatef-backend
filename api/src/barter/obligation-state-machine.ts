import { StateMachine } from "@hatef/domain";
import type { ObligationStatusKey } from "@hatef/contracts";

/**
 * The 12-status reciprocal-service obligation workflow (spec 16.3):
 * propose -> negotiate -> accept -> deliver -> review -> settle, with
 * dispute/reversal and cancellation as escape hatches at almost every point
 * (mirrors the flexibility SupportRequestStatus already has for its own
 * cancel/dispute paths).
 */
export const obligationStateMachine = new StateMachine<ObligationStatusKey>({
  PROPOSED: ["NEGOTIATING", "ACCEPTED", "CANCELLED"],
  NEGOTIATING: ["PROPOSED", "ACCEPTED", "CANCELLED"],
  ACCEPTED: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["NEEDS_REVISION", "PARTIALLY_APPROVED", "APPROVED", "DISPUTED"],
  NEEDS_REVISION: ["SUBMITTED", "CANCELLED"],
  PARTIALLY_APPROVED: ["SUBMITTED", "SETTLED", "DISPUTED"],
  APPROVED: ["SETTLED", "DISPUTED"],
  DISPUTED: ["APPROVED", "PARTIALLY_APPROVED", "NEEDS_REVISION", "CANCELLED"],
  SETTLED: ["DISPUTED"],
  CANCELLED: [],
});
