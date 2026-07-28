"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpCode = generateOtpCode;
exports.hashOtpCode = hashOtpCode;
exports.verifyOtpCode = verifyOtpCode;
const node_crypto_1 = require("node:crypto");
const OTP_LENGTH = 6;
/** Generates a random numeric OTP code, e.g. "042817". */
function generateOtpCode() {
    return (0, node_crypto_1.randomInt)(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}
/**
 * Hashes an OTP code with a server-side pepper (HMAC-SHA256, not Argon2).
 * A slow hash isn't needed here: the pepper lives only in env, never in the
 * database, so a stolen DB row alone can't be brute-forced offline. Online
 * guessing is stopped by the attempt limit and short expiry, not by hash cost.
 */
function hashOtpCode(code, pepper) {
    return (0, node_crypto_1.createHmac)("sha256", pepper).update(code).digest("hex");
}
function verifyOtpCode(code, pepper, expectedHash) {
    return hashOtpCode(code, pepper) === expectedHash;
}
