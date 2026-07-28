/**
 * Derives a symmetric encryption key from an existing app secret (e.g.
 * SESSION_SECRET) so encrypting sensitive-at-rest data (TOTP secrets) needs
 * no additional required env var.
 */
export declare function deriveKey(secret: string, salt: string): Buffer;
/** AES-256-GCM encrypt. Returns `iv:authTag:ciphertext`, all base64url. */
export declare function encryptSecret(plainText: string, key: Buffer): string;
export declare function decryptSecret(encoded: string, key: Buffer): string;
//# sourceMappingURL=crypto.d.ts.map