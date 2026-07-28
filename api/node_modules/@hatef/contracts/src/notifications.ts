import { z } from "zod";

export const notificationChannelTypeSchema = z.enum(["IN_APP", "SMS", "PUSH", "EMAIL"]);
export type NotificationChannelTypeKey = z.infer<typeof notificationChannelTypeSchema>;

export const notificationDeliveryStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "FAILED",
  "DEAD_LETTER",
  "SKIPPED_QUIET_HOURS",
  "SKIPPED_PREFERENCE",
]);
export type NotificationDeliveryStatusKey = z.infer<typeof notificationDeliveryStatusSchema>;

export const notificationDeliverySchema = z.object({
  id: z.string(),
  channel: notificationChannelTypeSchema,
  status: notificationDeliveryStatusSchema,
  attempts: z.number().int(),
  lastError: z.string().nullable(),
  sentAt: z.iso.datetime().nullable(),
});
export type NotificationDeliveryDto = z.infer<typeof notificationDeliverySchema>;

export const notificationSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  title: z.string(),
  body: z.string(),
  deepLink: z.string().nullable(),
  linkedEntityType: z.string().nullable(),
  linkedEntityId: z.string().nullable(),
  mandatory: z.boolean(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  deliveries: z.array(notificationDeliverySchema),
});
export type NotificationDto = z.infer<typeof notificationSchema>;

export const notificationPreferenceSchema = z.object({
  eventType: z.string(),
  channel: notificationChannelTypeSchema,
  enabled: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export const setNotificationPreferenceSchema = z.object({
  eventType: z.string().min(1),
  channel: notificationChannelTypeSchema,
  enabled: z.boolean(),
});
export type SetNotificationPreference = z.infer<typeof setNotificationPreferenceSchema>;

export const notificationQuietHoursSchema = z.object({
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
});
export type NotificationQuietHours = z.infer<typeof notificationQuietHoursSchema>;

export const notificationTemplateStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const notificationTemplateSchema = z.object({
  id: z.string(),
  key: z.string(),
  versionNumber: z.number().int(),
  channel: notificationChannelTypeSchema,
  title: z.string(),
  body: z.string(),
  status: notificationTemplateStatusSchema,
  publishedAt: z.iso.datetime().nullable(),
});
export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>;

export const createNotificationTemplateSchema = z.object({
  key: z.string().min(1),
  channel: notificationChannelTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
});
export type CreateNotificationTemplate = z.infer<typeof createNotificationTemplateSchema>;
