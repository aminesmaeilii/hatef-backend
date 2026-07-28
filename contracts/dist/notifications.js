"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationTemplateSchema = exports.notificationTemplateSchema = exports.notificationTemplateStatusSchema = exports.notificationQuietHoursSchema = exports.setNotificationPreferenceSchema = exports.notificationPreferenceSchema = exports.notificationSchema = exports.notificationDeliverySchema = exports.notificationDeliveryStatusSchema = exports.notificationChannelTypeSchema = void 0;
const zod_1 = require("zod");
exports.notificationChannelTypeSchema = zod_1.z.enum(["IN_APP", "SMS", "PUSH", "EMAIL"]);
exports.notificationDeliveryStatusSchema = zod_1.z.enum([
    "PENDING",
    "SENT",
    "FAILED",
    "DEAD_LETTER",
    "SKIPPED_QUIET_HOURS",
    "SKIPPED_PREFERENCE",
]);
exports.notificationDeliverySchema = zod_1.z.object({
    id: zod_1.z.string(),
    channel: exports.notificationChannelTypeSchema,
    status: exports.notificationDeliveryStatusSchema,
    attempts: zod_1.z.number().int(),
    lastError: zod_1.z.string().nullable(),
    sentAt: zod_1.z.iso.datetime().nullable(),
});
exports.notificationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    eventType: zod_1.z.string(),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    deepLink: zod_1.z.string().nullable(),
    linkedEntityType: zod_1.z.string().nullable(),
    linkedEntityId: zod_1.z.string().nullable(),
    mandatory: zod_1.z.boolean(),
    readAt: zod_1.z.iso.datetime().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    deliveries: zod_1.z.array(exports.notificationDeliverySchema),
});
exports.notificationPreferenceSchema = zod_1.z.object({
    eventType: zod_1.z.string(),
    channel: exports.notificationChannelTypeSchema,
    enabled: zod_1.z.boolean(),
});
exports.setNotificationPreferenceSchema = zod_1.z.object({
    eventType: zod_1.z.string().min(1),
    channel: exports.notificationChannelTypeSchema,
    enabled: zod_1.z.boolean(),
});
exports.notificationQuietHoursSchema = zod_1.z.object({
    startHour: zod_1.z.number().int().min(0).max(23),
    endHour: zod_1.z.number().int().min(0).max(23),
});
exports.notificationTemplateStatusSchema = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.notificationTemplateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    channel: exports.notificationChannelTypeSchema,
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    status: exports.notificationTemplateStatusSchema,
    publishedAt: zod_1.z.iso.datetime().nullable(),
});
exports.createNotificationTemplateSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    channel: exports.notificationChannelTypeSchema,
    title: zod_1.z.string().min(1),
    body: zod_1.z.string().min(1),
});
