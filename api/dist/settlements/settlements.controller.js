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
exports.ChannelSettlementsController = exports.SettlementsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const require_step_up_decorator_1 = require("../auth/require-step-up.decorator");
const step_up_guard_1 = require("../auth/step-up.guard");
const settlements_service_1 = require("./settlements.service");
let SettlementsController = class SettlementsController {
    settlements;
    constructor(settlements) {
        this.settlements = settlements;
    }
    async create(body, actor) {
        return this.settlements.create(body, actor);
    }
    async getOne(settlementId) {
        return this.settlements.getOne(settlementId);
    }
    async submit(settlementId, actor) {
        return this.settlements.submitForApproval(settlementId, actor);
    }
    async decide(settlementId, body, actor) {
        return this.settlements.decideApproval(settlementId, body, actor);
    }
};
exports.SettlementsController = SettlementsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SETTLEMENT_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createSettlementSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":settlementId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SETTLEMENT_MANAGE),
    __param(0, (0, common_1.Param)("settlementId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":settlementId/submit"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SETTLEMENT_MANAGE),
    __param(0, (0, common_1.Param)("settlementId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(":settlementId/decide"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FINANCIAL_APPROVAL_DECIDE),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    __param(0, (0, common_1.Param)("settlementId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.decideFinancialApprovalSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "decide", null);
exports.SettlementsController = SettlementsController = __decorate([
    (0, common_1.Controller)("settlements"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard, step_up_guard_1.StepUpGuard),
    __metadata("design:paramtypes", [settlements_service_1.SettlementsService])
], SettlementsController);
let ChannelSettlementsController = class ChannelSettlementsController {
    settlements;
    constructor(settlements) {
        this.settlements = settlements;
    }
    async list(channelId) {
        return this.settlements.listForChannel(channelId);
    }
};
exports.ChannelSettlementsController = ChannelSettlementsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.LEDGER_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelSettlementsController.prototype, "list", null);
exports.ChannelSettlementsController = ChannelSettlementsController = __decorate([
    (0, common_1.Controller)("channels/:channelId/settlements"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [settlements_service_1.SettlementsService])
], ChannelSettlementsController);
