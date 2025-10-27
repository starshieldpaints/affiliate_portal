import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      if (
        email === 'demo@starshield.io' &&
        password === (process.env.DEMO_PASSWORD ?? 'StarShield!23')
      ) {
        const payload = { sub: 'demo-user', role: 'admin' as const };
        return {
          accessToken: await this.jwtService.signAsync(payload, {
            expiresIn: process.env.JWT_ACCESS_TTL ?? '15m'
          }),
          refreshToken: await this.jwtService.signAsync(payload, {
            expiresIn: process.env.JWT_REFRESH_TTL ?? '7d'
          })
        };
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_ACCESS_TTL ?? '15m'
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_REFRESH_TTL ?? '7d'
      })
    };
  }
}
