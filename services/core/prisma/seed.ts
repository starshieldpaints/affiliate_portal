import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@starshield.io';
  const affiliateEmail = 'affiliate@starshield.io';
  const adminPassword = await argon2.hash('StarShield!23');
  const affiliatePassword = await argon2.hash('StarShield!23');
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPassword,
      role: UserRole.admin
    }
  });

  const affiliateUser = await prisma.user.upsert({
    where: { email: affiliateEmail },
    update: {},
    create: {
      email: affiliateEmail,
      passwordHash: affiliatePassword,
      role: UserRole.affiliate
    }
  });

  await prisma.affiliateProfile.upsert({
    where: { userId: affiliateUser.id },
    update: {},
    create: {
      userId: affiliateUser.id,
      displayName: 'Alex Carter',
      defaultReferralCode: 'ALEX-ELITE',
      kycStatus: 'verified',
      payoutMethod: 'stripe_connect',
      payoutDetails: {
        accountId: 'acct_demo123'
      }
    }
  });

  await prisma.product.upsert({
    where: { id: 'sample-helmet' },
    update: {},
    create: {
      id: 'sample-helmet',
      name: 'StarShield Elite Helmet',
      description: 'Flagship impact-resistant helmet engineered for tactical visibility.',
      price: 249,
      currency: 'USD',
      imageUrl: 'https://placehold.co/640x384/png?text=Elite+Helmet',
      landingUrl: 'https://starshield.io/p/elite-helmet'
    }
  });

  console.log('Seed complete', { adminId: admin.id, affiliateId: affiliateUser.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
