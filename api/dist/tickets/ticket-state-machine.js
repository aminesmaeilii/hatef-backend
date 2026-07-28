"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVE_TICKET_STATUSES = exports.ticketStateMachine = void 0;
const domain_1 = require("@hatef/domain");
/**
 * The 7-status ticket workflow (spec 18). WAITING_FOR_HATEF/
 * WAITING_FOR_PARTNER track whose turn it is to respond — TicketsService.
 * addMessage() flips between them automatically based on who just replied,
 * for any "live" ticket (NEW/OPEN/WAITING_*); RESOLVED/CLOSED/REOPENED are
 * only ever reached through an explicit transition, never auto-flipped by
 * a message.
 */
exports.ticketStateMachine = new domain_1.StateMachine({
    NEW: ["OPEN", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED"],
    OPEN: ["WAITING_FOR_HATEF", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED"],
    WAITING_FOR_HATEF: ["OPEN", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED"],
    WAITING_FOR_PARTNER: ["OPEN", "WAITING_FOR_HATEF", "RESOLVED", "CLOSED"],
    RESOLVED: ["CLOSED", "REOPENED"],
    CLOSED: ["REOPENED"],
    REOPENED: ["OPEN", "WAITING_FOR_HATEF", "WAITING_FOR_PARTNER", "RESOLVED", "CLOSED"],
});
/** Ticket statuses a message can still be auto-routed through — RESOLVED/CLOSED/REOPENED require an explicit transition first. */
exports.LIVE_TICKET_STATUSES = ["NEW", "OPEN", "WAITING_FOR_HATEF", "WAITING_FOR_PARTNER"];
