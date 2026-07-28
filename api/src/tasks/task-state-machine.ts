import { StateMachine } from "@hatef/domain";
import type { TaskStatusKey } from "@hatef/contracts";

/** Spec 14.1's 7 task states. CANCELLED is reachable from anywhere except itself; DONE can be reopened back to IN_PROGRESS. */
export const taskStateMachine = new StateMachine<TaskStatusKey>({
  BACKLOG: ["READY", "CANCELLED"],
  READY: ["IN_PROGRESS", "BACKLOG", "CANCELLED"],
  IN_PROGRESS: ["BLOCKED", "REVIEW", "CANCELLED"],
  BLOCKED: ["IN_PROGRESS", "CANCELLED"],
  REVIEW: ["DONE", "IN_PROGRESS", "CANCELLED"],
  DONE: ["IN_PROGRESS"],
  CANCELLED: [],
});
