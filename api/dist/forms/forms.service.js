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
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const slug_util_1 = require("../common/slug.util");
const form_definition_util_1 = require("./form-definition.util");
const NOT_DRAFT_ERROR = "این نسخه از فرم منتشر شده و قابل ویرایش نیست. یک نسخه جدید ایجاد کنید.";
let FormsService = class FormsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createForm(input) {
        const form = await this.prisma.form.create({
            data: { key: input.key ?? (0, slug_util_1.slugifyWithUniqueSuffix)(input.title), title: input.title, description: input.description },
        });
        const draft = await this.prisma.formVersion.create({
            data: { formId: form.id, versionNumber: 1, status: "DRAFT" },
        });
        return { formId: form.id, draftVersionId: draft.id };
    }
    /**
     * Once a form is published with no draft left, the builder page has
     * nothing left to edit — this is the only way out of that dead end. It
     * deep-copies the latest version's pages/sections/fields/options/rules
     * into a new DRAFT version (remapping FormRule.targetFieldId onto the
     * copies' new ids) so editing starts from the real current structure
     * instead of an empty form. Idempotent: returns the existing draft if one
     * was already created.
     */
    async createNewDraftVersion(formId) {
        const existingDraft = await this.prisma.formVersion.findFirst({ where: { formId, status: "DRAFT" } });
        if (existingDraft)
            return { draftVersionId: existingDraft.id };
        const latest = await this.prisma.formVersion.findFirst({
            where: { formId },
            orderBy: { versionNumber: "desc" },
            include: {
                pages: {
                    orderBy: { order: "asc" },
                    include: {
                        sections: {
                            orderBy: { order: "asc" },
                            include: { fields: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
                        },
                    },
                },
                rules: true,
            },
        });
        if (!latest)
            throw new common_1.NotFoundException("نسخه‌ای برای این فرم یافت نشد.");
        return this.prisma.$transaction(async (tx) => {
            const draft = await tx.formVersion.create({
                data: { formId, versionNumber: latest.versionNumber + 1, status: "DRAFT" },
            });
            const fieldIdMap = new Map();
            for (const page of latest.pages) {
                const newPage = await tx.formPage.create({
                    data: { formVersionId: draft.id, order: page.order, title: page.title, description: page.description },
                });
                for (const section of page.sections) {
                    const newSection = await tx.formSection.create({
                        data: { formPageId: newPage.id, order: section.order, title: section.title, description: section.description },
                    });
                    for (const field of section.fields) {
                        const newField = await tx.formField.create({
                            data: {
                                formSectionId: newSection.id,
                                order: field.order,
                                key: field.key,
                                label: field.label,
                                type: field.type,
                                required: field.required,
                                helpText: field.helpText,
                                placeholder: field.placeholder,
                                config: field.config,
                                options: field.options.length
                                    ? { create: field.options.map((o) => ({ order: o.order, value: o.value, label: o.label })) }
                                    : undefined,
                            },
                        });
                        fieldIdMap.set(field.id, newField.id);
                    }
                }
            }
            for (const rule of latest.rules) {
                const newTargetFieldId = fieldIdMap.get(rule.targetFieldId);
                if (!newTargetFieldId)
                    continue;
                await tx.formRule.create({
                    data: { formVersionId: draft.id, targetFieldId: newTargetFieldId, action: rule.action, condition: rule.condition },
                });
            }
            return { draftVersionId: draft.id };
        });
    }
    async listForms() {
        const forms = await this.prisma.form.findMany({
            include: { versions: { select: { id: true, status: true } } },
            orderBy: { createdAt: "desc" },
        });
        return forms.map((form) => ({
            id: form.id,
            key: form.key,
            title: form.title,
            description: form.description,
            draftVersionId: form.versions.find((v) => v.status === "DRAFT")?.id ?? null,
            publishedVersionId: form.versions.find((v) => v.status === "PUBLISHED")?.id ?? null,
        }));
    }
    async getForm(formId) {
        const form = await this.prisma.form.findUniqueOrThrow({
            where: { id: formId },
            include: { versions: { select: { id: true, status: true } } },
        });
        const draftVersionId = form.versions.find((v) => v.status === "DRAFT")?.id;
        const publishedVersionId = form.versions.find((v) => v.status === "PUBLISHED")?.id;
        return {
            id: form.id,
            key: form.key,
            title: form.title,
            draft: draftVersionId ? await (0, form_definition_util_1.assembleFormVersionDefinition)(this.prisma, draftVersionId) : null,
            published: publishedVersionId ? await (0, form_definition_util_1.assembleFormVersionDefinition)(this.prisma, publishedVersionId) : null,
        };
    }
    async getPublishedDefinition(formKey) {
        const form = await this.prisma.form.findUnique({
            where: { key: formKey },
            include: { versions: { where: { status: "PUBLISHED" } } },
        });
        const published = form?.versions[0];
        if (!published) {
            throw new common_1.NotFoundException("نسخه منتشرشده‌ای برای این فرم یافت نشد.");
        }
        return (0, form_definition_util_1.assembleFormVersionDefinition)(this.prisma, published.id);
    }
    async addPage(formId, input) {
        const draft = await this.requireDraftVersionForForm(formId);
        const maxOrder = await this.prisma.formPage.count({ where: { formVersionId: draft.id } });
        return this.prisma.formPage.create({
            data: { formVersionId: draft.id, order: maxOrder, title: input.title, description: input.description },
        });
    }
    async addSection(pageId, input) {
        const page = await this.prisma.formPage.findUniqueOrThrow({
            where: { id: pageId },
            include: { formVersion: { select: { status: true } } },
        });
        if (page.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        const maxOrder = await this.prisma.formSection.count({ where: { formPageId: pageId } });
        return this.prisma.formSection.create({
            data: { formPageId: pageId, order: maxOrder, title: input.title, description: input.description },
        });
    }
    async addField(sectionId, input) {
        const section = await this.prisma.formSection.findUniqueOrThrow({
            where: { id: sectionId },
            include: { formPage: { select: { formVersion: { select: { id: true, status: true } } } } },
        });
        if (section.formPage.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        const existingKey = await this.prisma.formField.findFirst({
            where: { key: input.key, formSection: { formPage: { formVersionId: section.formPage.formVersion.id } } },
        });
        if (existingKey) {
            throw new common_1.BadRequestException(`کلید فیلد «${input.key}» در این نسخه از فرم تکراری است.`);
        }
        const maxOrder = await this.prisma.formField.count({ where: { formSectionId: sectionId } });
        return this.prisma.formField.create({
            data: {
                formSectionId: sectionId,
                order: maxOrder,
                key: input.key,
                label: input.label,
                type: input.type,
                required: input.required,
                helpText: input.helpText,
                placeholder: input.placeholder,
                config: input.config,
                options: input.options
                    ? { create: input.options.map((option, index) => ({ order: index, value: option.value, label: option.label })) }
                    : undefined,
            },
            include: { options: true },
        });
    }
    async addRule(formVersionId, input) {
        const version = await this.prisma.formVersion.findUniqueOrThrow({ where: { id: formVersionId } });
        if (version.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        return this.prisma.formRule.create({
            data: {
                formVersionId,
                targetFieldId: input.targetFieldId,
                action: input.action,
                condition: input.condition,
            },
        });
    }
    async reorderPages(formVersionId, orderedIds) {
        await this.prisma.$transaction(orderedIds.map((id, index) => this.prisma.formPage.update({ where: { id }, data: { order: index } })));
    }
    async reorderSections(formPageId, orderedIds) {
        await this.prisma.$transaction(orderedIds.map((id, index) => this.prisma.formSection.update({ where: { id }, data: { order: index } })));
    }
    async reorderFields(formSectionId, orderedIds) {
        await this.prisma.$transaction(orderedIds.map((id, index) => this.prisma.formField.update({ where: { id }, data: { order: index } })));
    }
    async deletePage(pageId) {
        const page = await this.prisma.formPage.findUniqueOrThrow({
            where: { id: pageId },
            include: { formVersion: { select: { status: true } } },
        });
        if (page.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        await this.prisma.formPage.delete({ where: { id: pageId } });
    }
    async deleteSection(sectionId) {
        const section = await this.prisma.formSection.findUniqueOrThrow({
            where: { id: sectionId },
            include: { formPage: { select: { formVersion: { select: { status: true } } } } },
        });
        if (section.formPage.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        await this.prisma.formSection.delete({ where: { id: sectionId } });
    }
    async deleteField(fieldId) {
        const field = await this.prisma.formField.findUniqueOrThrow({
            where: { id: fieldId },
            include: { formSection: { select: { formPage: { select: { formVersion: { select: { status: true } } } } } } },
        });
        if (field.formSection.formPage.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        await this.prisma.formField.delete({ where: { id: fieldId } });
    }
    async deleteRule(ruleId) {
        const rule = await this.prisma.formRule.findUniqueOrThrow({
            where: { id: ruleId },
            include: { formVersion: { select: { status: true } } },
        });
        if (rule.formVersion.status !== "DRAFT")
            throw new common_1.BadRequestException(NOT_DRAFT_ERROR);
        await this.prisma.formRule.delete({ where: { id: ruleId } });
    }
    async publish(formId) {
        const draft = await this.requireDraftVersionForForm(formId);
        const pageCount = await this.prisma.formPage.count({ where: { formVersionId: draft.id } });
        if (pageCount === 0) {
            throw new common_1.BadRequestException("فرم باید حداقل یک صفحه داشته باشد تا منتشر شود.");
        }
        await this.prisma.$transaction([
            this.prisma.formVersion.updateMany({
                where: { formId, status: "PUBLISHED" },
                data: { status: "ARCHIVED" },
            }),
            this.prisma.formVersion.update({
                where: { id: draft.id },
                data: { status: "PUBLISHED", publishedAt: new Date() },
            }),
        ]);
        return (0, form_definition_util_1.assembleFormVersionDefinition)(this.prisma, draft.id);
    }
    /** Finds the form's current DRAFT version, cloning the latest published/archived one into a fresh draft if none exists yet. */
    async requireDraftVersionForForm(formId) {
        const existingDraft = await this.prisma.formVersion.findFirst({ where: { formId, status: "DRAFT" } });
        if (existingDraft)
            return existingDraft;
        const latest = await this.prisma.formVersion.findFirst({
            where: { formId },
            orderBy: { versionNumber: "desc" },
        });
        const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
        const newDraft = await this.prisma.formVersion.create({
            data: { formId, versionNumber: nextVersionNumber, status: "DRAFT" },
        });
        if (latest) {
            await this.cloneVersionContent(latest.id, newDraft.id);
        }
        return newDraft;
    }
    async cloneVersionContent(sourceVersionId, targetVersionId) {
        const source = await (0, form_definition_util_1.assembleFormVersionDefinition)(this.prisma, sourceVersionId);
        const fieldIdByKey = new Map();
        for (const page of source.pages) {
            const newPage = await this.prisma.formPage.create({
                data: { formVersionId: targetVersionId, order: page.order, title: page.title, description: page.description },
            });
            for (const section of page.sections) {
                const newSection = await this.prisma.formSection.create({
                    data: { formPageId: newPage.id, order: section.order, title: section.title, description: section.description },
                });
                for (const field of section.fields) {
                    const newField = await this.prisma.formField.create({
                        data: {
                            formSectionId: newSection.id,
                            order: field.order,
                            key: field.key,
                            label: field.label,
                            type: field.type,
                            required: field.required,
                            helpText: field.helpText,
                            placeholder: field.placeholder,
                            config: field.config,
                            options: { create: field.options.map((o) => ({ order: o.order, value: o.value, label: o.label })) },
                        },
                    });
                    fieldIdByKey.set(field.key, newField.id);
                }
            }
        }
        for (const rule of source.rules) {
            const targetField = source.pages
                .flatMap((p) => p.sections)
                .flatMap((s) => s.fields)
                .find((f) => f.id === rule.targetFieldId);
            if (!targetField)
                continue;
            const newTargetFieldId = fieldIdByKey.get(targetField.key);
            if (!newTargetFieldId)
                continue;
            await this.prisma.formRule.create({
                data: {
                    formVersionId: targetVersionId,
                    targetFieldId: newTargetFieldId,
                    action: rule.action,
                    condition: rule.condition,
                },
            });
        }
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormsService);
