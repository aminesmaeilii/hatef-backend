import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { generateSessionToken, hashSessionToken } from "@hatef/auth";
import type { AuthSessionResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import type { AuthSession } from "@hatef/database";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async createSession(input: CreateSessionInput): Promise<CreatedSession> {
    const token = generateSessionToken();
    const csrfToken = randomBytes(24).toString("base64url");
    const now = Date.now();

    const session = await this.prisma.authSession.create({
      data: {
        userId: input.userId,
        tokenHash: hashSessionToken(token),
        csrfToken,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: new Date(now + SESSION_TTL_MS),
        lastSeenAt: new Date(now),
      },
    });

    return { token, csrfToken, session };
  }

  /** Creates a session, sets the cookie, and shapes the login response body — shared by the partner OTP and internal login/MFA flows. */
  async issueSession(userId: string, req: Request, res: Response): Promise<AuthSessionResponse> {
    const { token, csrfToken } = await this.createSession({
      userId,
      userAgent: req.header("user-agent"),
      ipAddress: req.ip,
    });
    this.setSessionCookie(res, token);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { user: { id: user.id, displayName: user.displayName, email: user.email }, csrfToken };
  }

  setSessionCookie(res: Response, token: string): void {
    const { SESSION_COOKIE_NAME, NODE_ENV } = this.config.env;
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_MS,
      path: "/",
    });
  }

  clearSessionCookie(res: Response): void {
    res.clearCookie(this.config.env.SESSION_COOKIE_NAME, { path: "/" });
  }

  async listSessions(userId: string): Promise<AuthSession[]> {
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
  }

  async markStepUpVerified(sessionId: string): Promise<void> {
    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { stepUpVerifiedAt: new Date() },
    });
  }
}
