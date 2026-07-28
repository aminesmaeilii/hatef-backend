"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTBOX_QUEUE_NAME = void 0;
exports.startOutboxRelay = startOutboxRelay;
exports.relayOnce = relayOnce;
const database_1 = require("@hatef/database");
exports.OUTBOX_QUEUE_NAME = "outbox-events";
/**
 * Polls the transactional outbox table for rows a business transaction has
 * already committed, and hands each one to the queue for at-least-once
 * delivery. Runs on a short interval rather than LISTEN/NOTIFY to keep
 * Phase 0 infrastructure simple; can be swapped for a trigger later
 * without changing the queue/worker contract.
 */
function startOutboxRelay(prisma, queue, logger, intervalMs = 2000) {
    return setInterval(() => {
        relayOnce(prisma, queue, logger).catch((error) => {
            logger.error({ err: error }, "outbox relay tick failed");
        });
    }, intervalMs);
}
async function relayOnce(prisma, queue, logger) {
    const pending = await prisma.outboxEvent.findMany({
        where: { status: database_1.OutboxEventStatus.PENDING, availableAt: { lte: new Date() } },
        take: 25,
        orderBy: { availableAt: "asc" },
    });
    for (const event of pending) {
        await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: database_1.OutboxEventStatus.PROCESSING },
        });
        await queue.add(event.eventType, {
            outboxEventId: event.id,
            eventType: event.eventType,
            payload: event.payload,
            correlationId: event.correlationId,
        }, { jobId: event.id, attempts: 5, backoff: { type: "exponential", delay: 1000 } });
    }
    if (pending.length > 0) {
        logger.debug({ count: pending.length }, "relayed pending outbox events to queue");
    }
    return pending.length;
}
