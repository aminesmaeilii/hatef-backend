"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKey = deriveKey;
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const node_crypto_1 = require("node:crypto");
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
/**
 * Derives a symmetric encryption key from an existing app secret (e.g.
 * SESSION_SECRET) so encrypting sensitive-at-rest data (TOTP secrets) needs
 * no additional required env var.
 */
function deriveKey(secret, salt) {
    return (0, node_crypto_1.scryptSync)(secret, salt, KEY_LENGTH);
}
/** AES-256-GCM encrypt. Returns `iv:authTag:ciphertext`, all base64url. */
function encryptSecret(plainText, key) {
    const iv = (0, node_crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, node_crypto_1.createCipheriv)(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}
function decryptSecret(encoded, key) {
    const [ivPart, authTagPart, ciphertextPart] = encoded.split(":");
    if (!ivPart || !authTagPart || !ciphertextPart) {
        throw new Error("Malformed encrypted secret");
    }
    const decipher = (0, node_crypto_1.createDecipheriv)(ALGORITHM, key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, "base64url")),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}
