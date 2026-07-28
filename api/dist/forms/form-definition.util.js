"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleFormVersionDefinition = assembleFormVersionDefinition;
const FULL_VERSION_INCLUDE = {
    pages: {
        orderBy: { order: "asc" },
        include: {
            sections: {
                orderBy: { order: "asc" },
                include: {
                    fields: {
                        orderBy: { order: "asc" },
                        include: { options: { orderBy: { order: "asc" } } },
                    },
                },
            },
        },
    },
    rules: true,
};
/** Assembles the full page→section→field→option tree + rules for one FormVersion, shared by the admin builder and the partner wizard. */
async function assembleFormVersionDefinition(prisma, formVersionId) {
    const version = await prisma.formVersion.findUniqueOrThrow({
        where: { id: formVersionId },
        include: FULL_VERSION_INCLUDE,
    });
    return {
        id: version.id,
        formId: version.formId,
        versionNumber: version.versionNumber,
        status: version.status,
        publishedAt: version.publishedAt?.toISOString() ?? null,
        pages: version.pages.map((page) => ({
            id: page.id,
            order: page.order,
            title: page.title,
            description: page.description,
            sections: page.sections.map((section) => ({
                id: section.id,
                order: section.order,
                title: section.title,
                description: section.description,
                fields: section.fields.map((field) => ({
                    id: field.id,
                    order: field.order,
                    key: field.key,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    helpText: field.helpText,
                    placeholder: field.placeholder,
                    config: field.config,
                    options: field.options.map((option) => ({
                        id: option.id,
                        order: option.order,
                        value: option.value,
                        label: option.label,
                    })),
                })),
            })),
        })),
        rules: version.rules.map((rule) => ({
            id: rule.id,
            targetFieldId: rule.targetFieldId,
            action: rule.action,
            condition: rule.condition,
        })),
    };
}
