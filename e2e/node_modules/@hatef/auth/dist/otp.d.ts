/** Generates a random numeric OTP code, e.g. "042817". */
export declare function generateOtpCode(): string;
/**
 * Hashes an OTP code with a server-side pepper (HMAC-SHA256, not Argon2).
 * A slow hash isn't needed here: the pepper lives only in env, never in the
 * database, so a stolen DB row alone can't be brute-forced offline. Online
 * guessing is stopped by the attempt limit and short expiry, not by hash cost.
 */
export declare function hashOtpCode(code: string, pepper: string): string;
export declare function verifyOtpCode(code: string, pepper: string, expectedHash: string): boolean;
//# sourceMappingURL=otp.d.ts.map