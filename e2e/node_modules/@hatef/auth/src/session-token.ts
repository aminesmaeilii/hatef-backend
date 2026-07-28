import { randomBytes, createHash } from "node:crypto";

/** Raw opaque session token — this is what the cookie holds. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Only this hash is stored in AuthSession.tokenHash. A stolen DB row can't
 * be replayed as a cookie value, mirroring the OTP-hashing pattern (unlike
 * OTP, no pepper is needed here — the token itself is already 256 bits of
 * server-generated entropy, not a low-entropy user-facing code).
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
