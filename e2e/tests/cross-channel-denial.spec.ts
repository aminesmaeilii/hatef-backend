import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@hatef/database";

const prisma = new PrismaClient();

const FORBIDDEN_MESSAGE = "دسترسی لازم برای انجام این عملیات را ندارید.";

function randomIranianMobileLocalPart(): string {
  let digits = "9";
  for (let i = 0; i < 9; i += 1) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

test.describe("Phase 1 exit proof: channel-scoped ABAC", () => {
  let channelAId: string;
  let channelBId: string;
  let ownerId: string;
  let ownerRawMobile: string;

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const channelA = await prisma.channel.create({
      data: { title: `E2E Channel A ${suffix}`, eitaaId: `e2e_channel_a_${suffix}` },
    });
    const channelB = await prisma.channel.create({
      data: { title: `E2E Channel B ${suffix}`, eitaaId: `e2e_channel_b_${suffix}` },
    });
    channelAId = channelA.id;
    channelBId = channelB.id;

    const localPart = randomIranianMobileLocalPart();
    ownerRawMobile = `0${localPart}`;
    const normalizedMobile = `+98${localPart}`;

    const owner = await prisma.user.create({
      data: {
        displayName: "E2E Channel Owner",
        contacts: {
          create: { type: "MOBILE", value: normalizedMobile, verifiedAt: new Date(), isPrimary: true },
        },
      },
    });
    ownerId = owner.id;

    const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
    await prisma.channelMembership.create({
      data: { userId: owner.id, channelId: channelAId, role: "CHANNEL_OWNER", status: "ACTIVE" },
    });
    // Grant is scoped to channel A only — the owner has no assignment for channel B.
    await prisma.roleAssignment.create({
      data: { userId: owner.id, roleId: ownerRole.id, resourceType: "channel", resourceId: channelAId },
    });
  });

  test.afterAll(async () => {
    // Guard against partial setup (e.g. beforeAll failing before every id was
    // assigned) so cleanup doesn't itself throw and mask the original error.
    const channelIds = [channelAId, channelBId].filter((id): id is string => Boolean(id));
    if (channelIds.length > 0) {
      await prisma.roleAssignment.deleteMany({ where: { resourceId: { in: channelIds } } });
      await prisma.channel.deleteMany({ where: { id: { in: channelIds } } });
    }
    if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } });
    }
    await prisma.$disconnect();
  });

  test("a channel owner can read/upload in their own channel but is denied in another channel", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("09121234567").fill(ownerRawMobile);
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();

    // The dev SMS provider's code is auto-filled by the login page itself
    // (via the API's dev-only `devCode` response field) — no log-scraping needed.
    await expect(page.getByRole("button", { name: "ورود" })).toBeVisible();
    await page.getByRole("button", { name: "ورود" }).click();

    // Real login redirects through /workspace, which now sends a single-channel
    // owner to /onboarding (Phase 2) rather than straight to their files page —
    // that routing is exercised by onboarding.spec.ts. This test's concern is
    // ABAC on the files endpoint, so navigate there directly.
    await page.waitForURL("**/onboarding");
    await page.goto(`/channels/${channelAId}/files`);
    await expect(page.getByText("هنوز فایلی بارگذاری نشده است.")).toBeVisible();

    // Cross-channel read: same session, a channel this user has no grant on.
    await page.goto(`/channels/${channelBId}/files`);
    await expect(page.getByText(FORBIDDEN_MESSAGE)).toBeVisible();

    // Cross-channel upload: the mutating path must be denied too, not just reads.
    await page.setInputFiles('input[type="file"]', {
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from("not-a-real-image-but-the-guard-should-reject-before-content-is-read"),
    });
    await expect(page.getByText(FORBIDDEN_MESSAGE)).toBeVisible();

    // Back on their own channel, the same actions succeed.
    await page.goto(`/channels/${channelAId}/files`);
    await expect(page.getByText("هنوز فایلی بارگذاری نشده است.")).toBeVisible();
    await expect(page.getByText(FORBIDDEN_MESSAGE)).toHaveCount(0);
  });
});
