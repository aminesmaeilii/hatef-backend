import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createPriceRuleSchema,
  createPromotionTypeSchema,
  type CreatePriceRule,
  type CreatePromotionType,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { PromotionTypesService } from "./promotion-types.service";

@Controller("promotion-types")
@UseGuards(SessionAuthGuard, PermissionGuard)
@RequirePermission(PERMISSIONS.PROMOTION_TYPE_MANAGE)
export class PromotionTypesController {
  constructor(private readonly promotionTypes: PromotionTypesService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createPromotionTypeSchema)) body: CreatePromotionType) {
    return this.promotionTypes.create(body);
  }

  @Get()
  async list() {
    return this.promotionTypes.list();
  }

  @Get(":promotionTypeId")
  async getOne(@Param("promotionTypeId") promotionTypeId: string) {
    return this.promotionTypes.getOne(promotionTypeId);
  }

  @Post(":promotionTypeId/price-rules")
  async addPriceRule(
    @Param("promotionTypeId") promotionTypeId: string,
    @Body(new ZodValidationPipe(createPriceRuleSchema)) body: CreatePriceRule,
  ) {
    return this.promotionTypes.addPriceRule(promotionTypeId, body);
  }

  @Delete("price-rules/:priceRuleId")
  async deletePriceRule(@Param("priceRuleId") priceRuleId: string) {
    await this.promotionTypes.deletePriceRule(priceRuleId);
    return { ok: true };
  }

  @Post(":promotionTypeId/publish")
  async publish(@Param("promotionTypeId") promotionTypeId: string) {
    return this.promotionTypes.publish(promotionTypeId);
  }
}
