import type { Request } from "express";
import { type PatchAnswers, type SubmitFormSubmission } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "./form-submissions.service";
export declare class FormSubmissionsController {
    private readonly formSubmissions;
    constructor(formSubmissions: FormSubmissionsService);
    getOne(channelId: string, submissionId: string): Promise<{
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
    getRevisions(channelId: string, submissionId: string): Promise<{
        id: string;
        revisionNumber: number;
        snapshot: Record<string, unknown>;
        submittedAt: string;
    }[]>;
    patchAnswers(channelId: string, submissionId: string, body: PatchAnswers): Promise<{
        ok: boolean;
    }>;
    submit(channelId: string, submissionId: string, body: SubmitFormSubmission, actor: RequestActor, req: Request): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=form-submissions.controller.d.ts.map