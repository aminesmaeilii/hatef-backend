import { FormsService } from "./forms.service";
/** Any authenticated user (internal or partner) may read a published form's structure — it's what gets rendered to fill out, not sensitive. */
export declare class PublishedFormsController {
    private readonly forms;
    constructor(forms: FormsService);
    getPublished(key: string): Promise<{
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
}
//# sourceMappingURL=published-forms.controller.d.ts.map