/**
 * Server-only persistence shape for an opaque authenticated session.
 *
 * The session secret itself is never represented here; only its one-way
 * persistence hash is retained by the runtime boundary.
 */
export interface AuthSessionRecord {
  readonly sessionTokenHash: string;
  readonly userId: string;
  /** ISO 8601 timestamp selected by the server runtime. */
  readonly createdAt: string;
  /** ISO 8601 timestamp selected by the server runtime. */
  readonly expiresAt: string;
}

/**
 * Server-only persistence shape for a single-use email magic-link challenge.
 *
 * The presented magic-link secret is never represented here; only its
 * one-way persistence hash is retained until the challenge is consumed or
 * expires.
 */
export interface EmailMagicLinkChallengeRecord {
  readonly challengeId: string;
  readonly tokenHash: string;
  readonly emailNormalized: string;
  /** ISO 8601 timestamp selected by the server runtime. */
  readonly createdAt: string;
  /** ISO 8601 timestamp selected by the server runtime. */
  readonly expiresAt: string;
  /** ISO 8601 timestamp when the challenge was consumed, or null if unused. */
  readonly consumedAt: string | null;
}
