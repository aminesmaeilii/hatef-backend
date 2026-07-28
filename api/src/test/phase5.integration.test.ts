import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import type {
  AuthSessionResponse,
  ChannelStatement,
  Deliverable,
  Obligation,
  OtpRequestResponse,
  Settlement,
  SupportRequest,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { LedgerService } from "../ledger/ledger.service";
import { createTestApp } from "./create-test-app";

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

describe("Phase 5: ledger, barter obligations, deliverables, and settlement (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;
  let ledger: LedgerService;

  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let adminUserId: string;

  let approverAgent: ReturnType<typeof request.agent>;
  let approverCsrf: string;
  let approverUserId: string;

  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;
  let partnerUserId: string;

  let channelId: string;
  let pinTypeId: string;
  let publicationCatalogItemId: string;

  const createdUserIds: string[] = [];
  const createdChannelIds: string[] = [];
  const createdSupportRequestIds: string[] = [];

  async function createInternalActor(label: string) {
    const email = `phase5-${label}-${randomUUID().slice(0, 8)}@hatef.test`;
    const user = await prisma.user.create({ data: { displayName: `Phase5 ${label}`, email } });
    createdUserIds.push(user.id);
    await prisma.adminCredential.create({ data: { userId: user.id, passwordHash: await hashPassword("Phase5-Test-Password-1!") } });
    const config = app.get(AppConfigService);
    const totpSecret = generateTotpSecret();
    const encrypted = encryptSecret(totpSecret, deriveKey(config.env.SESSION_SECRET, "mfa-secret"));
    await prisma.mfaMethod.create({ data: { userId: user.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: user.id, roleId: superAdminRole.id } });

    const agent = request.agent(app.getHttpServer());
    const loginRes = await agent.post("/api/v1/auth/internal/login").send({ email, password: "Phase5-Test-Password-1!" }).expect(201);
    const code = generateSync({ secret: totpSecret });
    const session = (await agent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: loginRes.body.mfaToken, code }).expect(201))
      .body as AuthSessionResponse;
    // price/approve and settlement decide are step-up-gated (spec 24) — verify once up front.
    await agent
      .post("/api/v1/auth/internal/step-up")
      .set("X-CSRF-Token", session.csrfToken)
      .send({ code: generateSync({ secret: totpSecret }) })
      .expect(201);
    return { agent, csrf: session.csrfToken, userId: user.id };
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    ledger = app.get(LedgerService);

    const admin = await createInternalActor("admin");
    adminAgent = admin.agent;
    adminCsrf = admin.csrf;
    adminUserId = admin.userId;

    const approver = await createInternalActor("approver");
    approverAgent = approver.agent;
    approverCsrf = approver.csrf;
    approverUserId = approver.userId;

    const mobile = randomIranianMobile();
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201)).body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: mobile.raw, code: otpReq.devCode }).expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;
    createdUserIds.push(partnerUserId);

    const channel = await prisma.channel.create({ data: { title: "Phase 5 Test Channel", eitaaId: `phase5_test_${randomUUID().slice(0, 8)}` } });
    channelId = channel.id;
    createdChannelIds.push(channelId);
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });

    const pinType = await prisma.promotionType.findUniqueOrThrow({ where: { key: "first-position-pin" } });
    pinTypeId = pinType.id;
    const publicationItem = await prisma.serviceCatalogItem.findUniqueOrThrow({ where: { key: "publication" } });
    publicationCatalogItemId = publicationItem.id;
  });

  afterAll(async () => {
    // This phase's obligation/settlement flows post real notifications (Phase 6), each
    // enqueuing a real OutboxEvent row for the worker — clean those up too, or they sit
    // as permanent litter in the dev DB once their NotificationDelivery row is gone.
    await prisma.outboxEvent.deleteMany({
      where: { eventType: { in: ["notification.deliver", "report.run.requested"] }, createdAt: { gte: testStartedAt } },
    });
    for (const id of createdSupportRequestIds) {
      await prisma.supportRequest.deleteMany({ where: { id } });
    }
    await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: createdChannelIds } } });
    await prisma.settlement.deleteMany({ where: { channelId: { in: createdChannelIds } } });
    await prisma.serviceObligation.deleteMany({ where: { channelId: { in: createdChannelIds } } });
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
    await app.close();
  });

  /** Drives a pin request all the way through to COMPLETED, the real trigger for the SUPPORT_GRANTED ledger posting. */
  let nextScheduleSlotHour = 8;

  async function completeAPinRequest(requestedUniqueViews: number): Promise<{ requestId: string; finalAmountRial: bigint }> {
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
    const hour = nextScheduleSlotHour;
    nextScheduleSlotHour += 2;
    await adminAgent
      .post(`/api/v1/support-requests/${requestId}/schedule`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ operatorId: adminUserId, scheduledStartAt: `2027-05-01T${String(hour).padStart(2, "0")}:00:00.000Z` })
      .expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent
      .post(`/api/v1/support-requests/${requestId}/execution-result`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ actualUniqueViews: requestedUniqueViews })
      .expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/verify-result`).set("X-CSRF-Token", adminCsrf).send({ outcome: "COMPLETE" }).expect(201);

    const order = await prisma.promotionOrder.findUniqueOrThrow({ where: { supportRequestId: requestId } });
    return { requestId, finalAmountRial: order.finalAmountRial };
  }

  it("posts a balanced SUPPORT_GRANTED transaction on completion, and a retry of the same posting never duplicates value", async () => {
    const { requestId, finalAmountRial } = await completeAPinRequest(1_000);

    const statement = (
      await adminAgent.get(`/api/v1/channels/${channelId}/ledger/statement`).set("X-CSRF-Token", adminCsrf).expect(200)
    ).body as ChannelStatement;
    expect(statement.outstandingObligationRial).toBe(finalAmountRial.toString());

    const supportTransaction = statement.transactions.find((t) => t.transactionType === "SUPPORT_GRANTED" && t.sourceId === requestId);
    expect(supportTransaction).toBeDefined();
    const debit = supportTransaction!.entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + BigInt(e.amountRial), 0n);
    const credit = supportTransaction!.entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + BigInt(e.amountRial), 0n);
    expect(debit).toBe(credit);

    const order = await prisma.promotionOrder.findUniqueOrThrow({ where: { supportRequestId: requestId } });
    const idempotencyKey = `support-request:${requestId}:support-granted`;
    const before = await prisma.ledgerTransaction.count({ where: { idempotencyKey } });
    expect(before).toBe(1);

    // A direct retried post with the same idempotencyKey (what a retried HTTP request would trigger) must not create a second transaction.
    await ledger.post({
      transactionType: "SUPPORT_GRANTED",
      idempotencyKey,
      sourceType: "support_request",
      sourceId: requestId,
      createdBy: adminUserId,
      entries: [
        { channelId: order.channelId, accountType: "CHANNEL_SUPPORT_VALUE", direction: "DEBIT", amountRial: order.finalAmountRial },
        { channelId: order.channelId, accountType: "CHANNEL_SERVICE_OBLIGATION", direction: "DEBIT", amountRial: order.finalAmountRial },
        { channelId: null, accountType: "PLATFORM_SUPPORT_POOL", direction: "CREDIT", amountRial: order.finalAmountRial },
        { channelId: null, accountType: "PLATFORM_SERVICE_POOL", direction: "CREDIT", amountRial: order.finalAmountRial },
      ],
    });
    const after = await prisma.ledgerTransaction.count({ where: { idempotencyKey } });
    expect(after).toBe(1);

    const balancesAfterRetry = await adminAgent.get(`/api/v1/channels/${channelId}/ledger/statement`).set("X-CSRF-Token", adminCsrf).expect(200);
    expect((balancesAfterRetry.body as ChannelStatement).outstandingObligationRial).toBe(finalAmountRial.toString());
  });

  it("runs an obligation through propose -> accept -> deliver -> partial-approve, rejects an over-cap settlement, and completes a dual-approved partial settlement whose statement reconciles", async () => {
    const { requestId, finalAmountRial } = await completeAPinRequest(500);
    const obligationValueRial = (finalAmountRial / 2n).toString();

    const proposed = (
      await adminAgent
        .post("/api/v1/obligations")
        .set("X-CSRF-Token", adminCsrf)
        .send({
          channelId,
          supportRequestId: requestId,
          serviceCatalogItemId: publicationCatalogItemId,
          brief: "بازنشر معرفی کمپین هاتف",
          valueRial: obligationValueRial,
        })
        .expect(201)
    ).body as Obligation;
    expect(proposed.status).toBe("PROPOSED");

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/obligations/${proposed.id}/respond`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ action: "ACCEPT" })
      .expect(201);

    await adminAgent
      .post(`/api/v1/obligations/${proposed.id}/transition`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ toStatus: "IN_PROGRESS" })
      .expect(201);

    const deliverable = (
      await partnerAgent
        .post(`/api/v1/channels/${channelId}/obligations/${proposed.id}/deliverables`)
        .set("X-CSRF-Token", partnerCsrf)
        .send({ description: "لینک بازنشر کمپین", links: ["https://eitaa.com/example-post"], reachOrViews: 800 })
        .expect(201)
    ).body as Deliverable;
    expect(deliverable.status).toBe("SUBMITTED");

    const acceptedValueRial = (BigInt(obligationValueRial) / 2n).toString();
    const reviewed = (
      await adminAgent
        .post(`/api/v1/obligations/deliverables/${deliverable.id}/review`)
        .set("X-CSRF-Token", adminCsrf)
        .send({ decision: "ACCEPT_PARTIAL", acceptedValueRial })
        .expect(201)
    ).body as Deliverable;
    expect(reviewed.status).toBe("PARTIALLY_ACCEPTED");
    expect(reviewed.reviews.at(-1)?.acceptedValueRial).toBe(acceptedValueRial);

    const obligationAfterReview = await prisma.serviceObligation.findUniqueOrThrow({ where: { id: proposed.id } });
    expect(obligationAfterReview.status).toBe("PARTIALLY_APPROVED");

    const statementAfterAccept = (
      await adminAgent.get(`/api/v1/channels/${channelId}/ledger/statement`).set("X-CSRF-Token", adminCsrf).expect(200)
    ).body as ChannelStatement;
    expect(statementAfterAccept.deliveredNotYetSettledRial).toBe(acceptedValueRial);

    // Settlement cannot exceed accepted service (spec 27 invariant): requesting the full obligation value is rejected.
    const overCapSettlement = await adminAgent
      .post("/api/v1/settlements")
      .set("X-CSRF-Token", adminCsrf)
      .send({ channelId, allocations: [{ obligationId: proposed.id, amountRial: obligationValueRial }] });
    expect(overCapSettlement.status).toBe(400);

    const settlement = (
      await adminAgent
        .post("/api/v1/settlements")
        .set("X-CSRF-Token", adminCsrf)
        .send({ channelId, statementNote: "تسویه جزئی بازنشر کمپین", allocations: [{ obligationId: proposed.id, amountRial: acceptedValueRial }] })
        .expect(201)
    ).body as Settlement;
    expect(settlement.status).toBe("DRAFT");
    expect(settlement.totalAmountRial).toBe(acceptedValueRial);

    await adminAgent.post(`/api/v1/settlements/${settlement.id}/submit`).set("X-CSRF-Token", adminCsrf).expect(201);

    // The requester cannot also be the second approver — manual settlement requires dual approval (spec 16.5).
    const selfApprove = await adminAgent
      .post(`/api/v1/settlements/${settlement.id}/decide`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ action: "APPROVE" });
    expect(selfApprove.status).toBe(403);

    const decided = (
      await approverAgent
        .post(`/api/v1/settlements/${settlement.id}/decide`)
        .set("X-CSRF-Token", approverCsrf)
        .send({ action: "APPROVE" })
        .expect(201)
    ).body as Settlement;
    expect(decided.status).toBe("COMPLETED");

    const finalStatement = (
      await adminAgent.get(`/api/v1/channels/${channelId}/ledger/statement`).set("X-CSRF-Token", adminCsrf).expect(200)
    ).body as ChannelStatement;
    expect(finalStatement.settledRial).toBe(acceptedValueRial);
    expect(finalStatement.deliveredNotYetSettledRial).toBe("0");

    // Every entry this test posted across every transaction is still balanced, reconstructed live from LedgerEntry.
    for (const balance of finalStatement.balances) {
      expect(typeof balance.balanceRial).toBe("string");
    }
    for (const tx of finalStatement.transactions) {
      const debit = tx.entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + BigInt(e.amountRial), 0n);
      const credit = tx.entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + BigInt(e.amountRial), 0n);
      expect(debit).toBe(credit);
    }

    void approverUserId;
  });
});
