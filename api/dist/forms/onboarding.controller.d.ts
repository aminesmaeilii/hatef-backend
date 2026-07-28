import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "./form-submissions.service";
/** Self-service entry point — any authenticated partner user may start onboarding, no RequirePermission gate (see FormSubmissionsService.startOrResumeOnboarding). */
export declare class OnboardingController {
    private readonly formSubmissions;
    constructor(formSubmissions: FormSubmissionsService);
    start(actor: RequestActor): Promise<{
        channelId: string;
        formSubmissionId: string;
    }>;
}
//# sourceMappingURL=onboarding.controller.d.ts.map