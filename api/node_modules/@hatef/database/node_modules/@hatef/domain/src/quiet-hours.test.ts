import { describe, expect, it } from "vitest";
import { isWithinQuietHours } from "./quiet-hours";

describe("isWithinQuietHours", () => {
  it("handles a same-day window", () => {
    const window = { startHour: 9, endHour: 17 };
    expect(isWithinQuietHours(8, window)).toBe(false);
    expect(isWithinQuietHours(9, window)).toBe(true);
    expect(isWithinQuietHours(16, window)).toBe(true);
    expect(isWithinQuietHours(17, window)).toBe(false);
  });

  it("handles a window that wraps past midnight", () => {
    const window = { startHour: 22, endHour: 7 };
    expect(isWithinQuietHours(23, window)).toBe(true);
    expect(isWithinQuietHours(0, window)).toBe(true);
    expect(isWithinQuietHours(6, window)).toBe(true);
    expect(isWithinQuietHours(7, window)).toBe(false);
    expect(isWithinQuietHours(12, window)).toBe(false);
  });

  it("treats an identical start/end hour as covering the whole day", () => {
    expect(isWithinQuietHours(0, { startHour: 5, endHour: 5 })).toBe(true);
    expect(isWithinQuietHours(23, { startHour: 5, endHour: 5 })).toBe(true);
  });

  it("rejects an out-of-range hour", () => {
    expect(() => isWithinQuietHours(24, { startHour: 0, endHour: 1 })).toThrow(RangeError);
    expect(() => isWithinQuietHours(-1, { startHour: 0, endHour: 1 })).toThrow(RangeError);
  });
});
