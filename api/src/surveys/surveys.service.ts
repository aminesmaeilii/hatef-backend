import { BadRequestException, Injectable } from "@nestjs/common";
import type { CreateSurvey, QuestionBreakdown, Survey, SurveyAnalytics } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import type { RequestActor } from "../session/actor.types";
import { FormSubmissionsService } from "../forms/form-submissions.service";
import { assembleFormVersionDefinition } from "../forms/form-definition.util";

@Injectable()
export class SurveysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formSubmissions: FormSubmissionsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Spec 10.11: "reuse the same form engine rather than creating a second incompatible system" — this only adds distribution metadata on top of an existing Form. */
  async create(input: CreateSurvey, actor: RequestActor): Promise<Survey> {
    const form = await this.prisma.form.findUniqueOrThrow({ where: { id: input.formId } });
    const created = await this.prisma.survey.create({
      data: {
        formId: input.formId,
        title: input.title,
        targetChannelIds: input.targetChannelIds,
        opensAt: input.opensAt ? new Date(input.opensAt) : undefined,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
        createdById: actor.userId,
      },
    });

    await this.auditLog.record({ actorId: actor.userId, actorType: "user", action: "survey.created", entityType: "survey", entityId: created.id });

    return toSurveyDto(created, form);
  }

  async transition(surveyId: string, status: Survey["status"], actor: RequestActor): Promise<Survey> {
    const survey = await this.prisma.survey.findUniqueOrThrow({ where: { id: surveyId }, include: { form: true } });
    if (status === "OPEN") {
      const publishedVersion = await this.prisma.formVersion.findFirst({ where: { formId: survey.formId, status: "PUBLISHED" } });
      if (!publishedVersion) {
        throw new BadRequestException("این نظرسنجی هنوز نسخه منتشرشده‌ای از فرم ندارد.");
      }
    }
    const updated = await this.prisma.survey.update({ where: { id: surveyId }, data: { status }, include: { form: true } });
    await this.auditLog.record({ actorId: actor.userId, actorType: "user", action: "survey.transitioned", entityType: "survey", entityId: surveyId, metadata: { status } });
    return toSurveyDto(updated, updated.form);
  }

  async list(): Promise<Survey[]> {
    const rows = await this.prisma.survey.findMany({ include: { form: true }, orderBy: { createdAt: "desc" } });
    return rows.map((r) => toSurveyDto(r, r.form));
  }

  /** Only surveys currently open, targeting this channel (or every channel if untargeted), and within their open/close window. */
  async listForChannel(channelId: string): Promise<Survey[]> {
    const now = new Date();
    const rows = await this.prisma.survey.findMany({ where: { status: "OPEN" }, include: { form: true } });
    return rows
      .filter((r) => r.targetChannelIds.length === 0 || r.targetChannelIds.includes(channelId))
      .filter((r) => !r.opensAt || r.opensAt <= now)
      .filter((r) => !r.closesAt || r.closesAt >= now)
      .map((r) => toSurveyDto(r, r.form));
  }

  async startOrResume(surveyId: string, channelId: string, actor: RequestActor): Promise<{ formSubmissionId: string }> {
    const survey = await this.prisma.survey.findUniqueOrThrow({ where: { id: surveyId } });
    if (survey.status !== "OPEN") {
      throw new BadRequestException("این نظرسنجی در حال حاضر باز نیست.");
    }
    if (survey.targetChannelIds.length > 0 && !survey.targetChannelIds.includes(channelId)) {
      throw new BadRequestException("این نظرسنجی برای کانال شما در دسترس نیست.");
    }
    const formSubmissionId = await this.formSubmissions.findOrCreateSubmission(channelId, survey.formId, actor.userId);
    return { formSubmissionId };
  }

  async getAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.prisma.survey.findUniqueOrThrow({ where: { id: surveyId } });
    const publishedVersion = await this.prisma.formVersion.findFirst({
      where: { formId: survey.formId, status: { in: ["PUBLISHED", "ARCHIVED"] } },
      orderBy: { versionNumber: "desc" },
    });
    if (!publishedVersion) {
      return { surveyId, startedCount: 0, submittedCount: 0, completionRate: 0, questionBreakdown: [] };
    }

    const definition = await assembleFormVersionDefinition(this.prisma, publishedVersion.id);
    const allFields = definition.pages.flatMap((p) => p.sections).flatMap((s) => s.fields);

    const submissions = await this.prisma.formSubmission.findMany({
      where: { formVersion: { formId: survey.formId } },
      include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } },
    });
    const startedCount = submissions.length;
    const submitted = submissions.filter((s) => s.status === "SUBMITTED" && s.revisions.length > 0);
    const submittedCount = submitted.length;

    const snapshots = submitted.map((s) => s.revisions[0]!.snapshot as Record<string, unknown>);

    const questionBreakdown: QuestionBreakdown[] = allFields.map((field) => {
      const values = snapshots.map((s) => s[field.key]).filter((v) => v !== undefined && v !== null && v !== "");

      if (field.type === "SINGLE_SELECT" || field.type === "MULTI_SELECT") {
        const counts = new Map<string, number>();
        for (const v of values) {
          for (const item of Array.isArray(v) ? v : [v]) counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
        }
        return {
          fieldKey: field.key,
          label: field.label,
          type: field.type,
          responseCount: values.length,
          optionCounts: field.options.map((o) => ({ value: o.value, label: o.label, count: counts.get(o.value) ?? 0 })),
        };
      }

      if (field.type === "NUMBER") {
        const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        return {
          fieldKey: field.key,
          label: field.label,
          type: field.type,
          responseCount: values.length,
          numericSummary: nums.length > 0 ? { min: Math.min(...nums), max: Math.max(...nums), avg: nums.reduce((a, b) => a + b, 0) / nums.length } : undefined,
        };
      }

      return { fieldKey: field.key, label: field.label, type: field.type, responseCount: values.length };
    });

    return {
      surveyId,
      startedCount,
      submittedCount,
      completionRate: startedCount > 0 ? submittedCount / startedCount : 0,
      questionBreakdown,
    };
  }
}

function toSurveyDto(s: { id: string; formId: string; title: string; status: string; targetChannelIds: string[]; opensAt: Date | null; closesAt: Date | null; createdAt: Date }, form: { key: string; title: string }): Survey {
  return {
    id: s.id,
    formId: s.formId,
    formKey: form.key,
    formTitle: form.title,
    title: s.title,
    status: s.status as Survey["status"],
    targetChannelIds: s.targetChannelIds,
    opensAt: s.opensAt?.toISOString() ?? null,
    closesAt: s.closesAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}
