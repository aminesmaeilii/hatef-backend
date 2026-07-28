import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  assignEvaluatorSchema,
  createNoteSchema,
  decideCaseSchema,
  evaluationCaseStatusSchema,
  requestCorrectionSchema,
  submitScoreSchema,
  type AssignEvaluator,
  type CreateNote,
  type DecideCase,
  type EvaluationCaseStatusKey,
  type RequestCorrection,
  type SubmitScore,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { EvaluationService } from "./evaluation.service";

@Controller("evaluation/cases")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class EvaluationController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EVALUATION_READ)
  async list(@Query("status") status?: string, @Query("channelId") channelId?: string) {
    const parsed = status ? evaluationCaseStatusSchema.parse(status) : undefined;
    return this.evaluation.listQueue(parsed as EvaluationCaseStatusKey | undefined, channelId);
  }

  @Get(":caseId")
  @RequirePermission(PERMISSIONS.EVALUATION_READ)
  async getOne(@Param("caseId") caseId: string) {
    return this.evaluation.getCaseDetail(caseId);
  }

  @Post(":caseId/assign")
  @RequirePermission(PERMISSIONS.EVALUATION_ASSIGN)
  async assign(
    @Param("caseId") caseId: string,
    @Body(new ZodValidationPipe(assignEvaluatorSchema)) body: AssignEvaluator,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.evaluation.assign(caseId, body, actor.userId);
    return { ok: true };
  }

  @Post(":caseId/advance")
  @RequirePermission(PERMISSIONS.EVALUATION_ASSIGN)
  async advance(@Param("caseId") caseId: string, @CurrentActor() actor: RequestActor) {
    await this.evaluation.advance(caseId, actor.userId);
    return { ok: true };
  }

  @Post(":caseId/request-correction")
  @RequirePermission(PERMISSIONS.EVALUATION_SCORE)
  async requestCorrection(
    @Param("caseId") caseId: string,
    @Body(new ZodValidationPipe(requestCorrectionSchema)) body: RequestCorrection,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.evaluation.requestCorrection(caseId, body, actor.userId);
    return { ok: true };
  }

  @Post(":caseId/score")
  @RequirePermission(PERMISSIONS.EVALUATION_SCORE)
  async score(
    @Param("caseId") caseId: string,
    @Body(new ZodValidationPipe(submitScoreSchema)) body: SubmitScore,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.evaluation.score(caseId, body, actor.userId);
    return { ok: true };
  }

  @Post(":caseId/decide")
  @RequirePermission(PERMISSIONS.EVALUATION_DECIDE)
  async decide(
    @Param("caseId") caseId: string,
    @Body(new ZodValidationPipe(decideCaseSchema)) body: DecideCase,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.evaluation.decide(caseId, body, actor.userId);
    return { ok: true };
  }

  @Post(":caseId/notes")
  @RequirePermission(PERMISSIONS.EVALUATION_NOTE)
  async addNote(
    @Param("caseId") caseId: string,
    @Body(new ZodValidationPipe(createNoteSchema)) body: CreateNote,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.evaluation.addNote(caseId, body.body, actor.userId);
    return { ok: true };
  }
}
