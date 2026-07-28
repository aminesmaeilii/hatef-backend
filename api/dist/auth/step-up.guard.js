"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepUpGuard = exports.STEP_UP_REQUIRED_CODE = exports.STEP_UP_FRESHNESS_MS = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_step_up_decorator_1 = require("./require-step-up.decorator");
/** How long a step-up verification (StepUpService.verify) stays fresh before a sensitive action demands another one. */
exports.STEP_UP_FRESHNESS_MS = 15 * 60 * 1000;
exports.STEP_UP_REQUIRED_CODE = "STEP_UP_REQUIRED";
/** Must run after SessionAuthGuard (needs req.actor already populated). */
let StepUpGuard = class StepUpGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.getAllAndOverride(require_step_up_decorator_1.REQUIRE_STEP_UP_METADATA, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required)
            return true;
        const req = context.switchToHttp().getRequest();
        if (!req.actor) {
            throw new common_1.UnauthorizedException("Session required");
        }
        const verifiedAt = req.actor.stepUpVerifiedAt;
        const isFresh = verifiedAt !== null && Date.now() - verifiedAt.getTime() < exports.STEP_UP_FRESHNESS_MS;
        if (!isFresh) {
            throw new common_1.ForbiddenException({
                code: exports.STEP_UP_REQUIRED_CODE,
                message: "این عملیات نیازمند تأیید هویت مجدد است. لطفاً رمز عبور یا کد MFA خود را وارد کنید.",
            });
        }
        return true;
    }
};
exports.StepUpGuard = StepUpGuard;
exports.StepUpGuard = StepUpGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], StepUpGuard);
