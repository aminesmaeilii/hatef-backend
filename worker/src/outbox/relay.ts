import { Queue } from "bullmq";
import type { Logger } from "@hatef/observability";
import { PrismaClient, OutboxEventStatus } from "@hatef/database";

export const OUTBOX_QUEUE_NAME = "outbox-events";

/**
 * Polls the transactional outbox table for rows a business transaction has
 * already committed, and hands each one to the queue for at-least-once
 * delivery. Runs on a short interval rather than LISTEN/NOTIFY to keep
 * Phase 0 infrastructure simple; can be swapped for a trigger later
 * without changing the queue/worker contract.
 */
export function startOutboxRelay(
  prisma: PrismaClient,
  queue: Queue,
  logger: Logger,
  intervalMs = 2000,
): NodeJS.Timeout {
  return setInterval(() => {
    relayOnce(prisma, queue, logger).catch((error) => {
      logger.error({ err: error }, "outbox relay tick failed");
    });
  }, intervalMs);
}

export async function relayOnce(prisma: PrismaClient, queue: Queue, logger: Logger): Promise<number> {
  const pending = await prisma.outboxEvent.findMany({
    where: { status: OutboxEventStatus.PENDING, availableAt: { lte: new Date() } },
    take: 25,
    orderBy: { availableAt: "asc" },
  });

  for (const event of pending) {
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: OutboxEventStatus.PROCESSING },
    });

    await queue.add(
      event.eventType,
      {
        outboxEventId: event.id,
        eventType: event.eventType,
        payload: event.payload,
        correlationId: event.correlationId,
      },
      { jobId: event.id, attempts: 5, backoff: { type: "exponential", delay: 1000 } },
    );
  }

  if (pending.length > 0) {
    logger.debug({ count: pending.length }, "relayed pending outbox events to queue");
  }

  return pending.length;
}
