import { createHash, timingSafeEqual } from 'node:crypto';
import type { IdGenerator } from '../app/creation-boundaries.js';
import type {
  GoogleOAuthTransactionClaim,
  GoogleOAuthTransactionRepository
} from '../persistence/google-oauth-transaction-repository.js';
import { NodeSecureTokenGenerator } from './secure-token.js';
import type { SecureTokenGenerator } from './secure-token.js';
import { Sha256TokenHasher } from './token-hasher.js';
import type { TokenHasher } from './token-hasher.js';

export const GOOGLE_OAUTH_FLOW_KIND = 'GOOGLE_SIGN_IN' as const;
export const GOOGLE_OAUTH_POST_AUTH_REDIRECT = '/' as const;
export const GOOGLE_OAUTH_TRANSACTION_MAX_TTL_SECONDS = 900 as const;

const MAX_OPAQUE_IDENTIFIER_LENGTH = 256;
const MIN_PROTOCOL_SECRET_LENGTH = 43;
const MAX_PROTOCOL_SECRET_LENGTH = 128;
const SHA256_HEX_LENGTH = 64;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const BASE64URL_SECRET_PATTERN = /^[A-Za-z0-9_-]+$/u;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/u;

const GOOGLE_OAUTH_TRANSACTION_STATUSES = [
  'PENDING',
  'CLAIMED',
  'COMPLETED',
  'FAILED',
  'EXPIRED'
] as const;

export type GoogleOAuthTransactionFlowKind = typeof GOOGLE_OAUTH_FLOW_KIND;
export type GoogleOAuthTransactionStatus =
  (typeof GOOGLE_OAUTH_TRANSACTION_STATUSES)[number];
export type GoogleOAuthTransactionTerminalStatus = 'COMPLETED' | 'FAILED';

/**
 * Server-only pending transaction record. The PKCE verifier is the only raw
 * recoverable protocol secret and is nulled when this record is terminal.
 */
export interface GoogleOAuthTransactionRecord {
  readonly transactionId: string;
  readonly flowKind: GoogleOAuthTransactionFlowKind;
  readonly stateHash: string;
  readonly pkceVerifier: string | null;
  readonly nonceHash: string;
  readonly browserBindingHash: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly postAuthRedirect: typeof GOOGLE_OAUTH_POST_AUTH_REDIRECT;
  readonly status: GoogleOAuthTransactionStatus;
  readonly claimedAt: string | null;
  readonly terminalAt: string | null;
}

export interface GoogleOAuthTransactionPolicy {
  /** A positive, bounded security window; not a product or legal retention value. */
  readonly ttlSeconds: number;
}

export interface CreateGoogleOAuthTransactionInput {
  readonly now: string;
}

export interface GoogleOAuthTransactionStartMaterial {
  readonly transactionId: string;
  readonly state: string;
  readonly codeChallenge: string;
  readonly nonce: string;
  readonly browserBinding: string;
  readonly expiresAt: string;
  readonly postAuthRedirect: typeof GOOGLE_OAUTH_POST_AUTH_REDIRECT;
}

export interface ClaimGoogleOAuthTransactionInput {
  readonly state: string;
  readonly browserBinding: string;
  readonly now: string;
}

export interface TerminalizeGoogleOAuthTransactionInput {
  readonly transactionId: string;
  readonly status: GoogleOAuthTransactionTerminalStatus;
  readonly terminalAt: string;
}

export interface GoogleOAuthTransactionServiceDependencies {
  readonly repository: GoogleOAuthTransactionRepository;
  readonly idGenerator: IdGenerator;
  readonly policy: GoogleOAuthTransactionPolicy;
  readonly secureTokenGenerator?: SecureTokenGenerator;
  readonly tokenHasher?: TokenHasher;
}

const GOOGLE_OAUTH_TRANSACTION_RECORD_KEYS = [
  'transactionId',
  'flowKind',
  'stateHash',
  'pkceVerifier',
  'nonceHash',
  'browserBindingHash',
  'createdAt',
  'expiresAt',
  'postAuthRedirect',
  'status',
  'claimedAt',
  'terminalAt'
] as const;

function invalidValue(field: string): never {
  throw new Error(`Google OAuth transaction ${field} is invalid.`);
}

function assertObject(value: unknown, field: string): asserts value is object {
  if (typeof value !== 'object' || value === null) {
    invalidValue(field);
  }
}

export function assertGoogleOAuthOpaqueValue(
  value: unknown,
  field: string
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_OPAQUE_IDENTIFIER_LENGTH ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    invalidValue(field);
  }
}

