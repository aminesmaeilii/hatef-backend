"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithCorrelationId = runWithCorrelationId;
exports.getCorrelationId = getCorrelationId;
exports.newCorrelationId = newCorrelationId;
const node_async_hooks_1 = require("node:async_hooks");
const node_crypto_1 = require("node:crypto");
const storage = new node_async_hooks_1.AsyncLocalStorage();
function runWithCorrelationId(correlationId, fn) {
    return storage.run({ correlationId: correlationId ?? (0, node_crypto_1.randomUUID)() }, fn);
}
function getCorrelationId() {
    return storage.getStore()?.correlationId;
}
function newCorrelationId() {
    return (0, node_crypto_1.randomUUID)();
}
