import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "@hatef/domain";
import { ADVANCE_TARGET, evaluationStateMachine, toPartnerFacingStatus } from "./evaluation-state-machine";

describe("evaluationStateMachine", () => {
  it("allows the full happy-path progression", () => {
    expect(evaluationStateMachine.canTransition("DRAFT", "SUBMITTED")).toBe(true);
    expect(evaluationStateMachine.canTransition("SUBMITTED", "IDENTITY_CHECK")).toBe(true);
    expect(evaluationStateMachine.canTransition("IDENTITY_CHECK", "UNDER_REVIEW")).toBe(true);
    expect(evaluationStateMachine.canTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
  });

  it("allows the correction round trip", () => {
    expect(evaluationStateMachine.canTransition("UNDER_REVIEW", "NEEDS_CHANGES")).toBe(true);
    expect(evaluationStateMachine.canTransition("NEEDS_CHANGES", "RESUBMITTED")).toBe(true);
    expect(evaluationStateMachine.canTransition("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("rejects skipping straight from DRAFT to APPROVED", () => {
    expect(evaluationStateMachine.canTransition("DRAFT", "APPROVED")).toBe(false);
    expect(() => evaluationStateMachine.assertTransition("DRAFT", "APPROVED")).toThrow(IllegalStateTransitionError);
  });

  it("treats APPROVED and REJECTED as terminal", () => {
    expect(evaluationStateMachine.isTerminal("APPROVED")).toBe(true);
    expect(evaluationStateMachine.isTerminal("REJECTED")).toBe(true);
    expect(evaluationStateMachine.canTransition("APPROVED", "UNDER_REVIEW")).toBe(false);
  });

  it("allows CONDITIONALLY_APPROVED to resolve either way", () => {
    expect(evaluationStateMachine.canTransition("CONDITIONALLY_APPROVED", "APPROVED")).toBe(true);
    expect(evaluationStateMachine.canTransition("CONDITIONALLY_APPROVED", "REJECTED")).toBe(true);
  });

  it("rejects a self-transition", () => {
    expect(evaluationStateMachine.canTransition("UNDER_REVIEW", "UNDER_REVIEW")).toBe(false);
  });
});

describe("ADVANCE_TARGET", () => {
  it("has exactly one forward target for each administrative checkpoint", () => {
    expect(ADVANCE_TARGET.SUBMITTED).toBe("IDENTITY_CHECK");
    expect(ADVANCE_TARGET.IDENTITY_CHECK).toBe("UNDER_REVIEW");
    expect(ADVANCE_TARGET.RESUBMITTED).toBe("UNDER_REVIEW");
    expect(ADVANCE_TARGET.WAITLISTED).toBe("UNDER_REVIEW");
  });

  it("has no forward target for terminal or decision-only statuses", () => {
    expect(ADVANCE_TARGET.APPROVED).toBeUndefined();
    expect(ADVANCE_TARGET.REJECTED).toBeUndefined();
    expect(ADVANCE_TARGET.UNDER_REVIEW).toBeUndefined();
    expect(ADVANCE_TARGET.NEEDS_CHANGES).toBeUndefined();
  });
});

describe("toPartnerFacingStatus", () => {
  it("collapses every internal in-progress status to IN_REVIEW", () => {
    for (const status of ["DRAFT", "SUBMITTED", "IDENTITY_CHECK", "UNDER_REVIEW", "RESUBMITTED"] as const) {
      expect(toPartnerFacingStatus(status)).toBe("IN_REVIEW");
    }
  });

  it("passes through the partner-meaningful terminal statuses unchanged", () => {
    expect(toPartnerFacingStatus("NEEDS_CHANGES")).toBe("NEEDS_CHANGES");
    expect(toPartnerFacingStatus("APPROVED")).toBe("APPROVED");
    expect(toPartnerFacingStatus("CONDITIONALLY_APPROVED")).toBe("CONDITIONALLY_APPROVED");
    expect(toPartnerFacingStatus("WAITLISTED")).toBe("WAITLISTED");
    expect(toPartnerFacingStatus("REJECTED")).toBe("REJECTED");
  });
});
