export interface ScheduleInterval {
    id: string;
    startAt: Date;
    endAt: Date;
}
export interface CandidateInterval {
    startAt: Date;
    endAt: Date;
}
/**
 * An operator (or capacity resource) may run at most `capacity` overlapping
 * promotions at once. Returns the existing schedules the candidate interval
 * would conflict with — empty means the candidate is safe to book. Pure and
 * deterministic so it's unit-testable without a database.
 */
export declare function findSchedulingConflicts(existing: ScheduleInterval[], candidate: CandidateInterval, capacity: number): ScheduleInterval[];
export interface TaskDateCandidate {
    startDate: Date | null;
    dueDate: Date | null;
}
export interface TaskDependencyDue {
    taskId: string;
    dueDate: Date | null;
}
export interface TaskDateConflict {
    reason: "DUE_BEFORE_START" | "STARTS_BEFORE_DEPENDENCY_DUE";
    dependencyTaskId?: string;
}
/**
 * A task cannot be due before it starts, and cannot start before every task
 * it depends on is due (spec 14.3's dependency requirement, and what gives
 * the Gantt's "invalid drag" case real content). A dependency with no due
 * date imposes no constraint — unknown is not a conflict.
 */
export declare function findTaskDateConflicts(candidate: TaskDateCandidate, dependencies: TaskDependencyDue[]): TaskDateConflict[];
//# sourceMappingURL=scheduling.d.ts.map