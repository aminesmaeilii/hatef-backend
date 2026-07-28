"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixtureId = fixtureId;
const node_crypto_1 = require("node:crypto");
/** Deterministic-looking but unique fixture id, for readable test assertions. */
function fixtureId(prefix) {
    return `${prefix}_${(0, node_crypto_1.randomUUID)()}`;
}
