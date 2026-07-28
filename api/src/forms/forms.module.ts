import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { FormsService } from "./forms.service";
import { FormsController } from "./forms.controller";
import { PublishedFormsController } from "./published-forms.controller";
import { FormSubmissionsService } from "./form-submissions.service";
import { FormSubmissionsController } from "./form-submissions.controller";
import { OnboardingController } from "./onboarding.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, EvaluationModule],
  controllers: [FormsController, PublishedFormsController, FormSubmissionsController, OnboardingController],
  providers: [FormsService, FormSubmissionsService],
  exports: [FormsService, FormSubmissionsService],
})
export class FormsModule {}
