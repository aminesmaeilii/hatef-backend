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
exports.RubricsController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const rubrics_service_1 = require("./rubrics.service");
const createRubricSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    criteria: zod_1.z.array(contracts_1.rubricCriterionSchema).min(1),
});
let RubricsController = class RubricsController {
    rubrics;
    constructor(rubrics) {
        this.rubrics = rubrics;
    }
    async list() {
        return this.rubrics.listPublished();
    }
    async create(body) {
        return this.rubrics.create(body);
    }
    async publish(rubricId) {
        return this.rubrics.publish(rubricId);
    }
};
exports.RubricsController = RubricsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RubricsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_DECIDE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(createRubricSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RubricsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(":rubricId/publish"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.EVALUATION_DECIDE),
    __param(0, (0, common_1.Param)("rubricId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RubricsController.prototype, "publish", null);
exports.RubricsController = RubricsController = __decorate([
    (0, common_1.Controller)("rubrics"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [rubrics_service_1.RubricsService])
], RubricsController);
