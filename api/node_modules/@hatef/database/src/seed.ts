import {
  INTERNAL_ROLES,
  PARTNER_ROLES,
  ROLE_PERMISSIONS,
  PERMISSIONS,
  deriveKey,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashPassword,
  hashRecoveryCode,
} from "@hatef/auth";
import { normalizeEitaaId, normalizeIranianMobile } from "@hatef/domain";
import { loadEnv } from "@hatef/config";
import { PrismaClient } from "../generated/client/index";
import { ONBOARDING_PAGES, ONBOARDING_RULES } from "./onboarding-form-definition";

const prisma = new PrismaClient();
const ONBOARDING_FORM_KEY = "channel-onboarding";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run development seed data in production.");
  }

  const env = loadEnv(process.env);

  await prisma.featureFlag.upsert({
    where: { key: "sms_provider_live" },
    update: {},
    create: {
      key: "sms_provider_live",
      description: "Enables the live SMS provider instead of the development console provider.",
      enabled: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: "web_push" },
    update: {},
    create: {
      key: "web_push",
      description: "Enables web-push notification delivery for the partner PWA.",
      enabled: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: "surveys" },
    update: {},
    create: {
      key: "surveys",
      description: "Enables the survey module built on top of the shared form engine.",
      enabled: true,
    },
  });

  await seedRbac();
  await seedDevAccounts(env.SESSION_SECRET, env.OTP_HASH_PEPPER, env.MFA_ISSUER);
  await seedConsentDocuments();
  await seedOnboardingForm();
  await seedEvaluationRubric();
  await seedPromotionTypes();
  await seedServiceCatalog();

  console.log("Seed complete: feature flags, RBAC catalog, dev-only accounts, onboarding form, rubric, promotion types, and service catalog created.");
}

async function seedRbac(): Promise<void> {
  for (const key of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  for (const key of INTERNAL_ROLES) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key, scope: "INTERNAL" } });
  }
  for (const key of PARTNER_ROLES) {
    await prisma.role.upsert({ where: { key }, update: {}, create: { key, scope: "PARTNER" } });
  }

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
    for (const permissionKey of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

/**
 * Dev-only fixtures: one internal SUPER_ADMIN (email/password + TOTP MFA
 * enrolled) and two channels each with one CHANNEL_OWNER partner user — the
 * minimum needed to exercise the cross-channel-denial story locally and in
 * the Playwright E2E suite. Never runs in production (guarded above).
 */
async function seedDevAccounts(sessionSecret: string, otpPepper: string, mfaIssuer: string): Promise<void> {
  const superAdminEmail = "admin@hatef.dev";
  const superAdminMobile = normalizeIranianMobile("09120000000");
  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: { displayName: "مدیر کل هاتف", email: superAdminEmail },
    });
  }

  await prisma.userContact.upsert({
    where: { type_value: { type: "MOBILE", value: superAdminMobile } },
    update: { userId: superAdmin.id, verifiedAt: new Date(), isPrimary: true },
    create: { userId: superAdmin.id, type: "MOBILE", value: superAdminMobile, verifiedAt: new Date(), isPrimary: true },
  });

  const passwordHash = await hashPassword("Dev-Only-Password-123!");
  await prisma.adminCredential.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id, passwordHash },
  });

  const totpSecret = generateTotpSecret();
  const encryptedSecret = encryptSecret(totpSecret, deriveKey(sessionSecret, "mfa-secret"));
  const existingMfa = await prisma.mfaMethod.findFirst({ where: { userId: superAdmin.id } });
  if (!existingMfa) {
    await prisma.mfaMethod.create({
      data: { userId: superAdmin.id, type: "TOTP", secretEncrypted: encryptedSecret, verifiedAt: new Date() },
    });
    const recoveryCodes = generateRecoveryCodes();
    await prisma.mfaRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({ userId: superAdmin!.id, codeHash: hashRecoveryCode(code, otpPepper) })),
    });
    console.log(`Dev SUPER_ADMIN: ${superAdminEmail} / Dev-Only-Password-123! (TOTP secret: ${totpSecret}, issuer: ${mfaIssuer})`);
  }

  // A global (unscoped) RoleAssignment has NULL resourceType/resourceId, and
  // Postgres unique constraints treat every NULL as distinct — so the
  // compound-unique upsert below can't rely on ON CONFLICT here the way it
  // can for channel-scoped rows. Check-then-create instead, to keep reseeding
  // idempotent.
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
  const existingSuperAdminAssignment = await prisma.roleAssignment.findFirst({
    where: { userId: superAdmin.id, roleId: superAdminRole.id, resourceType: null, resourceId: null },
  });
  if (!existingSuperAdminAssignment) {
    await prisma.roleAssignment.create({ data: { userId: superAdmin.id, roleId: superAdminRole.id } });
  }

  await seedChannelWithOwner({
    title: "کانال نمونه یک",
    eitaaId: normalizeEitaaId("hatef_demo_channel_one"),
    ownerMobile: normalizeIranianMobile("09120000001"),
  });
  await seedChannelWithOwner({
    title: "کانال نمونه دو",
    eitaaId: normalizeEitaaId("hatef_demo_channel_two"),
    ownerMobile: normalizeIranianMobile("09120000002"),
  });
}

