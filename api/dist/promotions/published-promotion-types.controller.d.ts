import { PrismaService } from "../prisma/prisma.service";
/**
 * Any authenticated user (internal or partner) may read the published
 * promotion-type catalog — it's what a partner picks from to start a
 * request, not sensitive. Same "published structure is public to logged-in
 * users" precedent as Phase 2's PublishedFormsController.
 */
export declare class PublishedPromotionTypesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): Promise<{
        id: string;
        key: string;
        name: string;
        description: string | null;
        pricingModel: import("@hatef/database").$Enums.PromotionPricingModel;
        priceRules: {
            audienceType: import("@hatef/database").$Enums.AudienceType | null;
            ratePerViewRial: string;
        }[];
    }[]>;
}
//# sourceMappingURL=published-promotion-types.controller.d.ts.map