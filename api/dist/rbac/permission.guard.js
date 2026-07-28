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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_service_1 = require("./permissions.service");
const require_permission_decorator_1 = require("./require-permission.decorator");
/** Must run after SessionAuthGuard (needs req.actor already populated). */
let PermissionGuard = class PermissionGuard {
    reflector;
    permissions;
    constructor(reflector, permissions) {
        this.reflector = reflector;
        this.permissions = permissions;
    }
    async canActivate(context) {
        // Method-level metadata wins; falls back to class-level so a controller
        // can apply @RequirePermission() once for every route it defines.
        const metadata = this.reflector.getAllAndOverride(require_permission_decorator_1.REQUIRE_PERMISSION_METADATA, [context.getHandler(), context.getClass()]);
        if (!metadata)
            return true;
        const req = context.switchToHttp().getRequest();
        if (!req.actor) {
            throw new common_1.UnauthorizedException("Session required");
        }
        const rawResourceId = metadata.resourceIdParam ? req.params[metadata.resourceIdParam] : undefined;
        const resourceId = Array.isArray(rawResourceId) ? rawResourceId[0] : rawResourceId;
        const allowed = await this.permissions.hasPermission(req.actor.roleAssignments, {
            permission: metadata.permission,
            resourceType: metadata.resourceType,
            resourceId,
        });
        if (!allowed) {
            throw new common_1.ForbiddenException("دسترسی لازم برای انجام این عملیات را ندارید.");
        }
        return true;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permissions_service_1.PermissionsService])
], PermissionGuard);
