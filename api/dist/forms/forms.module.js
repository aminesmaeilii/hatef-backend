"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const evaluation_module_1 = require("../evaluation/evaluation.module");
const forms_service_1 = require("./forms.service");
const forms_controller_1 = require("./forms.controller");
const published_forms_controller_1 = require("./published-forms.controller");
const form_submissions_service_1 = require("./form-submissions.service");
const form_submissions_controller_1 = require("./form-submissions.controller");
const onboarding_controller_1 = require("./onboarding.controller");
let FormsModule = class FormsModule {
};
exports.FormsModule = FormsModule;
exports.FormsModule = FormsModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule, evaluation_module_1.EvaluationModule],
        controllers: [forms_controller_1.FormsController, published_forms_controller_1.PublishedFormsController, form_submissions_controller_1.FormSubmissionsController, onboarding_controller_1.OnboardingController],
        providers: [forms_service_1.FormsService, form_submissions_service_1.FormSubmissionsService],
        exports: [forms_service_1.FormsService, form_submissions_service_1.FormSubmissionsService],
    })
], FormsModule);
