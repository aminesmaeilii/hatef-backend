import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import type { AuthSessionResponse, OtpRequestResponse, PriceCalculation, PromotionQuote, SupportRequest } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { createTestApp } from "./create-test-app";

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

async function loginInternalAdmin(
  app: INestApplication,
  prisma: PrismaService,
  sessionSecret: string,
): Promise<{ agent: ReturnType<typeof request.agent>; csrf: string; userId: string; email: string }> {
  const email = `phase3-admin-${randomUUID().slice(0, 8)}@hatef.test`;
  const user = await prisma.user.create({ data: { displayName: "Phase3 Test Admin", email } });
  await prisma.adminCredential.create({ data: { userId: user.id, passwordHash: await hashPassword("Phase3-Test-Password-1!") } });
  const totpSecret = generateTotpSecret();
  const encrypted = encryptSecret(totpSecret, deriveKey(sessionSecret, "mfa-secret"));
  await prisma.mfaMethod.create({ data: { userId: user.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
  await prisma.roleAssignment.create({ data: { userId: user.id, roleId: superAdminRole.id } });

  const agent = request.agent(app.getHttpServer());
  const loginRes = await agent.post("/api/v1/auth/internal/login").send({ email, password: "Phase3-Test-Password-1!" }).expect(201);
  expect(loginRes.body.status).toBe("mfa_required");
  const code = generateSync({ secret: totpSecret });
  const session = (
    await agent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: loginRes.body.mfaToken, code }).expect(201)
  ).body as AuthSessionResponse;
  // price/approve is step-up-gated (spec 24 "step-up authentication" for
  // sensitive financial actions) — re-verify once so this agent's later
  // approve calls, all well within STEP_UP_FRESHNESS_MS, don't need to repeat it.
  await agent
    .post("/api/v1/auth/internal/step-up")
    .set("X-CSRF-Token", session.csrfToken)
    .send({ code: generateSync({ secret: totpSecret }) })
    .expect(201);
  return { agent, csrf: session.csrfToken, userId: user.id, email };
}

describe("Phase 3: promotion types, pin pricing, quote negotiation, support-request workflow (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let adminEmail: string;
  let secondAdminAgent: ReturnType<typeof request.agent>;
  let secondAdminCsrf: string;
  let secondAdminEmail: string;

  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;
  let partnerUserId: string;

  let channelId: string;
  let pinTypeId: string;
  let variableTypeId: string;

  const createdUserIds: string[] = [];
  const createdChannelIds: string[] = [];
  const createdSupportRequestIds: string[] = [];
  const createdPromotionTypeIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const config = app.get(AppConfigService);

    const admin1 = await loginInternalAdmin(app, prisma, config.env.SESSION_SECRET);
    adminAgent = admin1.agent;
    adminCsrf = admin1.csrf;
    adminEmail = admin1.email;
    createdUserIds.push(admin1.userId);

    const admin2 = await loginInternalAdmin(app, prisma, config.env.SESSION_SECRET);
    secondAdminAgent = admin2.agent;
    secondAdminCsrf = admin2.csrf;
    secondAdminEmail = admin2.email;
    createdUserIds.push(admin2.userId);

    const mobile = randomIranianMobile();
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201))
      .body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: mobile.raw, code: otpReq.devCode }).expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;
    createdUserIds.push(partnerUserId);

    const channel = await prisma.channel.create({
      data: { title: "Phase 3 Test Channel", eitaaId: `phase3_test_${randomUUID().slice(0, 8)}` },
    });
    channelId = channel.id;
    createdChannelIds.push(channelId);
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });

    const pinType = await prisma.promotionType.findUniqueOrThrow({ where: { key: "first-position-pin" } });
    pinTypeId = pinType.id;
    const variableType = await prisma.promotionType.findUniqueOrThrow({ where: { key: "variable-multi-channel" } });
    variableTypeId = variableType.id;
  });

  afterAll(async () => {
    // The quote-negotiation flow exercised here now posts a real "new quote" notification
    // (Phase 6), each enqueuing a real OutboxEvent row for the worker.
    await prisma.outboxEvent.deleteMany({
      where: { eventType: { in: ["notification.deliver", "report.run.requested"] }, createdAt: { gte: testStartedAt } },
    });
    for (const id of createdSupportRequestIds) {
      await prisma.supportRequest.deleteMany({ where: { id } });
    }
    for (const id of createdPromotionTypeIds) {
      await prisma.promotionType.deleteMany({ where: { id } }); // cascades versions/price rules
    }
    await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: createdChannelIds } } });
    for (const id of createdChannelIds) {
      await prisma.channel.deleteMany({ where: { id } });
    }
    for (const id of createdUserIds) {
      await prisma.auditLog.deleteMany({ where: { actorId: id } });
      await prisma.user.deleteMany({ where: { id } });
    }
    void adminEmail;
    void secondAdminEmail;
    await app.close();
  });

  async function createAndSubmitPinRequest(input: {
    audienceType: "NATIONWIDE" | "PROVINCIAL";
    province?: string;
    requestedUniqueViews: number;
    promotionTypeId?: string;
  }): Promise<string> {
    const created = await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({
        promotionTypeId: input.promotionTypeId ?? pinTypeId,
        audienceType: input.audienceType,
        province: input.province,
        requestedUniqueViews: input.requestedUniqueViews,
        details: { adTitle: "تبلیغ آزمایشی", targetLink: "https://eitaa.com/example" },
      })
      .expect(201);
    const requestId = (created.body as SupportRequest).id;
    createdSupportRequestIds.push(requestId);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .expect(201);

    return requestId;
  }

  async function advanceToPricing(requestId: string): Promise<void> {
    await adminAgent.post(`/api/v1/support-requests/${requestId}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/validate`).set("X-CSRF-Token", adminCsrf).expect(201);
  }

  it("calculates the nationwide first-position pin price as exactly 240 rial per unique view", async () => {
    const requestId = await createAndSubmitPinRequest({ audienceType: "NATIONWIDE", requestedUniqueViews: 10_000 });
    await advanceToPricing(requestId);

    const calc = (
      await adminAgent.post(`/api/v1/support-requests/${requestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201)
    ).body as PriceCalculation;

    expect(calc.ratePerViewRial).toBe("240");
    expect(calc.baseAmountRial).toBe("2400000");
    expect(calc.estimatedAmountRial).toBe("2400000");
    expect(calc.requiresSecondApproval).toBe(false);
  });

  it("calculates the provincial first-position pin price as exactly 480 rial per unique view", async () => {
    const requestId = await createAndSubmitPinRequest({ audienceType: "PROVINCIAL", province: "تهران", requestedUniqueViews: 3_000 });
    await advanceToPricing(requestId);

    const calc = (
      await adminAgent.post(`/api/v1/support-requests/${requestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201)
    ).body as PriceCalculation;

    expect(calc.ratePerViewRial).toBe("480");
    expect(calc.estimatedAmountRial).toBe("1440000");
  });

  it("drives a pin request through approval, internal approval, and partner confirmation into a schedulable order with the exact calculated amount", async () => {
    const requestId = await createAndSubmitPinRequest({ audienceType: "NATIONWIDE", requestedUniqueViews: 1_000 });
    await advanceToPricing(requestId);

    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/approve`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/send-to-approval`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/internal-approve`).set("X-CSRF-Token", adminCsrf).expect(201);

    const order = (
      await partnerAgent
        .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/confirm`)
        .set("X-CSRF-Token", partnerCsrf)
        .expect(201)
    ).body as { finalAmountRial: string };

    expect(order.finalAmountRial).toBe("240000");

    const dbRequest = await prisma.supportRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(dbRequest.status).toBe("SCHEDULED");
  });

  it("requires a second, distinct approver above the second-approval threshold", async () => {
    const requestId = await createAndSubmitPinRequest({ audienceType: "NATIONWIDE", requestedUniqueViews: 5_000_000 });
    await advanceToPricing(requestId);

    const calc = (
      await adminAgent.post(`/api/v1/support-requests/${requestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201)
    ).body as PriceCalculation;
    expect(calc.estimatedAmountRial).toBe("1200000000");
    expect(calc.requiresSecondApproval).toBe(true);

    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/approve`).set("X-CSRF-Token", adminCsrf).expect(201);

    // The same actor cannot also provide the required second approval.
    await adminAgent.post(`/api/v1/support-requests/${requestId}/price/approve`).set("X-CSRF-Token", adminCsrf).expect(403);

    // A distinct approver can.
    const secondApproval = (
      await secondAdminAgent
        .post(`/api/v1/support-requests/${requestId}/price/approve`)
        .set("X-CSRF-Token", secondAdminCsrf)
        .expect(201)
    ).body as PriceCalculation;
    expect(secondApproval.secondApprovedBy).toBeTruthy();

    // Only now is the request allowed to move to internal approval.
    await adminAgent.post(`/api/v1/support-requests/${requestId}/send-to-approval`).set("X-CSRF-Token", adminCsrf).expect(201);
  });

  it("keeps an old request's snapshotted rate unchanged after the configured rate is updated for new requests", async () => {
    // An isolated fixture type (not the shared seeded "first-position-pin")
    // so this test's rate change never leaks into other tests or re-runs.
    const fixtureType = await prisma.promotionType.create({
      data: { key: `rate-immutability-fixture-${randomUUID().slice(0, 8)}`, name: "Rate Immutability Fixture", pricingModel: "CALCULATED" },
    });
    createdPromotionTypeIds.push(fixtureType.id);
    const v1 = await prisma.promotionTypeVersion.create({
      data: { promotionTypeId: fixtureType.id, versionNumber: 1, status: "PUBLISHED", publishedAt: new Date(), effectiveFrom: new Date() },
    });
    await prisma.priceRule.create({ data: { promotionTypeVersionId: v1.id, audienceType: "NATIONWIDE", ratePerViewRial: 240n } });

    const oldRequestId = await createAndSubmitPinRequest({ audienceType: "NATIONWIDE", requestedUniqueViews: 100, promotionTypeId: fixtureType.id });
    await advanceToPricing(oldRequestId);
    const oldCalc = (
      await adminAgent.post(`/api/v1/support-requests/${oldRequestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201)
    ).body as PriceCalculation;
    expect(oldCalc.ratePerViewRial).toBe("240");

    // Publish a new version of the fixture type with a different rate.
    await prisma.promotionTypeVersion.updateMany({ where: { promotionTypeId: fixtureType.id, status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
    const v2 = await prisma.promotionTypeVersion.create({
      data: { promotionTypeId: fixtureType.id, versionNumber: 2, status: "PUBLISHED", publishedAt: new Date(), effectiveFrom: new Date() },
    });
    await prisma.priceRule.create({ data: { promotionTypeVersionId: v2.id, audienceType: "NATIONWIDE", ratePerViewRial: 300n } });

    // The already-calculated old request keeps its original 240 rial rate.
    const oldCalcAfter = await prisma.priceCalculation.findUniqueOrThrow({ where: { id: oldCalc.id } });
    expect(oldCalcAfter.ratePerViewRial.toString()).toBe("240");

    // A brand-new request now snapshots the newly published rate.
    const newRequestId = await createAndSubmitPinRequest({ audienceType: "NATIONWIDE", requestedUniqueViews: 100, promotionTypeId: fixtureType.id });
    await advanceToPricing(newRequestId);
    const newCalc = (
      await adminAgent.post(`/api/v1/support-requests/${newRequestId}/price/calculate`).set("X-CSRF-Token", adminCsrf).send({}).expect(201)
    ).body as PriceCalculation;
    expect(newCalc.ratePerViewRial).toBe("300");
  });

  it("negotiates a variable multi-channel quote through multiple versions and preserves the full offer history", async () => {
    const created = await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ promotionTypeId: variableTypeId, details: { objective: "افزایش آگاهی از برند", topic: "فناوری" } })
      .expect(201);
    const requestId = (created.body as SupportRequest).id;
    createdSupportRequestIds.push(requestId);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .expect(201);
    await advanceToPricing(requestId);

    await adminAgent
      .post(`/api/v1/support-requests/${requestId}/quotes`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ method: "پست ثابت در ۵ کانال", amountRial: "50000000", estimatedChannelMin: 3, estimatedChannelMax: 5 })
      .expect(201);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/respond-to-quote`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ action: "NEGOTIATE", note: "بودجه کمتری در نظر داریم" })
      .expect(201);

    const quoteAfterNegotiate = (
      await adminAgent.get(`/api/v1/support-requests/${requestId}`).set("X-CSRF-Token", adminCsrf).expect(200)
    ).body as { quote: PromotionQuote };
    expect(quoteAfterNegotiate.quote.status).toBe("NEGOTIATING");
    expect(quoteAfterNegotiate.quote.versions).toHaveLength(1);
    expect(quoteAfterNegotiate.quote.versions[0]?.status).toBe("NEGOTIATION_REQUESTED");

    await adminAgent
      .post(`/api/v1/support-requests/${requestId}/quotes`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ method: "پست ثابت در ۳ کانال", amountRial: "30000000", estimatedChannelMin: 3, estimatedChannelMax: 3 })
      .expect(201);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/respond-to-quote`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ action: "ACCEPT" })
      .expect(201);

    const detail = (
      await adminAgent.get(`/api/v1/support-requests/${requestId}`).set("X-CSRF-Token", adminCsrf).expect(200)
    ).body as { quote: PromotionQuote };
    expect(detail.quote.status).toBe("ACCEPTED");
    // Full negotiation history preserved: v1 superseded, v2 accepted — nothing overwritten.
    expect(detail.quote.versions).toHaveLength(2);
    const v1 = detail.quote.versions.find((v) => v.versionNumber === 1);
    const v2 = detail.quote.versions.find((v) => v.versionNumber === 2);
    expect(v1?.status).toBe("SUPERSEDED");
    expect(v1?.amountRial).toBe("50000000");
    expect(v2?.status).toBe("ACCEPTED");
    expect(v2?.amountRial).toBe("30000000");

    await adminAgent.post(`/api/v1/support-requests/${requestId}/send-to-approval`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/support-requests/${requestId}/internal-approve`).set("X-CSRF-Token", adminCsrf).expect(201);

    const order = (
      await partnerAgent
        .post(`/api/v1/channels/${channelId}/support-requests/${requestId}/confirm`)
        .set("X-CSRF-Token", partnerCsrf)
        .expect(201)
    ).body as { finalAmountRial: string };
    expect(order.finalAmountRial).toBe("30000000");
  });
});
