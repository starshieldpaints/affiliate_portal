import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { runFraudScan } from '../../worker/src/jobs/fraud-processor';
import { FraudService } from '../src/modules/admin/services/fraud.service';

describe('Fraud detection and resolution', () => {
  const prisma = new PrismaService();
  const fraudService = new FraudService(prisma);
  let affiliateId: string;
  let adminId: string;
  let alertId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: `admin-fraud-${Date.now()}@example.com`,
        passwordHash: 'x',
        role: UserRole.admin,
        status: 'active'
      }
    });
    adminId = admin.id;
    const aff = await prisma.user.create({
      data: {
        email: `fraud-aff-${Date.now()}@example.com`,
        passwordHash: 'x',
        role: UserRole.affiliate,
        status: 'active',
        affiliate: {
          create: {
            displayName: 'Fraud Test',
            defaultReferralCode: `FRAUD${Date.now()}`,
            panNumber: 'ABCDE1234F',
            aadhaarNumber: '999988887777'
          }
        }
      },
      include: { affiliate: true }
    });
    affiliateId = aff.affiliate!.id;
    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId,
        code: `LNK-${Date.now()}`,
        landingUrl: 'https://example.com'
      }
    });
    // create many clicks to trigger velocity
    const clicksData = Array.from({ length: 25 }).map(() => ({
      affiliateLinkId: link.id,
      clickedAt: new Date(),
      botFlags: 0
    }));
    await prisma.click.createMany({ data: clicksData });
  });

  afterAll(async () => {
    await prisma.fraudAlert.deleteMany({ where: { affiliateId } });
    await prisma.auditLog.deleteMany({ where: { userId: adminId } });
    await prisma.affiliateLink.deleteMany({ where: { affiliateId } });
    await prisma.affiliateProfile.deleteMany({ where: { id: affiliateId } });
    await prisma.user.deleteMany({ where: { id: { in: [affiliateId, adminId] } } });
    await prisma.$disconnect();
  });

  it('fraud worker detects velocity and creates alert', async () => {
    await runFraudScan(prisma as any, 60);
    const alerts = await prisma.fraudAlert.findMany({ where: { affiliateId } });
    expect(alerts.length).toBeGreaterThan(0);
    alertId = alerts[0].id;
    expect(alerts[0].type).toBe('velocity');
  });

  it('resolve endpoint marks resolved and writes audit', async () => {
    const result = await fraudService.resolve(alertId, adminId, 'reviewed');
    expect(result.data.status).toBe('resolved');
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'FRAUD_RESOLVE', entityId: alertId }
    });
    expect(audit).toBeTruthy();
  });
});
