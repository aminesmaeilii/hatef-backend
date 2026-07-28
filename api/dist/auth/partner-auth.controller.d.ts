import type { Request, Response } from "express";
import { type AuthSessionResponse, type OtpRequest, type OtpRequestResponse, type OtpVerify } from "@hatef/contracts";
import { OtpService } from "./otp.service";
import { SessionService } from "../session/session.service";
export declare class PartnerAuthController {
    private readonly otp;
    private readonly sessions;
    constructor(otp: OtpService, sessions: SessionService);
    requestOtp(body: OtpRequest, req: Request): Promise<OtpRequestResponse>;
    verifyOtp(body: OtpVerify, req: Request, res: Response): Promise<AuthSessionResponse>;
}
//# sourceMappingURL=partner-auth.controller.d.ts.map