"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCapacityResourceSchema = exports.capacityResourceSchema = exports.calendarEventSchema = exports.createCalendarEventSchema = exports.dateNoteSchema = exports.createDateNoteSchema = exports.calendarItemSchema = exports.calendarItemKindSchema = void 0;
const zod_1 = require("zod");
exports.calendarItemKindSchema = zod_1.z.enum(["TASK", "PROMOTION_SCHEDULE", "DATE_NOTE", "EVENT"]);
/**
 * The unified calendar/Gantt read-model — every item is a projection of a
 * real Task or PromotionSchedule row (or a genuinely freeform DateNote/
 * CalendarEvent), never a denormalized copy. `linkedId` is the id of the
 * underlying Task/PromotionSchedule/DateNote/CalendarEvent row so the UI can
 * open the real record.
 */
exports.calendarItemSchema = zod_1.z.object({
    kind: exports.calendarItemKindSchema,
    linkedId: zod_1.z.string(),
    title: zod_1.z.string(),
    startAt: zod_1.z.iso.datetime(),
    endAt: zod_1.z.iso.datetime().nullable(),
    allDay: zod_1.z.boolean(),
    channelId: zod_1.z.string().nullable(),
    channelTitle: zod_1.z.string().nullable(),
    status: zod_1.z.string().nullable(),
});
exports.createDateNoteSchema = zod_1.z.object({
    date: zod_1.z.iso.date(),
    note: zod_1.z.string().min(1),
    channelId: zod_1.z.string().optional(),
});
exports.dateNoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    date: zod_1.z.iso.date(),
    note: zod_1.z.string(),
    channelId: zod_1.z.string().nullable(),
    createdBy: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.createCalendarEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    startAt: zod_1.z.iso.datetime(),
    endAt: zod_1.z.iso.datetime().optional(),
    allDay: zod_1.z.boolean().default(false),
    channelId: zod_1.z.string().optional(),
});
exports.calendarEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    startAt: zod_1.z.iso.datetime(),
    endAt: zod_1.z.iso.datetime().nullable(),
    allDay: zod_1.z.boolean(),
    channelId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.capacityResourceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    operatorId: zod_1.z.string(),
    operatorName: zod_1.z.string(),
    capacityPerDay: zod_1.z.number().int(),
});
exports.createCapacityResourceSchema = zod_1.z.object({
    operatorId: zod_1.z.string(),
    capacityPerDay: zod_1.z.number().int().min(1).default(1),
});
