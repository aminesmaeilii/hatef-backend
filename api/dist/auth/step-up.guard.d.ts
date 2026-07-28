import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
/** How long a step-up verification (StepUpService.verify) stays fresh before a sensitive action demands another one. */
export declare const STEP_UP_FRESHNESS_MS: number;
export declare const STEP_UP_REQUIRED_CODE = "STEP_UP_REQUIRED";
/** Must run after SessionAuthGuard (needs req.actor already populated). */
export declare class StepUpGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=step-up.guard.d.ts.map