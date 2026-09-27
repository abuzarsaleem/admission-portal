import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../../common/exceptions/business.exception.js';

export type ApplicantMemberOnboardResult = {
  status: 'INVITED' | 'ACCESS_GRANTED' | string;
  tenantId: string;
  email: string;
  userId?: string;
  /** Raw IAM invitation token — present when status is INVITED. */
  invitationToken?: string;
};

/**
 * M2M client for IAM public registration/onboard endpoints
 * (same pattern as alumni CMS IamRegistrationTenantsService).
 */
@Injectable()
export class IamApplicantRegistrationService {
  private readonly logger = new Logger(IamApplicantRegistrationService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Create IAM tenant invitation (no IAM email) + pending ADMISSIONS_APPLICANT access.
   * Admissions portal emails the activate link with the returned invitation token.
   */
  async onboardApplicantMember(
    tenantId: string,
    payload: { email: string; fullName?: string; isDefault?: boolean },
  ): Promise<ApplicantMemberOnboardResult> {
    const iamBase = this.iamBaseUrl();
    const apiKey = this.requireApiKey();
    const url = `${iamBase}/public/tenants/${tenantId}/applicant-member-onboard`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          email: payload.email,
          fullName: payload.fullName,
          isDefault: payload.isDefault !== false,
        }),
      });
    } catch (error) {
      this.logger.error(
        `IAM applicant-member-onboard failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BusinessException(
        'Unable to invite applicant on the identity platform',
        HttpStatus.BAD_GATEWAY,
        'IAM_UNAVAILABLE',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(
        `IAM applicant-member-onboard ${response.status}: ${body.slice(0, 400)}`,
      );
      throw new BusinessException(
        this.onboardErrorMessage(response.status, body),
        HttpStatus.BAD_GATEWAY,
        'IAM_ONBOARD_FAILED',
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const invitation = data.invitation as Record<string, unknown> | undefined;
    const invitationToken =
      typeof invitation?.invitationToken === 'string'
        ? invitation.invitationToken
        : typeof data.invitationToken === 'string'
          ? data.invitationToken
          : undefined;

    const result: ApplicantMemberOnboardResult = {
      status: String(data.status ?? ''),
      tenantId: String(data.tenantId ?? tenantId),
      email: String(data.email ?? payload.email),
      userId: typeof data.userId === 'string' ? data.userId : undefined,
      invitationToken,
    };

    this.logger.log(
      `IAM_APPLICANT_ONBOARD status=${result.status} tenantId=${tenantId} email=${payload.email} hasInviteToken=${Boolean(invitationToken)}`,
    );
    return result;
  }

  /**
   * Completes IAM invite accept (sets password). fullName from invite metadata when omitted.
   */
  async acceptInvitation(input: {
    token: string;
    password: string;
    fullName?: string;
  }): Promise<{ accepted: boolean; email: string; userId: string }> {
    const iamBase = this.iamBaseUrl();
    const url = `${iamBase}/auth/accept-invitation`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: input.token,
          password: input.password,
          ...(input.fullName?.trim()
            ? { fullName: input.fullName.trim() }
            : {}),
        }),
      });
    } catch (error) {
      this.logger.error(
        `IAM accept-invitation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BusinessException(
        'Unable to set password on the identity platform',
        HttpStatus.BAD_GATEWAY,
        'IAM_UNAVAILABLE',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(
        `IAM accept-invitation ${response.status}: ${body.slice(0, 400)}`,
      );
      throw new BusinessException(
        this.acceptErrorMessage(response.status, body),
        HttpStatus.BAD_GATEWAY,
        'IAM_ACCEPT_FAILED',
      );
    }

    const data = (await response.json()) as {
      accepted?: boolean;
      email?: string;
      userId?: string;
    };
    return {
      accepted: data.accepted !== false,
      email: data.email ?? '',
      userId: data.userId ?? '',
    };
  }

  private acceptErrorMessage(status: number, body: string): string {
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
      if (Array.isArray(parsed.message) && parsed.message[0]) {
        return String(parsed.message[0]);
      }
    } catch {
      /* ignore */
    }
    if (status === 401) return 'Incorrect password for this email';
    if (status === 409) return 'This invitation was already accepted';
    if (status === 400) return 'Invalid or expired verification link';
    return 'Unable to complete account verification';
  }

  private onboardErrorMessage(status: number, body: string): string {
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
      if (Array.isArray(parsed.message) && parsed.message[0]) {
        return String(parsed.message[0]);
      }
    } catch {
      /* ignore */
    }
    if (status === 409) {
      return 'A pending invitation or active membership already exists for this email on the identity platform';
    }
    if (status === 400) {
      return 'Tenant is not entitled to Admissions or onboard request was invalid';
    }
    return 'Unable to onboard applicant on the identity platform';
  }

  private requireApiKey(): string {
    const apiKey = this.config.get<string>('IAM_REGISTRATION_API_KEY')?.trim();
    if (!apiKey) {
      throw new BusinessException(
        'IAM_REGISTRATION_API_KEY is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
        'IAM_API_KEY_MISSING',
      );
    }
    return apiKey;
  }

  private iamBaseUrl(): string {
    const raw =
      this.config.get<string>('IAM_BASE_URL')?.trim() ||
      this.config.get<string>('BASE_PLATFORM_URL')?.trim() ||
      'http://localhost:3010/api/v1';
    return raw.replace(/\/$/, '');
  }
}
