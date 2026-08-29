import { normalizeEmailAddress } from './email-normalization.js';
import { issueAuthSession } from './issue-auth-session.js';
import type { AuthenticationExpirationPolicy } from './authentication-expiration-policy.js';
import type { IdGenerator } from '../app/creation-boundaries.js';
import type { GoogleAuthAccountSessionLifecycle } from '../persistence/google-auth-account-session-lifecycle.js';
import {
  GOOGLE_OIDC_PROVIDER,
  type VerifiedGoogleIdentity
} from './google-oidc-provider.js';
import type { SecureTokenGenerator } from './secure-token.js';
import type { TokenHasher } from './token-hasher.js';

const MAX_GOOGLE_SUBJECT_LENGTH = 256;
const MAX_GOOGLE_EMAIL_LENGTH = 254;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;

const VERIFIED_GOOGLE_IDENTITY_KEYS = [
  'provider',
  'providerSubject',
  'verifiedEmail'
] as const;

export interface CompletedGoogleAuthentication {
  readonly userId: string;
  readonly sessionToken: string;
  readonly sessionExpiresAt: string;
}

export type GoogleAuthenticationResult =
  | { readonly outcome: 'authenticated'; readonly session: CompletedGoogleAuthentication }
  | { readonly outcome: 'email-collision' };

export interface CompleteGoogleAuthenticationInput {
  readonly transactionId: string;
  readonly identity: unknown;
  readonly now: string;
  readonly idGenerator: IdGenerator;
  readonly tokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
  readonly authenticationExpirationPolicy: AuthenticationExpirationPolicy;
  readonly accountSessionLifecycle: GoogleAuthAccountSessionLifecycle;
}

function invalidIdentity(): never {
  throw new Error('Verified Google identity is invalid.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactIdentityKeys(value: Record<string, unknown>): boolean {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...VERIFIED_GOOGLE_IDENTITY_KEYS].sort();

  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function assertBoundedGoogleSubject(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_GOOGLE_SUBJECT_LENGTH ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    invalidIdentity();
  }
}

function assertNormalizedGoogleEmail(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_GOOGLE_EMAIL_LENGTH ||
    value !== normalizeEmailAddress(value) ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    !value.includes('@')
  ) {
    invalidIdentity();
  }
}

/** Validates the only identity shape allowed to cross the provider boundary. */
export function assertVerifiedGoogleIdentity(
  value: unknown
): asserts value is VerifiedGoogleIdentity {
  if (!isRecord(value) || !hasExactIdentityKeys(value)) {
    invalidIdentity();
  }

  if (value.provider !== GOOGLE_OIDC_PROVIDER) {
    invalidIdentity();
  }

  assertBoundedGoogleSubject(value.providerSubject);
  assertNormalizedGoogleEmail(value.verifiedEmail);
}

/**
 * Converts verified provider output into the existing first-party session
 * model. Account/session persistence and OAuth COMPLETED terminalization are
 * committed together by the injected lifecycle boundary.
 */
export async function completeGoogleAuthentication(
  input: CompleteGoogleAuthenticationInput
): Promise<GoogleAuthenticationResult> {
  assertVerifiedGoogleIdentity(input.identity);

  const sessionExpiresAt = input.authenticationExpirationPolicy.sessionExpiresAt(
    input.now
  );
  const issuedSession = issueAuthSession({
    userId: input.idGenerator.generate(),
    createdAt: input.now,
    expiresAt: sessionExpiresAt,
    tokenGenerator: input.tokenGenerator,
    tokenHasher: input.tokenHasher
  });
  const proposedUserId = issuedSession.record.userId;
  const proposedIdentityId = input.idGenerator.generate();
  const result = await input.accountSessionLifecycle.resolveAndCreateSession({
    transactionId: input.transactionId,
    providerSubject: input.identity.providerSubject,
    emailNormalized: input.identity.verifiedEmail,
    proposedUserId,
    proposedIdentityId,
    session: issuedSession.record,
    terminalAt: input.now
  });

  if (result.outcome === 'email-collision') {
    return { outcome: 'email-collision' };
  }

  return {
    outcome: 'authenticated',
    session: {
      userId: result.userId,
      sessionToken: issuedSession.token,
      sessionExpiresAt
    }
  };
}
