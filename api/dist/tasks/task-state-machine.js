"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskStateMachine = void 0;
const domain_1 = require("@hatef/domain");
/** Spec 14.1's 7 task states. CANCELLED is reachable from anywhere except itself; DONE can be reopened back to IN_PROGRESS. */
exports.taskStateMachine = new domain_1.StateMachine({
    BACKLOG: ["READY", "CANCELLED"],
    READY: ["IN_PROGRESS", "BACKLOG", "CANCELLED"],
    IN_PROGRESS: ["BLOCKED", "REVIEW", "CANCELLED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    REVIEW: ["DONE", "IN_PROGRESS", "CANCELLED"],
    DONE: ["IN_PROGRESS"],
    CANCELLED: [],
});
