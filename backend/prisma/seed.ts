import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Primary admin — created (and password re-enforced) on every boot.
  // No demo data is seeded: the gateway starts clean and fills with real activity.
  const adminHash = await bcrypt.hash('lanari@123!', 12);
  await prisma.merchant.upsert({
    where: { email: 'lanari.rw@gmail.com' },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: 'lanari.rw@gmail.com',
      name: 'Lanari Admin',
      businessName: 'Lanari Tech',
      role: Role.ADMIN,
      passwordHash: adminHash,
    },
  });

  console.log('✅ Seed complete (admin only).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
