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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const MATRIX_CACHE_TTL_MS = 60_000;
/**
 * Loads the Role -> Permission matrix from the database (cached briefly —
 * it changes rarely) and delegates the actual RBAC/ABAC decision to
 * backend/auth's framework-free PermissionChecker.
 */
let PermissionsService = class PermissionsService {
    prisma;
    cachedMatrix = null;
    cachedAt = 0;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async hasPermission(assignments, check) {
        const matrix = await this.getMatrix();
        return new auth_1.PermissionChecker(matrix).hasPermission(assignments, check);
    }
    async invalidateCache() {
        this.cachedMatrix = null;
    }
    async getMatrix() {
        if (this.cachedMatrix && Date.now() - this.cachedAt < MATRIX_CACHE_TTL_MS) {
            return this.cachedMatrix;
        }
        const roles = await this.prisma.role.findMany({
            include: { rolePermissions: { include: { permission: true } } },
        });
        const matrix = {};
        for (const role of roles) {
            matrix[role.key] = role.rolePermissions.map((rp) => rp.permission.key);
        }
        this.cachedMatrix = matrix;
        this.cachedAt = Date.now();
        return matrix;
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsService);
