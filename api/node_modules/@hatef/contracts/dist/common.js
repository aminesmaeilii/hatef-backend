"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cursorPaginationQuerySchema = exports.apiErrorSchema = void 0;
exports.cursorPaginatedResponseSchema = cursorPaginatedResponseSchema;
const zod_1 = require("zod");
/**
 * Stable, machine-readable error shape returned by every API endpoint.
 * `message` is always a safe, already-localized Persian string suitable for
 * direct display; never a raw exception message.
 */
exports.apiErrorSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    correlationId: zod_1.z.string().optional(),
    fieldErrors: zod_1.z
        .array(zod_1.z.object({
        field: zod_1.z.string(),
        message: zod_1.z.string(),
    }))
        .optional(),
});
exports.cursorPaginationQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
function cursorPaginatedResponseSchema(itemSchema) {
    return zod_1.z.object({
        items: zod_1.z.array(itemSchema),
        nextCursor: zod_1.z.string().nullable(),
    });
}
