import { PrismaClient } from "../generated/client/index";

const prisma = new PrismaClient();
const ONBOARDING_FORM_KEY = "channel-onboarding";
const SECTION_TITLE = "مشخصات کانال";
const FIELD_KEY = "channel_name";

/**
 * One-off patch for databases that seeded the onboarding form before
 * `channel_name` existed in onboarding-form-definition.ts — inserts it into
 * the already-PUBLISHED version's "مشخصات کانال" section instead of
 * requiring a fresh seed (which would also wipe real submissions).
 */
async function main() {
  const form = await prisma.form.findUniqueOrThrow({ where: { key: ONBOARDING_FORM_KEY } });
  const version = await prisma.formVersion.findFirstOrThrow({ where: { formId: form.id, status: "PUBLISHED" } });

  const section = await prisma.formSection.findFirstOrThrow({
    where: { title: SECTION_TITLE, formPage: { formVersionId: version.id } },
  });

  const existing = await prisma.formField.findFirst({ where: { formSectionId: section.id, key: FIELD_KEY } });
  if (existing) {
    console.log(`Field "${FIELD_KEY}" already present, nothing to do.`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.formField.updateMany({
      where: { formSectionId: section.id },
      data: { order: { increment: 1 } },
    });
    await tx.formField.create({
      data: {
        formSectionId: section.id,
        order: 0,
        key: FIELD_KEY,
        label: "نام کانال",
        type: "TEXT",
        required: true,
      },
    });
  });

  console.log(`Inserted "${FIELD_KEY}" into section "${SECTION_TITLE}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
