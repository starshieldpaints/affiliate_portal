import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly fromNumber: string;
  private client?: Twilio;

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('notifications.twilio.accountSid');
    const authToken = this.config.get<string>('notifications.twilio.authToken');
    this.fromNumber = this.config.get<string>('notifications.twilio.fromNumber') ?? '';

    if (accountSid && authToken && this.fromNumber) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials missing. SMS delivery disabled.');
    }
  }

  async send(to: string, message: string) {
    if (!this.client) {
      this.logger.warn(`Skipped SMS to ${to} because Twilio is not configured.`);
      return;
    }

    await this.client.messages.create({
      to,
      from: this.fromNumber,
      body: message
    });
  }
}
