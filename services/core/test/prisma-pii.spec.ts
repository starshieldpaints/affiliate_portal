import { Prisma } from '@prisma/client';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('PII hashing uniqueness', () => {
  const prisma = new PrismaService();
  const panHash = 'pan-hash-sample';
  let userIdOne: string | null = null;
  let userIdTwo: string | null = null;

  afterAll(async () => {
    if (userIdOne) {
      await prisma.affiliateProfile.deleteMany({ where: { userId: userIdOne } });
      await prisma.user.deleteMany({ where: { id: userIdOne } });
    }
    if (userIdTwo) {
      await prisma.affiliateProfile.deleteMany({ where: { userId: userIdTwo } });
      await prisma.user.deleteMany({ where: { id: userIdTwo } });
    }
    await prisma.$disconnect();
  });

  it('enforces unique panHash for affiliate profiles', async () => {
    const userOne = await prisma.user.create({
      data: {
        email: 'pii-unique-1@example.com',
        passwordHash: 'x',
        role: 'affiliate',
        status: 'active',
        affiliate: {
          create: {
            displayName: 'PII One',
            defaultReferralCode: 'PIIONE',
            panNumber: 'ABCDE1234F',
            panHash,
            aadhaarNumber: '999988887777'
          }
        }
      }
    });
    userIdOne = userOne.id;

    await expect(
      prisma.user.create({
        data: {
          email: 'pii-unique-2@example.com',
          passwordHash: 'x',
          role: 'affiliate',
          status: 'active',
          affiliate: {
            create: {
              displayName: 'PII Two',
              defaultReferralCode: 'PIITWO',
              panNumber: 'ABCDE1234G',
              panHash,
              aadhaarNumber: '999988887776'
            }
          }
        }
      })
    ).rejects.toThrowError(Prisma.PrismaClientKnownRequestError);
  });
});
