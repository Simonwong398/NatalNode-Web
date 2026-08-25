import type { AuthIdentity, AuthProvider } from '@natalnode/contracts';
import type { SqlExecutor } from '../../db/index.js';
import type { AuthIdentityRepository } from '../auth-identity-repository.js';

interface AuthIdentityRow {
  identity_id: string;
  user_id: string;
  provider: AuthProvider;
  provider_subject: string;
  created_at: Date | string;
  updated_at: Date | string;
}

const INSERT_AUTH_IDENTITY_SQL = `
  INSERT INTO auth_identities (
    identity_id,
    user_id,
    provider,
    provider_subject,
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6)
`;

const FIND_AUTH_IDENTITY_SQL = `
  SELECT
    identity_id,
    user_id,
    provider,
    provider_subject,
    created_at,
    updated_at
  FROM auth_identities
  WHERE provider = $1
    AND provider_subject = $2
`;

const LIST_AUTH_IDENTITIES_SQL = `
  SELECT
    identity_id,
    user_id,
    provider,
    provider_subject,
    created_at,
    updated_at
  FROM auth_identities
  WHERE user_id = $1
  ORDER BY created_at ASC, identity_id ASC
`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAuthIdentityRow(row: AuthIdentityRow): AuthIdentity {
  return {
    identityId: row.identity_id,
    userId: row.user_id,
    provider: row.provider,
    providerSubject: row.provider_subject,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  };
}

export class PostgresAuthIdentityRepository implements AuthIdentityRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(identity: AuthIdentity): Promise<void> {
    await this.executor.query<never>(INSERT_AUTH_IDENTITY_SQL, [
      identity.identityId,
      identity.userId,
      identity.provider,
      identity.providerSubject,
      identity.createdAt,
      identity.updatedAt
    ]);
  }

  public async findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string
  ): Promise<AuthIdentity | null> {
    const result = await this.executor.query<AuthIdentityRow>(FIND_AUTH_IDENTITY_SQL, [
      provider,
      providerSubject
    ]);
    const row = result.rows[0];

    return row ? mapAuthIdentityRow(row) : null;
  }

  public async listForUser(userId: string): Promise<readonly AuthIdentity[]> {
    const result = await this.executor.query<AuthIdentityRow>(LIST_AUTH_IDENTITIES_SQL, [userId]);

    return result.rows.map(mapAuthIdentityRow);
  }
}
