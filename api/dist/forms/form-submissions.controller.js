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
exports.FormSubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const form_submissions_service_1 = require("./form-submissions.service");
const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" };
let FormSubmissionsController = class FormSubmissionsController {
    formSubmissions;
    constructor(formSubmissions) {
        this.formSubmissions = formSubmissions;
    }
    async getOne(channelId, submissionId) {
        return this.formSubmissions.getSubmission(channelId, submissionId);
    }
    async getRevisions(channelId, submissionId) {
        return this.formSubmissions.getRevisions(channelId, submissionId);
    }
    async patchAnswers(channelId, submissionId, body) {
        await this.formSubmissions.patchAnswers(channelId, submissionId, body.answers);
        return { ok: true };
    }
    async submit(channelId, submissionId, body, actor, req) {
        await this.formSubmissions.submit(channelId, submissionId, body.acceptedConsentDocumentIds, actor, req.ip);
        return { ok: true };
    }
};
exports.FormSubmissionsController = FormSubmissionsController;
__decorate([
    (0, common_1.Get)(":submissionId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_SUBMISSION_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("submissionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FormSubmissionsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(":submissionId/revisions"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_SUBMISSION_READ, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("submissionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FormSubmissionsController.prototype, "getRevisions", null);
__decorate([
    (0, common_1.Patch)(":submissionId/answers"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_SUBMISSION_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("submissionId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.patchAnswersSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FormSubmissionsController.prototype, "patchAnswers", null);
__decorate([
    (0, common_1.Post)(":submissionId/submit"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_SUBMISSION_MANAGE, CHANNEL_SCOPE),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("submissionId")),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.submitFormSubmissionSchema))),
    __param(3, (0, current_actor_decorator_1.CurrentActor)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FormSubmissionsController.prototype, "submit", null);
exports.FormSubmissionsController = FormSubmissionsController = __decorate([
    (0, common_1.Controller)("channels/:channelId/form-submissions"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [form_submissions_service_1.FormSubmissionsService])
], FormSubmissionsController);
