import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile(userId: string) {
    return this.prisma.adminProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
  }

  async requirePermission(userId: string, permission: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        displayName: true,
        permissions: true
      }
    });

    if (!profile) {
      throw new ForbiddenException('Admin profile not found');
    }

    const permissions = this.extractPermissions(profile.permissions);
    if (!permissions.includes(permission)) {
      throw new ForbiddenException('Missing required admin permission');
    }

    return profile;
  }

  private extractPermissions(raw: Prisma.JsonValue | null): string[] {
    if (!raw) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw.filter((value): value is string => typeof value === 'string');
    }
    return [];
  }
}
