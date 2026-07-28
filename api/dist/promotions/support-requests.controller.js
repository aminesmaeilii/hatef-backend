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
exports.SupportRequestsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const support_requests_service_1 = require("./support-requests.service");
const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" };
/** Partner-facing — channel-nested, same ABAC-scoping shape as Phase 2's FormSubmissionsController. */
let SupportRequestsController = class SupportRequestsController {
    supportRequests;
    constructor(supportRequests) {
        this.supportRequests = supportRequests;
    }
    async create(channelId, body, actor) {
        return this.supportRequests.create(channelId, body, actor);
    }
    async listMine(channelId) {
        return this.supportRequests.listMine(channelId);
    }
    async getOne(channelId, requestId) {
        return this.supportRequests.getOne(channelId, requestId);
    }
    async update(channelId, requestId, body) {
        return this.supportRequests.update(channelId, requestId, body);
    }
    async submit(channelId, requestId, actor) {
        await this.supportRequests.submit(channelId, requestId, actor);
        return { ok: true };
    }
    async getProgress(channelId, requestId) {
        return this.supportRequests.getProgress(channelId, requestId);
    }
    async getRevisions(channelId, requestId) {
        return this.supportRequests.getRevisions(channelId, requestId);
    }
    async cancelRequest(channelId, requestId, body, actor) {
        await this.supportRequests.cancelRequest(channelId, requestId, body.reason, actor);
        return { ok: true };
    }
    async respondToQuote(channelId, requestId, body, actor) {
        await this.supportRequests.respondToQuote(channelId, requestId, body, actor);
        return { ok: true };
    }
    async confirm(channelId, requestId, actor) {
        return this.supportRequests.confirm(channelId, requestId, actor);
    }
};
exports.SupportRequestsController = SupportRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createSupportRequestSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(":requestId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":requestId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.updateSupportRequestSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":requestId/submit"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(":requestId/progress"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)(":requestId/revisions"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "getRevisions", null);
__decorate([
    (0, common_1.Post)(":requestId/cancel-request"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.cancelRequestSchema))),
    __param(3, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "cancelRequest", null);
__decorate([
    (0, common_1.Post)(":requestId/respond-to-quote"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.respondToQuoteSchema))),
    __param(3, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "respondToQuote", null);
__decorate([
    (0, common_1.Post)(":requestId/confirm"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SUPPORT_REQUEST_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "confirm", null);
exports.SupportRequestsController = SupportRequestsController = __decorate([
    (0, common_1.Controller)("channels/:channelId/support-requests"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [support_requests_service_1.SupportRequestsService])
], SupportRequestsController);
