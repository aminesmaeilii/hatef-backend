"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEitaaIdError = void 0;
exports.normalizeEitaaId = normalizeEitaaId;
exports.isValidEitaaId = isValidEitaaId;
exports.toEitaaUrl = toEitaaUrl;
const localization_1 = require("@hatef/localization");
class InvalidEitaaIdError extends Error {
    rawInput;
    constructor(rawInput) {
        super("Invalid Eitaa channel identifier");
        this.rawInput = rawInput;
        this.name = "InvalidEitaaIdError";
    }
}
exports.InvalidEitaaIdError = InvalidEitaaIdError;
const EITAA_URL_PREFIXES = ["https://eitaa.com/", "http://eitaa.com/", "eitaa.com/", "@"];
const VALID_ID_PATTERN = /^[a-zA-Z0-9_]{4,32}$/;
/**
 * Normalizes an Eitaa channel identifier supplied as a bare handle, an
 * "@handle" mention, or a full eitaa.com URL, into a canonical lowercase
 * handle with no prefix. Throws InvalidEitaaIdError if the result does not
 * look like a valid Eitaa identifier.
 */
function normalizeEitaaId(rawInput) {
    let value = (0, localization_1.toLatinDigits)(rawInput).trim();
    for (const prefix of EITAA_URL_PREFIXES) {
        if (value.toLowerCase().startsWith(prefix)) {
            value = value.slice(prefix.length);
            break;
        }
    }
    value = value.replace(/\/+$/, "").trim();
    if (!VALID_ID_PATTERN.test(value)) {
        throw new InvalidEitaaIdError(rawInput);
    }
    return value.toLowerCase();
}
function isValidEitaaId(rawInput) {
    try {
        normalizeEitaaId(rawInput);
        return true;
    }
    catch {
        return false;
    }
}
function toEitaaUrl(normalizedId) {
    return `https://eitaa.com/${normalizedId}`;
}
