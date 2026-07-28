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
exports.ServiceCatalogController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const service_catalog_service_1 = require("./service-catalog.service");
let ServiceCatalogController = class ServiceCatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    async create(body, actor) {
        return this.catalog.create(body, actor);
    }
    async list() {
        return this.catalog.list();
    }
    async getOne(itemId) {
        return this.catalog.getOne(itemId);
    }
    async addVersion(itemId, body) {
        return this.catalog.addVersion(itemId, body);
    }
};
exports.ServiceCatalogController = ServiceCatalogController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SERVICE_CATALOG_MANAGE),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createServiceCatalogItemSchema))),
    __param(1, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceCatalogController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServiceCatalogController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":itemId"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.OBLIGATION_READ),
    __param(0, (0, common_1.Param)("itemId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceCatalogController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":itemId/versions"),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.SERVICE_CATALOG_MANAGE),
    __param(0, (0, common_1.Param)("itemId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createServiceCatalogVersionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceCatalogController.prototype, "addVersion", null);
exports.ServiceCatalogController = ServiceCatalogController = __decorate([
    (0, common_1.Controller)("service-catalog"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService])
], ServiceCatalogController);
