import type {
  GoogleOAuthTransactionRecord
} from '../../auth-runtime/google-oauth-transaction.js';
import {
  assertGoogleOAuthOpaqueValue,
  assertGoogleOAuthProtocolSecret,
  assertGoogleOAuthSha256Hash,
  assertGoogleOAuthTimestamp,
  assertGoogleOAuthTransactionClaim,
  assertGoogleOAuthTransactionClaimInput,
  assertGoogleOAuthTransactionRecord,
  assertGoogleOAuthTransactionTerminalizeInput,
  GOOGLE_OAUTH_FLOW_KIND,
  GOOGLE_OAUTH_POST_AUTH_REDIRECT
} from '../../auth-runtime/google-oauth-transaction.js';
import type { SqlExecutor } from '../../db/index.js';
import type {
  GoogleOAuthTransactionClaim,
  GoogleOAuthTransactionClaimInput,
  GoogleOAuthTransactionRepository,
  GoogleOAuthTransactionTerminalizeInput
} from '../google-oauth-transaction-repository.js';

interface GoogleOAuthTransactionClaimRow {
  readonly transaction_id: string;
  readonly status: string;
  readonly pkce_verifier: string | null;
  readonly nonce_hash: string;
  readonly post_auth_redirect: string;
}

const INSERT_GOOGLE_OAUTH_TRANSACTION_SQL = `
  INSERT INTO google_oauth_transactions (
    transaction_id,
    flow_kind,
    state_hash,
    pkce_verifier,
    nonce_hash,
    browser_binding_hash,
    created_at,
    expires_at,
    post_auth_redirect,
    status,
    claimed_at,
    terminal_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
`;

/**
 * The CASE expression makes claim and expiry one atomic database operation:
 * an active PENDING row becomes CLAIMED, while a matching expired row becomes
 * EXPIRED and loses its recoverable verifier. Mismatched or terminal rows are
 * not touched.
 */
const CLAIM_GOOGLE_OAUTH_TRANSACTION_SQL = `
  UPDATE google_oauth_transactions
  SET
    status = CASE WHEN expires_at > $3 THEN 'CLAIMED' ELSE 'EXPIRED' END,
    claimed_at = CASE WHEN expires_at > $3 THEN $3 ELSE NULL END,
    terminal_at = CASE WHEN expires_at > $3 THEN NULL ELSE $3 END,
    pkce_verifier = CASE WHEN expires_at > $3 THEN pkce_verifier ELSE NULL END
  WHERE state_hash = $1
    AND browser_binding_hash = $2
    AND flow_kind = 'GOOGLE_SIGN_IN'
    AND status = 'PENDING'
  RETURNING transaction_id, status, pkce_verifier, nonce_hash, post_auth_redirect
`;

const TERMINALIZE_GOOGLE_OAUTH_TRANSACTION_SQL = `
  UPDATE google_oauth_transactions
  SET
    status = $2,
    terminal_at = $3,
    pkce_verifier = NULL
  WHERE transaction_id = $1
    AND flow_kind = 'GOOGLE_SIGN_IN'
    AND status = 'CLAIMED'
    AND claimed_at IS NOT NULL
    AND terminal_at IS NULL
  RETURNING transaction_id
`;

function assertExpiredClaimRow(row: GoogleOAuthTransactionClaimRow): void {
  assertGoogleOAuthOpaqueValue(row.transaction_id, 'transactionId');
  if (row.status !== 'EXPIRED' || row.pkce_verifier !== null) {
    throw new Error('Google OAuth transaction expired row is invalid.');
  }
  assertGoogleOAuthSha256Hash(row.nonce_hash, 'nonceHash');
  if (row.post_auth_redirect !== GOOGLE_OAUTH_POST_AUTH_REDIRECT) {
    throw new Error('Google OAuth transaction postAuthRedirect is invalid.');
  }
}

function mapClaimRow(row: GoogleOAuthTransactionClaimRow): GoogleOAuthTransactionClaim {
  assertGoogleOAuthOpaqueValue(row.transaction_id, 'transactionId');
  if (row.status !== 'CLAIMED') {
    throw new Error('Google OAuth transaction claim row is invalid.');
  }
  assertGoogleOAuthProtocolSecret(row.pkce_verifier, 'pkceVerifier');
  assertGoogleOAuthSha256Hash(row.nonce_hash, 'nonceHash');
  if (row.post_auth_redirect !== GOOGLE_OAUTH_POST_AUTH_REDIRECT) {
    throw new Error('Google OAuth transaction postAuthRedirect is invalid.');
  }

  const claim = {
    transactionId: row.transaction_id,
    pkceVerifier: row.pkce_verifier,
    nonceHash: row.nonce_hash,
    postAuthRedirect: GOOGLE_OAUTH_POST_AUTH_REDIRECT
  };
  assertGoogleOAuthTransactionClaim(claim);
  return claim;
}

export class PostgresGoogleOAuthTransactionRepository
  implements GoogleOAuthTransactionRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(record: GoogleOAuthTransactionRecord): Promise<void> {
    assertGoogleOAuthTransactionRecord(record);

    await this.executor.query<never>(INSERT_GOOGLE_OAUTH_TRANSACTION_SQL, [
      record.transactionId,
      record.flowKind,
      record.stateHash,
      record.pkceVerifier,
      record.nonceHash,
      record.browserBindingHash,
      record.createdAt,
      record.expiresAt,
      record.postAuthRedirect,
      record.status,
      record.claimedAt,
      record.terminalAt
    ]);
  }

  public async claimPending(
    input: GoogleOAuthTransactionClaimInput
  ): Promise<GoogleOAuthTransactionClaim | null> {
    assertGoogleOAuthTransactionClaimInput(input);

    const result = await this.executor.query<GoogleOAuthTransactionClaimRow>(
      CLAIM_GOOGLE_OAUTH_TRANSACTION_SQL,
      [input.stateHash, input.browserBindingHash, input.now]
    );
    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }
    if (row.status === 'EXPIRED') {
      assertExpiredClaimRow(row);
      return null;
    }

    return mapClaimRow(row);
  }

  public async terminalize(
    input: GoogleOAuthTransactionTerminalizeInput
  ): Promise<boolean> {
    assertGoogleOAuthTransactionTerminalizeInput(input);
    assertGoogleOAuthTimestamp(input.terminalAt, 'terminalAt');

    const result = await this.executor.query<{ readonly transaction_id: string }>(
      TERMINALIZE_GOOGLE_OAUTH_TRANSACTION_SQL,
      [input.transactionId, input.status, input.terminalAt]
    );
    return result.rows.length > 0;
  }
}
