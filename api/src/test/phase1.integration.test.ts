import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import type {
  AuthSessionResponse,
  Channel,
  FileAsset,
  MeResponse,
  OtpRequestResponse,
} from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { createTestApp } from "./create-test-app";

const PNG_MAGIC_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

// One OTP login per mobile number is reused across every `it` below (rather
// than logging in per-test) because the OTP resend cooldown would otherwise
// suppress the dev code on a second /otp/request for the same number within
// OTP_RESEND_COOLDOWN_SECONDS.
describe("Phase 1: auth, RBAC/ABAC, and files (integration, real DB/Redis/MinIO)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let session: AuthSessionResponse;

  let channelAId: string;
  let channelBId: string;
  let userId: string;

  const mobile = randomIranianMobile();

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const suffix = randomUUID().slice(0, 8);
    const [channelA, channelB] = await Promise.all([
      prisma.channel.create({ data: { title: `Integration Channel A ${suffix}`, eitaaId: `int_channel_a_${suffix}` } }),
      prisma.channel.create({ data: { title: `Integration Channel B ${suffix}`, eitaaId: `int_channel_b_${suffix}` } }),
    ]);
    channelAId = channelA.id;
    channelBId = channelB.id;

    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    if (userId) {
      await prisma.auditLog.deleteMany({ where: { actorId: userId } });
    }
    await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: [channelAId, channelBId] } } });
    await prisma.channel.deleteMany({ where: { id: { in: [channelAId, channelBId] } } });
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it("issues a real DB-backed session via partner OTP and records an audit trail", async () => {
    const requestRes = await agent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201);
    const { devCode } = requestRes.body as OtpRequestResponse;
    expect(devCode).toMatch(/^\d{6}$/);

    const verifyRes = await agent
      .post("/api/v1/auth/partner/otp/verify")
      .send({ mobile: mobile.raw, code: devCode })
      .expect(201);
    session = verifyRes.body as AuthSessionResponse;
    expect(session.user.id).toBeTruthy();
    expect(session.csrfToken).toBeTruthy();
    expect(verifyRes.headers["set-cookie"]?.[0]).toMatch(/^hatef_session=/);

    userId = session.user.id;

    const meRes = await agent.get("/api/v1/auth/me/contexts").expect(200);
    expect((meRes.body as MeResponse).user.id).toBe(userId);

    const auditRow = await prisma.auditLog.findFirst({
      where: { action: "otp.verified", entityId: userId },
      orderBy: { createdAt: "desc" },
    });
    expect(auditRow).not.toBeNull();
  });

  it("enforces channel-scoped ABAC: denies a channel the user has no grant on, allows their own", async () => {
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({
      data: { userId, channelId: channelAId, role: "CHANNEL_OWNER", status: "ACTIVE" },
    });
    await prisma.roleAssignment.create({
      data: { userId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelAId },
    });

    await agent.get(`/api/v1/channels/${channelBId}/files`).expect(403);

    const ownChannelRes = await agent.get(`/api/v1/channels/${channelAId}/files`).expect(200);
    expect(ownChannelRes.body as FileAsset[]).toEqual([]);

    const channelRes = await agent.get(`/api/v1/channels/${channelAId}`).expect(200);
    expect((channelRes.body as Channel).id).toBe(channelAId);
  });

  it("persists real uploaded file metadata and issues a working signed download URL", async () => {
    const uploadRes = await agent
      .post(`/api/v1/channels/${channelAId}/files`)
      .set("X-CSRF-Token", session.csrfToken)
      .attach("file", PNG_MAGIC_BYTES, { filename: "fixture.png", contentType: "image/png" })
      .expect(201);

    const uploaded = uploadRes.body as FileAsset;
    expect(uploaded.mimeType).toBe("image/png");
    expect(uploaded.scanStatus).toBe("CLEAN");

    const dbRow = await prisma.fileAsset.findUniqueOrThrow({ where: { id: uploaded.id } });
    expect(dbRow.channelId).toBe(channelAId);
    expect(dbRow.sizeBytes).toBe(PNG_MAGIC_BYTES.length);

    const getRes = await agent.get(`/api/v1/channels/${channelAId}/files/${uploaded.id}`).expect(200);
    expect((getRes.body as FileAsset).downloadUrl).toContain(dbRow.storageKey);

    const uploadEvent = await prisma.fileAccessEvent.findFirst({
      where: { fileId: uploaded.id, action: "UPLOAD" },
    });
    expect(uploadEvent).not.toBeNull();
  });

  it("rejects a mutating request without the CSRF header even with a valid session cookie", async () => {
    await agent
      .post(`/api/v1/channels/${channelAId}/files`)
      .attach("file", PNG_MAGIC_BYTES, { filename: "no-csrf.png", contentType: "image/png" })
      .expect(401);
  });
});
