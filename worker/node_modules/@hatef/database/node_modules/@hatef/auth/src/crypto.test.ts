import { describe, expect, it } from "vitest";
import { decryptSecret, deriveKey, encryptSecret } from "./crypto";

describe("crypto", () => {
  it("round-trips plaintext through encrypt/decrypt", () => {
    const key = deriveKey("some-app-secret", "mfa-secret");
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP", key);
    expect(decryptSecret(encrypted, key)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const key = deriveKey("some-app-secret", "mfa-secret");
    expect(encryptSecret("same-input", key)).not.toBe(encryptSecret("same-input", key));
  });

  it("fails to decrypt with the wrong key", () => {
    const key = deriveKey("some-app-secret", "mfa-secret");
    const otherKey = deriveKey("a-different-secret", "mfa-secret");
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP", key);
    expect(() => decryptSecret(encrypted, otherKey)).toThrow();
  });
});
