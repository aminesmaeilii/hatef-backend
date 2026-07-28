import { z } from "zod";

export const formFieldTypeSchema = z.enum([
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
export type FormFieldTypeKey = z.infer<typeof formFieldTypeSchema>;

export const formRuleOperatorSchema = z.enum(["equals", "notEquals", "in", "notIn", "isEmpty", "isNotEmpty"]);
export const formRuleActionSchema = z.enum(["SHOW", "REQUIRE", "HIDE"]);

export const formRuleConditionSchema = z.object({
  sourceFieldKey: z.string(),
  operator: formRuleOperatorSchema,
  value: z.unknown().optional(),
});
export type FormRuleCondition = z.infer<typeof formRuleConditionSchema>;

export const formFieldOptionSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  value: z.string(),
  label: z.string(),
});
export type FormFieldOption = z.infer<typeof formFieldOptionSchema>;

export const formFieldSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  key: z.string(),
  label: z.string(),
  type: formFieldTypeSchema,
  required: z.boolean(),
  helpText: z.string().nullable(),
  placeholder: z.string().nullable(),
  config: z.unknown().nullable(),
  options: z.array(formFieldOptionSchema),
});
export type FormField = z.infer<typeof formFieldSchema>;

export const formRuleSchema = z.object({
  id: z.string(),
  targetFieldId: z.string(),
  action: formRuleActionSchema,
  condition: formRuleConditionSchema,
});
export type FormRule = z.infer<typeof formRuleSchema>;

export const formSectionSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  fields: z.array(formFieldSchema),
});
export type FormSection = z.infer<typeof formSectionSchema>;

export const formPageSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  sections: z.array(formSectionSchema),
});
export type FormPage = z.infer<typeof formPageSchema>;

export const formVersionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const formVersionSchema = z.object({
  id: z.string(),
  formId: z.string(),
  versionNumber: z.number().int(),
  status: formVersionStatusSchema,
  publishedAt: z.iso.datetime().nullable(),
  pages: z.array(formPageSchema),
  rules: z.array(formRuleSchema),
});
export type FormVersionDefinition = z.infer<typeof formVersionSchema>;

export const formSummarySchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  draftVersionId: z.string().nullable(),
  publishedVersionId: z.string().nullable(),
});
export type FormSummary = z.infer<typeof formSummarySchema>;

export const createFormSchema = z.object({
  key: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
});
export type CreateForm = z.infer<typeof createFormSchema>;

export const createFormPageSchema = z.object({ title: z.string().min(1), description: z.string().optional() });
export const createFormSectionSchema = z.object({ title: z.string().min(1), description: z.string().optional() });

export const createFormFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: formFieldTypeSchema,
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  config: z.unknown().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
export type CreateFormField = z.infer<typeof createFormFieldSchema>;

export const createFormRuleSchema = z.object({
  targetFieldId: z.string(),
  action: formRuleActionSchema,
  condition: formRuleConditionSchema,
});
export type CreateFormRule = z.infer<typeof createFormRuleSchema>;

export const reorderSchema = z.object({ orderedIds: z.array(z.string()).min(1) });
export type Reorder = z.infer<typeof reorderSchema>;

export const patchAnswersSchema = z.object({ answers: z.record(z.string(), z.unknown()) });
export type PatchAnswers = z.infer<typeof patchAnswersSchema>;

export const submitFormSubmissionSchema = z.object({
  acceptedConsentDocumentIds: z.array(z.string()),
});
export type SubmitFormSubmission = z.infer<typeof submitFormSubmissionSchema>;

export const formSubmissionStatusSchema = z.enum(["DRAFT", "SUBMITTED"]);

export const formSubmissionSchema = z.object({
  id: z.string(),
  formVersionId: z.string(),
  channelId: z.string(),
  status: formSubmissionStatusSchema,
  currentRevisionNumber: z.number().int(),
  submittedAt: z.iso.datetime().nullable(),
  lastAutosaveAt: z.iso.datetime().nullable(),
  answers: z.record(z.string(), z.unknown()),
  openInformationRequestFieldKeys: z.array(z.string()),
  openInformationRequestMessage: z.string().nullable(),
});
export type FormSubmission = z.infer<typeof formSubmissionSchema>;

export const formSubmissionRevisionSchema = z.object({
  id: z.string(),
  revisionNumber: z.number().int(),
  snapshot: z.record(z.string(), z.unknown()),
  submittedAt: z.iso.datetime(),
});
export type FormSubmissionRevision = z.infer<typeof formSubmissionRevisionSchema>;

export const consentDocumentSchema = z.object({
  id: z.string(),
  key: z.string(),
  version: z.number().int(),
  title: z.string(),
  body: z.string(),
});
export type ConsentDocument = z.infer<typeof consentDocumentSchema>;

export const onboardingStartResponseSchema = z.object({
  channelId: z.string(),
  formSubmissionId: z.string(),
});
export type OnboardingStartResponse = z.infer<typeof onboardingStartResponseSchema>;
