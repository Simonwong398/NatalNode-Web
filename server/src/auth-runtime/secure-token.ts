import { randomBytes } from 'node:crypto';

/** Generates opaque bearer secrets for server-side authentication state. */
export interface SecureTokenGenerator {
  generate(): string;
}

/** Generates 256 bits of cryptographically secure, URL-safe random entropy. */
export class NodeSecureTokenGenerator implements SecureTokenGenerator {
  public generate(): string {
    return randomBytes(32).toString('base64url');
  }
}
