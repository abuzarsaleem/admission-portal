import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exceptions/business.exception.js';

export type PortalLoginResult = {
  accessToken: string;
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
};

type IamLoginResponse = {
  accessToken?: string;
  access_token?: string;
  user?: { id?: string; userId?: string; email?: string };
};

/**
 * Bridges password login to Base Platform IAM, then exchanges for an
 * OAuth access JWT (type=oauth + tenantId + roles) — same pattern as taleem-ai-cms.
 */
@Injectable()
export class IamLoginBridgeService {
  private readonly logger = new Logger(IamLoginBridgeService.name);

  constructor(private readonly config: ConfigService) {}

  async loginWithPassword(input: {
    email: string;
    password: string;
  }): Promise<PortalLoginResult> {
    const iamBase = this.iamBaseUrl();
    const session = await this.iamPasswordLogin(
      iamBase,
      input.email,
      input.password,
    );

    const oauth = await this.exchangeOAuthAccessToken({
      iamBase,
      sessionAccessToken: session.accessToken,
    });

    const roles = this.parseRolesFromAccessToken(oauth.accessToken);
    this.logger.log(
      `IAM_PORTAL_LOGIN userId=${session.userId} tenant=${oauth.tenantId} roles=${roles.join(',')}`,
    );

    return {
      accessToken: oauth.accessToken,
      userId: session.userId,
      tenantId: oauth.tenantId,
      email: session.email || input.email.toLowerCase(),
      roles,
    };
  }

  private async iamPasswordLogin(
    iamBase: string,
    email: string,
    password: string,
  ): Promise<{ accessToken: string; userId: string; email: string }> {
    const res = await fetch(`${iamBase}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as IamLoginResponse & {
      message?: string;
      code?: string;
    };
    if (!res.ok) {
      throw new BusinessException(
        body.message || 'Invalid credentials',
        res.status === 401 ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_GATEWAY,
        body.code || 'IAM_LOGIN_FAILED',
      );
    }

    const accessToken = body.accessToken ?? body.access_token;
    const userId = body.user?.id ?? body.user?.userId;
    if (!accessToken || !userId) {
      throw new BusinessException(
        'IAM login response missing token or user id',
        HttpStatus.BAD_GATEWAY,
        'IAM_LOGIN_INVALID',
      );
    }
    return {
      accessToken,
      userId,
      email: body.user?.email ?? email.toLowerCase(),
    };
  }

  private async exchangeOAuthAccessToken(input: {
    iamBase: string;
    sessionAccessToken: string;
  }): Promise<{ accessToken: string; tenantId: string }> {
    const clientId =
      this.config.get<string>('OAUTH_ADMIN_CLIENT_ID')?.trim() ||
      this.config.get<string>('VITE_ADMIN_OAUTH_CLIENT_ID')?.trim() ||
      'admission-portal';
    const clientSecret =
      this.config.get<string>('OAUTH_ADMIN_CLIENT_SECRET')?.trim() ||
      this.config.get<string>('VITE_ADMIN_OAUTH_CLIENT_SECRET')?.trim() ||
      'AdmissionAdminClientSecret2026!';
    const redirectUri =
      this.config.get<string>('OAUTH_ADMIN_REDIRECT_URI')?.trim() ||
      this.config.get<string>('VITE_ADMIN_PORTAL_CALLBACK')?.trim() ||
      'http://localhost:3000/callback';
    // Empty when application_scopes is not seeded — IAM treats empty scope as valid.
    const scope = this.config.get<string>('OAUTH_SCOPE')?.trim() || '';

    const { verifier, challenge } = this.createPkce();

    const authorizeParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    if (scope) {
      authorizeParams.set('scope', scope);
    }

    const preview = await this.iamJson<{
      tenants?: Array<{ tenantId?: string; id?: string }>;
      data?: { tenants?: Array<{ tenantId?: string; id?: string }> };
    }>(`${input.iamBase}/oauth/authorize?${authorizeParams.toString()}`, {
      headers: { authorization: `Bearer ${input.sessionAccessToken}` },
    });

    const tenants =
      preview.tenants ??
      preview.data?.tenants ??
      ([] as Array<{ tenantId?: string; id?: string }>);
    const tenantIds = tenants
      .map((t) => t.tenantId ?? t.id)
      .filter((id): id is string => Boolean(id));

    const tenantId = this.defaultTenantId();
    if (!tenantIds.includes(tenantId)) {
      throw new BusinessException(
        `User is not entitled to DEFAULT_TENANT_ID (${tenantId})`,
        HttpStatus.FORBIDDEN,
        'TENANT_REQUIRED',
      );
    }

    const consentBody: Record<string, unknown> = {
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      tenant_id: tenantId,
      approved: true,
    };
    if (scope) {
      consentBody.scope = scope;
    }

    const consent = await this.iamJson<{
      code?: string;
      redirectUri?: string;
    }>(`${input.iamBase}/oauth/authorize/consent`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.sessionAccessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(consentBody),
    });

    const code =
      consent.code ||
      (consent.redirectUri
        ? new URL(consent.redirectUri).searchParams.get('code')
        : null);
    if (!code) {
      throw new BusinessException(
        'OAuth consent did not return an authorization code',
        HttpStatus.BAD_GATEWAY,
        'OAUTH_CONSENT_FAILED',
      );
    }

    const token = await this.iamJson<{
      access_token?: string;
      accessToken?: string;
    }>(`${input.iamBase}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: verifier,
      }),
    });

    const accessToken = token.access_token ?? token.accessToken;
    if (!accessToken) {
      throw new BusinessException(
        'OAuth token response missing access_token',
        HttpStatus.BAD_GATEWAY,
        'OAUTH_TOKEN_FAILED',
      );
    }

    return { accessToken, tenantId };
  }

  private parseRolesFromAccessToken(accessToken: string): string[] {
    try {
      const [, payloadPart] = accessToken.split('.');
      if (!payloadPart) return [];
      const json = Buffer.from(payloadPart, 'base64url').toString('utf8');
      const payload = JSON.parse(json) as { roles?: string[] | string };
      const values = Array.isArray(payload.roles)
        ? payload.roles
        : typeof payload.roles === 'string'
          ? payload.roles.split(/[,\s]+/)
          : [];
      return [
        ...new Set(
          values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)),
        ),
      ];
    } catch {
      return [];
    }
  }

  private createPkce() {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
  }

  private iamBaseUrl(): string {
    const base =
      this.config.get<string>('IAM_BASE_URL')?.trim() ||
      this.config.get<string>('BASE_PLATFORM_URL')?.trim() ||
      this.config.get<string>('BASE_API_URL')?.trim() ||
      'http://localhost:3010/api/v1';
    return base.replace(/\/$/, '');
  }

  private defaultTenantId(): string {
    const raw =
      this.config.get<string>('DEFAULT_TENANT_ID')?.trim() ||
      '00000000-0000-4000-8000-000000000001';
    return raw.replace(/^["']|["']$/g, '');
  }

  private async iamJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => ({}))) as T & {
      message?: string;
      code?: string;
    };
    if (!res.ok) {
      this.logger.warn(
        `IAM_CALL_FAILED ${init?.method ?? 'GET'} ${url} status=${res.status} message=${body.message ?? ''}`,
      );
      throw new BusinessException(
        body.message || `IAM request failed (${res.status})`,
        res.status >= 400 && res.status < 500
          ? res.status
          : HttpStatus.BAD_GATEWAY,
        body.code || 'IAM_REQUEST_FAILED',
      );
    }
    return body;
  }
}
