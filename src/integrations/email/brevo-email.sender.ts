import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  EmailSender,
  VerificationEmailPayload,
} from './email-sender.interface.js';

/**
 * Brevo transactional email — same driver/env as alumni CMS
 * (NOTIFICATION_DRIVER=brevo, BREVO_API_KEY, BREVO_FROM_EMAIL).
 */
@Injectable()
export class BrevoEmailSender implements EmailSender {
  private readonly logger = new Logger(BrevoEmailSender.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(payload: VerificationEmailPayload): Promise<void> {
    const apiKey = this.config.get<string>('BREVO_API_KEY')?.trim();
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is required when NOTIFICATION_DRIVER=brevo');
    }

    const from =
      this.config.get<string>('BREVO_FROM_EMAIL')?.trim() ||
      'IKS <rao.shan@ikslogics.com>';
    const sender = this.parseFrom(from);
    const rendered = this.render(payload);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: payload.to }],
        subject: rendered.subject,
        htmlContent: rendered.html,
        textContent: rendered.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `Brevo failed to=${payload.to}: HTTP ${response.status} ${body.slice(0, 300)}`,
      );
      throw new Error(`Brevo HTTP ${response.status}: ${body}`);
    }

    const data = (await response.json()) as { messageId?: string };
    this.logger.log(
      `Brevo sent verification to=${payload.to} id=${data.messageId ?? 'n/a'}`,
    );
  }

  private parseFrom(value: string): { name: string; email: string } {
    const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
      return {
        name: match[1].trim() || 'Taleem AI',
        email: match[2].trim(),
      };
    }
    return { name: 'Taleem AI', email: value.trim() };
  }

  private render(payload: VerificationEmailPayload): {
    subject: string;
    html: string;
    text: string;
  } {
    const {
      fullName,
      verificationLink,
      applicantId,
      applicationId,
      applicationReference,
    } = payload;

    return {
      subject: 'Verify your admissions account',
      text: [
        `Hi ${fullName},`,
        '',
        'Your admissions registration was received.',
        `Applicant ID: ${applicantId}`,
        `Application ID: ${applicationId}`,
        `Reference: ${applicationReference}`,
        '',
        'Open this link to verify your account and set your password (valid ~48 hours):',
        verificationLink,
        '',
        '— Taleem AI',
      ].join('\n'),
      html: `
        <p>Hi ${escapeHtml(fullName)},</p>
        <p>Your admissions registration was received.</p>
        <ul>
          <li><strong>Applicant ID:</strong> ${escapeHtml(applicantId)}</li>
          <li><strong>Application ID:</strong> ${escapeHtml(applicationId)}</li>
          <li><strong>Reference:</strong> ${escapeHtml(applicationReference)}</li>
        </ul>
        <p><a href="${escapeHtml(verificationLink)}">Verify account &amp; set password</a></p>
        <p>This link expires in about <strong>48 hours</strong>.</p>
        <p>— Taleem AI</p>
      `,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
