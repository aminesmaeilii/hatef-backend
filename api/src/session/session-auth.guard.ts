import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { hashSessionToken } from "@hatef/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = new Set(["/api/v1/auth/logout"]);
export const CSRF_HEADER = "x-csrf-token";

/**
 * Hand-rolled (no passport) — reads the session cookie, resolves the
 * DB-backed AuthSession, and attaches `req.actor`. Also enforces the CSRF
 * token on state-changing requests: defense-in-depth on top of the
 * SameSite=Lax cookie (which already blocks cross-site POSTs, but not a
 * same-site XSS forging a request).
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const token: string | undefined = req.cookies?.[this.config.env.SESSION_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException("Session required");
    }

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Session expired or revoked");
    }

    if (!SAFE_METHODS.has(req.method) && !CSRF_EXEMPT_PATHS.has(req.path)) {
      const csrfHeader = req.header(CSRF_HEADER);
      if (!csrfHeader || csrfHeader !== session.csrfToken) {
        throw new UnauthorizedException("Missing or invalid CSRF token");
      }
    }

    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId: session.userId },
      include: { role: true },
    });

    req.actor = {
      userId: session.userId,
      sessionId: session.id,
      csrfToken: session.csrfToken,
      stepUpVerifiedAt: session.stepUpVerifiedAt,
      roleAssignments: assignments.map((assignment) => ({
        role: assignment.role.key,
        resourceType: assignment.resourceType ?? undefined,
        resourceId: assignment.resourceId ?? undefined,
      })),
    };

    void this.prisma.authSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return true;
  }
}
