"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelineEventSchema = exports.evaluationNoteSchema = exports.createNoteSchema = exports.evaluationDecisionSchema = exports.EVALUATION_TRANSITIONS = exports.decideCaseSchema = exports.informationRequestSchema = exports.requestCorrectionSchema = exports.evaluationScoreSchema = exports.submitScoreSchema = exports.evaluationRubricSchema = exports.rubricCriterionSchema = exports.evaluationAssignmentSchema = exports.assignEvaluatorSchema = exports.evaluationCaseSchema = exports.evaluationCaseStatusSchema = void 0;
exports.getAvailableDecisions = getAvailableDecisions;
const zod_1 = require("zod");
exports.evaluationCaseStatusSchema = zod_1.z.enum([
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
exports.evaluationCaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    channelId: zod_1.z.string(),
    formSubmissionId: zod_1.z.string(),
    status: exports.evaluationCaseStatusSchema,
    slaDueAt: zod_1.z.iso.datetime().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.assignEvaluatorSchema = zod_1.z.object({
    evaluatorId: zod_1.z.string(),
    role: zod_1.z.enum(["EVALUATOR", "SUPERVISOR"]),
});
exports.evaluationAssignmentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    evaluatorId: zod_1.z.string(),
    evaluatorName: zod_1.z.string(),
    role: zod_1.z.enum(["EVALUATOR", "SUPERVISOR"]),
    conflictDeclared: zod_1.z.boolean(),
    assignedAt: zod_1.z.iso.datetime(),
});
exports.rubricCriterionSchema = zod_1.z.object({
    key: zod_1.z.string(),
    label: zod_1.z.string(),
    maxScore: zod_1.z.number(),
    weight: zod_1.z.number(),
});
exports.evaluationRubricSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    title: zod_1.z.string(),
    criteria: zod_1.z.array(exports.rubricCriterionSchema),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
exports.submitScoreSchema = zod_1.z.object({
    rubricId: zod_1.z.string(),
    scores: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    confidence: zod_1.z.number().int().min(1).max(5),
    overrideReason: zod_1.z.string().optional(),
});
exports.evaluationScoreSchema = zod_1.z.object({
    id: zod_1.z.string(),
    rubricId: zod_1.z.string(),
    evaluatorId: zod_1.z.string(),
    scores: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    confidence: zod_1.z.number().int(),
    overrideReason: zod_1.z.string().nullable(),
    supervisorApproved: zod_1.z.boolean(),
    createdAt: zod_1.z.iso.datetime(),
});
exports.requestCorrectionSchema = zod_1.z.object({
    requestedFieldKeys: zod_1.z.array(zod_1.z.string()).min(1),
    message: zod_1.z.string().min(1),
});
exports.informationRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    requestedFieldKeys: zod_1.z.array(zod_1.z.string()),
    message: zod_1.z.string(),
    status: zod_1.z.enum(["OPEN", "RESOLVED"]),
    createdAt: zod_1.z.iso.datetime(),
    resolvedAt: zod_1.z.iso.datetime().nullable(),
});
exports.decideCaseSchema = zod_1.z.object({
    decision: zod_1.z.enum(["APPROVED", "CONDITIONALLY_APPROVED", "WAITLISTED", "REJECTED"]),
});
/**
 * Single source of truth for the case status graph, shared by the backend
 * (which wraps this in @hatef/domain's StateMachine for enforcement) and the
 * admin UI (which uses it to only ever offer decisions that can actually
 * succeed, instead of discovering illegal transitions from a 400 response).
 */
exports.EVALUATION_TRANSITIONS = {
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
const DECISION_VALUES = exports.decideCaseSchema.shape.decision.options;
/** The decisions that can legally be submitted from the case's current status, in display order. */
function getAvailableDecisions(status) {
    const candidates = exports.EVALUATION_TRANSITIONS[status] ?? [];
    return DECISION_VALUES.filter((decision) => candidates.includes(decision));
}
/** Internal view — includes the not-partner-visible `reason`. */
exports.evaluationDecisionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    decision: zod_1.z.enum(["APPROVED", "CONDITIONALLY_APPROVED", "WAITLISTED", "REJECTED"]),
    reason: zod_1.z.string(),
    partnerVisibleReason: zod_1.z.string(),
    decidedAt: zod_1.z.iso.datetime(),
});
exports.createNoteSchema = zod_1.z.object({ body: zod_1.z.string().min(1) });
/** Internal-only — never returned from any partner-facing endpoint. */
exports.evaluationNoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    authorId: zod_1.z.string(),
    body: zod_1.z.string(),
    createdAt: zod_1.z.iso.datetime(),
});
/** Partner-facing timeline entry — no internal note text, no actor identity. */
exports.timelineEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    toStatus: exports.evaluationCaseStatusSchema,
    note: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
});
