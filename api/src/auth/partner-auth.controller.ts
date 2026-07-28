import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  otpRequestSchema,
  otpVerifySchema,
  type AuthSessionResponse,
  type OtpRequest,
  type OtpRequestResponse,
  type OtpVerify,
} from "@hatef/contracts";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { OtpService } from "./otp.service";
import { SessionService } from "../session/session.service";

@Controller("auth/partner")
export class PartnerAuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
  ) {}

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
