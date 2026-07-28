import { type CreateReportDefinition, type ExportReportRun, type RunReport } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { ReportsService } from "./reports.service";
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    listDatasets(): Promise<{
        key: string;
        name: string;
        description: string;
        dimensions: string[];
        metrics: string[];
    }[]>;
    createDefinition(body: CreateReportDefinition, actor: RequestActor): Promise<{
        id: string;
        key: string;
        name: string;
        datasetKey: string;
        filters: {
            dateFrom?: string | undefined;
            dateTo?: string | undefined;
            channelId?: string | undefined;
        };
        visibility: "PRIVATE" | "SHARED";
        createdById: string;
        createdAt: string;
    }>;
    listDefinitions(actor: RequestActor): Promise<{
        id: string;
        key: string;
        name: string;
        datasetKey: string;
        filters: {
            dateFrom?: string | undefined;
            dateTo?: string | undefined;
            channelId?: string | undefined;
        };
        visibility: "PRIVATE" | "SHARED";
        createdById: string;
        createdAt: string;
    }[]>;
    run(body: RunReport, actor: RequestActor): Promise<{
        id: string;
        reportDefinitionId: string | null;
        datasetKey: string;
        filters: {
            dateFrom?: string | undefined;
            dateTo?: string | undefined;
            channelId?: string | undefined;
        };
        status: "PENDING" | "COMPLETED" | "FAILED" | "RUNNING";
        rowCount: number | null;
        result: {
            columns: {
                key: string;
                label: string;
                type: "string" | "number" | "date";
            }[];
            rows: Record<string, unknown>[];
        } | null;
        error: string | null;
        requestedById: string;
        requestedAt: string;
        completedAt: string | null;
    }>;
    listRuns(actor: RequestActor): Promise<{
        id: string;
        reportDefinitionId: string | null;
        datasetKey: string;
        filters: {
            dateFrom?: string | undefined;
            dateTo?: string | undefined;
            channelId?: string | undefined;
        };
        status: "PENDING" | "COMPLETED" | "FAILED" | "RUNNING";
        rowCount: number | null;
        result: {
            columns: {
                key: string;
                label: string;
                type: "string" | "number" | "date";
            }[];
            rows: Record<string, unknown>[];
        } | null;
        error: string | null;
        requestedById: string;
        requestedAt: string;
        completedAt: string | null;
    }[]>;
    getRun(runId: string): Promise<{
        id: string;
        reportDefinitionId: string | null;
        datasetKey: string;
        filters: {
            dateFrom?: string | undefined;
            dateTo?: string | undefined;
            channelId?: string | undefined;
        };
        status: "PENDING" | "COMPLETED" | "FAILED" | "RUNNING";
        rowCount: number | null;
        result: {
            columns: {
                key: string;
                label: string;
                type: "string" | "number" | "date";
            }[];
            rows: Record<string, unknown>[];
        } | null;
        error: string | null;
        requestedById: string;
        requestedAt: string;
        completedAt: string | null;
    }>;
    exportRun(runId: string, body: ExportReportRun, actor: RequestActor): Promise<{
        id: string;
        reportRunId: string;
        format: "CSV" | "JSON";
        content: string;
        rowCount: number;
        createdById: string;
        createdAt: string;
    }>;
    getSnapshot(snapshotId: string): Promise<{
        id: string;
        reportRunId: string;
        format: "CSV" | "JSON";
        content: string;
        rowCount: number;
        createdById: string;
        createdAt: string;
    }>;
}
//# sourceMappingURL=reports.controller.d.ts.map