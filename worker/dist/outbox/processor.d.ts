import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import type { Logger } from "@hatef/observability";
import { PrismaClient } from "@hatef/database";
import { type OutboxEventPayload } from "./handlers";
interface OutboxJobData extends OutboxEventPayload {
    outboxEventId: string;
}
export declare function startOutboxProcessor(prisma: PrismaClient, connection: Redis, logger: Logger): Worker<OutboxJobData>;
export {};
//# sourceMappingURL=processor.d.ts.map