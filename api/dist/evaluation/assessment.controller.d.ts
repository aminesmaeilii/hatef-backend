import { EvaluationService } from "./evaluation.service";
/** Partner-facing simplified status + public timeline — never the internal 10-status workflow or internal notes. */
export declare class AssessmentController {
    private readonly evaluation;
    constructor(evaluation: EvaluationService);
    getAssessment(channelId: string): Promise<{
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
}
//# sourceMappingURL=assessment.controller.d.ts.map