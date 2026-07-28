"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rial = rial;
exports.addRial = addRial;
exports.subtractRial = subtractRial;
exports.multiplyRial = multiplyRial;
exports.isNonNegativeRial = isNonNegativeRial;
exports.serializeRial = serializeRial;
exports.parseRial = parseRial;
function rial(value) {
    if (typeof value === "number" && !Number.isInteger(value)) {
        throw new TypeError(`Rial amounts must be integers, received ${value}`);
    }
    return BigInt(value);
}
function addRial(a, b) {
    return a + b;
}
function subtractRial(a, b) {
    return a - b;
}
function multiplyRial(amount, factor) {
    if (typeof factor === "number" && !Number.isInteger(factor)) {
        throw new TypeError(`Rial multiplier must be an integer quantity, received ${factor}`);
    }
    return amount * BigInt(factor);
}
function isNonNegativeRial(amount) {
    return amount >= 0n;
}
/** Serializes a Rial amount for JSON transport (bigint is not JSON-serializable natively). */
function serializeRial(amount) {
    return amount.toString();
}
function parseRial(serialized) {
    if (!/^-?\d+$/.test(serialized)) {
        throw new TypeError(`Invalid serialized Rial amount: ${serialized}`);
    }
    return BigInt(serialized);
}