export function assertGoogleOAuthProtocolSecret(
  value: unknown,
  field: string
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length < MIN_PROTOCOL_SECRET_LENGTH ||
    value.length > MAX_PROTOCOL_SECRET_LENGTH ||
    !BASE64URL_SECRET_PATTERN.test(value)
  ) {
    invalidValue(field);
  }
}

export function assertGoogleOAuthSha256Hash(
  value: unknown,
  field: string
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length !== SHA256_HEX_LENGTH ||
    !SHA256_HEX_PATTERN.test(value)
  ) {
    invalidValue(field);
  }
}

export function assertGoogleOAuthTimestamp(
  value: unknown,
  field: string
): asserts value is string {
  if (typeof value !== 'string') {
    invalidValue(field);
  }

  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== value) {
    invalidValue(field);
  }
}

function assertNullableGoogleOAuthTimestamp(
  value: unknown,
  field: string
): asserts value is string | null {
  if (value === null) {
    return;
  }

  assertGoogleOAuthTimestamp(value, field);
}

function assertGoogleOAuthFlowKind(
  value: unknown
): asserts value is GoogleOAuthTransactionFlowKind {
  if (value !== GOOGLE_OAUTH_FLOW_KIND) {
    invalidValue('flowKind');
  }
}

function assertGoogleOAuthStatus(
  value: unknown
): asserts value is GoogleOAuthTransactionStatus {
  if (
    typeof value !== 'string' ||
    !(GOOGLE_OAUTH_TRANSACTION_STATUSES as readonly string[]).includes(value)
  ) {
    invalidValue('status');
  }
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  field: string
): void {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();

  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    invalidValue(field);
  }
}

function assertExactRecordKeys(record: object): void {
  assertExactKeys(record, GOOGLE_OAUTH_TRANSACTION_RECORD_KEYS, 'record fields');
}

const GOOGLE_OAUTH_TRANSACTION_CLAIM_INPUT_KEYS = [
  'stateHash',
  'browserBindingHash',
  'now'
] as const;

const GOOGLE_OAUTH_TRANSACTION_TERMINALIZE_INPUT_KEYS = [
  'transactionId',
  'status',
  'terminalAt'
] as const;

export function assertGoogleOAuthTransactionRecord(
  value: unknown
): asserts value is GoogleOAuthTransactionRecord {
  assertObject(value, 'record');
  assertExactRecordKeys(value);

  const record = value as GoogleOAuthTransactionRecord;
  assertGoogleOAuthOpaqueValue(record.transactionId, 'transactionId');
  assertGoogleOAuthFlowKind(record.flowKind);
  assertGoogleOAuthSha256Hash(record.stateHash, 'stateHash');
  assertGoogleOAuthSha256Hash(record.nonceHash, 'nonceHash');
  assertGoogleOAuthSha256Hash(
    record.browserBindingHash,
    'browserBindingHash'
  );
  assertGoogleOAuthTimestamp(record.createdAt, 'createdAt');
  assertGoogleOAuthTimestamp(record.expiresAt, 'expiresAt');
  if (Date.parse(record.expiresAt) <= Date.parse(record.createdAt)) {
    invalidValue('expiresAt');
  }

  if (record.postAuthRedirect !== GOOGLE_OAUTH_POST_AUTH_REDIRECT) {
    invalidValue('postAuthRedirect');
  }

  assertGoogleOAuthStatus(record.status);
  assertNullableGoogleOAuthTimestamp(record.claimedAt, 'claimedAt');
  assertNullableGoogleOAuthTimestamp(record.terminalAt, 'terminalAt');

  if (
    record.claimedAt !== null &&
    Date.parse(record.claimedAt) < Date.parse(record.createdAt)
  ) {
    invalidValue('claimedAt');
  }
  if (
    record.terminalAt !== null &&
    Date.parse(record.terminalAt) < Date.parse(record.createdAt)
  ) {
    invalidValue('terminalAt');
  }
  if (
    record.claimedAt !== null &&
    record.terminalAt !== null &&
    Date.parse(record.terminalAt) < Date.parse(record.claimedAt)
  ) {
    invalidValue('terminalAt');
  }

  switch (record.status) {
    case 'PENDING':
      assertGoogleOAuthProtocolSecret(record.pkceVerifier, 'pkceVerifier');
      if (record.claimedAt !== null || record.terminalAt !== null) {
        invalidValue('pending timestamps');
      }
      break;
    case 'CLAIMED':
      assertGoogleOAuthProtocolSecret(record.pkceVerifier, 'pkceVerifier');
      if (record.claimedAt === null || record.terminalAt !== null) {
        invalidValue('claimed timestamps');
      }
      break;
    case 'COMPLETED':
    case 'FAILED':
      if (
        record.pkceVerifier !== null ||
        record.claimedAt === null ||
        record.terminalAt === null
      ) {
        invalidValue('terminal state');
      }
      break;
    case 'EXPIRED':
      if (
        record.pkceVerifier !== null ||
        record.claimedAt !== null ||
        record.terminalAt === null
      ) {
        invalidValue('expired state');
      }
      break;
  }
}

