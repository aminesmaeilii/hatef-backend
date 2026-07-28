import { z } from "zod";
export declare const ticketCategorySchema: z.ZodEnum<{
    OTHER: "OTHER";
    SUPPORT_REQUEST: "SUPPORT_REQUEST";
    OBLIGATION: "OBLIGATION";
    BILLING: "BILLING";
    TECHNICAL: "TECHNICAL";
    ACCOUNT: "ACCOUNT";
}>;
export type TicketCategoryKey = z.infer<typeof ticketCategorySchema>;
export declare const ticketPrioritySchema: z.ZodEnum<{
    LOW: "LOW";
    MEDIUM: "MEDIUM";
    HIGH: "HIGH";
    URGENT: "URGENT";
}>;
export type TicketPriorityKey = z.infer<typeof ticketPrioritySchema>;
export declare const ticketStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    RESOLVED: "RESOLVED";
    NEW: "NEW";
    WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
    WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
    CLOSED: "CLOSED";
    REOPENED: "REOPENED";
}>;
export type TicketStatusKey = z.infer<typeof ticketStatusSchema>;
export declare const createTicketSchema: z.ZodObject<{
    category: z.ZodEnum<{
        OTHER: "OTHER";
        SUPPORT_REQUEST: "SUPPORT_REQUEST";
        OBLIGATION: "OBLIGATION";
        BILLING: "BILLING";
        TECHNICAL: "TECHNICAL";
        ACCOUNT: "ACCOUNT";
    }>;
    priority: z.ZodDefault<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    subject: z.ZodString;
    body: z.ZodString;
    linkedEntityType: z.ZodOptional<z.ZodString>;
    linkedEntityId: z.ZodOptional<z.ZodString>;
    fileIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateTicket = z.infer<typeof createTicketSchema>;
export declare const addTicketMessageSchema: z.ZodObject<{
    body: z.ZodString;
}, z.core.$strip>;
export type AddTicketMessage = z.infer<typeof addTicketMessageSchema>;
export declare const addTicketInternalNoteSchema: z.ZodObject<{
    body: z.ZodString;
}, z.core.$strip>;
export type AddTicketInternalNote = z.infer<typeof addTicketInternalNoteSchema>;
export declare const transitionTicketSchema: z.ZodObject<{
    toStatus: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TransitionTicket = z.infer<typeof transitionTicketSchema>;
export declare const assignTicketSchema: z.ZodObject<{
    assigneeId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type AssignTicket = z.infer<typeof assignTicketSchema>;
export declare const ticketMessageSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    body: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TicketMessageDto = z.infer<typeof ticketMessageSchema>;
/** Internal-only DTO shape — never returned by any partner-facing endpoint or serializer. */
export declare const ticketInternalNoteSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    body: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TicketInternalNoteDto = z.infer<typeof ticketInternalNoteSchema>;
export declare const ticketStatusEventSchema: z.ZodObject<{
    id: z.ZodString;
    fromStatus: z.ZodNullable<z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>>;
    toStatus: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TicketStatusEventDto = z.infer<typeof ticketStatusEventSchema>;
export declare const ticketSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodNullable<z.ZodString>;
    category: z.ZodEnum<{
        OTHER: "OTHER";
        SUPPORT_REQUEST: "SUPPORT_REQUEST";
        OBLIGATION: "OBLIGATION";
        BILLING: "BILLING";
        TECHNICAL: "TECHNICAL";
        ACCOUNT: "ACCOUNT";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    subject: z.ZodString;
    slaDueAt: z.ZodNullable<z.ZodISODateTime>;
    slaBreached: z.ZodBoolean;
    firstResponseAt: z.ZodNullable<z.ZodISODateTime>;
    resolvedAt: z.ZodNullable<z.ZodISODateTime>;
    closedAt: z.ZodNullable<z.ZodISODateTime>;
    reopenCount: z.ZodNumber;
    assigneeId: z.ZodNullable<z.ZodString>;
    watcherIds: z.ZodArray<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    createdById: z.ZodString;
    fileIds: z.ZodArray<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Ticket = z.infer<typeof ticketSchema>;
/** Partner-facing detail — messages only, `internalNotes` deliberately does not exist on this type. */
export declare const ticketDetailSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodNullable<z.ZodString>;
    category: z.ZodEnum<{
        OTHER: "OTHER";
        SUPPORT_REQUEST: "SUPPORT_REQUEST";
        OBLIGATION: "OBLIGATION";
        BILLING: "BILLING";
        TECHNICAL: "TECHNICAL";
        ACCOUNT: "ACCOUNT";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    subject: z.ZodString;
    slaDueAt: z.ZodNullable<z.ZodISODateTime>;
    slaBreached: z.ZodBoolean;
    firstResponseAt: z.ZodNullable<z.ZodISODateTime>;
    resolvedAt: z.ZodNullable<z.ZodISODateTime>;
    closedAt: z.ZodNullable<z.ZodISODateTime>;
    reopenCount: z.ZodNumber;
    assigneeId: z.ZodNullable<z.ZodString>;
    watcherIds: z.ZodArray<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    createdById: z.ZodString;
    fileIds: z.ZodArray<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    statusEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromStatus: z.ZodNullable<z.ZodEnum<{
            OPEN: "OPEN";
            RESOLVED: "RESOLVED";
            NEW: "NEW";
            WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
            WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
            CLOSED: "CLOSED";
            REOPENED: "REOPENED";
        }>>;
        toStatus: z.ZodEnum<{
            OPEN: "OPEN";
            RESOLVED: "RESOLVED";
            NEW: "NEW";
            WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
            WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
            CLOSED: "CLOSED";
            REOPENED: "REOPENED";
        }>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TicketDetail = z.infer<typeof ticketDetailSchema>;
/** Internal/admin detail — the one shape allowed to carry internal notes. */
export declare const ticketAdminDetailSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodNullable<z.ZodString>;
    category: z.ZodEnum<{
        OTHER: "OTHER";
        SUPPORT_REQUEST: "SUPPORT_REQUEST";
        OBLIGATION: "OBLIGATION";
        BILLING: "BILLING";
        TECHNICAL: "TECHNICAL";
        ACCOUNT: "ACCOUNT";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        NEW: "NEW";
        WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
        WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    subject: z.ZodString;
    slaDueAt: z.ZodNullable<z.ZodISODateTime>;
    slaBreached: z.ZodBoolean;
    firstResponseAt: z.ZodNullable<z.ZodISODateTime>;
    resolvedAt: z.ZodNullable<z.ZodISODateTime>;
    closedAt: z.ZodNullable<z.ZodISODateTime>;
    reopenCount: z.ZodNumber;
    assigneeId: z.ZodNullable<z.ZodString>;
    watcherIds: z.ZodArray<z.ZodString>;
    linkedEntityType: z.ZodNullable<z.ZodString>;
    linkedEntityId: z.ZodNullable<z.ZodString>;
    createdById: z.ZodString;
    fileIds: z.ZodArray<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    statusEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromStatus: z.ZodNullable<z.ZodEnum<{
            OPEN: "OPEN";
            RESOLVED: "RESOLVED";
            NEW: "NEW";
            WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
            WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
            CLOSED: "CLOSED";
            REOPENED: "REOPENED";
        }>>;
        toStatus: z.ZodEnum<{
            OPEN: "OPEN";
            RESOLVED: "RESOLVED";
            NEW: "NEW";
            WAITING_FOR_HATEF: "WAITING_FOR_HATEF";
            WAITING_FOR_PARTNER: "WAITING_FOR_PARTNER";
            CLOSED: "CLOSED";
            REOPENED: "REOPENED";
        }>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    internalNotes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        authorId: z.ZodString;
        body: z.ZodString;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TicketAdminDetail = z.infer<typeof ticketAdminDetailSchema>;
//# sourceMappingURL=tickets.d.ts.map