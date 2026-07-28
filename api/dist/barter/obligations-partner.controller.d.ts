import { type CreateRateCardItem, type RespondToObligationProposal, type ReviewRateCardItem, type SubmitDeliverable } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { ObligationsService } from "./obligations.service";
import { RateCardsService } from "./rate-cards.service";
/** Partner-facing — same channel-nested ABAC shape as SupportRequestsController. */
export declare class ObligationsPartnerController {
    private readonly obligations;
    constructor(obligations: ObligationsService);
    list(channelId: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        supportRequestId: string | null;
        serviceCatalogItemId: string;
        serviceCatalogItemName: string;
        status: "SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED";
        brief: string;
        output: string | null;
        acceptanceCriteria: string | null;
        valueRial: string;
        settledValueRial: string;
        startAt: string | null;
        deadlineAt: string | null;
        responsibleChannelMemberId: string | null;
        responsibleHatefEmployeeId: string | null;
        terms: string | null;
        createdAt: string;
        updatedAt: string;
    }[]>;
    getOne(obligationId: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        supportRequestId: string | null;
        serviceCatalogItemId: string;
        serviceCatalogItemName: string;
        status: "SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED";
        brief: string;
        output: string | null;
        acceptanceCriteria: string | null;
        valueRial: string;
        settledValueRial: string;
        startAt: string | null;
        deadlineAt: string | null;
        responsibleChannelMemberId: string | null;
        responsibleHatefEmployeeId: string | null;
        terms: string | null;
        createdAt: string;
        updatedAt: string;
        proposals: {
            id: string;
            versionNumber: number;
            proposedById: string;
            status: "REJECTED" | "ACCEPTED" | "PROPOSED" | "COUNTERED";
            valueRial: string;
            brief: string | null;
            deadlineAt: string | null;
            note: string | null;
            createdAt: string;
        }[];
        statusEvents: {
            id: string;
            fromStatus: "SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED" | null;
            toStatus: "SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED";
            note: string | null;
            createdAt: string;
        }[];
    }>;
    respond(obligationId: string, body: RespondToObligationProposal, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        supportRequestId: string | null;
        serviceCatalogItemId: string;
        serviceCatalogItemName: string;
        status: "SUBMITTED" | "APPROVED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "NEGOTIATING" | "ACCEPTED" | "PROPOSED" | "IN_PROGRESS" | "NEEDS_REVISION" | "PARTIALLY_APPROVED" | "SETTLED";
        brief: string;
        output: string | null;
        acceptanceCriteria: string | null;
        valueRial: string;
        settledValueRial: string;
        startAt: string | null;
        deadlineAt: string | null;
        responsibleChannelMemberId: string | null;
        responsibleHatefEmployeeId: string | null;
        terms: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    submitDeliverable(obligationId: string, body: SubmitDeliverable, actor: RequestActor): Promise<{
        id: string;
        obligationId: string;
        submittedById: string;
        status: "SUBMITTED" | "REJECTED" | "DISPUTED" | "ACCEPTED" | "NEEDS_REVISION" | "PARTIALLY_ACCEPTED";
        description: string | null;
        links: string[];
        reachOrViews: number | null;
        deliveredAt: string | null;
        fileIds: string[];
        reviews: {
            id: string;
            reviewerId: string;
            decision: "REJECT" | "DISPUTE" | "ACCEPT_FULL" | "ACCEPT_PARTIAL" | "REQUEST_REVISION";
            acceptedValueRial: string | null;
            remainingValueRial: string | null;
            note: string | null;
            createdAt: string;
        }[];
        createdAt: string;
    }>;
    listDeliverables(obligationId: string): Promise<{
        id: string;
        obligationId: string;
        submittedById: string;
        status: "SUBMITTED" | "REJECTED" | "DISPUTED" | "ACCEPTED" | "NEEDS_REVISION" | "PARTIALLY_ACCEPTED";
        description: string | null;
        links: string[];
        reachOrViews: number | null;
        deliveredAt: string | null;
        fileIds: string[];
        reviews: {
            id: string;
            reviewerId: string;
            decision: "REJECT" | "DISPUTE" | "ACCEPT_FULL" | "ACCEPT_PARTIAL" | "REQUEST_REVISION";
            acceptedValueRial: string | null;
            remainingValueRial: string | null;
            note: string | null;
            createdAt: string;
        }[];
        createdAt: string;
    }[]>;
}
export declare class RateCardPartnerController {
    private readonly rateCards;
    constructor(rateCards: RateCardsService);
    getCurrent(channelId: string): Promise<{
        id: string;
        channelId: string;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEGOTIATING";
        submittedAt: string | null;
        items: {
            id: string;
            serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
            title: string;
            description: string | null;
            priceUnit: string;
            amountRial: string;
            minimumOrder: number | null;
            leadTimeDays: number | null;
            monthlyCapacity: number | null;
            terms: string | null;
            sampleWorkUrl: string | null;
            effectiveFrom: string | null;
            expiresAt: string | null;
            status: "PENDING" | "ARCHIVED" | "APPROVED" | "NEGOTIATING";
            adminComment: string | null;
        }[];
        createdAt: string;
    }>;
    addItem(channelId: string, body: CreateRateCardItem, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEGOTIATING";
        submittedAt: string | null;
        items: {
            id: string;
            serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
            title: string;
            description: string | null;
            priceUnit: string;
            amountRial: string;
            minimumOrder: number | null;
            leadTimeDays: number | null;
            monthlyCapacity: number | null;
            terms: string | null;
            sampleWorkUrl: string | null;
            effectiveFrom: string | null;
            expiresAt: string | null;
            status: "PENDING" | "ARCHIVED" | "APPROVED" | "NEGOTIATING";
            adminComment: string | null;
        }[];
        createdAt: string;
    }>;
    submit(channelId: string, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEGOTIATING";
        submittedAt: string | null;
        items: {
            id: string;
            serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
            title: string;
            description: string | null;
            priceUnit: string;
            amountRial: string;
            minimumOrder: number | null;
            leadTimeDays: number | null;
            monthlyCapacity: number | null;
            terms: string | null;
            sampleWorkUrl: string | null;
            effectiveFrom: string | null;
            expiresAt: string | null;
            status: "PENDING" | "ARCHIVED" | "APPROVED" | "NEGOTIATING";
            adminComment: string | null;
        }[];
        createdAt: string;
    }>;
}
export declare class RateCardOpsController {
    private readonly rateCards;
    constructor(rateCards: RateCardsService);
    listSubmitted(): Promise<{
        id: string;
        channelId: string;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEGOTIATING";
        submittedAt: string | null;
        items: {
            id: string;
            serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
            title: string;
            description: string | null;
            priceUnit: string;
            amountRial: string;
            minimumOrder: number | null;
            leadTimeDays: number | null;
            monthlyCapacity: number | null;
            terms: string | null;
            sampleWorkUrl: string | null;
            effectiveFrom: string | null;
            expiresAt: string | null;
            status: "PENDING" | "ARCHIVED" | "APPROVED" | "NEGOTIATING";
            adminComment: string | null;
        }[];
        createdAt: string;
    }[]>;
    reviewItem(itemId: string, body: ReviewRateCardItem, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=obligations-partner.controller.d.ts.map