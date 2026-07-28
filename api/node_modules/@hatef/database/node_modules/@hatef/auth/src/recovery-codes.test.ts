import { describe, expect, it } from "vitest";
import { generateRecoveryCodes, hashRecoveryCode, verifyRecoveryCode } from "./recovery-codes";

describe("recovery-codes", () => {
  it("generates the requested count of unique codes", () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("formats codes as two hyphenated groups", () => {
    const [code] = generateRecoveryCodes(1);
    expect(code).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}$/);
  });

  it("verifies case-insensitively", () => {
    const [code] = generateRecoveryCodes(1);
    const hash = hashRecoveryCode(code, "pepper");
    expect(verifyRecoveryCode(code.toUpperCase(), "pepper", hash)).toBe(true);
  });

  it("rejects a different code", () => {
    const hash = hashRecoveryCode("aaaa-bbbb", "pepper");
    expect(verifyRecoveryCode("aaaa-cccc", "pepper", hash)).toBe(false);
  });
});
