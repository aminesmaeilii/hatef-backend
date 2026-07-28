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
exports.FormsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_1 = require("@hatef/contracts");
const auth_1 = require("@hatef/auth");
const zod_validation_pipe_1 = require("../common/zod-validation.pipe");
const session_auth_guard_1 = require("../session/session-auth.guard");
const permission_guard_1 = require("../rbac/permission.guard");
const require_permission_decorator_1 = require("../rbac/require-permission.decorator");
const forms_service_1 = require("./forms.service");
let FormsController = class FormsController {
    forms;
    constructor(forms) {
        this.forms = forms;
    }
    async create(body) {
        return this.forms.createForm(body);
    }
    async list() {
        return this.forms.listForms();
    }
    async getOne(formId) {
        return this.forms.getForm(formId);
    }
    async addPage(formId, body) {
        return this.forms.addPage(formId, body);
    }
    async addSection(pageId, body) {
        return this.forms.addSection(pageId, body);
    }
    async addField(sectionId, body) {
        return this.forms.addField(sectionId, body);
    }
    async addRule(versionId, body) {
        return this.forms.addRule(versionId, body);
    }
    async reorderPages(versionId, body) {
        await this.forms.reorderPages(versionId, body.orderedIds);
        return { ok: true };
    }
    async reorderSections(pageId, body) {
        await this.forms.reorderSections(pageId, body.orderedIds);
        return { ok: true };
    }
    async reorderFields(sectionId, body) {
        await this.forms.reorderFields(sectionId, body.orderedIds);
        return { ok: true };
    }
    async deletePage(pageId) {
        await this.forms.deletePage(pageId);
        return { ok: true };
    }
    async deleteSection(sectionId) {
        await this.forms.deleteSection(sectionId);
        return { ok: true };
    }
    async deleteField(fieldId) {
        await this.forms.deleteField(fieldId);
        return { ok: true };
    }
    async deleteRule(ruleId) {
        await this.forms.deleteRule(ruleId);
        return { ok: true };
    }
    async publish(formId) {
        return this.forms.publish(formId);
    }
    async createNewVersion(formId) {
        return this.forms.createNewDraftVersion(formId);
    }
};
exports.FormsController = FormsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFormSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":formId"),
    __param(0, (0, common_1.Param)("formId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":formId/pages"),
    __param(0, (0, common_1.Param)("formId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFormPageSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "addPage", null);
__decorate([
    (0, common_1.Post)("pages/:pageId/sections"),
    __param(0, (0, common_1.Param)("pageId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFormSectionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "addSection", null);
__decorate([
    (0, common_1.Post)("sections/:sectionId/fields"),
    __param(0, (0, common_1.Param)("sectionId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFormFieldSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "addField", null);
__decorate([
    (0, common_1.Post)("versions/:versionId/rules"),
    __param(0, (0, common_1.Param)("versionId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.createFormRuleSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "addRule", null);
__decorate([
    (0, common_1.Patch)("versions/:versionId/reorder-pages"),
    __param(0, (0, common_1.Param)("versionId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reorderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "reorderPages", null);
__decorate([
    (0, common_1.Patch)("pages/:pageId/reorder-sections"),
    __param(0, (0, common_1.Param)("pageId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reorderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "reorderSections", null);
__decorate([
    (0, common_1.Patch)("sections/:sectionId/reorder-fields"),
    __param(0, (0, common_1.Param)("sectionId")),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(contracts_1.reorderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "reorderFields", null);
__decorate([
    (0, common_1.Delete)("pages/:pageId"),
    __param(0, (0, common_1.Param)("pageId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "deletePage", null);
__decorate([
    (0, common_1.Delete)("sections/:sectionId"),
    __param(0, (0, common_1.Param)("sectionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "deleteSection", null);
__decorate([
    (0, common_1.Delete)("fields/:fieldId"),
    __param(0, (0, common_1.Param)("fieldId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "deleteField", null);
__decorate([
    (0, common_1.Delete)("rules/:ruleId"),
    __param(0, (0, common_1.Param)("ruleId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "deleteRule", null);
__decorate([
    (0, common_1.Post)(":formId/publish"),
    __param(0, (0, common_1.Param)("formId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(":formId/new-version"),
    __param(0, (0, common_1.Param)("formId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FormsController.prototype, "createNewVersion", null);
exports.FormsController = FormsController = __decorate([
    (0, common_1.Controller)("forms"),
    (0, common_1.UseGuards)(session_auth_guard_1.SessionAuthGuard, permission_guard_1.PermissionGuard),
    (0, require_permission_decorator_1.RequirePermission)(auth_1.PERMISSIONS.FORM_MANAGE),
    __metadata("design:paramtypes", [forms_service_1.FormsService])
], FormsController);
