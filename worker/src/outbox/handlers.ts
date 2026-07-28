import type { Logger } from "@hatef/observability";
import type { PrismaClient } from "@hatef/database";

export interface OutboxEventPayload {
  eventType: string;
  payload: unknown;
  correlationId: string | null;
}

export interface OutboxHandlerContext {
  logger: Logger;
  prisma: PrismaClient;
}

export type OutboxEventHandler = (event: OutboxEventPayload, ctx: OutboxHandlerContext) => Promise<void>;

/**
 * Registry of eventType -> handler. Phase 6 is the first real consumer
 * (notification delivery, report-run execution) — each later phase adds
 * more handlers here instead of creating a second dispatch mechanism.
 */
export const outboxEventHandlers: Record<string, OutboxEventHandler> = {};

export function registerOutboxHandler(eventType: string, handler: OutboxEventHandler): void {
  outboxEventHandlers[eventType] = handler;
}
