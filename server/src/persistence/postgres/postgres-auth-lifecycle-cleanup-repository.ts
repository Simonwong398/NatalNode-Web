import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  assertAuthLifecycleCleanupBatchSize,
  type AuthLifecycleCleanupBatchInput,
  type AuthLifecycleCleanupRepository,
  type AuthLifecycleCleanupResult
} from '../auth-lifecycle-cleanup-repository.js';

const BEGIN_TRANSACTION_SQL = 'BEGIN';
const COMMIT_TRANSACTION_SQL = 'COMMIT';
const ROLLBACK_TRANSACTION_SQL = 'ROLLBACK';

const CLEANUP_EXPIRED_SESSIONS_SQL = `
  WITH candidates AS (
    SELECT session_token_hash
    FROM auth_sessions
    WHERE expires_at <= $1
    ORDER BY expires_at ASC, session_token_hash ASC
    LIMIT $2
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM auth_sessions AS sessions
  USING candidates
  WHERE sessions.session_token_hash = candidates.session_token_hash
  RETURNING sessions.session_token_hash
`;

const CLEANUP_EXPIRED_UNCONSUMED_CHALLENGES_SQL = `
  WITH candidates AS (
    SELECT challenge_id
    FROM email_magic_link_challenges
    WHERE consumed_at IS NULL
      AND expires_at <= $1
    ORDER BY expires_at ASC, challenge_id ASC
    LIMIT $2
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM email_magic_link_challenges AS challenges
  USING candidates
  WHERE challenges.challenge_id = candidates.challenge_id
  RETURNING challenges.challenge_id
`;

const CLEANUP_CONSUMED_CHALLENGES_SQL = `
  WITH candidates AS (
    SELECT challenge_id
    FROM email_magic_link_challenges
    WHERE consumed_at IS NOT NULL
    ORDER BY consumed_at ASC, challenge_id ASC
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM email_magic_link_challenges AS challenges
  USING candidates
  WHERE challenges.challenge_id = candidates.challenge_id
  RETURNING challenges.challenge_id
`;

interface CleanupRow extends QueryResultRow {
  readonly session_token_hash?: string;
  readonly challenge_id?: string;
}

function combineErrors(
  operationError: unknown,
  cleanupError: unknown,
  message: string
): AggregateError {
  return new AggregateError([operationError, cleanupError], message);
}

async function executeCleanupPhase(
  pool: Pool,
  input: AuthLifecycleCleanupBatchInput,
  cleanupSql: string,
  phaseName: string,
  parameters: (input: AuthLifecycleCleanupBatchInput) => unknown[] =
    (phaseInput) => [phaseInput.now, phaseInput.batchSize]
): Promise<AuthLifecycleCleanupResult> {
  assertAuthLifecycleCleanupBatchSize(input.batchSize);

  const client = await pool.connect();
  let transactionStarted = false;
  let commitAttempted = false;
  let failed = false;
  let operationError: unknown;
  let result: AuthLifecycleCleanupResult | undefined;
  let discardClient = false;

  try {
    await client.query(BEGIN_TRANSACTION_SQL);
    transactionStarted = true;

    const deleted = await client.query<CleanupRow>(
      cleanupSql,
      parameters(input)
    );

    commitAttempted = true;
    await client.query(COMMIT_TRANSACTION_SQL);

    result = {
      moreWork: deleted.rows.length === input.batchSize
    };
  } catch (error) {
    failed = true;
    operationError = error;

    if (commitAttempted) {
      // COMMIT may have succeeded before its acknowledgement failed. The
      // client is not safe to return to the pool, and no retry is attempted.
      discardClient = true;
    } else if (!transactionStarted) {
      discardClient = true;
    } else {
      try {
        await client.query(ROLLBACK_TRANSACTION_SQL);
      } catch (rollbackError) {
        discardClient = true;
        operationError = combineErrors(
          operationError,
          rollbackError,
          `Auth lifecycle cleanup ${phaseName} failed and rollback also failed.`
        );
      }
    }
  }

  try {
    if (discardClient) {
      client.release(true);
    } else {
      client.release();
    }
  } catch (releaseError) {
    failed = true;
    operationError =
      operationError === undefined
        ? releaseError
        : combineErrors(
            operationError,
            releaseError,
            `Auth lifecycle cleanup ${phaseName} and client release both failed.`
          );
  }

  if (failed) {
    throw operationError;
  }

  if (result === undefined) {
    throw new Error(
      `Auth lifecycle cleanup ${phaseName} completed without a result.`
    );
  }

  return result;
}

/** PostgreSQL bounded deletion for already-invalid Auth lifecycle rows. */
export class PostgresAuthLifecycleCleanupRepository
  implements AuthLifecycleCleanupRepository
{
  public constructor(private readonly pool: Pool) {}

  public cleanupExpiredSessions(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult> {
    return executeCleanupPhase(
      this.pool,
      input,
      CLEANUP_EXPIRED_SESSIONS_SQL,
      'expired-sessions'
    );
  }

  public cleanupExpiredUnconsumedChallenges(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult> {
    return executeCleanupPhase(
      this.pool,
      input,
      CLEANUP_EXPIRED_UNCONSUMED_CHALLENGES_SQL,
      'expired-unconsumed-challenges'
    );
  }

  public cleanupConsumedChallenges(
    input: AuthLifecycleCleanupBatchInput
  ): Promise<AuthLifecycleCleanupResult> {
    return executeCleanupPhase(
      this.pool,
      input,
      CLEANUP_CONSUMED_CHALLENGES_SQL,
      'consumed-challenges',
      (phaseInput) => [phaseInput.batchSize]
    );
  }
}
