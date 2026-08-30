import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialRevision,
  assertCommercialIdentifier,
  assertCommercialTimestamp
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  ReferralRewardConflictError,
  ReferralRewardNotFoundError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import {
  REFERRAL_REWARD_DURATION_US,
  assertReferralReason
} from '../referral-domain.js';
import type {
  CreatePendingReferralRewardInput,
  MatureReferralRewardInput,
  ReferralRewardMaturationCandidate,
  ReferralRewardRecord,
  ReferralRewardRepository,
  RevokeReferralRewardInput
} from '../repositories.js';
import { assertLiveOwnerAndAuthority } from './postgres-paid-persistence-shared.js';
import {
  REFERRAL_REWARD_COLUMNS_SQL,
  REFERRAL_REWARD_COLUMNS_QUALIFIED_SQL,
  type ReferralRewardRow,
  ensureD4ARewardShape,
  mapReferralRewardRow
} from './postgres-referral-persistence-shared.js';

interface CandidateRewardRow extends ReferralRewardRow {
  readonly referred_owner_id: string;
  readonly referred_authority_id: string;
}

const FIND_BY_ID_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.referral_reward_id = $1
`;

const FIND_BY_ATTRIBUTION_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.referral_attribution_id = $1
`;

const FIND_BY_COVERAGE_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.qualifying_paid_coverage_id = $1
`;

const FIND_BY_OWNER_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_QUALIFIED_SQL}
  FROM referral_rewards AS rr
  JOIN commercial_authorities AS ca
    ON ca.commercial_authority_id = rr.referrer_authority_id
  JOIN users AS u
    ON u.user_id = ca.owner_id
  WHERE ca.owner_id = $1
    AND ca.commercial_authority_id = $2
  ORDER BY rr.matures_at ASC, rr.earned_at ASC NULLS FIRST, rr.referral_reward_id ASC
`;

const FIND_MATURATION_CANDIDATES_SQL = `
  SELECT
    ${REFERRAL_REWARD_COLUMNS_QUALIFIED_SQL},
    referred_authority.owner_id AS referred_owner_id,
    referred_authority.commercial_authority_id AS referred_authority_id
  FROM referral_rewards AS rr
  JOIN referral_attributions AS ra
    ON ra.referral_attribution_id = rr.referral_attribution_id
  JOIN commercial_authorities AS referrer_authority
    ON referrer_authority.commercial_authority_id = rr.referrer_authority_id
  JOIN commercial_authorities AS referred_authority
    ON referred_authority.commercial_authority_id = ra.referred_authority_id
  JOIN users AS referrer_user
    ON referrer_user.user_id = referrer_authority.owner_id
  JOIN users AS referred_user
    ON referred_user.user_id = referred_authority.owner_id
  WHERE referrer_authority.owner_id = $1
    AND rr.state = 'PENDING'
    AND rr.matures_at <= CURRENT_TIMESTAMP
  ORDER BY rr.matures_at ASC, rr.referral_reward_id ASC
  LIMIT $2::integer
`;

const LOCK_BY_ID_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.referral_reward_id = $1
    AND rr.referrer_authority_id = $2
  FOR UPDATE
`;

const LOCK_BY_IDS_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.referral_reward_id = ANY($1::text[])
    AND rr.referrer_authority_id = $2
  ORDER BY rr.referral_reward_id ASC
  FOR UPDATE
`;

/*
 * The frozen persistence contract defines the rolling boundary as twelve
 * calendar months in UTC. Explicit UTC conversion keeps the result stable
 * even if a connection's session timezone was changed by a caller.
 */
const LOCK_CAP_WINDOW_SQL = `
  SELECT ${REFERRAL_REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  WHERE rr.referrer_authority_id = $1
    AND rr.qualifying_payment_at >= (
      (($2::timestamptz AT TIME ZONE 'UTC') - INTERVAL '12 months')
      AT TIME ZONE 'UTC'
    )
    AND rr.qualifying_payment_at < $2::timestamptz
    AND (rr.state <> 'REVOKED' OR rr.earned_at IS NOT NULL)
  ORDER BY rr.qualifying_payment_at ASC, rr.referral_reward_id ASC
  FOR UPDATE
`;

