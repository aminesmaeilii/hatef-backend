import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createLogger } from "@hatef/observability";
import { PrismaClient } from "@hatef/database";
import { reportRunRequestedHandler } from "./handlers";

const prisma = new PrismaClient();
const logger = createLogger({ serviceName: "worker-test", pretty: false });

const createdUserIds: string[] = [];
const createdTicketIds: string[] = [];
const createdRunIds: string[] = [];

afterAll(async () => {
  await prisma.reportRun.deleteMany({ where: { id: { in: createdRunIds } } });
  await prisma.ticketStatusEvent.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
  await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
});

describe("reportRunRequestedHandler (real DB)", () => {
  it("executes the ticket_sla dataset against real ticket rows and completes the run with the exact live counts", async () => {
    const user = await prisma.user.create({ data: { displayName: `Report Worker Test ${randomUUID().slice(0, 8)}` } });
    createdUserIds.push(user.id);

    const subjectTag = `report-test-${randomUUID().slice(0, 8)}`;
    const newTicket = await prisma.ticket.create({
      data: { category: "OTHER", priority: "MEDIUM", status: "NEW", subject: subjectTag, createdById: user.id },
    });
    const resolvedTicket = await prisma.ticket.create({
      data: { category: "OTHER", priority: "MEDIUM", status: "RESOLVED", subject: subjectTag, createdById: user.id },
    });
    createdTicketIds.push(newTicket.id, resolvedTicket.id);

    const run = await prisma.reportRun.create({
      data: { datasetKey: "ticket_sla", filters: {}, requestedById: user.id },
    });
    createdRunIds.push(run.id);

    await reportRunRequestedHandler(
      { eventType: "report.run.requested", payload: { reportRunId: run.id }, correlationId: run.id },
      { logger, prisma },
    );

    const completed = await prisma.reportRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(completed.status).toBe("COMPLETED");
    expect(completed.rowCount).toBeGreaterThan(0);

    const table = completed.resultJson as { columns: { key: string }[]; rows: Record<string, unknown>[] };
    const newRow = table.rows.find((r) => r.status === "NEW");
    const resolvedRow = table.rows.find((r) => r.status === "RESOLVED");
    // Real data, not a mock: our two freshly-created tickets are reflected in the live counts for their exact statuses.
    expect((newRow?.count as number) ?? 0).toBeGreaterThanOrEqual(1);
    expect((resolvedRow?.count as number) ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("fails a run for an unknown dataset key rather than silently returning empty data", async () => {
    const user = await prisma.user.create({ data: { displayName: `Report Worker Test ${randomUUID().slice(0, 8)}` } });
    createdUserIds.push(user.id);

    const run = await prisma.reportRun.create({ data: { datasetKey: "not_a_real_dataset", filters: {}, requestedById: user.id } });
    createdRunIds.push(run.id);

    await reportRunRequestedHandler(
      { eventType: "report.run.requested", payload: { reportRunId: run.id }, correlationId: run.id },
      { logger, prisma },
    );

    const failed = await prisma.reportRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toContain("not_a_real_dataset");
  });
});