export function assertGoogleOAuthTransactionPolicy(
  value: unknown
): asserts value is GoogleOAuthTransactionPolicy {
  assertObject(value, 'policy');
  const policy = value as GoogleOAuthTransactionPolicy;
  if (
    !Number.isSafeInteger(policy.ttlSeconds) ||
    policy.ttlSeconds < 1 ||
    policy.ttlSeconds > GOOGLE_OAUTH_TRANSACTION_MAX_TTL_SECONDS
  ) {
    invalidValue('ttlSeconds');
  }
}

export function assertGoogleOAuthTransactionClaimInput(
  value: unknown
): asserts value is {
  readonly stateHash: string;
  readonly browserBindingHash: string;
  readonly now: string;
} {
  assertObject(value, 'claim input');
  assertExactKeys(
    value,
    GOOGLE_OAUTH_TRANSACTION_CLAIM_INPUT_KEYS,
    'claim input fields'
  );
  const input = value as {
    readonly stateHash: string;
    readonly browserBindingHash: string;
    readonly now: string;
  };
  assertGoogleOAuthSha256Hash(input.stateHash, 'stateHash');
  assertGoogleOAuthSha256Hash(
    input.browserBindingHash,
    'browserBindingHash'
  );
  assertGoogleOAuthTimestamp(input.now, 'now');
}

export function assertGoogleOAuthTransactionTerminalizeInput(
  value: unknown
): asserts value is TerminalizeGoogleOAuthTransactionInput {
  assertObject(value, 'terminalize input');
  assertExactKeys(
    value,
    GOOGLE_OAUTH_TRANSACTION_TERMINALIZE_INPUT_KEYS,
    'terminalize input fields'
  );
  const input = value as TerminalizeGoogleOAuthTransactionInput;
  assertGoogleOAuthOpaqueValue(input.transactionId, 'transactionId');
  if (input.status !== 'COMPLETED' && input.status !== 'FAILED') {
    invalidValue('status');
  }
  assertGoogleOAuthTimestamp(input.terminalAt, 'terminalAt');
}

const GOOGLE_OAUTH_TRANSACTION_CLAIM_KEYS = [
  'transactionId',
  'pkceVerifier',
  'nonceHash',
  'postAuthRedirect'
] as const;

export function assertGoogleOAuthTransactionClaim(
  value: unknown
): asserts value is GoogleOAuthTransactionClaim {
  assertObject(value, 'claim');
  assertExactKeys(value, GOOGLE_OAUTH_TRANSACTION_CLAIM_KEYS, 'claim fields');

  const claim = value as GoogleOAuthTransactionClaim;
  assertGoogleOAuthOpaqueValue(claim.transactionId, 'transactionId');
  assertGoogleOAuthProtocolSecret(claim.pkceVerifier, 'pkceVerifier');
  assertGoogleOAuthSha256Hash(claim.nonceHash, 'nonceHash');
  if (claim.postAuthRedirect !== GOOGLE_OAUTH_POST_AUTH_REDIRECT) {
    invalidValue('postAuthRedirect');
  }
}

