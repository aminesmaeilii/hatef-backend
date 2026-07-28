import { type CreateSettlement, type DecideFinancialApproval } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { SettlementsService } from "./settlements.service";
export declare class SettlementsController {
    private readonly settlements;
    constructor(settlements: SettlementsService);
    create(body: CreateSettlement, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        status: "COMPLETED" | "DRAFT" | "APPROVED" | "PENDING_APPROVAL" | "REVERSED";
        totalAmountRial: string;
        statementNote: string | null;
        allocations: {
            id: string;
            obligationId: string;
            deliverableId: string | null;
            amountRial: string;
        }[];
        createdAt: string;
        completedAt: string | null;
    }>;
    getOne(settlementId: string): Promise<{
        id: string;
        channelId: string;
        status: "COMPLETED" | "DRAFT" | "APPROVED" | "PENDING_APPROVAL" | "REVERSED";
        totalAmountRial: string;
        statementNote: string | null;
        allocations: {
            id: string;
            obligationId: string;
            deliverableId: string | null;
            amountRial: string;
        }[];
        createdAt: string;
        completedAt: string | null;
    }>;
    submit(settlementId: string, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        status: "COMPLETED" | "DRAFT" | "APPROVED" | "PENDING_APPROVAL" | "REVERSED";
        totalAmountRial: string;
        statementNote: string | null;
        allocations: {
            id: string;
            obligationId: string;
            deliverableId: string | null;
            amountRial: string;
        }[];
        createdAt: string;
        completedAt: string | null;
    }>;
    decide(settlementId: string, body: DecideFinancialApproval, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        status: "COMPLETED" | "DRAFT" | "APPROVED" | "PENDING_APPROVAL" | "REVERSED";
        totalAmountRial: string;
        statementNote: string | null;
        allocations: {
            id: string;
            obligationId: string;
            deliverableId: string | null;
            amountRial: string;
        }[];
        createdAt: string;
        completedAt: string | null;
    }>;
}
export declare class ChannelSettlementsController {
    private readonly settlements;
    constructor(settlements: SettlementsService);
    list(channelId: string): Promise<{
        id: string;
        channelId: string;
        status: "COMPLETED" | "DRAFT" | "APPROVED" | "PENDING_APPROVAL" | "REVERSED";
        totalAmountRial: string;
        statementNote: string | null;
        allocations: {
            id: string;
            obligationId: string;
            deliverableId: string | null;
            amountRial: string;
        }[];
        createdAt: string;
        completedAt: string | null;
    }[]>;
}
//# sourceMappingURL=settlements.controller.d.ts.map