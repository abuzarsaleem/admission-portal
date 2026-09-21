import { Injectable } from '@nestjs/common';
import { IamLoginBridgeService } from './iam-login-bridge.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly iamLoginBridge: IamLoginBridgeService) {}

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    userId: string;
    tenantId: string;
    email: string;
    roles: string[];
  }> {
    return this.iamLoginBridge.loginWithPassword({ email, password });
  }
}
