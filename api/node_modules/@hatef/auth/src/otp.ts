import { createHmac, randomInt } from "node:crypto";

const OTP_LENGTH = 6;

/** Generates a random numeric OTP code, e.g. "042817". */
export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

/**
 * Hashes an OTP code with a server-side pepper (HMAC-SHA256, not Argon2).
 * A slow hash isn't needed here: the pepper lives only in env, never in the
 * database, so a stolen DB row alone can't be brute-forced offline. Online
 * guessing is stopped by the attempt limit and short expiry, not by hash cost.
 */
export function hashOtpCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code).digest("hex");
}

export function verifyOtpCode(code: string, pepper: string, expectedHash: string): boolean {
  return hashOtpCode(code, pepper) === expectedHash;
}
