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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
/**
 * Purely a UI convenience list — every subsequent API call is authorized
 * from the session's own role assignments, never from a "selected
 * workspace", so this never doubles as an authorization decision.
 */
let WorkspaceService = class WorkspaceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getContexts(userId) {
        const [assignments, memberships] = await Promise.all([
            this.prisma.roleAssignment.findMany({ where: { userId }, include: { role: true } }),
            this.prisma.channelMembership.findMany({
                where: { userId, status: "ACTIVE" },
                include: { channel: true },
            }),
        ]);
        const contexts = [];
        if (assignments.some((assignment) => assignment.role.scope === "INTERNAL")) {
            contexts.push({ type: "internal", label: "مدیریت هاتف" });
        }
        for (const membership of memberships) {
            contexts.push({
                type: "channel",
                label: membership.channel.title,
                channelId: membership.channelId,
                role: membership.role,
            });
        }
        return contexts;
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkspaceService);
