import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async readiness() {
    const dbHealthy = await this.checkDatabase();
    return {
      ok: dbHealthy,
      checks: {
        database: dbHealthy
      },
      timestamp: new Date().toISOString()
    };
  }

  liveness() {
    return {
      ok: true,
      timestamp: new Date().toISOString()
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}
