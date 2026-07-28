import type { CreatePriceRule, CreatePromotionType, PromotionType, PromotionTypeVersionDefinition } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
export declare class PromotionTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreatePromotionType): Promise<{
        promotionTypeId: string;
        draftVersionId: string;
    }>;
    list(): Promise<PromotionType[]>;
    getOne(promotionTypeId: string): Promise<{
        id: string;
        key: string;
        name: string;
        pricingModel: string;
        draft: PromotionTypeVersionDefinition | null;
        published: PromotionTypeVersionDefinition | null;
    }>;
    getPublishedByKey(key: string): Promise<{
        promotionTypeId: string;
        version: PromotionTypeVersionDefinition;
    }>;
    addPriceRule(promotionTypeId: string, input: CreatePriceRule): Promise<{
        id: string;
        createdAt: Date;
        promotionTypeVersionId: string;
        audienceType: import("@hatef/database").$Enums.AudienceType | null;
        ratePerViewRial: bigint;
        minAmountRial: bigint | null;
        capAmountRial: bigint | null;
    }>;
    deletePriceRule(priceRuleId: string): Promise<void>;
    publish(promotionTypeId: string): Promise<PromotionTypeVersionDefinition>;
    private requireDraftVersion;
}
//# sourceMappingURL=promotion-types.service.d.ts.map