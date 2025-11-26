import { ReportsService } from '../src/modules/admin/services/reports.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Admin Reports', () => {
  const prisma = new PrismaService();
  const reports = new ReportsService(prisma);
  let reportId: string;

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { action: { in: ['REPORT_REQUESTED', 'REPORT_READY'] } } });
    await prisma.$disconnect();
  });

  it('creates report and returns ready status', async () => {
    const res = await reports.create('summary', 'recent', 'csv');
    expect(res.status).toBe('ready');
    reportId = res.id;
  });

  it('download returns CSV buffer with headers', async () => {
    const buffer = await reports.getReportBuffer(reportId);
    const content = buffer.toString('utf8');
    expect(content.startsWith('metric,value')).toBe(true);
  });
});
