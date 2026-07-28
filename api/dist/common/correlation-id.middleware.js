"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORRELATION_ID_HEADER = void 0;
exports.correlationIdMiddleware = correlationIdMiddleware;
const observability_1 = require("@hatef/observability");
exports.CORRELATION_ID_HEADER = "x-correlation-id";
function correlationIdMiddleware() {
    return (req, res, next) => {
        const incoming = req.header(exports.CORRELATION_ID_HEADER);
        const correlationId = incoming && incoming.length > 0 ? incoming : (0, observability_1.newCorrelationId)();
        res.setHeader(exports.CORRELATION_ID_HEADER, correlationId);
        req.correlationId = correlationId;
        (0, observability_1.runWithCorrelationId)(correlationId, next);
    };
}
