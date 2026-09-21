import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from './current-user.decorator.js';

export interface RequestContext {
  tenantId: string;
  userId: string;
  email?: string;
  roles?: string[];
}

type AuthedRequest = Request & { user?: AuthUser };

function resolveDefaultTenantId(): string {
  const raw =
    process.env.DEFAULT_TENANT_ID?.trim() ||
    '00000000-0000-4000-8000-000000000001';
  return raw.replace(/^["']|["']$/g, '');
}

/**
 * Resolves caller identity from the OAuth JWT.
 * Tenant is always `DEFAULT_TENANT_ID` (single-tenant admissions portal).
 * User id comes from the JWT `sub` claim.
 */
export const ReqContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest<AuthedRequest>();
    const authUser = request.user;

    if (!authUser?.userId) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Bearer access token required',
      });
    }

    return {
      tenantId: resolveDefaultTenantId(),
      userId: authUser.userId,
      email: authUser.email,
      roles: authUser.roles,
    };
  },
);

export { resolveDefaultTenantId };
