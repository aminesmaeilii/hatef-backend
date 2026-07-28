import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "@hatef/domain";
import { ADVANCE_TARGET, PARTNER_CANCELLABLE_STATUSES, supportRequestStateMachine } from "./support-request-state-machine";

describe("supportRequestStateMachine", () => {
  it("allows the happy-path pin/quote workflow through to completion", () => {
    const happyPath = [
      "DRAFT",
      "SUBMITTED",
      "VALIDATION",
      "PRICING_OR_QUOTE",
      "INTERNAL_APPROVAL",
      "PARTNER_CONFIRMATION",
      "SCHEDULED",
      "RUNNING",
      "RESULT_VERIFICATION",
      "COMPLETED",
    ] as const;

    for (let i = 0; i < happyPath.length - 1; i += 1) {
      expect(supportRequestStateMachine.canTransition(happyPath[i]!, happyPath[i + 1]!)).toBe(true);
    }
  });

  it("allows a needs-changes loop back to submitted", () => {
    expect(supportRequestStateMachine.canTransition("VALIDATION", "NEEDS_PARTNER_CHANGES")).toBe(true);
    expect(supportRequestStateMachine.canTransition("NEEDS_PARTNER_CHANGES", "SUBMITTED")).toBe(true);
  });

  it("allows an adjustment loop back to result verification", () => {
    expect(supportRequestStateMachine.canTransition("RESULT_VERIFICATION", "ADJUSTMENT_REQUIRED")).toBe(true);
    expect(supportRequestStateMachine.canTransition("ADJUSTMENT_REQUIRED", "RESULT_VERIFICATION")).toBe(true);
  });

  it("allows a dispute to be raised after completion and resolved either way", () => {
    expect(supportRequestStateMachine.canTransition("COMPLETED", "DISPUTED")).toBe(true);
    expect(supportRequestStateMachine.canTransition("DISPUTED", "COMPLETED")).toBe(true);
    expect(supportRequestStateMachine.canTransition("DISPUTED", "CANCELLED")).toBe(true);
  });

  it("rejects illegal transitions, e.g. skipping straight from DRAFT to SCHEDULED", () => {
    expect(supportRequestStateMachine.canTransition("DRAFT", "SCHEDULED")).toBe(false);
    expect(() => supportRequestStateMachine.assertTransition("DRAFT", "SCHEDULED")).toThrow(IllegalStateTransitionError);
  });

  it("treats CANCELLED and (for now) terminal states as having no outgoing transitions", () => {
    expect(supportRequestStateMachine.isTerminal("CANCELLED")).toBe(true);
  });

  it("ADVANCE_TARGET only names single-target checkpoints that are legal per the transition table", () => {
    for (const [from, to] of Object.entries(ADVANCE_TARGET)) {
      expect(supportRequestStateMachine.canTransition(from as never, to as never)).toBe(true);
    }
  });

  it("partner-cancellable statuses all have a legal path to CANCEL_REQUESTED", () => {
    for (const status of PARTNER_CANCELLABLE_STATUSES) {
      expect(supportRequestStateMachine.canTransition(status, "CANCEL_REQUESTED")).toBe(true);
    }
  });
});
