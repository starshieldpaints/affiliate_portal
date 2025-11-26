/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@starshield.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'veryveryverylongpassword';

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters for seeding.');
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
      status: 'active'
    },
    create: {
      email,
      passwordHash,
      role: 'admin',
      status: 'active'
    }
  });

  console.log('Seeded admin user:', { id: user.id, email: user.email, role: user.role });
}

main()
  .catch((err) => {
    console.error('Failed to seed admin user:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

