import type { AssignEvaluator, DecideCase, EvaluationCaseStatusKey, RequestCorrection, SubmitScore } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import { NotificationsService } from "../notifications/notifications.service";
export declare class EvaluationService {
    private readonly prisma;
    private readonly auditLog;
    private readonly notifications;
    constructor(prisma: PrismaService, auditLog: AuditLogService, notifications: NotificationsService);
    /** Creates the case on first submission, or advances it on a correction resubmission. Called by FormSubmissionsService.submit(). */
    handleSubmissionSubmitted(channelId: string, formSubmissionId: string, actorId: string): Promise<void>;
    listQueue(statusFilter?: EvaluationCaseStatusKey, channelId?: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        status: import("@hatef/database").$Enums.EvaluationCaseStatus;
        slaDueAt: string | null;
        createdAt: string;
        assignedEvaluatorIds: string[];
    }[]>;
    getCaseDetail(caseId: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        status: import("@hatef/database").$Enums.EvaluationCaseStatus;
        formSubmissionId: string;
        definition: {
            id: string;
            formId: string;
            versionNumber: number;
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            publishedAt: string | null;
            pages: {
                id: string;
                order: number;
                title: string;
                description: string | null;
                sections: {
                    id: string;
                    order: number;
                    title: string;
                    description: string | null;
                    fields: {
                        id: string;
                        order: number;
                        key: string;
                        label: string;
                        type: "TEXT" | "LONG_TEXT" | "PHONE" | "NUMBER" | "JALALI_DATE" | "SINGLE_SELECT" | "MULTI_SELECT" | "REPEATABLE_GROUP" | "IMAGE" | "DOCUMENT" | "LINK" | "CONSENT";
                        required: boolean;
                        helpText: string | null;
                        placeholder: string | null;
                        config: unknown;
                        options: {
                            id: string;
                            order: number;
                            value: string;
                            label: string;
                        }[];
                    }[];
                }[];
            }[];
            rules: {
                id: string;
                targetFieldId: string;
                action: "SHOW" | "REQUIRE" | "HIDE";
                condition: {
                    sourceFieldKey: string;
                    operator: "in" | "equals" | "notEquals" | "notIn" | "isEmpty" | "isNotEmpty";
                    value?: unknown;
                };
            }[];
        };
        latestAnswers: string | number | boolean | import("@hatef/database/generated/client/runtime/library").JsonObject | import("@hatef/database/generated/client/runtime/library").JsonArray | null;
        assignments: {
            id: string;
            evaluatorId: string;
            evaluatorName: string;
            role: import("@hatef/database").$Enums.EvaluationAssignmentRole;
            conflictDeclared: boolean;
            assignedAt: string;
        }[];
        scores: {
            id: string;
            createdAt: Date;
            scores: import("@hatef/database/generated/client/runtime/library").JsonValue;
            evaluationCaseId: string;
            evaluatorId: string;
            rubricId: string;
            confidence: number;
            overrideReason: string | null;
            supervisorApproved: boolean;
        }[];
        decisions: {
            id: string;
            reason: string;
            decision: import("@hatef/database").$Enums.EvaluationDecisionType;
            evaluationCaseId: string;
            partnerVisibleReason: string;
            decidedBy: string;
            decidedAt: Date;
        }[];
        infoRequests: {
            message: string;
            status: import("@hatef/database").$Enums.InformationRequestStatus;
            id: string;
            createdAt: Date;
            evaluationCaseId: string;
            requestedFieldKeys: import("@hatef/database/generated/client/runtime/library").JsonValue;
            createdBy: string;
            resolvedAt: Date | null;
        }[];
        notes: {
            id: string;
            createdAt: Date;
            body: string;
            evaluationCaseId: string;
            authorId: string;
        }[];
        statusEvents: {
            id: string;
            createdAt: Date;
            evaluationCaseId: string;
            createdBy: string | null;
            fromStatus: import("@hatef/database").$Enums.EvaluationCaseStatus | null;
            toStatus: import("@hatef/database").$Enums.EvaluationCaseStatus;
            note: string | null;
            partnerVisible: boolean;
        }[];
    }>;
    getPartnerAssessment(channelId: string): Promise<{
        status: null;
        openInformationRequest: null;
        timeline: never[];
        partnerVisibleReason: null;
    } | {
        status: import("./evaluation-state-machine").PartnerFacingStatus;
        openInformationRequest: {
            requestedFieldKeys: string[];
            message: string;
        } | null;
        timeline: {
            id: string;
            toStatus: import("@hatef/database").$Enums.EvaluationCaseStatus;
            note: string | null;
            createdAt: string;
        }[];
        partnerVisibleReason: string | null;
    }>;
    assign(caseId: string, input: AssignEvaluator, actorId: string): Promise<void>;
    advance(caseId: string, actorId: string): Promise<void>;
    requestCorrection(caseId: string, input: RequestCorrection, actorId: string): Promise<void>;
    score(caseId: string, input: SubmitScore, actorId: string): Promise<void>;
    decide(caseId: string, input: DecideCase, actorId: string): Promise<void>;
    private getSubmitterId;
    addNote(caseId: string, body: string, actorId: string): Promise<void>;
    private transition;
}
//# sourceMappingURL=evaluation.service.d.ts.map