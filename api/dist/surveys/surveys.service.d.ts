import type { CreateSurvey, Survey, SurveyAnalytics } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "../forms/form-submissions.service";
export declare class SurveysService {
    private readonly prisma;
    private readonly formSubmissions;
    private readonly auditLog;
    constructor(prisma: PrismaService, formSubmissions: FormSubmissionsService, auditLog: AuditLogService);
    /** Spec 10.11: "reuse the same form engine rather than creating a second incompatible system" — this only adds distribution metadata on top of an existing Form. */
    create(input: CreateSurvey, actor: RequestActor): Promise<Survey>;
    transition(surveyId: string, status: Survey["status"], actor: RequestActor): Promise<Survey>;
    list(): Promise<Survey[]>;
    /** Only surveys currently open, targeting this channel (or every channel if untargeted), and within their open/close window. */
    listForChannel(channelId: string): Promise<Survey[]>;
    startOrResume(surveyId: string, channelId: string, actor: RequestActor): Promise<{
        formSubmissionId: string;
    }>;
    getAnalytics(surveyId: string): Promise<SurveyAnalytics>;
}
//# sourceMappingURL=surveys.service.d.ts.map