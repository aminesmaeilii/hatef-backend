import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { generateSync } from "otplib";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";
import type { AuthSessionResponse, FormSubmissionRevision, OtpRequestResponse } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { createTestApp } from "./create-test-app";

function randomIranianMobile(): { raw: string; normalized: string } {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return { raw: `0${local}`, normalized: `+98${local}` };
}

describe("Phase 2: form engine immutability + evaluation workflow (integration, real DB)", () => {
  const testStartedAt = new Date();
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAgent: ReturnType<typeof request.agent>;
  let adminCsrf: string;
  let partnerAgent: ReturnType<typeof request.agent>;
  let partnerCsrf: string;

  let channelId: string;
  let partnerUserId: string;
  let formId: string;
  let submissionId: string;
  let requiredFieldId: string;
  let secondFieldId: string;
  let requiredFieldKey: string;
  let secondFieldKey: string;

  const mobile = randomIranianMobile();
  const adminEmail = `phase2-admin-${randomUUID().slice(0, 8)}@hatef.test`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const config = app.get(AppConfigService);

    // --- internal SUPER_ADMIN test user, real login + MFA (not a DB shortcut) ---
    const adminUser = await prisma.user.create({ data: { displayName: "Phase2 Test Admin", email: adminEmail } });
    await prisma.adminCredential.create({
      data: { userId: adminUser.id, passwordHash: await hashPassword("Phase2-Test-Password-1!") },
    });
    const totpSecret = generateTotpSecret();
    const encrypted = encryptSecret(totpSecret, deriveKey(config.env.SESSION_SECRET, "mfa-secret"));
    await prisma.mfaMethod.create({
      data: { userId: adminUser.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() },
    });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });

    adminAgent = request.agent(app.getHttpServer());
    const loginRes = await adminAgent
      .post("/api/v1/auth/internal/login")
      .send({ email: adminEmail, password: "Phase2-Test-Password-1!" })
      .expect(201);
    expect(loginRes.body.status).toBe("mfa_required");
    const code = generateSync({ secret: totpSecret });
    const adminSession = (
      await adminAgent
        .post("/api/v1/auth/internal/mfa/verify")
        .send({ mfaToken: loginRes.body.mfaToken, code })
        .expect(201)
    ).body as AuthSessionResponse;
    adminCsrf = adminSession.csrfToken;

    // --- partner user + channel via real OTP login ---
    partnerAgent = request.agent(app.getHttpServer());
    const otpReq = (
      await partnerAgent.post("/api/v1/auth/partner/otp/request").send({ mobile: mobile.raw }).expect(201)
    ).body as OtpRequestResponse;
    const partnerSession = (
      await partnerAgent
        .post("/api/v1/auth/partner/otp/verify")
        .send({ mobile: mobile.raw, code: otpReq.devCode })
        .expect(201)
    ).body as AuthSessionResponse;
    partnerCsrf = partnerSession.csrfToken;
    partnerUserId = partnerSession.user.id;

    const channel = await prisma.channel.create({
      data: { title: "Phase 2 Test Channel", eitaaId: `phase2_test_${randomUUID().slice(0, 8)}` },
    });
    channelId = channel.id;
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({
      data: { userId: partnerUserId, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" },
    });
    await prisma.roleAssignment.create({
      data: { userId: partnerUserId, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId },
    });
  });

  afterAll(async () => {
    // The correction-request flow exercised here now posts a real notification
    // (Phase 6), enqueuing a real OutboxEvent row for the worker.
    await prisma.outboxEvent.deleteMany({
      where: { eventType: { in: ["notification.deliver", "report.run.requested"] }, createdAt: { gte: testStartedAt } },
    });
    // FormSubmission -> FormVersion has no cascade in that direction (a form
    // submission is deliberately not wiped out just because the form record
    // is deleted), so it — and everything cascading from it (EvaluationCase
    // and its children) — must go before the Form itself.
    if (submissionId) {
      await prisma.formSubmission.deleteMany({ where: { id: submissionId } });
    }
    if (formId) {
      await prisma.form.deleteMany({ where: { id: formId } }); // cascades versions/pages/sections/fields/rules
    }
    await prisma.roleAssignment.deleteMany({ where: { resourceId: channelId } });
    await prisma.channel.deleteMany({ where: { id: channelId } });
    if (partnerUserId) {
      await prisma.auditLog.deleteMany({ where: { actorId: partnerUserId } });
      await prisma.user.deleteMany({ where: { id: partnerUserId } });
    }
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (adminUser) {
      await prisma.auditLog.deleteMany({ where: { actorId: adminUser.id } });
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    await app.close();
  });

  it("builds a form through the engine, publishes it, and rejects edits to the published version", async () => {
    const created = await adminAgent
      .post("/api/v1/forms")
      .set("X-CSRF-Token", adminCsrf)
      .send({ key: `phase2-test-form-${randomUUID().slice(0, 8)}`, title: "Phase 2 Test Form" })
      .expect(201);
    formId = created.body.formId;

    const page = await adminAgent
      .post(`/api/v1/forms/${formId}/pages`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ title: "Page 1" })
      .expect(201);
    const section = await adminAgent
      .post(`/api/v1/forms/pages/${page.body.id}/sections`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ title: "Section 1" })
      .expect(201);
    const fieldA = await adminAgent
      .post(`/api/v1/forms/sections/${section.body.id}/fields`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ key: "required_field", label: "Required field", type: "TEXT", required: true })
      .expect(201);
    const fieldB = await adminAgent
      .post(`/api/v1/forms/sections/${section.body.id}/fields`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ key: "optional_field", label: "Optional field", type: "TEXT", required: false })
      .expect(201);
    requiredFieldId = fieldA.body.id;
    secondFieldId = fieldB.body.id;
    requiredFieldKey = fieldA.body.key;
    secondFieldKey = fieldB.body.key;

    await adminAgent.post(`/api/v1/forms/${formId}/publish`).set("X-CSRF-Token", adminCsrf).expect(201);

    // The published version can no longer accept new fields.
    const rejected = await adminAgent
      .post(`/api/v1/forms/sections/${section.body.id}/fields`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ key: "too_late", label: "Too late", type: "TEXT", required: false });
    expect(rejected.status).toBe(400);

    const detail = await adminAgent.get(`/api/v1/forms/${formId}`).expect(200);
    expect(detail.body.draft).toBeNull();
    expect(detail.body.published.versionNumber).toBe(1);
  });

  it("autosaves, enforces required fields at submit, and creates a real revision + evaluation case", async () => {
    const formWithVersions = await prisma.form.findUniqueOrThrow({ where: { id: formId }, include: { versions: true } });
    const submission = await prisma.formSubmission.create({
      data: { formVersionId: formWithVersions.versions[0]!.id, channelId, submitterId: partnerUserId },
    });
    submissionId = submission.id;

    await partnerAgent
      .patch(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/answers`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ answers: { [secondFieldId]: "filled in but not the required one" } })
      .expect(200);

    const failedSubmit = await partnerAgent
      .post(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ acceptedConsentDocumentIds: [] });
    expect(failedSubmit.status).toBe(400);
    expect(failedSubmit.body.message).toContain("Required field");

    await partnerAgent
      .patch(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/answers`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ answers: { [requiredFieldId]: "first answer" } })
      .expect(200);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ acceptedConsentDocumentIds: [] })
      .expect(201);

    const revisions = (
      await partnerAgent.get(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/revisions`).expect(200)
    ).body as FormSubmissionRevision[];
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.snapshot[requiredFieldKey]).toBe("first answer");

    const evalCase = await prisma.evaluationCase.findUniqueOrThrow({ where: { formSubmissionId: submissionId } });
    expect(evalCase.status).toBe("SUBMITTED");
  });

  it("takes a correction request through field-level resubmission to a diffable second revision", async () => {
    const evalCase = await prisma.evaluationCase.findUniqueOrThrow({ where: { formSubmissionId: submissionId } });

    // Move the case to UNDER_REVIEW (SUBMITTED -> IDENTITY_CHECK -> UNDER_REVIEW) before requesting a correction.
    await adminAgent.post(`/api/v1/evaluation/cases/${evalCase.id}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);
    await adminAgent.post(`/api/v1/evaluation/cases/${evalCase.id}/advance`).set("X-CSRF-Token", adminCsrf).expect(201);

    await adminAgent
      .post(`/api/v1/evaluation/cases/${evalCase.id}/request-correction`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ requestedFieldKeys: [requiredFieldKey], message: "Please clarify the required field." })
      .expect(201);

    const afterRequest = await prisma.evaluationCase.findUniqueOrThrow({ where: { id: evalCase.id } });
    expect(afterRequest.status).toBe("NEEDS_CHANGES");

    // The partner can only patch the flagged field now — an unflagged field is silently ignored.
    await partnerAgent
      .patch(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/answers`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ answers: { [secondFieldId]: "should be ignored", [requiredFieldId]: "corrected answer" } })
      .expect(200);

    await partnerAgent
      .post(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/submit`)
      .set("X-CSRF-Token", partnerCsrf)
      .send({ acceptedConsentDocumentIds: [] })
      .expect(201);

    const afterResubmit = await prisma.evaluationCase.findUniqueOrThrow({ where: { id: evalCase.id } });
    expect(afterResubmit.status).toBe("RESUBMITTED");

    const openRequests = await prisma.informationRequest.findMany({
      where: { evaluationCaseId: evalCase.id, status: "OPEN" },
    });
    expect(openRequests).toHaveLength(0);

    const revisions = (
      await partnerAgent.get(`/api/v1/channels/${channelId}/form-submissions/${submissionId}/revisions`).expect(200)
    ).body as FormSubmissionRevision[];
    expect(revisions).toHaveLength(2);
    expect(revisions[0]?.snapshot[requiredFieldKey]).toBe("first answer");
    expect(revisions[1]?.snapshot[requiredFieldKey]).toBe("corrected answer");
    // The "ignored" second-field edit still didn't make it into the second revision either,
    // since the correction only opened `requiredFieldKey` for editing.
    expect(revisions[1]?.snapshot[secondFieldKey]).toBe(revisions[0]?.snapshot[secondFieldKey]);
  });

  it("keeps a submission pinned to its original form version after a new version is published", async () => {
    const before = await prisma.formSubmission.findUniqueOrThrow({ where: { id: submissionId } });

    // Triggers a new draft (v2, cloned from v1) and publishes it.
    await adminAgent
      .post(`/api/v1/forms/${formId}/pages`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ title: "Page added in v2" })
      .expect(201);
    await adminAgent.post(`/api/v1/forms/${formId}/publish`).set("X-CSRF-Token", adminCsrf).expect(201);

    const publishedVersions = await prisma.formVersion.findMany({ where: { formId }, orderBy: { versionNumber: "asc" } });
    expect(publishedVersions).toHaveLength(2);
    expect(publishedVersions[1]?.status).toBe("PUBLISHED");
    expect(publishedVersions[0]?.status).toBe("ARCHIVED");

    const after = await prisma.formSubmission.findUniqueOrThrow({ where: { id: submissionId } });
    expect(after.formVersionId).toBe(before.formVersionId);
    expect(after.formVersionId).toBe(publishedVersions[0]?.id);
  });
});
