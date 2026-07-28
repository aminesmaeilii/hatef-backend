"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTotpSecret = generateTotpSecret;
exports.verifyTotpCode = verifyTotpCode;
exports.buildOtpAuthUri = buildOtpAuthUri;
const otplib_1 = require("otplib");
/** New base32 TOTP secret for MFA enrollment. */
function generateTotpSecret() {
    return (0, otplib_1.generateSecret)();
}
/** RFC 6238 TOTP verification with a +/-1 step (30s) drift tolerance. */
function verifyTotpCode(secret, code) {
    try {
        return (0, otplib_1.verifySync)({ secret, token: code, epochTolerance: 1 }).valid;
    }
    catch {
        return false;
    }
}
/** `otpauth://` URI for rendering an enrollment QR code. */
function buildOtpAuthUri(secret, accountLabel, issuer) {
    return (0, otplib_1.generateURI)({ issuer, label: accountLabel, secret });
}
