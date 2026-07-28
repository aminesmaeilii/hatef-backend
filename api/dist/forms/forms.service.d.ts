import type { CreateForm, CreateFormField, CreateFormRule, FormSummary, FormVersionDefinition } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
export declare class FormsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createForm(input: CreateForm): Promise<{
        formId: string;
        draftVersionId: string;
    }>;
    /**
     * Once a form is published with no draft left, the builder page has
     * nothing left to edit — this is the only way out of that dead end. It
     * deep-copies the latest version's pages/sections/fields/options/rules
     * into a new DRAFT version (remapping FormRule.targetFieldId onto the
     * copies' new ids) so editing starts from the real current structure
     * instead of an empty form. Idempotent: returns the existing draft if one
     * was already created.
     */
    createNewDraftVersion(formId: string): Promise<{
        draftVersionId: string;
    }>;
    listForms(): Promise<FormSummary[]>;
    getForm(formId: string): Promise<{
        id: string;
        key: string;
        title: string;
        draft: FormVersionDefinition | null;
        published: FormVersionDefinition | null;
    }>;
    getPublishedDefinition(formKey: string): Promise<FormVersionDefinition>;
    addPage(formId: string, input: {
        title: string;
        description?: string;
    }): Promise<{
        id: string;
        description: string | null;
        title: string;
        order: number;
        formVersionId: string;
    }>;
    addSection(pageId: string, input: {
        title: string;
        description?: string;
    }): Promise<{
        id: string;
        description: string | null;
        title: string;
        order: number;
        formPageId: string;
    }>;
    addField(sectionId: string, input: CreateFormField): Promise<{
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
    addRule(formVersionId: string, input: CreateFormRule): Promise<{
        id: string;
        createdAt: Date;
        action: import("@hatef/database").$Enums.FormRuleAction;
        targetFieldId: string;
        condition: import("@hatef/database/generated/client/runtime/library").JsonValue;
        formVersionId: string;
    }>;
    reorderPages(formVersionId: string, orderedIds: string[]): Promise<void>;
    reorderSections(formPageId: string, orderedIds: string[]): Promise<void>;
    reorderFields(formSectionId: string, orderedIds: string[]): Promise<void>;
    deletePage(pageId: string): Promise<void>;
    deleteSection(sectionId: string): Promise<void>;
    deleteField(fieldId: string): Promise<void>;
    deleteRule(ruleId: string): Promise<void>;
    publish(formId: string): Promise<FormVersionDefinition>;
    /** Finds the form's current DRAFT version, cloning the latest published/archived one into a fresh draft if none exists yet. */
    private requireDraftVersionForForm;
    private cloneVersionContent;
}
//# sourceMappingURL=forms.service.d.ts.map