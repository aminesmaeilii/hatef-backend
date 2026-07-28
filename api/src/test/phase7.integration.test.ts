import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import type { AuthSessionResponse, FileAsset, OtpRequestResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { createTestApp } from "./create-test-app";

const PNG_MAGIC_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

describe("Phase 7: security hardening — step-up, file quarantine, file-count limit, rate limiting (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let adminEmail: string;
  let adminPassword: string;
  let adminTotpSecret: string;
  let adminUserId: string;

  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;
  let partnerUserId: string;

  let channelId: string;

  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const config = app.get(AppConfigService);

    adminEmail = `phase7-admin-${randomUUID().slice(0, 8)}@hatef.test`;
    adminPassword = "Phase7-Test-Password-1!";
    const adminUser = await prisma.user.create({ data: { displayName: "Phase7 Test Admin", email: adminEmail } });
    adminUserId = adminUser.id;
    createdUserIds.push(adminUserId);
    await prisma.adminCredential.create({ data: { userId: adminUserId, passwordHash: await hashPassword(adminPassword) } });
    adminTotpSecret = generateTotpSecret();
    const encrypted = encryptSecret(adminTotpSecret, deriveKey(config.env.SESSION_SECRET, "mfa-secret"));
    await prisma.mfaMethod.create({ data: { userId: adminUserId, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: adminUserId, roleId: superAdminRole.id } });

    adminAgent = request.agent(app.getHttpServer());
    const loginRes = await adminAgent.post("/api/v1/auth/internal/login").send({ email: adminEmail, password: adminPassword }).expect(201);
    const code = generateSync({ secret: adminTotpSecret });
    const adminSession = (
      await adminAgent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: loginRes.body.mfaToken, code }).expect(201)
    ).body as AuthSessionResponse;
    adminCsrf = adminSession.csrfToken;
    // Deliberately no step-up call here — several tests below need this
    // agent to still be *un*-verified.

    const mobile = randomIranianMobile();
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201)).body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent.post("/api/v1/auth/partner/otp/verify").send({ mobile: mobile.raw, code: otpReq.devCode }).expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;
    createdUserIds.push(partnerUserId);

    const channel = await prisma.channel.create({ data: { title: "Phase 7 Test Channel", eitaaId: `phase7_test_${randomUUID().slice(0, 8)}` } });
    channelId = channel.id;
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { eventType: "notification.deliver", createdAt: { gte: testStartedAt } } });
    await prisma.fileAccessEvent.deleteMany({ where: { file: { channelId } } });
    await prisma.fileAsset.deleteMany({ where: { channelId } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.roleAssignment.deleteMany({ where: { resourceId: channelId } });
    await prisma.channel.deleteMany({ where: { id: channelId } });
    await prisma.mfaMethod.deleteMany({ where: { userId: adminUserId } });
    await prisma.adminCredential.deleteMany({ where: { userId: adminUserId } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  it("blocks a sensitive financial action (settlement decide) without a fresh step-up, then allows it after one", async () => {
    // Guards run before the handler, so a nonexistent settlement id is fine
    // for proving the guard itself — the 403 must come from StepUpGuard,
    // not from the service ever being reached.
    const blocked = await adminAgent
      .post(`/api/v1/settlements/${randomUUID()}/decide`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ action: "APPROVE" });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe("STEP_UP_REQUIRED");

    const code = generateSync({ secret: adminTotpSecret });
    await adminAgent.post("/api/v1/auth/internal/step-up").set("X-CSRF-Token", adminCsrf).send({ code }).expect(201);

    const afterStepUp = await adminAgent
      .post(`/api/v1/settlements/${randomUUID()}/decide`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ action: "APPROVE" });
    // Past the guard now — whatever happens next (the fake settlement id
    // isn't found), it is no longer StepUpGuard rejecting the request.
    expect(afterStepUp.status).not.toBe(403);
  });

  it("blocks price/approve without step-up using the same guard", async () => {
    // This agent has no step-up session at all (a brand-new login).
    const freshAgent = request.agent(app.getHttpServer());
    const freshLogin = await freshAgent.post("/api/v1/auth/internal/login").send({ email: adminEmail, password: adminPassword }).expect(201);
    const freshCode = generateSync({ secret: adminTotpSecret });
    const freshSession = (
      await freshAgent.post("/api/v1/auth/internal/mfa/verify").send({ mfaToken: freshLogin.body.mfaToken, code: freshCode }).expect(201)
    ).body as AuthSessionResponse;

    const blocked = await freshAgent
      .post(`/api/v1/support-requests/${randomUUID()}/price/approve`)
      .set("X-CSRF-Token", freshSession.csrfToken)
      .send({});
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe("STEP_UP_REQUIRED");
  });

  it("quarantines an infected file: it stays recorded for audit but its download is blocked", async () => {
    const uploadRes = await partnerAgent
      .post(`/api/v1/channels/${channelId}/files`)
      .set("X-CSRF-Token", partnerCsrf)
      .attach("file", PNG_MAGIC_BYTES, { filename: "quarantine-me.png", contentType: "image/png" })
      .expect(201);
    const uploaded = uploadRes.body as FileAsset;
    expect(uploaded.scanStatus).toBe("CLEAN");

    // The dev antivirus provider always reports clean; simulate the live
    // provider's positive detection directly against the row it would have
    // written, so this test exercises the download-blocking logic for real
    // rather than re-testing the (already-fake) scanner itself.
    await prisma.fileAsset.update({ where: { id: uploaded.id }, data: { scanStatus: "INFECTED" } });

    const blocked = await partnerAgent.get(`/api/v1/channels/${channelId}/files/${uploaded.id}`);
    expect(blocked.status).toBe(403);

    const blockedEvent = await prisma.fileAccessEvent.findFirst({
      where: { fileId: uploaded.id, action: "DOWNLOAD_BLOCKED" },
    });
    expect(blockedEvent).not.toBeNull();

    const auditRow = await prisma.auditLog.findFirst({
      where: { action: "file.quarantine_download_blocked", entityId: uploaded.id },
    });
    expect(auditRow).not.toBeNull();
  });

  it("rejects a new upload once a channel's file count reaches MAX_FILES_PER_CHANNEL", async () => {
    const config = app.get(AppConfigService);
    const limit = config.env.MAX_FILES_PER_CHANNEL;

    const existing = await prisma.fileAsset.count({ where: { channelId } });
    const toCreate = limit - existing;
    expect(toCreate).toBeGreaterThan(0);

    await prisma.fileAsset.createMany({
      data: Array.from({ length: toCreate }, (_, i) => ({
        uploaderId: partnerUserId,
        channelId,
        storageKey: `uploads/${channelId}/filler-${i}-${randomUUID()}`,
        originalName: `filler-${i}.png`,
        mimeType: "image/png",
        sizeBytes: 12,
        checksumSha256: randomUUID(),
        scanStatus: "CLEAN",
      })),
    });

    const atLimitCount = await prisma.fileAsset.count({ where: { channelId } });
    expect(atLimitCount).toBe(limit);

    const rejected = await partnerAgent
      .post(`/api/v1/channels/${channelId}/files`)
      .set("X-CSRF-Token", partnerCsrf)
      .attach("file", PNG_MAGIC_BYTES, { filename: "over-limit.png", contentType: "image/png" });
    expect(rejected.status).toBe(400);
  });

  it("rate-limits repeated internal login attempts from the same client", async () => {
    const rapidAgent = request.agent(app.getHttpServer());
    const responses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      const res = await rapidAgent.post("/api/v1/auth/internal/login").send({ email: "nobody@hatef.test", password: "wrong" });
      responses.push(res.status);
    }
    expect(responses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
