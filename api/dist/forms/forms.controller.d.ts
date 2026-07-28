import { type CreateForm, type CreateFormField, type CreateFormRule, type Reorder } from "@hatef/contracts";
import { FormsService } from "./forms.service";
export declare class FormsController {
    private readonly forms;
    constructor(forms: FormsService);
    create(body: CreateForm): Promise<{
        formId: string;
        draftVersionId: string;
    }>;
    list(): Promise<{
        id: string;
        key: string;
        title: string;
        description: string | null;
        draftVersionId: string | null;
        publishedVersionId: string | null;
    }[]>;
    getOne(formId: string): Promise<{
        id: string;
        key: string;
        title: string;
        draft: import("@hatef/contracts").FormVersionDefinition | null;
        published: import("@hatef/contracts").FormVersionDefinition | null;
    }>;
    addPage(formId: string, body: {
        title: string;
        description?: string;
    }): Promise<{
        id: string;
        description: string | null;
        title: string;
        order: number;
        formVersionId: string;
    }>;
    addSection(pageId: string, body: {
        title: string;
        description?: string;
    }): Promise<{
        id: string;
        description: string | null;
        title: string;
        order: number;
        formPageId: string;
    }>;
    addField(sectionId: string, body: CreateFormField): Promise<{
        options: {
            id: string;
            value: string;
            label: string;
            order: number;
            formFieldId: string;
        }[];
    } & {
        type: import("@hatef/database").$Enums.FormFieldType;
        id: string;
        createdAt: Date;
        key: string;
        label: string;
        order: number;
        formSectionId: string;
        required: boolean;
        helpText: string | null;
        placeholder: string | null;
        config: import("@hatef/database/generated/client/runtime/library").JsonValue | null;
    }>;
    addRule(versionId: string, body: CreateFormRule): Promise<{
        id: string;
        createdAt: Date;
        action: import("@hatef/database").$Enums.FormRuleAction;
        targetFieldId: string;
        condition: import("@hatef/database/generated/client/runtime/library").JsonValue;
        formVersionId: string;
    }>;
    reorderPages(versionId: string, body: Reorder): Promise<{
        ok: boolean;
    }>;
    reorderSections(pageId: string, body: Reorder): Promise<{
        ok: boolean;
    }>;
    reorderFields(sectionId: string, body: Reorder): Promise<{
        ok: boolean;
    }>;
    deletePage(pageId: string): Promise<{
        ok: boolean;
    }>;
    deleteSection(sectionId: string): Promise<{
        ok: boolean;
    }>;
    deleteField(fieldId: string): Promise<{
        ok: boolean;
    }>;
    deleteRule(ruleId: string): Promise<{
        ok: boolean;
    }>;
    publish(formId: string): Promise<{
        id: string;
        formId: string;
        versionNumber: number;
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        publishedAt: string | null;
        pages: {
            id: string;
            order: number;
            title: string;
            description: string | null;
            sections: {
                id: string;
                order: number;
                title: string;
                description: string | null;
                fields: {
                    id: string;
                    order: number;
                    key: string;
                    label: string;
                    type: "TEXT" | "LONG_TEXT" | "PHONE" | "NUMBER" | "JALALI_DATE" | "SINGLE_SELECT" | "MULTI_SELECT" | "REPEATABLE_GROUP" | "IMAGE" | "DOCUMENT" | "LINK" | "CONSENT";
                    required: boolean;
                    helpText: string | null;
                    placeholder: string | null;
                    config: unknown;
                    options: {
                        id: string;
                        order: number;
                        value: string;
                        label: string;
                    }[];
                }[];
            }[];
        }[];
        rules: {
            id: string;
            targetFieldId: string;
            action: "SHOW" | "REQUIRE" | "HIDE";
            condition: {
                sourceFieldKey: string;
                operator: "in" | "equals" | "notEquals" | "notIn" | "isEmpty" | "isNotEmpty";
                value?: unknown;
            };
        }[];
    }>;
    createNewVersion(formId: string): Promise<{
        draftVersionId: string;
    }>;
}
//# sourceMappingURL=forms.controller.d.ts.map