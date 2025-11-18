import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.fromEmail = this.config.get<string>('notifications.sendgridFromEmail') ?? '';
    const apiKey = this.config.get<string>('notifications.sendgridApiKey');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.enabled = true;
    } else {
      this.logger.warn('SendGrid API key missing. Email delivery disabled.');
      this.enabled = false;
    }
  }

  async send(options: { to: string; subject: string; text: string; html?: string }) {
    if (!this.enabled) {
      this.logger.warn(`Skipped email to ${options.to} because SendGrid is not configured.`);
      return;
    }

    try {
      await sgMail.send({
        to: options.to,
        from: this.fromEmail || 'no-reply@starshieldpaints.com',
        subject: options.subject,
        text: options.text,
        html: options.html ?? options.text
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
