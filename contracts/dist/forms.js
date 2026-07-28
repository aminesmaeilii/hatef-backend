"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingStartResponseSchema = exports.consentDocumentSchema = exports.formSubmissionRevisionSchema = exports.formSubmissionSchema = exports.formSubmissionStatusSchema = exports.submitFormSubmissionSchema = exports.patchAnswersSchema = exports.reorderSchema = exports.createFormRuleSchema = exports.createFormFieldSchema = exports.createFormSectionSchema = exports.createFormPageSchema = exports.createFormSchema = exports.formSummarySchema = exports.formVersionSchema = exports.formVersionStatusSchema = exports.formPageSchema = exports.formSectionSchema = exports.formRuleSchema = exports.formFieldSchema = exports.formFieldOptionSchema = exports.formRuleConditionSchema = exports.formRuleActionSchema = exports.formRuleOperatorSchema = exports.formFieldTypeSchema = void 0;
const zod_1 = require("zod");
exports.formFieldTypeSchema = zod_1.z.enum([
    "TEXT",
    "LONG_TEXT",
    "PHONE",
    "NUMBER",
    "JALALI_DATE",
    "SINGLE_SELECT",
    "MULTI_SELECT",
    "REPEATABLE_GROUP",
    "IMAGE",
    "DOCUMENT",
    "LINK",
    "CONSENT",
]);
exports.formRuleOperatorSchema = zod_1.z.enum(["equals", "notEquals", "in", "notIn", "isEmpty", "isNotEmpty"]);
exports.formRuleActionSchema = zod_1.z.enum(["SHOW", "REQUIRE", "HIDE"]);
exports.formRuleConditionSchema = zod_1.z.object({
    sourceFieldKey: zod_1.z.string(),
    operator: exports.formRuleOperatorSchema,
    value: zod_1.z.unknown().optional(),
});
exports.formFieldOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order: zod_1.z.number().int(),
    value: zod_1.z.string(),
    label: zod_1.z.string(),
});
exports.formFieldSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order: zod_1.z.number().int(),
    key: zod_1.z.string(),
    label: zod_1.z.string(),
    type: exports.formFieldTypeSchema,
    required: zod_1.z.boolean(),
    helpText: zod_1.z.string().nullable(),
    placeholder: zod_1.z.string().nullable(),
    config: zod_1.z.unknown().nullable(),
    options: zod_1.z.array(exports.formFieldOptionSchema),
});
exports.formRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    targetFieldId: zod_1.z.string(),
    action: exports.formRuleActionSchema,
    condition: exports.formRuleConditionSchema,
});
exports.formSectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order: zod_1.z.number().int(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    fields: zod_1.z.array(exports.formFieldSchema),
});
exports.formPageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order: zod_1.z.number().int(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    sections: zod_1.z.array(exports.formSectionSchema),
});
exports.formVersionStatusSchema = zod_1.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
exports.formVersionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    formId: zod_1.z.string(),
    versionNumber: zod_1.z.number().int(),
    status: exports.formVersionStatusSchema,
    publishedAt: zod_1.z.iso.datetime().nullable(),
    pages: zod_1.z.array(exports.formPageSchema),
    rules: zod_1.z.array(exports.formRuleSchema),
});
exports.formSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    draftVersionId: zod_1.z.string().nullable(),
    publishedVersionId: zod_1.z.string().nullable(),
});
exports.createFormSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).optional(),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.createFormPageSchema = zod_1.z.object({ title: zod_1.z.string().min(1), description: zod_1.z.string().optional() });
exports.createFormSectionSchema = zod_1.z.object({ title: zod_1.z.string().min(1), description: zod_1.z.string().optional() });
exports.createFormFieldSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1),
    type: exports.formFieldTypeSchema,
    required: zod_1.z.boolean().default(false),
    helpText: zod_1.z.string().optional(),
    placeholder: zod_1.z.string().optional(),
    config: zod_1.z.unknown().optional(),
    options: zod_1.z.array(zod_1.z.object({ value: zod_1.z.string(), label: zod_1.z.string() })).optional(),
});
exports.createFormRuleSchema = zod_1.z.object({
    targetFieldId: zod_1.z.string(),
    action: exports.formRuleActionSchema,
    condition: exports.formRuleConditionSchema,
});
exports.reorderSchema = zod_1.z.object({ orderedIds: zod_1.z.array(zod_1.z.string()).min(1) });
exports.patchAnswersSchema = zod_1.z.object({ answers: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()) });
exports.submitFormSubmissionSchema = zod_1.z.object({
    acceptedConsentDocumentIds: zod_1.z.array(zod_1.z.string()),
});
exports.formSubmissionStatusSchema = zod_1.z.enum(["DRAFT", "SUBMITTED"]);
exports.formSubmissionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    formVersionId: zod_1.z.string(),
    channelId: zod_1.z.string(),
    status: exports.formSubmissionStatusSchema,
    currentRevisionNumber: zod_1.z.number().int(),
    submittedAt: zod_1.z.iso.datetime().nullable(),
    lastAutosaveAt: zod_1.z.iso.datetime().nullable(),
    answers: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    openInformationRequestFieldKeys: zod_1.z.array(zod_1.z.string()),
    openInformationRequestMessage: zod_1.z.string().nullable(),
});
exports.formSubmissionRevisionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    revisionNumber: zod_1.z.number().int(),
    snapshot: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    submittedAt: zod_1.z.iso.datetime(),
});
exports.consentDocumentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    version: zod_1.z.number().int(),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
});
exports.onboardingStartResponseSchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    formSubmissionId: zod_1.z.string(),
});
