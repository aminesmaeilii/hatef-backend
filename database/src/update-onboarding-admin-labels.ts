import { PrismaClient } from "../generated/client/index";

const prisma = new PrismaClient();
const ONBOARDING_FORM_KEY = "channel-onboarding";

const LABELS_BY_KEY = new Map([
  ["admin_qualified", "آیا ادمین فعلی برای پیشبرد اهداف کانال صلاحیت دارد؟"],
  ["admin_action_plan", "چه اقدامی برای تأمین ادمین مناسب انجام خواهد شد؟"],
]);

async function main() {
  const form = await prisma.form.findUniqueOrThrow({ where: { key: ONBOARDING_FORM_KEY } });
  const versions = await prisma.formVersion.findMany({ where: { formId: form.id } });

  for (const version of versions) {
    for (const [key, label] of LABELS_BY_KEY) {
      await prisma.formField.updateMany({
        where: { key, formSection: { formPage: { formVersionId: version.id } } },
        data: { label },
      });
    }
  }

  console.log(`Updated onboarding labels for ${versions.length} version(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
