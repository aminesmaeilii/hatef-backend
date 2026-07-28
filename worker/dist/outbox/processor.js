"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOutboxProcessor = startOutboxProcessor;
const bullmq_1 = require("bullmq");
const database_1 = require("@hatef/database");
const relay_1 = require("./relay");
const handlers_1 = require("./handlers");
function startOutboxProcessor(prisma, connection, logger) {
    return new bullmq_1.Worker(relay_1.OUTBOX_QUEUE_NAME, async (job) => {
        const handler = handlers_1.outboxEventHandlers[job.data.eventType];
        if (!handler) {
            logger.warn({ eventType: job.data.eventType }, "no handler registered for outbox event type");
        }
        else {
            await handler(job.data, { logger, prisma });
        }
        await prisma.outboxEvent.update({
            where: { id: job.data.outboxEventId },
            data: { status: database_1.OutboxEventStatus.PROCESSED, processedAt: new Date() },
        });
    }, { connection }).on("failed", (job, error) => {
        logger.error({ jobId: job?.id, err: error }, "outbox job failed");
        const exhausted = job && job.attemptsMade >= (job.opts.attempts ?? 1);
        if (exhausted) {
            prisma.outboxEvent
                .update({
                where: { id: job.data.outboxEventId },
                data: {
                    status: database_1.OutboxEventStatus.DEAD_LETTER,
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
