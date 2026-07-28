import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { FormsModule } from "../forms/forms.module";
import { SurveysService } from "./surveys.service";
import { SurveysController, SurveysPartnerController } from "./surveys.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, FormsModule],
  controllers: [SurveysController, SurveysPartnerController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
