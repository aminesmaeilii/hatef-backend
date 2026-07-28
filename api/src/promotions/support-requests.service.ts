import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { IllegalStateTransitionError, calculatePinPrice, findSchedulingConflicts, serializeRial } from "@hatef/domain";
import type {
  CalculatePrice,
  CreateQuoteVersion,
  CreateSupportRequest,
  OverridePrice,
  PriceCalculation,
  PromotionExecutionResult,
  PromotionOrder,
  PromotionQuote,
  PromotionSchedule,
  RecordExecutionResult,
  RescheduleSupportRequest,
  RespondToQuote,
  ScheduleSupportRequest,
  SupportRequest,
  SupportRequestQueueItem,
  SupportRequestProgress,
  SupportRequestRevision,
  SupportRequestStatusEvent,
  SupportRequestStatusKey,
  UpdateSupportRequest,
  VerifyResult,
  ResolveDispute,
} from "@hatef/contracts";
import type {
  PriceCalculation as PrismaPriceCalculation,
  PromotionExecutionResult as PrismaExecutionResult,
  PromotionQuoteVersion as PrismaQuoteVersion,
  PromotionSchedule as PrismaSchedule,
  SupportRequest as PrismaSupportRequest,
} from "@hatef/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ADVANCE_TARGET, PARTNER_CANCELLABLE_STATUSES, supportRequestStateMachine } from "./support-request-state-machine";

/** Above this estimated amount, a pin request's price needs a second, distinct approver (spec 13.1 "second approval above threshold"). */
const SECOND_APPROVAL_THRESHOLD_RIAL = 1_000_000_000n;

const REQUIRED_VARIABLE_DETAIL_KEYS = ["objective", "topic"] as const;

/** Seeded onto every new PromotionSchedule — spec 15's "execution checklist," stored as JSON like Task.checklistItems (no separate table needed for a flat, per-order tick-list). */
const DEFAULT_EXECUTION_CHECKLIST = [
  "هماهنگی محتوا با کانال",
  "تأیید نهایی طرح تبلیغ",
  "اجرای پروموشن",
  "ثبت گواه اجرا",
].map((label, index) => ({ id: `default-${index}`, label, done: false }));

interface TransitionOptions {
  actorId?: string;
  note?: string;
  partnerVisible: boolean;
}

type RequestWithType = PrismaSupportRequest & {
  promotionType: { key: string; name: string; pricingModel: string };
};

