import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import {
  internalLoginSchema,
  mfaEnrollConfirmSchema,
  mfaVerifySchema,
  stepUpSchema,
  type AuthSessionResponse,
  type InternalLogin,
  type InternalLoginResponse,
  type MfaEnrollConfirm,
  type MfaEnrollConfirmResponse,
  type MfaEnrollResponse,
  type MfaVerify,
  type StepUp,
} from "@hatef/contracts";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { SessionService } from "../session/session.service";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { InternalAuthService } from "./internal-auth.service";
import { StepUpService } from "./step-up.service";

@Controller("auth/internal")
export class InternalAuthController {
  constructor(
    private readonly internalAuth: InternalAuthService,
    private readonly sessions: SessionService,
    private readonly stepUpService: StepUpService,
  ) {}

  // Tighter than the global default — email/password login is a classic
  // credential-stuffing target and has no other rate limit (unlike the
  // partner OTP flow, which is already Redis-limited in OtpService).
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(internalLoginSchema)) body: InternalLogin,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InternalLoginResponse> {
    const result = await this.internalAuth.login(body.mobile, body.password, req.ip);
    if (result.status === "mfa_required") {
      return { status: "mfa_required", mfaToken: result.mfaToken };
    }
    const session = await this.sessions.issueSession(result.userId, req, res);
    return { status: "ok", ...session };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("mfa/verify")
  async verifyMfa(
    @Body(new ZodValidationPipe(mfaVerifySchema)) body: MfaVerify,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const { userId } = await this.internalAuth.verifyMfa(body.mfaToken, body.code, req.ip);
    return this.sessions.issueSession(userId, req, res);
  }

  @Post("mfa/enroll")
  @UseGuards(SessionAuthGuard)
  async enrollMfa(@CurrentActor() actor: RequestActor): Promise<MfaEnrollResponse> {
    return this.internalAuth.enrollMfa(actor.userId);
  }

  @Post("mfa/enroll/confirm")
  @UseGuards(SessionAuthGuard)
  async confirmMfaEnrollment(
    @CurrentActor() actor: RequestActor,
    @Body(new ZodValidationPipe(mfaEnrollConfirmSchema)) body: MfaEnrollConfirm,
  ): Promise<MfaEnrollConfirmResponse> {
    const recoveryCodes = await this.internalAuth.confirmMfaEnrollment(actor.userId, body.code);
    return { recoveryCodes };
  }

  @Post("step-up")
  @UseGuards(SessionAuthGuard)
  async stepUp(
    @CurrentActor() actor: RequestActor,
    @Body(new ZodValidationPipe(stepUpSchema)) body: StepUp,
  ): Promise<{ ok: true }> {
    await this.stepUpService.verify(actor.userId, actor.sessionId, body);
    return { ok: true };
  }
}
