import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import type {
  AuthSessionResponse,
  CalendarItem,
  OtpRequestResponse,
  PromotionExecutionResult,
  PromotionSchedule,
  SupportRequest,
  SupportRequestProgress,
  Task,
  TaskDetail,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { createTestApp } from "./create-test-app";

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

describe("Phase 4: tasks, unified calendar/Gantt read-model, promotion scheduling and execution (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let adminUserId: string;
  let adminEmail: string;

  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;
  let partnerUserId: string;

  let channelId: string;
  let pinTypeId: string;

  const createdUserIds: string[] = [];
  const createdChannelIds: string[] = [];
  const createdSupportRequestIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const config = app.get(AppConfigService);

    adminEmail = `phase4-admin-${randomUUID().slice(0, 8)}@hatef.test`;
    const adminUser = await prisma.user.create({ data: { displayName: "Phase4 Test Admin", email: adminEmail } });
    adminUserId = adminUser.id;
    createdUserIds.push(adminUserId);
    await prisma.adminCredential.create({ data: { userId: adminUser.id, passwordHash: await hashPassword("Phase4-Test-Password-1!") } });
    const totpSecret = generateTotpSecret();
    const encrypted = encryptSecret(totpSecret, deriveKey(config.env.SESSION_SECRET, "mfa-secret"));
    await prisma.mfaMethod.create({ data: { userId: adminUser.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });

    adminAgent = request.agent(app.getHttpServer());
    const loginRes = await adminAgent.post("/api/v1/auth/internal/login").send({ email: adminEmail, password: "Phase4-Test-Password-1!" }).expect(201);
    const code = generateSync({ secret: totpSecret });
    const adminSession = (
      await adminAgent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: loginRes.body.mfaToken, code }).expect(201)
    ).body as AuthSessionResponse;
    adminCsrf = adminSession.csrfToken;
    // price/approve is step-up-gated (spec 24) — verify once up front.
    await adminAgent
      .post("/api/v1/auth/internal/step-up")
      .set("X-CSRF-Token", adminCsrf)
      .send({ code: generateSync({ secret: totpSecret }) })
      .expect(201);

    const mobile = randomIranianMobile();
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201)).body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: mobile.raw, code: otpReq.devCode }).expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;
    createdUserIds.push(partnerUserId);

    const channel = await prisma.channel.create({ data: { title: "Phase 4 Test Channel", eitaaId: `phase4_test_${randomUUID().slice(0, 8)}` } });
    channelId = channel.id;
    createdChannelIds.push(channelId);
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });

    const pinType = await prisma.promotionType.findUniqueOrThrow({ where: { key: "first-position-pin" } });
    pinTypeId = pinType.id;
  });

  afterAll(async () => {
    // The schedule/reschedule/completion flow exercised here now posts real
    // notifications (Phase 6), each enqueuing a real OutboxEvent row for the worker.
    await prisma.outboxEvent.deleteMany({
      where: { eventType: { in: ["notification.deliver", "report.run.requested"] }, createdAt: { gte: testStartedAt } },
    });
    for (const id of createdTaskIds) {
      await prisma.task.deleteMany({ where: { id } });
    }
    for (const id of createdSupportRequestIds) {
      await prisma.supportRequest.deleteMany({ where: { id } });
    }
    await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: createdChannelIds } } });
    // Phase 5's verify-result -> COMPLETED path posts a real, immutable ledger
    // transaction for these channels. Ledger rows are never hard-deleted in
    // production (spec 16.1); this is test-fixture teardown only.
    const channelAccounts = await prisma.ledgerAccount.findMany({ where: { channelId: { in: createdChannelIds } } });
    const channelAccountIds = channelAccounts.map((a) => a.id);
    if (channelAccountIds.length > 0) {
      const transactionIds = (
        await prisma.ledgerEntry.findMany({ where: { accountId: { in: channelAccountIds } }, select: { transactionId: true } })
      ).map((e) => e.transactionId);
      await prisma.ledgerEntry.deleteMany({ where: { accountId: { in: channelAccountIds } } });
      await prisma.ledgerTransaction.deleteMany({ where: { id: { in: transactionIds } } });
      await prisma.ledgerAccount.deleteMany({ where: { id: { in: channelAccountIds } } });
    }
    for (const id of createdChannelIds) {
      await prisma.channel.deleteMany({ where: { id } });
    }
    for (const id of createdUserIds) {
      await prisma.auditLog.deleteMany({ where: { actorId: id } });
      await prisma.user.deleteMany({ where: { id } });
    }
    void adminEmail;
    await app.close();
  });

  /** Drives a pin request all the way to SCHEDULED (order created), reusing the exact chain proven by phase3.integration.test.ts. */
  async function bringPinRequestToScheduled(requestedUniqueViews: number): Promise<string> {
    const created = await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ promotionTypeId: pinTypeId, audienceType: "NATIONWIDE", requestedUniqueViews, details: {} })
      .expect(201);
    const requestId = (created.body as SupportRequest).id;
    createdSupportRequestIds.push(requestId);

    await partnerAgent.post(`/api/v1/channels/${channelId}/support-requests/${requestId}/submit`).set("X-CSRF-Token", partnerCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/validate`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/approve`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/send-to-approval`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/internal-approve`).set("X-CSRF-Token", adminCsrf).expect(201);
    await partnerAgent.post(`/api/v1/channels/${channelId}/support-requests/${requestId}/confirm`).set("X-CSRF-Token", partnerCsrf).expect(201);

    return requestId;
  }

  it("persists a task, rejects an invalid dependency-violating reschedule, accepts a valid one, and surfaces the task in the unified calendar feed", async () => {
    const depDueDate = "2027-03-10T00:00:00.000Z";
    const dependency = (
      await adminAgent
        .post("/api/v1/tasks")
        .set("X-CSRF-Token", adminCsrf)
        .send({ title: "پیش‌نیاز: هماهنگی محتوا", dueDate: depDueDate })
        .expect(201)
    ).body as Task;
    createdTaskIds.push(dependency.id);

    const mainTaskStart = "2027-03-15T00:00:00.000Z";
    const task = (
      await adminAgent
        .post("/api/v1/tasks")
        .set("X-CSRF-Token", adminCsrf)
        .send({ title: "اجرای پروموشن", channelId, startDate: mainTaskStart })
        .expect(201)
    ).body as Task;
    createdTaskIds.push(task.id);
    expect(task.status).toBe("BACKLOG");

    await adminAgent.post(`/api/v1/tasks/${task.id}/dependencies`).set("X-CSRF-Token", adminCsrf).send({ dependsOnTaskId: dependency.id }).expect(201);

    // Invalid: dragging the task to start before its dependency is even due.
    const invalidReschedule = await adminAgent
      .post(`/api/v1/tasks/${task.id}/reschedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ startDate: "2027-03-01T00:00:00.000Z" });
    expect(invalidReschedule.status).toBe(400);

    // The rejected drag left the task's real date untouched.
    const afterRejected = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(afterRejected.startDate?.toISOString()).toBe(mainTaskStart);

    // Valid: starting after the dependency's due date.
    const validReschedule = await adminAgent
      .post(`/api/v1/tasks/${task.id}/reschedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ startDate: "2027-03-11T00:00:00.000Z" })
      .expect(201);
    expect((validReschedule.body as Task).startDate).toBe("2027-03-11T00:00:00.000Z");

    const detail = (await adminAgent.get(`/api/v1/tasks/${task.id}`).set("X-CSRF-Token", adminCsrf).expect(200)).body as TaskDetail;
    expect(detail.dependencies).toHaveLength(1);
    expect(detail.dependencies[0]?.dependsOnTaskId).toBe(dependency.id);

    // The calendar feed is the same Task row, not a copy — both tasks show up by their real dates.
    const feed = (
      await adminAgent
        .get(`/api/v1/calendar/feed?from=2027-03-01T00:00:00.000Z&to=2027-03-31T23:59:59.999Z&channelId=${channelId}`)
        .set("X-CSRF-Token", adminCsrf)
        .expect(200)
    ).body as CalendarItem[];
    const feedIds = feed.map((i) => i.linkedId);
    expect(feedIds).toContain(task.id);
  });

  it("drives a pin request from SCHEDULED through operator scheduling, conflict detection, execution, and completion — with the partner seeing the real schedule", async () => {
    const requestId = await bringPinRequestToScheduled(1_000);

    const dbBeforeSchedule = await prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(dbBeforeSchedule.status).toBe("SCHEDULED");

    // Cannot start running without a real schedule.
    const prematureRun = await adminAgent.post(`/api/v1/support-requests/${requestId}/advance`).set("X-CSRF-Token", adminCsrf);
    expect(prematureRun.status).toBe(400);

    const scheduledStartAt = "2027-04-01T08:00:00.000Z";
    const scheduledEndAt = "2027-04-01T09:00:00.000Z";
    const schedule = (
      await adminAgent
        .post(`/api/v1/support-requests/${requestId}/schedule`)
        .set("X-CSRF-Token", adminCsrf)
        .send({ operatorId: adminUserId, scheduledStartAt, scheduledEndAt })
        .expect(201)
    ).body as PromotionSchedule;
    expect(schedule.checklist.length).toBeGreaterThan(0);

    // A second order for the same operator, fully overlapping — capacity 1 by default, so this must conflict.
    const secondRequestId = await bringPinRequestToScheduled(500);
    const conflictAttempt = await adminAgent
      .post(`/api/v1/support-requests/${secondRequestId}/schedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ operatorId: adminUserId, scheduledStartAt: "2027-04-01T08:30:00.000Z", scheduledEndAt: "2027-04-01T09:30:00.000Z" });
    expect(conflictAttempt.status).toBe(400);

    // A non-overlapping slot for the same operator succeeds.
    await adminAgent
      .post(`/api/v1/support-requests/${secondRequestId}/schedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ operatorId: adminUserId, scheduledStartAt: "2027-04-02T08:00:00.000Z" })
      .expect(201);

    // Rescheduling the first order to a clean slot succeeds and is reflected on the partner's progress view.
    const newStartAt = "2027-04-05T08:00:00.000Z";
    await adminAgent
      .post(`/api/v1/support-requests/${requestId}/reschedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ scheduledStartAt: newStartAt, scheduledEndAt: "2027-04-05T09:00:00.000Z" })
      .expect(201);

    const partnerProgress = (
      await partnerAgent.get(`/api/v1/channels/${channelId}/support-requests/${requestId}/progress`).set("X-CSRF-Token", partnerCsrf).expect(200)
    ).body as SupportRequestProgress;
    expect(partnerProgress.schedule?.scheduledStartAt).toBe(newStartAt);

    // The calendar feed shows the same schedule the partner sees.
    const feed = (
      await adminAgent
        .get(`/api/v1/calendar/feed?from=2027-04-01T00:00:00.000Z&to=2027-04-10T23:59:59.999Z&channelId=${channelId}`)
        .set("X-CSRF-Token", adminCsrf)
        .expect(200)
    ).body as CalendarItem[];
    // Two promotion schedules now exist in this window (this order's and the second request's) — match on the exact rescheduled time, not just "the first one."
    const scheduleItem = feed.find((i) => i.kind === "PROMOTION_SCHEDULE" && i.startAt === newStartAt);
    expect(scheduleItem).toBeDefined();

    // Now RUNNING is legal.
    await adminAgent.post(`/api/v1/support-requests/${requestId}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);

    const executionResult = (
      await adminAgent
        .post(`/api/v1/support-requests/${requestId}/execution-result`)
        .set("X-CSRF-Token", adminCsrf)
        .send({ actualUniqueViews: 950 })
        .expect(201)
    ).body as PromotionExecutionResult;
    expect(executionResult.actualUniqueViews).toBe(950);

    const afterExecutionResult = await prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(afterExecutionResult.status).toBe("RESULT_VERIFICATION");

    await adminAgent.post(`/api/v1/support-requests/${requestId}/verify-result`).set("X-CSRF-Token", adminCsrf).send({ outcome: "COMPLETE" }).expect(201);

    const finalRequest = await prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(finalRequest.status).toBe("COMPLETED");

    const order = await prisma.promotionOrder.findUniqueOrThrow({ where: { supportRequestId: requestId } });
    const finalExecutionResult = await prisma.promotionExecutionResult.findUniqueOrThrow({ where: { promotionOrderId: order.id } });
    expect(finalExecutionResult.realizedValueRial).toBe(order.finalAmountRial);
    expect(finalExecutionResult.verifiedAt).not.toBeNull();
  });
});
