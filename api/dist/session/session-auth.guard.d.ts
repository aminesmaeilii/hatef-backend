import { CanActivate, ExecutionContext } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
export declare const CSRF_HEADER = "x-csrf-token";
/**
 * Hand-rolled (no passport) — reads the session cookie, resolves the
 * DB-backed AuthSession, and attaches `req.actor`. Also enforces the CSRF
 * token on state-changing requests: defense-in-depth on top of the
 * SameSite=Lax cookie (which already blocks cross-site POSTs, but not a
 * same-site XSS forging a request).
 */
export declare class SessionAuthGuard implements CanActivate {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: AppConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=session-auth.guard.d.ts.map