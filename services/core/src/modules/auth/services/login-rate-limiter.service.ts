import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type AttemptTracker = {
  count: number;
  expiresAt: number;
  blockedUntil?: number;
};

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, AttemptTracker>();
  private readonly windowMs = 60 * 1000; // 1 minute
  private readonly maxAttempts = 5;
  private readonly blockDurationMs = 10 * 60 * 1000; // 10 minutes

  ensureNotBlocked(identifier: string) {
    const now = Date.now();
    const entry = this.attempts.get(identifier);
    if (!entry) {
      return;
    }

    // Reset window when expired
    if (now > entry.expiresAt) {
      this.attempts.delete(identifier);
      return;
    }

    if (entry.blockedUntil && now < entry.blockedUntil) {
      throw new HttpException(
        'Too many login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  recordFailure(identifier: string) {
    const now = Date.now();
    const entry =
      this.attempts.get(identifier) ??
      ({
        count: 0,
        expiresAt: now + this.windowMs
      } as AttemptTracker);

    entry.count += 1;

    if (entry.count >= this.maxAttempts) {
      entry.blockedUntil = now + this.blockDurationMs;
    }

    this.attempts.set(identifier, entry);
  }

  clear(identifier: string) {
    this.attempts.delete(identifier);
  }
}
