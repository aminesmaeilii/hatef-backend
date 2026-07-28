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
exports.NotificationTemplatesController = exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const notifications_service_1 = require("./notifications.service");
/** Self-only — every route reads/writes strictly the caller's own inbox/preferences, enforced by filtering on `actor.userId`, never by ABAC resource scoping (same "own data" shape as SESSION_READ_OWN). */
let NotificationsController = class NotificationsController {
    notifications;
    constructor(notifications) {
        this.notifications = notifications;
    }
    async list(actor, unreadOnly) {
        return this.notifications.listForUser(actor.userId, unreadOnly === "true");
    }
    async markRead(notificationId, actor) {
        await this.notifications.markRead(notificationId, actor.userId);
        return { ok: true };
    }
    async markAllRead(actor) {
        await this.notifications.markAllRead(actor.userId);
        return { ok: true };
    }
    async setPreference(body, actor) {
        await this.notifications.setPreference(actor.userId, body);
        return { ok: true };
    }
    async getQuietHours(actor) {
        return this.notifications.getQuietHours(actor.userId);
    }
    async setQuietHours(body, actor) {
        await this.notifications.setQuietHours(actor.userId, body);
        return { ok: true };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Query)("unreadOnly")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":notificationId/read"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, common_1.Param)("notificationId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Post)("read-all"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Patch)("preferences"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.setNotificationPreferenceSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "setPreference", null);
__decorate([
    (0, common_1.Get)("quiet-hours"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getQuietHours", null);
__decorate([
    (0, common_1.Patch)("quiet-hours"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_READ_OWN),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.notificationQuietHoursSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "setQuietHours", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)("notifications"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
/** Admin-only template authoring. */
let NotificationTemplatesController = class NotificationTemplatesController {
    notifications;
    constructor(notifications) {
        this.notifications = notifications;
    }
    async list() {
        return this.notifications.listTemplates();
    }
    async create(body) {
        return this.notifications.createTemplate(body);
    }
};
exports.NotificationTemplatesController = NotificationTemplatesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationTemplatesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createNotificationTemplateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationTemplatesController.prototype, "create", null);
exports.NotificationTemplatesController = NotificationTemplatesController = __decorate([
    (0, common_1.Controller)("notification-templates"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationTemplatesController);
