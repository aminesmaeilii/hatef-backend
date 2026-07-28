import { Controller, Get, UseGuards } from "@nestjs/common";
import { serializeRial } from "@hatef/domain";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../session/session-auth.guard";

/**
 * Any authenticated user (internal or partner) may read the published
 * promotion-type catalog — it's what a partner picks from to start a
 * request, not sensitive. Same "published structure is public to logged-in
 * users" precedent as Phase 2's PublishedFormsController.
 */
@Controller("promotion-types-published")
@UseGuards(SessionAuthGuard)
export class PublishedPromotionTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const types = await this.prisma.promotionType.findMany({
      include: { versions: { where: { status: "PUBLISHED" }, include: { priceRules: true } } },
      orderBy: { createdAt: "asc" },
    });

    return types
      .filter((type) => type.versions.length > 0)
      .map((type) => {
        const version = type.versions[0]!;
        return {
          id: type.id,
          key: type.key,
          name: type.name,
          description: type.description,
          pricingModel: type.pricingModel,
          priceRules: version.priceRules.map((rule) => ({
            audienceType: rule.audienceType,
            ratePerViewRial: serializeRial(rule.ratePerViewRial),
          })),
        };
      });
  }
}
