import { describe, expect, it } from "vitest";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "./otp";

describe("otp", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("verifies a code against its own hash", () => {
    const hash = hashOtpCode("042817", "pepper");
    expect(verifyOtpCode("042817", "pepper", hash)).toBe(true);
  });

  it("rejects the wrong code", () => {
    const hash = hashOtpCode("042817", "pepper");
    expect(verifyOtpCode("000000", "pepper", hash)).toBe(false);
  });

  it("rejects the right code with the wrong pepper", () => {
    const hash = hashOtpCode("042817", "pepper");
    expect(verifyOtpCode("042817", "other-pepper", hash)).toBe(false);
  });
});
