"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRunRequestedHandler = void 0;
const database_1 = require("@hatef/database");
function isReportRunRequestedPayload(value) {
    return typeof value === "object" && value !== null && typeof value.reportRunId === "string";
}
/**
 * Executes one ReportRun against its approved dataset (spec 20
 * "asynchronous execution" — this is the real async execution path; the
 * API only ever creates the PENDING row and enqueues this event, never
 * runs the query itself). `REPORT_DATASETS` from `@hatef/database` is the
 * single, shared "approved semantic dataset" registry both this worker and
 * backend/api's definition/dataset-listing endpoints read from.
 */
const reportRunRequestedHandler = async (event, { logger, prisma }) => {
    if (!isReportRunRequestedPayload(event.payload)) {
        logger.warn({ payload: event.payload }, "malformed report.run.requested payload, dropping");
        return;
    }
    const run = await prisma.reportRun.findUnique({ where: { id: event.payload.reportRunId } });
    if (!run || run.status !== "PENDING")
        return;
    await prisma.reportRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });
    const dataset = (0, database_1.getReportDataset)(run.datasetKey);
    if (!dataset) {
        await prisma.reportRun.update({
            where: { id: run.id },
            data: { status: "FAILED", error: `unknown dataset key: ${run.datasetKey}`, completedAt: new Date() },
        });
        return;
    }
    try {
        const table = await dataset.run(prisma, (run.filters ?? {}));
        await prisma.reportRun.update({
            where: { id: run.id },
            data: { status: "COMPLETED", resultJson: table, rowCount: table.rows.length, completedAt: new Date() },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.reportRun.update({ where: { id: run.id }, data: { status: "FAILED", error: message, completedAt: new Date() } });
        throw error;
    }
};
exports.reportRunRequestedHandler = reportRunRequestedHandler;
