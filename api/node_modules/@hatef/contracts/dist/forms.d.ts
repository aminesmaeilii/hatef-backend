import { z } from "zod";
export declare const formFieldTypeSchema: z.ZodEnum<{
    TEXT: "TEXT";
    LONG_TEXT: "LONG_TEXT";
    PHONE: "PHONE";
    NUMBER: "NUMBER";
    JALALI_DATE: "JALALI_DATE";
    SINGLE_SELECT: "SINGLE_SELECT";
    MULTI_SELECT: "MULTI_SELECT";
    REPEATABLE_GROUP: "REPEATABLE_GROUP";
    IMAGE: "IMAGE";
    DOCUMENT: "DOCUMENT";
    LINK: "LINK";
    CONSENT: "CONSENT";
}>;
export type FormFieldTypeKey = z.infer<typeof formFieldTypeSchema>;
export declare const formRuleOperatorSchema: z.ZodEnum<{
    in: "in";
    equals: "equals";
    notEquals: "notEquals";
    notIn: "notIn";
    isEmpty: "isEmpty";
    isNotEmpty: "isNotEmpty";
}>;
export declare const formRuleActionSchema: z.ZodEnum<{
    SHOW: "SHOW";
    REQUIRE: "REQUIRE";
    HIDE: "HIDE";
}>;
export declare const formRuleConditionSchema: z.ZodObject<{
    sourceFieldKey: z.ZodString;
    operator: z.ZodEnum<{
        in: "in";
        equals: "equals";
        notEquals: "notEquals";
        notIn: "notIn";
        isEmpty: "isEmpty";
        isNotEmpty: "isNotEmpty";
    }>;
    value: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
export type FormRuleCondition = z.infer<typeof formRuleConditionSchema>;
export declare const formFieldOptionSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    value: z.ZodString;
    label: z.ZodString;
}, z.core.$strip>;
export type FormFieldOption = z.infer<typeof formFieldOptionSchema>;
export declare const formFieldSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    key: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<{
        TEXT: "TEXT";
        LONG_TEXT: "LONG_TEXT";
        PHONE: "PHONE";
        NUMBER: "NUMBER";
        JALALI_DATE: "JALALI_DATE";
        SINGLE_SELECT: "SINGLE_SELECT";
        MULTI_SELECT: "MULTI_SELECT";
        REPEATABLE_GROUP: "REPEATABLE_GROUP";
        IMAGE: "IMAGE";
        DOCUMENT: "DOCUMENT";
        LINK: "LINK";
        CONSENT: "CONSENT";
    }>;
    required: z.ZodBoolean;
    helpText: z.ZodNullable<z.ZodString>;
    placeholder: z.ZodNullable<z.ZodString>;
    config: z.ZodNullable<z.ZodUnknown>;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        value: z.ZodString;
        label: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FormField = z.infer<typeof formFieldSchema>;
