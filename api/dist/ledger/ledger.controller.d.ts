import { type DecideFinancialApproval, type PostAdjustment, type ReverseTransaction } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "./ledger.service";
import { FinancialApprovalService } from "./financial-approval.service";
/** Admin/internal ledger read + manual adjustment/reversal. Partner-facing statement lives on the channel-scoped controller below. */
export declare class LedgerController {
    private readonly ledger;
    private readonly financialApprovals;
    constructor(ledger: LedgerService, financialApprovals: FinancialApprovalService);
    adjust(body: PostAdjustment, actor: RequestActor): Promise<{
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
    reverse(transactionId: string, body: ReverseTransaction, actor: RequestActor): Promise<{
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
    }>;
    listApprovals(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<{
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
    }[]>;
    decideApproval(requestId: string, body: DecideFinancialApproval, actor: RequestActor): Promise<{
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
    }>;
}
/** Partner- and admin-shared read of one channel's statement (spec 16.5 "understandable statement"). */
export declare class ChannelLedgerController {
    private readonly ledger;
    constructor(ledger: LedgerService);
    statement(channelId: string): Promise<{
        channelId: string;
        balances: {
            accountType: "CHANNEL_SUPPORT_VALUE" | "CHANNEL_SERVICE_OBLIGATION" | "CHANNEL_SERVICE_DELIVERED" | "CHANNEL_SETTLEMENT" | "PLATFORM_SUPPORT_POOL" | "PLATFORM_SERVICE_POOL";
            balanceRial: string;
        }[];
        outstandingObligationRial: string;
        deliveredNotYetSettledRial: string;
        settledRial: string;
        transactions: {
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
        }[];
    }>;
}
//# sourceMappingURL=ledger.controller.d.ts.map