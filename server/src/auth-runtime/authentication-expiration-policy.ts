/** Supplies authentication expirations without coupling routes to a TTL. */
export interface AuthenticationExpirationPolicy {
  magicLinkExpiresAt(now: string): string;
  sessionExpiresAt(now: string): string;
}