@Injectable()
export class SupportRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------
  // Partner-facing: create / edit / submit / cancel / confirm / quote response
  // ---------------------------------------------------------------------

  async create(channelId: string, input: CreateSupportRequest, actor: RequestActor): Promise<SupportRequest> {
    const promotionType = await this.prisma.promotionType.findUnique({ where: { id: input.promotionTypeId } });
    if (!promotionType) {
      throw new BadRequestException("نوع پروموشن یافت نشد.");
    }

    const created = await this.prisma.supportRequest.create({
      data: {
        channelId,
        promotionTypeId: input.promotionTypeId,
        requestedById: actor.userId,
        audienceType: input.audienceType,
        province: input.province,
        requestedUniqueViews: input.requestedUniqueViews,
        details: input.details as never,
      },
      include: { promotionType: { select: { key: true, name: true, pricingModel: true } } },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.created",
      entityType: "support_request",
      entityId: created.id,
    });

    return toSupportRequestDto(created);
  }

  async listMine(channelId: string): Promise<SupportRequest[]> {
    const requests = await this.prisma.supportRequest.findMany({
      where: { channelId },
      include: { promotionType: { select: { key: true, name: true, pricingModel: true } } },
      orderBy: { createdAt: "desc" },
    });
    return requests.map(toSupportRequestDto);
  }

  async getOne(channelId: string, requestId: string): Promise<SupportRequest> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    return toSupportRequestDto(request);
  }

  async update(channelId: string, requestId: string, input: UpdateSupportRequest): Promise<SupportRequest> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    if (request.status !== "DRAFT" && request.status !== "NEEDS_PARTNER_CHANGES") {
      throw new BadRequestException("این درخواست در وضعیت فعلی قابل ویرایش نیست.");
    }

    const updated = await this.prisma.supportRequest.update({
      where: { id: requestId },
      data: {
        audienceType: input.audienceType ?? undefined,
        province: input.province ?? undefined,
        requestedUniqueViews: input.requestedUniqueViews ?? undefined,
        details: input.details ? ({ ...(request.details as object), ...input.details } as never) : undefined,
      },
      include: { promotionType: { select: { key: true, name: true, pricingModel: true } } },
    });
    return toSupportRequestDto(updated);
  }

  async submit(channelId: string, requestId: string, actor: RequestActor): Promise<void> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    if (request.status !== "DRAFT" && request.status !== "NEEDS_PARTNER_CHANGES") {
      throw new BadRequestException("این درخواست در وضعیت فعلی قابل ارسال نیست.");
    }

    this.assertRequestComplete(request);

    const nextRevisionNumber = request.currentRevisionNumber + 1;
    const snapshot = {
      audienceType: request.audienceType,
      province: request.province,
      requestedUniqueViews: request.requestedUniqueViews,
      details: request.details,
    };

    const target: SupportRequestStatusKey = request.status === "NEEDS_PARTNER_CHANGES" ? "SUBMITTED" : "SUBMITTED";

    await this.prisma.$transaction([
      this.prisma.supportRequestRevision.create({
        data: { supportRequestId: requestId, revisionNumber: nextRevisionNumber, snapshot: snapshot as never, submittedBy: actor.userId },
      }),
      this.prisma.supportRequest.update({
        where: { id: requestId },
        data: {
          currentRevisionNumber: nextRevisionNumber,
          submittedAt: request.submittedAt ?? new Date(),
        },
      }),
    ]);

    await this.transition(requestId, target, { actorId: actor.userId, partnerVisible: true });

    if (request.promotionType.pricingModel === "QUOTE") {
      await this.prisma.promotionQuote.upsert({
        where: { supportRequestId: requestId },
        create: { supportRequestId: requestId, status: "DRAFT" },
        update: {},
      });
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.submitted",
      entityType: "support_request",
      entityId: requestId,
      metadata: { revisionNumber: nextRevisionNumber },
    });
  }

  async getProgress(channelId: string, requestId: string): Promise<SupportRequestProgress> {
    const request = await this.prisma.supportRequest.findFirst({
      where: { id: requestId, channelId },
      include: {
        promotionType: { select: { key: true, name: true, pricingModel: true } },
        priceCalculations: { orderBy: { createdAt: "desc" }, take: 1 },
        quote: { include: { versions: { orderBy: { versionNumber: "desc" } } } },
        order: { include: { schedule: true, executionResult: { include: { evidence: true } } } },
        statusEvents: { where: { partnerVisible: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!request) {
      throw new NotFoundException("درخواست مورد نظر یافت نشد.");
    }

    const latestCalc = request.priceCalculations[0];
    return {
      id: request.id,
      status: request.status,
      promotionTypeName: request.promotionType.name,
      latestPriceEstimateRial: latestCalc ? serializeRial(latestCalc.overrideAmountRial ?? latestCalc.estimatedAmountRial) : null,
      latestQuote: request.quote ? toQuoteDto(request.quote) : null,
      order: request.order ? toOrderDto(request.order) : null,
      schedule: request.order?.schedule
        ? { scheduledStartAt: request.order.schedule.scheduledStartAt.toISOString(), scheduledEndAt: request.order.schedule.scheduledEndAt?.toISOString() ?? null }
        : null,
      executionResult: request.order?.executionResult ? toExecutionResultDto(request.order.executionResult) : null,
      timeline: request.statusEvents.map(toStatusEventDto),
    };
  }

  async getRevisions(channelId: string, requestId: string): Promise<SupportRequestRevision[]> {
    await this.getOwnedRequestOrThrow(channelId, requestId);
    const revisions = await this.prisma.supportRequestRevision.findMany({
      where: { supportRequestId: requestId },
      orderBy: { revisionNumber: "asc" },
    });
    return revisions.map((r) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      snapshot: r.snapshot as Record<string, unknown>,
      submittedAt: r.submittedAt.toISOString(),
    }));
  }

  async cancelRequest(channelId: string, requestId: string, reason: string, actor: RequestActor): Promise<void> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    if (!PARTNER_CANCELLABLE_STATUSES.includes(request.status)) {
      throw new BadRequestException("این درخواست در وضعیت فعلی قابل لغو نیست.");
    }
    await this.transition(requestId, "CANCEL_REQUESTED", { actorId: actor.userId, note: reason, partnerVisible: true });
  }

  async respondToQuote(channelId: string, requestId: string, input: RespondToQuote, actor: RequestActor): Promise<void> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    if (request.promotionType.pricingModel !== "QUOTE") {
      throw new BadRequestException("این نوع درخواست شامل استعلام قیمت نیست.");
    }
    if (request.status !== "PRICING_OR_QUOTE") {
      throw new BadRequestException("در وضعیت فعلی نمی‌توانید به پیشنهاد قیمت پاسخ دهید.");
    }

    const quote = await this.prisma.promotionQuote.findUnique({
      where: { supportRequestId: requestId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    const latestVersion = quote?.versions[0];
    if (!quote || !latestVersion || latestVersion.status !== "PROPOSED") {
      throw new BadRequestException("پیشنهاد قیمتی برای پاسخ‌دادن یافت نشد.");
    }

    const versionStatus = input.action === "ACCEPT" ? "ACCEPTED" : input.action === "REJECT" ? "REJECTED" : "NEGOTIATION_REQUESTED";
    const quoteStatus = input.action === "ACCEPT" ? "ACCEPTED" : input.action === "REJECT" ? "REJECTED" : "NEGOTIATING";

    await this.prisma.$transaction([
      this.prisma.promotionQuoteVersion.update({
        where: { id: latestVersion.id },
        data: { status: versionStatus, negotiationNote: input.note, respondedAt: new Date() },
      }),
      this.prisma.promotionQuote.update({ where: { id: quote.id }, data: { status: quoteStatus } }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: `support_request.quote_${input.action.toLowerCase()}`,
      entityType: "support_request",
      entityId: requestId,
    });
  }

  async confirm(channelId: string, requestId: string, actor: RequestActor): Promise<PromotionOrder> {
    const request = await this.getOwnedRequestOrThrow(channelId, requestId);
    if (request.status !== "PARTNER_CONFIRMATION") {
      throw new BadRequestException("این درخواست آماده تأیید نهایی نیست.");
    }

    const finalAmountRial = await this.resolveFinalAmount(request);

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.promotionOrder.create({
        data: { supportRequestId: requestId, channelId, finalAmountRial },
      });
      await tx.supportRequest.update({ where: { id: requestId }, data: { status: "SCHEDULED" } });
      await tx.supportRequestStatusEvent.create({
        data: {
          supportRequestId: requestId,
          fromStatus: "PARTNER_CONFIRMATION",
          toStatus: "SCHEDULED",
          partnerVisible: true,
          createdBy: actor.userId,
        },
      });
      return createdOrder;
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.confirmed",
      entityType: "support_request",
      entityId: requestId,
      metadata: { finalAmountRial: finalAmountRial.toString() },
    });

    return toOrderDto(order);
  }

  // ---------------------------------------------------------------------
  // Admin/internal: queue, validation, pricing, quotes, approval, lifecycle
  // ---------------------------------------------------------------------

  async listQueue(status?: SupportRequestStatusKey, channelId?: string): Promise<SupportRequestQueueItem[]> {
    const requests = await this.prisma.supportRequest.findMany({
      where: { ...(status ? { status } : {}), ...(channelId ? { channelId } : {}) },
      include: { channel: { select: { title: true } }, promotionType: { select: { key: true, name: true, pricingModel: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return requests.map((r) => ({
      id: r.id,
      channelId: r.channelId,
      channelTitle: r.channel.title,
      promotionTypeKey: r.promotionType.key,
      promotionTypeName: r.promotionType.name,
      pricingModel: r.promotionType.pricingModel as SupportRequestQueueItem["pricingModel"],
      status: r.status,
      requestedUniqueViews: r.requestedUniqueViews,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getDetail(requestId: string) {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: {
        channel: { select: { title: true, eitaaId: true } },
        promotionType: { select: { key: true, name: true, pricingModel: true } },
        priceCalculations: { orderBy: { createdAt: "desc" } },
        quote: { include: { versions: { orderBy: { versionNumber: "desc" } } } },
        statusEvents: { orderBy: { createdAt: "asc" } },
        order: { include: { schedule: { include: { operator: { select: { displayName: true } } } }, executionResult: { include: { evidence: true } } } },
        revisions: { orderBy: { revisionNumber: "desc" }, take: 1 },
      },
    });

    return {
      id: request.id,
      channelId: request.channelId,
      channelTitle: request.channel.title,
      promotionTypeKey: request.promotionType.key,
      promotionTypeName: request.promotionType.name,
      pricingModel: request.promotionType.pricingModel,
      status: request.status,
      audienceType: request.audienceType,
      province: request.province,
      requestedUniqueViews: request.requestedUniqueViews,
      details: request.details,
      latestSnapshot: request.revisions[0]?.snapshot ?? null,
      priceCalculations: request.priceCalculations.map(toPriceCalculationDto),
      quote: request.quote ? toQuoteDto(request.quote) : null,
      order: request.order ? toOrderDto(request.order) : null,
      schedule: request.order?.schedule ? toScheduleDto(request.order.schedule) : null,
      executionResult: request.order?.executionResult ? toExecutionResultDto(request.order.executionResult) : null,
      statusEvents: request.statusEvents.map(toStatusEventDto),
    };
  }

  async validate(requestId: string, actor: RequestActor): Promise<void> {
    await this.transition(requestId, "PRICING_OR_QUOTE", { actorId: actor.userId, partnerVisible: false });
  }

  async requestChanges(requestId: string, message: string, actor: RequestActor): Promise<void> {
    await this.transition(requestId, "NEEDS_PARTNER_CHANGES", { actorId: actor.userId, note: message, partnerVisible: true });
  }

  async advance(requestId: string, actor: RequestActor): Promise<void> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });
    const target = ADVANCE_TARGET[request.status];
    if (!target) {
      throw new BadRequestException("این درخواست در وضعیتی نیست که با این عملیات قابل پیشروی باشد.");
    }
    if (target === "RUNNING") {
      const order = await this.prisma.promotionOrder.findUnique({ where: { supportRequestId: requestId }, include: { schedule: true } });
      if (!order?.schedule) {
        throw new BadRequestException("پیش از آغاز اجرا باید برنامه زمانی (اپراتور و تاریخ) برای این سفارش ثبت شود.");
      }
    }
    await this.transition(requestId, target, { actorId: actor.userId, partnerVisible: target === "CANCELLED" });
  }

  // ---------------------------------------------------------------------
  // Phase 4: promotion scheduling and execution
  // ---------------------------------------------------------------------

  async schedulePromotion(requestId: string, input: ScheduleSupportRequest, actor: RequestActor): Promise<PromotionSchedule> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { order: true },
    });
    if (request.status !== "SCHEDULED" || !request.order) {
      throw new BadRequestException("این درخواست هنوز آماده زمان‌بندی نیست.");
    }

    const scheduledStartAt = new Date(input.scheduledStartAt);
    const scheduledEndAt = input.scheduledEndAt ? new Date(input.scheduledEndAt) : new Date(scheduledStartAt.getTime() + 60 * 60 * 1000);

    await this.assertNoScheduleConflict(input.operatorId, input.capacityResourceId, scheduledStartAt, scheduledEndAt);

    const schedule = await this.prisma.promotionSchedule.create({
      data: {
        promotionOrderId: request.order.id,
        operatorId: input.operatorId,
        capacityResourceId: input.capacityResourceId,
        scheduledStartAt,
        scheduledEndAt,
        checklist: DEFAULT_EXECUTION_CHECKLIST as never,
      },
      include: { operator: { select: { displayName: true } } },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "promotion_schedule.created",
      entityType: "support_request",
      entityId: requestId,
      after: { operatorId: input.operatorId, scheduledStartAt: scheduledStartAt.toISOString(), scheduledEndAt: scheduledEndAt.toISOString() },
    });

    await this.notifications.notify({
      userId: request.requestedById,
      eventType: "support-request.scheduled",
      dedupeKey: `support-request:${requestId}:schedule:${scheduledStartAt.toISOString()}`,
      title: "زمان‌بندی پشتیبانی تبلیغاتی",
      body: "زمان اجرای درخواست پشتیبانی شما مشخص شد.",
      deepLink: `/promotions/${requestId}`,
      linkedEntityType: "support_request",
      linkedEntityId: requestId,
      channels: ["IN_APP", "SMS"],
    });

    return toScheduleDto(schedule);
  }

  async reschedulePromotion(requestId: string, input: RescheduleSupportRequest, actor: RequestActor): Promise<PromotionSchedule> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { order: { include: { schedule: true } } },
    });
    const existingSchedule = request.order?.schedule;
    if (request.status !== "SCHEDULED" || !existingSchedule) {
      throw new BadRequestException("برنامه زمانی فعالی برای بازنشانی یافت نشد.");
    }

    const scheduledStartAt = new Date(input.scheduledStartAt);
    const scheduledEndAt = input.scheduledEndAt ? new Date(input.scheduledEndAt) : new Date(scheduledStartAt.getTime() + 60 * 60 * 1000);

    await this.assertNoScheduleConflict(existingSchedule.operatorId, existingSchedule.capacityResourceId ?? undefined, scheduledStartAt, scheduledEndAt, existingSchedule.id);

    const before = { scheduledStartAt: existingSchedule.scheduledStartAt.toISOString(), scheduledEndAt: existingSchedule.scheduledEndAt?.toISOString() ?? null };
    const updated = await this.prisma.promotionSchedule.update({
      where: { id: existingSchedule.id },
      data: { scheduledStartAt, scheduledEndAt },
      include: { operator: { select: { displayName: true } } },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "promotion_schedule.rescheduled",
      entityType: "support_request",
      entityId: requestId,
      before,
      after: { scheduledStartAt: scheduledStartAt.toISOString(), scheduledEndAt: scheduledEndAt.toISOString() },
    });

    await this.notifications.notify({
      userId: request.requestedById,
      eventType: "support-request.rescheduled",
      dedupeKey: `support-request:${requestId}:reschedule:${scheduledStartAt.toISOString()}`,
      title: "تغییر زمان اجرای پشتیبانی تبلیغاتی",
      body: "زمان اجرای درخواست پشتیبانی شما تغییر کرد.",
      deepLink: `/promotions/${requestId}`,
      linkedEntityType: "support_request",
      linkedEntityId: requestId,
      channels: ["IN_APP", "SMS"],
    });

    return toScheduleDto(updated);
  }

  async recordExecutionResult(requestId: string, input: RecordExecutionResult, actor: RequestActor): Promise<PromotionExecutionResult> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId }, include: { order: true } });
    if (request.status !== "RUNNING" || !request.order) {
      throw new BadRequestException("ثبت نتیجه اجرا فقط در وضعیت «در حال اجرا» ممکن است.");
    }

    const result = await this.prisma.promotionExecutionResult.upsert({
      where: { promotionOrderId: request.order.id },
      create: {
        promotionOrderId: request.order.id,
        actualUniqueViews: input.actualUniqueViews,
        actualChannelsCount: input.actualChannelsCount,
      },
      update: {
        actualUniqueViews: input.actualUniqueViews,
        actualChannelsCount: input.actualChannelsCount,
      },
    });

    if (input.evidenceFileIds.length > 0) {
      await this.prisma.promotionResultEvidence.createMany({
        data: input.evidenceFileIds.map((fileAssetId) => ({ promotionExecutionResultId: result.id, fileAssetId })),
        skipDuplicates: true,
      });
    }

    await this.transition(requestId, "RESULT_VERIFICATION", { actorId: actor.userId, partnerVisible: true });

    const withEvidence = await this.prisma.promotionExecutionResult.findUniqueOrThrow({
      where: { id: result.id },
      include: { evidence: true },
    });
    return toExecutionResultDto(withEvidence);
  }

  private async assertNoScheduleConflict(
    operatorId: string,
    capacityResourceId: string | undefined,
    startAt: Date,
    endAt: Date,
    excludeScheduleId?: string,
  ): Promise<void> {
    const capacity = capacityResourceId
      ? (await this.prisma.capacityResource.findUnique({ where: { id: capacityResourceId } }))?.capacityPerDay ?? 1
      : 1;

    const existing = await this.prisma.promotionSchedule.findMany({
      where: { operatorId, id: excludeScheduleId ? { not: excludeScheduleId } : undefined },
      select: { id: true, scheduledStartAt: true, scheduledEndAt: true },
    });

    const conflicts = findSchedulingConflicts(
      existing.map((s) => ({ id: s.id, startAt: s.scheduledStartAt, endAt: s.scheduledEndAt ?? new Date(s.scheduledStartAt.getTime() + 60 * 60 * 1000) })),
      { startAt, endAt },
      capacity,
    );

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `این اپراتور در این بازه زمانی ظرفیت آزاد ندارد (${conflicts.length} برنامه هم‌پوشان با ظرفیت ${capacity}).`,
      );
    }
  }

  async calculatePrice(requestId: string, input: CalculatePrice, actor: RequestActor): Promise<PriceCalculation> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { promotionType: { select: { key: true, name: true, pricingModel: true } } },
    });
    if (request.promotionType.pricingModel !== "CALCULATED") {
      throw new BadRequestException("این نوع درخواست قیمت‌گذاری محاسبه‌ای ندارد.");
    }
    if (request.status !== "PRICING_OR_QUOTE") {
      throw new BadRequestException("محاسبه قیمت فقط در مرحله قیمت‌گذاری امکان‌پذیر است.");
    }
    if (!request.audienceType || !request.requestedUniqueViews) {
      throw new BadRequestException("مخاطب هدف و تعداد بازدید درخواستی مشخص نیست.");
    }

    const { version, rule } = await this.getActivePriceRule(request.promotionTypeId, request.audienceType);

    const discountRial = input.discountRial ? BigInt(input.discountRial) : 0n;
    const result = calculatePinPrice({
      requestedUniqueViews: request.requestedUniqueViews,
      ratePerViewRial: rule.ratePerViewRial,
      discountRial,
      multiplierPercent: input.multiplierPercent,
      minAmountRial: rule.minAmountRial ?? undefined,
      capAmountRial: rule.capAmountRial ?? undefined,
    });

    const created = await this.prisma.priceCalculation.create({
      data: {
        supportRequestId: requestId,
        promotionTypeVersionId: version.id,
        requestedUniqueViews: request.requestedUniqueViews,
        audienceType: request.audienceType,
        ratePerViewRial: rule.ratePerViewRial,
        baseAmountRial: result.baseAmountRial,
        discountRial: result.discountRial,
        multiplierPercent: result.multiplierPercent,
        estimatedAmountRial: result.finalAmountRial,
        lineItems: result.lineItems.map((li) => ({ label: li.label, amountRial: serializeRial(li.amountRial) })) as never,
        requiresSecondApproval: result.finalAmountRial > SECOND_APPROVAL_THRESHOLD_RIAL,
        createdBy: actor.userId,
      },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.price_calculated",
      entityType: "support_request",
      entityId: requestId,
      metadata: { estimatedAmountRial: result.finalAmountRial.toString() },
    });

    return toPriceCalculationDto(created);
  }

  async overridePrice(requestId: string, input: OverridePrice, actor: RequestActor): Promise<PriceCalculation> {
    const latest = await this.prisma.priceCalculation.findFirst({
      where: { supportRequestId: requestId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      throw new BadRequestException("ابتدا باید یک محاسبه قیمت انجام شود.");
    }

    const overrideAmountRial = BigInt(input.overrideAmountRial);
    const created = await this.prisma.priceCalculation.create({
      data: {
        supportRequestId: requestId,
        promotionTypeVersionId: latest.promotionTypeVersionId,
        requestedUniqueViews: latest.requestedUniqueViews,
        audienceType: latest.audienceType,
        ratePerViewRial: latest.ratePerViewRial,
        baseAmountRial: latest.baseAmountRial,
        discountRial: latest.discountRial,
        multiplierPercent: latest.multiplierPercent,
        estimatedAmountRial: overrideAmountRial,
        lineItems: latest.lineItems as never,
        overrideAmountRial,
        overrideReason: input.overrideReason,
        requiresSecondApproval: true,
        createdBy: actor.userId,
      },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.price_overridden",
      entityType: "support_request",
      entityId: requestId,
      metadata: { overrideAmountRial: input.overrideAmountRial, reason: input.overrideReason },
    });

    return toPriceCalculationDto(created);
  }

  async approvePrice(requestId: string, actor: RequestActor): Promise<PriceCalculation> {
    const latest = await this.prisma.priceCalculation.findFirst({
      where: { supportRequestId: requestId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      throw new BadRequestException("ابتدا باید یک محاسبه قیمت انجام شود.");
    }

    const finalAmount = latest.overrideAmountRial ?? latest.estimatedAmountRial;

    let updated: PrismaPriceCalculation;
    if (!latest.approvedBy) {
      updated = await this.prisma.priceCalculation.update({
        where: { id: latest.id },
        data: { approvedAmountRial: finalAmount, approvedBy: actor.userId, approvedAt: new Date() },
      });
    } else if (latest.requiresSecondApproval && !latest.secondApprovedBy) {
      if (latest.approvedBy === actor.userId) {
        throw new ForbiddenException("تأیید دوم باید توسط شخص دیگری انجام شود.");
      }
      updated = await this.prisma.priceCalculation.update({
        where: { id: latest.id },
        data: { secondApprovedBy: actor.userId, secondApprovedAt: new Date() },
      });
    } else {
      throw new BadRequestException("این محاسبه قیمت قبلاً تأیید شده است.");
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.price_approved",
      entityType: "support_request",
      entityId: requestId,
    });

    return toPriceCalculationDto(updated);
  }

  async createQuoteVersion(requestId: string, input: CreateQuoteVersion, actor: RequestActor): Promise<PromotionQuote> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { promotionType: { select: { pricingModel: true } } },
    });
    if (request.promotionType.pricingModel !== "QUOTE") {
      throw new BadRequestException("این نوع درخواست شامل استعلام قیمت نیست.");
    }
    if (request.status !== "PRICING_OR_QUOTE") {
      throw new BadRequestException("پیشنهاد قیمت فقط در مرحله قیمت‌گذاری قابل ثبت است.");
    }

    const quote = await this.prisma.promotionQuote.upsert({
      where: { supportRequestId: requestId },
      create: { supportRequestId: requestId, status: "DRAFT" },
      update: {},
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    const previousLatest = quote.versions[0];
    const nextVersionNumber = (previousLatest?.versionNumber ?? 0) + 1;

    await this.prisma.$transaction([
      ...(previousLatest && (previousLatest.status === "PROPOSED" || previousLatest.status === "NEGOTIATION_REQUESTED")
        ? [this.prisma.promotionQuoteVersion.update({ where: { id: previousLatest.id }, data: { status: "SUPERSEDED" } })]
        : []),
      this.prisma.promotionQuoteVersion.create({
        data: {
          quoteId: quote.id,
          versionNumber: nextVersionNumber,
          status: "PROPOSED",
          estimatedChannelMin: input.estimatedChannelMin,
          estimatedChannelMax: input.estimatedChannelMax,
          estimatedViewMin: input.estimatedViewMin,
          estimatedViewMax: input.estimatedViewMax,
          method: input.method,
          scheduleNote: input.scheduleNote,
          amountRial: BigInt(input.amountRial),
          assumptions: input.assumptions,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          createdBy: actor.userId,
        },
      }),
      this.prisma.promotionQuote.update({ where: { id: quote.id }, data: { status: "SENT" } }),
    ]);

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "support_request.quote_version_created",
      entityType: "support_request",
      entityId: requestId,
      metadata: { versionNumber: nextVersionNumber },
    });

    await this.notifications.notify({
      userId: request.requestedById,
      eventType: "support-request.new_quote",
      dedupeKey: `promotion-quote:${quote.id}:version:${nextVersionNumber}`,
      title: "پیشنهاد قیمت جدید",
      body: "پیشنهاد قیمت جدیدی برای درخواست شما ثبت شد.",
      deepLink: `/promotions/${requestId}`,
      linkedEntityType: "support_request",
      linkedEntityId: requestId,
      channels: ["IN_APP", "SMS"],
    });

    const refreshed = await this.prisma.promotionQuote.findUniqueOrThrow({
      where: { id: quote.id },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });
    return toQuoteDto(refreshed);
  }

  async sendToApproval(requestId: string, actor: RequestActor): Promise<void> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { promotionType: { select: { pricingModel: true } } },
    });

    if (request.promotionType.pricingModel === "CALCULATED") {
      const latest = await this.prisma.priceCalculation.findFirst({
        where: { supportRequestId: requestId },
        orderBy: { createdAt: "desc" },
      });
      if (!latest?.approvedBy || (latest.requiresSecondApproval && !latest.secondApprovedBy)) {
        throw new BadRequestException("قیمت این درخواست هنوز به‌طور کامل تأیید نشده است.");
      }
    } else {
      const quote = await this.prisma.promotionQuote.findUnique({ where: { supportRequestId: requestId } });
      if (quote?.status !== "ACCEPTED") {
        throw new BadRequestException("پیشنهاد قیمت هنوز توسط همکار کانال پذیرفته نشده است.");
      }
    }

    await this.transition(requestId, "INTERNAL_APPROVAL", { actorId: actor.userId, partnerVisible: false });
  }

  async internalApprove(requestId: string, actor: RequestActor): Promise<void> {
    await this.transition(requestId, "PARTNER_CONFIRMATION", { actorId: actor.userId, partnerVisible: true });
  }

  async verifyResult(requestId: string, input: VerifyResult, actor: RequestActor): Promise<void> {
    const target: SupportRequestStatusKey =
      input.outcome === "COMPLETE" ? "COMPLETED" : input.outcome === "ADJUSTMENT_REQUIRED" ? "ADJUSTMENT_REQUIRED" : "DISPUTED";

    if (input.outcome === "COMPLETE") {
      const order = await this.prisma.promotionOrder.findUnique({
        where: { supportRequestId: requestId },
        include: { supportRequest: { select: { requestedById: true } } },
      });
      if (order) {
        await this.prisma.promotionExecutionResult.updateMany({
          where: { promotionOrderId: order.id },
          data: { realizedValueRial: order.finalAmountRial, verifiedAt: new Date(), verifiedBy: actor.userId },
        });

        // Spec 16.1 point 21: completion posts the support value and the
        // channel's corresponding reciprocal-service debt together, in one
        // balanced transaction. idempotencyKey makes this safe to call again
        // on a retried verify-result request — it will never double-post.
        await this.ledger.post({
          transactionType: "SUPPORT_GRANTED",
          idempotencyKey: `support-request:${requestId}:support-granted`,
          sourceType: "support_request",
          sourceId: requestId,
          description: "پشتیبانی تبلیغاتی محقق‌شده و بدهی خدمت متقابل ناشی از آن",
          createdBy: actor.userId,
          entries: [
            { channelId: order.channelId, accountType: "CHANNEL_SUPPORT_VALUE", direction: "DEBIT", amountRial: order.finalAmountRial },
            { channelId: order.channelId, accountType: "CHANNEL_SERVICE_OBLIGATION", direction: "DEBIT", amountRial: order.finalAmountRial },
            { channelId: null, accountType: "PLATFORM_SUPPORT_POOL", direction: "CREDIT", amountRial: order.finalAmountRial },
            { channelId: null, accountType: "PLATFORM_SERVICE_POOL", direction: "CREDIT", amountRial: order.finalAmountRial },
          ],
        });

        await this.notifications.notify({
          userId: order.supportRequest.requestedById,
          eventType: "support-request.completed",
          dedupeKey: `support-request:${requestId}:completed`,
          title: "پشتیبانی تبلیغاتی تکمیل شد",
          body: "اجرای درخواست پشتیبانی شما با موفقیت تکمیل و ثبت شد.",
          deepLink: `/promotions/${requestId}`,
          linkedEntityType: "support_request",
          linkedEntityId: requestId,
          channels: ["IN_APP", "SMS"],
        });
      }
    }

    await this.transition(requestId, target, { actorId: actor.userId, note: input.note, partnerVisible: true });
  }

  async raiseDispute(requestId: string, reason: string, actor: RequestActor): Promise<void> {
    await this.transition(requestId, "DISPUTED", { actorId: actor.userId, note: reason, partnerVisible: true });
  }

  async resolveDispute(requestId: string, input: ResolveDispute, actor: RequestActor): Promise<void> {
    const target: SupportRequestStatusKey = input.outcome === "COMPLETE" ? "COMPLETED" : "CANCELLED";
    await this.transition(requestId, target, { actorId: actor.userId, note: input.note, partnerVisible: true });
  }

  // ---------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------

  private assertRequestComplete(request: RequestWithType): void {
    if (request.promotionType.pricingModel === "CALCULATED") {
      if (!request.audienceType) throw new BadRequestException("مخاطب هدف (سراسری یا استانی) را انتخاب کنید.");
      if (request.audienceType === "PROVINCIAL" && !request.province) {
        throw new BadRequestException("برای پروموشن استانی، انتخاب استان الزامی است.");
      }
      if (!request.requestedUniqueViews || request.requestedUniqueViews <= 0) {
        throw new BadRequestException("تعداد بازدید یکتای درخواستی را مشخص کنید.");
      }
    } else {
      const details = (request.details ?? {}) as Record<string, unknown>;
      const missing = REQUIRED_VARIABLE_DETAIL_KEYS.filter((key) => !details[key] || String(details[key]).trim() === "");
      if (missing.length > 0) {
        throw new BadRequestException(`فیلدهای الزامی تکمیل نشده‌اند: ${missing.join("، ")}`);
      }
    }
  }

  private async getActivePriceRule(promotionTypeId: string, audienceType: string) {
    const version = await this.prisma.promotionTypeVersion.findFirst({
      where: { promotionTypeId, status: "PUBLISHED" },
      include: { priceRules: true },
    });
    if (!version) {
      throw new BadRequestException("نسخه منتشرشده‌ای برای این نوع پروموشن یافت نشد.");
    }
    const rule = version.priceRules.find((r) => r.audienceType === audienceType);
    if (!rule) {
      throw new BadRequestException("قاعده قیمتی برای این مخاطب هدف تعریف نشده است.");
    }
    return { version, rule };
  }

  private async resolveFinalAmount(request: RequestWithType): Promise<bigint> {
    if (request.promotionType.pricingModel === "CALCULATED") {
      const latest = await this.prisma.priceCalculation.findFirst({
        where: { supportRequestId: request.id },
        orderBy: { createdAt: "desc" },
      });
      if (!latest?.approvedAmountRial) {
        throw new BadRequestException("قیمت این درخواست هنوز تأیید نشده است.");
      }
      return latest.approvedAmountRial;
    }

    const quote = await this.prisma.promotionQuote.findUnique({
      where: { supportRequestId: request.id },
      include: { versions: { where: { status: "ACCEPTED" }, orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    const accepted = quote?.versions[0];
    if (!accepted) {
      throw new BadRequestException("پیشنهاد قیمت پذیرفته‌شده‌ای یافت نشد.");
    }
    return accepted.amountRial;
  }

  private async getOwnedRequestOrThrow(channelId: string, requestId: string): Promise<RequestWithType> {
    const request = await this.prisma.supportRequest.findFirst({
      where: { id: requestId, channelId },
      include: { promotionType: { select: { key: true, name: true, pricingModel: true } } },
    });
    if (!request) {
      throw new NotFoundException("درخواست مورد نظر یافت نشد.");
    }
    return request;
  }

  private async transition(requestId: string, toStatus: SupportRequestStatusKey, options: TransitionOptions): Promise<void> {
    const request = await this.prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });

    try {
      supportRequestStateMachine.assertTransition(request.status, toStatus);
    } catch (error) {
      if (error instanceof IllegalStateTransitionError) {
        throw new BadRequestException(`تغییر وضعیت از «${request.status}» به «${toStatus}» مجاز نیست.`);
      }
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.supportRequest.update({ where: { id: requestId }, data: { status: toStatus } }),
      this.prisma.supportRequestStatusEvent.create({
        data: {
          supportRequestId: requestId,
          fromStatus: request.status,
          toStatus,
          note: options.note,
          partnerVisible: options.partnerVisible,
          createdBy: options.actorId,
        },
      }),
    ]);

    await this.auditLog.record({
      actorId: options.actorId,
      actorType: options.actorId ? "user" : "system",
      action: "support_request.transitioned",
      entityType: "support_request",
      entityId: requestId,
      metadata: { from: request.status, to: toStatus },
    });
  }
}

