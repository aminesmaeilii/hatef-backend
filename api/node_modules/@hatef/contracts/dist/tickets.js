"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketAdminDetailSchema = exports.ticketDetailSchema = exports.ticketSchema = exports.ticketStatusEventSchema = exports.ticketInternalNoteSchema = exports.ticketMessageSchema = exports.assignTicketSchema = exports.transitionTicketSchema = exports.addTicketInternalNoteSchema = exports.addTicketMessageSchema = exports.createTicketSchema = exports.ticketStatusSchema = exports.ticketPrioritySchema = exports.ticketCategorySchema = void 0;
const zod_1 = require("zod");
exports.ticketCategorySchema = zod_1.z.enum(["SUPPORT_REQUEST", "OBLIGATION", "BILLING", "TECHNICAL", "ACCOUNT", "OTHER"]);
exports.ticketPrioritySchema = zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
exports.ticketStatusSchema = zod_1.z.enum(["NEW", "OPEN", "WAITING_FOR_HATEF", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED", "REOPENED"]);
exports.createTicketSchema = zod_1.z.object({
    category: exports.ticketCategorySchema,
    priority: exports.ticketPrioritySchema.default("MEDIUM"),
    subject: zod_1.z.string().min(1),
    body: zod_1.z.string().min(1),
    linkedEntityType: zod_1.z.string().optional(),
    linkedEntityId: zod_1.z.string().optional(),
    fileIds: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.addTicketMessageSchema = zod_1.z.object({ body: zod_1.z.string().min(1) });
exports.addTicketInternalNoteSchema = zod_1.z.object({ body: zod_1.z.string().min(1) });
exports.transitionTicketSchema = zod_1.z.object({ toStatus: exports.ticketStatusSchema, note: zod_1.z.string().optional() });
exports.assignTicketSchema = zod_1.z.object({ assigneeId: zod_1.z.string().nullable() });
exports.ticketMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    body: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
/** Internal-only DTO shape — never returned by any partner-facing endpoint or serializer. */
exports.ticketInternalNoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    body: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.ticketStatusEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fromStatus: exports.ticketStatusSchema.nullable(),
    toStatus: exports.ticketStatusSchema,
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.ticketSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string().nullable(),
    category: exports.ticketCategorySchema,
    priority: exports.ticketPrioritySchema,
    status: exports.ticketStatusSchema,
    subject: zod_1.z.string(),
    slaDueAt: zod_1.z.iso.datetime().nullable(),
    slaBreached: zod_1.z.boolean(),
    firstResponseAt: zod_1.z.iso.datetime().nullable(),
    resolvedAt: zod_1.z.iso.datetime().nullable(),
    closedAt: zod_1.z.iso.datetime().nullable(),
    reopenCount: zod_1.z.number().int(),
    assigneeId: zod_1.z.string().nullable(),
    watcherIds: zod_1.z.array(zod_1.z.string()),
    linkedEntityType: zod_1.z.string().nullable(),
    linkedEntityId: zod_1.z.string().nullable(),
    createdById: zod_1.z.string(),
    fileIds: zod_1.z.array(zod_1.z.string()),
    createdAt: zod_1.z.iso.datetime(),
    updatedAt: zod_1.z.iso.datetime(),
});
/** Partner-facing detail — messages only, `internalNotes` deliberately does not exist on this type. */
exports.ticketDetailSchema = exports.ticketSchema.extend({
    messages: zod_1.z.array(exports.ticketMessageSchema),
    statusEvents: zod_1.z.array(exports.ticketStatusEventSchema),
});
/** Internal/admin detail — the one shape allowed to carry internal notes. */
exports.ticketAdminDetailSchema = exports.ticketDetailSchema.extend({
    internalNotes: zod_1.z.array(exports.ticketInternalNoteSchema),
});