async function seedChannelWithOwner(input: { title: string; eitaaId: string; ownerMobile: string }): Promise<void> {
  const channel = await prisma.channel.upsert({
    where: { eitaaId: input.eitaaId },
    update: {},
    create: { title: input.title, eitaaId: input.eitaaId, status: "ACTIVE" },
  });

  const contact = await prisma.userContact.findUnique({
    where: { type_value: { type: "MOBILE", value: input.ownerMobile } },
  });
  const ownerId = contact
    ? contact.userId
    : (
        await prisma.user.create({
          data: {
            displayName: input.ownerMobile,
            contacts: { create: { type: "MOBILE", value: input.ownerMobile, verifiedAt: new Date(), isPrimary: true } },
          },
        })
      ).id;

  await prisma.channelMembership.upsert({
    where: { userId_channelId: { userId: ownerId, channelId: channel.id } },
    update: {},
    create: { userId: ownerId, channelId: channel.id, role: "CHANNEL_OWNER", status: "ACTIVE" },
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "CHANNEL_OWNER" } });
  await prisma.roleAssignment.upsert({
    where: {
      userId_roleId_resourceType_resourceId: {
        userId: ownerId,
        roleId: ownerRole.id,
        resourceType: "channel",
        resourceId: channel.id,
      },
    },
    update: {},
    create: { userId: ownerId, roleId: ownerRole.id, resourceType: "channel", resourceId: channel.id },
  });

  console.log(`Dev channel "${input.title}": owner mobile ${input.ownerMobile}`);
}

async function seedConsentDocuments(): Promise<void> {
  const docs = [
    {
      key: "accuracy-declaration",
      version: 1,
      title: "اقرار به صحت اطلاعات",
      body: "با ارسال این فرم، صحت اطلاعات ارائه‌شده را تأیید می‌کنم و می‌پذیرم که اطلاعات نادرست می‌تواند منجر به رد یا لغو همکاری شود.",
    },
    {
      key: "terms-and-privacy",
      version: 1,
      title: "شرایط استفاده و حریم خصوصی",
      body: "با شرایط استفاده از خدمات و سیاست حریم خصوصی مجموعه رسانه‌ای هاتف موافقم.",
    },
  ];

  for (const doc of docs) {
    await prisma.consentDocument.upsert({
      where: { key_version: { key: doc.key, version: doc.version } },
      update: {},
      create: doc,
    });
  }
}

/**
 * The real 28-question form (spec 9.2), inserted directly into the form
 * engine's own tables (Form/FormVersion/FormPage/FormSection/FormField/
 * FormFieldOption/FormRule) — this is what "through the real form engine"
 * means, the same spirit as seeding roles via Prisma rather than a UI.
 * Published immediately so onboarding works end-to-end without a manual
 * admin step.
 */
