"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveysModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const rbac_module_1 = require("../rbac/rbac.module");
const audit_module_1 = require("../audit/audit.module");
const forms_module_1 = require("../forms/forms.module");
const surveys_service_1 = require("./surveys.service");
const surveys_controller_1 = require("./surveys.controller");
let SurveysModule = class SurveysModule {
};
exports.SurveysModule = SurveysModule;
exports.SurveysModule = SurveysModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule, rbac_module_1.RbacModule, audit_module_1.AuditModule, forms_module_1.FormsModule],
        controllers: [surveys_controller_1.SurveysController, surveys_controller_1.SurveysPartnerController],
        providers: [surveys_service_1.SurveysService],
        exports: [surveys_service_1.SurveysService],
    })
], SurveysModule);
