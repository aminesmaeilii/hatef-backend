import type { CalculatePrice, CreateQuoteVersion, CreateSupportRequest, OverridePrice, PriceCalculation, PromotionExecutionResult, PromotionOrder, PromotionQuote, PromotionSchedule, RecordExecutionResult, RescheduleSupportRequest, RespondToQuote, ScheduleSupportRequest, SupportRequest, SupportRequestQueueItem, SupportRequestProgress, SupportRequestRevision, SupportRequestStatusKey, UpdateSupportRequest, VerifyResult, ResolveDispute } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
export declare class SupportRequestsService {
    private readonly prisma;
    private readonly auditLog;
    private readonly ledger;
    private readonly notifications;
    constructor(prisma: PrismaService, auditLog: AuditLogService, ledger: LedgerService, notifications: NotificationsService);
    create(channelId: string, input: CreateSupportRequest, actor: RequestActor): Promise<SupportRequest>;
    listMine(channelId: string): Promise<SupportRequest[]>;
    getOne(channelId: string, requestId: string): Promise<SupportRequest>;
    update(channelId: string, requestId: string, input: UpdateSupportRequest): Promise<SupportRequest>;
    submit(channelId: string, requestId: string, actor: RequestActor): Promise<void>;
    getProgress(channelId: string, requestId: string): Promise<SupportRequestProgress>;
    getRevisions(channelId: string, requestId: string): Promise<SupportRequestRevision[]>;
    cancelRequest(channelId: string, requestId: string, reason: string, actor: RequestActor): Promise<void>;
    respondToQuote(channelId: string, requestId: string, input: RespondToQuote, actor: RequestActor): Promise<void>;
    confirm(channelId: string, requestId: string, actor: RequestActor): Promise<PromotionOrder>;
    listQueue(status?: SupportRequestStatusKey, channelId?: string): Promise<SupportRequestQueueItem[]>;
    getDetail(requestId: string): Promise<{
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
    validate(requestId: string, actor: RequestActor): Promise<void>;
    requestChanges(requestId: string, message: string, actor: RequestActor): Promise<void>;
    advance(requestId: string, actor: RequestActor): Promise<void>;
    schedulePromotion(requestId: string, input: ScheduleSupportRequest, actor: RequestActor): Promise<PromotionSchedule>;
    reschedulePromotion(requestId: string, input: RescheduleSupportRequest, actor: RequestActor): Promise<PromotionSchedule>;
    recordExecutionResult(requestId: string, input: RecordExecutionResult, actor: RequestActor): Promise<PromotionExecutionResult>;
    private assertNoScheduleConflict;
    calculatePrice(requestId: string, input: CalculatePrice, actor: RequestActor): Promise<PriceCalculation>;
    overridePrice(requestId: string, input: OverridePrice, actor: RequestActor): Promise<PriceCalculation>;
    approvePrice(requestId: string, actor: RequestActor): Promise<PriceCalculation>;
    createQuoteVersion(requestId: string, input: CreateQuoteVersion, actor: RequestActor): Promise<PromotionQuote>;
    sendToApproval(requestId: string, actor: RequestActor): Promise<void>;
    internalApprove(requestId: string, actor: RequestActor): Promise<void>;
    verifyResult(requestId: string, input: VerifyResult, actor: RequestActor): Promise<void>;
    raiseDispute(requestId: string, reason: string, actor: RequestActor): Promise<void>;
    resolveDispute(requestId: string, input: ResolveDispute, actor: RequestActor): Promise<void>;
    private assertRequestComplete;
    private getActivePriceRule;
    private resolveFinalAmount;
    private getOwnedRequestOrThrow;
    private transition;
}
//# sourceMappingURL=support-requests.service.d.ts.map