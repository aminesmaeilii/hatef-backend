"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("@hatef/auth");
const index_1 = require("../generated/client/index");
const prisma = new index_1.PrismaClient();
async function main() {
    const email = "test@gmail.com";
    const password = "test";
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({ data: { displayName: "مدیر تست", email } });
    }
    const passwordHash = await (0, auth_1.hashPassword)(password);
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
