import type { Request, Response } from "express";
import { type AuthSessionResponse, type InternalLogin, type InternalLoginResponse, type MfaEnrollConfirm, type MfaEnrollConfirmResponse, type MfaEnrollResponse, type MfaVerify, type StepUp } from "@hatef/contracts";
import { SessionService } from "../session/session.service";
import type { RequestActor } from "../session/actor.types";
import { InternalAuthService } from "./internal-auth.service";
import { StepUpService } from "./step-up.service";
export declare class InternalAuthController {
    private readonly internalAuth;
    private readonly sessions;
    private readonly stepUpService;
    constructor(internalAuth: InternalAuthService, sessions: SessionService, stepUpService: StepUpService);
    login(body: InternalLogin, req: Request, res: Response): Promise<InternalLoginResponse>;
    verifyMfa(body: MfaVerify, req: Request, res: Response): Promise<AuthSessionResponse>;
    enrollMfa(actor: RequestActor): Promise<MfaEnrollResponse>;
    confirmMfaEnrollment(actor: RequestActor, body: MfaEnrollConfirm): Promise<MfaEnrollConfirmResponse>;
    stepUp(actor: RequestActor, body: StepUp): Promise<{
        ok: true;
    }>;
}
//# sourceMappingURL=internal-auth.controller.d.ts.map