import { BadRequestException, Injectable } from "@nestjs/common";
import { IllegalStateTransitionError } from "@hatef/domain";
import type {
  AssignEvaluator,
  DecideCase,
  EvaluationCaseStatusKey,
  RequestCorrection,
  SubmitScore,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { assembleFormVersionDefinition } from "../forms/form-definition.util";
import { ADVANCE_TARGET, evaluationStateMachine, toPartnerFacingStatus } from "./evaluation-state-machine";

interface TransitionOptions {
  actorId?: string;
  note?: string;
  partnerVisible: boolean;
}

/**
 * Canned decision text (spec ask: no free-text reason, internal or
 * partner-facing, on the decide action — a management decision is a
 * one-click action, not a form). `partnerVisibleReason` doubles as the SMS
 * body sent automatically to the channel owner.
 */
const DECISION_TEXT: Record<DecideCase["decision"], { internalReason: string; partnerVisibleReason: string }> = {
  APPROVED: {
    internalReason: "تأیید نهایی کانال توسط مدیر ارزیابی.",
    partnerVisibleReason: "کانال شما با موفقیت بررسی و تایید شد.",
  },
  CONDITIONALLY_APPROVED: {
    internalReason: "تأیید مشروط کانال توسط مدیر ارزیابی.",
    partnerVisibleReason: "کانال شما به صورت مشروط تایید شد.",
  },
  WAITLISTED: {
    internalReason: "کانال در فهرست انتظار قرار گرفت.",
    partnerVisibleReason: "کانال شما در فهرست انتظار قرار گرفت و در دوره‌های بعد بررسی می‌شود.",
  },
  REJECTED: {
    internalReason: "کانال توسط مدیر ارزیابی رد شد.",
    partnerVisibleReason: "متاسفانه درخواست همکاری کانال شما در این مرحله تایید نشد.",
  },
};

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Creates the case on first submission, or advances it on a correction resubmission. Called by FormSubmissionsService.submit(). */
  async handleSubmissionSubmitted(channelId: string, formSubmissionId: string, actorId: string): Promise<void> {
    let evaluationCase = await this.prisma.evaluationCase.findUnique({ where: { formSubmissionId } });
    if (!evaluationCase) {
      evaluationCase = await this.prisma.evaluationCase.create({
        data: { channelId, formSubmissionId, status: "DRAFT" },
      });
    }

    const target = evaluationCase.status === "NEEDS_CHANGES" ? "RESUBMITTED" : "SUBMITTED";
    await this.transition(evaluationCase.id, target, { actorId, partnerVisible: true });

    if (target === "RESUBMITTED") {
      await this.prisma.informationRequest.updateMany({
        where: { evaluationCaseId: evaluationCase.id, status: "OPEN" },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
    }
  }

  async listQueue(statusFilter?: EvaluationCaseStatusKey, channelId?: string) {
    const cases = await this.prisma.evaluationCase.findMany({
      where: { ...(statusFilter ? { status: statusFilter } : {}), ...(channelId ? { channelId } : {}) },
      include: { channel: { select: { title: true, eitaaId: true } }, assignments: true },
      orderBy: { updatedAt: "desc" },
    });

    return cases.map((c) => ({
      id: c.id,
      channelId: c.channelId,
      channelTitle: c.channel.title,
      status: c.status,
      slaDueAt: c.slaDueAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      assignedEvaluatorIds: c.assignments.filter((a) => !a.unassignedAt).map((a) => a.evaluatorId),
    }));
  }

  async getCaseDetail(caseId: string) {
    const evalCase = await this.prisma.evaluationCase.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        channel: true,
        assignments: { include: { evaluator: { select: { displayName: true } } } },
        scores: true,
        decisions: true,
        infoRequests: true,
        notes: true,
        statusEvents: { orderBy: { createdAt: "asc" } },
        formSubmission: { include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } } },
      },
    });

    const definition = await assembleFormVersionDefinition(this.prisma, evalCase.formSubmission.formVersionId);
    const latestRevision = evalCase.formSubmission.revisions[0];

    return {
      id: evalCase.id,
      channelId: evalCase.channelId,
      channelTitle: evalCase.channel.title,
      status: evalCase.status,
      formSubmissionId: evalCase.formSubmissionId,
      definition,
      latestAnswers: latestRevision?.snapshot ?? null,
      assignments: evalCase.assignments.map((a) => ({
        id: a.id,
        evaluatorId: a.evaluatorId,
        evaluatorName: a.evaluator.displayName,
        role: a.role,
        conflictDeclared: a.conflictDeclared,
        assignedAt: a.assignedAt.toISOString(),
      })),
      scores: evalCase.scores,
      decisions: evalCase.decisions,
      infoRequests: evalCase.infoRequests,
      notes: evalCase.notes,
      statusEvents: evalCase.statusEvents,
    };
  }

  async getPartnerAssessment(channelId: string) {
    const evalCase = await this.prisma.evaluationCase.findFirst({
      where: { channelId },
      include: {
        infoRequests: { where: { status: "OPEN" } },
        statusEvents: { where: { partnerVisible: true }, orderBy: { createdAt: "asc" } },
        decisions: { orderBy: { decidedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!evalCase) {
      return { status: null, openInformationRequest: null, timeline: [], partnerVisibleReason: null };
    }

    const openRequest = evalCase.infoRequests[0];
    return {
      status: toPartnerFacingStatus(evalCase.status),
      openInformationRequest: openRequest
        ? { requestedFieldKeys: openRequest.requestedFieldKeys as string[], message: openRequest.message }
        : null,
      timeline: evalCase.statusEvents.map((e) => ({
        id: e.id,
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      partnerVisibleReason: evalCase.decisions[0]?.partnerVisibleReason ?? null,
    };
  }

  async assign(caseId: string, input: AssignEvaluator, actorId: string): Promise<void> {
    await this.prisma.evaluationAssignment.create({
      data: { evaluationCaseId: caseId, evaluatorId: input.evaluatorId, role: input.role },
    });
    await this.auditLog.record({
      actorId,
      actorType: "user",
      action: "evaluation_case.assigned",
      entityType: "evaluation_case",
      entityId: caseId,
      metadata: { evaluatorId: input.evaluatorId, role: input.role },
    });
  }

  async advance(caseId: string, actorId: string): Promise<void> {
    const evalCase = await this.prisma.evaluationCase.findUniqueOrThrow({ where: { id: caseId } });
    const target = ADVANCE_TARGET[evalCase.status];
    if (!target) {
      throw new BadRequestException("این پرونده در وضعیتی نیست که با این عملیات قابل پیشروی باشد.");
    }
    await this.transition(caseId, target, { actorId, partnerVisible: false });
  }

  async requestCorrection(caseId: string, input: RequestCorrection, actorId: string): Promise<void> {
    const request = await this.prisma.informationRequest.create({
      data: {
        evaluationCaseId: caseId,
        requestedFieldKeys: input.requestedFieldKeys as never,
        message: input.message,
        createdBy: actorId,
      },
    });
    await this.transition(caseId, "NEEDS_CHANGES", { actorId, note: input.message, partnerVisible: true });

    const submitterId = await this.getSubmitterId(caseId);
    if (submitterId) {
      await this.notifications.notify({
        userId: submitterId,
        eventType: "evaluation.correction_requested",
        dedupeKey: `information-request:${request.id}`,
        title: "درخواست اصلاح اطلاعات",
        body: input.message,
        deepLink: "/assessment",
        linkedEntityType: "evaluation_case",
        linkedEntityId: caseId,
        channels: ["IN_APP", "SMS"],
      });
    }
  }

  async score(caseId: string, input: SubmitScore, actorId: string): Promise<void> {
    await this.prisma.evaluationScore.create({
      data: {
        evaluationCaseId: caseId,
        rubricId: input.rubricId,
        evaluatorId: actorId,
        scores: input.scores as never,
        confidence: input.confidence,
        overrideReason: input.overrideReason,
      },
    });
    await this.auditLog.record({
      actorId,
      actorType: "user",
      action: "evaluation_case.scored",
      entityType: "evaluation_case",
      entityId: caseId,
    });
  }

  async decide(caseId: string, input: DecideCase, actorId: string): Promise<void> {
    const evalCase = await this.prisma.evaluationCase.findUniqueOrThrow({ where: { id: caseId } });
    const { internalReason, partnerVisibleReason } = DECISION_TEXT[input.decision];

    await this.prisma.evaluationDecision.create({
      data: {
        evaluationCaseId: caseId,
        decision: input.decision,
        reason: internalReason,
        partnerVisibleReason,
        decidedBy: actorId,
      },
    });

    await this.transition(caseId, input.decision, { actorId, note: partnerVisibleReason, partnerVisible: true });

    if (input.decision === "APPROVED" || input.decision === "CONDITIONALLY_APPROVED") {
      await this.prisma.channel.update({ where: { id: evalCase.channelId }, data: { status: "ACTIVE" } });
    }

    const submitterId = await this.getSubmitterId(caseId);
    if (submitterId) {
      // Every management decision reaches the channel owner by SMS as well as
      // in-app — this is not optional/configurable per decision, by design.
      await this.notifications.notify({
        userId: submitterId,
        eventType: "evaluation.decided",
        dedupeKey: `evaluation-case:${caseId}:decided`,
        title: "نتیجه ارزیابی کانال",
        body: partnerVisibleReason,
        deepLink: "/assessment",
        linkedEntityType: "evaluation_case",
        linkedEntityId: caseId,
        channels: ["IN_APP", "SMS"],
      });
    }
  }

  private async getSubmitterId(caseId: string): Promise<string | null> {
    const evalCase = await this.prisma.evaluationCase.findUnique({ where: { id: caseId }, include: { formSubmission: true } });
    return evalCase?.formSubmission.submitterId ?? null;
  }

  async addNote(caseId: string, body: string, actorId: string): Promise<void> {
    await this.prisma.evaluationNote.create({ data: { evaluationCaseId: caseId, authorId: actorId, body } });
  }

  private async transition(caseId: string, toStatus: EvaluationCaseStatusKey, options: TransitionOptions): Promise<void> {
    const evalCase = await this.prisma.evaluationCase.findUniqueOrThrow({ where: { id: caseId } });

    try {
      evaluationStateMachine.assertTransition(evalCase.status, toStatus);
    } catch (error) {
      if (error instanceof IllegalStateTransitionError) {
        throw new BadRequestException(`تغییر وضعیت از «${evalCase.status}» به «${toStatus}» مجاز نیست.`);
      }
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.evaluationCase.update({ where: { id: caseId }, data: { status: toStatus } }),
      this.prisma.evaluationStatusEvent.create({
        data: {
          evaluationCaseId: caseId,
          fromStatus: evalCase.status,
          toStatus,
          note: options.note,
          partnerVisible: options.partnerVisible,
          createdBy: options.actorId,
        },
      }),
    ]);

    await this.auditLog.record({
      actorId: options.actorId,
      actorType: options.actorId ? "user" : "system",
      action: "evaluation_case.transitioned",
      entityType: "evaluation_case",
      entityId: caseId,
      metadata: { from: evalCase.status, to: toStatus },
    });
  }
}
