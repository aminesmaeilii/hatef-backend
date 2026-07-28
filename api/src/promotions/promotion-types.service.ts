import { BadRequestException, Injectable } from "@nestjs/common";
import type { CreatePriceRule, CreatePromotionType, PromotionType, PromotionTypeVersionDefinition } from "@hatef/contracts";
import { serializeRial } from "@hatef/domain";
import { PrismaService } from "../prisma/prisma.service";
import { slugifyWithUniqueSuffix } from "../common/slug.util";

const NOT_DRAFT_ERROR = "این نسخه از نوع پروموشن منتشر شده و قابل ویرایش نیست. یک نسخه جدید ایجاد کنید.";

@Injectable()
export class PromotionTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePromotionType): Promise<{ promotionTypeId: string; draftVersionId: string }> {
    const promotionType = await this.prisma.promotionType.create({
      data: {
        key: input.key ?? slugifyWithUniqueSuffix(input.name),
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

  async list(): Promise<PromotionType[]> {
    const types = await this.prisma.promotionType.findMany({
      include: { versions: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
    return types.map(toPromotionTypeDto);
  }

  async getOne(promotionTypeId: string): Promise<{
    id: string;
    key: string;
    name: string;
    pricingModel: string;
    draft: PromotionTypeVersionDefinition | null;
    published: PromotionTypeVersionDefinition | null;
  }> {
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

  async getPublishedByKey(key: string): Promise<{ promotionTypeId: string; version: PromotionTypeVersionDefinition }> {
    const type = await this.prisma.promotionType.findUniqueOrThrow({
      where: { key },
      include: { versions: { where: { status: "PUBLISHED" }, include: { priceRules: true } } },
    });
    const published = type.versions[0];
    if (!published) {
      throw new BadRequestException(`نسخه منتشرشده‌ای برای نوع پروموشن «${key}» یافت نشد.`);
    }
    return { promotionTypeId: type.id, version: toVersionDto(published) };
  }

  async addPriceRule(promotionTypeId: string, input: CreatePriceRule) {
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

  async deletePriceRule(priceRuleId: string): Promise<void> {
    const rule = await this.prisma.priceRule.findUniqueOrThrow({
      where: { id: priceRuleId },
      include: { promotionTypeVersion: { select: { status: true } } },
    });
    if (rule.promotionTypeVersion.status !== "DRAFT") throw new BadRequestException(NOT_DRAFT_ERROR);
    await this.prisma.priceRule.delete({ where: { id: priceRuleId } });
  }

  async publish(promotionTypeId: string): Promise<PromotionTypeVersionDefinition> {
    const draft = await this.requireDraftVersion(promotionTypeId);
    const promotionType = await this.prisma.promotionType.findUniqueOrThrow({ where: { id: promotionTypeId } });

    if (promotionType.pricingModel === "CALCULATED") {
      const ruleCount = await this.prisma.priceRule.count({ where: { promotionTypeVersionId: draft.id } });
      if (ruleCount === 0) {
        throw new BadRequestException("نوع پروموشن با قیمت‌گذاری محاسبه‌ای باید حداقل یک قاعده قیمت داشته باشد.");
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

  private async requireDraftVersion(promotionTypeId: string) {
    const existingDraft = await this.prisma.promotionTypeVersion.findFirst({ where: { promotionTypeId, status: "DRAFT" } });
    if (existingDraft) return existingDraft;

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
}

function toPromotionTypeDto(type: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  pricingModel: string;
  versions: { id: string; status: string }[];
}): PromotionType {
  return {
    id: type.id,
    key: type.key,
    name: type.name,
    description: type.description,
    pricingModel: type.pricingModel as PromotionType["pricingModel"],
    draftVersionId: type.versions.find((v) => v.status === "DRAFT")?.id ?? null,
    publishedVersionId: type.versions.find((v) => v.status === "PUBLISHED")?.id ?? null,
  };
}

function toVersionDto(version: {
  id: string;
  promotionTypeId: string;
  versionNumber: number;
  status: string;
  effectiveFrom: Date | null;
  publishedAt: Date | null;
  priceRules: { id: string; audienceType: string | null; ratePerViewRial: bigint; minAmountRial: bigint | null; capAmountRial: bigint | null }[];
}): PromotionTypeVersionDefinition {
  return {
    id: version.id,
    promotionTypeId: version.promotionTypeId,
    versionNumber: version.versionNumber,
    status: version.status as PromotionTypeVersionDefinition["status"],
    effectiveFrom: version.effectiveFrom?.toISOString() ?? null,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    priceRules: version.priceRules.map((rule) => ({
      id: rule.id,
      audienceType: rule.audienceType as PromotionTypeVersionDefinition["priceRules"][number]["audienceType"],
      ratePerViewRial: serializeRial(rule.ratePerViewRial),
      minAmountRial: rule.minAmountRial !== null ? serializeRial(rule.minAmountRial) : null,
      capAmountRial: rule.capAmountRial !== null ? serializeRial(rule.capAmountRial) : null,
    })),
  };
}
