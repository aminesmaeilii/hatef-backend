import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "@hatef/domain";
import { obligationStateMachine } from "./obligation-state-machine";

describe("obligationStateMachine", () => {
  it("allows the happy path: propose -> accept -> deliver -> approve -> settle", () => {
    expect(obligationStateMachine.canTransition("PROPOSED", "ACCEPTED")).toBe(true);
    expect(obligationStateMachine.canTransition("ACCEPTED", "IN_PROGRESS")).toBe(true);
    expect(obligationStateMachine.canTransition("IN_PROGRESS", "SUBMITTED")).toBe(true);
    expect(obligationStateMachine.canTransition("SUBMITTED", "APPROVED")).toBe(true);
    expect(obligationStateMachine.canTransition("APPROVED", "SETTLED")).toBe(true);
  });

  it("allows negotiation before acceptance", () => {
    expect(obligationStateMachine.canTransition("PROPOSED", "NEGOTIATING")).toBe(true);
    expect(obligationStateMachine.canTransition("NEGOTIATING", "PROPOSED")).toBe(true);
    expect(obligationStateMachine.canTransition("NEGOTIATING", "ACCEPTED")).toBe(true);
  });

  it("allows partial approval to loop back for more deliverables or go straight to settlement", () => {
    expect(obligationStateMachine.canTransition("PARTIALLY_APPROVED", "SUBMITTED")).toBe(true);
    expect(obligationStateMachine.canTransition("PARTIALLY_APPROVED", "SETTLED")).toBe(true);
  });

  it("rejects skipping straight from PROPOSED to SETTLED", () => {
    expect(obligationStateMachine.canTransition("PROPOSED", "SETTLED")).toBe(false);
    expect(() => obligationStateMachine.assertTransition("PROPOSED", "SETTLED")).toThrow(IllegalStateTransitionError);
  });

  it("rejects any transition out of a settled-then-cancelled or cancelled state", () => {
    expect(obligationStateMachine.isTerminal("CANCELLED")).toBe(true);
    expect(obligationStateMachine.canTransition("CANCELLED", "PROPOSED")).toBe(false);
  });

  it("allows a dispute after settlement, and its resolution back into an approval state", () => {
    expect(obligationStateMachine.canTransition("SETTLED", "DISPUTED")).toBe(true);
    expect(obligationStateMachine.canTransition("DISPUTED", "APPROVED")).toBe(true);
    expect(obligationStateMachine.canTransition("DISPUTED", "PARTIALLY_APPROVED")).toBe(true);
  });
});
