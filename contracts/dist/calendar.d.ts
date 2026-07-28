import { z } from "zod";
export declare const calendarItemKindSchema: z.ZodEnum<{
    TASK: "TASK";
    PROMOTION_SCHEDULE: "PROMOTION_SCHEDULE";
    DATE_NOTE: "DATE_NOTE";
    EVENT: "EVENT";
}>;
export type CalendarItemKindKey = z.infer<typeof calendarItemKindSchema>;
/**
 * The unified calendar/Gantt read-model — every item is a projection of a
 * real Task or PromotionSchedule row (or a genuinely freeform DateNote/
 * CalendarEvent), never a denormalized copy. `linkedId` is the id of the
 * underlying Task/PromotionSchedule/DateNote/CalendarEvent row so the UI can
 * open the real record.
 */
export declare const calendarItemSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        TASK: "TASK";
        PROMOTION_SCHEDULE: "PROMOTION_SCHEDULE";
        DATE_NOTE: "DATE_NOTE";
        EVENT: "EVENT";
    }>;
    linkedId: z.ZodString;
    title: z.ZodString;
    startAt: z.ZodISODateTime;
    endAt: z.ZodNullable<z.ZodISODateTime>;
    allDay: z.ZodBoolean;
    channelId: z.ZodNullable<z.ZodString>;
    channelTitle: z.ZodNullable<z.ZodString>;
    status: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type CalendarItem = z.infer<typeof calendarItemSchema>;
export declare const createDateNoteSchema: z.ZodObject<{
    date: z.ZodISODate;
    note: z.ZodString;
    channelId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateDateNote = z.infer<typeof createDateNoteSchema>;
export declare const dateNoteSchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodISODate;
    note: z.ZodString;
    channelId: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type DateNote = z.infer<typeof dateNoteSchema>;
export declare const createCalendarEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startAt: z.ZodISODateTime;
    endAt: z.ZodOptional<z.ZodISODateTime>;
    allDay: z.ZodDefault<z.ZodBoolean>;
    channelId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateCalendarEvent = z.infer<typeof createCalendarEventSchema>;
export declare const calendarEventSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    startAt: z.ZodISODateTime;
    endAt: z.ZodNullable<z.ZodISODateTime>;
    allDay: z.ZodBoolean;
    channelId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export declare const capacityResourceSchema: z.ZodObject<{
    id: z.ZodString;
    operatorId: z.ZodString;
    operatorName: z.ZodString;
    capacityPerDay: z.ZodNumber;
}, z.core.$strip>;
export type CapacityResource = z.infer<typeof capacityResourceSchema>;
export declare const createCapacityResourceSchema: z.ZodObject<{
    operatorId: z.ZodString;
    capacityPerDay: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type CreateCapacityResource = z.infer<typeof createCapacityResourceSchema>;
//# sourceMappingURL=calendar.d.ts.map