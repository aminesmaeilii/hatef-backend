import { z } from "zod";
export declare const notificationChannelTypeSchema: z.ZodEnum<{
    IN_APP: "IN_APP";
    SMS: "SMS";
    PUSH: "PUSH";
    EMAIL: "EMAIL";
}>;
export type NotificationChannelTypeKey = z.infer<typeof notificationChannelTypeSchema>;
export declare const notificationDeliveryStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    SENT: "SENT";
    FAILED: "FAILED";
    DEAD_LETTER: "DEAD_LETTER";
    SKIPPED_QUIET_HOURS: "SKIPPED_QUIET_HOURS";
    SKIPPED_PREFERENCE: "SKIPPED_PREFERENCE";
}>;
export type NotificationDeliveryStatusKey = z.infer<typeof notificationDeliveryStatusSchema>;
export declare const notificationDeliverySchema: z.ZodObject<{
    id: z.ZodString;
    channel: z.ZodEnum<{
        IN_APP: "IN_APP";
        SMS: "SMS";
        PUSH: "PUSH";
        EMAIL: "EMAIL";
    }>;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        SENT: "SENT";
        FAILED: "FAILED";
        DEAD_LETTER: "DEAD_LETTER";
        SKIPPED_QUIET_HOURS: "SKIPPED_QUIET_HOURS";
        SKIPPED_PREFERENCE: "SKIPPED_PREFERENCE";
    }>;
    attempts: z.ZodNumber;
    lastError: z.ZodNullable<z.ZodString>;
    sentAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type NotificationDeliveryDto = z.infer<typeof notificationDeliverySchema>;
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    eventType: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    deepLink: z.ZodNullable<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    mandatory: z.ZodBoolean;
    readAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
    deliveries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        channel: z.ZodEnum<{
            IN_APP: "IN_APP";
            SMS: "SMS";
            PUSH: "PUSH";
            EMAIL: "EMAIL";
        }>;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            SENT: "SENT";
            FAILED: "FAILED";
            DEAD_LETTER: "DEAD_LETTER";
            SKIPPED_QUIET_HOURS: "SKIPPED_QUIET_HOURS";
            SKIPPED_PREFERENCE: "SKIPPED_PREFERENCE";
        }>;
        attempts: z.ZodNumber;
        lastError: z.ZodNullable<z.ZodString>;
        sentAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type NotificationDto = z.infer<typeof notificationSchema>;
export declare const notificationPreferenceSchema: z.ZodObject<{
    eventType: z.ZodString;
    channel: z.ZodEnum<{
        IN_APP: "IN_APP";
        SMS: "SMS";
        PUSH: "PUSH";
        EMAIL: "EMAIL";
    }>;
    enabled: z.ZodBoolean;
}, z.core.$strip>;
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export declare const setNotificationPreferenceSchema: z.ZodObject<{
    eventType: z.ZodString;
    channel: z.ZodEnum<{
        IN_APP: "IN_APP";
        SMS: "SMS";
        PUSH: "PUSH";
        EMAIL: "EMAIL";
    }>;
    enabled: z.ZodBoolean;
}, z.core.$strip>;
export type SetNotificationPreference = z.infer<typeof setNotificationPreferenceSchema>;
export declare const notificationQuietHoursSchema: z.ZodObject<{
    startHour: z.ZodNumber;
    endHour: z.ZodNumber;
}, z.core.$strip>;
export type NotificationQuietHours = z.infer<typeof notificationQuietHoursSchema>;
export declare const notificationTemplateStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const notificationTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    versionNumber: z.ZodNumber;
    channel: z.ZodEnum<{
        IN_APP: "IN_APP";
        SMS: "SMS";
        PUSH: "PUSH";
        EMAIL: "EMAIL";
    }>;
    title: z.ZodString;
    body: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
    publishedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>;
export declare const createNotificationTemplateSchema: z.ZodObject<{
    key: z.ZodString;
    channel: z.ZodEnum<{
        IN_APP: "IN_APP";
        SMS: "SMS";
        PUSH: "PUSH";
        EMAIL: "EMAIL";
    }>;
    title: z.ZodString;
    body: z.ZodString;
}, z.core.$strip>;
export type CreateNotificationTemplate = z.infer<typeof createNotificationTemplateSchema>;
//# sourceMappingURL=notifications.d.ts.map