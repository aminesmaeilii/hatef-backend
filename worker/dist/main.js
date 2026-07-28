"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("@hatef/config");
const observability_1 = require("@hatef/observability");
const database_1 = require("@hatef/database");
const health_server_1 = require("./health-server");
const relay_1 = require("./outbox/relay");
const processor_1 = require("./outbox/processor");
const handlers_1 = require("./outbox/handlers");
const handlers_2 = require("./notifications/handlers");
const handlers_3 = require("./reports/handlers");
async function main() {
    const env = (0, config_1.loadEnv)(process.env);
    const logger = (0, observability_1.createLogger)({ serviceName: "worker", pretty: env.NODE_ENV !== "production" });
    (0, handlers_1.registerOutboxHandler)("notification.deliver", (0, handlers_2.createNotificationDeliverHandler)(env));
    (0, handlers_1.registerOutboxHandler)("report.run.requested", handlers_3.reportRunRequestedHandler);
    const prisma = new database_1.PrismaClient();
    await prisma.$connect();
    logger.info("connected to PostgreSQL");
    const connection = new ioredis_1.default(env.REDIS_URL, { maxRetriesPerRequest: null });
    const queue = new bullmq_1.Queue(relay_1.OUTBOX_QUEUE_NAME, { connection });
    const worker = (0, processor_1.startOutboxProcessor)(prisma, connection, logger);
    const relayHandle = (0, relay_1.startOutboxRelay)(prisma, queue, logger);
    (0, health_server_1.startHealthServer)(env.WORKER_PORT, logger);
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
