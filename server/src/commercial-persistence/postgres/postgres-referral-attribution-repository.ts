import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  ReferralAttributionConflictError,
  ReferralAttributionNotFoundError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  AttachReferralQualifyingPurchaseInput,
  EstablishReferralAttributionInput,
  ReferralAttributionRecord,
  ReferralAttributionRepository
} from '../repositories.js';
import {
  assertLiveOwnerAndAuthority
} from './postgres-paid-persistence-shared.js';
import {
  REFERRAL_ATTRIBUTION_COLUMNS_SQL,
  type ReferralAttributionRow,
  mapReferralAttributionRow,
  normalizeReferralCampaignReference
} from './postgres-referral-persistence-shared.js';

const FIND_BY_ID_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.referral_attribution_id = $1
`;

const FIND_BY_REFERRED_AUTHORITY_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.referred_authority_id = $1
`;

const FIND_BY_COVERAGE_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.qualifying_paid_coverage_id = $1
`;

const LOCK_BY_ID_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.referral_attribution_id = $1
  FOR UPDATE
`;

const LOCK_BY_REFERRED_AUTHORITY_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.referred_authority_id = $1
  FOR UPDATE
`;

const LOCK_BY_IDS_SQL = `
  SELECT ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
  FROM referral_attributions AS ra
  WHERE ra.referral_attribution_id = ANY($1::text[])
  ORDER BY ra.referral_attribution_id ASC
  FOR UPDATE
`;

const INSERT_ATTRIBUTION_SQL = `
  INSERT INTO referral_attributions (
    referral_attribution_id,
    referral_public_identity_id,
    referrer_authority_id,
    referred_authority_id,
    state,
    attributed_at,
    campaign_reference,
    last_event_id,
    source_revision
  )
  VALUES ($1, $2, $3, $4, 'ATTRIBUTED', $5::timestamptz, $6, $7, $8::bigint)
  RETURNING ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
`;

const ATTACH_QUALIFYING_PURCHASE_SQL = `
  UPDATE referral_attributions AS ra
  SET
    state = 'LOCKED',
    locked_at = $4::timestamptz,
    qualifying_paid_coverage_id = $3,
    last_event_id = $5,
    source_revision = $6::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE ra.referral_attribution_id = $1
    AND ra.referred_authority_id = $2
    AND ra.state = 'ATTRIBUTED'
    AND ra.qualifying_paid_coverage_id IS NULL
  RETURNING ${REFERRAL_ATTRIBUTION_COLUMNS_SQL}
