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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    async listDatasets() {
        return this.reports.listDatasets();
    }
    async createDefinition(body, actor) {
        return this.reports.createDefinition(body, actor);
    }
    async listDefinitions(actor) {
        return this.reports.listDefinitions(actor);
    }
    async run(body, actor) {
        return this.reports.runReport(body, actor);
    }
    async listRuns(actor) {
        return this.reports.listRuns(actor);
    }
    async getRun(runId) {
        return this.reports.getRun(runId);
    }
    async exportRun(runId, body, actor) {
        return this.reports.exportRun(runId, body, actor);
    }
    async getSnapshot(snapshotId) {
        return this.reports.getSnapshot(snapshotId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)("datasets"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "listDatasets", null);
__decorate([
    (0, common_1.Post)("definitions"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createReportDefinitionSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "createDefinition", null);
__decorate([
    (0, common_1.Get)("definitions"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_READ),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "listDefinitions", null);
__decorate([
    (0, common_1.Post)("runs"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_READ),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.runReportSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "run", null);
__decorate([
    (0, common_1.Get)("runs"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_READ),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "listRuns", null);
__decorate([
    (0, common_1.Get)("runs/:runId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_READ),
    __param(0, (0, common_1.Param)("runId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getRun", null);
__decorate([
    (0, common_1.Post)("runs/:runId/export"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_EXPORT),
    __param(0, (0, common_1.Param)("runId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.exportReportRunSchema))),
    __param(2, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportRun", null);
__decorate([
    (0, common_1.Get)("snapshots/:snapshotId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.REPORT_EXPORT),
    __param(0, (0, common_1.Param)("snapshotId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSnapshot", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)("reports"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
