"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSnapshotSchema = exports.exportReportRunSchema = exports.reportRunSchema = exports.reportTableSchema = exports.runReportSchema = exports.reportDefinitionSchema = exports.createReportDefinitionSchema = exports.reportDatasetSchema = exports.reportColumnSchema = exports.reportFiltersSchema = exports.reportVisibilitySchema = exports.reportRunStatusSchema = void 0;
const zod_1 = require("zod");
exports.reportRunStatusSchema = zod_1.z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]);
exports.reportVisibilitySchema = zod_1.z.enum(["PRIVATE", "SHARED"]);
exports.reportFiltersSchema = zod_1.z.object({
    dateFrom: zod_1.z.iso.datetime().optional(),
    dateTo: zod_1.z.iso.datetime().optional(),
    channelId: zod_1.z.string().optional(),
});
exports.reportColumnSchema = zod_1.z.object({
    key: zod_1.z.string(),
    label: zod_1.z.string(),
    type: zod_1.z.enum(["string", "number", "date"]),
});
exports.reportDatasetSchema = zod_1.z.object({
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    dimensions: zod_1.z.array(zod_1.z.string()),
    metrics: zod_1.z.array(zod_1.z.string()),
});
exports.createReportDefinitionSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    datasetKey: zod_1.z.string().min(1),
    filters: exports.reportFiltersSchema.default({}),
    visibility: exports.reportVisibilitySchema.default("PRIVATE"),
});
exports.reportDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    name: zod_1.z.string(),
    datasetKey: zod_1.z.string(),
    filters: exports.reportFiltersSchema,
    visibility: exports.reportVisibilitySchema,
    createdById: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.runReportSchema = zod_1.z.object({
    datasetKey: zod_1.z.string().min(1),
    reportDefinitionId: zod_1.z.string().optional(),
    filters: exports.reportFiltersSchema.default({}),
});
exports.reportTableSchema = zod_1.z.object({
    columns: zod_1.z.array(exports.reportColumnSchema),
    rows: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())),
});
exports.reportRunSchema = zod_1.z.object({
    id: zod_1.z.string(),
    reportDefinitionId: zod_1.z.string().nullable(),
    datasetKey: zod_1.z.string(),
    filters: exports.reportFiltersSchema,
    status: exports.reportRunStatusSchema,
    rowCount: zod_1.z.number().int().nullable(),
    result: exports.reportTableSchema.nullable(),
    error: zod_1.z.string().nullable(),
    requestedById: zod_1.z.string(),
    requestedAt: zod_1.z.iso.datetime(),
    completedAt: zod_1.z.iso.datetime().nullable(),
});
exports.exportReportRunSchema = zod_1.z.object({ format: zod_1.z.enum(["CSV", "JSON"]) });
exports.reportSnapshotSchema = zod_1.z.object({
    id: zod_1.z.string(),
    reportRunId: zod_1.z.string(),
    format: zod_1.z.enum(["JSON", "CSV"]),
    content: zod_1.z.string(),
    rowCount: zod_1.z.number().int(),
    createdById: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
