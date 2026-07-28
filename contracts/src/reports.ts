import { z } from "zod";

export const reportRunStatusSchema = z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]);
export type ReportRunStatusKey = z.infer<typeof reportRunStatusSchema>;

export const reportVisibilitySchema = z.enum(["PRIVATE", "SHARED"]);
export type ReportVisibilityKey = z.infer<typeof reportVisibilitySchema>;

export const reportFiltersSchema = z.object({
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  channelId: z.string().optional(),
});
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;

export const reportColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "number", "date"]),
});
export type ReportColumn = z.infer<typeof reportColumnSchema>;

export const reportDatasetSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  dimensions: z.array(z.string()),
  metrics: z.array(z.string()),
});
export type ReportDataset = z.infer<typeof reportDatasetSchema>;

export const createReportDefinitionSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  datasetKey: z.string().min(1),
  filters: reportFiltersSchema.default({}),
  visibility: reportVisibilitySchema.default("PRIVATE"),
});
export type CreateReportDefinition = z.infer<typeof createReportDefinitionSchema>;

export const reportDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  datasetKey: z.string(),
  filters: reportFiltersSchema,
  visibility: reportVisibilitySchema,
  createdById: z.string(),
  createdAt: z.iso.datetime(),
});
export type ReportDefinitionDto = z.infer<typeof reportDefinitionSchema>;

export const runReportSchema = z.object({
  datasetKey: z.string().min(1),
  reportDefinitionId: z.string().optional(),
  filters: reportFiltersSchema.default({}),
});
export type RunReport = z.infer<typeof runReportSchema>;

export const reportTableSchema = z.object({
  columns: z.array(reportColumnSchema),
  rows: z.array(z.record(z.string(), z.unknown())),
});
export type ReportTableDto = z.infer<typeof reportTableSchema>;

export const reportRunSchema = z.object({
  id: z.string(),
  reportDefinitionId: z.string().nullable(),
  datasetKey: z.string(),
  filters: reportFiltersSchema,
  status: reportRunStatusSchema,
  rowCount: z.number().int().nullable(),
  result: reportTableSchema.nullable(),
  error: z.string().nullable(),
  requestedById: z.string(),
  requestedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});
export type ReportRunDto = z.infer<typeof reportRunSchema>;

export const exportReportRunSchema = z.object({ format: z.enum(["CSV", "JSON"]) });
export type ExportReportRun = z.infer<typeof exportReportRunSchema>;

export const reportSnapshotSchema = z.object({
  id: z.string(),
  reportRunId: z.string(),
  format: z.enum(["JSON", "CSV"]),
  content: z.string(),
  rowCount: z.number().int(),
  createdById: z.string(),
  createdAt: z.iso.datetime(),
});
export type ReportSnapshotDto = z.infer<typeof reportSnapshotSchema>;