`;

function normalizedEstablishInput(input: EstablishReferralAttributionInput) {
  return {
    referrerOwnerId: assertCommercialIdentifier(input.referrerOwnerId, 'referrerOwnerId'),
    referredOwnerId: assertCommercialIdentifier(input.referredOwnerId, 'referredOwnerId'),
    referralAttributionId: assertCommercialIdentifier(
      input.referralAttributionId,
      'referralAttributionId'
    ),
    referralPublicIdentityId: assertCommercialIdentifier(
      input.referralPublicIdentityId,
      'referralPublicIdentityId'
    ),
    referrerAuthorityId: assertCommercialIdentifier(
      input.referrerAuthorityId,
      'referrerAuthorityId'
    ),
    referredAuthorityId: assertCommercialIdentifier(
      input.referredAuthorityId,
      'referredAuthorityId'
    ),
    attributedAt: assertCommercialTimestamp(input.attributedAt, 'attributedAt'),
    campaignReference: normalizeReferralCampaignReference(input.campaignReference),
    lastEventId: assertCommercialIdentifier(input.lastEventId, 'lastEventId'),
    sourceRevision: assertCommercialRevision(input.sourceRevision)
  };
}

/** Persistence surface for the account-level first-valid-attribution rule. */
export class PostgresReferralAttributionRepository
  implements ReferralAttributionRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async getById(
    referralAttributionIdInput: string
  ): Promise<ReferralAttributionRecord | null> {
    return this.findOne(
      FIND_BY_ID_SQL,
      assertCommercialIdentifier(referralAttributionIdInput, 'referralAttributionId')
    );
  }

  public async getByReferredAuthority(
    referredAuthorityIdInput: string
  ): Promise<ReferralAttributionRecord | null> {
    return this.findOne(
      FIND_BY_REFERRED_AUTHORITY_SQL,
      assertCommercialIdentifier(referredAuthorityIdInput, 'referredAuthorityId')
    );
  }

  public async getByQualifyingPaidCoverage(
    qualifyingPaidCoverageIdInput: string
  ): Promise<ReferralAttributionRecord | null> {
    return this.findOne(
      FIND_BY_COVERAGE_SQL,
      assertCommercialIdentifier(
        qualifyingPaidCoverageIdInput,
        'qualifyingPaidCoverageId'
      )
    );
  }

  public async lockForUpdate(
    referralAttributionIdInput: string
  ): Promise<ReferralAttributionRecord | null> {
    const referralAttributionId = assertCommercialIdentifier(
      referralAttributionIdInput,
      'referralAttributionId'
    );
    try {
      const result = await this.executor.query<ReferralAttributionRow>(
        LOCK_BY_ID_SQL,
        [referralAttributionId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralAttributionRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  /** Used to enforce the account-level first-valid-attribution rule. */
  public async lockByReferredAuthority(
    referredAuthorityIdInput: string
  ): Promise<ReferralAttributionRecord | null> {
    const referredAuthorityId = assertCommercialIdentifier(
      referredAuthorityIdInput,
      'referredAuthorityId'
    );
    try {
      const result = await this.executor.query<ReferralAttributionRow>(
        LOCK_BY_REFERRED_AUTHORITY_SQL,
        [referredAuthorityId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralAttributionRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  /** Used only after all live owner and authority locks are held. */
  public async lockByIds(
    referralAttributionIdsInput: readonly string[]
  ): Promise<readonly ReferralAttributionRecord[]> {
    const ids = [...new Set(referralAttributionIdsInput.map((value) =>
      assertCommercialIdentifier(value, 'referralAttributionId')))].sort();
    if (ids.length === 0) {
      return Object.freeze([]);
    }
    try {
      const result = await this.executor.query<ReferralAttributionRow>(
        LOCK_BY_IDS_SQL,
        [ids]
      );
      if (result.rows.length !== ids.length) {
        throw new ReferralAttributionNotFoundError();
      }
      return Object.freeze(result.rows.map(mapReferralAttributionRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async establish(
    input: EstablishReferralAttributionInput
  ): Promise<ReferralAttributionRecord> {
    const normalized = normalizedEstablishInput(input);
    if (normalized.referrerAuthorityId === normalized.referredAuthorityId) {
      throw new ReferralAttributionConflictError();
    }
    await assertLiveOwnerAndAuthority(
      this.executor,
      normalized.referrerOwnerId,
      normalized.referrerAuthorityId
    );
    await assertLiveOwnerAndAuthority(
      this.executor,
      normalized.referredOwnerId,
      normalized.referredAuthorityId
    );

    try {
      const inserted = await this.executor.query<ReferralAttributionRow>(
        INSERT_ATTRIBUTION_SQL,
        [
          normalized.referralAttributionId,
          normalized.referralPublicIdentityId,
          normalized.referrerAuthorityId,
          normalized.referredAuthorityId,
          normalized.attributedAt,
          normalized.campaignReference,
          normalized.lastEventId,
          normalized.sourceRevision
        ]
      );
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapReferralAttributionRow(row);
      }

      const existing = await this.getByReferredAuthority(
        normalized.referredAuthorityId
      );
      if (
        existing !== null &&
        existing.referralAttributionId === normalized.referralAttributionId &&
        existing.referralPublicIdentityId === normalized.referralPublicIdentityId &&
        existing.referrerAuthorityId === normalized.referrerAuthorityId &&
        existing.lastEventId === normalized.lastEventId
      ) {
        return existing;
      }
      if (existing !== null) {
        throw new ReferralAttributionConflictError();
      }
      throw new CommercialPersistenceIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new ReferralAttributionConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async attachQualifyingPurchase(
    input: AttachReferralQualifyingPurchaseInput
  ): Promise<ReferralAttributionRecord> {
    const referredOwnerId = assertCommercialIdentifier(
      input.referredOwnerId,
      'referredOwnerId'
    );
    const referredAuthorityId = assertCommercialIdentifier(
      input.referredAuthorityId,
      'referredAuthorityId'
    );
    const referralAttributionId = assertCommercialIdentifier(
      input.referralAttributionId,
      'referralAttributionId'
    );
    const qualifyingPaidCoverageId = assertCommercialIdentifier(
      input.qualifyingPaidCoverageId,
      'qualifyingPaidCoverageId'
    );
    const lockedAt = assertCommercialTimestamp(input.lockedAt, 'lockedAt');
    const lastEventId = assertCommercialIdentifier(input.lastEventId, 'lastEventId');
    const sourceRevision = assertCommercialRevision(input.sourceRevision);
    await assertLiveOwnerAndAuthority(
      this.executor,
      referredOwnerId,
      referredAuthorityId
    );

    try {
      const result = await this.executor.query<ReferralAttributionRow>(
        ATTACH_QUALIFYING_PURCHASE_SQL,
        [
          referralAttributionId,
          referredAuthorityId,
          qualifyingPaidCoverageId,
          lockedAt,
          lastEventId,
          sourceRevision
        ]
      );
      const row = result.rows[0];
      if (row !== undefined) {
        return mapReferralAttributionRow(row);
      }

      const existing = await this.getById(referralAttributionId);
      if (
        existing?.state === 'LOCKED' &&
        existing.qualifyingPaidCoverageId === qualifyingPaidCoverageId
      ) {
        return existing;
      }
      if (existing === null) {
        throw new ReferralAttributionNotFoundError();
      }
      throw new ReferralAttributionConflictError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new ReferralAttributionConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  private async findOne(
    sql: string,
    parameter: string
  ): Promise<ReferralAttributionRecord | null> {
    try {
      const result = await this.executor.query<ReferralAttributionRow>(sql, [
        parameter
      ]);
      const row = result.rows[0];
      return row === undefined ? null : mapReferralAttributionRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
