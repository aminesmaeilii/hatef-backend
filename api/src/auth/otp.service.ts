import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "@hatef/auth";
import { normalizeIranianMobile, maskMobile } from "@hatef/domain";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditLogService } from "../audit/audit-log.service";
import { SMS_PROVIDER, type SmsProvider } from "../sms/sms-provider.interface";

const MOBILE_REQUEST_WINDOW_SECONDS = 3600;
const MOBILE_REQUEST_MAX = 10;
const IP_REQUEST_MAX = 30;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
    private readonly auditLog: AuditLogService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  async requestOtp(rawMobile: string, ip?: string): Promise<{ resendAvailableInSeconds: number; devCode?: string }> {
    const mobile = normalizeIranianMobile(rawMobile);
    const { OTP_RESEND_COOLDOWN_SECONDS, OTP_EXPIRY_SECONDS, OTP_MAX_ATTEMPTS, OTP_HASH_PEPPER, NODE_ENV } =
      this.config.env;

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

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, OTP_HASH_PEPPER);
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
      metadata: { mobile: maskMobile(mobile) },
      ipAddress: ip,
    });

    return {
      resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      devCode: NODE_ENV === "production" ? undefined : code,
    };
  }

  async verifyOtp(rawMobile: string, code: string, ip?: string): Promise<{ userId: string }> {
    const mobile = normalizeIranianMobile(rawMobile);
    const genericError = () => new UnauthorizedException("کد وارد شده صحیح نیست یا منقضی شده است.");

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge || challenge.attempts >= challenge.maxAttempts) {
      await this.auditLog.record({
        actorType: "system",
        action: "otp.verify_failed",
        entityType: "user_contact",
        metadata: { mobile: maskMobile(mobile), reason: challenge ? "attempts_exhausted" : "no_active_challenge" },
        ipAddress: ip,
      });
      throw genericError();
    }

    const valid = verifyOtpCode(code, this.config.env.OTP_HASH_PEPPER, challenge.codeHash);
    if (!valid) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      await this.auditLog.record({
        actorType: "system",
        action: "otp.verify_failed",
        entityType: "user_contact",
        metadata: { mobile: maskMobile(mobile), reason: "wrong_code" },
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
      : (
          await this.prisma.user.create({
            data: {
              displayName: mobile,
              contacts: { create: { type: "MOBILE", value: mobile, verifiedAt: new Date(), isPrimary: true } },
            },
          })
        ).id;

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

  private async assertRateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, windowSeconds);
    }
    if (count > max) {
      throw new HttpException("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
