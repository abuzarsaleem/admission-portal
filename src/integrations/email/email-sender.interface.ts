export interface VerificationEmailPayload {
  to: string;
  fullName: string;
  verificationLink: string;
  applicationId: string;
  applicationReference: string;
}

export interface EmailSender {
  sendVerificationEmail(payload: VerificationEmailPayload): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