export function deriveS256PkceCodeChallenge(verifier: string): string {
  assertGoogleOAuthProtocolSecret(verifier, 'pkceVerifier');
  return createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

/** Compares a transient protocol secret to a stored fixed-size digest safely. */
export function verifyGoogleOAuthSecretHash(
  presentedSecret: string,
  expectedHash: string,
  tokenHasher: TokenHasher = new Sha256TokenHasher()
): boolean {
  assertGoogleOAuthProtocolSecret(presentedSecret, 'presentedSecret');
  assertGoogleOAuthSha256Hash(expectedHash, 'expectedHash');

  const actualHash = tokenHasher.hash(presentedSecret);
  assertGoogleOAuthSha256Hash(actualHash, 'computedHash');

  const actualBytes = Buffer.from(actualHash, 'ascii');
  const expectedBytes = Buffer.from(expectedHash, 'ascii');
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

function deriveExpiresAt(createdAt: string, ttlSeconds: number): string {
  const createdAtMillis = Date.parse(createdAt);
  const expiresAtMillis = createdAtMillis + ttlSeconds * 1000;
  if (!Number.isFinite(expiresAtMillis)) {
    invalidValue('expiresAt');
  }
  return new Date(expiresAtMillis).toISOString();
}

function readNow(input: unknown, field: string): string {
  assertObject(input, field);
  const now = (input as { readonly now?: unknown }).now;
  assertGoogleOAuthTimestamp(now, 'now');
  return now;
}

function assertDistinctProtocolSecrets(secrets: readonly string[]): void {
  if (new Set(secrets).size !== secrets.length) {
    throw new Error('Google OAuth protocol secrets must be independently generated.');
  }
}

export class GoogleOAuthTransactionService {
  private readonly secureTokenGenerator: SecureTokenGenerator;
  private readonly tokenHasher: TokenHasher;

  public constructor(
    private readonly dependencies: GoogleOAuthTransactionServiceDependencies
  ) {
    assertGoogleOAuthTransactionPolicy(dependencies.policy);
    this.secureTokenGenerator =
      dependencies.secureTokenGenerator ?? new NodeSecureTokenGenerator();
    this.tokenHasher = dependencies.tokenHasher ?? new Sha256TokenHasher();
  }

  public async create(
    input: CreateGoogleOAuthTransactionInput
  ): Promise<GoogleOAuthTransactionStartMaterial> {
    const createdAt = readNow(input, 'create input');
    const transactionId = this.dependencies.idGenerator.generate();
    assertGoogleOAuthOpaqueValue(transactionId, 'transactionId');

    const state = this.secureTokenGenerator.generate();
    const nonce = this.secureTokenGenerator.generate();
    const browserBinding = this.secureTokenGenerator.generate();
    const pkceVerifier = this.secureTokenGenerator.generate();
    for (const [secret, field] of [
      [state, 'state'],
      [nonce, 'nonce'],
      [browserBinding, 'browserBinding'],
      [pkceVerifier, 'pkceVerifier']
    ] as const) {
      assertGoogleOAuthProtocolSecret(secret, field);
    }
    assertDistinctProtocolSecrets([
      state,
      nonce,
      browserBinding,
      pkceVerifier
    ]);

    const record: GoogleOAuthTransactionRecord = {
      transactionId,
      flowKind: GOOGLE_OAUTH_FLOW_KIND,
      stateHash: this.hashProtocolSecret(state, 'stateHash'),
      pkceVerifier,
      nonceHash: this.hashProtocolSecret(nonce, 'nonceHash'),
      browserBindingHash: this.hashProtocolSecret(
        browserBinding,
        'browserBindingHash'
      ),
      createdAt,
      expiresAt: deriveExpiresAt(
        createdAt,
        this.dependencies.policy.ttlSeconds
      ),
      postAuthRedirect: GOOGLE_OAUTH_POST_AUTH_REDIRECT,
      status: 'PENDING',
      claimedAt: null,
      terminalAt: null
    };

    assertGoogleOAuthTransactionRecord(record);
    await this.dependencies.repository.create(record);

    return {
      transactionId,
      state,
      codeChallenge: deriveS256PkceCodeChallenge(pkceVerifier),
      nonce,
      browserBinding,
      expiresAt: record.expiresAt,
      postAuthRedirect: GOOGLE_OAUTH_POST_AUTH_REDIRECT
    };
  }

  public async claim(
    input: ClaimGoogleOAuthTransactionInput
  ): Promise<GoogleOAuthTransactionClaim | null> {
    const claimInput = input as ClaimGoogleOAuthTransactionInput;
    const now = readNow(input, 'claim input');
    assertGoogleOAuthProtocolSecret(claimInput.state, 'state');
    assertGoogleOAuthProtocolSecret(
      claimInput.browserBinding,
      'browserBinding'
    );

    const claim = await this.dependencies.repository.claimPending({
      stateHash: this.hashProtocolSecret(claimInput.state, 'stateHash'),
      browserBindingHash: this.hashProtocolSecret(
        claimInput.browserBinding,
        'browserBindingHash'
      ),
      now
    });

    if (claim !== null) {
      assertGoogleOAuthTransactionClaim(claim);
    }
    return claim;
  }

  public async terminalize(
    input: TerminalizeGoogleOAuthTransactionInput
  ): Promise<boolean> {
    assertGoogleOAuthTransactionTerminalizeInput(input);
    return this.dependencies.repository.terminalize(input);
  }

  private hashProtocolSecret(secret: string, field: string): string {
    const hash = this.tokenHasher.hash(secret);
    assertGoogleOAuthSha256Hash(hash, field);
    return hash;
  }
}
