import { describe, expect, it } from "vitest";
import { findSchedulingConflicts, findTaskDateConflicts } from "./scheduling";

function d(iso: string): Date {
  return new Date(iso);
}

describe("findSchedulingConflicts", () => {
  it("returns no conflicts when the operator has spare capacity", () => {
    const existing = [{ id: "a", startAt: d("2026-08-01T08:00:00Z"), endAt: d("2026-08-01T10:00:00Z") }];
    const candidate = { startAt: d("2026-08-01T09:00:00Z"), endAt: d("2026-08-01T11:00:00Z") };
    expect(findSchedulingConflicts(existing, candidate, 2)).toEqual([]);
  });

  it("flags a conflict when capacity is exhausted by overlapping schedules", () => {
    const existing = [{ id: "a", startAt: d("2026-08-01T08:00:00Z"), endAt: d("2026-08-01T10:00:00Z") }];
    const candidate = { startAt: d("2026-08-01T09:00:00Z"), endAt: d("2026-08-01T11:00:00Z") };
    const conflicts = findSchedulingConflicts(existing, candidate, 1);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.id).toBe("a");
  });

  it("does not count a back-to-back, non-overlapping schedule as a conflict", () => {
    const existing = [{ id: "a", startAt: d("2026-08-01T08:00:00Z"), endAt: d("2026-08-01T10:00:00Z") }];
    const candidate = { startAt: d("2026-08-01T10:00:00Z"), endAt: d("2026-08-01T12:00:00Z") };
    expect(findSchedulingConflicts(existing, candidate, 1)).toEqual([]);
  });

  it("only counts overlapping schedules toward capacity, not the total count", () => {
    const existing = [
      { id: "a", startAt: d("2026-08-01T08:00:00Z"), endAt: d("2026-08-01T09:00:00Z") },
      { id: "b", startAt: d("2026-08-02T08:00:00Z"), endAt: d("2026-08-02T09:00:00Z") },
    ];
    const candidate = { startAt: d("2026-08-01T08:30:00Z"), endAt: d("2026-08-01T09:30:00Z") };
    // Only "a" overlaps; "b" is a different day entirely.
    const conflicts = findSchedulingConflicts(existing, candidate, 1);
    expect(conflicts.map((c) => c.id)).toEqual(["a"]);
  });

  it("rejects a candidate interval where end is not after start", () => {
    expect(() => findSchedulingConflicts([], { startAt: d("2026-08-01T10:00:00Z"), endAt: d("2026-08-01T09:00:00Z") }, 1)).toThrow(
      RangeError,
    );
  });
});

describe("findTaskDateConflicts", () => {
  it("flags a due date before the start date", () => {
    const conflicts = findTaskDateConflicts({ startDate: d("2026-08-05"), dueDate: d("2026-08-01") }, []);
    expect(conflicts).toEqual([{ reason: "DUE_BEFORE_START" }]);
  });

  it("flags starting before an unfinished dependency's due date", () => {
    const conflicts = findTaskDateConflicts({ startDate: d("2026-08-01"), dueDate: d("2026-08-10") }, [
      { taskId: "dep-1", dueDate: d("2026-08-05") },
    ]);
    expect(conflicts).toEqual([{ reason: "STARTS_BEFORE_DEPENDENCY_DUE", dependencyTaskId: "dep-1" }]);
  });

  it("allows starting on or after every dependency's due date", () => {
    const conflicts = findTaskDateConflicts({ startDate: d("2026-08-05"), dueDate: d("2026-08-10") }, [
      { taskId: "dep-1", dueDate: d("2026-08-05") },
    ]);
    expect(conflicts).toEqual([]);
  });

  it("treats a dependency with no due date as imposing no constraint", () => {
    const conflicts = findTaskDateConflicts({ startDate: d("2026-08-01"), dueDate: null }, [{ taskId: "dep-1", dueDate: null }]);
    expect(conflicts).toEqual([]);
  });

  it("reports every violated dependency, not just the first", () => {
    const conflicts = findTaskDateConflicts({ startDate: d("2026-08-01"), dueDate: null }, [
      { taskId: "dep-1", dueDate: d("2026-08-05") },
      { taskId: "dep-2", dueDate: d("2026-08-10") },
    ]);
    expect(conflicts).toHaveLength(2);
  });
});
