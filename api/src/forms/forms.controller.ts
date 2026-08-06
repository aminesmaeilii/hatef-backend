import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createFormFieldSchema,
  createFormPageSchema,
  createFormRuleSchema,
  createFormSchema,
  createFormSectionSchema,
  reorderSchema,
  type CreateForm,
  type CreateFormField,
  type CreateFormRule,
  type Reorder,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { FormsService } from "./forms.service";

@Controller("forms")
@UseGuards(SessionAuthGuard, PermissionGuard)
@RequirePermission(PERMISSIONS.FORM_MANAGE)
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createFormSchema)) body: CreateForm) {
    return this.forms.createForm(body);
  }

  @Get()
  async list() {
    return this.forms.listForms();
  }

  @Get(":formId")
  async getOne(@Param("formId") formId: string) {
    return this.forms.getForm(formId);
  }

  @Get(":formId/submissions")
  async listSubmissions(@Param("formId") formId: string) {
    return this.forms.listSubmissions(formId);
  }

  @Post(":formId/pages")
  async addPage(@Param("formId") formId: string, @Body(new ZodValidationPipe(createFormPageSchema)) body: { title: string; description?: string }) {
    return this.forms.addPage(formId, body);
  }

  @Post("pages/:pageId/sections")
  async addSection(
    @Param("pageId") pageId: string,
    @Body(new ZodValidationPipe(createFormSectionSchema)) body: { title: string; description?: string },
  ) {
    return this.forms.addSection(pageId, body);
  }

  @Post("sections/:sectionId/fields")
  async addField(
    @Param("sectionId") sectionId: string,
    @Body(new ZodValidationPipe(createFormFieldSchema)) body: CreateFormField,
  ) {
    return this.forms.addField(sectionId, body);
  }

  @Post("versions/:versionId/rules")
  async addRule(
    @Param("versionId") versionId: string,
    @Body(new ZodValidationPipe(createFormRuleSchema)) body: CreateFormRule,
  ) {
    return this.forms.addRule(versionId, body);
  }

  @Patch("versions/:versionId/reorder-pages")
  async reorderPages(@Param("versionId") versionId: string, @Body(new ZodValidationPipe(reorderSchema)) body: Reorder) {
    await this.forms.reorderPages(versionId, body.orderedIds);
    return { ok: true };
  }

  @Patch("pages/:pageId/reorder-sections")
  async reorderSections(@Param("pageId") pageId: string, @Body(new ZodValidationPipe(reorderSchema)) body: Reorder) {
    await this.forms.reorderSections(pageId, body.orderedIds);
    return { ok: true };
  }

  @Patch("sections/:sectionId/reorder-fields")
  async reorderFields(@Param("sectionId") sectionId: string, @Body(new ZodValidationPipe(reorderSchema)) body: Reorder) {
    await this.forms.reorderFields(sectionId, body.orderedIds);
    return { ok: true };
  }

  @Delete("pages/:pageId")
  async deletePage(@Param("pageId") pageId: string) {
    await this.forms.deletePage(pageId);
    return { ok: true };
  }

  @Delete("sections/:sectionId")
  async deleteSection(@Param("sectionId") sectionId: string) {
    await this.forms.deleteSection(sectionId);
    return { ok: true };
  }

  @Delete("fields/:fieldId")
  async deleteField(@Param("fieldId") fieldId: string) {
    await this.forms.deleteField(fieldId);
    return { ok: true };
  }

  @Delete("rules/:ruleId")
  async deleteRule(@Param("ruleId") ruleId: string) {
    await this.forms.deleteRule(ruleId);
    return { ok: true };
  }

  @Post(":formId/publish")
  async publish(@Param("formId") formId: string) {
    return this.forms.publish(formId);
  }

  @Post(":formId/new-version")
  async createNewVersion(@Param("formId") formId: string) {
    return this.forms.createNewDraftVersion(formId);
  }
}
