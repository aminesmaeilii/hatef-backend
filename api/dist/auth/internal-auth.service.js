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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalAuthService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const qrcode_1 = __importDefault(require("qrcode"));
const auth_1 = require("@hatef/auth");
const domain_1 = require("@hatef/domain");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const app_config_service_1 = require("../config/app-config.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MFA_PENDING_TTL_SECONDS = 300;
// Precomputed once (not per-request) and reused so a login attempt against a
// non-existent email costs roughly the same as one against a real account —
// part of keeping login responses enumeration-safe.
const DUMMY_HASH_PROMISE = (0, auth_1.hashPassword)("dummy-enumeration-safe-check-value");
let InternalAuthService = class InternalAuthService {
    prisma;
    redis;
    config;
    auditLog;
    constructor(prisma, redis, config, auditLog) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.auditLog = auditLog;
    }
    async login(rawMobile, password, ip) {
        const genericError = () => new common_1.UnauthorizedException("ایمیل یا رمز عبور نادرست است.");
        const mobile = (0, domain_1.normalizeIranianMobile)(rawMobile);
        const contact = await this.prisma.userContact.findUnique({
            where: { type_value: { type: "MOBILE", value: mobile } },
        });
        const user = contact
            ? await this.prisma.user.findUnique({
                where: { id: contact.userId },
                include: { adminCredential: true, mfaMethods: true },
            })
            : null;
        if (!user || !user.adminCredential) {
            await (0, auth_1.verifyPassword)(await DUMMY_HASH_PROMISE, password);
            throw genericError();
        }
        if (user.adminCredential.lockedUntil && user.adminCredential.lockedUntil.getTime() > Date.now()) {
            throw new common_1.UnauthorizedException("حساب کاربری به‌طور موقت قفل شده است. کمی بعد دوباره تلاش کنید.");
        }
        const validPassword = await (0, auth_1.verifyPassword)(user.adminCredential.passwordHash, password);
        if (!validPassword) {
            const attempts = user.adminCredential.failedAttempts + 1;
            await this.prisma.adminCredential.update({
                where: { userId: user.id },
                data: {
                    failedAttempts: attempts,
                    lockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
                },
            });
            await this.auditLog.record({
                actorId: user.id,
                actorType: "user",
                action: "internal_login.failed",
                entityType: "user",
                entityId: user.id,
                ipAddress: ip,
            });
            throw genericError();
        }
        await this.prisma.adminCredential.update({
            where: { userId: user.id },
            data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        const verifiedMfa = user.mfaMethods.find((method) => method.verifiedAt);
        if (verifiedMfa && !this.config.env.FEATURE_SKIP_ADMIN_MFA_IN_DEV) {
            const mfaToken = (0, node_crypto_1.randomBytes)(24).toString("base64url");
            await this.redis.client.set(`mfa:pending:${mfaToken}`, user.id, "EX", MFA_PENDING_TTL_SECONDS);
            await this.auditLog.record({
                actorId: user.id,
                actorType: "user",
                action: "internal_login.password_ok_mfa_required",
                entityType: "user",
                entityId: user.id,
                ipAddress: ip,
            });
            return { status: "mfa_required", mfaToken };
        }
        await this.auditLog.record({
            actorId: user.id,
            actorType: "user",
            action: "internal_login.success",
            entityType: "user",
            entityId: user.id,
            ipAddress: ip,
        });
        return { status: "ok", userId: user.id };
    }
    async verifyMfa(mfaToken, code, ip) {
        const userId = await this.redis.client.get(`mfa:pending:${mfaToken}`);
        if (!userId) {
            throw new common_1.UnauthorizedException("درخواست ورود منقضی شده است. دوباره تلاش کنید.");
        }
        const method = await this.prisma.mfaMethod.findFirst({
            where: { userId, verifiedAt: { not: null } },
            orderBy: { createdAt: "desc" },
        });
        const invalidCodeError = () => new common_1.UnauthorizedException("کد تأیید نامعتبر است.");
        if (!method)
            throw invalidCodeError();
        const key = this.mfaEncryptionKey();
        const secret = (0, auth_1.decryptSecret)(method.secretEncrypted, key);
        let ok = (0, auth_1.verifyTotpCode)(secret, code);
        if (!ok) {
            const recoveryCodes = await this.prisma.mfaRecoveryCode.findMany({ where: { userId, usedAt: null } });
            const match = recoveryCodes.find((rc) => (0, auth_1.verifyRecoveryCode)(code, this.config.env.OTP_HASH_PEPPER, rc.codeHash));
            if (match) {
                await this.prisma.mfaRecoveryCode.update({ where: { id: match.id }, data: { usedAt: new Date() } });
                ok = true;
            }
        }
        if (!ok) {
            await this.auditLog.record({
                actorId: userId,
                actorType: "user",
                action: "internal_login.mfa_failed",
                entityType: "user",
                entityId: userId,
                ipAddress: ip,
            });
            throw invalidCodeError();
        }
        await this.redis.client.del(`mfa:pending:${mfaToken}`);
        await this.auditLog.record({
            actorId: userId,
            actorType: "user",
            action: "internal_login.mfa_verified",
            entityType: "user",
            entityId: userId,
            ipAddress: ip,
        });
        return { userId };
    }
    async enrollMfa(userId) {
        const secret = (0, auth_1.generateTotpSecret)();
        const encrypted = (0, auth_1.encryptSecret)(secret, this.mfaEncryptionKey());
        await this.prisma.mfaMethod.deleteMany({ where: { userId, verifiedAt: null } });
        await this.prisma.mfaMethod.create({ data: { userId, type: "TOTP", secretEncrypted: encrypted } });
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const otpAuthUri = (0, auth_1.buildOtpAuthUri)(secret, user.email ?? user.displayName, this.config.env.MFA_ISSUER);
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(otpAuthUri);
        return { secret, otpAuthUri, qrCodeDataUrl };
    }
    async confirmMfaEnrollment(userId, code) {
        const method = await this.prisma.mfaMethod.findFirst({
            where: { userId, verifiedAt: null },
            orderBy: { createdAt: "desc" },
        });
        if (!method) {
            throw new common_1.BadRequestException("ثبت‌نام برای احراز هویت دومرحله‌ای یافت نشد.");
        }
        const secret = (0, auth_1.decryptSecret)(method.secretEncrypted, this.mfaEncryptionKey());
        if (!(0, auth_1.verifyTotpCode)(secret, code)) {
            throw new common_1.BadRequestException("کد وارد شده صحیح نیست.");
        }
        await this.prisma.mfaMethod.update({ where: { id: method.id }, data: { verifiedAt: new Date() } });
        const codes = (0, auth_1.generateRecoveryCodes)();
        await this.prisma.mfaRecoveryCode.createMany({
            data: codes.map((rawCode) => ({ userId, codeHash: (0, auth_1.hashRecoveryCode)(rawCode, this.config.env.OTP_HASH_PEPPER) })),
        });
        await this.auditLog.record({
            actorId: userId,
            actorType: "user",
            action: "mfa.enrolled",
            entityType: "user",
            entityId: userId,
        });
        return codes;
    }
    mfaEncryptionKey() {
        return (0, auth_1.deriveKey)(this.config.env.SESSION_SECRET, "mfa-secret");
    }
};
exports.InternalAuthService = InternalAuthService;
exports.InternalAuthService = InternalAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        app_config_service_1.AppConfigService,
        audit_log_service_1.AuditLogService])
], InternalAuthService);
