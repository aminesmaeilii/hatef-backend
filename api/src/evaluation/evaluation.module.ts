import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { EvaluationService } from "./evaluation.service";
import { EvaluationController } from "./evaluation.controller";
import { AssessmentController } from "./assessment.controller";
import { RubricsService } from "./rubrics.service";
import { RubricsController } from "./rubrics.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule, NotificationsModule],
  controllers: [EvaluationController, AssessmentController, RubricsController],
  providers: [EvaluationService, RubricsService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
