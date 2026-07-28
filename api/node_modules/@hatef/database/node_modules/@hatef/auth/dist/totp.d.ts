/** New base32 TOTP secret for MFA enrollment. */
export declare function generateTotpSecret(): string;
/** RFC 6238 TOTP verification with a +/-1 step (30s) drift tolerance. */
export declare function verifyTotpCode(secret: string, code: string): boolean;
/** `otpauth://` URI for rendering an enrollment QR code. */
export declare function buildOtpAuthUri(secret: string, accountLabel: string, issuer: string): string;
//# sourceMappingURL=totp.d.ts.map