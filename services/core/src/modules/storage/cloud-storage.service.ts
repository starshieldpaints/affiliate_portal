import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Bucket } from '@google-cloud/storage';

type SignedUploadParams = {
  objectName: string;
  contentType: string;
  expiresInSeconds?: number;
};

type SignedDownloadParams = {
  objectName: string;
  expiresInSeconds?: number;
};

@Injectable()
export class CloudStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly bucket?: Bucket;
  private readonly logger = new Logger(CloudStorageService.name);
  private readonly allowedContentTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  private readonly isBucketPublic: boolean;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('gcs.bucket') ?? '';
    this.isBucketPublic = this.configService.get<boolean>('gcs.publicBucket') ?? false;
    const { projectId, credentials } = this.resolveCredentials();

    this.storage = new Storage({
      projectId,
      credentials
    });

    if (this.bucketName) {
      this.bucket = this.storage.bucket(this.bucketName);
    }

    this.logger.log(
      `Initialized CloudStorageService for bucket "${this.bucketName || 'UNKNOWN'}"${
        projectId ? ` (project: ${projectId})` : ''
      }`
    );
  }

  async generateSignedUploadUrl(params: SignedUploadParams) {
    if (!this.bucketName) {
      throw new InternalServerErrorException('Google Cloud Storage bucket not configured');
    }
    this.ensureValidUploadParams(params);

    const expiresInSeconds = params.expiresInSeconds ?? 15 * 60;
    const expires = this.computeExpiry(expiresInSeconds);
    const file = this.getBucket().file(params.objectName);
    try {
      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires,
        contentType: params.contentType,
        extensionHeaders: { 'x-goog-if-generation-match': '0' }
      });
      const publicUrl = this.isBucketPublic ? this.buildPublicUrl(params.objectName) : undefined;
      this.logger.log(
        `Generated signed upload URL for ${params.objectName} (expires in ${expiresInSeconds}s)`
      );
      return { uploadUrl, publicUrl, objectName: params.objectName, expiresAt: new Date(expires) };
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to generate signed upload URL for ${params.objectName} in bucket ${this.bucketName}`,
        this.formatError(error)
      );
      throw new InternalServerErrorException('Unable to sign upload URL');
    }
  }

  async generateSignedDownloadUrl(params: SignedDownloadParams) {
    if (!this.bucketName) {
      throw new InternalServerErrorException('Google Cloud Storage bucket not configured');
    }
    const expiresInSeconds = params.expiresInSeconds ?? 15 * 60;
    const expires = this.computeExpiry(expiresInSeconds);
    const file = this.getBucket().file(params.objectName);
    try {
      const [exists] = await file.exists();
      if (!exists) {
        throw new NotFoundException(`Object ${params.objectName} not found`);
      }

      const [downloadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires
      });
      this.logger.log(
        `Generated signed download URL for ${params.objectName} (expires in ${expiresInSeconds}s)`
      );
      return { downloadUrl, objectName: params.objectName, expiresAt: new Date(expires) };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to generate signed download URL for ${params.objectName} in bucket ${this.bucketName}`,
        this.formatError(error)
      );
      throw new InternalServerErrorException('Unable to sign download URL');
    }
  }

  private buildPublicUrl(objectName: string) {
    const safeName = objectName
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://storage.googleapis.com/${this.bucketName}/${safeName}`;
  }

  private computeExpiry(expiresInSeconds: number) {
    return Date.now() + expiresInSeconds * 1000;
  }

  private ensureValidUploadParams(params: SignedUploadParams) {
    if (!this.allowedContentTypes.has(params.contentType)) {
      throw new InternalServerErrorException(
        `Unsupported content type ${params.contentType}; allowed: ${Array.from(
          this.allowedContentTypes
        ).join(', ')}`
      );
    }
    if (!params.objectName || params.objectName.includes('..') || params.objectName.startsWith('/')) {
      throw new InternalServerErrorException('Invalid object name');
    }
  }

  private getBucket() {
    if (!this.bucket) {
      throw new InternalServerErrorException('Google Cloud Storage bucket not configured');
    }
    return this.bucket;
  }

  private resolveCredentials(): {
    projectId?: string;
    credentials?: { client_email: string; private_key: string };
  } {
    const projectIdEnv = this.configService.get<string>('gcs.projectId') ?? undefined;
    const clientEmail = this.configService.get<string>('gcs.clientEmail');
    const privateKey = this.configService.get<string>('gcs.privateKey');
    if (clientEmail && privateKey) {
      const normalizedKey = privateKey.replace(/\\n/g, '\n');
      return {
        projectId: projectIdEnv,
        credentials: { client_email: clientEmail, private_key: normalizedKey }
      };
    }

    const credentialsPath = this.configService.get<string>('gcs.credentialsPath');
    if (credentialsPath) {
      try {
        const resolved = path.isAbsolute(credentialsPath)
          ? credentialsPath
          : path.resolve(process.cwd(), credentialsPath);
        const raw = readFileSync(resolved, 'utf8');
        const parsed = JSON.parse(raw) as {
          client_email?: string;
          private_key?: string;
          project_id?: string;
        };
        if (parsed.client_email && parsed.private_key) {
          return {
            projectId: projectIdEnv ?? parsed.project_id,
            credentials: {
              client_email: parsed.client_email,
              private_key: parsed.private_key
            }
          };
        }
        this.logger.error('GCS credentials file missing client_email or private_key');
      } catch (error) {
        this.logger.error('Unable to read GCS credentials file', error as Error);
      }
    }

    this.logger.warn('GCS credentials not fully configured; relying on default ADC');
    return { projectId: projectIdEnv };
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return String(error);
  }
}
