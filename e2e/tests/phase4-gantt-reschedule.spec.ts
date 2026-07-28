import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { generateSync } from "otplib";
import { PrismaClient } from "@hatef/database";
import { deriveKey, encryptSecret, generateTotpSecret, hashPassword } from "@hatef/auth";

const prisma = new PrismaClient();
const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL ?? "http://localhost:3000";
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_ZOOM_PIXELS_PER_DAY = 20;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

test.describe("Phase 4 exit proof: the Gantt's real drag-to-reschedule, backed by validated transition APIs", () => {
  let adminEmail: string;
  let adminUserId: string;
  let totpSecret: string;
  let dependencyTaskId: string;
  let mainTaskId: string;

  test.beforeAll(async () => {
    adminEmail = `phase4-gantt-e2e-${randomUUID().slice(0, 8)}@hatef.test`;
    const admin = await prisma.user.create({ data: { displayName: "Phase4 Gantt E2E Admin", email: adminEmail } });
    adminUserId = admin.id;
    await prisma.adminCredential.create({ data: { userId: admin.id, passwordHash: await hashPassword("Phase4-Gantt-E2E-1!") } });

    totpSecret = generateTotpSecret();
    // Mirrors backend/database/src/seed.ts's own SESSION_SECRET-derived key — matches whatever
    // is configured for this running API instance via the shared .env loaded by dotenv-cli.
    const encrypted = encryptSecret(totpSecret, deriveKey(process.env.SESSION_SECRET!, "mfa-secret"));
    await prisma.mfaMethod.create({ data: { userId: admin.id, type: "TOTP", secretEncrypted: encrypted, verifiedAt: new Date() } });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
    await prisma.roleAssignment.create({ data: { userId: admin.id, roleId: superAdminRole.id } });

    const dependency = await prisma.task.create({
      data: { title: `پیش‌نیاز گانت ${randomUUID().slice(0, 6)}`, createdById: admin.id, dueDate: new Date(Date.now() + 5 * DAY_MS) },
    });
    dependencyTaskId = dependency.id;

    const main = await prisma.task.create({
      data: {
        title: `وظیفه اصلی گانت ${randomUUID().slice(0, 6)}`,
        createdById: admin.id,
        startDate: startOfDay(new Date(Date.now() + 10 * DAY_MS)),
      },
    });
    mainTaskId = main.id;
    await prisma.taskDependency.create({ data: { taskId: main.id, dependsOnTaskId: dependency.id } });
  });

  test.afterAll(async () => {
    await prisma.taskDependency.deleteMany({ where: { taskId: mainTaskId } });
    await prisma.task.deleteMany({ where: { id: { in: [mainTaskId, dependencyTaskId] } } });
    await prisma.auditLog.deleteMany({ where: { actorId: adminUserId } });
    await prisma.user.deleteMany({ where: { id: adminUserId } });
    await prisma.$disconnect();
  });

  test("a real mouse drag reschedules the task in the backend; dragging it into an illegal position is rejected and the bar's real date is untouched", async ({ page }) => {
    await page.goto(`${ADMIN_WEB_URL}/login`);
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill("Phase4-Gantt-E2E-1!");
    await page.getByRole("button", { name: "ورود" }).click();

    await page.locator('input[inputmode="numeric"]').waitFor({ state: "visible" });
    await page.locator('input[inputmode="numeric"]').fill(generateSync({ secret: totpSecret }));
    await page.getByRole("button", { name: "تأیید" }).click();
    await page.waitForURL("**/channels");

    await page.goto(`${ADMIN_WEB_URL}/gantt`);
    // Default zoom is "week" (20px/day) — confirm it's selected so the pixel math below is exact.
    await page.getByRole("button", { name: "هفته" }).click();

    const bar = page.getByTestId(`gantt-bar-TASK-${mainTaskId}`);
    await bar.waitFor({ state: "visible" });
    const before = await prisma.task.findUniqueOrThrow({ where: { id: mainTaskId } });

    // --- valid drag: +3 days forward, well after the dependency's due date ---
    let box = await bar.boundingBox();
    if (!box) throw new Error("Gantt bar not found");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 3 * WEEK_ZOOM_PIXELS_PER_DAY, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(async () => (await prisma.task.findUniqueOrThrow({ where: { id: mainTaskId } })).startDate?.getTime(), { timeout: 10_000 })
      .toBe(before.startDate!.getTime() + 3 * DAY_MS);

    // --- invalid drag: -8 days, landing before the dependency's due date (+5 days) ---
    const afterValidDrag = await prisma.task.findUniqueOrThrow({ where: { id: mainTaskId } });
    box = await bar.boundingBox();
    if (!box) throw new Error("Gantt bar not found after reload");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 8 * WEEK_ZOOM_PIXELS_PER_DAY, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(page.getByText("تاریخ شروع نمی‌تواند قبل از سررسید وظیفه‌ی پیش‌نیاز باشد.")).toBeVisible();

    // The rejected drag never touched the real, persisted date.
    const afterInvalidDrag = await prisma.task.findUniqueOrThrow({ where: { id: mainTaskId } });
    expect(afterInvalidDrag.startDate?.getTime()).toBe(afterValidDrag.startDate!.getTime());
  });
});
