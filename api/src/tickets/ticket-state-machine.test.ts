import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "@hatef/domain";
import { ticketStateMachine } from "./ticket-state-machine";

describe("ticketStateMachine", () => {
  it("allows the happy path: new -> open -> waiting for partner -> resolved -> closed", () => {
    expect(ticketStateMachine.canTransition("NEW", "OPEN")).toBe(true);
    expect(ticketStateMachine.canTransition("OPEN", "WAITING_FOR_PARTNER")).toBe(true);
    expect(ticketStateMachine.canTransition("WAITING_FOR_PARTNER", "RESOLVED")).toBe(true);
    expect(ticketStateMachine.canTransition("RESOLVED", "CLOSED")).toBe(true);
  });

  it("allows the ball to bounce between waiting states", () => {
    expect(ticketStateMachine.canTransition("WAITING_FOR_PARTNER", "WAITING_FOR_HATEF")).toBe(true);
    expect(ticketStateMachine.canTransition("WAITING_FOR_HATEF", "WAITING_FOR_PARTNER")).toBe(true);
  });

  it("only escapes CLOSED via REOPENED, never directly back to an active state", () => {
    expect(ticketStateMachine.canTransition("CLOSED", "OPEN")).toBe(false);
    expect(ticketStateMachine.canTransition("CLOSED", "REOPENED")).toBe(true);
    expect(() => ticketStateMachine.assertTransition("CLOSED", "OPEN")).toThrow(IllegalStateTransitionError);
  });

  it("allows a reopened ticket back into any live state", () => {
    expect(ticketStateMachine.canTransition("REOPENED", "OPEN")).toBe(true);
    expect(ticketStateMachine.canTransition("REOPENED", "WAITING_FOR_HATEF")).toBe(true);
  });

  it("rejects skipping straight from NEW to REOPENED", () => {
    expect(ticketStateMachine.canTransition("NEW", "REOPENED")).toBe(false);
  });
});
