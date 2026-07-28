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
exports.SessionAuthGuard = exports.CSRF_HEADER = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = new Set(["/api/v1/auth/logout"]);
exports.CSRF_HEADER = "x-csrf-token";
/**
 * Hand-rolled (no passport) — reads the session cookie, resolves the
 * DB-backed AuthSession, and attaches `req.actor`. Also enforces the CSRF
 * token on state-changing requests: defense-in-depth on top of the
 * SameSite=Lax cookie (which already blocks cross-site POSTs, but not a
 * same-site XSS forging a request).
 */
let SessionAuthGuard = class SessionAuthGuard {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = req.cookies?.[this.config.env.SESSION_COOKIE_NAME];
        if (!token) {
            throw new common_1.UnauthorizedException("Session required");
        }
        const session = await this.prisma.authSession.findUnique({
            where: { tokenHash: (0, auth_1.hashSessionToken)(token) },
        });
        if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException("Session expired or revoked");
        }
        if (!SAFE_METHODS.has(req.method) && !CSRF_EXEMPT_PATHS.has(req.path)) {
            const csrfHeader = req.header(exports.CSRF_HEADER);
            if (!csrfHeader || csrfHeader !== session.csrfToken) {
                throw new common_1.UnauthorizedException("Missing or invalid CSRF token");
            }
        }
        const assignments = await this.prisma.roleAssignment.findMany({
            where: { userId: session.userId },
            include: { role: true },
        });
        req.actor = {
            userId: session.userId,
            sessionId: session.id,
            csrfToken: session.csrfToken,
            stepUpVerifiedAt: session.stepUpVerifiedAt,
            roleAssignments: assignments.map((assignment) => ({
                role: assignment.role.key,
                resourceType: assignment.resourceType ?? undefined,
                resourceId: assignment.resourceId ?? undefined,
            })),
        };
        void this.prisma.authSession.update({
            where: { id: session.id },
            data: { lastSeenAt: new Date() },
        });
        return true;
    }
};
exports.SessionAuthGuard = SessionAuthGuard;
exports.SessionAuthGuard = SessionAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService])
], SessionAuthGuard);
