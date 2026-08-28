import type { Pool, PoolClient } from 'pg';
import type {
  ConsumeEmailMagicLinkChallengeInput,
  ConsumedEmailMagicLinkTransactionContext,
  EmailMagicLinkAuthLifecycle
} from '../email-magic-link-auth-lifecycle.js';
import type { EmailMagicLinkChallengeRecord } from '../../auth-runtime/types.js';
import { PostgresAuthIdentityProvisioningRepository } from './postgres-auth-identity-provisioning-repository.js';
import { PostgresAuthSessionRepository } from './postgres-auth-session-repository.js';
import { PostgresClientSqlExecutor } from './postgres-client-sql-executor.js';
import { PostgresEmailMagicLinkChallengeRepository } from './postgres-email-magic-link-challenge-repository.js';
import { acquireAuthLifecycleLocks } from './auth-lifecycle-lock.js';

interface CandidateChallengeRow {
  email_normalized: string;
}

const FIND_CANDIDATE_CHALLENGE_SQL = `
  SELECT email_normalized
  FROM email_magic_link_challenges
  WHERE token_hash = $1
    AND consumed_at IS NULL
    AND expires_at > $2
`;

async function rollbackAfterFailure(
  client: PoolClient,
  transactionError: unknown
): Promise<never> {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    throw new AggregateError(
      [transactionError, rollbackError],
      'Email Magic Link transaction and rollback both failed.'
    );
  }

  throw transactionError;
}

/** PostgreSQL-owned serialization for the complete Email Magic Link lifecycle. */
export class PostgresEmailMagicLinkAuthLifecycle
  implements EmailMagicLinkAuthLifecycle
{
  public constructor(private readonly pool: Pool) {}

  public async createChallenge(
    record: EmailMagicLinkChallengeRecord
  ): Promise<void> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const executor = new PostgresClientSqlExecutor(client);
      await acquireAuthLifecycleLocks(executor, [record.emailNormalized]);

      const challenges = new PostgresEmailMagicLinkChallengeRepository(executor);
      await challenges.create(record);
      await client.query('COMMIT');
    } catch (error) {
      if (transactionStarted) {
        return rollbackAfterFailure(client, error);
      }

      throw error;
    } finally {
      client.release();
    }
  }

  public async withConsumedChallenge<Result>(
    input: ConsumeEmailMagicLinkChallengeInput,
    complete: (
      context: ConsumedEmailMagicLinkTransactionContext
    ) => Promise<Result>
  ): Promise<Result | null> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const executor = new PostgresClientSqlExecutor(client);
      const candidate = await executor.query<CandidateChallengeRow>(
        FIND_CANDIDATE_CHALLENGE_SQL,
        [input.tokenHash, input.now]
      );
      const emailNormalized = candidate.rows[0]?.email_normalized;

      if (emailNormalized === undefined) {
        await client.query('COMMIT');
        return null;
      }

      await acquireAuthLifecycleLocks(executor, [emailNormalized]);

      const challenges = new PostgresEmailMagicLinkChallengeRepository(executor);
      const challenge = await challenges.consumeValidByTokenHash(
        input.tokenHash,
        input.now,
        input.consumedAt
      );

      if (challenge === null) {
        await client.query('COMMIT');
        return null;
      }

      const result = await complete({
        challenge,
        authIdentityProvisioning:
          new PostgresAuthIdentityProvisioningRepository(executor),
        authSessions: new PostgresAuthSessionRepository(executor)
      });

      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (transactionStarted) {
        return rollbackAfterFailure(client, error);
      }

      throw error;
    } finally {
      client.release();
    }
  }
}
