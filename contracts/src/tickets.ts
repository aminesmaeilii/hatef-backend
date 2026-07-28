import { z } from "zod";

export const ticketCategorySchema = z.enum(["SUPPORT_REQUEST", "OBLIGATION", "BILLING", "TECHNICAL", "ACCOUNT", "OTHER"]);
export type TicketCategoryKey = z.infer<typeof ticketCategorySchema>;

export const ticketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TicketPriorityKey = z.infer<typeof ticketPrioritySchema>;

export const ticketStatusSchema = z.enum(["NEW", "OPEN", "WAITING_FOR_HATEF", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED", "REOPENED"]);
export type TicketStatusKey = z.infer<typeof ticketStatusSchema>;

export const createTicketSchema = z.object({
  category: ticketCategorySchema,
  priority: ticketPrioritySchema.default("MEDIUM"),
  subject: z.string().min(1),
  body: z.string().min(1),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().optional(),
  fileIds: z.array(z.string()).default([]),
});
export type CreateTicket = z.infer<typeof createTicketSchema>;

export const addTicketMessageSchema = z.object({ body: z.string().min(1) });
export type AddTicketMessage = z.infer<typeof addTicketMessageSchema>;

export const addTicketInternalNoteSchema = z.object({ body: z.string().min(1) });
export type AddTicketInternalNote = z.infer<typeof addTicketInternalNoteSchema>;

export const transitionTicketSchema = z.object({ toStatus: ticketStatusSchema, note: z.string().optional() });
export type TransitionTicket = z.infer<typeof transitionTicketSchema>;

export const assignTicketSchema = z.object({ assigneeId: z.string().nullable() });
export type AssignTicket = z.infer<typeof assignTicketSchema>;

export const ticketMessageSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type TicketMessageDto = z.infer<typeof ticketMessageSchema>;

/** Internal-only DTO shape — never returned by any partner-facing endpoint or serializer. */
export const ticketInternalNoteSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type TicketInternalNoteDto = z.infer<typeof ticketInternalNoteSchema>;

export const ticketStatusEventSchema = z.object({
  id: z.string(),
  fromStatus: ticketStatusSchema.nullable(),
  toStatus: ticketStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type TicketStatusEventDto = z.infer<typeof ticketStatusEventSchema>;

export const ticketSchema = z.object({
  id: z.string(),
  channelId: z.string().nullable(),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  subject: z.string(),
  slaDueAt: z.iso.datetime().nullable(),
  slaBreached: z.boolean(),
  firstResponseAt: z.iso.datetime().nullable(),
  resolvedAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
  reopenCount: z.number().int(),
  assigneeId: z.string().nullable(),
  watcherIds: z.array(z.string()),
  linkedEntityType: z.string().nullable(),
  linkedEntityId: z.string().nullable(),
  createdById: z.string(),
  fileIds: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Ticket = z.infer<typeof ticketSchema>;

/** Partner-facing detail — messages only, `internalNotes` deliberately does not exist on this type. */
export const ticketDetailSchema = ticketSchema.extend({
  messages: z.array(ticketMessageSchema),
  statusEvents: z.array(ticketStatusEventSchema),
});
export type TicketDetail = z.infer<typeof ticketDetailSchema>;

/** Internal/admin detail — the one shape allowed to carry internal notes. */
export const ticketAdminDetailSchema = ticketDetailSchema.extend({
  internalNotes: z.array(ticketInternalNoteSchema),
});
export type TicketAdminDetail = z.infer<typeof ticketAdminDetailSchema>;
