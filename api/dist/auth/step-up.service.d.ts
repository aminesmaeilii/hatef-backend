import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { SessionService } from "../session/session.service";
/**
 * Re-authentication for sensitive actions (spec 8.2's "step-up authentication
 * for sensitive financial actions"). Built now as foundation; no endpoint
 * requires it yet since Phase 1 has no financial actions — Phase 3/5 apply
 * `@RequireStepUp()` where it matters.
 */
export declare class StepUpService {
    private readonly prisma;
    private readonly config;
    private readonly sessions;
    constructor(prisma: PrismaService, config: AppConfigService, sessions: SessionService);
    verify(userId: string, sessionId: string, input: {
        password?: string;
        code?: string;
    }): Promise<void>;
}
//# sourceMappingURL=step-up.service.d.ts.map