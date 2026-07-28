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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const session_auth_guard_1 = require("../session/session-auth.guard");
const session_service_1 = require("../session/session.service");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const workspace_service_1 = require("./workspace.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionController = class SessionController {
    sessions;
    workspace;
    prisma;
    constructor(sessions, workspace, prisma) {
        this.sessions = sessions;
        this.workspace = workspace;
        this.prisma = prisma;
    }
    async meContexts(actor) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
        const contexts = await this.workspace.getContexts(actor.userId);
        return { user: { id: user.id, displayName: user.displayName, email: user.email }, contexts };
    }
    async listSessions(actor) {
        const sessions = await this.sessions.listSessions(actor.userId);
        return sessions.map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            createdAt: session.createdAt.toISOString(),
            lastSeenAt: session.lastSeenAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            current: session.id === actor.sessionId,
        }));
    }
    async revokeSession(actor, id) {
        await this.sessions.revokeSession(id, actor.userId);
        return { ok: true };
    }
    async logout(actor, res) {
        await this.sessions.revokeSession(actor.sessionId, actor.userId);
        this.sessions.clearSessionCookie(res);
        return { ok: true };
    }
    async logoutAll(actor, res) {
        await this.sessions.revokeAllSessions(actor.userId);
        this.sessions.clearSessionCookie(res);
        return { ok: true };
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)("me/contexts"),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "meContexts", null);
__decorate([
    (0, common_1.Get)("sessions"),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)("sessions/:id"),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)("logout-all"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "logoutAll", null);
exports.SessionController = SessionController = __decorate([
    (0, common_1.Controller)("auth"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        workspace_service_1.WorkspaceService,
        prisma_service_1.PrismaService])
], SessionController);
