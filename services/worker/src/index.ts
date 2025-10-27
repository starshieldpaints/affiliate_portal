import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { commissionProcessor } from './jobs/commission-processor';
import { payoutProcessor } from './jobs/payout-processor';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10)
};

const prisma = new PrismaClient();

const commissionQueue = new Queue('commission', { connection });
const payoutQueue = new Queue('payout', { connection });

new Worker('commission', commissionProcessor(prisma), { connection });
new Worker('payout', payoutProcessor(prisma), { connection });

logger.info('🧵 Worker service listening for commission and payout jobs');

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
