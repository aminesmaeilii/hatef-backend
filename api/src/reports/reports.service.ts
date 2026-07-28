import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { getReportDataset, listReportDatasets, type ReportTable } from "@hatef/database";
import type {
  CreateReportDefinition,
  ExportReportRun,
  ReportDataset,
  ReportDefinitionDto,
  ReportRunDto,
  ReportSnapshotDto,
  RunReport,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** The full "approved semantic dataset" menu (spec 20) — never a place to type a table/column name freehand. */
  listDatasets(): ReportDataset[] {
    return listReportDatasets();
  }

  async createDefinition(input: CreateReportDefinition, actor: RequestActor): Promise<ReportDefinitionDto> {
    if (!getReportDataset(input.datasetKey)) {
      throw new BadRequestException("مجموعه‌داده گزارش نامعتبر است.");
    }
    const created = await this.prisma.reportDefinition.create({
      data: {
        key: input.key,
        name: input.name,
        datasetKey: input.datasetKey,
        filters: input.filters as never,
        visibility: input.visibility,
        createdById: actor.userId,
      },
    });
    return toDefinitionDto(created);
  }

  async listDefinitions(actor: RequestActor): Promise<ReportDefinitionDto[]> {
    const rows = await this.prisma.reportDefinition.findMany({
      where: { OR: [{ visibility: "SHARED" }, { createdById: actor.userId }] },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDefinitionDto);
  }

  /** Creates a PENDING run and hands it to the outbox -> worker pipeline — the API itself never executes a dataset query (spec 20 "asynchronous execution"). */
  async runReport(input: RunReport, actor: RequestActor): Promise<ReportRunDto> {
    if (!getReportDataset(input.datasetKey)) {
      throw new BadRequestException("مجموعه‌داده گزارش نامعتبر است.");
    }
    const run = await this.prisma.reportRun.create({
      data: {
        reportDefinitionId: input.reportDefinitionId,
        datasetKey: input.datasetKey,
        filters: input.filters as never,
        requestedById: actor.userId,
      },
    });
    await this.prisma.outboxEvent.create({
      data: { eventType: "report.run.requested", payload: { reportRunId: run.id }, correlationId: run.id },
    });
    return toRunDto(run);
  }

  async getRun(runId: string): Promise<ReportRunDto> {
    const run = await this.prisma.reportRun.findUniqueOrThrow({ where: { id: runId } });
    return toRunDto(run);
  }

  async listRuns(actor: RequestActor): Promise<ReportRunDto[]> {
    const rows = await this.prisma.reportRun.findMany({
      where: { requestedById: actor.userId },
      orderBy: { requestedAt: "desc" },
      take: 50,
    });
    return rows.map(toRunDto);
  }

  /** "Official snapshot" + "export audit" (spec 20) — every export is both an immutable copy of the result and an audit-logged action. */
  async exportRun(runId: string, input: ExportReportRun, actor: RequestActor): Promise<ReportSnapshotDto> {
    const run = await this.prisma.reportRun.findUniqueOrThrow({ where: { id: runId } });
    if (run.status !== "COMPLETED" || !run.resultJson) {
      throw new BadRequestException("این اجرای گزارش هنوز تکمیل نشده است.");
    }
    if (run.requestedById !== actor.userId) {
      throw new ForbiddenException("فقط درخواست‌دهنده این گزارش می‌تواند آن را خروجی بگیرد.");
    }

    const table = run.resultJson as unknown as ReportTable;
    const content = input.format === "CSV" ? toCsv(table) : JSON.stringify(table.rows, null, 2);

    const snapshot = await this.prisma.reportSnapshot.create({
      data: { reportRunId: runId, format: input.format, content, rowCount: table.rows.length, createdById: actor.userId },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "report.exported",
      entityType: "report_run",
      entityId: runId,
      metadata: { format: input.format, rowCount: table.rows.length },
    });

    return {
      id: snapshot.id,
      reportRunId: snapshot.reportRunId,
      format: snapshot.format,
      content: snapshot.content,
      rowCount: snapshot.rowCount,
      createdById: snapshot.createdById,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  async getSnapshot(snapshotId: string): Promise<ReportSnapshotDto> {
    const snapshot = await this.prisma.reportSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) throw new NotFoundException("خروجی گزارش یافت نشد.");
    return {
      id: snapshot.id,
      reportRunId: snapshot.reportRunId,
      format: snapshot.format,
      content: snapshot.content,
      rowCount: snapshot.rowCount,
      createdById: snapshot.createdById,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }
}

function toCsv(table: ReportTable): string {
  const header = table.columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = table.rows.map((row) => table.columns.map((c) => escapeCsvCell(String(row[c.key] ?? ""))).join(","));
  return [header, ...lines].join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

type PrismaReportDefinition = {
  id: string;
  key: string;
  name: string;
  datasetKey: string;
  filters: unknown;
  visibility: string;
  createdById: string;
  createdAt: Date;
};

function toDefinitionDto(d: PrismaReportDefinition): ReportDefinitionDto {
  return {
    id: d.id,
    key: d.key,
    name: d.name,
    datasetKey: d.datasetKey,
    filters: d.filters as ReportDefinitionDto["filters"],
    visibility: d.visibility as ReportDefinitionDto["visibility"],
    createdById: d.createdById,
    createdAt: d.createdAt.toISOString(),
  };
}

type PrismaReportRun = {
  id: string;
  reportDefinitionId: string | null;
  datasetKey: string;
  filters: unknown;
  status: string;
  rowCount: number | null;
  resultJson: unknown;
  error: string | null;
  requestedById: string;
  requestedAt: Date;
  completedAt: Date | null;
};

function toRunDto(r: PrismaReportRun): ReportRunDto {
  return {
    id: r.id,
    reportDefinitionId: r.reportDefinitionId,
    datasetKey: r.datasetKey,
    filters: r.filters as ReportRunDto["filters"],
    status: r.status as ReportRunDto["status"],
    rowCount: r.rowCount,
    result: r.status === "COMPLETED" && r.resultJson ? (r.resultJson as ReportRunDto["result"]) : null,
    error: r.error,
    requestedById: r.requestedById,
    requestedAt: r.requestedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}
