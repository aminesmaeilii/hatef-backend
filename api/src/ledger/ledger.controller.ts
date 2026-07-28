import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  decideFinancialApprovalSchema,
  postAdjustmentSchema,
  reverseTransactionSchema,
  type DecideFinancialApproval,
  type PostAdjustment,
  type ReverseTransaction,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "./ledger.service";
import { FinancialApprovalService } from "./financial-approval.service";

/** Admin/internal ledger read + manual adjustment/reversal. Partner-facing statement lives on the channel-scoped controller below. */
@Controller("ledger")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class LedgerController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly financialApprovals: FinancialApprovalService,
  ) {}

  @Post("adjustments")
  @RequirePermission(PERMISSIONS.LEDGER_ADJUST)
  async adjust(@Body(new ZodValidationPipe(postAdjustmentSchema)) body: PostAdjustment, @CurrentActor() actor: RequestActor) {
    return this.financialApprovals.requestAdjustment(body, actor);
  }

  @Post("transactions/:transactionId/reverse")
  @RequirePermission(PERMISSIONS.LEDGER_ADJUST)
  async reverse(
    @Param("transactionId") transactionId: string,
    @Body(new ZodValidationPipe(reverseTransactionSchema)) body: ReverseTransaction,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.ledger.reverse(transactionId, body.reason, actor.userId);
  }

  @Get("approvals")
  @RequirePermission(PERMISSIONS.FINANCIAL_APPROVAL_DECIDE)
  async listApprovals(@Query("status") status?: "PENDING" | "APPROVED" | "REJECTED") {
    return this.financialApprovals.listApprovals(status);
  }

  @Post("approvals/:requestId/decide")
  @RequirePermission(PERMISSIONS.FINANCIAL_APPROVAL_DECIDE)
  async decideApproval(
    @Param("requestId") requestId: string,
    @Body(new ZodValidationPipe(decideFinancialApprovalSchema)) body: DecideFinancialApproval,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.financialApprovals.decide(requestId, body, actor);
  }
}

/** Partner- and admin-shared read of one channel's statement (spec 16.5 "understandable statement"). */
@Controller("channels/:channelId/ledger")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ChannelLedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get("statement")
  @RequirePermission(PERMISSIONS.LEDGER_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async statement(@Param("channelId") channelId: string) {
    return this.ledger.getChannelStatement(channelId);
  }
}
