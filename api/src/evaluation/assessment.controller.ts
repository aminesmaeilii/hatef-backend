import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { PERMISSIONS } from "@hatef/auth";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { EvaluationService } from "./evaluation.service";

/** Partner-facing simplified status + public timeline — never the internal 10-status workflow or internal notes. */
@Controller("channels/:channelId/assessment")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AssessmentController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get()
  @RequirePermission(PERMISSIONS.FORM_SUBMISSION_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async getAssessment(@Param("channelId") channelId: string) {
    return this.evaluation.getPartnerAssessment(channelId);
  }
}
