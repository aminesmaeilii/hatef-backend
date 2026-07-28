import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError, StateMachine } from "./state-machine";

type TicketStatus = "NEW" | "OPEN" | "RESOLVED" | "CLOSED";

const ticketMachine = new StateMachine<TicketStatus>({
  NEW: ["OPEN"],
  OPEN: ["RESOLVED"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: [],
});

describe("StateMachine", () => {
  it("allows a defined transition", () => {
    expect(ticketMachine.canTransition("NEW", "OPEN")).toBe(true);
    expect(ticketMachine.transition("NEW", "OPEN")).toBe("OPEN");
  });

  it("rejects an undefined transition", () => {
    expect(ticketMachine.canTransition("NEW", "CLOSED")).toBe(false);
    expect(() => ticketMachine.assertTransition("NEW", "CLOSED")).toThrow(IllegalStateTransitionError);
  });

  it("rejects a self-transition", () => {
    expect(ticketMachine.canTransition("OPEN", "OPEN")).toBe(false);
  });

  it("identifies terminal states", () => {
    expect(ticketMachine.isTerminal("CLOSED")).toBe(true);
    expect(ticketMachine.isTerminal("NEW")).toBe(false);
  });
});
