import { randomBytes, randomUUID } from 'node:crypto';
import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier
} from '../commercial-domain.js';
import {
  ReferralPublicIdentityConflictError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  EnsureReferralPublicIdentityInput,
  EnsureReferralPublicIdentityResult,
  ReferralPublicIdentityRecord,
  ReferralPublicIdentityRepository
} from '../repositories.js';
import {
  assertLiveOwnerAndAuthority
} from './postgres-paid-persistence-shared.js';
import {
  REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL,
  type ReferralPublicIdentityRow,
  mapReferralPublicIdentityRow
} from './postgres-referral-persistence-shared.js';

const FIND_ACTIVE_BY_AUTHORITY_SQL = `
  SELECT ${REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL}
  FROM referral_public_identities AS rpi
  WHERE rpi.commercial_authority_id = $1
    AND rpi.status = 'ACTIVE'
  ORDER BY rpi.referral_public_identity_id ASC
  LIMIT 1
`;

const FIND_BY_ID_SQL = `
  SELECT ${REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL}
  FROM referral_public_identities AS rpi
  WHERE rpi.referral_public_identity_id = $1
`;

const FIND_ACTIVE_BY_PUBLIC_VALUE_SQL = `
  SELECT ${REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL}
  FROM referral_public_identities AS rpi
  WHERE rpi.public_value = $1
    AND rpi.status = 'ACTIVE'
`;

const LOCK_ACTIVE_BY_AUTHORITY_SQL = `
  SELECT ${REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL}
  FROM referral_public_identities AS rpi
  WHERE rpi.commercial_authority_id = $1
    AND rpi.status = 'ACTIVE'
  ORDER BY rpi.referral_public_identity_id ASC
  LIMIT 1
  FOR UPDATE
`;

const INSERT_IDENTITY_SQL = `
  INSERT INTO referral_public_identities (
    referral_public_identity_id,
    commercial_authority_id,
    public_value,
    status,
    created_at
  )
  VALUES ($1, $2, $3, 'ACTIVE', CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING
  RETURNING ${REFERRAL_PUBLIC_IDENTITY_COLUMNS_SQL}
`;

const IDENTITY_GENERATION_ATTEMPTS = 4;

function generatedPublicValue(): string {
  return `nnr_${randomBytes(32).toString('base64url')}`;
}

function generatedIdentityId(): string {
  return randomUUID();
}

function normalizeInput(input: EnsureReferralPublicIdentityInput): {
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
} {
  return {
    ownerId: assertCommercialIdentifier(input.ownerId, 'ownerId'),
    commercialAuthorityId: assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    )
  };
}

/**
 * Stable V1 referral identity repository. The random value is a locator only;
 * it is never used as an authentication or entitlement credential.
 */
export class PostgresReferralPublicIdentityRepository
  implements ReferralPublicIdentityRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async getById(
    referralPublicIdentityIdInput: string
  ): Promise<ReferralPublicIdentityRecord | null> {
    const referralPublicIdentityId = assertCommercialIdentifier(
      referralPublicIdentityIdInput,
      'referralPublicIdentityId'
    );
    try {
      const result = await this.executor.query<ReferralPublicIdentityRow>(
        FIND_BY_ID_SQL,
        [referralPublicIdentityId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralPublicIdentityRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByAuthority(
    commercialAuthorityIdInput: string
  ): Promise<ReferralPublicIdentityRecord | null> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    try {
      const result = await this.executor.query<ReferralPublicIdentityRow>(
        FIND_ACTIVE_BY_AUTHORITY_SQL,
        [commercialAuthorityId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralPublicIdentityRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByPublicValue(
    publicValueInput: string
  ): Promise<ReferralPublicIdentityRecord | null> {
    const publicValue = assertCommercialIdentifier(publicValueInput, 'publicValue');
    try {
      const result = await this.executor.query<ReferralPublicIdentityRow>(
        FIND_ACTIVE_BY_PUBLIC_VALUE_SQL,
        [publicValue]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralPublicIdentityRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async ensure(
    input: EnsureReferralPublicIdentityInput
  ): Promise<EnsureReferralPublicIdentityResult> {
    const normalized = normalizeInput(input);
    await assertLiveOwnerAndAuthority(
      this.executor,
      normalized.ownerId,
      normalized.commercialAuthorityId
    );

    try {
      const existing = await this.lockActiveByAuthority(
        normalized.commercialAuthorityId
      );
      if (existing !== null) {
        return { outcome: 'EXISTING', identity: existing };
      }

      for (let attempt = 0; attempt < IDENTITY_GENERATION_ATTEMPTS; attempt += 1) {
        const inserted = await this.executor.query<ReferralPublicIdentityRow>(
          INSERT_IDENTITY_SQL,
          [
            generatedIdentityId(),
            normalized.commercialAuthorityId,
            generatedPublicValue()
          ]
        );
        const row = inserted.rows[0];
        if (row !== undefined) {
          return { outcome: 'CREATED', identity: mapReferralPublicIdentityRow(row) };
        }

        const concurrent = await this.lockActiveByAuthority(
          normalized.commercialAuthorityId
        );
        if (concurrent !== null) {
          return { outcome: 'EXISTING', identity: concurrent };
        }
      }
      throw new ReferralPublicIdentityConflictError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        const concurrent = await this.getByAuthority(
          normalized.commercialAuthorityId
        );
        if (concurrent !== null) {
          return { outcome: 'EXISTING', identity: concurrent };
        }
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  private async lockActiveByAuthority(
    commercialAuthorityId: string
  ): Promise<ReferralPublicIdentityRecord | null> {
    const result = await this.executor.query<ReferralPublicIdentityRow>(
      LOCK_ACTIVE_BY_AUTHORITY_SQL,
      [commercialAuthorityId]
    );
    const row = result.rows[0];
    return row === undefined ? null : mapReferralPublicIdentityRow(row);
  }
}
