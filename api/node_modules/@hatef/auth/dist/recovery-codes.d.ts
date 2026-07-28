/** Generates high-entropy, human-typeable recovery codes like "a3f9-7k2p". */
export declare function generateRecoveryCodes(count?: number): string[];
/**
 * Hashed the same way as OTP codes: HMAC-SHA256 with a server-side pepper.
 * These are generated, high-entropy codes, not user-chosen secrets, so a
 * fast hash keyed by a pepper that never lives in the database is enough.
 */
export declare function hashRecoveryCode(code: string, pepper: string): string;
export declare function verifyRecoveryCode(code: string, pepper: string, expectedHash: string): boolean;
//# sourceMappingURL=recovery-codes.d.ts.map