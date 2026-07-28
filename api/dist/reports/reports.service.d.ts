import type { CreateReportDefinition, ExportReportRun, ReportDataset, ReportDefinitionDto, ReportRunDto, ReportSnapshotDto, RunReport } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
export declare class ReportsService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    /** The full "approved semantic dataset" menu (spec 20) — never a place to type a table/column name freehand. */
    listDatasets(): ReportDataset[];
    createDefinition(input: CreateReportDefinition, actor: RequestActor): Promise<ReportDefinitionDto>;
    listDefinitions(actor: RequestActor): Promise<ReportDefinitionDto[]>;
    /** Creates a PENDING run and hands it to the outbox -> worker pipeline — the API itself never executes a dataset query (spec 20 "asynchronous execution"). */
    runReport(input: RunReport, actor: RequestActor): Promise<ReportRunDto>;
    getRun(runId: string): Promise<ReportRunDto>;
    listRuns(actor: RequestActor): Promise<ReportRunDto[]>;
    /** "Official snapshot" + "export audit" (spec 20) — every export is both an immutable copy of the result and an audit-logged action. */
    exportRun(runId: string, input: ExportReportRun, actor: RequestActor): Promise<ReportSnapshotDto>;
    getSnapshot(snapshotId: string): Promise<ReportSnapshotDto>;
}
//# sourceMappingURL=reports.service.d.ts.map