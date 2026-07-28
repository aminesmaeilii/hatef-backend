import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@hatef/database";

const prisma = new PrismaClient();

const TINY_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const SAMPLE_TEXT = "نمونه پاسخ آزمایشی";

function randomIranianMobileRaw(): string {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return `0${local}`;
}

/** Fills every visible field on the wizard's *current* page generically (by input type, not by field key) — only one page's fields are ever mounted at a time. */
async function fillCurrentPage(page: Page): Promise<void> {
  const textLike = page.locator('main input:not([type="checkbox"]):not([type="file"]):not([type="number"])');
  for (let i = 0; i < (await textLike.count()); i += 1) {
    await textLike.nth(i).fill(SAMPLE_TEXT);
  }

  // LONG_TEXT fields render as <textarea>, not <input> — several required
  // questions (proposed_scenario, org_structure, ...) are this type.
  const textareas = page.locator("main textarea");
  for (let i = 0; i < (await textareas.count()); i += 1) {
    await textareas.nth(i).fill(SAMPLE_TEXT);
  }

  const numbers = page.locator('main input[type="number"]');
  for (let i = 0; i < (await numbers.count()); i += 1) {
    await numbers.nth(i).fill("5");
  }

  const selects = page.locator("main select");
  for (let i = 0; i < (await selects.count()); i += 1) {
    await selects.nth(i).selectOption({ index: 1 });
  }

  const checkboxes = page.locator('main input[type="checkbox"]');
  for (let i = 0; i < (await checkboxes.count()); i += 1) {
    await checkboxes.nth(i).check();
  }

  const fileInputCount = await page.locator('main input[type="file"]').count();
  for (let i = 0; i < fileInputCount; i += 1) {
    // Re-query each time: uploading one file re-renders and can detach earlier handles.
    await page.locator('main input[type="file"]').nth(i).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: TINY_PNG });
  }
  if (fileInputCount > 0) {
    await expect(page.getByText("فایل بارگذاری شد.").first()).toBeVisible({ timeout: 10_000 });
  }
}

test.describe("Phase 2 exit proof: mobile onboarding, reload persistence, and a correction round trip", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("submits the real 28-question wizard, survives a mid-flow reload, and a correction resubmits into a diffable second revision", async ({
    page,
  }) => {
    test.setTimeout(120_000); // 6 real pages + a real file upload + a reload — genuinely slower than the 30s default.
    const mobile = randomIranianMobileRaw();

    // --- real login (mobile + dev OTP), driven through the actual UI ---
    await page.goto("/login");
    await page.getByPlaceholder("09121234567").fill(mobile);
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
    await expect(page.getByRole("button", { name: "ورود" })).toBeVisible();
    await page.getByRole("button", { name: "ورود" }).click();

    await page.waitForURL("**/onboarding");
    await expect(page.getByText(/مرحله 1 از 6/)).toBeVisible();

    // --- page 1: fill, wait out the autosave debounce (900ms), then reload and confirm the answer survived server-side ---
    await fillCurrentPage(page);
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText(/مرحله 1 از 6/)).toBeVisible();
    const firstField = page.locator('main input:not([type="checkbox"]):not([type="file"]):not([type="number"])').first();
    await expect(firstField).toHaveValue(SAMPLE_TEXT);

    // --- walk pages 1..5, filling whichever page is *currently* showing, then submit on the last ---
    for (let pageIndex = 0; pageIndex < 6; pageIndex += 1) {
      if (pageIndex > 0) {
        // "Next"/"Submit" now await a real network flush of any pending
        // autosave before navigating (a real product fix, see page.tsx) —
        // the page transition is therefore not instantaneous; wait for it.
        await expect(page.getByText(new RegExp(`مرحله ${pageIndex + 1} از 6`))).toBeVisible();
        await fillCurrentPage(page); // page 0 was already filled (and reload-checked) above
      }
      if (pageIndex < 5) {
        await page.getByRole("button", { name: "مرحله بعد" }).click();
      } else {
        await page.getByRole("button", { name: "ثبت نهایی" }).click();
      }
    }

    await page.waitForURL("**/assessment");
    await expect(page.getByText("در حال بررسی")).toBeVisible();

    const submission = await prisma.formSubmission.findFirstOrThrow({
      where: { submitter: { contacts: { some: { value: `+98${mobile.slice(1)}` } } } },
      orderBy: { createdAt: "desc" },
    });
    const firstRevisions = await prisma.formSubmissionRevision.findMany({ where: { formSubmissionId: submission.id } });
    expect(firstRevisions).toHaveLength(1);

    // --- an evaluator requests a correction. The admin API path itself is already
    // covered by a real HTTP+MFA integration test (phase2.integration.test.ts); here
    // the fixture is set up directly so this E2E test's effort goes into proving the
    // *partner's* browser experience reacts correctly to that real DB state. ---
    const evalCase = await prisma.evaluationCase.findUniqueOrThrow({ where: { formSubmissionId: submission.id } });
    const correctionMessage = `Please double-check this field. (${randomUUID().slice(0, 8)})`;
    await prisma.evaluationCase.update({ where: { id: evalCase.id }, data: { status: "NEEDS_CHANGES" } });
    await prisma.informationRequest.create({
      data: {
        evaluationCaseId: evalCase.id,
        requestedFieldKeys: ["full_name"],
        message: correctionMessage,
        createdBy: submission.submitterId,
      },
    });

    // --- partner returns to onboarding: only the flagged field is editable ---
    await page.goto("/onboarding");
    await expect(page.getByText("اصلاح اطلاعات درخواستی")).toBeVisible();
    await expect(page.getByText(correctionMessage)).toBeVisible();

    const correctedName = `Corrected Name ${randomUUID().slice(0, 8)}`;
    await page.locator("main input").first().fill(correctedName);
    await page.getByRole("button", { name: "ارسال اصلاحات" }).click();

    await page.waitForURL("**/assessment");
    await expect(page.getByText("در حال بررسی")).toBeVisible();

    const afterResubmit = await prisma.evaluationCase.findUniqueOrThrow({ where: { id: evalCase.id } });
    expect(afterResubmit.status).toBe("RESUBMITTED");

    const openRequests = await prisma.informationRequest.findMany({
      where: { evaluationCaseId: evalCase.id, status: "OPEN" },
    });
    expect(openRequests).toHaveLength(0);

    const revisions = await prisma.formSubmissionRevision.findMany({
      where: { formSubmissionId: submission.id },
      orderBy: { revisionNumber: "asc" },
    });
    expect(revisions).toHaveLength(2);
    const firstSnapshot = revisions[0]?.snapshot as Record<string, unknown>;
    const secondSnapshot = revisions[1]?.snapshot as Record<string, unknown>;
    expect(secondSnapshot.full_name).toBe(correctedName);
    expect(firstSnapshot.full_name).not.toBe(secondSnapshot.full_name);
  });
});
