import { Controller, Post, UseGuards } from "@nestjs/common";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "./form-submissions.service";

/** Self-service entry point — any authenticated partner user may start onboarding, no RequirePermission gate (see FormSubmissionsService.startOrResumeOnboarding). */
@Controller("onboarding")
@UseGuards(SessionAuthGuard)
export class OnboardingController {
  constructor(private readonly formSubmissions: FormSubmissionsService) {}

  @Post("start")
  async start(@CurrentActor() actor: RequestActor) {
    return this.formSubmissions.startOrResumeOnboarding(actor);
  }
}