export declare const formRuleSchema: z.ZodObject<{
    id: z.ZodString;
    targetFieldId: z.ZodString;
    action: z.ZodEnum<{
        SHOW: "SHOW";
        REQUIRE: "REQUIRE";
        HIDE: "HIDE";
    }>;
    condition: z.ZodObject<{
        sourceFieldKey: z.ZodString;
        operator: z.ZodEnum<{
            in: "in";
            equals: "equals";
            notEquals: "notEquals";
            notIn: "notIn";
            isEmpty: "isEmpty";
            isNotEmpty: "isNotEmpty";
        }>;
        value: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type FormRule = z.infer<typeof formRuleSchema>;
export declare const formSectionSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    fields: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        key: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<{
            TEXT: "TEXT";
            LONG_TEXT: "LONG_TEXT";
            PHONE: "PHONE";
            NUMBER: "NUMBER";
            JALALI_DATE: "JALALI_DATE";
            SINGLE_SELECT: "SINGLE_SELECT";
            MULTI_SELECT: "MULTI_SELECT";
            REPEATABLE_GROUP: "REPEATABLE_GROUP";
            IMAGE: "IMAGE";
            DOCUMENT: "DOCUMENT";
            LINK: "LINK";
            CONSENT: "CONSENT";
        }>;
        required: z.ZodBoolean;
        helpText: z.ZodNullable<z.ZodString>;
        placeholder: z.ZodNullable<z.ZodString>;
        config: z.ZodNullable<z.ZodUnknown>;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FormSection = z.infer<typeof formSectionSchema>;
export declare const formPageSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            key: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<{
                TEXT: "TEXT";
                LONG_TEXT: "LONG_TEXT";
                PHONE: "PHONE";
                NUMBER: "NUMBER";
                JALALI_DATE: "JALALI_DATE";
                SINGLE_SELECT: "SINGLE_SELECT";
                MULTI_SELECT: "MULTI_SELECT";
                REPEATABLE_GROUP: "REPEATABLE_GROUP";
                IMAGE: "IMAGE";
                DOCUMENT: "DOCUMENT";
                LINK: "LINK";
                CONSENT: "CONSENT";
            }>;
            required: z.ZodBoolean;
            helpText: z.ZodNullable<z.ZodString>;
            placeholder: z.ZodNullable<z.ZodString>;
            config: z.ZodNullable<z.ZodUnknown>;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                order: z.ZodNumber;
                value: z.ZodString;
                label: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FormPage = z.infer<typeof formPageSchema>;
export declare const formVersionStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const formVersionSchema: z.ZodObject<{
    id: z.ZodString;
    formId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
    publishedAt: z.ZodNullable<z.ZodISODateTime>;
    pages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            title: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            fields: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                order: z.ZodNumber;
                key: z.ZodString;
                label: z.ZodString;
                type: z.ZodEnum<{
                    TEXT: "TEXT";
                    LONG_TEXT: "LONG_TEXT";
                    PHONE: "PHONE";
                    NUMBER: "NUMBER";
                    JALALI_DATE: "JALALI_DATE";
                    SINGLE_SELECT: "SINGLE_SELECT";
                    MULTI_SELECT: "MULTI_SELECT";
                    REPEATABLE_GROUP: "REPEATABLE_GROUP";
                    IMAGE: "IMAGE";
                    DOCUMENT: "DOCUMENT";
                    LINK: "LINK";
                    CONSENT: "CONSENT";
                }>;
                required: z.ZodBoolean;
                helpText: z.ZodNullable<z.ZodString>;
                placeholder: z.ZodNullable<z.ZodString>;
                config: z.ZodNullable<z.ZodUnknown>;
                options: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    value: z.ZodString;
                    label: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    rules: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        targetFieldId: z.ZodString;
        action: z.ZodEnum<{
            SHOW: "SHOW";
            REQUIRE: "REQUIRE";
            HIDE: "HIDE";
        }>;
        condition: z.ZodObject<{
            sourceFieldKey: z.ZodString;
            operator: z.ZodEnum<{
                in: "in";
                equals: "equals";
                notEquals: "notEquals";
                notIn: "notIn";
                isEmpty: "isEmpty";
                isNotEmpty: "isNotEmpty";
            }>;
            value: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FormVersionDefinition = z.infer<typeof formVersionSchema>;
export declare const formSummarySchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    draftVersionId: z.ZodNullable<z.ZodString>;
    publishedVersionId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type FormSummary = z.infer<typeof formSummarySchema>;
export declare const createFormSchema: z.ZodObject<{
    key: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateForm = z.infer<typeof createFormSchema>;
export declare const createFormPageSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createFormSectionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createFormFieldSchema: z.ZodObject<{
    key: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<{
        TEXT: "TEXT";
        LONG_TEXT: "LONG_TEXT";
        PHONE: "PHONE";
        NUMBER: "NUMBER";
        JALALI_DATE: "JALALI_DATE";
        SINGLE_SELECT: "SINGLE_SELECT";
        MULTI_SELECT: "MULTI_SELECT";
        REPEATABLE_GROUP: "REPEATABLE_GROUP";
        IMAGE: "IMAGE";
        DOCUMENT: "DOCUMENT";
        LINK: "LINK";
        CONSENT: "CONSENT";
    }>;
    required: z.ZodDefault<z.ZodBoolean>;
    helpText: z.ZodOptional<z.ZodString>;
    placeholder: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodUnknown>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateFormField = z.infer<typeof createFormFieldSchema>;
export declare const createFormRuleSchema: z.ZodObject<{
    targetFieldId: z.ZodString;
    action: z.ZodEnum<{
        SHOW: "SHOW";
        REQUIRE: "REQUIRE";
        HIDE: "HIDE";
    }>;
    condition: z.ZodObject<{
        sourceFieldKey: z.ZodString;
        operator: z.ZodEnum<{
            in: "in";
            equals: "equals";
            notEquals: "notEquals";
            notIn: "notIn";
            isEmpty: "isEmpty";
            isNotEmpty: "isNotEmpty";
        }>;
        value: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateFormRule = z.infer<typeof createFormRuleSchema>;
export declare const reorderSchema: z.ZodObject<{
    orderedIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type Reorder = z.infer<typeof reorderSchema>;
export declare const patchAnswersSchema: z.ZodObject<{
    answers: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type PatchAnswers = z.infer<typeof patchAnswersSchema>;
export declare const submitFormSubmissionSchema: z.ZodObject<{
    acceptedConsentDocumentIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SubmitFormSubmission = z.infer<typeof submitFormSubmissionSchema>;
export declare const formSubmissionStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    SUBMITTED: "SUBMITTED";
}>;
export declare const formSubmissionSchema: z.ZodObject<{
    id: z.ZodString;
    formVersionId: z.ZodString;
    channelId: z.ZodString;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        SUBMITTED: "SUBMITTED";
    }>;
    currentRevisionNumber: z.ZodNumber;
    submittedAt: z.ZodNullable<z.ZodISODateTime>;
    lastAutosaveAt: z.ZodNullable<z.ZodISODateTime>;
    answers: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    openInformationRequestFieldKeys: z.ZodArray<z.ZodString>;
    openInformationRequestMessage: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type FormSubmission = z.infer<typeof formSubmissionSchema>;
export declare const formSubmissionRevisionSchema: z.ZodObject<{
    id: z.ZodString;
    revisionNumber: z.ZodNumber;
    snapshot: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    submittedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type FormSubmissionRevision = z.infer<typeof formSubmissionRevisionSchema>;
export declare const consentDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    version: z.ZodNumber;
    title: z.ZodString;
    body: z.ZodString;
}, z.core.$strip>;
export type ConsentDocument = z.infer<typeof consentDocumentSchema>;
export declare const onboardingStartResponseSchema: z.ZodObject<{
    channelId: z.ZodString;
    formSubmissionId: z.ZodString;
}, z.core.$strip>;
export type OnboardingStartResponse = z.infer<typeof onboardingStartResponseSchema>;
//# sourceMappingURL=forms.d.ts.map