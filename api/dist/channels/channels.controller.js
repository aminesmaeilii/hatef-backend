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
exports.ChannelsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const channels_service_1 = require("./channels.service");
let ChannelsController = class ChannelsController {
    channels;
    constructor(channels) {
        this.channels = channels;
    }
    async create(body, actor) {
        return this.channels.create(body, actor);
    }
    async listAll() {
        return this.channels.listAll();
    }
    async getOne(channelId) {
        return this.channels.getOne(channelId);
    }
    async listMemberships(channelId) {
        return this.channels.listMemberships(channelId);
    }
    async addMembership(channelId, body, actor) {
        return this.channels.addMembership(channelId, body, actor);
    }
};
exports.ChannelsController = ChannelsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CHANNEL_CREATE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createChannelSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CHANNEL_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)(":channelId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CHANNEL_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(":channelId/memberships"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CHANNEL_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "listMemberships", null);
__decorate([
    (0, common_1.Post)(":channelId/memberships"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CHANNEL_MEMBERSHIP_MANAGE, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addMembershipSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChannelsController.prototype, "addMembership", null);
exports.ChannelsController = ChannelsController = __decorate([
    (0, common_1.Controller)("channels"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [channels_service_1.ChannelsService])
], ChannelsController);
