import type { UserAccount } from '@natalnode/contracts';
import type { SqlExecutor } from '../../db/index.js';
import type { UserRepository } from '../user-repository.js';

interface UserRow {
  user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

const INSERT_USER_SQL = `
  INSERT INTO users (user_id, created_at, updated_at)
  VALUES ($1, $2, $3)
`;

const FIND_USER_BY_ID_SQL = `
  SELECT user_id, created_at, updated_at
  FROM users
  WHERE user_id = $1
`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapUserRow(row: UserRow): UserAccount {
  return {
    userId: row.user_id,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  };
}

export class PostgresUserRepository implements UserRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(user: UserAccount): Promise<void> {
    await this.executor.query<never>(INSERT_USER_SQL, [
      user.userId,
      user.createdAt,
      user.updatedAt
    ]);
  }

  public async findById(userId: string): Promise<UserAccount | null> {
    const result = await this.executor.query<UserRow>(FIND_USER_BY_ID_SQL, [userId]);
    const row = result.rows[0];

    return row ? mapUserRow(row) : null;
  }
}
