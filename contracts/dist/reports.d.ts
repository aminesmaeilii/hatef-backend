import { z } from "zod";
export declare const reportRunStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    RUNNING: "RUNNING";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
}>;
export type ReportRunStatusKey = z.infer<typeof reportRunStatusSchema>;
export declare const reportVisibilitySchema: z.ZodEnum<{
    PRIVATE: "PRIVATE";
    SHARED: "SHARED";
}>;
export type ReportVisibilityKey = z.infer<typeof reportVisibilitySchema>;
export declare const reportFiltersSchema: z.ZodObject<{
    dateFrom: z.ZodOptional<z.ZodISODateTime>;
    dateTo: z.ZodOptional<z.ZodISODateTime>;
    channelId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export declare const reportColumnSchema: z.ZodObject<{
    key: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<{
        string: "string";
        number: "number";
        date: "date";
    }>;
}, z.core.$strip>;
export type ReportColumn = z.infer<typeof reportColumnSchema>;
export declare const reportDatasetSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    dimensions: z.ZodArray<z.ZodString>;
    metrics: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ReportDataset = z.infer<typeof reportDatasetSchema>;
export declare const createReportDefinitionSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    datasetKey: z.ZodString;
    filters: z.ZodDefault<z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodISODateTime>;
        dateTo: z.ZodOptional<z.ZodISODateTime>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    visibility: z.ZodDefault<z.ZodEnum<{
        PRIVATE: "PRIVATE";
        SHARED: "SHARED";
    }>>;
}, z.core.$strip>;
export type CreateReportDefinition = z.infer<typeof createReportDefinitionSchema>;
export declare const reportDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    name: z.ZodString;
    datasetKey: z.ZodString;
    filters: z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodISODateTime>;
        dateTo: z.ZodOptional<z.ZodISODateTime>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    visibility: z.ZodEnum<{
        PRIVATE: "PRIVATE";
        SHARED: "SHARED";
    }>;
    createdById: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type ReportDefinitionDto = z.infer<typeof reportDefinitionSchema>;
export declare const runReportSchema: z.ZodObject<{
    datasetKey: z.ZodString;
    reportDefinitionId: z.ZodOptional<z.ZodString>;
    filters: z.ZodDefault<z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodISODateTime>;
        dateTo: z.ZodOptional<z.ZodISODateTime>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RunReport = z.infer<typeof runReportSchema>;
export declare const reportTableSchema: z.ZodObject<{
    columns: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<{
            string: "string";
            number: "number";
            date: "date";
        }>;
    }, z.core.$strip>>;
    rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ReportTableDto = z.infer<typeof reportTableSchema>;
export declare const reportRunSchema: z.ZodObject<{
    id: z.ZodString;
    reportDefinitionId: z.ZodNullable<z.ZodString>;
    datasetKey: z.ZodString;
    filters: z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodISODateTime>;
        dateTo: z.ZodOptional<z.ZodISODateTime>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        RUNNING: "RUNNING";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
    }>;
    rowCount: z.ZodNullable<z.ZodNumber>;
    result: z.ZodNullable<z.ZodObject<{
        columns: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<{
                string: "string";
                number: "number";
                date: "date";
            }>;
        }, z.core.$strip>>;
        rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    error: z.ZodNullable<z.ZodString>;
    requestedById: z.ZodString;
    requestedAt: z.ZodISODateTime;
    completedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type ReportRunDto = z.infer<typeof reportRunSchema>;
export declare const exportReportRunSchema: z.ZodObject<{
    format: z.ZodEnum<{
        CSV: "CSV";
        JSON: "JSON";
    }>;
}, z.core.$strip>;
export type ExportReportRun = z.infer<typeof exportReportRunSchema>;
export declare const reportSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    reportRunId: z.ZodString;
    format: z.ZodEnum<{
        CSV: "CSV";
        JSON: "JSON";
    }>;
    content: z.ZodString;
    rowCount: z.ZodNumber;
    createdById: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type ReportSnapshotDto = z.infer<typeof reportSnapshotSchema>;
//# sourceMappingURL=reports.d.ts.map