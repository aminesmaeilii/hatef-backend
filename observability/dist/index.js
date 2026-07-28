"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCorrelationId = exports.getCorrelationId = exports.runWithCorrelationId = exports.createLogger = void 0;
var logger_1 = require("./logger");
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
var correlation_1 = require("./correlation");
Object.defineProperty(exports, "runWithCorrelationId", { enumerable: true, get: function () { return correlation_1.runWithCorrelationId; } });
Object.defineProperty(exports, "getCorrelationId", { enumerable: true, get: function () { return correlation_1.getCorrelationId; } });
Object.defineProperty(exports, "newCorrelationId", { enumerable: true, get: function () { return correlation_1.newCorrelationId; } });
