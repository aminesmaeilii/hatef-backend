import { SetMetadata } from "@nestjs/common";

export const REQUIRE_STEP_UP_METADATA = "require_step_up";

/** Marks a route as a sensitive financial action needing fresh re-authentication (spec 24 "step-up authentication"). Enforced by StepUpGuard. */
export const RequireStepUp = () => SetMetadata<string, true>(REQUIRE_STEP_UP_METADATA, true);
