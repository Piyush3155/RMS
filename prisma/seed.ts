import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { name: "Admin1", email: "admin1@example.com", password: "admin123" },
    { name: "Admin2", email: "admin2@example.com", password: "admin456" },
    { name: "Admin3", email: "admin3@example.com", password: "admin789" },
  ];

  await Promise.all(
    admins.map(async (admin) => {
      await prisma.admin.upsert({
        where: { email: admin.email },
        update: {},
        create: admin,
      });
    })
  );

  console.log("✅ Admin users seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });