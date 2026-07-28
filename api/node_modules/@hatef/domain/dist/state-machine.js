"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = exports.IllegalStateTransitionError = void 0;
class IllegalStateTransitionError extends Error {
    from;
    to;
    constructor(from, to) {
        super(`Illegal state transition: ${from} -> ${to}`);
        this.from = from;
        this.to = to;
        this.name = "IllegalStateTransitionError";
    }
}
exports.IllegalStateTransitionError = IllegalStateTransitionError;
/**
 * A minimal, dependency-free finite-state machine used to enforce every
 * workflow's legal transitions on the backend (assessment cases, support
 * requests, obligations, tasks, tickets, ...). Definitions are plain data so
 * they can be unit-tested in isolation from any persistence concern.
 */
class StateMachine {
    transitions;
    constructor(transitions) {
        this.transitions = transitions;
    }
    canTransition(from, to) {
        if (from === to)
            return false;
        return this.transitions[from]?.includes(to) ?? false;
    }
    assertTransition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new IllegalStateTransitionError(from, to);
        }
    }
    transition(from, to) {
        this.assertTransition(from, to);
        return to;
    }
    allowedNextStates(from) {
        return this.transitions[from] ?? [];
    }
    isTerminal(state) {
        return this.allowedNextStates(state).length === 0;
    }
}
exports.StateMachine = StateMachine;
