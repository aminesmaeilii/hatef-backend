import type { DecideFinancialApproval, FinancialApprovalRequest, PostAdjustment } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "./ledger.service";
export declare class FinancialApprovalService {
    private readonly prisma;
    private readonly ledger;
    private readonly auditLog;
    constructor(prisma: PrismaService, ledger: LedgerService, auditLog: AuditLogService);
    /**
     * Manual adjustment requires permission (enforced by the controller's
     * @RequirePermission) and a reason (spec 16.1). Below the threshold it
     * posts immediately; at or above it, a FinancialApprovalRequest is
     * created instead and nothing becomes a ledger fact until a second,
     * distinct user approves it (spec 16.1 "high-value adjustment requires
     * second approval").
     */
    requestAdjustment(input: PostAdjustment, actor: RequestActor): Promise<{
        requiresApproval: false;
        transaction: {
            id: string;
            transactionType: "SUPPORT_GRANTED" | "SERVICE_ACCEPTED" | "SETTLEMENT" | "ADJUSTMENT" | "REVERSAL";
            sourceType: string;
            sourceId: string | null;
            description: string | null;
            reason: string | null;
            reversalOfTransactionId: string | null;
            createdBy: string | null;
            createdAt: string;
            entries: {
                id: string;
                accountType: "CHANNEL_SUPPORT_VALUE" | "CHANNEL_SERVICE_OBLIGATION" | "CHANNEL_SERVICE_DELIVERED" | "CHANNEL_SETTLEMENT" | "PLATFORM_SUPPORT_POOL" | "PLATFORM_SERVICE_POOL";
                channelId: string | null;
                direction: "DEBIT" | "CREDIT";
                amountRial: string;
            }[];
        };
        approvalRequest?: undefined;
    } | {
        requiresApproval: true;
        approvalRequest: {
            id: string;
            type: "LEDGER_ADJUSTMENT" | "MANUAL_SETTLEMENT";
            channelId: string;
            amountRial: string;
            reason: string;
            status: "PENDING" | "APPROVED" | "REJECTED";
            requestedById: string;
            requestedAt: string;
            decidedById: string | null;
            decidedAt: string | null;
            decisionNote: string | null;
        };
        transaction?: undefined;
    }>;
    listApprovals(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<FinancialApprovalRequest[]>;
    decide(requestId: string, input: DecideFinancialApproval, actor: RequestActor): Promise<FinancialApprovalRequest>;
}
//# sourceMappingURL=financial-approval.service.d.ts.map