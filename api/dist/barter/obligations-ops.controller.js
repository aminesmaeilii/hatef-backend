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
exports.ObligationsOpsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const obligations_service_1 = require("./obligations.service");
/** Admin/internal — propose obligations, negotiate, review deliverables, resolve disputes (spec 16.3-16.5). */
let ObligationsOpsController = class ObligationsOpsController {
    obligations;
    constructor(obligations) {
        this.obligations = obligations;
    }
    async propose(body, actor) {
        return this.obligations.propose(body, actor);
    }
    async list(channelId, status) {
        return this.obligations.list({ channelId, status });
    }
    async getOne(obligationId) {
        return this.obligations.getDetail(obligationId);
    }
    async counterPropose(obligationId, body, actor) {
        return this.obligations.counterPropose(obligationId, body, actor);
    }
    async transition(obligationId, body, actor) {
        return this.obligations.transition(obligationId, body.toStatus, body.note, actor);
    }
    async listDeliverables(obligationId) {
        return this.obligations.listDeliverables(obligationId);
    }
    async reviewDeliverable(deliverableId, body, actor) {
        return this.obligations.reviewDeliverable(deliverableId, body, actor);
    }
    async raiseDispute(obligationId, body, actor) {
        return this.obligations.raiseDispute(obligationId, body, actor);
    }
    async resolveDispute(disputeId, body, actor) {
        return this.obligations.resolveDispute(disputeId, body, actor);
    }
};
exports.ObligationsOpsController = ObligationsOpsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createObligationSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "propose", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ),
    __param(0, (0, common_1.Query)("channelId")),
    __param(1, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":obligationId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ),
    __param(0, (0, common_1.Param)("obligationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":obligationId/proposals"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_NEGOTIATE),
    __param(0, (0, common_1.Param)("obligationId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createObligationProposalSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "counterPropose", null);
__decorate([
    (0, common_1.Post)(":obligationId/transition"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_MANAGE),
    __param(0, (0, common_1.Param)("obligationId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.transitionObligationSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "transition", null);
__decorate([
    (0, common_1.Get)(":obligationId/deliverables"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ),
    __param(0, (0, common_1.Param)("obligationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "listDeliverables", null);
__decorate([
    (0, common_1.Post)("deliverables/:deliverableId/review"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.DELIVERABLE_REVIEW),
    __param(0, (0, common_1.Param)("deliverableId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reviewDeliverableSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "reviewDeliverable", null);
__decorate([
    (0, common_1.Post)(":obligationId/disputes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.DISPUTE_MANAGE),
    __param(0, (0, common_1.Param)("obligationId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.raiseDisputeSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.Post)("disputes/:disputeId/resolve"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.DISPUTE_MANAGE),
    __param(0, (0, common_1.Param)("disputeId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.resolveObligationDisputeSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ObligationsOpsController.prototype, "resolveDispute", null);
exports.ObligationsOpsController = ObligationsOpsController = __decorate([
    (0, common_1.Controller)("obligations"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [obligations_service_1.ObligationsService])
], ObligationsOpsController);
