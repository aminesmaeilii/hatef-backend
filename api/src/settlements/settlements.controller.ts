import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createSettlementSchema,
  decideFinancialApprovalSchema,
  type CreateSettlement,
  type DecideFinancialApproval,
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
import { SettlementsService } from "./settlements.service";

@Controller("settlements")
@UseGuards(SessionAuthGuard, PermissionGuard, StepUpGuard)
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SETTLEMENT_MANAGE)
  async create(@Body(new ZodValidationPipe(createSettlementSchema)) body: CreateSettlement, @CurrentActor() actor: RequestActor) {
    return this.settlements.create(body, actor);
  }

  @Get(":settlementId")
  @RequirePermission(PERMISSIONS.SETTLEMENT_MANAGE)
  async getOne(@Param("settlementId") settlementId: string) {
    return this.settlements.getOne(settlementId);
  }

  @Post(":settlementId/submit")
  @RequirePermission(PERMISSIONS.SETTLEMENT_MANAGE)
  async submit(@Param("settlementId") settlementId: string, @CurrentActor() actor: RequestActor) {
    return this.settlements.submitForApproval(settlementId, actor);
  }

  @Post(":settlementId/decide")
  @RequirePermission(PERMISSIONS.FINANCIAL_APPROVAL_DECIDE)
  @RequireStepUp()
  async decide(
    @Param("settlementId") settlementId: string,
    @Body(new ZodValidationPipe(decideFinancialApprovalSchema)) body: DecideFinancialApproval,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.settlements.decideApproval(settlementId, body, actor);
  }
}

@Controller("channels/:channelId/settlements")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ChannelSettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.LEDGER_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async list(@Param("channelId") channelId: string) {
    return this.settlements.listForChannel(channelId);
  }
}
