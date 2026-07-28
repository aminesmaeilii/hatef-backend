import { type CancelRequest, type CreateSupportRequest, type RespondToQuote, type UpdateSupportRequest } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { SupportRequestsService } from "./support-requests.service";
/** Partner-facing — channel-nested, same ABAC-scoping shape as Phase 2's FormSubmissionsController. */
export declare class SupportRequestsController {
    private readonly supportRequests;
    constructor(supportRequests: SupportRequestsService);
    create(channelId: string, body: CreateSupportRequest, actor: RequestActor): Promise<{
        id: string;
        channelId: string;
        promotionTypeId: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: "CALCULATED" | "QUOTE";
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        audienceType: "NATIONWIDE" | "PROVINCIAL" | null;
        province: string | null;
        requestedUniqueViews: number | null;
        details: Record<string, unknown>;
        currentRevisionNumber: number;
        submittedAt: string | null;
        createdAt: string;
    }>;
    listMine(channelId: string): Promise<{
        id: string;
        channelId: string;
        promotionTypeId: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: "CALCULATED" | "QUOTE";
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        audienceType: "NATIONWIDE" | "PROVINCIAL" | null;
        province: string | null;
        requestedUniqueViews: number | null;
        details: Record<string, unknown>;
        currentRevisionNumber: number;
        submittedAt: string | null;
        createdAt: string;
    }[]>;
    getOne(channelId: string, requestId: string): Promise<{
        id: string;
        channelId: string;
        promotionTypeId: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: "CALCULATED" | "QUOTE";
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        audienceType: "NATIONWIDE" | "PROVINCIAL" | null;
        province: string | null;
        requestedUniqueViews: number | null;
        details: Record<string, unknown>;
        currentRevisionNumber: number;
        submittedAt: string | null;
        createdAt: string;
    }>;
    update(channelId: string, requestId: string, body: UpdateSupportRequest): Promise<{
        id: string;
        channelId: string;
        promotionTypeId: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: "CALCULATED" | "QUOTE";
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        audienceType: "NATIONWIDE" | "PROVINCIAL" | null;
        province: string | null;
        requestedUniqueViews: number | null;
        details: Record<string, unknown>;
        currentRevisionNumber: number;
        submittedAt: string | null;
        createdAt: string;
    }>;
    submit(channelId: string, requestId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    getProgress(channelId: string, requestId: string): Promise<{
        id: string;
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        promotionTypeName: string;
        latestPriceEstimateRial: string | null;
        latestQuote: {
            id: string;
            status: "SENT" | "DRAFT" | "REJECTED" | "NEGOTIATING" | "ACCEPTED" | "EXPIRED";
            versions: {
                id: string;
                versionNumber: number;
                status: "REJECTED" | "ACCEPTED" | "EXPIRED" | "PROPOSED" | "NEGOTIATION_REQUESTED" | "SUPERSEDED";
                estimatedChannelMin: number | null;
                estimatedChannelMax: number | null;
                estimatedViewMin: number | null;
                estimatedViewMax: number | null;
                method: string;
                scheduleNote: string | null;
                amountRial: string;
                assumptions: string | null;
                expiresAt: string | null;
                negotiationNote: string | null;
                createdAt: string;
            }[];
        } | null;
        order: {
            id: string;
            supportRequestId: string;
            channelId: string;
            finalAmountRial: string;
            createdAt: string;
        } | null;
        schedule: {
            scheduledStartAt: string;
            scheduledEndAt: string | null;
        } | null;
        executionResult: {
            id: string;
            actualUniqueViews: number | null;
            actualChannelsCount: number | null;
            realizedValueRial: string | null;
            verifiedAt: string | null;
            evidenceFileIds: string[];
        } | null;
        timeline: {
            id: string;
            fromStatus: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED" | null;
            toStatus: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
            note: string | null;
            createdAt: string;
        }[];
    }>;
    getRevisions(channelId: string, requestId: string): Promise<{
        id: string;
        revisionNumber: number;
        snapshot: Record<string, unknown>;
        submittedAt: string;
    }[]>;
    cancelRequest(channelId: string, requestId: string, body: CancelRequest, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    respondToQuote(channelId: string, requestId: string, body: RespondToQuote, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    confirm(channelId: string, requestId: string, actor: RequestActor): Promise<{
        id: string;
        supportRequestId: string;
        channelId: string;
        finalAmountRial: string;
        createdAt: string;
    }>;
}
//# sourceMappingURL=support-requests.controller.d.ts.map