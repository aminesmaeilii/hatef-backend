import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import QRCode from "qrcode";
import {
  buildOtpAuthUri,
  decryptSecret,
  deriveKey,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashPassword,
  hashRecoveryCode,
  verifyPassword,
  verifyRecoveryCode,
  verifyTotpCode,
} from "@hatef/auth";
import type { MfaEnrollResponse } from "@hatef/contracts";
import { normalizeIranianMobile } from "@hatef/domain";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MFA_PENDING_TTL_SECONDS = 300;

// Precomputed once (not per-request) and reused so a login attempt against a
// non-existent email costs roughly the same as one against a real account —
// part of keeping login responses enumeration-safe.
const DUMMY_HASH_PROMISE = hashPassword("dummy-enumeration-safe-check-value");

export type InternalLoginResult = { status: "mfa_required"; mfaToken: string } | { status: "ok"; userId: string };

@Injectable()
export class InternalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async login(rawMobile: string, password: string, ip?: string): Promise<InternalLoginResult> {
    const genericError = () => new UnauthorizedException("ایمیل یا رمز عبور نادرست است.");

    const mobile = normalizeIranianMobile(rawMobile);
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
      await verifyPassword(await DUMMY_HASH_PROMISE, password);
      throw genericError();
    }

    if (user.adminCredential.lockedUntil && user.adminCredential.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException("حساب کاربری به‌طور موقت قفل شده است. کمی بعد دوباره تلاش کنید.");
    }

    const validPassword = await verifyPassword(user.adminCredential.passwordHash, password);
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
      const mfaToken = randomBytes(24).toString("base64url");
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

  async verifyMfa(mfaToken: string, code: string, ip?: string): Promise<{ userId: string }> {
    const userId = await this.redis.client.get(`mfa:pending:${mfaToken}`);
    if (!userId) {
      throw new UnauthorizedException("درخواست ورود منقضی شده است. دوباره تلاش کنید.");
    }

    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, verifiedAt: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    const invalidCodeError = () => new UnauthorizedException("کد تأیید نامعتبر است.");
    if (!method) throw invalidCodeError();

    const key = this.mfaEncryptionKey();
    const secret = decryptSecret(method.secretEncrypted, key);

    let ok = verifyTotpCode(secret, code);
    if (!ok) {
      const recoveryCodes = await this.prisma.mfaRecoveryCode.findMany({ where: { userId, usedAt: null } });
      const match = recoveryCodes.find((rc) => verifyRecoveryCode(code, this.config.env.OTP_HASH_PEPPER, rc.codeHash));
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

  async enrollMfa(userId: string): Promise<MfaEnrollResponse> {
    const secret = generateTotpSecret();
    const encrypted = encryptSecret(secret, this.mfaEncryptionKey());

    await this.prisma.mfaMethod.deleteMany({ where: { userId, verifiedAt: null } });
    await this.prisma.mfaMethod.create({ data: { userId, type: "TOTP", secretEncrypted: encrypted } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const otpAuthUri = buildOtpAuthUri(secret, user.email ?? user.displayName, this.config.env.MFA_ISSUER);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri);

    return { secret, otpAuthUri, qrCodeDataUrl };
  }

  async confirmMfaEnrollment(userId: string, code: string): Promise<string[]> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!method) {
      throw new BadRequestException("ثبت‌نام برای احراز هویت دومرحله‌ای یافت نشد.");
    }

    const secret = decryptSecret(method.secretEncrypted, this.mfaEncryptionKey());
    if (!verifyTotpCode(secret, code)) {
      throw new BadRequestException("کد وارد شده صحیح نیست.");
    }

    await this.prisma.mfaMethod.update({ where: { id: method.id }, data: { verifiedAt: new Date() } });

    const codes = generateRecoveryCodes();
    await this.prisma.mfaRecoveryCode.createMany({
      data: codes.map((rawCode: string) => ({ userId, codeHash: hashRecoveryCode(rawCode, this.config.env.OTP_HASH_PEPPER) })),
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

  private mfaEncryptionKey() {
    return deriveKey(this.config.env.SESSION_SECRET, "mfa-secret");
  }
}
