import { type AddTicketMessage, type CreateTicket } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { TicketsService } from "./tickets.service";
/** Partner-facing — same channel-nested ABAC shape as SupportRequestsController. `getDetail`/`addMessage` never surface internal notes (spec 18's own exit proof). */
export declare class TicketsPartnerController {
    private readonly tickets;
    constructor(tickets: TicketsService);
    create(channelId: string, body: CreateTicket, actor: RequestActor): Promise<{
        id: string;
        channelId: string | null;
        category: "OTHER" | "SUPPORT_REQUEST" | "OBLIGATION" | "BILLING" | "TECHNICAL" | "ACCOUNT";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        status: "OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED";
        subject: string;
        slaDueAt: string | null;
        slaBreached: boolean;
        firstResponseAt: string | null;
        resolvedAt: string | null;
        closedAt: string | null;
        reopenCount: number;
        assigneeId: string | null;
        watcherIds: string[];
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        createdById: string;
        fileIds: string[];
        createdAt: string;
        updatedAt: string;
    }>;
    list(channelId: string): Promise<{
        id: string;
        channelId: string | null;
        category: "OTHER" | "SUPPORT_REQUEST" | "OBLIGATION" | "BILLING" | "TECHNICAL" | "ACCOUNT";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        status: "OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED";
        subject: string;
        slaDueAt: string | null;
        slaBreached: boolean;
        firstResponseAt: string | null;
        resolvedAt: string | null;
        closedAt: string | null;
        reopenCount: number;
        assigneeId: string | null;
        watcherIds: string[];
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        createdById: string;
        fileIds: string[];
        createdAt: string;
        updatedAt: string;
    }[]>;
    getOne(ticketId: string): Promise<{
        id: string;
        channelId: string | null;
        category: "OTHER" | "SUPPORT_REQUEST" | "OBLIGATION" | "BILLING" | "TECHNICAL" | "ACCOUNT";
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        status: "OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED";
        subject: string;
        slaDueAt: string | null;
        slaBreached: boolean;
        firstResponseAt: string | null;
        resolvedAt: string | null;
        closedAt: string | null;
        reopenCount: number;
        assigneeId: string | null;
        watcherIds: string[];
        linkedEntityType: string | null;
        linkedEntityId: string | null;
        createdById: string;
        fileIds: string[];
        createdAt: string;
        updatedAt: string;
        messages: {
            id: string;
            authorId: string;
            body: string;
            createdAt: string;
        }[];
        statusEvents: {
            id: string;
            fromStatus: "OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED" | null;
            toStatus: "OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED";
            note: string | null;
            createdAt: string;
        }[];
    }>;
    addMessage(ticketId: string, body: AddTicketMessage, actor: RequestActor): Promise<{
        id: string;
        authorId: string;
        body: string;
        createdAt: string;
    }>;
}
//# sourceMappingURL=tickets-partner.controller.d.ts.map