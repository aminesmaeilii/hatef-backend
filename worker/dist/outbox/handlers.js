"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxEventHandlers = void 0;
exports.registerOutboxHandler = registerOutboxHandler;
/**
 * Registry of eventType -> handler. Phase 6 is the first real consumer
 * (notification delivery, report-run execution) — each later phase adds
 * more handlers here instead of creating a second dispatch mechanism.
 */
exports.outboxEventHandlers = {};
function registerOutboxHandler(eventType, handler) {
    exports.outboxEventHandlers[eventType] = handler;
}
