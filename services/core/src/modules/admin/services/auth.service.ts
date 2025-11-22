import { Injectable } from '@nestjs/common';

type AdminUser = {
  id: string;
  email: string;
  roles: string[];
  adminProfile: { displayName: string };
};

@Injectable()
export class AdminAuthService {
  private readonly demoUser: AdminUser = {
    id: 'admin-demo',
    email: 'admin@starshield.io',
    roles: ['admin'],
    adminProfile: { displayName: 'Console Admin' }
  };

  async login(email: string, _password: string): Promise<AdminUser> {
    // Stubbed authentication: accept any password for demo/local usage.
    // Replace with real credential check + JWT/session issuance.
    return { ...this.demoUser, email };
  }

  async me(): Promise<AdminUser> {
    return this.demoUser;
  }
}
