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
exports.EvaluationController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const evaluation_service_1 = require("./evaluation.service");
let EvaluationController = class EvaluationController {
    evaluation;
    constructor(evaluation) {
        this.evaluation = evaluation;
    }
    async list(status, channelId) {
        const parsed = status ? contracts_1.evaluationCaseStatusSchema.parse(status) : undefined;
        return this.evaluation.listQueue(parsed, channelId);
    }
    async getOne(caseId) {
        return this.evaluation.getCaseDetail(caseId);
    }
    async assign(caseId, body, actor) {
        await this.evaluation.assign(caseId, body, actor.userId);
        return { ok: true };
    }
    async advance(caseId, actor) {
        await this.evaluation.advance(caseId, actor.userId);
        return { ok: true };
    }
    async requestCorrection(caseId, body, actor) {
        await this.evaluation.requestCorrection(caseId, body, actor.userId);
        return { ok: true };
    }
    async score(caseId, body, actor) {
        await this.evaluation.score(caseId, body, actor.userId);
        return { ok: true };
    }
    async decide(caseId, body, actor) {
        await this.evaluation.decide(caseId, body, actor.userId);
        return { ok: true };
    }
    async addNote(caseId, body, actor) {
        await this.evaluation.addNote(caseId, body.body, actor.userId);
        return { ok: true };
    }
};
exports.EvaluationController = EvaluationController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_READ),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":caseId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_READ),
    __param(0, (0, common_1.Param)("caseId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":caseId/assign"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_ASSIGN),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.assignEvaluatorSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(":caseId/advance"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_ASSIGN),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "advance", null);
__decorate([
    (0, common_1.Post)(":caseId/request-correction"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_SCORE),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.requestCorrectionSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "requestCorrection", null);
__decorate([
    (0, common_1.Post)(":caseId/score"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_SCORE),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.submitScoreSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "score", null);
__decorate([
    (0, common_1.Post)(":caseId/decide"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_DECIDE),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.decideCaseSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(":caseId/notes"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_NOTE),
    __param(0, (0, common_1.Param)("caseId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createNoteSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "addNote", null);
exports.EvaluationController = EvaluationController = __decorate([
    (0, common_1.Controller)("evaluation/cases"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], EvaluationController);
