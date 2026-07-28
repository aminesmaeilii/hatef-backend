import { BadRequestException, Injectable } from "@nestjs/common";
import { serializeRial } from "@hatef/domain";
import type { CreateRateCardItem, RateCard, ReviewRateCardItem } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";

@Injectable()
export class RateCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Every version is kept — old versions are never deleted (spec 17, same immutable-history discipline as every other *Version model). */
  private async getOrCreateDraft(channelId: string) {
    const latest = await this.prisma.channelRateCard.findFirst({ where: { channelId }, orderBy: { versionNumber: "desc" } });
    if (latest && latest.status === "DRAFT") return latest;
    return this.prisma.channelRateCard.create({ data: { channelId, versionNumber: (latest?.versionNumber ?? 0) + 1 } });
  }

  async addItem(channelId: string, input: CreateRateCardItem, actor: RequestActor): Promise<RateCard> {
    const card = await this.getOrCreateDraft(channelId);
    await this.prisma.rateCardItem.create({
      data: {
        rateCardId: card.id,
        serviceType: input.serviceType,
        title: input.title,
        description: input.description,
        priceUnit: input.priceUnit,
        amountRial: BigInt(input.amountRial),
        minimumOrder: input.minimumOrder,
        leadTimeDays: input.leadTimeDays,
        monthlyCapacity: input.monthlyCapacity,
        terms: input.terms,
        sampleWorkUrl: input.sampleWorkUrl,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "rate-card-item.added",
      entityType: "channel_rate_card",
      entityId: card.id,
    });

    return this.getCurrent(channelId);
  }

  /** "The declared rate is not automatically approved" (spec 17) — submitting just moves the card into the admin review queue. */
  async submit(channelId: string, actor: RequestActor): Promise<RateCard> {
    const card = await this.prisma.channelRateCard.findFirst({ where: { channelId, status: "DRAFT" }, orderBy: { versionNumber: "desc" } });
    if (!card) throw new BadRequestException("پیش‌نویس کارت نرخ یافت نشد.");
    await this.prisma.channelRateCard.update({ where: { id: card.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
    await this.auditLog.record({ actorId: actor.userId, actorType: "user", action: "rate-card.submitted", entityType: "channel_rate_card", entityId: card.id });
    return this.getCurrent(channelId);
  }

  async getCurrent(channelId: string): Promise<RateCard> {
    const card = await this.prisma.channelRateCard.findFirst({
      where: { channelId },
      orderBy: { versionNumber: "desc" },
      include: { items: true },
    });
    if (!card) {
      return { id: "", channelId, versionNumber: 0, status: "DRAFT", submittedAt: null, items: [], createdAt: new Date().toISOString() };
    }
    return toRateCardDto(card);
  }

  async listSubmitted(): Promise<RateCard[]> {
    const cards = await this.prisma.channelRateCard.findMany({
      where: { status: { in: ["SUBMITTED", "NEGOTIATING"] } },
      include: { items: true },
      orderBy: { submittedAt: "asc" },
    });
    return cards.map(toRateCardDto);
  }

  /** Admin can review/comment/approve/negotiate/archive per-item (spec 17) — a card can be part-approved, part-negotiating. */
  async reviewItem(itemId: string, input: ReviewRateCardItem, actor: RequestActor): Promise<void> {
    const status = input.action === "APPROVE" ? "APPROVED" : input.action === "NEGOTIATE" ? "NEGOTIATING" : "ARCHIVED";
    await this.prisma.rateCardItem.update({ where: { id: itemId }, data: { status, adminComment: input.comment } });

    const item = await this.prisma.rateCardItem.findUniqueOrThrow({ where: { id: itemId } });
    const siblings = await this.prisma.rateCardItem.findMany({ where: { rateCardId: item.rateCardId } });
    if (siblings.every((s) => s.status === "APPROVED")) {
      await this.prisma.channelRateCard.update({ where: { id: item.rateCardId }, data: { status: "APPROVED" } });
    } else if (siblings.some((s) => s.status === "NEGOTIATING")) {
      await this.prisma.channelRateCard.update({ where: { id: item.rateCardId }, data: { status: "NEGOTIATING" } });
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "rate-card-item.reviewed",
      entityType: "rate_card_item",
      entityId: itemId,
      metadata: { action: input.action },
    });
  }
}

type RateCardWithItems = {
  id: string;
  channelId: string;
  versionNumber: number;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
  items: {
    id: string;
    serviceType: string;
    title: string;
    description: string | null;
    priceUnit: string;
    amountRial: bigint;
    minimumOrder: number | null;
    leadTimeDays: number | null;
    monthlyCapacity: number | null;
    terms: string | null;
    sampleWorkUrl: string | null;
    effectiveFrom: Date | null;
    expiresAt: Date | null;
    status: string;
    adminComment: string | null;
  }[];
};

function toRateCardDto(card: RateCardWithItems): RateCard {
  return {
    id: card.id,
    channelId: card.channelId,
    versionNumber: card.versionNumber,
    status: card.status as RateCard["status"],
    submittedAt: card.submittedAt?.toISOString() ?? null,
    items: card.items.map((i) => ({
      id: i.id,
      serviceType: i.serviceType as RateCard["items"][number]["serviceType"],
      title: i.title,
      description: i.description,
      priceUnit: i.priceUnit,
      amountRial: serializeRial(i.amountRial),
      minimumOrder: i.minimumOrder,
      leadTimeDays: i.leadTimeDays,
      monthlyCapacity: i.monthlyCapacity,
      terms: i.terms,
      sampleWorkUrl: i.sampleWorkUrl,
      effectiveFrom: i.effectiveFrom?.toISOString() ?? null,
      expiresAt: i.expiresAt?.toISOString() ?? null,
      status: i.status as RateCard["items"][number]["status"],
      adminComment: i.adminComment,
    })),
    createdAt: card.createdAt.toISOString(),
  };
}
