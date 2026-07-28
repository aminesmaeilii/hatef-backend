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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const calendar_service_1 = require("./calendar.service");
function parseDateRange(from, to) {
    if (!from || !to) {
        throw new common_1.BadRequestException("بازه زمانی (from و to) الزامی است.");
    }
    return { from: new Date(from), to: new Date(to) };
}
let CalendarController = class CalendarController {
    calendar;
    constructor(calendar) {
        this.calendar = calendar;
    }
    async getFeed(from, to, channelId) {
        const range = parseDateRange(from, to);
        return this.calendar.getFeed(range.from, range.to, channelId);
    }
    async listDateNotes(from, to, channelId) {
        const range = parseDateRange(from, to);
        return this.calendar.listDateNotes(range.from, range.to, channelId);
    }
    async createDateNote(body, actor) {
        return this.calendar.createDateNote(body, actor);
    }
    async deleteDateNote(id) {
        await this.calendar.deleteDateNote(id);
        return { ok: true };
    }
    async createEvent(body, actor) {
        return this.calendar.createEvent(body, actor);
    }
    async deleteEvent(id) {
        await this.calendar.deleteEvent(id);
        return { ok: true };
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)("feed"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_READ),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __param(2, (0, common_1.Query)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)("date-notes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_READ),
    __param(0, (0, common_1.Query)("from")),
    __param(1, (0, common_1.Query)("to")),
    __param(2, (0, common_1.Query)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listDateNotes", null);
__decorate([
    (0, common_1.Post)("date-notes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createDateNoteSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createDateNote", null);
__decorate([
    (0, common_1.Delete)("date-notes/:id"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_MANAGE),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteDateNote", null);
__decorate([
    (0, common_1.Post)("events"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createCalendarEventSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Delete)("events/:id"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.CALENDAR_MANAGE),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteEvent", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)("calendar"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
