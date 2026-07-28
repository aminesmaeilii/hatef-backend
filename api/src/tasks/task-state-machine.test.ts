import { describe, expect, it } from "vitest";
import { IllegalStateTransitionError } from "@hatef/domain";
import { taskStateMachine } from "./task-state-machine";

describe("taskStateMachine", () => {
  it("allows the happy path from backlog to done", () => {
    const happyPath = ["BACKLOG", "READY", "IN_PROGRESS", "REVIEW", "DONE"] as const;
    for (let i = 0; i < happyPath.length - 1; i += 1) {
      expect(taskStateMachine.canTransition(happyPath[i]!, happyPath[i + 1]!)).toBe(true);
    }
  });

  it("allows a blocked loop back to in-progress", () => {
    expect(taskStateMachine.canTransition("IN_PROGRESS", "BLOCKED")).toBe(true);
    expect(taskStateMachine.canTransition("BLOCKED", "IN_PROGRESS")).toBe(true);
  });

  it("allows reopening a done task", () => {
    expect(taskStateMachine.canTransition("DONE", "IN_PROGRESS")).toBe(true);
  });

  it("allows cancellation from every non-terminal state", () => {
    for (const state of ["BACKLOG", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW"] as const) {
      expect(taskStateMachine.canTransition(state, "CANCELLED")).toBe(true);
    }
  });

  it("rejects skipping straight from backlog to done", () => {
    expect(taskStateMachine.canTransition("BACKLOG", "DONE")).toBe(false);
    expect(() => taskStateMachine.assertTransition("BACKLOG", "DONE")).toThrow(IllegalStateTransitionError);
  });

  it("treats CANCELLED as terminal", () => {
    expect(taskStateMachine.isTerminal("CANCELLED")).toBe(true);
  });
});
