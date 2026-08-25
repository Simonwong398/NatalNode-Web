import type { AuthSessionRecord } from '../../auth-runtime/types.js';
import type { SqlExecutor } from '../../db/index.js';
import type { AuthSessionRepository } from '../auth-session-repository.js';

interface AuthSessionRow {
  session_token_hash: string;
  user_id: string;
  created_at: Date | string;
  expires_at: Date | string;
}

const INSERT_AUTH_SESSION_SQL = `
  INSERT INTO auth_sessions (
    session_token_hash,
    user_id,
    created_at,
    expires_at
  )
  VALUES ($1, $2, $3, $4)
`;

const FIND_ACTIVE_AUTH_SESSION_SQL = `
  SELECT
    session_token_hash,
    user_id,
    created_at,
    expires_at
  FROM auth_sessions
  WHERE session_token_hash = $1
    AND expires_at > $2
`;

const DELETE_AUTH_SESSION_SQL = `
  DELETE FROM auth_sessions
  WHERE session_token_hash = $1
  RETURNING session_token_hash
`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAuthSessionRow(row: AuthSessionRow): AuthSessionRecord {
  return {
    sessionTokenHash: row.session_token_hash,
    userId: row.user_id,
    createdAt: toTimestampString(row.created_at),
    expiresAt: toTimestampString(row.expires_at)
  };
}

export class PostgresAuthSessionRepository implements AuthSessionRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(record: AuthSessionRecord): Promise<void> {
    await this.executor.query<never>(INSERT_AUTH_SESSION_SQL, [
      record.sessionTokenHash,
      record.userId,
      record.createdAt,
      record.expiresAt
    ]);
  }

  public async findActiveByTokenHash(
    sessionTokenHash: string,
    now: string
  ): Promise<AuthSessionRecord | null> {
    const result = await this.executor.query<AuthSessionRow>(FIND_ACTIVE_AUTH_SESSION_SQL, [
      sessionTokenHash,
      now
    ]);
    const row = result.rows[0];

    return row ? mapAuthSessionRow(row) : null;
  }

  public async deleteByTokenHash(sessionTokenHash: string): Promise<boolean> {
    const result = await this.executor.query<{ session_token_hash: string }>(
      DELETE_AUTH_SESSION_SQL,
      [sessionTokenHash]
    );

    return result.rows.length > 0;
  }
}
