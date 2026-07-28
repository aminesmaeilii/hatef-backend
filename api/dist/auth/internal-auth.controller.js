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
exports.InternalAuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const contracts_1 = require("@hatef/contracts");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const session_service_1 = require("../session/session.service");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const internal_auth_service_1 = require("./internal-auth.service");
const step_up_service_1 = require("./step-up.service");
let InternalAuthController = class InternalAuthController {
    internalAuth;
    sessions;
    stepUpService;
    constructor(internalAuth, sessions, stepUpService) {
        this.internalAuth = internalAuth;
        this.sessions = sessions;
        this.stepUpService = stepUpService;
    }
    // Tighter than the global default — email/password login is a classic
    // credential-stuffing target and has no other rate limit (unlike the
    // partner OTP flow, which is already Redis-limited in OtpService).
    async login(body, req, res) {
        const result = await this.internalAuth.login(body.mobile, body.password, req.ip);
        if (result.status === "mfa_required") {
            return { status: "mfa_required", mfaToken: result.mfaToken };
        }
        const session = await this.sessions.issueSession(result.userId, req, res);
        return { status: "ok", ...session };
    }
    async verifyMfa(body, req, res) {
        const { userId } = await this.internalAuth.verifyMfa(body.mfaToken, body.code, req.ip);
        return this.sessions.issueSession(userId, req, res);
    }
    async enrollMfa(actor) {
        return this.internalAuth.enrollMfa(actor.userId);
    }
    async confirmMfaEnrollment(actor, body) {
        const recoveryCodes = await this.internalAuth.confirmMfaEnrollment(actor.userId, body.code);
        return { recoveryCodes };
    }
    async stepUp(actor, body) {
        await this.stepUpService.verify(actor.userId, actor.sessionId, body);
        return { ok: true };
    }
};
exports.InternalAuthController = InternalAuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.internalLoginSchema))),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], InternalAuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)("mfa/verify"),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.mfaVerifySchema))),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], InternalAuthController.prototype, "verifyMfa", null);
__decorate([
    (0, common_1.Post)("mfa/enroll"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InternalAuthController.prototype, "enrollMfa", null);
__decorate([
    (0, common_1.Post)("mfa/enroll/confirm"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.mfaEnrollConfirmSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InternalAuthController.prototype, "confirmMfaEnrollment", null);
__decorate([
    (0, common_1.Post)("step-up"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.stepUpSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InternalAuthController.prototype, "stepUp", null);
exports.InternalAuthController = InternalAuthController = __decorate([
    (0, common_1.Controller)("auth/internal"),
    __metadata("design:paramtypes", [internal_auth_service_1.InternalAuthService,
        session_service_1.SessionService,
        step_up_service_1.StepUpService])
], InternalAuthController);