function toSupportRequestDto(request: RequestWithType): SupportRequest {
  return {
    id: request.id,
    channelId: request.channelId,
    promotionTypeId: request.promotionTypeId,
    promotionTypeKey: request.promotionType.key,
    promotionTypeName: request.promotionType.name,
    pricingModel: request.promotionType.pricingModel as SupportRequest["pricingModel"],
    status: request.status,
    audienceType: request.audienceType,
    province: request.province,
    requestedUniqueViews: request.requestedUniqueViews,
    details: request.details as Record<string, unknown>,
    currentRevisionNumber: request.currentRevisionNumber,
    submittedAt: request.submittedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
  };
}

function toPriceCalculationDto(calc: PrismaPriceCalculation): PriceCalculation {
  return {
    id: calc.id,
    promotionTypeVersionId: calc.promotionTypeVersionId,
    requestedUniqueViews: calc.requestedUniqueViews,
    audienceType: calc.audienceType as PriceCalculation["audienceType"],
    ratePerViewRial: serializeRial(calc.ratePerViewRial),
    baseAmountRial: serializeRial(calc.baseAmountRial),
    discountRial: serializeRial(calc.discountRial),
    multiplierPercent: calc.multiplierPercent,
    estimatedAmountRial: serializeRial(calc.estimatedAmountRial),
    lineItems: calc.lineItems as PriceCalculation["lineItems"],
    overrideAmountRial: calc.overrideAmountRial !== null ? serializeRial(calc.overrideAmountRial) : null,
    overrideReason: calc.overrideReason,
    requiresSecondApproval: calc.requiresSecondApproval,
    approvedAmountRial: calc.approvedAmountRial !== null ? serializeRial(calc.approvedAmountRial) : null,
    approvedBy: calc.approvedBy,
    secondApprovedBy: calc.secondApprovedBy,
    createdAt: calc.createdAt.toISOString(),
  };
}

