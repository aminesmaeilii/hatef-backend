import { getReportDataset, type ReportFilters } from "@hatef/database";
import type { OutboxEventHandler } from "../outbox/handlers";

interface ReportRunRequestedPayload {
  reportRunId: string;
}

function isReportRunRequestedPayload(value: unknown): value is ReportRunRequestedPayload {
  return typeof value === "object" && value !== null && typeof (value as { reportRunId?: unknown }).reportRunId === "string";
}

/**
 * Executes one ReportRun against its approved dataset (spec 20
 * "asynchronous execution" — this is the real async execution path; the
 * API only ever creates the PENDING row and enqueues this event, never
 * runs the query itself). `REPORT_DATASETS` from `@hatef/database` is the
 * single, shared "approved semantic dataset" registry both this worker and
 * backend/api's definition/dataset-listing endpoints read from.
 */
export const reportRunRequestedHandler: OutboxEventHandler = async (event, { logger, prisma }) => {
  if (!isReportRunRequestedPayload(event.payload)) {
    logger.warn({ payload: event.payload }, "malformed report.run.requested payload, dropping");
    return;
  }

  const run = await prisma.reportRun.findUnique({ where: { id: event.payload.reportRunId } });
  if (!run || run.status !== "PENDING") return;

  await prisma.reportRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });

  const dataset = getReportDataset(run.datasetKey);
  if (!dataset) {
    await prisma.reportRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: `unknown dataset key: ${run.datasetKey}`, completedAt: new Date() },
    });
    return;
  }

  try {
    const table = await dataset.run(prisma, (run.filters ?? {}) as ReportFilters);
    await prisma.reportRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", resultJson: table as never, rowCount: table.rows.length, completedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.reportRun.update({ where: { id: run.id }, data: { status: "FAILED", error: message, completedAt: new Date() } });
    throw error;
  }
};
