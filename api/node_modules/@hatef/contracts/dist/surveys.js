"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyAnalyticsSchema = exports.questionBreakdownSchema = exports.surveyStartResponseSchema = exports.surveySchema = exports.transitionSurveySchema = exports.createSurveySchema = exports.surveyStatusSchema = void 0;
const zod_1 = require("zod");
exports.surveyStatusSchema = zod_1.z.enum(["DRAFT", "OPEN", "CLOSED"]);
exports.createSurveySchema = zod_1.z.object({
    formId: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    targetChannelIds: zod_1.z.array(zod_1.z.string()).default([]),
    opensAt: zod_1.z.iso.datetime().optional(),
    closesAt: zod_1.z.iso.datetime().optional(),
});
exports.transitionSurveySchema = zod_1.z.object({ status: exports.surveyStatusSchema });
exports.surveySchema = zod_1.z.object({
    id: zod_1.z.string(),
    formId: zod_1.z.string(),
    formKey: zod_1.z.string(),
    formTitle: zod_1.z.string(),
    title: zod_1.z.string(),
    status: exports.surveyStatusSchema,
    targetChannelIds: zod_1.z.array(zod_1.z.string()),
    opensAt: zod_1.z.iso.datetime().nullable(),
    closesAt: zod_1.z.iso.datetime().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.surveyStartResponseSchema = zod_1.z.object({ formSubmissionId: zod_1.z.string() });
exports.questionBreakdownSchema = zod_1.z.object({
    fieldKey: zod_1.z.string(),
    label: zod_1.z.string(),
    type: zod_1.z.string(),
    responseCount: zod_1.z.number().int(),
    optionCounts: zod_1.z.array(zod_1.z.object({ value: zod_1.z.string(), label: zod_1.z.string(), count: zod_1.z.number().int() })).optional(),
    numericSummary: zod_1.z.object({ min: zod_1.z.number(), max: zod_1.z.number(), avg: zod_1.z.number() }).optional(),
});
exports.surveyAnalyticsSchema = zod_1.z.object({
    surveyId: zod_1.z.string(),
    startedCount: zod_1.z.number().int(),
    submittedCount: zod_1.z.number().int(),
    completionRate: zod_1.z.number(),
    questionBreakdown: zod_1.z.array(exports.questionBreakdownSchema),
});
