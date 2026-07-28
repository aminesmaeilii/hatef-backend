export interface ScheduleInterval {
  id: string;
  startAt: Date;
  endAt: Date;
}

export interface CandidateInterval {
  startAt: Date;
  endAt: Date;
}

function overlaps(a: { startAt: Date; endAt: Date }, b: { startAt: Date; endAt: Date }): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

/**
 * An operator (or capacity resource) may run at most `capacity` overlapping
 * promotions at once. Returns the existing schedules the candidate interval
 * would conflict with — empty means the candidate is safe to book. Pure and
 * deterministic so it's unit-testable without a database.
 */
export function findSchedulingConflicts(
  existing: ScheduleInterval[],
  candidate: CandidateInterval,
  capacity: number,
): ScheduleInterval[] {
  if (candidate.endAt <= candidate.startAt) {
    throw new RangeError("candidate.endAt must be after candidate.startAt");
  }
  if (capacity < 1) {
    throw new RangeError("capacity must be at least 1");
  }

  const overlapping = existing.filter((interval) => overlaps(interval, candidate));
  if (overlapping.length < capacity) {
    return [];
  }
  return overlapping;
}

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
export function findTaskDateConflicts(candidate: TaskDateCandidate, dependencies: TaskDependencyDue[]): TaskDateConflict[] {
  const conflicts: TaskDateConflict[] = [];

  if (candidate.startDate && candidate.dueDate && candidate.dueDate < candidate.startDate) {
    conflicts.push({ reason: "DUE_BEFORE_START" });
  }

  if (candidate.startDate) {
    for (const dependency of dependencies) {
      if (dependency.dueDate && candidate.startDate < dependency.dueDate) {
        conflicts.push({ reason: "STARTS_BEFORE_DEPENDENCY_DUE", dependencyTaskId: dependency.taskId });
      }
    }
  }

  return conflicts;
}
