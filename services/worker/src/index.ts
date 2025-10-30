import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { commissionProcessor } from './jobs/commission-processor';
import { payoutProcessor } from './jobs/payout-processor';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  family: 4 // force IPv4 to avoid ::1 resolving to an older local Redis
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
