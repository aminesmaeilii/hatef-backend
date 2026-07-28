import { z } from "zod";

export const evaluationCaseStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "IDENTITY_CHECK",
  "UNDER_REVIEW",
  "NEEDS_CHANGES",
  "RESUBMITTED",
  "APPROVED",
  "CONDITIONALLY_APPROVED",
  "WAITLISTED",
  "REJECTED",
]);
export type EvaluationCaseStatusKey = z.infer<typeof evaluationCaseStatusSchema>;

export const evaluationCaseSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  formSubmissionId: z.string(),
  status: evaluationCaseStatusSchema,
  slaDueAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;

export const assignEvaluatorSchema = z.object({
  evaluatorId: z.string(),
  role: z.enum(["EVALUATOR", "SUPERVISOR"]),
});
export type AssignEvaluator = z.infer<typeof assignEvaluatorSchema>;

export const evaluationAssignmentSchema = z.object({
  id: z.string(),
  evaluatorId: z.string(),
  evaluatorName: z.string(),
  role: z.enum(["EVALUATOR", "SUPERVISOR"]),
  conflictDeclared: z.boolean(),
  assignedAt: z.iso.datetime(),
});
export type EvaluationAssignment = z.infer<typeof evaluationAssignmentSchema>;

export const rubricCriterionSchema = z.object({
  key: z.string(),
  label: z.string(),
  maxScore: z.number(),
  weight: z.number(),
});
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

export const evaluationRubricSchema = z.object({
  id: z.string(),
  key: z.string(),
  versionNumber: z.number().int(),
  title: z.string(),
  criteria: z.array(rubricCriterionSchema),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
export type EvaluationRubric = z.infer<typeof evaluationRubricSchema>;

export const submitScoreSchema = z.object({
  rubricId: z.string(),
  scores: z.record(z.string(), z.number()),
  confidence: z.number().int().min(1).max(5),
  overrideReason: z.string().optional(),
});
export type SubmitScore = z.infer<typeof submitScoreSchema>;

export const evaluationScoreSchema = z.object({
  id: z.string(),
  rubricId: z.string(),
  evaluatorId: z.string(),
  scores: z.record(z.string(), z.number()),
  confidence: z.number().int(),
  overrideReason: z.string().nullable(),
  supervisorApproved: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type EvaluationScore = z.infer<typeof evaluationScoreSchema>;

export const requestCorrectionSchema = z.object({
  requestedFieldKeys: z.array(z.string()).min(1),
  message: z.string().min(1),
});
export type RequestCorrection = z.infer<typeof requestCorrectionSchema>;

export const informationRequestSchema = z.object({
  id: z.string(),
  requestedFieldKeys: z.array(z.string()),
  message: z.string(),
  status: z.enum(["OPEN", "RESOLVED"]),
  createdAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
});
export type InformationRequest = z.infer<typeof informationRequestSchema>;

export const decideCaseSchema = z.object({
  decision: z.enum(["APPROVED", "CONDITIONALLY_APPROVED", "WAITLISTED", "REJECTED"]),
});
export type DecideCase = z.infer<typeof decideCaseSchema>;

/**
 * Single source of truth for the case status graph, shared by the backend
 * (which wraps this in @hatef/domain's StateMachine for enforcement) and the
 * admin UI (which uses it to only ever offer decisions that can actually
 * succeed, instead of discovering illegal transitions from a 400 response).
 */
export const EVALUATION_TRANSITIONS: Record<EvaluationCaseStatusKey, EvaluationCaseStatusKey[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["IDENTITY_CHECK"],
  IDENTITY_CHECK: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["NEEDS_CHANGES", "APPROVED", "CONDITIONALLY_APPROVED", "WAITLISTED", "REJECTED"],
  NEEDS_CHANGES: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW"],
  CONDITIONALLY_APPROVED: ["APPROVED", "REJECTED"],
  WAITLISTED: ["UNDER_REVIEW", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

const DECISION_VALUES = decideCaseSchema.shape.decision.options;

/** The decisions that can legally be submitted from the case's current status, in display order. */
export function getAvailableDecisions(status: EvaluationCaseStatusKey): DecideCase["decision"][] {
  const candidates = EVALUATION_TRANSITIONS[status] ?? [];
  return DECISION_VALUES.filter((decision) => candidates.includes(decision));
}

/** Internal view — includes the not-partner-visible `reason`. */
export const evaluationDecisionSchema = z.object({
  id: z.string(),
  decision: z.enum(["APPROVED", "CONDITIONALLY_APPROVED", "WAITLISTED", "REJECTED"]),
  reason: z.string(),
  partnerVisibleReason: z.string(),
  decidedAt: z.iso.datetime(),
});
export type EvaluationDecision = z.infer<typeof evaluationDecisionSchema>;

export const createNoteSchema = z.object({ body: z.string().min(1) });
export type CreateNote = z.infer<typeof createNoteSchema>;

/** Internal-only — never returned from any partner-facing endpoint. */
export const evaluationNoteSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type EvaluationNote = z.infer<typeof evaluationNoteSchema>;

/** Partner-facing timeline entry — no internal note text, no actor identity. */
export const timelineEventSchema = z.object({
  id: z.string(),
  toStatus: evaluationCaseStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
