export declare class IllegalStateTransitionError extends Error {
    readonly from: string;
    readonly to: string;
    constructor(from: string, to: string);
}
export type TransitionMap<TState extends string> = Record<TState, readonly TState[]>;
/**
 * A minimal, dependency-free finite-state machine used to enforce every
 * workflow's legal transitions on the backend (assessment cases, support
 * requests, obligations, tasks, tickets, ...). Definitions are plain data so
 * they can be unit-tested in isolation from any persistence concern.
 */
export declare class StateMachine<TState extends string> {
    private readonly transitions;
    constructor(transitions: TransitionMap<TState>);
    canTransition(from: TState, to: TState): boolean;
    assertTransition(from: TState, to: TState): void;
    transition(from: TState, to: TState): TState;
    allowedNextStates(from: TState): readonly TState[];
    isTerminal(state: TState): boolean;
}
//# sourceMappingURL=state-machine.d.ts.map