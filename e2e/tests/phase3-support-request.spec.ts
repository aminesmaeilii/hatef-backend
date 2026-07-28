import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@hatef/database";

const prisma = new PrismaClient();

function randomIranianMobileRaw(): string {
  let local = "9";
  for (let i = 0; i < 9; i += 1) local += Math.floor(Math.random() * 10);
  return `0${local}`;
}

test.describe("Phase 3 exit proof: real first-position pin request through the partner UI", () => {
  let channelId: string;
  let ownerId: string;

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const channel = await prisma.channel.create({
      data: { title: `Phase 3 E2E Channel ${suffix}`, eitaaId: `phase3_e2e_${suffix}`, status: "ACTIVE" },
    });
    channelId = channel.id;
  });

  test.afterAll(async () => {
    if (channelId) {
      await prisma.supportRequest.deleteMany({ where: { channelId } });
      await prisma.roleAssignment.deleteMany({ where: { resourceId: channelId } });
      await prisma.channel.deleteMany({ where: { id: channelId } });
    }
    if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } });
    }
    await prisma.$disconnect();
  });

  test("a real channel owner picks the pin type, sees the live published rate, submits, and lands on a real progress page", async ({ page }) => {
    const mobile = randomIranianMobileRaw();
    const normalizedMobile = `+98${mobile.slice(1)}`;

    const owner = await prisma.user.create({
      data: { displayName: "Phase 3 E2E Owner", contacts: { create: { type: "MOBILE", value: normalizedMobile, verifiedAt: new Date(), isPrimary: true } } },
    });
    ownerId = owner.id;
    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({ data: { userId: owner.id, channelId, role: "CHANNEL_OWNER", status: "ACTIVE" } });
    await prisma.roleAssignment.create({ data: { userId: owner.id, roleId: ownerRole.id, resourceType: "channel", resourceId: channelId } });

    // --- real login via the actual UI ---
    await page.goto("/login");
    await page.getByPlaceholder("09121234567").fill(mobile);
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
    await expect(page.getByRole("button", { name: "ورود" })).toBeVisible();
    await page.getByRole("button", { name: "ورود" }).click();
    await page.waitForURL("**/onboarding");

    // This channel is already ACTIVE (bypasses onboarding/evaluation, which
    // Phase 2's own e2e spec already covers) — go straight to the new request form.
    await page.goto("/promotions/new");

    // The type picker is real published data from the API, not hardcoded options.
    await expect(page.locator("select").first()).toContainText("پین رتبه اول");
    await expect(page.locator("select").first()).toContainText("پروموشن متغیر چندکاناله");
    // The CALCULATED-pricing fields section rendered because the pin type (first published option) is selected by default.
    await expect(page.getByText("جزئیات پین رتبه اول")).toBeVisible();

    // Fill the pin-specific fields by label proximity (generic-by-position, like onboarding.spec.ts).
    const adTitleInput = page.locator("label", { hasText: "عنوان تبلیغ" }).locator("input");
    await adTitleInput.fill("تبلیغ آزمایشی فاز ۳");

    const viewsInput = page.locator("label", { hasText: "تعداد بازدید یکتای درخواستی" }).locator("input");
    await viewsInput.fill("10000");

    // Real backend-authoritative rate (240 rial/view, spec 13.1) reflected live in the estimate, not a static number.
    await expect(page.getByText("برآورد هزینه: ۲٬۴۰۰٬۰۰۰ ریال")).toBeVisible();

    await page.getByRole("button", { name: "ارسال درخواست" }).click();

    // Lands on a real progress page for a real, freshly-created SupportRequest.
    await page.waitForURL(/\/promotions\/[0-9a-f-]+/);
    await expect(page.getByRole("heading", { name: "پین رتبه اول" })).toBeVisible();
    await expect(page.getByText("ارسال‌شده").first()).toBeVisible();

    // The list view reflects the same real request, not a static placeholder.
    await page.goto("/promotions");
    await expect(page.getByText("پین رتبه اول")).toBeVisible();

    const requestInDb = await prisma.supportRequest.findFirstOrThrow({ where: { channelId } });
    expect(requestInDb.status).toBe("SUBMITTED");
    expect(requestInDb.requestedUniqueViews).toBe(10_000);
  });
});
