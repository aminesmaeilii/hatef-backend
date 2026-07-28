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
exports.PromotionTypesService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const slug_util_1 = require("../common/slug.util");
const NOT_DRAFT_ERROR = "این نسخه از نوع پروموشن منتشر شده و قابل ویرایش نیست. یک نسخه جدید ایجاد کنید.";
let PromotionTypesService = class PromotionTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        const promotionType = await this.prisma.promotionType.create({
            data: {
                key: input.key ?? (0, slug_util_1.slugifyWithUniqueSuffix)(input.name),
                name: input.name,
                description: input.description,
                pricingModel: input.pricingModel,
            },
        });
        const draft = await this.prisma.promotionTypeVersion.create({
            data: { promotionTypeId: promotionType.id, versionNumber: 1, status: "DRAFT" },
        });
        return { promotionTypeId: promotionType.id, draftVersionId: draft.id };
    }
    async list() {
        const types = await this.prisma.promotionType.findMany({
            include: { versions: { select: { id: true, status: true } } },
            orderBy: { createdAt: "desc" },
        });
        return types.map(toPromotionTypeDto);
    }
    async getOne(promotionTypeId) {
        const type = await this.prisma.promotionType.findUniqueOrThrow({
            where: { id: promotionTypeId },
            include: { versions: { include: { priceRules: true }, orderBy: { versionNumber: "desc" } } },
        });
        const draft = type.versions.find((v) => v.status === "DRAFT");
        const published = type.versions.find((v) => v.status === "PUBLISHED");
        return {
            id: type.id,
            key: type.key,
            name: type.name,
            pricingModel: type.pricingModel,
            draft: draft ? toVersionDto(draft) : null,
            published: published ? toVersionDto(published) : null,
        };
    }
    async getPublishedByKey(key) {
        const type = await this.prisma.promotionType.findUniqueOrThrow({
            where: { key },
            include: { versions: { where: { status: "PUBLISHED" }, include: { priceRules: true } } },
        });
        const published = type.versions[0];
        if (!published) {
            throw new common_1.BadRequestException(`نسخه منتشرشده‌ای برای نوع پروموشن «${key}» یافت نشد.`);
        }
        return { promotionTypeId: type.id, version: toVersionDto(published) };
    }
    async addPriceRule(promotionTypeId, input) {
        const draft = await this.requireDraftVersion(promotionTypeId);
        return this.prisma.priceRule.create({
            data: {
                promotionTypeVersionId: draft.id,
                audienceType: input.audienceType,
                ratePerViewRial: BigInt(input.ratePerViewRial),
                minAmountRial: input.minAmountRial ? BigInt(input.minAmountRial) : undefined,
                capAmountRial: input.capAmountRial ? BigInt(input.capAmountRial) : undefined,
            },
        });
    }
    async deletePriceRule(priceRuleId) {
        const rule = await this.prisma.priceRule.findUniqueOrThrow({
            where: { id: priceRuleId },
            include: { promotionTypeVersion: { select: { status: true } } },
        });
        if (rule.promotionTypeVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        await this.prisma.priceRule.delete({ where: { id: priceRuleId } });
    }
    async publish(promotionTypeId) {
        const draft = await this.requireDraftVersion(promotionTypeId);
        const promotionType = await this.prisma.promotionType.findUniqueOrThrow({ where: { id: promotionTypeId } });
        if (promotionType.pricingModel === "CALCULATED") {
            const ruleCount = await this.prisma.priceRule.count({ where: { promotionTypeVersionId: draft.id } });
            if (ruleCount === 0) {
                throw new common_1.BadRequestException("نوع پروموشن با قیمت‌گذاری محاسبه‌ای باید حداقل یک قاعده قیمت داشته باشد.");
            }
        }
        await this.prisma.$transaction([
            this.prisma.promotionTypeVersion.updateMany({
                where: { promotionTypeId, status: "PUBLISHED" },
                data: { status: "ARCHIVED" },
            }),
            this.prisma.promotionTypeVersion.update({
                where: { id: draft.id },
                data: { status: "PUBLISHED", publishedAt: new Date(), effectiveFrom: new Date() },
            }),
        ]);
        const published = await this.prisma.promotionTypeVersion.findUniqueOrThrow({
            where: { id: draft.id },
            include: { priceRules: true },
        });
        return toVersionDto(published);
    }
    async requireDraftVersion(promotionTypeId) {
        const existingDraft = await this.prisma.promotionTypeVersion.findFirst({ where: { promotionTypeId, status: "DRAFT" } });
        if (existingDraft)
            return existingDraft;
        const latest = await this.prisma.promotionTypeVersion.findFirst({
            where: { promotionTypeId },
            orderBy: { versionNumber: "desc" },
            include: { priceRules: true },
        });
        const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
        const newDraft = await this.prisma.promotionTypeVersion.create({
            data: { promotionTypeId, versionNumber: nextVersionNumber, status: "DRAFT" },
        });
        if (latest) {
            await this.prisma.priceRule.createMany({
                data: latest.priceRules.map((rule) => ({
                    promotionTypeVersionId: newDraft.id,
                    audienceType: rule.audienceType,
                    ratePerViewRial: rule.ratePerViewRial,
                    minAmountRial: rule.minAmountRial,
                    capAmountRial: rule.capAmountRial,
                })),
            });
        }
        return newDraft;
    }
};
exports.PromotionTypesService = PromotionTypesService;
exports.PromotionTypesService = PromotionTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionTypesService);
function toPromotionTypeDto(type) {
    return {
        id: type.id,
        key: type.key,
        name: type.name,
        description: type.description,
        pricingModel: type.pricingModel,
        draftVersionId: type.versions.find((v) => v.status === "DRAFT")?.id ?? null,
        publishedVersionId: type.versions.find((v) => v.status === "PUBLISHED")?.id ?? null,
    };
}
function toVersionDto(version) {
    return {
        id: version.id,
        promotionTypeId: version.promotionTypeId,
        versionNumber: version.versionNumber,
        status: version.status,
        effectiveFrom: version.effectiveFrom?.toISOString() ?? null,
        publishedAt: version.publishedAt?.toISOString() ?? null,
        priceRules: version.priceRules.map((rule) => ({
            id: rule.id,
            audienceType: rule.audienceType,
            ratePerViewRial: (0, domain_1.serializeRial)(rule.ratePerViewRial),
            minAmountRial: rule.minAmountRial !== null ? (0, domain_1.serializeRial)(rule.minAmountRial) : null,
            capAmountRial: rule.capAmountRial !== null ? (0, domain_1.serializeRial)(rule.capAmountRial) : null,
        })),
    };
}
