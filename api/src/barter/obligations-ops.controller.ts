import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  createObligationSchema,
  createObligationProposalSchema,
  raiseDisputeSchema,
  resolveObligationDisputeSchema,
  reviewDeliverableSchema,
  transitionObligationSchema,
  type CreateObligation,
  type CreateObligationProposal,
  type RaiseDispute,
  type ResolveObligationDispute,
  type ReviewDeliverable,
  type TransitionObligation,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { ObligationsService } from "./obligations.service";

/** Admin/internal — propose obligations, negotiate, review deliverables, resolve disputes (spec 16.3-16.5). */
@Controller("obligations")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ObligationsOpsController {
  constructor(private readonly obligations: ObligationsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.OBLIGATION_MANAGE)
  async propose(@Body(new ZodValidationPipe(createObligationSchema)) body: CreateObligation, @CurrentActor() actor: RequestActor) {
    return this.obligations.propose(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.OBLIGATION_READ)
  async list(@Query("channelId") channelId?: string, @Query("status") status?: string) {
    return this.obligations.list({ channelId, status });
  }

  @Get(":obligationId")
  @RequirePermission(PERMISSIONS.OBLIGATION_READ)
  async getOne(@Param("obligationId") obligationId: string) {
    return this.obligations.getDetail(obligationId);
  }

  @Post(":obligationId/proposals")
  @RequirePermission(PERMISSIONS.OBLIGATION_NEGOTIATE)
  async counterPropose(
    @Param("obligationId") obligationId: string,
    @Body(new ZodValidationPipe(createObligationProposalSchema)) body: CreateObligationProposal,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.counterPropose(obligationId, body, actor);
  }

  @Post(":obligationId/transition")
  @RequirePermission(PERMISSIONS.OBLIGATION_MANAGE)
  async transition(
    @Param("obligationId") obligationId: string,
    @Body(new ZodValidationPipe(transitionObligationSchema)) body: TransitionObligation,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.transition(obligationId, body.toStatus, body.note, actor);
  }

  @Get(":obligationId/deliverables")
  @RequirePermission(PERMISSIONS.OBLIGATION_READ)
  async listDeliverables(@Param("obligationId") obligationId: string) {
    return this.obligations.listDeliverables(obligationId);
  }

  @Post("deliverables/:deliverableId/review")
  @RequirePermission(PERMISSIONS.DELIVERABLE_REVIEW)
  async reviewDeliverable(
    @Param("deliverableId") deliverableId: string,
    @Body(new ZodValidationPipe(reviewDeliverableSchema)) body: ReviewDeliverable,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.reviewDeliverable(deliverableId, body, actor);
  }

  @Post(":obligationId/disputes")
  @RequirePermission(PERMISSIONS.DISPUTE_MANAGE)
  async raiseDispute(
    @Param("obligationId") obligationId: string,
    @Body(new ZodValidationPipe(raiseDisputeSchema)) body: RaiseDispute,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.raiseDispute(obligationId, body, actor);
  }

  @Post("disputes/:disputeId/resolve")
  @RequirePermission(PERMISSIONS.DISPUTE_MANAGE)
  async resolveDispute(
    @Param("disputeId") disputeId: string,
    @Body(new ZodValidationPipe(resolveObligationDisputeSchema)) body: ResolveObligationDispute,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.resolveDispute(disputeId, body, actor);
  }
}
