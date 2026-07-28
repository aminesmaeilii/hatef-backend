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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@hatef/auth");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const app_config_service_1 = require("../config/app-config.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const sms_provider_interface_1 = require("../sms/sms-provider.interface");
const MOBILE_REQUEST_WINDOW_SECONDS = 3600;
const MOBILE_REQUEST_MAX = 10;
const IP_REQUEST_MAX = 30;
let OtpService = class OtpService {
    prisma;
    redis;
    config;
    auditLog;
    sms;
    constructor(prisma, redis, config, auditLog, sms) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.auditLog = auditLog;
        this.sms = sms;
    }
    async requestOtp(rawMobile, ip) {
        const mobile = (0, domain_1.normalizeIranianMobile)(rawMobile);
        const { OTP_RESEND_COOLDOWN_SECONDS, OTP_EXPIRY_SECONDS, OTP_MAX_ATTEMPTS, OTP_HASH_PEPPER, NODE_ENV } = this.config.env;
        const cooldownKey = `otp:cooldown:${mobile}`;
        const remainingCooldown = await this.redis.client.ttl(cooldownKey);
        if (remainingCooldown > 0) {
            // Same response shape whether cooldown is active or not — never leaks
            // whether an OTP was actually (re)issued.
            return { resendAvailableInSeconds: remainingCooldown };
        }
        await this.assertRateLimit(`otp:count:mobile:${mobile}`, MOBILE_REQUEST_MAX, MOBILE_REQUEST_WINDOW_SECONDS);
        if (ip) {
            await this.assertRateLimit(`otp:count:ip:${ip}`, IP_REQUEST_MAX, MOBILE_REQUEST_WINDOW_SECONDS);
        }
        const code = (0, auth_1.generateOtpCode)();
        const codeHash = (0, auth_1.hashOtpCode)(code, OTP_HASH_PEPPER);
        const now = Date.now();
        await this.prisma.otpChallenge.create({
            data: {
                mobile,
                codeHash,
                maxAttempts: OTP_MAX_ATTEMPTS,
                expiresAt: new Date(now + OTP_EXPIRY_SECONDS * 1000),
                resendAvailableAt: new Date(now + OTP_RESEND_COOLDOWN_SECONDS * 1000),
                requestIp: ip,
            },
        });
        await this.redis.client.set(cooldownKey, "1", "EX", OTP_RESEND_COOLDOWN_SECONDS);
        await this.sms.send({
            mobile,
            templateId: this.config.env.SMS_TEMPLATE_OTP_ID || "otp-login",
            params: { code },
        });
        await this.auditLog.record({
            actorType: "system",
            action: "otp.requested",
            entityType: "user_contact",
            metadata: { mobile: (0, domain_1.maskMobile)(mobile) },
            ipAddress: ip,
        });
        return {
            resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
            devCode: NODE_ENV === "production" ? undefined : code,
        };
    }
    async verifyOtp(rawMobile, code, ip) {
        const mobile = (0, domain_1.normalizeIranianMobile)(rawMobile);
        const genericError = () => new common_1.UnauthorizedException("کد وارد شده صحیح نیست یا منقضی شده است.");
        const challenge = await this.prisma.otpChallenge.findFirst({
            where: { mobile, consumedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
        });
        if (!challenge || challenge.attempts >= challenge.maxAttempts) {
            await this.auditLog.record({
                actorType: "system",
                action: "otp.verify_failed",
                entityType: "user_contact",
                metadata: { mobile: (0, domain_1.maskMobile)(mobile), reason: challenge ? "attempts_exhausted" : "no_active_challenge" },
                ipAddress: ip,
            });
            throw genericError();
        }
        const valid = (0, auth_1.verifyOtpCode)(code, this.config.env.OTP_HASH_PEPPER, challenge.codeHash);
        if (!valid) {
            await this.prisma.otpChallenge.update({
                where: { id: challenge.id },
                data: { attempts: { increment: 1 } },
            });
            await this.auditLog.record({
                actorType: "system",
                action: "otp.verify_failed",
                entityType: "user_contact",
                metadata: { mobile: (0, domain_1.maskMobile)(mobile), reason: "wrong_code" },
                ipAddress: ip,
            });
            throw genericError();
        }
        await this.prisma.otpChallenge.update({
            where: { id: challenge.id },
            data: { consumedAt: new Date() },
        });
        const contact = await this.prisma.userContact.findUnique({
            where: { type_value: { type: "MOBILE", value: mobile } },
        });
        const userId = contact
            ? contact.userId
            : (await this.prisma.user.create({
                data: {
                    displayName: mobile,
                    contacts: { create: { type: "MOBILE", value: mobile, verifiedAt: new Date(), isPrimary: true } },
                },
            })).id;
        await this.auditLog.record({
            actorId: userId,
            actorType: "user",
            action: "otp.verified",
            entityType: "user",
            entityId: userId,
            ipAddress: ip,
        });
        return { userId };
    }
    async assertRateLimit(key, max, windowSeconds) {
        const count = await this.redis.client.incr(key);
        if (count === 1) {
            await this.redis.client.expire(key, windowSeconds);
        }
        if (count > max) {
            throw new common_1.HttpException("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(sms_provider_interface_1.SMS_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        app_config_service_1.AppConfigService,
        audit_log_service_1.AuditLogService, Object])
], OtpService);
