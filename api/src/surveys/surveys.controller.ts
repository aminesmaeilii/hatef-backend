import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createSurveySchema, transitionSurveySchema, type CreateSurvey, type TransitionSurvey } from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { SurveysService } from "./surveys.service";

/** Admin authoring/distribution of surveys — the actual pages/sections/fields still get built via the generic /forms admin UI. */
@Controller("surveys")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class SurveysController {
  constructor(private readonly surveys: SurveysService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SURVEY_MANAGE)
  async create(@Body(new ZodValidationPipe(createSurveySchema)) body: CreateSurvey, @CurrentActor() actor: RequestActor) {
    return this.surveys.create(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.SURVEY_READ)
  async list() {
    return this.surveys.list();
  }

  @Post(":surveyId/transition")
  @RequirePermission(PERMISSIONS.SURVEY_MANAGE)
  async transition(
    @Param("surveyId") surveyId: string,
    @Body(new ZodValidationPipe(transitionSurveySchema)) body: TransitionSurvey,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.surveys.transition(surveyId, body.status, actor);
  }

  @Get(":surveyId/analytics")
  @RequirePermission(PERMISSIONS.SURVEY_MANAGE)
  async analytics(@Param("surveyId") surveyId: string) {
    return this.surveys.getAnalytics(surveyId);
  }
}

/** Partner-facing — list surveys open to my channel, and start/resume a response (the response itself is then answered through the generic form-submissions endpoints). */
@Controller("channels/:channelId/surveys")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class SurveysPartnerController {
  constructor(private readonly surveys: SurveysService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SURVEY_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async list(@Param("channelId") channelId: string) {
    return this.surveys.listForChannel(channelId);
  }

  @Post(":surveyId/start")
  @RequirePermission(PERMISSIONS.SURVEY_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async start(@Param("channelId") channelId: string, @Param("surveyId") surveyId: string, @CurrentActor() actor: RequestActor) {
    return this.surveys.startOrResume(surveyId, channelId, actor);
  }
}
