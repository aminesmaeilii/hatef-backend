import { hashPassword } from "@hatef/auth";
import { PrismaClient } from "../generated/client/index";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@hatef.test";
  const password = "admin";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { displayName: "Test Admin", email } });
  } else if (user.displayName !== "Test Admin") {
    user = await prisma.user.update({ where: { id: user.id }, data: { displayName: "Test Admin" } });
  }

  const passwordHash = await hashPassword(password);
  await prisma.adminCredential.upsert({
    where: { userId: user.id },
    update: { passwordHash, failedAttempts: 0, lockedUntil: null },
    create: { userId: user.id, passwordHash },
  });

  const role = await prisma.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
  const existingAssignment = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, roleId: role.id, resourceType: null, resourceId: null },
  });
  if (!existingAssignment) {
    await prisma.roleAssignment.create({ data: { userId: user.id, roleId: role.id } });
  }

  console.log(`Test SUPER_ADMIN ready: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
