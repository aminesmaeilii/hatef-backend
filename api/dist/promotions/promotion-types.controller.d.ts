import { type CreatePriceRule, type CreatePromotionType } from "@hatef/contracts";
import { PromotionTypesService } from "./promotion-types.service";
export declare class PromotionTypesController {
    private readonly promotionTypes;
    constructor(promotionTypes: PromotionTypesService);
    create(body: CreatePromotionType): Promise<{
        promotionTypeId: string;
        draftVersionId: string;
    }>;
    list(): Promise<{
        id: string;
        key: string;
        name: string;
        description: string | null;
        pricingModel: "CALCULATED" | "QUOTE";
        draftVersionId: string | null;
        publishedVersionId: string | null;
    }[]>;
    getOne(promotionTypeId: string): Promise<{
        id: string;
        key: string;
        name: string;
        pricingModel: string;
        draft: import("@hatef/contracts").PromotionTypeVersionDefinition | null;
        published: import("@hatef/contracts").PromotionTypeVersionDefinition | null;
    }>;
    addPriceRule(promotionTypeId: string, body: CreatePriceRule): Promise<{
        id: string;
        createdAt: Date;
        promotionTypeVersionId: string;
        audienceType: import("@hatef/database").$Enums.AudienceType | null;
        ratePerViewRial: bigint;
        minAmountRial: bigint | null;
        capAmountRial: bigint | null;
    }>;
    deletePriceRule(priceRuleId: string): Promise<{
        ok: boolean;
    }>;
    publish(promotionTypeId: string): Promise<{
        id: string;
        promotionTypeId: string;
        versionNumber: number;
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        effectiveFrom: string | null;
        publishedAt: string | null;
        priceRules: {
            id: string;
            audienceType: "NATIONWIDE" | "PROVINCIAL" | null;
            ratePerViewRial: string;
            minAmountRial: string | null;
            capAmountRial: string | null;
        }[];
    }>;
}
//# sourceMappingURL=promotion-types.controller.d.ts.map