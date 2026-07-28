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
exports.AssessmentController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const evaluation_service_1 = require("./evaluation.service");
/** Partner-facing simplified status + public timeline — never the internal 10-status workflow or internal notes. */
let AssessmentController = class AssessmentController {
    evaluation;
    constructor(evaluation) {
        this.evaluation = evaluation;
    }
    async getAssessment(channelId) {
        return this.evaluation.getPartnerAssessment(channelId);
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_SUBMISSION_READ, { resourceType: "channel", resourceIdParam: "channelId" }),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getAssessment", null);
exports.AssessmentController = AssessmentController = __decorate([
    (0, common_1.Controller)("channels/:channelId/assessment"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService])
], AssessmentController);
