import { z } from "zod";

export const surveyStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);
export type SurveyStatusKey = z.infer<typeof surveyStatusSchema>;

export const createSurveySchema = z.object({
  formId: z.string(),
  title: z.string().min(1),
  targetChannelIds: z.array(z.string()).default([]),
  opensAt: z.iso.datetime().optional(),
  closesAt: z.iso.datetime().optional(),
});
export type CreateSurvey = z.infer<typeof createSurveySchema>;

export const transitionSurveySchema = z.object({ status: surveyStatusSchema });
export type TransitionSurvey = z.infer<typeof transitionSurveySchema>;

export const surveySchema = z.object({
  id: z.string(),
  formId: z.string(),
  formKey: z.string(),
  formTitle: z.string(),
  title: z.string(),
  status: surveyStatusSchema,
  targetChannelIds: z.array(z.string()),
  opensAt: z.iso.datetime().nullable(),
  closesAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type Survey = z.infer<typeof surveySchema>;

export const surveyStartResponseSchema = z.object({ formSubmissionId: z.string() });
export type SurveyStartResponse = z.infer<typeof surveyStartResponseSchema>;

export const questionBreakdownSchema = z.object({
  fieldKey: z.string(),
  label: z.string(),
  type: z.string(),
  responseCount: z.number().int(),
  optionCounts: z.array(z.object({ value: z.string(), label: z.string(), count: z.number().int() })).optional(),
  numericSummary: z.object({ min: z.number(), max: z.number(), avg: z.number() }).optional(),
});
export type QuestionBreakdown = z.infer<typeof questionBreakdownSchema>;

export const surveyAnalyticsSchema = z.object({
  surveyId: z.string(),
  startedCount: z.number().int(),
  submittedCount: z.number().int(),
  completionRate: z.number(),
  questionBreakdown: z.array(questionBreakdownSchema),
});
export type SurveyAnalytics = z.infer<typeof surveyAnalyticsSchema>;
