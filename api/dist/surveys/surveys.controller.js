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
exports.SurveysPartnerController = exports.SurveysController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const surveys_service_1 = require("./surveys.service");
/** Admin authoring/distribution of surveys — the actual pages/sections/fields still get built via the generic /forms admin UI. */
let SurveysController = class SurveysController {
    surveys;
    constructor(surveys) {
        this.surveys = surveys;
    }
    async create(body, actor) {
        return this.surveys.create(body, actor);
    }
    async list() {
        return this.surveys.list();
    }
    async transition(surveyId, body, actor) {
        return this.surveys.transition(surveyId, body.status, actor);
    }
    async analytics(surveyId) {
        return this.surveys.getAnalytics(surveyId);
    }
};
exports.SurveysController = SurveysController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createSurveySchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":surveyId/transition"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_MANAGE),
    __param(0, (0, common_1.Param)("surveyId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.transitionSurveySchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "transition", null);
__decorate([
    (0, common_1.Get)(":surveyId/analytics"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_MANAGE),
    __param(0, (0, common_1.Param)("surveyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "analytics", null);
exports.SurveysController = SurveysController = __decorate([
    (0, common_1.Controller)("surveys"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService])
], SurveysController);
/** Partner-facing — list surveys open to my channel, and start/resume a response (the response itself is then answered through the generic form-submissions endpoints). */
let SurveysPartnerController = class SurveysPartnerController {
    surveys;
    constructor(surveys) {
        this.surveys = surveys;
    }
    async list(channelId) {
        return this.surveys.listForChannel(channelId);
    }
    async start(channelId, surveyId, actor) {
        return this.surveys.startOrResume(surveyId, channelId, actor);
    }
};
exports.SurveysPartnerController = SurveysPartnerController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurveysPartnerController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":surveyId/start"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SURVEY_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("surveyId")),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SurveysPartnerController.prototype, "start", null);
exports.SurveysPartnerController = SurveysPartnerController = __decorate([
    (0, common_1.Controller)("channels/:channelId/surveys"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService])
], SurveysPartnerController);
