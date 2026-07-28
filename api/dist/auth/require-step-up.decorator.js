"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireStepUp = exports.REQUIRE_STEP_UP_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_STEP_UP_METADATA = "require_step_up";
/** Marks a route as a sensitive financial action needing fresh re-authentication (spec 24 "step-up authentication"). Enforced by StepUpGuard. */
const RequireStepUp = () => (0, common_1.SetMetadata)(exports.REQUIRE_STEP_UP_METADATA, true);
exports.RequireStepUp = RequireStepUp;
