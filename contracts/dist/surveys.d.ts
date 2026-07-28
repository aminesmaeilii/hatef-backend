import { z } from "zod";
export declare const surveyStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    OPEN: "OPEN";
    CLOSED: "CLOSED";
}>;
export type SurveyStatusKey = z.infer<typeof surveyStatusSchema>;
export declare const createSurveySchema: z.ZodObject<{
    formId: z.ZodString;
    title: z.ZodString;
    targetChannelIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
    opensAt: z.ZodOptional<z.ZodISODateTime>;
    closesAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type CreateSurvey = z.infer<typeof createSurveySchema>;
export declare const transitionSurveySchema: z.ZodObject<{
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        OPEN: "OPEN";
        CLOSED: "CLOSED";
    }>;
}, z.core.$strip>;
export type TransitionSurvey = z.infer<typeof transitionSurveySchema>;
export declare const surveySchema: z.ZodObject<{
    id: z.ZodString;
    formId: z.ZodString;
    formKey: z.ZodString;
    formTitle: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        OPEN: "OPEN";
        CLOSED: "CLOSED";
    }>;
    targetChannelIds: z.ZodArray<z.ZodString>;
    opensAt: z.ZodNullable<z.ZodISODateTime>;
    closesAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Survey = z.infer<typeof surveySchema>;
export declare const surveyStartResponseSchema: z.ZodObject<{
    formSubmissionId: z.ZodString;
}, z.core.$strip>;
export type SurveyStartResponse = z.infer<typeof surveyStartResponseSchema>;
export declare const questionBreakdownSchema: z.ZodObject<{
    fieldKey: z.ZodString;
    label: z.ZodString;
    type: z.ZodString;
    responseCount: z.ZodNumber;
    optionCounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
        count: z.ZodNumber;
    }, z.core.$strip>>>;
    numericSummary: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        avg: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type QuestionBreakdown = z.infer<typeof questionBreakdownSchema>;
export declare const surveyAnalyticsSchema: z.ZodObject<{
    surveyId: z.ZodString;
    startedCount: z.ZodNumber;
    submittedCount: z.ZodNumber;
    completionRate: z.ZodNumber;
    questionBreakdown: z.ZodArray<z.ZodObject<{
        fieldKey: z.ZodString;
        label: z.ZodString;
        type: z.ZodString;
        responseCount: z.ZodNumber;
        optionCounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
            count: z.ZodNumber;
        }, z.core.$strip>>>;
        numericSummary: z.ZodOptional<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            avg: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SurveyAnalytics = z.infer<typeof surveyAnalyticsSchema>;
//# sourceMappingURL=surveys.d.ts.map