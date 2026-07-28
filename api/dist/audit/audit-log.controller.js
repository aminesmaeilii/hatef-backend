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
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const DEFAULT_LIMIT = 20;
let AuditLogController = class AuditLogController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), 100);
        const rows = await this.prisma.auditLog.findMany({
            take: limit + 1,
            where: {
                ...(query.entityType ? { entityType: query.entityType } : {}),
                ...(query.entityId ? { entityId: query.entityId } : {}),
            },
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            orderBy: { createdAt: "desc" },
        });
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        return {
            items: page.map((row) => ({
                id: row.id,
                actorId: row.actorId,
                actorType: row.actorType,
                actorLabel: row.actorLabel,
                action: row.action,
                entityType: row.entityType,
                entityId: row.entityId,
                metadata: row.metadata,
                correlationId: row.correlationId,
                createdAt: row.createdAt.toISOString(),
            })),
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
        };
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.AUDIT_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "list", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, common_1.Controller)("audit-logs"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogController);