const INSERT_PENDING_SQL = `
  INSERT INTO referral_rewards (
    referral_reward_id,
    referrer_authority_id,
    referral_attribution_id,
    qualifying_paid_coverage_id,
    state,
    qualifying_payment_at,
    matures_at,
    granted_duration_us,
    earned_duration_us,
    applied_duration_us,
    consumed_duration_us,
    revoked_duration_us,
    pending_event_id,
    source_revision
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    'PENDING',
    $5::timestamptz,
    ((($5::timestamptz AT TIME ZONE 'UTC') + INTERVAL '14 days') AT TIME ZONE 'UTC'),
    $6::bigint,
    0,
    0,
    0,
    0,
    $7,
    $8::bigint
  )
  RETURNING ${REFERRAL_REWARD_COLUMNS_SQL}
`;

const MATURE_SQL = `
  UPDATE referral_rewards AS rr
  SET
    state = 'EARNED',
    earned_at = $3::timestamptz,
    earned_duration_us = granted_duration_us,
    maturation_event_id = $4,
    source_revision = $5::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE rr.referral_reward_id = $1
    AND rr.referrer_authority_id = $2
    AND rr.state = 'PENDING'
    AND rr.matures_at <= $3::timestamptz
  RETURNING ${REFERRAL_REWARD_COLUMNS_SQL}
`;

const REVOKE_SQL = `
  UPDATE referral_rewards AS rr
  SET
    state = 'REVOKED',
    revoked_at = $3::timestamptz,
    revocation_reason = $4,
    reversal_event_id = $5,
    revoked_duration_us = rr.earned_duration_us - rr.consumed_duration_us - rr.revoked_duration_us,
    source_revision = $6::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE rr.referral_reward_id = $1
    AND rr.referrer_authority_id = $2
    AND rr.state IN ('PENDING', 'EARNED')
    AND rr.applied_duration_us = 0
    AND rr.consumed_duration_us = 0
  RETURNING ${REFERRAL_REWARD_COLUMNS_SQL}
`;

function normalizeCreateInput(input: CreatePendingReferralRewardInput) {
  return {
    referrerOwnerId: assertCommercialIdentifier(input.referrerOwnerId, 'referrerOwnerId'),
    referrerAuthorityId: assertCommercialIdentifier(
      input.referrerAuthorityId,
      'referrerAuthorityId'
    ),
    referralRewardId: assertCommercialIdentifier(
      input.referralRewardId,
      'referralRewardId'
    ),
    referralAttributionId: assertCommercialIdentifier(
      input.referralAttributionId,
      'referralAttributionId'
    ),
    qualifyingPaidCoverageId: assertCommercialIdentifier(
      input.qualifyingPaidCoverageId,
      'qualifyingPaidCoverageId'
    ),
    qualifyingPaymentAt: assertCommercialTimestamp(
      input.qualifyingPaymentAt,
      'qualifyingPaymentAt'
    ),
    pendingEventId: assertCommercialIdentifier(input.pendingEventId, 'pendingEventId'),
    sourceRevision: assertCommercialRevision(input.sourceRevision)
  };
}

