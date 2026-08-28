import type { Pool, PoolClient } from 'pg';
import type {
  AccountErasureRepository,
  AccountErasureResult
} from '../account-erasure-repository.js';
import { acquireAuthLifecycleLocks } from './auth-lifecycle-lock.js';
import { PostgresClientSqlExecutor } from './postgres-client-sql-executor.js';

interface EmailIdentityRow {
  provider_subject: string;
}

interface UserRow {
  user_id: string;
}

const IDENTITY_SET_RETRY_LIMIT = 3;

const FIND_EMAIL_IDENTITIES_SQL = `
  SELECT provider_subject
  FROM auth_identities
  WHERE user_id = $1
    AND provider = 'EMAIL_MAGIC_LINK'
  ORDER BY provider_subject ASC
`;

const LOCK_USER_ROOT_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR UPDATE
`;

const DELETE_ACCOUNT_EMAIL_CHALLENGES_SQL = `
  DELETE FROM email_magic_link_challenges
  WHERE email_normalized = ANY($1::text[])
`;

const DELETE_USER_ROOT_SQL = `
  DELETE FROM users
  WHERE user_id = $1
  RETURNING user_id
`;

class IdentitySetChangedError extends Error {
  public constructor() {
    super('Account Email Magic Link identity set changed during erasure.');
    this.name = 'IdentitySetChangedError';
  }
}

function identitySubjects(rows: readonly EmailIdentityRow[]): readonly string[] {
  return rows.map((row) => row.provider_subject);
}

function haveSameIdentitySubjects(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

async function rollbackAfterFailure(
  client: PoolClient,
  transactionError: unknown
): Promise<never> {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    throw new AggregateError(
      [transactionError, rollbackError],
      'Account erasure transaction and rollback both failed.'
    );
  }

  throw transactionError;
}

/** Owns the complete PostgreSQL account-erasure transaction. */
export class PostgresAccountErasureRepository
  implements AccountErasureRepository
{
  public constructor(private readonly pool: Pool) {}

  public async eraseAccount(userId: string): Promise<AccountErasureResult> {
    for (let attempt = 1; attempt <= IDENTITY_SET_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.eraseAccountOnce(userId);
      } catch (error) {
        if (
          error instanceof IdentitySetChangedError &&
          attempt < IDENTITY_SET_RETRY_LIMIT
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Account erasure retry limit was exhausted.');
  }

  private async eraseAccountOnce(userId: string): Promise<AccountErasureResult> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const executor = new PostgresClientSqlExecutor(client);
      const candidateIdentities = await executor.query<EmailIdentityRow>(
        FIND_EMAIL_IDENTITIES_SQL,
        [userId]
      );
      const candidateSubjects = await acquireAuthLifecycleLocks(
        executor,
        identitySubjects(candidateIdentities.rows)
      );

      const lockedUser = await executor.query<UserRow>(LOCK_USER_ROOT_SQL, [userId]);

      if (lockedUser.rows.length === 0) {
        await client.query('COMMIT');
        return { outcome: 'account-not-found' };
      }

      const authoritativeIdentities = await executor.query<EmailIdentityRow>(
        FIND_EMAIL_IDENTITIES_SQL,
        [userId]
      );
      const authoritativeSubjects = identitySubjects(authoritativeIdentities.rows);

      if (!haveSameIdentitySubjects(candidateSubjects, authoritativeSubjects)) {
        throw new IdentitySetChangedError();
      }

      if (authoritativeSubjects.length > 0) {
        await executor.query<never>(DELETE_ACCOUNT_EMAIL_CHALLENGES_SQL, [
          authoritativeSubjects
        ]);
      }

      const deletedUser = await executor.query<UserRow>(DELETE_USER_ROOT_SQL, [userId]);

      if (deletedUser.rows.length !== 1) {
        throw new Error('Account erasure did not delete exactly one user root.');
      }

      await client.query('COMMIT');
      return { outcome: 'deleted' };
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
