import { describe, expect, it } from "vitest";
import { InvalidIranianMobileError, isValidIranianMobile, maskMobile, normalizeIranianMobile } from "./phone";

describe("normalizeIranianMobile", () => {
  it("normalizes a local 0-prefixed number", () => {
    expect(normalizeIranianMobile("09121234567")).toBe("+989121234567");
  });

  it("normalizes a +98-prefixed number", () => {
    expect(normalizeIranianMobile("+989121234567")).toBe("+989121234567");
  });

  it("normalizes a 0098-prefixed number", () => {
    expect(normalizeIranianMobile("00989121234567")).toBe("+989121234567");
  });

  it("normalizes Persian digits with spaces and dashes", () => {
    expect(normalizeIranianMobile("۰۹۱۲-۱۲۳ ۴۵۶۷")).toBe("+989121234567");
  });

  it("rejects a landline-shaped number", () => {
    expect(() => normalizeIranianMobile("02112345678")).toThrow(InvalidIranianMobileError);
  });

  it("rejects garbage input", () => {
    expect(isValidIranianMobile("not-a-phone")).toBe(false);
  });

  it("masks a normalized mobile number for logs", () => {
    expect(maskMobile("+989121234567")).toBe("+9891****567");
  });
});
