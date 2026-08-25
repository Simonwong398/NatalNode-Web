/** Authentication methods supported by the website domain. */
export type AuthProvider = 'EMAIL_MAGIC_LINK' | 'GOOGLE';

/**
 * Stable account-level information owned by the website domain.
 *
 * IDs are opaque values supplied by the account boundary; this contract does
 * not assume a UUID format or define how IDs are generated.
 */
export interface UserAccount {
  readonly userId: string;
  /** ISO 8601 timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. */
  readonly updatedAt: string;
}

/**
 * An external authentication identity linked to a user account.
 *
 * `providerSubject` is an opaque provider-owned subject or identity key. This
 * record intentionally excludes passwords, magic-link tokens, and OAuth
 * access or refresh tokens.
 */
export interface AuthIdentity {
  readonly identityId: string;
  readonly userId: string;
  readonly provider: AuthProvider;
  readonly providerSubject: string;
  /** ISO 8601 timestamp. */
  readonly createdAt: string;
  /** ISO 8601 timestamp. */
  readonly updatedAt: string;
}
