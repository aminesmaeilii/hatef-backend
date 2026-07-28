"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogEntrySchema = void 0;
const zod_1 = require("zod");
exports.auditLogEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    actorId: zod_1.z.string().nullable(),
    actorType: zod_1.z.string(),
    actorLabel: zod_1.z.string().nullable(),
    action: zod_1.z.string(),
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string().nullable(),
    metadata: zod_1.z.unknown().nullable(),
    correlationId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
