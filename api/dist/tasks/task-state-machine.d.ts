import { StateMachine } from "@hatef/domain";
/** Spec 14.1's 7 task states. CANCELLED is reachable from anywhere except itself; DONE can be reopened back to IN_PROGRESS. */
export declare const taskStateMachine: StateMachine<"CANCELLED" | "IN_PROGRESS" | "BACKLOG" | "READY" | "BLOCKED" | "REVIEW" | "DONE">;
//# sourceMappingURL=task-state-machine.d.ts.map