import { z } from "zod";

export const calendarItemKindSchema = z.enum(["TASK", "PROMOTION_SCHEDULE", "DATE_NOTE", "EVENT"]);
export type CalendarItemKindKey = z.infer<typeof calendarItemKindSchema>;

/**
 * The unified calendar/Gantt read-model — every item is a projection of a
 * real Task or PromotionSchedule row (or a genuinely freeform DateNote/
 * CalendarEvent), never a denormalized copy. `linkedId` is the id of the
 * underlying Task/PromotionSchedule/DateNote/CalendarEvent row so the UI can
 * open the real record.
 */
export const calendarItemSchema = z.object({
  kind: calendarItemKindSchema,
  linkedId: z.string(),
  title: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().nullable(),
  allDay: z.boolean(),
  channelId: z.string().nullable(),
  channelTitle: z.string().nullable(),
  status: z.string().nullable(),
});
export type CalendarItem = z.infer<typeof calendarItemSchema>;

export const createDateNoteSchema = z.object({
  date: z.iso.date(),
  note: z.string().min(1),
  channelId: z.string().optional(),
});
export type CreateDateNote = z.infer<typeof createDateNoteSchema>;

export const dateNoteSchema = z.object({
  id: z.string(),
  date: z.iso.date(),
  note: z.string(),
  channelId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
});
export type DateNote = z.infer<typeof dateNoteSchema>;

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().optional(),
  allDay: z.boolean().default(false),
  channelId: z.string().optional(),
});
export type CreateCalendarEvent = z.infer<typeof createCalendarEventSchema>;

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().nullable(),
  allDay: z.boolean(),
  channelId: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const capacityResourceSchema = z.object({
  id: z.string(),
  operatorId: z.string(),
  operatorName: z.string(),
  capacityPerDay: z.number().int(),
});
export type CapacityResource = z.infer<typeof capacityResourceSchema>;

export const createCapacityResourceSchema = z.object({
  operatorId: z.string(),
  capacityPerDay: z.number().int().min(1).default(1),
});
export type CreateCapacityResource = z.infer<typeof createCapacityResourceSchema>;
