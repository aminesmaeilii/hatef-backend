import { describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import { buildOtpAuthUri, generateTotpSecret, verifyTotpCode } from "./totp";

describe("totp", () => {
  it("generates a usable base32 secret", () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThan(0);
  });

  it("verifies a code generated for the same secret", () => {
    const secret = generateTotpSecret();
    const code = generateSync({ secret });
    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it("rejects a code generated for a different secret", () => {
    const secret = generateTotpSecret();
    const otherCode = generateSync({ secret: generateTotpSecret() });
    expect(verifyTotpCode(secret, otherCode)).toBe(false);
  });

  it("rejects garbage input instead of throwing", () => {
    expect(verifyTotpCode("not-a-real-secret", "000000")).toBe(false);
  });

  it("builds an otpauth:// URI with the issuer and account", () => {
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri(secret, "admin@hatef.example", "Hatef");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("Hatef");
  });
});
