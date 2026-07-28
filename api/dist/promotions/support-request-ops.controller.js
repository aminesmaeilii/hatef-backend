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
exports.SupportRequestOpsController = void 0;
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
const support_requests_service_1 = require("./support-requests.service");
/** Admin/internal operational queue + Kanban + workflow actions. */
let SupportRequestOpsController = class SupportRequestOpsController {
    supportRequests;
    constructor(supportRequests) {
        this.supportRequests = supportRequests;
    }
    async list(status, channelId) {
        const parsed = status ? contracts_1.supportRequestStatusSchema.parse(status) : undefined;
        return this.supportRequests.listQueue(parsed, channelId);
    }
    async getOne(requestId) {
        return this.supportRequests.getDetail(requestId);
    }
    async advance(requestId, actor) {
        await this.supportRequests.advance(requestId, actor);
        return { ok: true };
    }
    async validate(requestId, actor) {
        await this.supportRequests.validate(requestId, actor);
        return { ok: true };
    }
    async requestChanges(requestId, body, actor) {
        await this.supportRequests.requestChanges(requestId, body.message, actor);
        return { ok: true };
    }
    async calculatePrice(requestId, body, actor) {
        return this.supportRequests.calculatePrice(requestId, body, actor);
    }
    async overridePrice(requestId, body, actor) {
        return this.supportRequests.overridePrice(requestId, body, actor);
    }
    async approvePrice(requestId, actor) {
        return this.supportRequests.approvePrice(requestId, actor);
    }
    async createQuoteVersion(requestId, body, actor) {
        return this.supportRequests.createQuoteVersion(requestId, body, actor);
    }
    async sendToApproval(requestId, actor) {
        await this.supportRequests.sendToApproval(requestId, actor);
        return { ok: true };
    }
    async internalApprove(requestId, actor) {
        await this.supportRequests.internalApprove(requestId, actor);
        return { ok: true };
    }
    async verifyResult(requestId, body, actor) {
        await this.supportRequests.verifyResult(requestId, body, actor);
        return { ok: true };
    }
    async raiseDispute(requestId, body, actor) {
        await this.supportRequests.raiseDispute(requestId, body.message, actor);
        return { ok: true };
    }
    async resolveDispute(requestId, body, actor) {
        await this.supportRequests.resolveDispute(requestId, body, actor);
        return { ok: true };
    }
    async schedule(requestId, body, actor) {
        return this.supportRequests.schedulePromotion(requestId, body, actor);
    }
    async reschedule(requestId, body, actor) {
        return this.supportRequests.reschedulePromotion(requestId, body, actor);
    }
    async recordExecutionResult(requestId, body, actor) {
        return this.supportRequests.recordExecutionResult(requestId, body, actor);
    }
};
exports.SupportRequestOpsController = SupportRequestOpsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":requestId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ),
    __param(0, (0, common_1.Param)("requestId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":requestId/advance"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "advance", null);
__decorate([
    (0, common_1.Post)(":requestId/validate"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)(":requestId/request-changes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.requestChangesSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "requestChanges", null);
__decorate([
    (0, common_1.Post)(":requestId/price/calculate"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_PRICE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.calculatePriceSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "calculatePrice", null);
__decorate([
    (0, common_1.Post)(":requestId/price/override"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_PRICE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.overridePriceSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "overridePrice", null);
__decorate([
    (0, common_1.Post)(":requestId/price/approve"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_APPROVE),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "approvePrice", null);
__decorate([
    (0, common_1.Post)(":requestId/quotes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_QUOTE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createQuoteVersionSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "createQuoteVersion", null);
__decorate([
    (0, common_1.Post)(":requestId/send-to-approval"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "sendToApproval", null);
__decorate([
    (0, common_1.Post)(":requestId/internal-approve"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_APPROVE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "internalApprove", null);
__decorate([
    (0, common_1.Post)(":requestId/verify-result"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.verifyResultSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "verifyResult", null);
__decorate([
    (0, common_1.Post)(":requestId/dispute"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.requestChangesSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.Post)(":requestId/resolve-dispute"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_APPROVE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.resolveDisputeSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Post)(":requestId/schedule"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.scheduleSupportRequestSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)(":requestId/reschedule"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.rescheduleSupportRequestSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Post)(":requestId/execution-result"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_VALIDATE),
    __param(0, (0, common_1.Param)("requestId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.recordExecutionResultSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestOpsController.prototype, "recordExecutionResult", null);
exports.SupportRequestOpsController = SupportRequestOpsController = __decorate([
    (0, common_1.Controller)("support-requests"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard, step_up_guard_1.StepUpGuard),
    __metadata("design:paramtypes", [support_requests_service_1.SupportRequestsService])
], SupportRequestOpsController);
