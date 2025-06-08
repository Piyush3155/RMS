import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { name: "Manager", email: "manager@biteandco.com", password: "manager123" ,role : "manager"},
    { name: "Chef", email: "chef@biteandco.com", password: "chef123" ,role:"chef"},
    { name: "Sanika", email: "sanikavandure@gmail.com", password: "sanika123",role:"manager" },
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