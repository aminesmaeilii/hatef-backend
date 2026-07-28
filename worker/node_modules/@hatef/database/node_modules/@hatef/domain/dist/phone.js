"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidIranianMobileError = void 0;
exports.normalizeIranianMobile = normalizeIranianMobile;
exports.isValidIranianMobile = isValidIranianMobile;
exports.maskMobile = maskMobile;
const localization_1 = require("@hatef/localization");
class InvalidIranianMobileError extends Error {
    rawInput;
    constructor(rawInput) {
        super("Invalid Iranian mobile number");
        this.rawInput = rawInput;
        this.name = "InvalidIranianMobileError";
    }
}
exports.InvalidIranianMobileError = InvalidIranianMobileError;
const CLEAN_PATTERN = /[\s\-()]/g;
/**
 * Normalizes an Iranian mobile number to canonical E.164 form (+989XXXXXXXXX).
 * Accepts Persian/Arabic-Indic digits and the 0098 / +98 / 98 / 0 prefixes
 * users commonly type. Throws InvalidIranianMobileError for anything else.
 */
function normalizeIranianMobile(rawInput) {
    const latin = (0, localization_1.toLatinDigits)(rawInput).replace(CLEAN_PATTERN, "");
    let local = latin;
    if (local.startsWith("+98")) {
        local = local.slice(3);
    }
    else if (local.startsWith("0098")) {
        local = local.slice(4);
    }
    else if (local.startsWith("98")) {
        local = local.slice(2);
    }
    else if (local.startsWith("0")) {
        local = local.slice(1);
    }
    if (!/^9\d{9}$/.test(local)) {
        throw new InvalidIranianMobileError(rawInput);
    }
    return `+98${local}`;
}
function isValidIranianMobile(rawInput) {
    try {
        normalizeIranianMobile(rawInput);
        return true;
    }
    catch {
        return false;
    }
}
/** Masks a normalized mobile number for display/audit logs: +989121234567 -> +9891****567 */
function maskMobile(normalizedMobile) {
    if (normalizedMobile.length < 8)
        return normalizedMobile;
    const prefix = normalizedMobile.slice(0, 5);
    const suffix = normalizedMobile.slice(-3);
    return `${prefix}****${suffix}`;
}
