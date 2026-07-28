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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionTypesController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const promotion_types_service_1 = require("./promotion-types.service");
let PromotionTypesController = class PromotionTypesController {
    promotionTypes;
    constructor(promotionTypes) {
        this.promotionTypes = promotionTypes;
    }
    async create(body) {
        return this.promotionTypes.create(body);
    }
    async list() {
        return this.promotionTypes.list();
    }
    async getOne(promotionTypeId) {
        return this.promotionTypes.getOne(promotionTypeId);
    }
    async addPriceRule(promotionTypeId, body) {
        return this.promotionTypes.addPriceRule(promotionTypeId, body);
    }
    async deletePriceRule(priceRuleId) {
        await this.promotionTypes.deletePriceRule(priceRuleId);
        return { ok: true };
    }
    async publish(promotionTypeId) {
        return this.promotionTypes.publish(promotionTypeId);
    }
};
exports.PromotionTypesController = PromotionTypesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createPromotionTypeSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":promotionTypeId"),
    __param(0, (0, common_1.Param)("promotionTypeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":promotionTypeId/price-rules"),
    __param(0, (0, common_1.Param)("promotionTypeId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createPriceRuleSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "addPriceRule", null);
__decorate([
    (0, common_1.Delete)("price-rules/:priceRuleId"),
    __param(0, (0, common_1.Param)("priceRuleId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "deletePriceRule", null);
__decorate([
    (0, common_1.Post)(":promotionTypeId/publish"),
    __param(0, (0, common_1.Param)("promotionTypeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromotionTypesController.prototype, "publish", null);
exports.PromotionTypesController = PromotionTypesController = __decorate([
    (0, common_1.Controller)("promotion-types"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.PROMOTION_TYPE_MANAGE),
    __metadata("design:paramtypes", [promotion_types_service_1.PromotionTypesService])
], PromotionTypesController);
