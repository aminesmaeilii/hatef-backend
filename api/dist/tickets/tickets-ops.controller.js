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
exports.TicketsOpsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const tickets_service_1 = require("./tickets.service");
/** Admin/internal operational queue + workflow actions, including the one path allowed to write/read internal notes. */
let TicketsOpsController = class TicketsOpsController {
    tickets;
    constructor(tickets) {
        this.tickets = tickets;
    }
    async create(body, actor) {
        return this.tickets.create(body, actor);
    }
    async list(channelId, status, assigneeId) {
        const parsedStatus = status ? contracts_1.ticketStatusSchema.parse(status) : undefined;
        return this.tickets.list({ channelId, status: parsedStatus, assigneeId });
    }
    async getOne(ticketId) {
        return this.tickets.getAdminDetail(ticketId);
    }
    async addMessage(ticketId, body, actor) {
        return this.tickets.addMessage(ticketId, body, actor);
    }
    async addInternalNote(ticketId, body, actor) {
        return this.tickets.addInternalNote(ticketId, body, actor);
    }
    async assign(ticketId, body, actor) {
        return this.tickets.assign(ticketId, body.assigneeId, actor);
    }
    async transition(ticketId, body, actor) {
        return this.tickets.transition(ticketId, body.toStatus, body.note, actor);
    }
};
exports.TicketsOpsController = TicketsOpsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createTicketSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_READ),
    __param(0, (0, common_1.Query)("channelId")),
    __param(1, (0, common_1.Query)("status")),
    __param(2, (0, common_1.Query)("assigneeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":ticketId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_READ),
    __param(0, (0, common_1.Param)("ticketId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":ticketId/messages"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_MANAGE),
    __param(0, (0, common_1.Param)("ticketId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addTicketMessageSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Post)(":ticketId/internal-notes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_MANAGE),
    __param(0, (0, common_1.Param)("ticketId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.addTicketInternalNoteSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "addInternalNote", null);
__decorate([
    (0, common_1.Post)(":ticketId/assign"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_MANAGE),
    __param(0, (0, common_1.Param)("ticketId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.assignTicketSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(":ticketId/transition"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.TICKET_MANAGE),
    __param(0, (0, common_1.Param)("ticketId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.transitionTicketSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TicketsOpsController.prototype, "transition", null);
exports.TicketsOpsController = TicketsOpsController = __decorate([
    (0, common_1.Controller)("tickets"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsOpsController);
