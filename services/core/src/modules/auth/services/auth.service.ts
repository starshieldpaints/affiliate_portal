import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus, VerificationTarget } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly rateLimiter: LoginRateLimiterService,
    private readonly firebaseAuth: FirebaseAuthService
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async login({ email, password }: LoginDto, ipAddress?: string): Promise<IssuedTokens> {
    const trimmedEmail = email.trim().toLowerCase();
    const rateKey = this.buildRateLimitKey(trimmedEmail, ipAddress);

    this.rateLimiter.ensureNotBlocked(rateKey);

    const user = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
        deletedAt: true,
        tokenVersion: true,
        emailVerifiedAt: true,
        affiliate: {
          select: {
            phone: true,
            phoneVerifiedAt: true
          }
        }
      }
    });

    if (!user || user.deletedAt || user.status !== UserStatus.active) {
      this.rateLimiter.recordFailure(rateKey);
      await this.logAuthEvent(null, 'auth.login.failed', {
        email: trimmedEmail,
        reason: user ? 'inactive' : 'not_found',
        ipAddress
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      this.rateLimiter.recordFailure(rateKey);
      await this.logAuthEvent(user.id, 'auth.login.failed', {
        email: trimmedEmail,
        reason: 'invalid_password',
        ipAddress
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.rateLimiter.clear(rateKey);
    await this.logAuthEvent(user.id, 'auth.login.success', { ipAddress });

    return this.issueTokens(user.id, user.role, user.tokenVersion, ipAddress);
  }

  async register({
    email,
    password,
    displayName,
    phone,
    country,
    marketingOptIn,
    termsAccepted
  }: RegisterDto, ipAddress?: string): Promise<IssuedTokens> {
    if (!termsAccepted) {
      throw new BadRequestException('You must accept the terms to register');
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true }
    });
    if (existing) {
      throw new ConflictException('An account with this email is already registered');
    }

    const passwordHash = await argon2.hash(password);

    const normalizedDisplayName = displayName.trim();
    const baseCodeSeed = slugify(normalizedDisplayName || trimmedEmail.split('@')[0]) || 'AFFILIATE';

    const sanitizedCountry = country?.trim() ?? null;
    const marketingPreference =
      typeof marketingOptIn === 'boolean' ? marketingOptIn : null;

    const normalizedPhone = phone ? this.normalizePhone(phone) : undefined;
    if (normalizedPhone) {
      const phoneUser = await this.prisma.affiliateProfile.findUnique({
        where: { phone: normalizedPhone },
        select: { userId: true }
      });
      if (phoneUser) {
        throw new ConflictException('An account with this phone is already registered');
      }
    }

    const { user } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: trimmedEmail,
          passwordHash
        },
        select: {
          id: true,
          role: true,
          tokenVersion: true
        }
      });

      const referralCode = await this.generateUniqueReferralCode(baseCodeSeed, tx);

      await tx.affiliateProfile.create({
        data: {
          userId: createdUser.id,
          displayName: normalizedDisplayName,
          defaultReferralCode: referralCode,
          phone: normalizedPhone,
          panNumber: '',
          aadhaarNumber: '',
          panImageUrl: null,
          aadhaarFrontUrl: null,
          aadhaarBackUrl: null,
          socialLinks: undefined,
          payoutMethod: undefined,
          payoutDetails: {
            country: sanitizedCountry,
            marketingOptIn: marketingPreference
          }
        }
      });

      return { user: createdUser };
    });

    await this.logAuthEvent(user.id, 'auth.register.success', {
      ipAddress,
      email: trimmedEmail
    });
    await this.sendVerificationChallenges(user.id, trimmedEmail, normalizedPhone);
    return this.issueTokens(user.id, user.role, user.tokenVersion, ipAddress);
  }

  async sendVerificationCode(dto: SendVerificationDto) {
    if (dto.type === VerificationTarget.email) {
      const email = dto.email?.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Email is required');
      }
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerifiedAt: true }
      });
      if (!user) {
        throw new NotFoundException('Account not found');
      }
      if (user.emailVerifiedAt) {
        return { delivered: false, alreadyVerified: true };
      }
      // Firebase handles OTP/email verification; no email is sent from this service.
      await this.logAuthEvent(user.id, 'auth.verification.email.delegated');
      return { delivered: false, useFirebase: true };
    }

    const phone = dto.phone ? this.normalizePhone(dto.phone) : null;
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { phone },
      select: { userId: true, phoneVerifiedAt: true }
    });

    if (!profile) {
      throw new NotFoundException('Account not found for the provided phone number');
    }

    if (profile.phoneVerifiedAt) {
      return { delivered: false, alreadyVerified: true };
    }

    await this.logAuthEvent(profile.userId, 'auth.verification.phone.delegated');
    return { delivered: false, useFirebase: true };
  }

  async verifyContactCode(dto: VerifyOtpDto) {
    if (dto.type === VerificationTarget.email) {
      const email = dto.email?.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerifiedAt: true }
      });

      if (!user) {
        throw new NotFoundException('Account not found');
      }

      if (user.emailVerifiedAt) {
        return { verified: true, alreadyVerified: true };
      }

      if (!dto.firebaseIdToken) {
        throw new BadRequestException('Firebase ID token is required for email verification');
      }

      const claims = await this.firebaseAuth.verifyIdToken(dto.firebaseIdToken);
      if (!claims.email || claims.email.toLowerCase() !== email) {
        throw new BadRequestException('Firebase email does not match the requested email');
      }
      if (!claims.email_verified) {
        throw new BadRequestException('Email is not verified in Firebase');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() }
      });
      await this.logAuthEvent(user.id, 'auth.verification.email.completed', {
        via: 'firebase'
      });
      return { verified: true };
    }

    const phone = dto.phone ? this.normalizePhone(dto.phone) : null;
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { phone },
      select: { userId: true, phoneVerifiedAt: true }
    });

    if (!profile) {
      throw new NotFoundException('Account not found for the provided phone number');
    }

    if (profile.phoneVerifiedAt) {
      return { verified: true, alreadyVerified: true };
    }

    if (!dto.firebaseIdToken) {
      throw new BadRequestException('Firebase ID token is required for phone verification');
    }

    const claims = await this.firebaseAuth.verifyIdToken(dto.firebaseIdToken);
    const firebasePhone = claims.phone_number ? this.normalizePhone(claims.phone_number) : null;
    if (!firebasePhone || firebasePhone !== phone) {
      throw new BadRequestException('Firebase phone does not match the requested phone');
    }

    await this.prisma.affiliateProfile.update({
      where: { phone },
      data: { phoneVerifiedAt: new Date() }
    });
    await this.logAuthEvent(profile.userId, 'auth.verification.phone.completed', {
      via: 'firebase'
    });
    return { verified: true };
  }

  async refreshTokens(refreshToken: string | null, ipAddress?: string): Promise<IssuedTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const payload = await this.verifyJwt(refreshToken);
    const hashed = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashed }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      await this.logAuthEvent(payload?.sub ?? null, 'auth.refresh.failed', {
        reason: 'invalid_or_revoked',
        ipAddress
      });
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
        tokenVersion: true,
        emailVerifiedAt: true,
        affiliate: {
          select: {
            phone: true,
            phoneVerifiedAt: true
          }
        }
      }
    });

    if (
      !user ||
      user.deletedAt ||
      user.status !== UserStatus.active ||
      user.id !== payload.sub ||
      user.tokenVersion !== payload.v
    ) {
      await this.logAuthEvent(storedToken.userId, 'auth.refresh.failed', {
        reason: 'user_invalid',
        ipAddress
      });
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokens = await this.issueTokens(user.id, user.role, user.tokenVersion, ipAddress);
    const newHash = this.hashToken(tokens.refreshToken);

    await this.prisma.refreshToken.update({
      where: { tokenHash: hashed },
      data: {
        revokedAt: new Date(),
        replacedByToken: newHash,
        lastUsedAt: new Date(),
        createdByIp: storedToken.createdByIp ?? ipAddress
      }
    });

    await this.logAuthEvent(user.id, 'auth.refresh.success', { ipAddress });

    return tokens;
  }

  async revokeRefreshToken(refreshToken: string | null, ipAddress?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const hashed = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashed }
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    if (storedToken.revokedAt) {
      await this.logAuthEvent(storedToken.userId, 'auth.logout.redundant', { ipAddress });
      return { revoked: true };
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash: hashed },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
        createdByIp: storedToken.createdByIp ?? ipAddress
      }
    });

    await this.logAuthEvent(storedToken.userId, 'auth.logout.success', { ipAddress });
    return { revoked: true };
  }

  private async issueTokens(
    userId: string,
    role: UserRole,
    tokenVersion: number,
    ipAddress?: string
  ): Promise<IssuedTokens> {
    const payload = { sub: userId, role, v: tokenVersion };
    const accessTokenTtl = this.config.get<string>('jwt.accessTokenTtl') ?? '15m';
    const refreshTokenTtl = this.config.get<string>('jwt.refreshTokenTtl') ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenTtl
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshTokenTtl
    });

    await this.persistRefreshToken(userId, refreshToken, refreshTokenTtl, ipAddress);

    return {
      accessToken,
      refreshToken,
      userId
    };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    ttl: string,
    ipAddress?: string
  ) {
    const expiresAt = new Date(Date.now() + durationToMs(ttl));
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        createdByIp: ipAddress ?? null
      }
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async verifyJwt(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; role: UserRole; v: number }>(token);
    } catch {
      await this.logAuthEvent(null, 'auth.refresh.failed', { reason: 'jwt_invalid' });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        role: true,
        status: true,
        createdAt: true,
        affiliate: {
          select: {
            id: true,
            displayName: true,
            defaultReferralCode: true,
            phone: true,
            phoneVerifiedAt: true,
            kycStatus: true,
            payoutMethod: true,
            payoutDetails: true,
            panNumber: true,
            aadhaarNumber: true,
            panImageUrl: true,
            aadhaarFrontUrl: true,
            aadhaarBackUrl: true
          }
        },
        adminProfile: {
          select: {
            id: true,
            displayName: true,
            permissions: true,
            timezone: true
          }
        }
      }
    });
  }

  private async sendVerificationChallenges(userId: string, email: string, phone?: string) {
    // Delegated to Firebase OTP; nothing to send from backend.
    await this.logAuthEvent(userId, 'auth.verification.delegated', {
      email,
      phone,
      provider: 'firebase'
    });
  }

  private normalizePhone(phone: string) {
    return phone.replace(/\s+/g, '');
  }

  private async generateUniqueReferralCode(
    base: string,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const normalized = base.toUpperCase();
    for (let i = 0; i < 10; i++) {
      const suffix = randomAlnum(5);
      const candidate = `${normalized}-${suffix}`;
      const exists = await tx.affiliateProfile.findUnique({
        where: { defaultReferralCode: candidate }
      });
      if (!exists) return candidate;
    }
    return `${normalized}-${randomAlnum(8)}`;
  }

  private buildRateLimitKey(email: string, ipAddress?: string) {
    return `${email}:${ipAddress ?? 'unknown'}`;
  }

  private async logAuthEvent(
    userId: string | null,
    action: string,
    meta?: Record<string, unknown>
  ) {
    const baseData = {
      userId,
      action,
      entityType: 'auth',
      entityId: userId ?? undefined,
      meta: this.buildAuditMeta(meta)
    };

    try {
      await this.prisma.auditLog.create({
        data: baseData
      });
    } catch (error) {
      const isForeignKeyViolation =
        userId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003';

      if (!isForeignKeyViolation) {
        throw error;
      }

      this.logger.warn(
        `Audit log fallback: user ${userId} missing when recording ${action}, logging anonymously`
      );

      await this.prisma.auditLog.create({
        data: {
          ...baseData,
          userId: null,
          entityId: undefined,
          meta: this.buildAuditMeta(meta, { orphanedUserId: userId })
        }
      });
    }
  }

  private buildAuditMeta(
    meta?: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): Prisma.InputJsonValue {
    const merged = {
      ...(meta ?? {}),
      ...(extra ?? {})
    } as Prisma.InputJsonValue;

    if (Object.keys(merged as Record<string, unknown>).length === 0) {
      return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
    }

    return merged;
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16);
}

function randomAlnum(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * (multipliers[unit] ?? 24 * 60 * 60 * 1000);
}
