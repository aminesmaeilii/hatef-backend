import { StateMachine } from "@hatef/domain";
import type { TicketStatusKey } from "@hatef/contracts";
/**
 * The 7-status ticket workflow (spec 18). WAITING_FOR_HATEF/
 * WAITING_FOR_PARTNER track whose turn it is to respond — TicketsService.
 * addMessage() flips between them automatically based on who just replied,
 * for any "live" ticket (NEW/OPEN/WAITING_*); RESOLVED/CLOSED/REOPENED are
 * only ever reached through an explicit transition, never auto-flipped by
 * a message.
 */
export declare const ticketStateMachine: StateMachine<"OPEN" | "RESOLVED" | "CLOSED" | "NEW" | "WAITING_FOR_HATEF" | "WAITING_FOR_PARTNER" | "REOPENED">;
/** Ticket statuses a message can still be auto-routed through — RESOLVED/CLOSED/REOPENED require an explicit transition first. */
export declare const LIVE_TICKET_STATUSES: TicketStatusKey[];
//# sourceMappingURL=ticket-state-machine.d.ts.map