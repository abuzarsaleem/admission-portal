import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrevoEmailSender } from './brevo-email.sender.js';
import { EMAIL_SENDER } from './email-sender.interface.js';
import { LogEmailSender } from './log-email.sender.js';

/**
 * Email-only delivery (alumni-compatible env):
 * NOTIFICATION_DRIVER=brevo|log, BREVO_API_KEY, BREVO_FROM_EMAIL
 */
@Module({
  imports: [ConfigModule],
  providers: [
    LogEmailSender,
    BrevoEmailSender,
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, LogEmailSender, BrevoEmailSender],
      useFactory: (
        config: ConfigService,
        logSender: LogEmailSender,
        brevoSender: BrevoEmailSender,
      ) => {
        const driver = (
          config.get<string>('NOTIFICATION_DRIVER') ?? 'log'
        ).toLowerCase();
        return driver === 'brevo' ? brevoSender : logSender;
      },
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
