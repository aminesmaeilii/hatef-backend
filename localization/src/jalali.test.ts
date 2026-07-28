import { describe, expect, it } from "vitest";
import { formatJalali, fromJalali, toJalali } from "./jalali";

describe("Jalali conversion", () => {
  it("converts the Gregorian Nowruz epoch to 1403/01/01", () => {
    // 2024-03-20 is 1403-01-01 in the Jalali calendar (Tehran local date).
    const date = new Date("2024-03-20T00:00:00.000Z");
    expect(toJalali(date)).toEqual({ jy: 1403, jm: 1, jd: 1 });
  });

  it("round-trips Jalali -> Gregorian -> Jalali", () => {
    const original = { jy: 1403, jm: 6, jd: 15 };
    const gregorian = fromJalali(original);
    expect(toJalali(gregorian)).toEqual(original);
  });

  it("formats with the default separator", () => {
    expect(formatJalali(new Date("2024-03-20T00:00:00.000Z"))).toBe("1403/01/01");
  });
});
