import type { Request, Response } from "express";
import type { AuthSessionResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import type { AuthSession } from "@hatef/database";
export interface CreateSessionInput {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
}
export interface CreatedSession {
    token: string;
    csrfToken: string;
    session: AuthSession;
}
export declare class SessionService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: AppConfigService);
    createSession(input: CreateSessionInput): Promise<CreatedSession>;
    /** Creates a session, sets the cookie, and shapes the login response body — shared by the partner OTP and internal login/MFA flows. */
    issueSession(userId: string, req: Request, res: Response): Promise<AuthSessionResponse>;
    setSessionCookie(res: Response, token: string): void;
    clearSessionCookie(res: Response): void;
    listSessions(userId: string): Promise<AuthSession[]>;
    revokeSession(sessionId: string, userId: string): Promise<void>;
    revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void>;
    markStepUpVerified(sessionId: string): Promise<void>;
}
//# sourceMappingURL=session.service.d.ts.map