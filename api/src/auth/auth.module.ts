import { Module } from "@nestjs/common";
import { SmsModule } from "../sms/sms.module";
import { SessionModule } from "../session/session.module";
import { AuditModule } from "../audit/audit.module";
import { OtpService } from "./otp.service";
import { InternalAuthService } from "./internal-auth.service";
import { StepUpService } from "./step-up.service";
import { StepUpGuard } from "./step-up.guard";
import { WorkspaceService } from "./workspace.service";
import { PartnerAuthController } from "./partner-auth.controller";
import { InternalAuthController } from "./internal-auth.controller";
import { SessionController } from "./session.controller";

@Module({
  imports: [SmsModule, SessionModule, AuditModule],
  controllers: [PartnerAuthController, InternalAuthController, SessionController],
  providers: [OtpService, InternalAuthService, StepUpService, StepUpGuard, WorkspaceService],
  exports: [StepUpGuard],
})
export class AuthModule {}
