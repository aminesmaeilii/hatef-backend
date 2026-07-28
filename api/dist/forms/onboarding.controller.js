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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const session_auth_guard_1 = require("../session/session-auth.guard");
const current_actor_decorator_1 = require("../session/current-actor.decorator");
const form_submissions_service_1 = require("./form-submissions.service");
/** Self-service entry point — any authenticated partner user may start onboarding, no RequirePermission gate (see FormSubmissionsService.startOrResumeOnboarding). */
let OnboardingController = class OnboardingController {
    formSubmissions;
    constructor(formSubmissions) {
        this.formSubmissions = formSubmissions;
    }
    async start(actor) {
        return this.formSubmissions.startOrResumeOnboarding(actor);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)("start"),
    __param(0, (0, current_actor_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "start", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.Controller)("onboarding"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __metadata("design:paramtypes", [form_submissions_service_1.FormSubmissionsService])
], OnboardingController);
