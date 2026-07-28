import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

/**
 * Derives a symmetric encryption key from an existing app secret (e.g.
 * SESSION_SECRET) so encrypting sensitive-at-rest data (TOTP secrets) needs
 * no additional required env var.
 */
export function deriveKey(secret: string, salt: string): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

/** AES-256-GCM encrypt. Returns `iv:authTag:ciphertext`, all base64url. */
export function encryptSecret(plainText: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptSecret(encoded: string, key: Buffer): string {
  const [ivPart, authTagPart, ciphertextPart] = encoded.split(":");
  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Malformed encrypted secret");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
