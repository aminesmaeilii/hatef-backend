"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const sms_module_1 = require("../sms/sms.module");
const session_module_1 = require("../session/session.module");
const audit_module_1 = require("../audit/audit.module");
const otp_service_1 = require("./otp.service");
const internal_auth_service_1 = require("./internal-auth.service");
const step_up_service_1 = require("./step-up.service");
const step_up_guard_1 = require("./step-up.guard");
const workspace_service_1 = require("./workspace.service");
const partner_auth_controller_1 = require("./partner-auth.controller");
const internal_auth_controller_1 = require("./internal-auth.controller");
const session_controller_1 = require("./session.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [sms_module_1.SmsModule, session_module_1.SessionModule, audit_module_1.AuditModule],
        controllers: [partner_auth_controller_1.PartnerAuthController, internal_auth_controller_1.InternalAuthController, session_controller_1.SessionController],
        providers: [otp_service_1.OtpService, internal_auth_service_1.InternalAuthService, step_up_service_1.StepUpService, step_up_guard_1.StepUpGuard, workspace_service_1.WorkspaceService],
        exports: [step_up_guard_1.StepUpGuard],
    })
], AuthModule);
