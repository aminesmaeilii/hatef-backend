import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { evaluateFieldVisibility, normalizeEitaaId, type FormRuleDefinition } from "@hatef/domain";
import type { FormSubmission, FormSubmissionRevision, OnboardingStartResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { EvaluationService } from "../evaluation/evaluation.service";
import { assembleFormVersionDefinition } from "./form-definition.util";

const ONBOARDING_FORM_KEY = "channel-onboarding";
const EITAA_CHANNEL_ID_FIELD_KEY = "eitaa_channel_id";
const CHANNEL_NAME_FIELD_KEY = "channel_name";

@Injectable()
export class FormSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly evaluation: EvaluationService,
  ) {}

  /** Self-service bootstrap: provisions a PENDING channel + CHANNEL_OWNER grant for a brand-new partner, or reuses an existing one, then finds-or-creates the onboarding submission. */
  async startOrResumeOnboarding(actor: RequestActor): Promise<OnboardingStartResponse> {
    const existingMembership = await this.prisma.channelMembership.findFirst({
      where: { userId: actor.userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });

    const channelId = existingMembership ? existingMembership.channelId : await this.provisionChannel(actor.userId);

    const onboardingForm = await this.prisma.form.findUniqueOrThrow({ where: { key: ONBOARDING_FORM_KEY } });
    let submission = await this.prisma.formSubmission.findFirst({
      where: { channelId, formVersion: { formId: onboardingForm.id } },
      orderBy: { createdAt: "desc" },
    });

    if (!submission) {
      const publishedVersion = await this.prisma.formVersion.findFirstOrThrow({
        where: { formId: onboardingForm.id, status: "PUBLISHED" },
      });
      submission = await this.prisma.formSubmission.create({
        data: { formVersionId: publishedVersion.id, channelId, submitterId: actor.userId },
      });
    }

    return { channelId, formSubmissionId: submission.id };
  }

  /** Generic find-or-create, used by any module that needs a channel's submission against a published form without the onboarding-specific channel-provisioning/evaluation side effects (e.g. Phase 6 surveys). */
  async findOrCreateSubmission(channelId: string, formId: string, submitterId: string): Promise<string> {
    let submission = await this.prisma.formSubmission.findFirst({
      where: { channelId, formVersion: { formId } },
      orderBy: { createdAt: "desc" },
    });
    if (!submission) {
      const publishedVersion = await this.prisma.formVersion.findFirstOrThrow({
        where: { formId, status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
      });
      submission = await this.prisma.formSubmission.create({
        data: { formVersionId: publishedVersion.id, channelId, submitterId },
      });
    }
    return submission.id;
  }

  async getSubmission(channelId: string, submissionId: string) {
    const submission = await this.getOwnedSubmissionOrThrow(channelId, submissionId);
    const definition = await assembleFormVersionDefinition(this.prisma, submission.formVersionId);
    const answers = await this.prisma.formAnswer.findMany({ where: { formSubmissionId: submissionId } });
    const openRequest = await this.prisma.informationRequest.findFirst({
      where: { evaluationCase: { formSubmissionId: submissionId }, status: "OPEN" },
    });

    const dto: FormSubmission = {
      id: submission.id,
      formVersionId: submission.formVersionId,
      channelId: submission.channelId,
      status: submission.status,
      currentRevisionNumber: submission.currentRevisionNumber,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      lastAutosaveAt: submission.lastAutosaveAt?.toISOString() ?? null,
      answers: Object.fromEntries(answers.map((a) => [a.formFieldId, a.value])),
      openInformationRequestFieldKeys: (openRequest?.requestedFieldKeys as string[] | undefined) ?? [],
      openInformationRequestMessage: openRequest?.message ?? null,
    };

    const allFields = definition.pages.flatMap((p) => p.sections).flatMap((s) => s.fields);
    const consents = await this.getRequiredConsentDocuments(allFields);

    return { submission: dto, definition, consents };
  }

  async patchAnswers(channelId: string, submissionId: string, answers: Record<string, unknown>): Promise<void> {
    const submission = await this.getOwnedSubmissionOrThrow(channelId, submissionId);

    let allowedFieldIds: Set<string> | null = null;
    if (submission.status === "SUBMITTED") {
      const openRequest = await this.prisma.informationRequest.findFirst({
        where: { evaluationCase: { formSubmissionId: submissionId }, status: "OPEN" },
      });
      if (!openRequest) {
        throw new BadRequestException("این فرم ثبت شده و در حال حاضر قابل ویرایش نیست.");
      }
      const keys = openRequest.requestedFieldKeys as string[];
      const fields = await this.prisma.formField.findMany({
        where: { key: { in: keys }, formSection: { formPage: { formVersionId: submission.formVersionId } } },
      });
      allowedFieldIds = new Set(fields.map((f) => f.id));
    }

    for (const [fieldId, value] of Object.entries(answers)) {
      if (allowedFieldIds && !allowedFieldIds.has(fieldId)) continue;
      await this.prisma.formAnswer.upsert({
        where: { formSubmissionId_formFieldId: { formSubmissionId: submissionId, formFieldId: fieldId } },
        create: { formSubmissionId: submissionId, formFieldId: fieldId, value: value as never },
        update: { value: value as never },
      });
    }

    await this.prisma.formSubmission.update({ where: { id: submissionId }, data: { lastAutosaveAt: new Date() } });
  }

  async getRevisions(channelId: string, submissionId: string): Promise<FormSubmissionRevision[]> {
    await this.getOwnedSubmissionOrThrow(channelId, submissionId);
    const revisions = await this.prisma.formSubmissionRevision.findMany({
      where: { formSubmissionId: submissionId },
      orderBy: { revisionNumber: "asc" },
    });
    return revisions.map((r) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      snapshot: r.snapshot as Record<string, unknown>,
      submittedAt: r.submittedAt.toISOString(),
    }));
  }

  async submit(
    channelId: string,
    submissionId: string,
    acceptedConsentDocumentIds: string[],
    actor: RequestActor,
    ip?: string,
  ): Promise<void> {
    const submission = await this.getOwnedSubmissionOrThrow(channelId, submissionId);
    const definition = await assembleFormVersionDefinition(this.prisma, submission.formVersionId);
    const allFields = definition.pages.flatMap((p) => p.sections).flatMap((s) => s.fields);

    const answerRows = await this.prisma.formAnswer.findMany({ where: { formSubmissionId: submissionId } });
    const answersByFieldId = new Map(answerRows.map((a) => [a.formFieldId, a.value]));
    const answersByKey: Record<string, unknown> = {};
    for (const field of allFields) {
      answersByKey[field.key] = answersByFieldId.get(field.id);
    }

    const rules: FormRuleDefinition[] = definition.rules.map((rule) => ({
      targetFieldKey: allFields.find((f) => f.id === rule.targetFieldId)?.key ?? "",
      action: rule.action,
      condition: rule.condition,
    }));

    const missingLabels: string[] = [];
    for (const field of allFields) {
      const { visible, required } = evaluateFieldVisibility(rules, answersByKey, field.key, field.required);
      if (!visible || !required) continue;
      const value = answersByKey[field.key];
      const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
      if (isEmpty) missingLabels.push(field.label);
    }
    if (missingLabels.length > 0) {
      throw new BadRequestException(`فیلدهای الزامی تکمیل نشده‌اند: ${missingLabels.join("، ")}`);
    }

    // Consent is only collected on the *first* submission — a later field-level
    // correction resubmission doesn't re-litigate terms the partner already
    // accepted (and the wizard's correction view doesn't even render the
    // consent fields again, since it only reopens the flagged fields).
    const isFirstSubmission = submission.currentRevisionNumber === 0;
    const consentDocs = isFirstSubmission ? await this.getRequiredConsentDocuments(allFields) : [];
    const missingConsent = consentDocs.filter((doc) => !acceptedConsentDocumentIds.includes(doc.id));
    if (missingConsent.length > 0) {
      throw new BadRequestException("لازم است با تمام شرایط و قوانین این فرم موافقت کنید.");
    }

    const nextRevisionNumber = submission.currentRevisionNumber + 1;

    await this.prisma.$transaction([
      this.prisma.formSubmissionRevision.create({
        data: {
          formSubmissionId: submissionId,
          revisionNumber: nextRevisionNumber,
          snapshot: answersByKey as never,
          submittedBy: actor.userId,
        },
      }),
      this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: { status: "SUBMITTED", currentRevisionNumber: nextRevisionNumber, submittedAt: new Date() },
      }),
      ...consentDocs.map((doc) =>
        this.prisma.consentAcceptance.create({
          data: { consentDocumentId: doc.id, formSubmissionId: submissionId, userId: actor.userId, ipAddress: ip },
        }),
      ),
    ]);

    await this.syncEitaaChannelId(submission.channelId, answersByKey);
    await this.syncChannelName(submission.channelId, answersByKey);

    // Every form submission drives the evaluation workflow *except* a
    // survey response (Phase 6 surveys reuse this exact generic submit
    // path — spec 10.11 — but must never spawn an EvaluationCase). A
    // narrow, named check (same discipline as syncEitaaChannelId above),
    // not a rewrite of the underlying "any submitted form starts an
    // evaluation" rule Phase 2 established.
    const survey = await this.prisma.survey.findUnique({ where: { formId: definition.formId } });
    if (!survey) {
      await this.evaluation.handleSubmissionSubmitted(submission.channelId, submissionId, actor.userId);
    }

    await this.auditLog.record({
      actorId: actor.userId,
      actorType: "user",
      action: "form_submission.submitted",
      entityType: "form_submission",
      entityId: submissionId,
      metadata: { revisionNumber: nextRevisionNumber },
      ipAddress: ip,
    });
  }

  /** Narrow, named special case — the one form field with a real 1:1 mapping onto Channel.eitaaId. Not a generic form↔entity sync mechanism. */
  private async syncEitaaChannelId(channelId: string, answersByKey: Record<string, unknown>): Promise<void> {
    const rawValue = answersByKey[EITAA_CHANNEL_ID_FIELD_KEY];
    if (typeof rawValue !== "string" || !rawValue.trim()) return;

    try {
      const normalized = normalizeEitaaId(rawValue);
      await this.prisma.channel.update({ where: { id: channelId }, data: { eitaaId: normalized } });
    } catch {
      // Invalid or already-taken eitaaId — leave the placeholder; an evaluator catches this during review.
    }
  }

  /**
   * Every list/queue in admin-web shows Channel.title — this is the only
   * place it's populated from the partner's own answer instead of the
   * placeholder set at provisioning time, so it must run on every
   * submission (including correction resubmissions), not just the first.
   */
  private async syncChannelName(channelId: string, answersByKey: Record<string, unknown>): Promise<void> {
    const rawValue = answersByKey[CHANNEL_NAME_FIELD_KEY];
    if (typeof rawValue !== "string" || !rawValue.trim()) return;

    await this.prisma.channel.update({ where: { id: channelId }, data: { title: rawValue.trim() } });
  }

  private async provisionChannel(userId: string): Promise<string> {
    const ownerRole = await this.prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    const placeholderEitaaId = `pending-${userId.slice(0, 8)}`;

    const channel = await this.prisma.$transaction(async (tx) => {
      const created = await tx.channel.create({
        data: { title: "کانال در انتظار تکمیل اطلاعات", eitaaId: placeholderEitaaId, status: "PENDING" },
      });
      await tx.channelMembership.create({
        data: { userId, channelId: created.id, role: "CHANNEL_OWNER", status: "ACTIVE" },
      });
      await tx.roleAssignment.create({
        data: { userId, roleId: ownerRole.id, resourceType: "channel", resourceId: created.id },
      });
      return created;
    });

    await this.auditLog.record({
      actorId: userId,
      actorType: "user",
      action: "channel.self_provisioned",
      entityType: "channel",
      entityId: channel.id,
    });

    return channel.id;
  }

  /** Only the consent documents this specific form's CONSENT-type fields actually reference — not every consent document platform-wide. */
  private async getRequiredConsentDocuments(fields: { type: string; config: unknown }[]) {
    const consentKeys = fields
      .filter((f) => f.type === "CONSENT")
      .map((f) => (f.config as { consentKey?: string } | null)?.consentKey)
      .filter((key): key is string => Boolean(key));

    if (consentKeys.length === 0) return [];

    const allDocs = await this.prisma.consentDocument.findMany({
      where: { key: { in: consentKeys } },
      orderBy: { version: "desc" },
    });
    const latestByKey = new Map<string, (typeof allDocs)[number]>();
    for (const doc of allDocs) {
      if (!latestByKey.has(doc.key)) latestByKey.set(doc.key, doc);
    }
    return [...latestByKey.values()];
  }

  private async getOwnedSubmissionOrThrow(channelId: string, submissionId: string) {
    const submission = await this.prisma.formSubmission.findFirst({ where: { id: submissionId, channelId } });
    if (!submission) {
      throw new NotFoundException("فرم مورد نظر یافت نشد.");
    }
    return submission;
  }
}
