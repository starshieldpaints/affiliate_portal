import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, App, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth as FirebaseAdminAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private app: App | null = null;
  private auth: FirebaseAdminAuth | null = null;

  constructor(private readonly config: ConfigService) {}

  private ensureInitialized() {
    if (this.auth) {
      return this.auth;
    }

    const projectId = this.config.get<string | undefined>('firebase.projectId');
    const clientEmail = this.config.get<string | undefined>('firebase.clientEmail');
    const privateKeyRaw = this.config.get<string | undefined>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.error('Firebase credentials are not fully configured');
      throw new InternalServerErrorException('Firebase OTP verification not configured');
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    if (!this.app) {
      this.app =
        getApps().find((app: App) => app.name === 'affiliate-firebase') ??
        initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey
            })
          },
          'affiliate-firebase'
        );
      this.logger.log(`Initialized Firebase app for project ${projectId}`);
    }

    this.auth = getAuth(this.app);
    return this.auth;
  }

  async verifyIdToken(idToken: string) {
    const auth = this.ensureInitialized();
    return auth.verifyIdToken(idToken, true);
  }
}
