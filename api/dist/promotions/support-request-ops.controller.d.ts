import { type CalculatePrice, type CreateQuoteVersion, type OverridePrice, type RecordExecutionResult, type RequestChanges, type RescheduleSupportRequest, type ResolveDispute, type ScheduleSupportRequest, type VerifyResult } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { SupportRequestsService } from "./support-requests.service";
/** Admin/internal operational queue + Kanban + workflow actions. */
export declare class SupportRequestOpsController {
    private readonly supportRequests;
    constructor(supportRequests: SupportRequestsService);
    list(status?: string, channelId?: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: "CALCULATED" | "QUOTE";
        status: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
        requestedUniqueViews: number | null;
        createdAt: string;
        updatedAt: string;
    }[]>;
    getOne(requestId: string): Promise<{
        id: string;
        channelId: string;
        channelTitle: string;
        promotionTypeKey: string;
        promotionTypeName: string;
        pricingModel: import("@hatef/database").$Enums.PromotionPricingModel;
        status: import("@hatef/database").$Enums.SupportRequestStatus;
        audienceType: import("@hatef/database").$Enums.AudienceType | null;
        province: string | null;
        requestedUniqueViews: number | null;
        details: import("@hatef/database/generated/client/runtime/library").JsonValue;
        latestSnapshot: string | number | boolean | import("@hatef/database/generated/client/runtime/library").JsonObject | import("@hatef/database/generated/client/runtime/library").JsonArray | null;
        priceCalculations: {
            id: string;
            promotionTypeVersionId: string;
            requestedUniqueViews: number;
            audienceType: "NATIONWIDE" | "PROVINCIAL";
            ratePerViewRial: string;
            baseAmountRial: string;
            discountRial: string;
            multiplierPercent: number;
            estimatedAmountRial: string;
            lineItems: {
                label: string;
                amountRial: string;
            }[];
            overrideAmountRial: string | null;
            overrideReason: string | null;
            requiresSecondApproval: boolean;
            approvedAmountRial: string | null;
            approvedBy: string | null;
            secondApprovedBy: string | null;
            createdAt: string;
        }[];
        quote: {
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
            id: string;
            operatorId: string;
            operatorName: string;
            capacityResourceId: string | null;
            scheduledStartAt: string;
            scheduledEndAt: string | null;
            checklist: {
                id: string;
                label: string;
                done: boolean;
            }[];
        } | null;
        executionResult: {
            id: string;
            actualUniqueViews: number | null;
            actualChannelsCount: number | null;
            realizedValueRial: string | null;
            verifiedAt: string | null;
            evidenceFileIds: string[];
        } | null;
        statusEvents: {
            id: string;
            fromStatus: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED" | null;
            toStatus: "COMPLETED" | "DRAFT" | "SUBMITTED" | "SCHEDULED" | "DISPUTED" | "CANCELLED" | "VALIDATION" | "NEEDS_PARTNER_CHANGES" | "PRICING_OR_QUOTE" | "INTERNAL_APPROVAL" | "PARTNER_CONFIRMATION" | "RUNNING" | "RESULT_VERIFICATION" | "ADJUSTMENT_REQUIRED" | "CANCEL_REQUESTED";
            note: string | null;
            createdAt: string;
        }[];
    }>;
    advance(requestId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    validate(requestId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    requestChanges(requestId: string, body: RequestChanges, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    calculatePrice(requestId: string, body: CalculatePrice, actor: RequestActor): Promise<{
        id: string;
        promotionTypeVersionId: string;
        requestedUniqueViews: number;
        audienceType: "NATIONWIDE" | "PROVINCIAL";
        ratePerViewRial: string;
        baseAmountRial: string;
        discountRial: string;
        multiplierPercent: number;
        estimatedAmountRial: string;
        lineItems: {
            label: string;
            amountRial: string;
        }[];
        overrideAmountRial: string | null;
        overrideReason: string | null;
        requiresSecondApproval: boolean;
        approvedAmountRial: string | null;
        approvedBy: string | null;
        secondApprovedBy: string | null;
        createdAt: string;
    }>;
    overridePrice(requestId: string, body: OverridePrice, actor: RequestActor): Promise<{
        id: string;
        promotionTypeVersionId: string;
        requestedUniqueViews: number;
        audienceType: "NATIONWIDE" | "PROVINCIAL";
        ratePerViewRial: string;
        baseAmountRial: string;
        discountRial: string;
        multiplierPercent: number;
        estimatedAmountRial: string;
        lineItems: {
            label: string;
            amountRial: string;
        }[];
        overrideAmountRial: string | null;
        overrideReason: string | null;
        requiresSecondApproval: boolean;
        approvedAmountRial: string | null;
        approvedBy: string | null;
        secondApprovedBy: string | null;
        createdAt: string;
    }>;
    approvePrice(requestId: string, actor: RequestActor): Promise<{
        id: string;
        promotionTypeVersionId: string;
        requestedUniqueViews: number;
        audienceType: "NATIONWIDE" | "PROVINCIAL";
        ratePerViewRial: string;
        baseAmountRial: string;
        discountRial: string;
        multiplierPercent: number;
        estimatedAmountRial: string;
        lineItems: {
            label: string;
            amountRial: string;
        }[];
        overrideAmountRial: string | null;
        overrideReason: string | null;
        requiresSecondApproval: boolean;
        approvedAmountRial: string | null;
        approvedBy: string | null;
        secondApprovedBy: string | null;
        createdAt: string;
    }>;
    createQuoteVersion(requestId: string, body: CreateQuoteVersion, actor: RequestActor): Promise<{
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
    }>;
    sendToApproval(requestId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    internalApprove(requestId: string, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    verifyResult(requestId: string, body: VerifyResult, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    raiseDispute(requestId: string, body: RequestChanges, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    resolveDispute(requestId: string, body: ResolveDispute, actor: RequestActor): Promise<{
        ok: boolean;
    }>;
    schedule(requestId: string, body: ScheduleSupportRequest, actor: RequestActor): Promise<{
        id: string;
        operatorId: string;
        operatorName: string;
        capacityResourceId: string | null;
        scheduledStartAt: string;
        scheduledEndAt: string | null;
        checklist: {
            id: string;
            label: string;
            done: boolean;
        }[];
    }>;
    reschedule(requestId: string, body: RescheduleSupportRequest, actor: RequestActor): Promise<{
        id: string;
        operatorId: string;
        operatorName: string;
        capacityResourceId: string | null;
        scheduledStartAt: string;
        scheduledEndAt: string | null;
        checklist: {
            id: string;
            label: string;
            done: boolean;
        }[];
    }>;
    recordExecutionResult(requestId: string, body: RecordExecutionResult, actor: RequestActor): Promise<{
        id: string;
        actualUniqueViews: number | null;
        actualChannelsCount: number | null;
        realizedValueRial: string | null;
        verifiedAt: string | null;
        evidenceFileIds: string[];
    }>;
}
//# sourceMappingURL=support-request-ops.controller.d.ts.map