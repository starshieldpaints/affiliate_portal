import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { commissionProcessor } from './jobs/commission-processor';
import { payoutProcessor } from './jobs/payout-processor';
import { fraudProcessor } from './jobs/fraud-processor';
import { reportProcessor } from './jobs/report-processor';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  family: 4
};

const prisma = new PrismaClient();

const commissionQueue = new Queue('commission', { connection });
const payoutQueue = new Queue('payout', { connection });
const fraudQueue = new Queue('fraud', { connection });
const reportQueue = new Queue('report', { connection });

new Worker('commission', commissionProcessor(prisma), { connection });
new Worker('payout', payoutProcessor(prisma), { connection });
new Worker('fraud', fraudProcessor(prisma), { connection });
new Worker('report', reportProcessor(prisma), { connection });

logger.info('Worker service listening for commission, payout, fraud, and report jobs');

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
