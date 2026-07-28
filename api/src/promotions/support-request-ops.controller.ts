import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  calculatePriceSchema,
  createQuoteVersionSchema,
  overridePriceSchema,
  recordExecutionResultSchema,
  requestChangesSchema,
  rescheduleSupportRequestSchema,
  resolveDisputeSchema,
  scheduleSupportRequestSchema,
  supportRequestStatusSchema,
  verifyResultSchema,
  type CalculatePrice,
  type CreateQuoteVersion,
  type OverridePrice,
  type RecordExecutionResult,
  type RequestChanges,
  type RescheduleSupportRequest,
  type ResolveDispute,
  type ScheduleSupportRequest,
  type SupportRequestStatusKey,
  type VerifyResult,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { RequireStepUp } from "../auth/require-step-up.decorator";
import { StepUpGuard } from "../auth/step-up.guard";
import { SupportRequestsService } from "./support-requests.service";

/** Admin/internal operational queue + Kanban + workflow actions. */
@Controller("support-requests")
@UseGuards(SessionAuthGuard, PermissionGuard, StepUpGuard)
export class SupportRequestOpsController {
  constructor(private readonly supportRequests: SupportRequestsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ)
  async list(@Query("status") status?: string, @Query("channelId") channelId?: string) {
    const parsed = status ? supportRequestStatusSchema.parse(status) : undefined;
    return this.supportRequests.listQueue(parsed as SupportRequestStatusKey | undefined, channelId);
  }

  @Get(":requestId")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_READ)
  async getOne(@Param("requestId") requestId: string) {
    return this.supportRequests.getDetail(requestId);
  }

  @Post(":requestId/advance")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async advance(@Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    await this.supportRequests.advance(requestId, actor);
    return { ok: true };
  }

  @Post(":requestId/validate")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async validate(@Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    await this.supportRequests.validate(requestId, actor);
    return { ok: true };
  }

  @Post(":requestId/request-changes")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async requestChanges(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(requestChangesSchema)) body: RequestChanges,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.requestChanges(requestId, body.message, actor);
    return { ok: true };
  }

  @Post(":requestId/price/calculate")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_PRICE)
  async calculatePrice(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(calculatePriceSchema)) body: CalculatePrice,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.calculatePrice(requestId, body, actor);
  }

  @Post(":requestId/price/override")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_PRICE)
  async overridePrice(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(overridePriceSchema)) body: OverridePrice,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.overridePrice(requestId, body, actor);
  }

  @Post(":requestId/price/approve")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_APPROVE)
  @RequireStepUp()
  async approvePrice(@Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    return this.supportRequests.approvePrice(requestId, actor);
  }

  @Post(":requestId/quotes")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_QUOTE)
  async createQuoteVersion(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(createQuoteVersionSchema)) body: CreateQuoteVersion,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.createQuoteVersion(requestId, body, actor);
  }

  @Post(":requestId/send-to-approval")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async sendToApproval(@Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    await this.supportRequests.sendToApproval(requestId, actor);
    return { ok: true };
  }

  @Post(":requestId/internal-approve")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_APPROVE)
  async internalApprove(@Param("requestId") requestId: string, @CurrentActor() actor: RequestActor) {
    await this.supportRequests.internalApprove(requestId, actor);
    return { ok: true };
  }

  @Post(":requestId/verify-result")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async verifyResult(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(verifyResultSchema)) body: VerifyResult,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.verifyResult(requestId, body, actor);
    return { ok: true };
  }

  @Post(":requestId/dispute")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async raiseDispute(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(requestChangesSchema)) body: RequestChanges,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.raiseDispute(requestId, body.message, actor);
    return { ok: true };
  }

  @Post(":requestId/resolve-dispute")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_APPROVE)
  async resolveDispute(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(resolveDisputeSchema)) body: ResolveDispute,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.supportRequests.resolveDispute(requestId, body, actor);
    return { ok: true };
  }

  @Post(":requestId/schedule")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async schedule(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(scheduleSupportRequestSchema)) body: ScheduleSupportRequest,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.schedulePromotion(requestId, body, actor);
  }

  @Post(":requestId/reschedule")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async reschedule(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(rescheduleSupportRequestSchema)) body: RescheduleSupportRequest,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.reschedulePromotion(requestId, body, actor);
  }

  @Post(":requestId/execution-result")
  @RequirePermission(PERMISSIONS.SUPPORT_REQUEST_VALIDATE)
  async recordExecutionResult(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(recordExecutionResultSchema)) body: RecordExecutionResult,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.supportRequests.recordExecutionResult(requestId, body, actor);
  }
}
