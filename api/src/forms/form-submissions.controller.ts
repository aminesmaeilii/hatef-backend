import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import {
  patchAnswersSchema,
  submitFormSubmissionSchema,
  type PatchAnswers,
  type SubmitFormSubmission,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "./form-submissions.service";

const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" } as const;

@Controller("channels/:channelId/form-submissions")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class FormSubmissionsController {
  constructor(private readonly formSubmissions: FormSubmissionsService) {}

  @Get(":submissionId")
  @RequirePermission(PERMISSIONS.FORM_SUBMISSION_READ, CHANNEL_SCOPE)
  async getOne(@Param("channelId") channelId: string, @Param("submissionId") submissionId: string) {
    return this.formSubmissions.getSubmission(channelId, submissionId);
  }

  @Get(":submissionId/revisions")
  @RequirePermission(PERMISSIONS.FORM_SUBMISSION_READ, CHANNEL_SCOPE)
  async getRevisions(@Param("channelId") channelId: string, @Param("submissionId") submissionId: string) {
    return this.formSubmissions.getRevisions(channelId, submissionId);
  }

  @Patch(":submissionId/answers")
  @RequirePermission(PERMISSIONS.FORM_SUBMISSION_MANAGE, CHANNEL_SCOPE)
  async patchAnswers(
    @Param("channelId") channelId: string,
    @Param("submissionId") submissionId: string,
    @Body(new ZodValidationPipe(patchAnswersSchema)) body: PatchAnswers,
  ) {
    await this.formSubmissions.patchAnswers(channelId, submissionId, body.answers);
    return { ok: true };
  }

  @Post(":submissionId/submit")
  @RequirePermission(PERMISSIONS.FORM_SUBMISSION_MANAGE, CHANNEL_SCOPE)
  async submit(
    @Param("channelId") channelId: string,
    @Param("submissionId") submissionId: string,
    @Body(new ZodValidationPipe(submitFormSubmissionSchema)) body: SubmitFormSubmission,
    @CurrentActor() actor: RequestActor,
    @Req() req: Request,
  ) {
    await this.formSubmissions.submit(channelId, submissionId, body.acceptedConsentDocumentIds, actor, req.ip);
    return { ok: true };
  }
}
