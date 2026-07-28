import type { FormRuleCondition, FormVersionDefinition } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";

const FULL_VERSION_INCLUDE = {
  pages: {
    orderBy: { order: "asc" as const },
    include: {
      sections: {
        orderBy: { order: "asc" as const },
        include: {
          fields: {
            orderBy: { order: "asc" as const },
            include: { options: { orderBy: { order: "asc" as const } } },
          },
        },
      },
    },
  },
  rules: true,
};

/** Assembles the full page→section→field→option tree + rules for one FormVersion, shared by the admin builder and the partner wizard. */
export async function assembleFormVersionDefinition(
  prisma: PrismaService,
  formVersionId: string,
): Promise<FormVersionDefinition> {
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
      condition: rule.condition as unknown as FormRuleCondition,
    })),
  };
}
