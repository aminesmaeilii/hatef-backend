import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { REQUIRE_STEP_UP_METADATA } from "./require-step-up.decorator";

/** How long a step-up verification (StepUpService.verify) stays fresh before a sensitive action demands another one. */
export const STEP_UP_FRESHNESS_MS = 15 * 60 * 1000;

export const STEP_UP_REQUIRED_CODE = "STEP_UP_REQUIRED";

/** Must run after SessionAuthGuard (needs req.actor already populated). */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean | undefined>(REQUIRE_STEP_UP_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.actor) {
      throw new UnauthorizedException("Session required");
    }

    const verifiedAt = req.actor.stepUpVerifiedAt;
    const isFresh = verifiedAt !== null && Date.now() - verifiedAt.getTime() < STEP_UP_FRESHNESS_MS;
    if (!isFresh) {
      throw new ForbiddenException({
        code: STEP_UP_REQUIRED_CODE,
        message: "این عملیات نیازمند تأیید هویت مجدد است. لطفاً رمز عبور یا کد MFA خود را وارد کنید.",
      });
    }

    return true;
  }
}
