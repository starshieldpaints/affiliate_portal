import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { VerificationTarget } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notifications/email.service';
import { SmsService } from '../../notifications/sms.service';

@Injectable()
export class ContactVerificationService {
  private readonly logger = new Logger(ContactVerificationService.name);
  private readonly ttlMs: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly config: ConfigService
  ) {
    const ttlSeconds = Number(this.config.get<number>('otp.ttlSeconds') ?? 600);
    const maxAttempts = Number(this.config.get<number>('otp.maxAttempts') ?? 5);
    this.ttlMs = ttlSeconds * 1000;
    this.maxAttempts = maxAttempts;
  }

  async sendEmailVerification(userId: string, email: string) {
    const normalizedEmail = this.normalizeValue(VerificationTarget.email, email);
    const code = await this.createCode(userId, VerificationTarget.email, normalizedEmail, 'email');

    await this.emailService.send({
      to: normalizedEmail,
      subject: 'Verify your StarShield email',
      text: `Use the following OTP to verify your email: ${code}\nIt expires in ${Math.floor(this.ttlMs / 1000 / 60)} minutes.`
    });
  }

  async sendPhoneVerification(userId: string, phone: string) {
    const normalizedPhone = this.normalizeValue(VerificationTarget.phone, phone);
    const code = await this.createCode(userId, VerificationTarget.phone, normalizedPhone, 'sms');
    await this.smsService.send(
      normalizedPhone,
      `Your StarShield verification code is ${code}. It expires in ${Math.floor(this.ttlMs / 1000 / 60)} minutes.`
    );
  }

  async verifyCode(userId: string, target: VerificationTarget, submittedCode: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: { userId, targetType: target },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (record.consumedAt) {
      throw new BadRequestException('Verification code already used. Request a new one.');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.verificationCode.delete({ where: { id: record.id } });
      throw new BadRequestException('Verification code has expired. Request a new one.');
    }

    if (record.attempts >= this.maxAttempts) {
      await this.prisma.verificationCode.delete({ where: { id: record.id } });
      throw new BadRequestException('Maximum verification attempts exceeded. Request a new code.');
    }

    const hashedSubmitted = this.hashCode(submittedCode);
    if (hashedSubmitted !== record.codeHash) {
      const attempts = record.attempts + 1;
      if (attempts >= this.maxAttempts) {
        await this.prisma.verificationCode.delete({ where: { id: record.id } });
        throw new BadRequestException('Maximum verification attempts exceeded. Request a new code.');
      }

      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts }
      });

      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: {
        consumedAt: new Date()
      }
    });

    return { targetValue: record.targetValue };
  }

  private async createCode(
    userId: string,
    targetType: VerificationTarget,
    targetValue: string,
    channel: string
  ) {
    await this.prisma.verificationCode.deleteMany({
      where: { userId, targetType }
    });

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.prisma.verificationCode.create({
      data: {
        userId,
        targetType,
        targetValue,
        codeHash: this.hashCode(code),
        expiresAt,
        channel
      }
    });

    this.logger.debug(`Generated verification code for ${targetType} on user ${userId}`);
    return code;
  }

  private generateOtp() {
    return String(randomInt(100000, 1000000));
  }

  private hashCode(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizeValue(type: VerificationTarget, value: string) {
    if (type === VerificationTarget.email) {
      return value.trim().toLowerCase();
    }
    return value.replace(/\s+/g, '');
  }
}
