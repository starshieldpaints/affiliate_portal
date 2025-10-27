import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const batches = await this.prisma.payoutBatch.findMany({
      include: {
        lines: {
          select: {
            id: true,
            amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (batches.length > 0) {
      return batches;
    }

    return [
      {
        id: 'PB-2025-05',
        periodStart: new Date('2025-04-01'),
        periodEnd: new Date('2025-04-30'),
        method: 'stripe_connect',
        status: 'processing',
        totalAmount: 148230,
        currency: 'USD',
        lines: [
          { id: 'line-1', amount: 3240, status: 'processing' },
          { id: 'line-2', amount: 2980, status: 'queued' }
        ]
      }
    ];
  }
}
