import { Body, Controller, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  partnerTrackingLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  type AuthSessionResponse,
  type OtpRequest,
  type OtpRequestResponse,
  type OtpVerify,
  type PartnerTrackingLogin,
} from "@hatef/contracts";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { OtpService } from "./otp.service";
import { SessionService } from "../session/session.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";

@Controller("auth/partner")
export class PartnerAuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post("questionnaire/start")
  async startQuestionnaire(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const user = await this.prisma.user.create({
      data: { displayName: `همکار کانال ${new Date().toISOString().slice(0, 10)}` },
    });
    await this.auditLog.record({
      actorId: user.id,
      actorType: "user",
      action: "partner_questionnaire.started",
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
    });
    return this.sessions.issueSession(user.id, req, res);
  }

  @Post("tracking-login")
  async trackingLogin(
    @Body(new ZodValidationPipe(partnerTrackingLoginSchema)) body: PartnerTrackingLogin,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const trackingCode = body.trackingCode.trim();
    const submission =
      trackingCode.length === 6
        ? await this.prisma.formSubmission.findUnique({ where: { trackingCode } })
        : await this.prisma.formSubmission.findUnique({ where: { id: trackingCode } });
    if (!submission || submission.status !== "SUBMITTED") {
      await this.auditLog.record({
        actorType: "system",
        action: "partner_tracking_login.failed",
        entityType: "form_submission",
        ipAddress: req.ip,
      });
      throw new UnauthorizedException("کد رهگیری معتبر نیست.");
    }
    await this.auditLog.record({
      actorId: submission.submitterId,
      actorType: "user",
      action: "partner_tracking_login.success",
      entityType: "form_submission",
      entityId: submission.id,
      ipAddress: req.ip,
    });
    return this.sessions.issueSession(submission.submitterId, req, res);
  }

  @Post("otp/request")
  async requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequest,
    @Req() req: Request,
  ): Promise<OtpRequestResponse> {
    return this.otp.requestOtp(body.mobile, req.ip);
  }

  @Post("otp/verify")
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerify,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const { userId } = await this.otp.verifyOtp(body.mobile, body.code, req.ip);
    return this.sessions.issueSession(userId, req, res);
  }
}
