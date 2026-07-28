import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import type { Logger } from "@hatef/observability";
import { PrismaClient, OutboxEventStatus } from "@hatef/database";
import { OUTBOX_QUEUE_NAME } from "./relay";
import { outboxEventHandlers, type OutboxEventPayload } from "./handlers";

interface OutboxJobData extends OutboxEventPayload {
  outboxEventId: string;
}

export function startOutboxProcessor(
  prisma: PrismaClient,
  connection: Redis,
  logger: Logger,
): Worker<OutboxJobData> {
  return new Worker<OutboxJobData>(
    OUTBOX_QUEUE_NAME,
    async (job: Job<OutboxJobData>) => {
      const handler = outboxEventHandlers[job.data.eventType];

      if (!handler) {
        logger.warn({ eventType: job.data.eventType }, "no handler registered for outbox event type");
      } else {
        await handler(job.data, { logger, prisma });
      }

      await prisma.outboxEvent.update({
        where: { id: job.data.outboxEventId },
        data: { status: OutboxEventStatus.PROCESSED, processedAt: new Date() },
      });
    },
    { connection },
  ).on("failed", (job, error) => {
    logger.error({ jobId: job?.id, err: error }, "outbox job failed");

    const exhausted = job && job.attemptsMade >= (job.opts.attempts ?? 1);
    if (exhausted) {
      prisma.outboxEvent
        .update({
          where: { id: job.data.outboxEventId },
          data: {
            status: OutboxEventStatus.DEAD_LETTER,
            lastError: error.message,
            attempts: { increment: 1 },
          },
        })
        .catch((updateError) => {
          logger.error({ err: updateError }, "failed to mark outbox event as dead-lettered");
        });
    }
  });
}
