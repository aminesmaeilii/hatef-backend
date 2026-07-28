import { Injectable, UnauthorizedException } from "@nestjs/common";
import { decryptSecret, deriveKey, verifyPassword, verifyTotpCode } from "@hatef/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { SessionService } from "../session/session.service";

/**
 * Re-authentication for sensitive actions (spec 8.2's "step-up authentication
 * for sensitive financial actions"). Built now as foundation; no endpoint
 * requires it yet since Phase 1 has no financial actions — Phase 3/5 apply
 * `@RequireStepUp()` where it matters.
 */
@Injectable()
export class StepUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly sessions: SessionService,
  ) {}

  async verify(userId: string, sessionId: string, input: { password?: string; code?: string }): Promise<void> {
    if (input.password) {
      const credential = await this.prisma.adminCredential.findUnique({ where: { userId } });
      if (credential && (await verifyPassword(credential.passwordHash, input.password))) {
        await this.sessions.markStepUpVerified(sessionId);
        return;
      }
    }

    if (input.code) {
      const method = await this.prisma.mfaMethod.findFirst({ where: { userId, verifiedAt: { not: null } } });
      if (method) {
        const secret = decryptSecret(method.secretEncrypted, deriveKey(this.config.env.SESSION_SECRET, "mfa-secret"));
        if (verifyTotpCode(secret, input.code)) {
          await this.sessions.markStepUpVerified(sessionId);
          return;
        }
      }
    }

    throw new UnauthorizedException("تأیید هویت مجدد ناموفق بود.");
  }
}
