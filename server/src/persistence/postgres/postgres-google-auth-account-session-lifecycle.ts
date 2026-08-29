import type { Pool, PoolClient } from 'pg';
import type { AuthIdentity, UserAccount } from '@natalnode/contracts';
import type { AuthSessionRecord } from '../../auth-runtime/types.js';
import {
  PostgresAuthIdentityRepository
} from './postgres-auth-identity-repository.js';
import { PostgresAuthSessionRepository } from './postgres-auth-session-repository.js';
import { PostgresClientSqlExecutor } from './postgres-client-sql-executor.js';
import { PostgresGoogleOAuthTransactionRepository } from './postgres-google-oauth-transaction-repository.js';
import { PostgresUserRepository } from './postgres-user-repository.js';
import { acquireAuthLifecycleLocks } from './auth-lifecycle-lock.js';
import type {
  GoogleAuthAccountSessionInput,
  GoogleAuthAccountSessionLifecycle,
  GoogleAuthAccountSessionResult
} from '../google-auth-account-session-lifecycle.js';

interface GoogleIdentityRow {
  readonly user_id: string;
}

interface EmailIdentityRow {
  readonly user_id: string;
}

const FIND_GOOGLE_IDENTITY_FOR_UPDATE_SQL = `
  SELECT user_id
  FROM auth_identities
  WHERE provider = 'GOOGLE'
    AND provider_subject = $1
  FOR UPDATE
`;

const FIND_EMAIL_IDENTITY_FOR_UPDATE_SQL = `
  SELECT user_id
  FROM auth_identities
  WHERE provider = 'EMAIL_MAGIC_LINK'
    AND provider_subject = $1
  FOR UPDATE
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
      'Google authentication transaction and rollback both failed.'
    );
  }

  throw transactionError;
}

function requireUserId(row: GoogleIdentityRow | undefined): string {
  if (row === undefined || row.user_id.length === 0) {
    throw new Error('Google authentication identity row is invalid.');
  }

  return row.user_id;
}

function createUser(input: GoogleAuthAccountSessionInput): UserAccount {
  return {
    userId: input.proposedUserId,
    createdAt: input.session.createdAt,
    updatedAt: input.session.createdAt
  };
}

function createIdentity(input: GoogleAuthAccountSessionInput): AuthIdentity {
  return {
    identityId: input.proposedIdentityId,
    userId: input.proposedUserId,
    provider: 'GOOGLE',
    providerSubject: input.providerSubject,
    createdAt: input.session.createdAt,
    updatedAt: input.session.createdAt
  };
}

function sessionForUser(
  session: GoogleAuthAccountSessionInput['session'],
  userId: string
): AuthSessionRecord {
  return {
    ...session,
    userId
  };
}

/**
 * PostgreSQL-owned Google account resolution and first-party session
 * transaction. The email lifecycle advisory lock is deliberately acquired
 * only for a new Google subject; an existing Google subject remains
 * authoritative even if its current verified email matches another identity.
 */
export class PostgresGoogleAuthAccountSessionLifecycle
  implements GoogleAuthAccountSessionLifecycle
{
  public constructor(private readonly pool: Pool) {}

  public async resolveAndCreateSession(
    input: GoogleAuthAccountSessionInput
  ): Promise<GoogleAuthAccountSessionResult> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;

      const executor = new PostgresClientSqlExecutor(client);
      const transactionRepository =
        new PostgresGoogleOAuthTransactionRepository(executor);
      const sessions = new PostgresAuthSessionRepository(executor);
      const existingGoogleIdentity = await this.findGoogleIdentity(
        executor,
        input.providerSubject
      );

      if (existingGoogleIdentity !== null) {
        await sessions.create(sessionForUser(input.session, existingGoogleIdentity));
        await this.terminalizeCompleted(
          transactionRepository,
          input.transactionId,
          input.terminalAt
        );
        await client.query('COMMIT');

        return {
          outcome: 'authenticated',
          userId: existingGoogleIdentity
        };
      }

      await acquireAuthLifecycleLocks(executor, [input.emailNormalized]);

      const existingGoogleIdentityAfterLock = await this.findGoogleIdentity(
        executor,
        input.providerSubject
      );

      if (existingGoogleIdentityAfterLock !== null) {
        await sessions.create(
          sessionForUser(input.session, existingGoogleIdentityAfterLock)
        );
        await this.terminalizeCompleted(
          transactionRepository,
          input.transactionId,
          input.terminalAt
        );
        await client.query('COMMIT');

        return {
          outcome: 'authenticated',
          userId: existingGoogleIdentityAfterLock
        };
      }

      const existingEmailIdentity = await this.findEmailIdentity(
        executor,
        input.emailNormalized
      );

      if (existingEmailIdentity) {
        await this.terminalizeFailed(
          transactionRepository,
          input.transactionId,
          input.terminalAt
        );
        await client.query('COMMIT');
        return { outcome: 'email-collision' };
      }

      await new PostgresUserRepository(executor).create(createUser(input));
      await new PostgresAuthIdentityRepository(executor).create(
        createIdentity(input)
      );
      await sessions.create(input.session);
      await this.terminalizeCompleted(
        transactionRepository,
        input.transactionId,
        input.terminalAt
      );
      await client.query('COMMIT');

      return {
        outcome: 'authenticated',
        userId: input.proposedUserId
      };
    } catch (error) {
      if (transactionStarted) {
        return rollbackAfterFailure(client, error);
      }

      throw error;
    } finally {
      client.release();
    }
  }

  private async findGoogleIdentity(
    executor: PostgresClientSqlExecutor,
    providerSubject: string
  ): Promise<string | null> {
    const result = await executor.query<GoogleIdentityRow>(
      FIND_GOOGLE_IDENTITY_FOR_UPDATE_SQL,
      [providerSubject]
    );
    const row = result.rows[0];

    return row === undefined ? null : requireUserId(row);
  }

  private async findEmailIdentity(
    executor: PostgresClientSqlExecutor,
    emailNormalized: string
  ): Promise<string | null> {
    const result = await executor.query<EmailIdentityRow>(
      FIND_EMAIL_IDENTITY_FOR_UPDATE_SQL,
      [emailNormalized]
    );
    const row = result.rows[0];

    return row === undefined ? null : requireUserId(row);
  }

  private async terminalizeCompleted(
    repository: PostgresGoogleOAuthTransactionRepository,
    transactionId: string,
    terminalAt: string
  ): Promise<void> {
    const terminalized = await repository.terminalize({
      transactionId,
      status: 'COMPLETED',
      terminalAt
    });

    if (!terminalized) {
      throw new Error('Google OAuth transaction could not be completed.');
    }
  }

  private async terminalizeFailed(
    repository: PostgresGoogleOAuthTransactionRepository,
    transactionId: string,
    terminalAt: string
  ): Promise<void> {
    const terminalized = await repository.terminalize({
      transactionId,
      status: 'FAILED',
      terminalAt
    });

    if (!terminalized) {
      throw new Error('Google OAuth transaction could not be failed.');
    }
  }
}
