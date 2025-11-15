import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable must be set before running this script`);
  }
  return value;
}

async function main() {
  const email = requireEnv('ADMIN_EMAIL');
  const password = requireEnv('ADMIN_PASSWORD');
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? 'Console Admin';

  const passwordHash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash
    },
    create: {
      email,
      passwordHash,
      role: UserRole.admin,
      adminProfile: {
        create: {
          displayName,
          permissions: ['admin:overview:view']
        }
      }
    }
  });

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('Failed to create admin', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
