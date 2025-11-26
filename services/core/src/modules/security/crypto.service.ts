import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

/**
 * Simple crypto helper with placeholders for KMS/secret manager integration.
 * TODO: replace with cloud KMS envelope encryption in production.
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.PII_ENCRYPTION_KEY;
    if (!rawKey || rawKey.length < 32) {
      // fall back to deterministic key for local/dev only
      this.key = crypto.createHash('sha256').update(rawKey || 'dev-pii-key').digest();
    } else {
      this.key = Buffer.from(rawKey.slice(0, 32));
    }
  }

  encrypt(plaintext: string): { iv: string; authTag: string; ciphertext: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64')
    };
  }

  decrypt(payload: { iv: string; authTag: string; ciphertext: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(payload.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final()
    ]);
    return plaintext.toString('utf8');
  }

  /**
   * Stable hash for lookup/indexing PII without storing plaintext.
   */
  hashForLookup(value: string): string {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }
}
