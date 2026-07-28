import { StateMachine } from "@hatef/domain";
/**
 * The 12-status reciprocal-service obligation workflow (spec 16.3):
 * propose -> negotiate -> accept -> deliver -> review -> settle, with
 * dispute/reversal and cancellation as escape hatches at almost every point
 * (mirrors the flexibility SupportRequestStatus already has for its own
 * cancel/dispute paths).
 */
export declare const obligationStateMachine: StateMachine<"SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED">;
//# sourceMappingURL=obligation-state-machine.d.ts.map