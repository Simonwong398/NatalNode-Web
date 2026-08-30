import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialOwnerNotFoundError,
  CommercialRevisionConflictError,
  mapCommercialPersistenceFailure
} from '../commercial-persistence-errors.js';
import type {
  AdvanceCommercialRevisionInput,
  CommercialAuthorityRecord,
  CommercialAuthorityRepository,
  EnsureCommercialAuthorityInput,
  EnsureCommercialAuthorityResult
} from '../repositories.js';

interface CommercialAuthorityRow {
  commercial_authority_id: string;
  owner_id: string;
  entitlement_revision: string | number | bigint;
  created_at: Date | string;
  updated_at: Date | string;
}

interface OwnerRow {
  user_id: string;
}

const LOCK_LIVE_OWNER_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR KEY SHARE
`;

const INSERT_AUTHORITY_SQL = `
  INSERT INTO commercial_authorities (
    commercial_authority_id,
    owner_id,
    entitlement_revision,
    created_at,
    updated_at
  )
  VALUES ($1, $2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING
  RETURNING commercial_authority_id
`;

const LOCK_AUTHORITY_BY_OWNER_SQL = `
  SELECT
    commercial_authority_id,
    owner_id,
    entitlement_revision,
    created_at,
    updated_at
  FROM commercial_authorities
  WHERE owner_id = $1
  FOR UPDATE
`;

const FIND_AUTHORITY_BY_OWNER_SQL = `
  SELECT
    commercial_authority_id,
    owner_id,
    entitlement_revision,
    created_at,
    updated_at
  FROM commercial_authorities
  WHERE owner_id = $1
`;

const ADVANCE_REVISION_SQL = `
  UPDATE commercial_authorities
  SET
    entitlement_revision = entitlement_revision + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE commercial_authority_id = $1
    AND owner_id = $2
    AND entitlement_revision = $3::bigint
    AND entitlement_revision < 9223372036854775807
  RETURNING
    commercial_authority_id,
    owner_id,
    entitlement_revision,
    created_at,
    updated_at
`;

function mapAuthorityRow(row: CommercialAuthorityRow): CommercialAuthorityRecord {
  return Object.freeze({
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    ownerId: assertCommercialIdentifier(row.owner_id, 'ownerId'),
    entitlementRevision: assertCommercialRevision(row.entitlement_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

/**
 * Uses one caller-owned executor. Locking methods must run inside the caller's
 * transaction so the live-owner lock remains held through reconciliation.
 */
export class PostgresCommercialAuthorityRepository
  implements CommercialAuthorityRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async ensureAndLockForUpdate(
    input: EnsureCommercialAuthorityInput
  ): Promise<EnsureCommercialAuthorityResult> {
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');

    try {
      await this.lockLiveOwner(ownerId);
      const inserted = await this.executor.query<{ commercial_authority_id: string }>(
        INSERT_AUTHORITY_SQL,
        [commercialAuthorityId, ownerId]
      );
      const authority = await this.findLockedAuthority(ownerId);
      if (authority === null) {
        throw new CommercialAuthorityUnavailableError();
      }

      return {
        outcome: inserted.rows.length === 1 ? 'CREATED' : 'EXISTING',
        authority
      };
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockForUpdate(ownerIdInput: string): Promise<CommercialAuthorityRecord> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');

    try {
      await this.lockLiveOwner(ownerId);
      const authority = await this.findLockedAuthority(ownerId);
      if (authority === null) {
        throw new CommercialAuthorityUnavailableError();
      }
      return authority;
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByOwnerId(
    ownerIdInput: string
  ): Promise<CommercialAuthorityRecord | null> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');

    try {
      const result = await this.executor.query<CommercialAuthorityRow>(
        FIND_AUTHORITY_BY_OWNER_SQL,
        [ownerId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapAuthorityRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async advanceRevisionAfterLock(
    input: AdvanceCommercialRevisionInput
  ): Promise<CommercialAuthorityRecord> {
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const expectedRevision = assertCommercialRevision(input.expectedRevision);

    try {
      const result = await this.executor.query<CommercialAuthorityRow>(
        ADVANCE_REVISION_SQL,
        [commercialAuthorityId, ownerId, expectedRevision]
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new CommercialRevisionConflictError();
      }
      return mapAuthorityRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  private async lockLiveOwner(ownerId: string): Promise<void> {
    const result = await this.executor.query<OwnerRow>(LOCK_LIVE_OWNER_SQL, [ownerId]);
    if (result.rows.length !== 1) {
      throw new CommercialOwnerNotFoundError();
    }
  }

  private async findLockedAuthority(
    ownerId: string
  ): Promise<CommercialAuthorityRecord | null> {
    const result = await this.executor.query<CommercialAuthorityRow>(
      LOCK_AUTHORITY_BY_OWNER_SQL,
      [ownerId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapAuthorityRow(row);
  }
}
