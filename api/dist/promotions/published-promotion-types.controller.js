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
exports.PublishedPromotionTypesController = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const session_auth_guard_1 = require("../session/session-auth.guard");
/**
 * Any authenticated user (internal or partner) may read the published
 * promotion-type catalog — it's what a partner picks from to start a
 * request, not sensitive. Same "published structure is public to logged-in
 * users" precedent as Phase 2's PublishedFormsController.
 */
let PublishedPromotionTypesController = class PublishedPromotionTypesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list() {
        const types = await this.prisma.promotionType.findMany({
            include: { versions: { where: { status: "PUBLISHED" }, include: { priceRules: true } } },
            orderBy: { createdAt: "asc" },
        });
        return types
            .filter((type) => type.versions.length > 0)
            .map((type) => {
            const version = type.versions[0];
            return {
                id: type.id,
                key: type.key,
                name: type.name,
                description: type.description,
                pricingModel: type.pricingModel,
                priceRules: version.priceRules.map((rule) => ({
                    audienceType: rule.audienceType,
                    ratePerViewRial: (0, domain_1.serializeRial)(rule.ratePerViewRial),
                })),
            };
        });
    }
};
exports.PublishedPromotionTypesController = PublishedPromotionTypesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublishedPromotionTypesController.prototype, "list", null);
exports.PublishedPromotionTypesController = PublishedPromotionTypesController = __decorate([
    (0, common_1.Controller)("promotion-types-published"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublishedPromotionTypesController);
