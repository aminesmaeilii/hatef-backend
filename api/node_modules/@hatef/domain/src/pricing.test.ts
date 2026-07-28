import { describe, expect, it } from "vitest";
import { calculatePinPrice } from "./pricing";
import { rial } from "./money";

describe("calculatePinPrice", () => {
  it("computes the nationwide 240 rial/view formula (spec 13.1)", () => {
    const result = calculatePinPrice({ requestedUniqueViews: 10_000, ratePerViewRial: rial(240) });
    expect(result.finalAmountRial).toBe(2_400_000n);
    expect(result.baseAmountRial).toBe(2_400_000n);
  });

  it("computes the provincial 480 rial/view formula (spec 13.1)", () => {
    const result = calculatePinPrice({ requestedUniqueViews: 10_000, ratePerViewRial: rial(480) });
    expect(result.finalAmountRial).toBe(4_800_000n);
  });

  it("applies an optional discount before the multiplier", () => {
    const result = calculatePinPrice({
      requestedUniqueViews: 1_000,
      ratePerViewRial: rial(240),
      discountRial: rial(10_000),
    });
    expect(result.baseAmountRial).toBe(240_000n);
    expect(result.afterDiscountRial).toBe(230_000n);
    expect(result.finalAmountRial).toBe(230_000n);
  });

  it("applies an optional integer-percent multiplier with no float rounding", () => {
    const result = calculatePinPrice({
      requestedUniqueViews: 1_000,
      ratePerViewRial: rial(240),
      multiplierPercent: 90,
    });
    expect(result.finalAmountRial).toBe(216_000n);
  });

  it("clamps to a configured minimum", () => {
    const result = calculatePinPrice({
      requestedUniqueViews: 10,
      ratePerViewRial: rial(240),
      minAmountRial: rial(50_000),
    });
    expect(result.baseAmountRial).toBe(2_400n);
    expect(result.finalAmountRial).toBe(50_000n);
  });

  it("clamps to a configured cap", () => {
    const result = calculatePinPrice({
      requestedUniqueViews: 1_000_000,
      ratePerViewRial: rial(480),
      capAmountRial: rial(100_000_000),
    });
    expect(result.finalAmountRial).toBe(100_000_000n);
  });

  it("rejects a discount larger than the base amount", () => {
    expect(() =>
      calculatePinPrice({ requestedUniqueViews: 100, ratePerViewRial: rial(240), discountRial: rial(1_000_000) }),
    ).toThrow(RangeError);
  });

  it("rejects a non-integer or negative view count", () => {
    expect(() => calculatePinPrice({ requestedUniqueViews: -1, ratePerViewRial: rial(240) })).toThrow(TypeError);
    expect(() => calculatePinPrice({ requestedUniqueViews: 1.5, ratePerViewRial: rial(240) })).toThrow(TypeError);
  });

  it("is pure and deterministic — the same input snapshot always reproduces the same output", () => {
    const input = { requestedUniqueViews: 12_345, ratePerViewRial: rial(240), discountRial: rial(1_000), multiplierPercent: 95 };
    const first = calculatePinPrice(input);
    const second = calculatePinPrice(input);
    expect(second).toEqual(first);
  });
});
