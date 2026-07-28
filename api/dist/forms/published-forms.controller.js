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
exports.PublishedFormsController = void 0;
const common_1 = require("@nestjs/common");
const session_auth_guard_1 = require("../session/session-auth.guard");
const forms_service_1 = require("./forms.service");
/** Any authenticated user (internal or partner) may read a published form's structure — it's what gets rendered to fill out, not sensitive. */
let PublishedFormsController = class PublishedFormsController {
    forms;
    constructor(forms) {
        this.forms = forms;
    }
    async getPublished(key) {
        return this.forms.getPublishedDefinition(key);
    }
};
exports.PublishedFormsController = PublishedFormsController;
__decorate([
    (0, common_1.Get)(":key"),
    __param(0, (0, common_1.Param)("key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublishedFormsController.prototype, "getPublished", null);
exports.PublishedFormsController = PublishedFormsController = __decorate([
    (0, common_1.Controller)("forms-published"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard),
    __metadata("design:paramtypes", [forms_service_1.FormsService])
], PublishedFormsController);
