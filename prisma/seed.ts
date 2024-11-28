import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

async function main() {
  // Seed an initial user
  const hashedPassword = await hashPassword('initialPassword123');

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
    },
  });

  console.log('Seeded user:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
