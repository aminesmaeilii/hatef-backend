/** Raw opaque session token — this is what the cookie holds. */
export declare function generateSessionToken(): string;
/**
 * Only this hash is stored in AuthSession.tokenHash. A stolen DB row can't
 * be replayed as a cookie value, mirroring the OTP-hashing pattern (unlike
 * OTP, no pepper is needed here — the token itself is already 256 bits of
 * server-generated entropy, not a low-entropy user-facing code).
 */
export declare function hashSessionToken(token: string): string;
//# sourceMappingURL=session-token.d.ts.map