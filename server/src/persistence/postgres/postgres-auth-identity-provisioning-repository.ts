import type { AuthIdentity, AuthProvider } from '@natalnode/contracts';
import type { SqlExecutor } from '../../db/index.js';
import type {
  AuthIdentityProvisioningInput,
  AuthIdentityProvisioningRepository
} from '../auth-identity-provisioning-repository.js';

interface AuthIdentityRow {
  identity_id: string;
  user_id: string;
  provider: AuthProvider;
  provider_subject: string;
  created_at: Date | string;
  updated_at: Date | string;
}

const RESOLVE_OR_CREATE_AUTH_IDENTITY_SQL = `
  WITH resolved_identity AS (
    INSERT INTO auth_identities (
      identity_id,
      user_id,
      provider,
      provider_subject,
      created_at,
      updated_at
    )
    VALUES ($4, $3, $1, $2, $5, $5)
    ON CONFLICT (provider, provider_subject)
    DO UPDATE SET updated_at = auth_identities.updated_at
    RETURNING
      identity_id,
      user_id,
      provider,
      provider_subject,
      created_at,
      updated_at
  ),
  created_user AS (
    INSERT INTO users (user_id, created_at, updated_at)
    SELECT resolved_identity.user_id, $5, $5
    FROM resolved_identity
    WHERE resolved_identity.user_id = $3
    RETURNING user_id
  )
  SELECT
    resolved_identity.identity_id,
    resolved_identity.user_id,
    resolved_identity.provider,
    resolved_identity.provider_subject,
    resolved_identity.created_at,
    resolved_identity.updated_at
  FROM resolved_identity
  LEFT JOIN created_user
    ON created_user.user_id = resolved_identity.user_id
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

export class PostgresAuthIdentityProvisioningRepository
  implements AuthIdentityProvisioningRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async resolveOrCreate(input: AuthIdentityProvisioningInput): Promise<AuthIdentity> {
    const result = await this.executor.query<AuthIdentityRow>(
      RESOLVE_OR_CREATE_AUTH_IDENTITY_SQL,
      [
        input.provider,
        input.providerSubject,
        input.proposedUserId,
        input.proposedIdentityId,
        input.now
      ]
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error('Auth identity provisioning did not return an identity.');
    }

    return mapAuthIdentityRow(row);
  }
}
