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
exports.StepUpService = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const session_service_1 = require("../session/session.service");
/**
 * Re-authentication for sensitive actions (spec 8.2's "step-up authentication
 * for sensitive financial actions"). Built now as foundation; no endpoint
 * requires it yet since Phase 1 has no financial actions — Phase 3/5 apply
 * `@RequireStepUp()` where it matters.
 */
let StepUpService = class StepUpService {
    prisma;
    config;
    sessions;
    constructor(prisma, config, sessions) {
        this.prisma = prisma;
        this.config = config;
        this.sessions = sessions;
    }
    async verify(userId, sessionId, input) {
        if (input.password) {
            const credential = await this.prisma.adminCredential.findUnique({ where: { userId } });
            if (credential && (await (0, auth_1.verifyPassword)(credential.passwordHash, input.password))) {
                await this.sessions.markStepUpVerified(sessionId);
                return;
            }
        }
        if (input.code) {
            const method = await this.prisma.mfaMethod.findFirst({ where: { userId, verifiedAt: { not: null } } });
            if (method) {
                const secret = (0, auth_1.decryptSecret)(method.secretEncrypted, (0, auth_1.deriveKey)(this.config.env.SESSION_SECRET, "mfa-secret"));
                if ((0, auth_1.verifyTotpCode)(secret, input.code)) {
                    await this.sessions.markStepUpVerified(sessionId);
                    return;
                }
            }
        }
        throw new common_1.UnauthorizedException("تأیید هویت مجدد ناموفق بود.");
    }
};
exports.StepUpService = StepUpService;
exports.StepUpService = StepUpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        session_service_1.SessionService])
], StepUpService);
