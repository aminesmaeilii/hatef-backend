import { generateSecret, generateURI, verifySync } from "otplib";

/** New base32 TOTP secret for MFA enrollment. */
export function generateTotpSecret(): string {
  return generateSecret();
}

/** RFC 6238 TOTP verification with a +/-1 step (30s) drift tolerance. */
export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return verifySync({ secret, token: code, epochTolerance: 1 }).valid;
  } catch {
    return false;
  }
}

/** `otpauth://` URI for rendering an enrollment QR code. */
export function buildOtpAuthUri(secret: string, accountLabel: string, issuer: string): string {
  return generateURI({ issuer, label: accountLabel, secret });
}
