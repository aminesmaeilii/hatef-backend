import { Queue } from "bullmq";
import type { Logger } from "@hatef/observability";
import { PrismaClient } from "@hatef/database";
export declare const OUTBOX_QUEUE_NAME = "outbox-events";
/**
 * Polls the transactional outbox table for rows a business transaction has
 * already committed, and hands each one to the queue for at-least-once
 * delivery. Runs on a short interval rather than LISTEN/NOTIFY to keep
 * Phase 0 infrastructure simple; can be swapped for a trigger later
 * without changing the queue/worker contract.
 */
export declare function startOutboxRelay(prisma: PrismaClient, queue: Queue, logger: Logger, intervalMs?: number): NodeJS.Timeout;
export declare function relayOnce(prisma: PrismaClient, queue: Queue, logger: Logger): Promise<number>;
//# sourceMappingURL=relay.d.ts.map