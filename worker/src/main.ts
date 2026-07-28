import { Queue } from "bullmq";
import Redis from "ioredis";
import { loadEnv } from "@hatef/config";
import { createLogger } from "@hatef/observability";
import { PrismaClient } from "@hatef/database";
import { startHealthServer } from "./health-server";
import { OUTBOX_QUEUE_NAME, startOutboxRelay } from "./outbox/relay";
import { startOutboxProcessor } from "./outbox/processor";
import { registerOutboxHandler } from "./outbox/handlers";
import { createNotificationDeliverHandler } from "./notifications/handlers";
import { reportRunRequestedHandler } from "./reports/handlers";

async function main(): Promise<void> {
  const env = loadEnv(process.env);
  const logger = createLogger({ serviceName: "worker", pretty: env.NODE_ENV !== "production" });

  registerOutboxHandler("notification.deliver", createNotificationDeliverHandler(env));
  registerOutboxHandler("report.run.requested", reportRunRequestedHandler);

  const prisma = new PrismaClient();
  await prisma.$connect();
  logger.info("connected to PostgreSQL");

  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue(OUTBOX_QUEUE_NAME, { connection });

  const worker = startOutboxProcessor(prisma, connection, logger);
  const relayHandle = startOutboxRelay(prisma, queue, logger);

  startHealthServer(env.WORKER_PORT, logger);
  logger.info("outbox relay and worker started");

  const shutdown = async () => {
    logger.info("shutting down worker");
    clearInterval(relayHandle);
    await worker.close();
    await queue.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("worker failed to start", error);
  process.exit(1);
});