function toQuoteDto(quote: { id: string; status: string; versions: PrismaQuoteVersion[] }): PromotionQuote {
  return {
    id: quote.id,
    status: quote.status as PromotionQuote["status"],
    versions: quote.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      status: v.status as PromotionQuote["versions"][number]["status"],
      estimatedChannelMin: v.estimatedChannelMin,
      estimatedChannelMax: v.estimatedChannelMax,
      estimatedViewMin: v.estimatedViewMin,
      estimatedViewMax: v.estimatedViewMax,
      method: v.method,
      scheduleNote: v.scheduleNote,
      amountRial: serializeRial(v.amountRial),
      assumptions: v.assumptions,
      expiresAt: v.expiresAt?.toISOString() ?? null,
      negotiationNote: v.negotiationNote,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

function toOrderDto(order: { id: string; supportRequestId: string; channelId: string; finalAmountRial: bigint; createdAt: Date }): PromotionOrder {
  return {
    id: order.id,
    supportRequestId: order.supportRequestId,
    channelId: order.channelId,
    finalAmountRial: serializeRial(order.finalAmountRial),
    createdAt: order.createdAt.toISOString(),
  };
}

function toStatusEventDto(event: { id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: Date }): SupportRequestStatusEvent {
  return {
    id: event.id,
    fromStatus: event.fromStatus as SupportRequestStatusEvent["fromStatus"],
    toStatus: event.toStatus as SupportRequestStatusEvent["toStatus"],
    note: event.note,
    createdAt: event.createdAt.toISOString(),
  };
}

function toScheduleDto(schedule: PrismaSchedule & { operator: { displayName: string } }): PromotionSchedule {
  return {
    id: schedule.id,
    operatorId: schedule.operatorId,
    operatorName: schedule.operator.displayName,
    capacityResourceId: schedule.capacityResourceId,
    scheduledStartAt: schedule.scheduledStartAt.toISOString(),
    scheduledEndAt: schedule.scheduledEndAt?.toISOString() ?? null,
    checklist: schedule.checklist as PromotionSchedule["checklist"],
  };
}

function toExecutionResultDto(result: PrismaExecutionResult & { evidence: { fileAssetId: string }[] }): PromotionExecutionResult {
  return {
    id: result.id,
    actualUniqueViews: result.actualUniqueViews,
    actualChannelsCount: result.actualChannelsCount,
    realizedValueRial: result.realizedValueRial !== null ? serializeRial(result.realizedValueRial) : null,
    verifiedAt: result.verifiedAt?.toISOString() ?? null,
    evidenceFileIds: result.evidence.map((e) => e.fileAssetId),
  };
}