async function seedOnboardingForm(): Promise<void> {
  const existingForm = await prisma.form.findUnique({ where: { key: ONBOARDING_FORM_KEY } });
  if (existingForm) {
    console.log("Onboarding form already seeded, skipping.");
    return;
  }

  const form = await prisma.form.create({
    data: {
      key: ONBOARDING_FORM_KEY,
      title: "فرم ثبت‌نام و ارزیابی کانال",
      description: "۲۸ پرسش ورودی همکاری با مجموعه رسانه‌ای هاتف",
    },
  });
  const version = await prisma.formVersion.create({ data: { formId: form.id, versionNumber: 1, status: "DRAFT" } });

  const fieldIdByKey = new Map<string, string>();

  for (const [pageOrder, pageSeed] of ONBOARDING_PAGES.entries()) {
    const page = await prisma.formPage.create({
      data: { formVersionId: version.id, order: pageOrder, title: pageSeed.title },
    });

    for (const [sectionOrder, sectionSeed] of pageSeed.sections.entries()) {
      const section = await prisma.formSection.create({
        data: { formPageId: page.id, order: sectionOrder, title: sectionSeed.title },
      });

      for (const [fieldOrder, fieldSeed] of sectionSeed.fields.entries()) {
        const field = await prisma.formField.create({
          data: {
            formSectionId: section.id,
            order: fieldOrder,
            key: fieldSeed.key,
            label: fieldSeed.label,
            type: fieldSeed.type,
            required: fieldSeed.required ?? false,
            config: fieldSeed.config as never,
            options: fieldSeed.options
              ? { create: fieldSeed.options.map((o, i) => ({ order: i, value: o.value, label: o.label })) }
              : undefined,
          },
        });
        fieldIdByKey.set(fieldSeed.key, field.id);
      }
    }
  }

  for (const rule of ONBOARDING_RULES) {
    const targetFieldId = fieldIdByKey.get(rule.targetKey);
    if (!targetFieldId) continue;
    await prisma.formRule.create({
      data: { formVersionId: version.id, targetFieldId, action: rule.action, condition: rule.condition as never },
    });
  }

  await prisma.formVersion.update({ where: { id: version.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });

  console.log(`Seeded onboarding form "${form.key}" with ${fieldIdByKey.size} fields, published as v1.`);
}

async function seedEvaluationRubric(): Promise<void> {
  const key = "channel-onboarding-rubric";
  const existing = await prisma.evaluationRubric.findFirst({ where: { key } });
  if (existing) return;

  const criteria = [
    { key: "content_quality", label: "کیفیت محتوا", maxScore: 20, weight: 1 },
    { key: "growth_potential", label: "پتانسیل رشد", maxScore: 20, weight: 1 },
    { key: "management_capacity", label: "ظرفیت مدیریتی", maxScore: 20, weight: 1 },
    { key: "cooperation_readiness", label: "آمادگی همکاری", maxScore: 20, weight: 1 },
    { key: "compliance_risk", label: "ریسک انطباق کم", maxScore: 20, weight: 1 },
  ];

  const rubric = await prisma.evaluationRubric.create({
    data: { key, versionNumber: 1, title: "سیاهه ارزیابی اولیه کانال", criteria: criteria as never, status: "DRAFT" },
  });
  await prisma.evaluationRubric.update({
    where: { id: rubric.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

/**
 * The two promotion types named in the spec (13.1/13.2): first-position pin
 * (backend-authoritative CALCULATED pricing, 240 rial/view nationwide, 480
 * rial/view provincial) and variable multi-channel (QUOTE pricing, no price
 * rules — commercial terms come from staff-built PromotionQuote versions
 * instead). Published immediately, same "works end-to-end with no manual
 * admin step" reasoning as the onboarding form.
 */
async function seedPromotionTypes(): Promise<void> {
  await seedPromotionType({
    key: "first-position-pin",
    name: "پین رتبه اول",
    description: "نمایش تبلیغ در جایگاه اول کانال به ازای بازدید یکتا (سراسری یا استانی).",
    pricingModel: "CALCULATED",
    priceRules: [
      { audienceType: "NATIONWIDE", ratePerViewRial: 240n },
      { audienceType: "PROVINCIAL", ratePerViewRial: 480n },
    ],
  });

  await seedPromotionType({
    key: "variable-multi-channel",
    name: "پروموشن متغیر چندکاناله",
    description: "تبلیغ در چند کانال ایتا با استعلام قیمت — تعداد کانال، بازدید و هزینه نهایی ابتدا نامشخص است.",
    pricingModel: "QUOTE",
    priceRules: [],
  });
}

async function seedPromotionType(input: {
  key: string;
  name: string;
  description: string;
  pricingModel: "CALCULATED" | "QUOTE";
  priceRules: { audienceType: "NATIONWIDE" | "PROVINCIAL"; ratePerViewRial: bigint }[];
}): Promise<void> {
  const existing = await prisma.promotionType.findUnique({ where: { key: input.key } });
  if (existing) {
    console.log(`Promotion type "${input.key}" already seeded, skipping.`);
    return;
  }

  const promotionType = await prisma.promotionType.create({
    data: { key: input.key, name: input.name, description: input.description, pricingModel: input.pricingModel },
  });
  const version = await prisma.promotionTypeVersion.create({
    data: { promotionTypeId: promotionType.id, versionNumber: 1, status: "DRAFT" },
  });

  for (const rule of input.priceRules) {
    await prisma.priceRule.create({
      data: { promotionTypeVersionId: version.id, audienceType: rule.audienceType, ratePerViewRial: rule.ratePerViewRial },
    });
  }

  await prisma.promotionTypeVersion.update({
    where: { id: version.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), effectiveFrom: new Date() },
  });

  console.log(`Seeded promotion type "${promotionType.key}" with ${input.priceRules.length} price rule(s), published as v1.`);
}

/**
 * The reciprocal-service catalog (spec 16.2's own example list). Each item's
 * first ServiceCatalogVersion is published immediately — same "works
 * end-to-end with no manual admin step" reasoning as the onboarding form and
 * promotion types.
 */
async function seedServiceCatalog(): Promise<void> {
  const items: { key: string; name: string; serviceType: string; unit: string; valuationMethod: string }[] = [
    { key: "publication", name: "انتشار پست", serviceType: "PUBLICATION", unit: "پست", valuationMethod: "بر اساس بازدید یکتای تخمینی پست" },
    { key: "repost", name: "بازنشر", serviceType: "REPOST", unit: "بازنشر", valuationMethod: "بر اساس بازدید یکتای تخمینی بازنشر" },
    { key: "content-production", name: "تولید محتوا", serviceType: "CONTENT_PRODUCTION", unit: "قطعه محتوا", valuationMethod: "برآورد بر اساس نرخ تولید محتوای مشابه" },
    { key: "event-coverage", name: "پوشش رویداد", serviceType: "EVENT_COVERAGE", unit: "رویداد", valuationMethod: "برآورد بر اساس مدت و مخاطب رویداد" },
    { key: "campaign-participation", name: "مشارکت در کمپین", serviceType: "CAMPAIGN_PARTICIPATION", unit: "کمپین", valuationMethod: "توافقی بر اساس دامنه کمپین" },
    { key: "field-operation", name: "عملیات میدانی", serviceType: "FIELD_OPERATION", unit: "مأموریت", valuationMethod: "برآورد بر اساس نیروی انسانی و زمان" },
    { key: "networking", name: "شبکه‌سازی", serviceType: "NETWORKING", unit: "معرفی", valuationMethod: "توافقی" },
    { key: "research", name: "پژوهش", serviceType: "RESEARCH", unit: "گزارش", valuationMethod: "برآورد بر اساس حجم پژوهش" },
    { key: "survey", name: "نظرسنجی", serviceType: "SURVEY", unit: "نظرسنجی", valuationMethod: "برآورد بر اساس تعداد پاسخ‌دهنده" },
    { key: "other", name: "سایر خدمات متقابل", serviceType: "OTHER", unit: "مورد", valuationMethod: "توافقی" },
  ];

  for (const item of items) {
    const existing = await prisma.serviceCatalogItem.findUnique({ where: { key: item.key } });
    if (existing) continue;
    await prisma.serviceCatalogItem.create({
      data: {
        key: item.key,
        name: item.name,
        serviceType: item.serviceType as never,
        versions: {
          create: { versionNumber: 1, status: "PUBLISHED", unit: item.unit, valuationMethod: item.valuationMethod, publishedAt: new Date() },
        },
      },
    });
  }

  console.log(`Seeded ${items.length} reciprocal service catalog item(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
