import type { AuthenticationExpirationPolicy } from '../auth-runtime/authentication-expiration-policy.js';

function assertValidTtl(seconds: number, name: string): void {
  if (!Number.isFinite(seconds) || !Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(`${name} must be a finite positive integer.`);
  }
}

function calculateExpiration(now: string, ttlSeconds: number): string {
  const nowMilliseconds = Date.parse(now);

  if (!Number.isFinite(nowMilliseconds)) {
    throw new Error('Authentication expiration input is not a valid timestamp.');
  }

  const expirationMilliseconds = nowMilliseconds + ttlSeconds * 1000;

  if (!Number.isFinite(expirationMilliseconds)) {
    throw new Error('Authentication expiration is outside the supported date range.');
  }

  const expiration = new Date(expirationMilliseconds);

  if (!Number.isFinite(expiration.getTime())) {
    throw new Error('Authentication expiration is outside the supported date range.');
  }

  return expiration.toISOString();
}

export class DurationAuthenticationExpirationPolicy
  implements AuthenticationExpirationPolicy
{
  public constructor(
    private readonly magicLinkTtlSeconds: number,
    private readonly sessionTtlSeconds: number
  ) {
    assertValidTtl(magicLinkTtlSeconds, 'magicLinkTtlSeconds');
    assertValidTtl(sessionTtlSeconds, 'sessionTtlSeconds');
  }

  public magicLinkExpiresAt(now: string): string {
    return calculateExpiration(now, this.magicLinkTtlSeconds);
  }

  public sessionExpiresAt(now: string): string {
    return calculateExpiration(now, this.sessionTtlSeconds);
  }
}
