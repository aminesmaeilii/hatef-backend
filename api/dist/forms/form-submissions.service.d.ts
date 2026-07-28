import type { FormSubmissionRevision, OnboardingStartResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { EvaluationService } from "../evaluation/evaluation.service";
export declare class FormSubmissionsService {
    private readonly prisma;
    private readonly auditLog;
    private readonly evaluation;
    constructor(prisma: PrismaService, auditLog: AuditLogService, evaluation: EvaluationService);
    /** Self-service bootstrap: provisions a PENDING channel + CHANNEL_OWNER grant for a brand-new partner, or reuses an existing one, then finds-or-creates the onboarding submission. */
    startOrResumeOnboarding(actor: RequestActor): Promise<OnboardingStartResponse>;
    /** Generic find-or-create, used by any module that needs a channel's submission against a published form without the onboarding-specific channel-provisioning/evaluation side effects (e.g. Phase 6 surveys). */
    findOrCreateSubmission(channelId: string, formId: string, submitterId: string): Promise<string>;
    getSubmission(channelId: string, submissionId: string): Promise<{
        submission: {
            id: string;
            formVersionId: string;
            channelId: string;
            status: "DRAFT" | "SUBMITTED";
            currentRevisionNumber: number;
            submittedAt: string | null;
            lastAutosaveAt: string | null;
            answers: Record<string, unknown>;
            openInformationRequestFieldKeys: string[];
            openInformationRequestMessage: string | null;
        };
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
        consents: {
            id: string;
            createdAt: Date;
            key: string;
            body: string;
            title: string;
            publishedAt: Date;
            version: number;
        }[];
    }>;
    patchAnswers(channelId: string, submissionId: string, answers: Record<string, unknown>): Promise<void>;
    getRevisions(channelId: string, submissionId: string): Promise<FormSubmissionRevision[]>;
    submit(channelId: string, submissionId: string, acceptedConsentDocumentIds: string[], actor: RequestActor, ip?: string): Promise<void>;
    /** Narrow, named special case — the one form field with a real 1:1 mapping onto Channel.eitaaId. Not a generic form↔entity sync mechanism. */
    private syncEitaaChannelId;
    /**
     * Every list/queue in admin-web shows Channel.title — this is the only
     * place it's populated from the partner's own answer instead of the
     * placeholder set at provisioning time, so it must run on every
     * submission (including correction resubmissions), not just the first.
     */
    private syncChannelName;
    private provisionChannel;
    /** Only the consent documents this specific form's CONSENT-type fields actually reference — not every consent document platform-wide. */
    private getRequiredConsentDocuments;
    private getOwnedSubmissionOrThrow;
}
//# sourceMappingURL=form-submissions.service.d.ts.map