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
exports.RateCardsService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
let RateCardsService = class RateCardsService {
    prisma;
    auditLog;
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    /** Every version is kept — old versions are never deleted (spec 17, same immutable-history discipline as every other *Version model). */
    async getOrCreateDraft(channelId) {
        const latest = await this.prisma.channelRateCard.findFirst({ where: { channelId }, orderBy: { versionNumber: "desc" } });
        if (latest && latest.status === "DRAFT")
            return latest;
        return this.prisma.channelRateCard.create({ data: { channelId, versionNumber: (latest?.versionNumber ?? 0) + 1 } });
    }
    async addItem(channelId, input, actor) {
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
    async submit(channelId, actor) {
        const card = await this.prisma.channelRateCard.findFirst({ where: { channelId, status: "DRAFT" }, orderBy: { versionNumber: "desc" } });
        if (!card)
            throw new common_1.BadRequestException("پیش‌نویس کارت نرخ یافت نشد.");
        await this.prisma.channelRateCard.update({ where: { id: card.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
        await this.auditLog.record({ actorId: actor.userId, actorType: "user", action: "rate-card.submitted", entityType: "channel_rate_card", entityId: card.id });
        return this.getCurrent(channelId);
    }
    async getCurrent(channelId) {
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
    async listSubmitted() {
        const cards = await this.prisma.channelRateCard.findMany({
            where: { status: { in: ["SUBMITTED", "NEGOTIATING"] } },
            include: { items: true },
            orderBy: { submittedAt: "asc" },
        });
        return cards.map(toRateCardDto);
    }
    /** Admin can review/comment/approve/negotiate/archive per-item (spec 17) — a card can be part-approved, part-negotiating. */
    async reviewItem(itemId, input, actor) {
        const status = input.action === "APPROVE" ? "APPROVED" : input.action === "NEGOTIATE" ? "NEGOTIATING" : "ARCHIVED";
        await this.prisma.rateCardItem.update({ where: { id: itemId }, data: { status, adminComment: input.comment } });
        const item = await this.prisma.rateCardItem.findUniqueOrThrow({ where: { id: itemId } });
        const siblings = await this.prisma.rateCardItem.findMany({ where: { rateCardId: item.rateCardId } });
        if (siblings.every((s) => s.status === "APPROVED")) {
            await this.prisma.channelRateCard.update({ where: { id: item.rateCardId }, data: { status: "APPROVED" } });
        }
        else if (siblings.some((s) => s.status === "NEGOTIATING")) {
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
};
exports.RateCardsService = RateCardsService;
exports.RateCardsService = RateCardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], RateCardsService);
function toRateCardDto(card) {
    return {
        id: card.id,
        channelId: card.channelId,
        versionNumber: card.versionNumber,
        status: card.status,
        submittedAt: card.submittedAt?.toISOString() ?? null,
        items: card.items.map((i) => ({
            id: i.id,
            serviceType: i.serviceType,
            title: i.title,
            description: i.description,
            priceUnit: i.priceUnit,
            amountRial: (0, domain_1.serializeRial)(i.amountRial),
            minimumOrder: i.minimumOrder,
            leadTimeDays: i.leadTimeDays,
            monthlyCapacity: i.monthlyCapacity,
            terms: i.terms,
            sampleWorkUrl: i.sampleWorkUrl,
            effectiveFrom: i.effectiveFrom?.toISOString() ?? null,
            expiresAt: i.expiresAt?.toISOString() ?? null,
            status: i.status,
            adminComment: i.adminComment,
        })),
        createdAt: card.createdAt.toISOString(),
    };
}
