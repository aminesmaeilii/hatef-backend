import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import { getReportDataset } from "@hatef/database";
import type {
  AuthSessionResponse,
  OtpRequestResponse,
  ReportRunDto,
  Survey,
  SurveyAnalytics,
  Ticket,
  TicketAdminDetail,
  TicketDetail,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { NotificationsService } from "../notifications/notifications.service";
import { createTestApp } from "./create-test-app";

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

describe("Phase 6: tickets, notifications, surveys, and reports (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;
  let notifications: NotificationsService;

  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let adminUserId: string;

  let otherAdminAgent: ReturnType<typeof request.agent>;
  let otherAdminCsrf: string;

  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;
  let partnerUserId: string;

  let channelId: string;

  const createdUserIds: string[] = [];
  const createdChannelIds: string[] = [];
  const createdTicketIds: string[] = [];
  const createdFormIds: string[] = [];
  const createdSurveyIds: string[] = [];
  const createdReportRunIds: string[] = [];

  async function createInternalActor(label: string) {
    const email = `phase6-${label}-${randomUUID().slice(0, 8)}@hatef.test`;
    const user = await prisma.user.create({ data: { displayName: `Phase6 ${label}`, email } });
    createdUserIds.push(user.id);
    await prisma.adminCredential.create({ data: { userId: user.id, passwordHash: await hashPassword("Phase6-Test-Password-1!") } });
    const config = app.get(AppConfigService);
    const totpSecret = generateTotpSecret();
    const encrypted = encryptSecret(totpSecret, deriveKey(config.env.SESSION_SECRET, "mfa-secret"));
    await prisma.mfaMethod.create({ data: { userId: user.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: user.id, roleId: superAdminRole.id } });

    const agent = request.agent(app.getHttpServer());
    const loginRes = await agent.post("/api/v1/auth/internal/login").send({ email, password: "Phase6-Test-Password-1!" }).expect(201);
    const code = generateSync({ secret: totpSecret });
    const session = (await agent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: loginRes.body.mfaToken, code }).expect(201))
      .body as AuthSessionResponse;
    return { agent, csrf: session.csrfToken, userId: user.id };
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    notifications = app.get(NotificationsService);

    const admin = await createInternalActor("admin");
    adminAgent = admin.agent;
    adminCsrf = admin.csrf;
    adminUserId = admin.userId;

    const otherAdmin = await createInternalActor("second-admin");
    otherAdminAgent = otherAdmin.agent;
    otherAdminCsrf = otherAdmin.csrf;

    const mobile = randomIranianMobile();
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201)).body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: mobile.raw, code: otpReq.devCode }).expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;
    createdUserIds.push(partnerUserId);

    const channel = await prisma.channel.create({ data: { title: "Phase 6 Test Channel", eitaaId: `phase6_test_${randomUUID().slice(0, 8)}`, status: "ACTIVE" } });
    channelId = channel.id;
    createdChannelIds.push(channelId);
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });
  });

  afterAll(async () => {
    // The dedup/ticket/support-request-style triggers exercised here each enqueue a real
    // OutboxEvent for the worker — clean those up too, or they sit as permanent litter in
    // the dev DB once their NotificationDelivery/ReportRun row is gone.
    await prisma.outboxEvent.deleteMany({
      where: { eventType: { in: ["notification.deliver", "report.run.requested"] }, createdAt: { gte: testStartedAt } },
    });
    await prisma.reportRun.deleteMany({ where: { id: { in: createdReportRunIds } } });
    await prisma.survey.deleteMany({ where: { id: { in: createdSurveyIds } } });
    for (const formId of createdFormIds) {
      await prisma.formSubmission.deleteMany({ where: { formVersion: { formId } } });
      await prisma.formVersion.deleteMany({ where: { formId } });
      await prisma.form.deleteMany({ where: { id: formId } });
    }
    await prisma.ticketInternalNote.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
    await prisma.ticketMessage.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
    await prisma.ticketStatusEvent.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
    await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
    await prisma.notificationDelivery.deleteMany({ where: { notification: { userId: { in: createdUserIds } } } });
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: createdChannelIds } } });
    await prisma.channel.deleteMany({ where: { id: { in: createdChannelIds } } });
    for (const id of createdUserIds) {
      await prisma.auditLog.deleteMany({ where: { actorId: id } });
      await prisma.user.deleteMany({ where: { id } });
    }
    await app.close();
  });

  it("never leaks an internal note through the partner-facing ticket endpoint, while the admin endpoint sees it", async () => {
    const created = (
      await partnerAgent
        .post(`/api/v1/channels/${channelId}/tickets`)
        .set("X-CSRF-Token", partnerCsrf)
        .send({ category: "TECHNICAL", priority: "MEDIUM", subject: "مشکل در آپلود فایل", body: "فایل من آپلود نمی‌شود.", fileIds: [] })
        .expect(201)
    ).body as Ticket;
    createdTicketIds.push(created.id);

    const secretInternalText = `SECRET-INTERNAL-${randomUUID()}`;
    await adminAgent
      .post(`/api/v1/tickets/${created.id}/internal-notes`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ body: secretInternalText })
      .expect(201);

    const partnerView = await partnerAgent.get(`/api/v1/channels/${channelId}/tickets/${created.id}`).set("X-CSRF-Token", partnerCsrf).expect(200);
    const partnerBodyText = JSON.stringify(partnerView.body);
    expect(partnerBodyText).not.toContain(secretInternalText);
    expect(partnerView.body as TicketDetail).not.toHaveProperty("internalNotes");

    const adminView = (await adminAgent.get(`/api/v1/tickets/${created.id}`).set("X-CSRF-Token", adminCsrf).expect(200)).body as TicketAdminDetail;
    expect(adminView.internalNotes.some((n) => n.body === secretInternalText)).toBe(true);
  });

  it("deduplicates notify() calls sharing the same business dedupeKey — no duplicate Notification or delivery is ever created", async () => {
    const dedupeKey = `phase6-test:${randomUUID()}`;
    const input = {
      userId: adminUserId,
      eventType: "test.dedup",
      dedupeKey,
      title: "آزمون یکتاسازی",
      body: "این پیام باید فقط یک‌بار ثبت شود.",
    };

    await notifications.notify(input);
    await notifications.notify(input); // retried call, same business event
    await notifications.notify(input); // a third retry, for good measure

    const deliveries = await prisma.notificationDelivery.findMany({ where: { dedupeKey: `${dedupeKey}:IN_APP` } });
    expect(deliveries).toHaveLength(1);
    const notificationCount = await prisma.notification.count({ where: { userId: adminUserId, eventType: "test.dedup" } });
    expect(notificationCount).toBe(1);
  });

  it("runs a report against the real, approved dataset registry — not a mock — and reflects the ticket created above", async () => {
    const dataset = getReportDataset("ticket_sla");
    expect(dataset).toBeDefined();
    const table = await dataset!.run(prisma, { channelId });
    const totalTickets = table.rows.reduce((sum, r) => sum + (r.count as number), 0);
    expect(totalTickets).toBeGreaterThanOrEqual(1);

    const runRes = (
      await adminAgent.post("/api/v1/reports/runs").set("X-CSRF-Token", adminCsrf).send({ datasetKey: "ticket_sla", filters: { channelId } }).expect(201)
    ).body as ReportRunDto;
    createdReportRunIds.push(runRes.id);
    expect(runRes.status).toBe("PENDING");

    const outboxEvent = await prisma.outboxEvent.findFirst({ where: { eventType: "report.run.requested", correlationId: runRes.id } });
    expect(outboxEvent).not.toBeNull();
  });

  it("only the requester can export their own report run", async () => {
    const run = await prisma.reportRun.create({
      data: {
        datasetKey: "ticket_sla",
        filters: {},
        status: "COMPLETED",
        resultJson: { columns: [{ key: "status", label: "Status", type: "string" }], rows: [{ status: "NEW", count: 1 }] } as never,
        rowCount: 1,
        requestedById: adminUserId,
        completedAt: new Date(),
      },
    });
    createdReportRunIds.push(run.id);

    const deniedRes = await otherAdminAgent.post(`/api/v1/reports/runs/${run.id}/export`).set("X-CSRF-Token", otherAdminCsrf).send({ format: "CSV" });
    expect(deniedRes.status).toBe(403);

    const allowedRes = await adminAgent.post(`/api/v1/reports/runs/${run.id}/export`).set("X-CSRF-Token", adminCsrf).send({ format: "CSV" }).expect(201);
    expect(allowedRes.body.content).toContain("NEW");
  });

  it("computes survey analytics from real submissions — started vs. submitted counts and a real option breakdown", async () => {
    const form = await prisma.form.create({ data: { key: `phase6-survey-form-${randomUUID().slice(0, 8)}`, title: "نظرسنجی رضایت" } });
    createdFormIds.push(form.id);
    const version = await prisma.formVersion.create({ data: { formId: form.id, versionNumber: 1, status: "PUBLISHED", publishedAt: new Date() } });
    const page = await prisma.formPage.create({ data: { formVersionId: version.id, order: 0, title: "صفحه اول" } });
    const section = await prisma.formSection.create({ data: { formPageId: page.id, order: 0, title: "بخش اول" } });
    const field = await prisma.formField.create({
      data: {
        formSectionId: section.id,
        order: 0,
        key: "satisfaction",
        label: "میزان رضایت",
        type: "SINGLE_SELECT",
        required: true,
        options: { create: [{ order: 0, value: "HIGH", label: "زیاد" }, { order: 1, value: "LOW", label: "کم" }] },
      },
    });

    const survey = (
      await adminAgent.post("/api/v1/surveys").set("X-CSRF-Token", adminCsrf).send({ formId: form.id, title: "نظرسنجی رضایت شرکا", targetChannelIds: [] }).expect(201)
    ).body as Survey;
    createdSurveyIds.push(survey.id);
    await adminAgent.post(`/api/v1/surveys/${survey.id}/transition`).set("X-CSRF-Token", adminCsrf).send({ status: "OPEN" }).expect(201);

    // Channel one: starts and fully submits with HIGH.
    const start1 = await partnerAgent.post(`/api/v1/channels/${channelId}/surveys/${survey.id}/start`).set("X-CSRF-Token", partnerCsrf).expect(201);
    await partnerAgent
      .patch(`/api/v1/channels/${channelId}/form-submissions/${start1.body.formSubmissionId}/answers`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ answers: { [field.id]: "HIGH" } })
      .expect(200);
    await partnerAgent
      .post(`/api/v1/channels/${channelId}/form-submissions/${start1.body.formSubmissionId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ acceptedConsentDocumentIds: [] })
      .expect(201);

    // Channel two: starts but never submits (still counts toward "started", not "submitted").
    const secondMobile = randomIranianMobile();
    const secondPartnerAgent = request.agent(app.getHttpServer());
    const secondOtp = (await secondPartnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: secondMobile.raw }).expect(201)).body as OtpRequestResponse;
    const secondSession = (
      await secondPartnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: secondMobile.raw, code: secondOtp.devCode }).expect(201)
    ).body as AuthSessionResponse;
    createdUserIds.push(secondSession.user.id);
    const secondChannel = await prisma.channel.create({ data: { title: "Phase 6 Second Channel", eitaaId: `phase6_test_2_${randomUUID().slice(0, 8)}`, status: "ACTIVE" } });
    createdChannelIds.push(secondChannel.id);
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: secondSession.user.id, channelId: secondChannel.id, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: secondSession.user.id, roleId: ownerRole.id, resourceType: "channel", resourceId: secondChannel.id } });
    await secondPartnerAgent.post(`/api/v1/channels/${secondChannel.id}/surveys/${survey.id}/start`).set("X-CSRF-Token", secondSession.csrfToken).expect(201);

    const analytics = (await adminAgent.get(`/api/v1/surveys/${survey.id}/analytics`).set("X-CSRF-Token", adminCsrf).expect(200)).body as SurveyAnalytics;
    expect(analytics.startedCount).toBe(2);
    expect(analytics.submittedCount).toBe(1);
    expect(analytics.completionRate).toBeCloseTo(0.5);
    const breakdown = analytics.questionBreakdown.find((q) => q.fieldKey === "satisfaction");
    expect(breakdown?.responseCount).toBe(1);
    expect(breakdown?.optionCounts?.find((o) => o.value === "HIGH")?.count).toBe(1);
    expect(breakdown?.optionCounts?.find((o) => o.value === "LOW")?.count).toBe(0);
  });
});
