import { type AssignEvaluator, type CreateNote, type DecideCase, type RequestCorrection, type SubmitScore } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { EvaluationService } from "./evaluation.service";
export declare class EvaluationController {
    private readonly evaluation;
    constructor(evaluation: EvaluationService);
    list(status?: string, channelId?: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        status: import("@hatef/database").$Enums.EvaluationCaseStatus;
        slaDueAt: string | null;
        createdAt: string;
        assignedEvaluatorIds: string[];
    }[]>;
    getOne(caseId: string): Promise<{
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
    assign(caseId: string, body: AssignEvaluator, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    advance(caseId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    requestCorrection(caseId: string, body: RequestCorrection, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    score(caseId: string, body: SubmitScore, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    decide(caseId: string, body: DecideCase, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    addNote(caseId: string, body: CreateNote, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=evaluation.controller.d.ts.map