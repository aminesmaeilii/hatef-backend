"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readinessResponseSchema = exports.readinessCheckSchema = exports.healthResponseSchema = void 0;
const zod_1 = require("zod");
exports.healthResponseSchema = zod_1.z.object({
    status: zod_1.z.literal("ok"),
    service: zod_1.z.string(),
    timestamp: zod_1.z.iso.datetime(),
});
exports.readinessCheckSchema = zod_1.z.object({
    name: zod_1.z.string(),
    status: zod_1.z.enum(["up", "down"]),
    latencyMs: zod_1.z.number().nonnegative().optional(),
    error: zod_1.z.string().optional(),
});
exports.readinessResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(["ok", "degraded"]),
    service: zod_1.z.string(),
    timestamp: zod_1.z.iso.datetime(),
    checks: zod_1.z.array(exports.readinessCheckSchema),
});
