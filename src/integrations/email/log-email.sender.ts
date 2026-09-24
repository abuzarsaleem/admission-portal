import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailSender,
  VerificationEmailPayload,
} from './email-sender.interface.js';

/** Dev/fallback — logs email intent with token redacted (alumni LoggingNotificationSender). */
@Injectable()
export class LogEmailSender implements EmailSender {
  private readonly logger = new Logger(LogEmailSender.name);

  async sendVerificationEmail(payload: VerificationEmailPayload): Promise<void> {
    const safeLink = payload.verificationLink.replace(
      /token=[^&]+/i,
      'token=[redacted]',
    );
    this.logger.log(
      `EMAIL_VERIFICATION queued to=${payload.to} reference=${payload.applicationReference} link=${safeLink}`,
    );
  }
}
