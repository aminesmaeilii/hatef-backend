import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { serializeRial } from "@hatef/domain";
import type { DecideFinancialApproval, FinancialApprovalRequest, PostAdjustment } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL, LedgerService } from "./ledger.service";

interface AdjustmentPayload {
  channelId: string;
  accountType: PostAdjustment["accountType"];
  direction: PostAdjustment["direction"];
  amountRial: string;
}

@Injectable()
export class FinancialApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Manual adjustment requires permission (enforced by the controller's
   * @RequirePermission) and a reason (spec 16.1). Below the threshold it
   * posts immediately; at or above it, a FinancialApprovalRequest is
   * created instead and nothing becomes a ledger fact until a second,
   * distinct user approves it (spec 16.1 "high-value adjustment requires
   * second approval").
   */
  async requestAdjustment(input: PostAdjustment, actor: RequestActor) {
    const amount = BigInt(input.amountRial);

    if (amount < HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL) {
      const tx = await this.ledger.post({
        transactionType: "ADJUSTMENT",
        idempotencyKey: `adjustment:${crypto.randomUUID()}`,
        sourceType: "manual_adjustment",
        reason: input.reason,
        createdBy: actor.userId,
        entries: [
          { channelId: input.channelId, accountType: input.accountType, direction: input.direction, amountRial: amount },
          {
            channelId: null,
            accountType: "PLATFORM_SUPPORT_POOL",
            direction: input.direction === "DEBIT" ? "CREDIT" : "DEBIT",
            amountRial: amount,
          },
        ],
      });
      return { requiresApproval: false as const, transaction: tx };
    }

    const payload: AdjustmentPayload = {
      channelId: input.channelId,
      accountType: input.accountType,
      direction: input.direction,
      amountRial: input.amountRial,
    };
    const request = await this.prisma.financialApprovalRequest.create({
      data: {
        type: "LEDGER_ADJUSTMENT",
        channelId: input.channelId,
        amountRial: amount,
        reason: input.reason,
        payload: payload as never,
        requestedById: actor.userId,
      },
    });
    return { requiresApproval: true as const, approvalRequest: toApprovalDto(request) };
  }

  async listApprovals(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<FinancialApprovalRequest[]> {
    const rows = await this.prisma.financialApprovalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: "desc" },
    });
    return rows.map(toApprovalDto);
  }

  async decide(requestId: string, input: DecideFinancialApproval, actor: RequestActor): Promise<FinancialApprovalRequest> {
    const request = await this.prisma.financialApprovalRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("درخواست تأیید مالی یافت نشد.");
    if (request.status !== "PENDING") {
      throw new BadRequestException("این درخواست قبلاً تصمیم‌گیری شده است.");
    }
    if (request.requestedById === actor.userId) {
      throw new ForbiddenException("تأییدکننده دوم نمی‌تواند همان درخواست‌دهنده باشد.");
    }
    if (request.type === "MANUAL_SETTLEMENT") {
      throw new BadRequestException("برای تسویه‌های دستی از مسیر تأیید تسویه استفاده کنید.");
    }

    if (input.action === "REJECT") {
      const updated = await this.prisma.financialApprovalRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", decidedById: actor.userId, decidedAt: new Date(), decisionNote: input.note },
      });
      await this.auditLog.record({
        actorId: actor.userId,
        actorType: "user",
        action: "financial-approval.rejected",
        entityType: "financial_approval_request",
        entityId: requestId,
      });
      return toApprovalDto(updated);
    }

    if (request.type === "LEDGER_ADJUSTMENT") {
      const payload = request.payload as unknown as AdjustmentPayload;
      await this.ledger.post({
        transactionType: "ADJUSTMENT",
        idempotencyKey: `financial-approval:${requestId}`,
        sourceType: "manual_adjustment",
        reason: request.reason,
        createdBy: request.requestedById,
        entries: [
          {
            channelId: payload.channelId,
            accountType: payload.accountType,
            direction: payload.direction,
            amountRial: BigInt(payload.amountRial),
          },
          {
            channelId: null,
            accountType: "PLATFORM_SUPPORT_POOL",
            direction: payload.direction === "DEBIT" ? "CREDIT" : "DEBIT",
            amountRial: BigInt(payload.amountRial),
          },
        ],
      });
    }

    const updated = await this.prisma.financialApprovalRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", decidedById: actor.userId, decidedAt: new Date(), decisionNote: input.note },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "financial-approval.approved",
      entityType: "financial_approval_request",
      entityId: requestId,
    });

    return toApprovalDto(updated);
  }
}

function toApprovalDto(row: {
  id: string;
  type: string;
  channelId: string;
  amountRial: bigint;
  reason: string;
  status: string;
  requestedById: string;
  requestedAt: Date;
  decidedById: string | null;
  decidedAt: Date | null;
  decisionNote: string | null;
}): FinancialApprovalRequest {
  return {
    id: row.id,
    type: row.type as FinancialApprovalRequest["type"],
    channelId: row.channelId,
    amountRial: serializeRial(row.amountRial),
    reason: row.reason,
    status: row.status as FinancialApprovalRequest["status"],
    requestedById: row.requestedById,
    requestedAt: row.requestedAt.toISOString(),
    decidedById: row.decidedById,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    decisionNote: row.decisionNote,
  };
}
