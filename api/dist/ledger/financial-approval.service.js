"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialApprovalService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const ledger_service_1 = require("./ledger.service");
let FinancialApprovalService = class FinancialApprovalService {
    prisma;
    ledger;
    auditLog;
    constructor(prisma, ledger, auditLog) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.auditLog = auditLog;
    }
    /**
     * Manual adjustment requires permission (enforced by the controller's
     * @RequirePermission) and a reason (spec 16.1). Below the threshold it
     * posts immediately; at or above it, a FinancialApprovalRequest is
     * created instead and nothing becomes a ledger fact until a second,
     * distinct user approves it (spec 16.1 "high-value adjustment requires
     * second approval").
     */
    async requestAdjustment(input, actor) {
        const amount = BigInt(input.amountRial);
        if (amount < ledger_service_1.HIGH_VALUE_ADJUSTMENT_THRESHOLD_RIAL) {
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
            return { requiresApproval: false, transaction: tx };
        }
        const payload = {
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
                payload: payload,
                requestedById: actor.userId,
            },
        });
        return { requiresApproval: true, approvalRequest: toApprovalDto(request) };
    }
    async listApprovals(status) {
        const rows = await this.prisma.financialApprovalRequest.findMany({
            where: status ? { status } : undefined,
            orderBy: { requestedAt: "desc" },
        });
        return rows.map(toApprovalDto);
    }
    async decide(requestId, input, actor) {
        const request = await this.prisma.financialApprovalRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException("درخواست تأیید مالی یافت نشد.");
        if (request.status !== "PENDING") {
            throw new common_1.BadRequestException("این درخواست قبلاً تصمیم‌گیری شده است.");
        }
        if (request.requestedById === actor.userId) {
            throw new common_1.ForbiddenException("تأییدکننده دوم نمی‌تواند همان درخواست‌دهنده باشد.");
        }
        if (request.type === "MANUAL_SETTLEMENT") {
            throw new common_1.BadRequestException("برای تسویه‌های دستی از مسیر تأیید تسویه استفاده کنید.");
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
            const payload = request.payload;
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
};
exports.FinancialApprovalService = FinancialApprovalService;
exports.FinancialApprovalService = FinancialApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_log_service_1.AuditLogService])
], FinancialApprovalService);
function toApprovalDto(row) {
    return {
        id: row.id,
        type: row.type,
        channelId: row.channelId,
        amountRial: (0, domain_1.serializeRial)(row.amountRial),
        reason: row.reason,
        status: row.status,
        requestedById: row.requestedById,
        requestedAt: row.requestedAt.toISOString(),
        decidedById: row.decidedById,
        decidedAt: row.decidedAt?.toISOString() ?? null,
        decisionNote: row.decisionNote,
    };
}
