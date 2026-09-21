import { Injectable } from '@nestjs/common';

/**
 * Adapter for Base Platform IAM.
 * Identity → Tenant Membership → Entitlement → Application Access → Roles → Permissions.
 * ADM-F000 does not own a local roles table.
 */
@Injectable()
export class IamService {
  // TODO: Resolve caller identity, tenant membership, and permission grants.
  async hasPermission(
    _identityId: string,
    _tenantId: string,
    _permission: string,
  ): Promise<boolean> {
    return false;
  }
}
