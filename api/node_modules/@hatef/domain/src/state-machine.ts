export class IllegalStateTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Illegal state transition: ${from} -> ${to}`);
    this.name = "IllegalStateTransitionError";
  }
}

export type TransitionMap<TState extends string> = Record<TState, readonly TState[]>;

/**
 * A minimal, dependency-free finite-state machine used to enforce every
 * workflow's legal transitions on the backend (assessment cases, support
 * requests, obligations, tasks, tickets, ...). Definitions are plain data so
 * they can be unit-tested in isolation from any persistence concern.
 */
export class StateMachine<TState extends string> {
  constructor(private readonly transitions: TransitionMap<TState>) {}

  canTransition(from: TState, to: TState): boolean {
    if (from === to) return false;
    return this.transitions[from]?.includes(to) ?? false;
  }

  assertTransition(from: TState, to: TState): void {
    if (!this.canTransition(from, to)) {
      throw new IllegalStateTransitionError(from, to);
    }
  }

  transition(from: TState, to: TState): TState {
    this.assertTransition(from, to);
    return to;
  }

  allowedNextStates(from: TState): readonly TState[] {
    return this.transitions[from] ?? [];
  }

  isTerminal(state: TState): boolean {
    return this.allowedNextStates(state).length === 0;
  }
}
