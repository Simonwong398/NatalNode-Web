import { createHash } from 'node:crypto';

/** Converts a transient bearer secret into its persistence-safe digest. */
export interface TokenHasher {
  hash(token: string): string;
}

/** Hashes bearer secrets with the full SHA-256 digest encoded as hex. */
export class Sha256TokenHasher implements TokenHasher {
  public hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
