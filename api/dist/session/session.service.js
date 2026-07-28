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
exports.SessionService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
let SessionService = class SessionService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async createSession(input) {
        const token = (0, auth_1.generateSessionToken)();
        const csrfToken = (0, node_crypto_1.randomBytes)(24).toString("base64url");
        const now = Date.now();
        const session = await this.prisma.authSession.create({
            data: {
                userId: input.userId,
                tokenHash: (0, auth_1.hashSessionToken)(token),
                csrfToken,
                userAgent: input.userAgent,
                ipAddress: input.ipAddress,
                expiresAt: new Date(now + SESSION_TTL_MS),
                lastSeenAt: new Date(now),
            },
        });
        return { token, csrfToken, session };
    }
    /** Creates a session, sets the cookie, and shapes the login response body — shared by the partner OTP and internal login/MFA flows. */
    async issueSession(userId, req, res) {
        const { token, csrfToken } = await this.createSession({
            userId,
            userAgent: req.header("user-agent"),
            ipAddress: req.ip,
        });
        this.setSessionCookie(res, token);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return { user: { id: user.id, displayName: user.displayName, email: user.email }, csrfToken };
    }
    setSessionCookie(res, token) {
        const { SESSION_COOKIE_NAME, NODE_ENV } = this.config.env;
        res.cookie(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_TTL_MS,
            path: "/",
        });
    }
    clearSessionCookie(res) {
        res.clearCookie(this.config.env.SESSION_COOKIE_NAME, { path: "/" });
    }
    async listSessions(userId) {
        return this.prisma.authSession.findMany({
            where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { lastSeenAt: "desc" },
        });
    }
    async revokeSession(sessionId, userId) {
        await this.prisma.authSession.updateMany({
            where: { id: sessionId, userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllSessions(userId, exceptSessionId) {
        await this.prisma.authSession.updateMany({
            where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
            data: { revokedAt: new Date() },
        });
    }
    async markStepUpVerified(sessionId) {
        await this.prisma.authSession.update({
            where: { id: sessionId },
            data: { stepUpVerifiedAt: new Date() },
        });
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService])
], SessionService);
