import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import type { Request } from 'express';
import { getCookie } from '../../../common/utils/cookie';

type JwtPayload = {
  sub: string;
  role: 'affiliate' | 'admin';
  v: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => getCookie(req?.headers?.cookie, 'access_token') ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true, deletedAt: true, tokenVersion: true }
    });

    if (!user || user.deletedAt || user.status !== UserStatus.active) {
      throw new UnauthorizedException();
    }

    if (user.role !== payload.role || user.tokenVersion !== payload.v) {
      throw new UnauthorizedException();
    }

    return { userId: user.id, role: user.role };
  }
}
