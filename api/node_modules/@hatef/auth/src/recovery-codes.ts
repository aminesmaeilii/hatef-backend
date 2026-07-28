import { randomBytes, createHmac } from "node:crypto";

const DEFAULT_COUNT = 10;
const GROUP_SIZE = 4;

/** Generates high-entropy, human-typeable recovery codes like "a3f9-7k2p". */
export function generateRecoveryCodes(count = DEFAULT_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(6).toString("hex").slice(0, GROUP_SIZE * 2);
    return `${raw.slice(0, GROUP_SIZE)}-${raw.slice(GROUP_SIZE, GROUP_SIZE * 2)}`;
  });
}

/**
 * Hashed the same way as OTP codes: HMAC-SHA256 with a server-side pepper.
 * These are generated, high-entropy codes, not user-chosen secrets, so a
 * fast hash keyed by a pepper that never lives in the database is enough.
 */
export function hashRecoveryCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code.toLowerCase()).digest("hex");
}

export function verifyRecoveryCode(code: string, pepper: string, expectedHash: string): boolean {
  return hashRecoveryCode(code, pepper) === expectedHash;
}
