"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@hatef/database");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
let ReportsService = class ReportsService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    /** The full "approved semantic dataset" menu (spec 20) — never a place to type a table/column name freehand. */
    listDatasets() {
        return (0, database_1.listReportDatasets)();
    }
    async createDefinition(input, actor) {
        if (!(0, database_1.getReportDataset)(input.datasetKey)) {
            throw new common_1.BadRequestException("مجموعه‌داده گزارش نامعتبر است.");
        }
        const created = await this.prisma.reportDefinition.create({
            data: {
                key: input.key,
                name: input.name,
                datasetKey: input.datasetKey,
                filters: input.filters,
                visibility: input.visibility,
                createdById: actor.userId,
            },
        });
        return toDefinitionDto(created);
    }
    async listDefinitions(actor) {
        const rows = await this.prisma.reportDefinition.findMany({
            where: { OR: [{ visibility: "SHARED" }, { createdById: actor.userId }] },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toDefinitionDto);
    }
    /** Creates a PENDING run and hands it to the outbox -> worker pipeline — the API itself never executes a dataset query (spec 20 "asynchronous execution"). */
    async runReport(input, actor) {
        if (!(0, database_1.getReportDataset)(input.datasetKey)) {
            throw new common_1.BadRequestException("مجموعه‌داده گزارش نامعتبر است.");
        }
        const run = await this.prisma.reportRun.create({
            data: {
                reportDefinitionId: input.reportDefinitionId,
                datasetKey: input.datasetKey,
                filters: input.filters,
                requestedById: actor.userId,
            },
        });
        await this.prisma.outboxEvent.create({
            data: { eventType: "report.run.requested", payload: { reportRunId: run.id }, correlationId: run.id },
        });
        return toRunDto(run);
    }
    async getRun(runId) {
        const run = await this.prisma.reportRun.findUniqueOrThrow({ where: { id: runId } });
        return toRunDto(run);
    }
    async listRuns(actor) {
        const rows = await this.prisma.reportRun.findMany({
            where: { requestedById: actor.userId },
            orderBy: { requestedAt: "desc" },
            take: 50,
        });
        return rows.map(toRunDto);
    }
    /** "Official snapshot" + "export audit" (spec 20) — every export is both an immutable copy of the result and an audit-logged action. */
    async exportRun(runId, input, actor) {
        const run = await this.prisma.reportRun.findUniqueOrThrow({ where: { id: runId } });
        if (run.status !== "COMPLETED" || !run.resultJson) {
            throw new common_1.BadRequestException("این اجرای گزارش هنوز تکمیل نشده است.");
        }
        if (run.requestedById !== actor.userId) {
            throw new common_1.ForbiddenException("فقط درخواست‌دهنده این گزارش می‌تواند آن را خروجی بگیرد.");
        }
        const table = run.resultJson;
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
    async getSnapshot(snapshotId) {
        const snapshot = await this.prisma.reportSnapshot.findUnique({ where: { id: snapshotId } });
        if (!snapshot)
            throw new common_1.NotFoundException("خروجی گزارش یافت نشد.");
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], ReportsService);
function toCsv(table) {
    const header = table.columns.map((c) => escapeCsvCell(c.label)).join(",");
    const lines = table.rows.map((row) => table.columns.map((c) => escapeCsvCell(String(row[c.key] ?? ""))).join(","));
    return [header, ...lines].join("\n");
}
function escapeCsvCell(value) {
    if (/[",\n]/.test(value))
        return `"${value.replace(/"/g, '""')}"`;
    return value;
}
function toDefinitionDto(d) {
    return {
        id: d.id,
        key: d.key,
        name: d.name,
        datasetKey: d.datasetKey,
        filters: d.filters,
        visibility: d.visibility,
        createdById: d.createdById,
        createdAt: d.createdAt.toISOString(),
    };
}
function toRunDto(r) {
    return {
        id: r.id,
        reportDefinitionId: r.reportDefinitionId,
        datasetKey: r.datasetKey,
        filters: r.filters,
        status: r.status,
        rowCount: r.rowCount,
        result: r.status === "COMPLETED" && r.resultJson ? r.resultJson : null,
        error: r.error,
        requestedById: r.requestedById,
        requestedAt: r.requestedAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
    };
}
