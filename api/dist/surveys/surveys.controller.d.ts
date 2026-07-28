import { type CreateSurvey, type TransitionSurvey } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { SurveysService } from "./surveys.service";
/** Admin authoring/distribution of surveys — the actual pages/sections/fields still get built via the generic /forms admin UI. */
export declare class SurveysController {
    private readonly surveys;
    constructor(surveys: SurveysService);
    create(body: CreateSurvey, actor: RequestActor): Promise<{
        id: string;
        formId: string;
        formKey: string;
        formTitle: string;
        title: string;
        status: "DRAFT" | "OPEN" | "CLOSED";
        targetChannelIds: string[];
        opensAt: string | null;
        closesAt: string | null;
        createdAt: string;
    }>;
    list(): Promise<{
        id: string;
        formId: string;
        formKey: string;
        formTitle: string;
        title: string;
        status: "DRAFT" | "OPEN" | "CLOSED";
        targetChannelIds: string[];
        opensAt: string | null;
        closesAt: string | null;
        createdAt: string;
    }[]>;
    transition(surveyId: string, body: TransitionSurvey, actor: RequestActor): Promise<{
        id: string;
        formId: string;
        formKey: string;
        formTitle: string;
        title: string;
        status: "DRAFT" | "OPEN" | "CLOSED";
        targetChannelIds: string[];
        opensAt: string | null;
        closesAt: string | null;
        createdAt: string;
    }>;
    analytics(surveyId: string): Promise<{
        surveyId: string;
        startedCount: number;
        submittedCount: number;
        completionRate: number;
        questionBreakdown: {
            fieldKey: string;
            label: string;
            type: string;
            responseCount: number;
            optionCounts?: {
                value: string;
                label: string;
                count: number;
            }[] | undefined;
            numericSummary?: {
                min: number;
                max: number;
                avg: number;
            } | undefined;
        }[];
    }>;
}
/** Partner-facing — list surveys open to my channel, and start/resume a response (the response itself is then answered through the generic form-submissions endpoints). */
export declare class SurveysPartnerController {
    private readonly surveys;
    constructor(surveys: SurveysService);
    list(channelId: string): Promise<{
        id: string;
        formId: string;
        formKey: string;
        formTitle: string;
        title: string;
        status: "DRAFT" | "OPEN" | "CLOSED";
        targetChannelIds: string[];
        opensAt: string | null;
        closesAt: string | null;
        createdAt: string;
    }[]>;
    start(channelId: string, surveyId: string, actor: RequestActor): Promise<{
        formSubmissionId: string;
    }>;
}
//# sourceMappingURL=surveys.controller.d.ts.map