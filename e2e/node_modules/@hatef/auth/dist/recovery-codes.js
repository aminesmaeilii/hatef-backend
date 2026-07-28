"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecoveryCodes = generateRecoveryCodes;
exports.hashRecoveryCode = hashRecoveryCode;
exports.verifyRecoveryCode = verifyRecoveryCode;
const node_crypto_1 = require("node:crypto");
const DEFAULT_COUNT = 10;
const GROUP_SIZE = 4;
/** Generates high-entropy, human-typeable recovery codes like "a3f9-7k2p". */
function generateRecoveryCodes(count = DEFAULT_COUNT) {
    return Array.from({ length: count }, () => {
        const raw = (0, node_crypto_1.randomBytes)(6).toString("hex").slice(0, GROUP_SIZE * 2);
        return `${raw.slice(0, GROUP_SIZE)}-${raw.slice(GROUP_SIZE, GROUP_SIZE * 2)}`;
    });
}
/**
 * Hashed the same way as OTP codes: HMAC-SHA256 with a server-side pepper.
 * These are generated, high-entropy codes, not user-chosen secrets, so a
 * fast hash keyed by a pepper that never lives in the database is enough.
 */
function hashRecoveryCode(code, pepper) {
    return (0, node_crypto_1.createHmac)("sha256", pepper).update(code.toLowerCase()).digest("hex");
}
function verifyRecoveryCode(code, pepper, expectedHash) {
    return hashRecoveryCode(code, pepper) === expectedHash;
}
