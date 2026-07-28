import type { PrismaClient } from "../../generated/client";
export interface ReportColumn {
    key: string;
    label: string;
    type: "string" | "number" | "date";
}
export interface ReportTable {
    columns: ReportColumn[];
    rows: Record<string, unknown>[];
}
export interface ReportFilters {
    dateFrom?: string;
    dateTo?: string;
    channelId?: string;
}
export interface ReportDatasetDefinition {
    key: string;
    name: string;
    description: string;
    dimensions: string[];
    metrics: string[];
    run(prisma: PrismaClient, filters: ReportFilters): Promise<ReportTable>;
}
/**
 * The full set of queries any report/dashboard is allowed to run (spec 20:
 * "approved semantic datasets, not unrestricted direct SQL"). A dataset key
 * from user input is only ever used to look up an entry here — never
 * interpolated into a query string. Each `run()` is a plain, reviewable
 * Prisma query (manual group-by-reduce, same style TasksService.
 * workloadByAssignee already uses, rather than Prisma's groupBy — simpler to
 * reason about for BigInt sums and small result sets). Both `backend/api`
 * (synchronous preview / definition CRUD) and `backend/worker` (the actual
 * async ReportRun execution) import this same registry, so there is exactly
 * one implementation of "what a report query does."
 */
export declare const REPORT_DATASETS: Record<string, ReportDatasetDefinition>;
export declare function getReportDataset(key: string): ReportDatasetDefinition | undefined;
export declare function listReportDatasets(): ReportDatasetDefinition[];
//# sourceMappingURL=index.d.ts.map