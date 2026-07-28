import type { AddTicketInternalNote, AddTicketMessage, CreateTicket, Ticket, TicketAdminDetail, TicketDetail, TicketMessageDto, TicketStatusKey } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { NotificationsService } from "../notifications/notifications.service";
export interface TicketListFilters {
    channelId?: string;
    status?: TicketStatusKey;
    assigneeId?: string;
}
export declare class TicketsService {
    private readonly prisma;
    private readonly auditLog;
    private readonly notifications;
    constructor(prisma: PrismaService, auditLog: AuditLogService, notifications: NotificationsService);
    create(input: CreateTicket, actor: RequestActor, channelId?: string): Promise<Ticket>;
    list(filters: TicketListFilters): Promise<Ticket[]>;
    /** Partner-facing detail — never includes internal notes (spec 18's own exit proof). */
    getDetail(ticketId: string): Promise<TicketDetail>;
    /** Internal/admin detail — the one path allowed to also carry internal notes. */
    getAdminDetail(ticketId: string): Promise<TicketAdminDetail>;
    addMessage(ticketId: string, input: AddTicketMessage, actor: RequestActor): Promise<TicketMessageDto>;
    /** Internal-only. No partner-facing controller ever calls this. */
    addInternalNote(ticketId: string, input: AddTicketInternalNote, actor: RequestActor): Promise<{
        id: string;
        authorId: string;
        body: string;
        createdAt: string;
    }>;
    assign(ticketId: string, assigneeId: string | null, actor: RequestActor): Promise<Ticket>;
    transition(ticketId: string, toStatus: TicketStatusKey, note: string | undefined, actor: RequestActor, options?: {
        firstResponse?: boolean;
    }): Promise<Ticket>;
}
//# sourceMappingURL=tickets.service.d.ts.map