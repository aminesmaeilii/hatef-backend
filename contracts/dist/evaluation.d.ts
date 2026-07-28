import { z } from "zod";
export declare const evaluationCaseStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SUBMITTED: "SUBMITTED";
    APPROVED: "APPROVED";
    REJECTED: "REJECTED";
    IDENTITY_CHECK: "IDENTITY_CHECK";
    UNDER_REVIEW: "UNDER_REVIEW";
    NEEDS_CHANGES: "NEEDS_CHANGES";
    RESUBMITTED: "RESUBMITTED";
    CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED";
    WAITLISTED: "WAITLISTED";
}>;
export type EvaluationCaseStatusKey = z.infer<typeof evaluationCaseStatusSchema>;
export declare const evaluationCaseSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    formSubmissionId: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SUBMITTED: "SUBMITTED";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        IDENTITY_CHECK: "IDENTITY_CHECK";
        UNDER_REVIEW: "UNDER_REVIEW";
        NEEDS_CHANGES: "NEEDS_CHANGES";
        RESUBMITTED: "RESUBMITTED";
        CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED";
        WAITLISTED: "WAITLISTED";
    }>;
    slaDueAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export declare const assignEvaluatorSchema: z.ZodObject<{
    evaluatorId: z.ZodString;
    role: z.ZodEnum<{
        EVALUATOR: "EVALUATOR";
        SUPERVISOR: "SUPERVISOR";
    }>;
}, z.core.$strip>;
export type AssignEvaluator = z.infer<typeof assignEvaluatorSchema>;
export declare const evaluationAssignmentSchema: z.ZodObject<{
    id: z.ZodString;
    evaluatorId: z.ZodString;
    evaluatorName: z.ZodString;
    role: z.ZodEnum<{
        EVALUATOR: "EVALUATOR";
        SUPERVISOR: "SUPERVISOR";
    }>;
    conflictDeclared: z.ZodBoolean;
    assignedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type EvaluationAssignment = z.infer<typeof evaluationAssignmentSchema>;
export declare const rubricCriterionSchema: z.ZodObject<{
    key: z.ZodString;
    label: z.ZodString;
    maxScore: z.ZodNumber;
    weight: z.ZodNumber;
}, z.core.$strip>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export declare const evaluationRubricSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    versionNumber: z.ZodNumber;
    title: z.ZodString;
    criteria: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        maxScore: z.ZodNumber;
        weight: z.ZodNumber;
    }, z.core.$strip>>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
}, z.core.$strip>;
export type EvaluationRubric = z.infer<typeof evaluationRubricSchema>;
export declare const submitScoreSchema: z.ZodObject<{
    rubricId: z.ZodString;
    scores: z.ZodRecord<z.ZodString, z.ZodNumber>;
    confidence: z.ZodNumber;
    overrideReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmitScore = z.infer<typeof submitScoreSchema>;
export declare const evaluationScoreSchema: z.ZodObject<{
    id: z.ZodString;
    rubricId: z.ZodString;
    evaluatorId: z.ZodString;
    scores: z.ZodRecord<z.ZodString, z.ZodNumber>;
    confidence: z.ZodNumber;
    overrideReason: z.ZodNullable<z.ZodString>;
    supervisorApproved: z.ZodBoolean;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type EvaluationScore = z.infer<typeof evaluationScoreSchema>;
export declare const requestCorrectionSchema: z.ZodObject<{
    requestedFieldKeys: z.ZodArray<z.ZodString>;
    message: z.ZodString;
}, z.core.$strip>;
export type RequestCorrection = z.infer<typeof requestCorrectionSchema>;
export declare const informationRequestSchema: z.ZodObject<{
    id: z.ZodString;
    requestedFieldKeys: z.ZodArray<z.ZodString>;
    message: z.ZodString;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
    }>;
    createdAt: z.ZodISODateTime;
    resolvedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type InformationRequest = z.infer<typeof informationRequestSchema>;
export declare const decideCaseSchema: z.ZodObject<{
    decision: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED";
        WAITLISTED: "WAITLISTED";
    }>;
}, z.core.$strip>;
export type DecideCase = z.infer<typeof decideCaseSchema>;
/**
 * Single source of truth for the case status graph, shared by the backend
 * (which wraps this in @hatef/domain's StateMachine for enforcement) and the
 * admin UI (which uses it to only ever offer decisions that can actually
 * succeed, instead of discovering illegal transitions from a 400 response).
 */
export declare const EVALUATION_TRANSITIONS: Record<EvaluationCaseStatusKey, EvaluationCaseStatusKey[]>;
/** The decisions that can legally be submitted from the case's current status, in display order. */
export declare function getAvailableDecisions(status: EvaluationCaseStatusKey): DecideCase["decision"][];
/** Internal view — includes the not-partner-visible `reason`. */
export declare const evaluationDecisionSchema: z.ZodObject<{
    id: z.ZodString;
    decision: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED";
        WAITLISTED: "WAITLISTED";
    }>;
    reason: z.ZodString;
    partnerVisibleReason: z.ZodString;
    decidedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type EvaluationDecision = z.infer<typeof evaluationDecisionSchema>;
export declare const createNoteSchema: z.ZodObject<{
    body: z.ZodString;
}, z.core.$strip>;
export type CreateNote = z.infer<typeof createNoteSchema>;
/** Internal-only — never returned from any partner-facing endpoint. */
export declare const evaluationNoteSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    body: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type EvaluationNote = z.infer<typeof evaluationNoteSchema>;
/** Partner-facing timeline entry — no internal note text, no actor identity. */
export declare const timelineEventSchema: z.ZodObject<{
    id: z.ZodString;
    toStatus: z.ZodEnum<{
        DRAFT: "DRAFT";
        SUBMITTED: "SUBMITTED";
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
        IDENTITY_CHECK: "IDENTITY_CHECK";
        UNDER_REVIEW: "UNDER_REVIEW";
        NEEDS_CHANGES: "NEEDS_CHANGES";
        RESUBMITTED: "RESUBMITTED";
        CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED";
        WAITLISTED: "WAITLISTED";
    }>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
//# sourceMappingURL=evaluation.d.ts.map