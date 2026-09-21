import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';

interface OauthJwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  clientId?: string;
  scope?: string;
  sessionId?: string;
  type?: string;
  roles?: string[] | string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ??
        process.env.JWT_SECRET ??
        'change-me-access-secret-min-32-chars',
    });
  }

  validate(payload: OauthJwtPayload): AuthUser {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (payload.type !== 'oauth') {
      throw new BusinessException(
        'OAuth access token required',
        HttpStatus.UNAUTHORIZED,
        'INVALID_TOKEN_TYPE',
      );
    }

    const tenantId = payload.tenantId?.trim();
    if (!tenantId) {
      throw new BusinessException(
        'tenantId claim is required',
        HttpStatus.UNAUTHORIZED,
        'TENANT_REQUIRED',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId,
      clientId: payload.clientId,
      scope: payload.scope,
      sessionId: payload.sessionId,
      roles: this.parseRoles(payload.roles),
    };
  }

  private parseRoles(raw: string[] | string | undefined): string[] {
    const values = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? raw.split(/[,\s]+/)
        : [];
    return [
      ...new Set(
        values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)),
      ),
    ];
  }
}