/** Normalized, append-provenance Referral reward persistence. */
export class PostgresReferralRewardRepository
  implements ReferralRewardRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async getById(
    referralRewardIdInput: string
  ): Promise<ReferralRewardRecord | null> {
    return this.findOne(
      FIND_BY_ID_SQL,
      assertCommercialIdentifier(referralRewardIdInput, 'referralRewardId')
    );
  }

  public async getByAttribution(
    referralAttributionIdInput: string
  ): Promise<ReferralRewardRecord | null> {
    return this.findOne(
      FIND_BY_ATTRIBUTION_SQL,
      assertCommercialIdentifier(referralAttributionIdInput, 'referralAttributionId')
    );
  }

  public async getByQualifyingPaidCoverage(
    qualifyingPaidCoverageIdInput: string
  ): Promise<ReferralRewardRecord | null> {
    return this.findOne(
      FIND_BY_COVERAGE_SQL,
      assertCommercialIdentifier(
        qualifyingPaidCoverageIdInput,
        'qualifyingPaidCoverageId'
      )
    );
  }

  public async listByOwner(
    ownerIdInput: string,
    referrerAuthorityIdInput: string
  ): Promise<readonly ReferralRewardRecord[]> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    const referrerAuthorityId = assertCommercialIdentifier(
      referrerAuthorityIdInput,
      'referrerAuthorityId'
    );
    await assertLiveOwnerAndAuthority(this.executor, ownerId, referrerAuthorityId);
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        FIND_BY_OWNER_SQL,
        [ownerId, referrerAuthorityId]
      );
      return Object.freeze(result.rows.map(mapReferralRewardRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async listMaturationCandidates(
    ownerIdInput: string,
    limitInput: number
  ): Promise<readonly ReferralRewardMaturationCandidate[]> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    if (!Number.isSafeInteger(limitInput) || limitInput < 1 || limitInput > 100) {
      throw new CommercialPersistenceIntegrityError();
    }
    try {
      const result = await this.executor.query<CandidateRewardRow>(
        FIND_MATURATION_CANDIDATES_SQL,
        [ownerId, limitInput]
      );
      return Object.freeze(
        result.rows.map((row) => {
          const reward = mapReferralRewardRow(row);
          return Object.freeze({
            ...reward,
            referredOwnerId: assertCommercialIdentifier(
              row.referred_owner_id,
              'referredOwnerId'
            ),
            referredAuthorityId: assertCommercialIdentifier(
              row.referred_authority_id,
              'referredAuthorityId'
            )
          });
        })
      );
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockForUpdate(
    referralRewardIdInput: string,
    referrerAuthorityIdInput: string
  ): Promise<ReferralRewardRecord | null> {
    const referralRewardId = assertCommercialIdentifier(
      referralRewardIdInput,
      'referralRewardId'
    );
    const referrerAuthorityId = assertCommercialIdentifier(
      referrerAuthorityIdInput,
      'referrerAuthorityId'
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        LOCK_BY_ID_SQL,
        [referralRewardId, referrerAuthorityId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReferralRewardRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockByIds(
    referralRewardIdsInput: readonly string[],
    referrerAuthorityIdInput: string
  ): Promise<readonly ReferralRewardRecord[]> {
    const ids = [...new Set(referralRewardIdsInput.map((value) =>
      assertCommercialIdentifier(value, 'referralRewardId')))].sort();
    const referrerAuthorityId = assertCommercialIdentifier(
      referrerAuthorityIdInput,
      'referrerAuthorityId'
    );
    if (ids.length === 0) {
      return Object.freeze([]);
    }
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        LOCK_BY_IDS_SQL,
        [ids, referrerAuthorityId]
      );
      if (result.rows.length !== ids.length) {
        throw new ReferralRewardNotFoundError();
      }
      return Object.freeze(result.rows.map(mapReferralRewardRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockCapWindow(
    referrerAuthorityIdInput: string,
    qualifyingPaymentAtInput: string | Date
  ): Promise<readonly ReferralRewardRecord[]> {
    const referrerAuthorityId = assertCommercialIdentifier(
      referrerAuthorityIdInput,
      'referrerAuthorityId'
    );
    const qualifyingPaymentAt = assertCommercialTimestamp(
      qualifyingPaymentAtInput,
      'qualifyingPaymentAt'
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        LOCK_CAP_WINDOW_SQL,
        [referrerAuthorityId, qualifyingPaymentAt]
      );
      return Object.freeze(result.rows.map(mapReferralRewardRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async createPending(
    input: CreatePendingReferralRewardInput
  ): Promise<ReferralRewardRecord> {
    const normalized = normalizeCreateInput(input);
    await assertLiveOwnerAndAuthority(
      this.executor,
      normalized.referrerOwnerId,
      normalized.referrerAuthorityId
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        INSERT_PENDING_SQL,
        [
          normalized.referralRewardId,
          normalized.referrerAuthorityId,
          normalized.referralAttributionId,
          normalized.qualifyingPaidCoverageId,
          normalized.qualifyingPaymentAt,
          REFERRAL_REWARD_DURATION_US,
          normalized.pendingEventId,
          normalized.sourceRevision
        ]
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new ReferralRewardConflictError();
      }
      const reward = mapReferralRewardRow(row);
      ensureD4ARewardShape(reward);
      return reward;
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new ReferralRewardConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async mature(
    input: MatureReferralRewardInput
  ): Promise<ReferralRewardRecord> {
    const referrerOwnerId = assertCommercialIdentifier(
      input.referrerOwnerId,
      'referrerOwnerId'
    );
    const referrerAuthorityId = assertCommercialIdentifier(
      input.referrerAuthorityId,
      'referrerAuthorityId'
    );
    const referralRewardId = assertCommercialIdentifier(
      input.referralRewardId,
      'referralRewardId'
    );
    const maturationEventId = assertCommercialIdentifier(
      input.maturationEventId,
      'maturationEventId'
    );
    const earnedAt = assertCommercialTimestamp(input.earnedAt, 'earnedAt');
    const sourceRevision = assertCommercialRevision(input.sourceRevision);
    await assertLiveOwnerAndAuthority(
      this.executor,
      referrerOwnerId,
      referrerAuthorityId
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(MATURE_SQL, [
        referralRewardId,
        referrerAuthorityId,
        earnedAt,
        maturationEventId,
        sourceRevision
      ]);
      const row = result.rows[0];
      if (row !== undefined) {
        const reward = mapReferralRewardRow(row);
        ensureD4ARewardShape(reward);
        return reward;
      }
      const existing = await this.getById(referralRewardId);
      if (
        existing?.state === 'EARNED' &&
        existing.maturationEventId === maturationEventId
      ) {
        return existing;
      }
      if (existing === null) {
        throw new ReferralRewardNotFoundError();
      }
      throw new ReferralRewardConflictError();
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async revoke(
    input: RevokeReferralRewardInput
  ): Promise<ReferralRewardRecord> {
    const referrerOwnerId = assertCommercialIdentifier(
      input.referrerOwnerId,
      'referrerOwnerId'
    );
    const referrerAuthorityId = assertCommercialIdentifier(
      input.referrerAuthorityId,
      'referrerAuthorityId'
    );
    const referralRewardId = assertCommercialIdentifier(
      input.referralRewardId,
      'referralRewardId'
    );
    const revokedAt = assertCommercialTimestamp(input.revokedAt, 'revokedAt');
    const revocationReason = assertReferralReason(
      input.revocationReason,
      'revocationReason'
    );
    const reversalEventId =
      input.reversalEventId === null
        ? null
        : assertCommercialIdentifier(input.reversalEventId, 'reversalEventId');
    const sourceRevision = assertCommercialRevision(input.sourceRevision);
    await assertLiveOwnerAndAuthority(
      this.executor,
      referrerOwnerId,
      referrerAuthorityId
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(REVOKE_SQL, [
        referralRewardId,
        referrerAuthorityId,
        revokedAt,
        revocationReason,
        reversalEventId,
        sourceRevision
      ]);
      const row = result.rows[0];
      if (row !== undefined) {
        const reward = mapReferralRewardRow(row);
        ensureD4ARewardShape(reward);
        return reward;
      }
      const existing = await this.getById(referralRewardId);
      if (
        existing?.state === 'REVOKED' &&
        existing.reversalEventId === reversalEventId
      ) {
        return existing;
      }
      if (existing === null) {
        throw new ReferralRewardNotFoundError();
      }
      throw new ReferralRewardConflictError();
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  private async findOne(
    sql: string,
    parameter: string
  ): Promise<ReferralRewardRecord | null> {
    try {
      const result = await this.executor.query<ReferralRewardRow>(sql, [
        parameter
      ]);
      const row = result.rows[0];
      return row === undefined ? null : mapReferralRewardRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
