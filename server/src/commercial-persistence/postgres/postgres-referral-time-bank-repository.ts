import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  ReferralRewardNotFoundError,
  mapCommercialPersistenceFailure
} from '../commercial-persistence-errors.js';
import {
  MAX_REFERRAL_PAID_BLOCKING_INTERVALS,
  MAX_REFERRAL_TIME_BANK_REWARDS,
  MAX_REFERRAL_TIME_BANK_SEGMENTS,
  type ReferralConsumptionSegmentPlan,
  type ReferralPaidBlockingInterval,
  type ReferralRewardSettlement,
  type ReferralTimeBankRewardInput
} from '../referral-time-bank-domain.js';
import {
  assertReferralDurationMicroseconds,
  assertReferralReason,
  assertReferralTimestamp
} from '../referral-domain.js';
import type { ReferralRewardRecord } from '../repositories.js';
import {
  type ReferralRewardRow,
  mapReferralRewardRow
} from './postgres-referral-persistence-shared.js';

const PRECISE_TIMESTAMP_FORMAT = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

const REWARD_COLUMNS_SQL = `
  rr.referral_reward_id,
  rr.referrer_authority_id,
  rr.referral_attribution_id,
  rr.qualifying_paid_coverage_id,
  rr.state,
  to_char(rr.qualifying_payment_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS qualifying_payment_at,
  to_char(rr.admitted_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS admitted_at,
  to_char(rr.matures_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS matures_at,
  CASE WHEN rr.earned_at IS NULL THEN NULL ELSE to_char(rr.earned_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) END AS earned_at,
  CASE WHEN rr.applied_at IS NULL THEN NULL ELSE to_char(rr.applied_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) END AS applied_at,
  CASE WHEN rr.revoked_at IS NULL THEN NULL ELSE to_char(rr.revoked_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) END AS revoked_at,
  rr.granted_duration_us,
  rr.earned_duration_us,
  rr.applied_duration_us,
  rr.consumed_duration_us,
  rr.revoked_duration_us,
  CASE WHEN rr.active_consumption_started_at IS NULL THEN NULL ELSE to_char(rr.active_consumption_started_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) END AS active_consumption_started_at,
  rr.revocation_reason,
  rr.reversal_event_id,
  rr.pending_event_id,
  rr.maturation_event_id,
  rr.application_event_id,
  rr.source_revision,
  rr.created_at,
  rr.updated_at
`;

const LOCK_REWARDS_SQL = `
  SELECT ${REWARD_COLUMNS_SQL}
  FROM referral_rewards AS rr
  JOIN commercial_authorities AS ca
    ON ca.commercial_authority_id = rr.referrer_authority_id
  JOIN users AS u
    ON u.user_id = ca.owner_id
  WHERE ca.owner_id = $1
    AND ca.commercial_authority_id = $2
  ORDER BY rr.matures_at ASC, rr.admitted_at ASC, rr.referral_reward_id ASC
  LIMIT $3::integer
  FOR UPDATE OF rr
`;

const PAID_BLOCKING_INTERVALS_SQL = `
  WITH blocking_intervals AS (
    SELECT
      pc.paid_coverage_id AS source_entity_id,
      'COVERAGE'::text AS blocking_kind,
      pc.coverage_start_at AS starts_at,
      pc.effective_coverage_end_at AS ends_at
    FROM paid_coverages AS pc
    WHERE pc.commercial_authority_id = $1
      AND pc.coverage_start_at < pc.effective_coverage_end_at

    UNION ALL

    SELECT
      pbr.paid_relationship_id AS source_entity_id,
      'GRACE'::text AS blocking_kind,
      pbr.grace_started_at AS starts_at,
      pbr.grace_until AS ends_at
    FROM paid_billing_relationships AS pbr
    WHERE pbr.commercial_authority_id = $1
      AND pbr.lifecycle_state = 'RECOVERY_GRACE'
      AND pbr.grace_started_at IS NOT NULL
      AND pbr.grace_until IS NOT NULL

    UNION ALL

    SELECT
      ce.source_entity_id,
      'GRACE'::text AS blocking_kind,
      ce.effective_at AS starts_at,
      LEAST(
        ((ce.effective_at AT TIME ZONE 'UTC') + INTERVAL '7 days') AT TIME ZONE 'UTC',
        COALESCE(
          pbr.ended_at,
          ((ce.effective_at AT TIME ZONE 'UTC') + INTERVAL '7 days') AT TIME ZONE 'UTC'
        )
      ) AS ends_at
    FROM commercial_events AS ce
    JOIN paid_billing_relationships AS pbr
      ON pbr.paid_relationship_id = ce.source_entity_id
     AND pbr.commercial_authority_id = ce.commercial_authority_id
    WHERE ce.commercial_authority_id = $1
      AND ce.source_type = 'PAID'
      AND ce.event_type = 'PAID_RENEWAL_FAILED'
  )
  SELECT
    bi.source_entity_id,
    bi.blocking_kind,
    to_char(bi.starts_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS starts_at,
    to_char(bi.ends_at AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS ends_at
  FROM blocking_intervals AS bi
  WHERE bi.starts_at < bi.ends_at
  ORDER BY bi.starts_at ASC, bi.ends_at ASC, bi.source_entity_id ASC
  LIMIT $2::integer
`;

const LOCK_SEGMENTS_SQL = `
  SELECT
    rcs.referral_consumption_segment_id,
    rcs.referral_reward_id,
    to_char(rcs.consumed_from AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS consumed_from,
    to_char(rcs.consumed_until AT TIME ZONE 'UTC', ${PRECISE_TIMESTAMP_FORMAT}) AS consumed_until,
    rcs.consumed_duration_us,
    rcs.source_revision
  FROM referral_consumption_segments AS rcs
  WHERE rcs.commercial_authority_id = $1
  ORDER BY rcs.consumed_from ASC, rcs.consumed_until ASC, rcs.referral_consumption_segment_id ASC
  LIMIT $2::integer
  FOR UPDATE
`;

const UPDATE_REWARD_SQL = `
  UPDATE referral_rewards AS rr
  SET
    state = $3,
    applied_at = $4::timestamptz,
    applied_duration_us = $5::bigint,
    consumed_duration_us = $6::bigint,
    revoked_duration_us = $7::bigint,
    active_consumption_started_at = $8::timestamptz,
    application_event_id = COALESCE(rr.application_event_id, $9),
    source_revision = $10::bigint,
    revoked_at = COALESCE($11::timestamptz, rr.revoked_at),
    revocation_reason = COALESCE($12, rr.revocation_reason),
    reversal_event_id = COALESCE($13, rr.reversal_event_id),
    updated_at = clock_timestamp()
  WHERE rr.referral_reward_id = $1
    AND rr.referrer_authority_id = $2
  RETURNING ${REWARD_COLUMNS_SQL}
`;

const DELETE_SEGMENTS_SQL = `
  DELETE FROM referral_consumption_segments
  WHERE commercial_authority_id = $1
`;

const INSERT_SEGMENT_SQL = `
  INSERT INTO referral_consumption_segments (
    referral_consumption_segment_id,
    commercial_authority_id,
    referral_reward_id,
    consumed_from,
    consumed_until,
    consumed_duration_us,
    source_revision
  )
  VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6::bigint, $7::bigint)
`;

interface PaidIntervalRow {
  readonly source_entity_id: string;
  readonly blocking_kind: string;
  readonly starts_at: string;
  readonly ends_at: string;
}

interface SegmentRow {
  readonly referral_consumption_segment_id: string;
  readonly referral_reward_id: string;
  readonly consumed_from: string;
  readonly consumed_until: string;
  readonly consumed_duration_us: string | number | bigint;
  readonly source_revision: string | number | bigint;
}

export interface LoadedReferralTimeBankReward {
  readonly record: ReferralRewardRecord;
  readonly input: ReferralTimeBankRewardInput;
}

export interface StoredReferralConsumptionSegment
  extends ReferralConsumptionSegmentPlan {
  readonly sourceRevision: string;
}

function preciseOptionalTimestamp(
  value: Date | string | null,
  fieldName: string
): string | null {
  return value === null ? null : assertReferralTimestamp(value, fieldName);
}

function mapPreciseReward(row: ReferralRewardRow): LoadedReferralTimeBankReward {
  const mapped = mapReferralRewardRow(row);
  const record = Object.freeze({
    ...mapped,
    qualifyingPaymentAt: assertReferralTimestamp(
      row.qualifying_payment_at,
      'qualifyingPaymentAt'
    ),
    admittedAt: assertReferralTimestamp(row.admitted_at, 'admittedAt'),
    maturesAt: assertReferralTimestamp(row.matures_at, 'maturesAt'),
    earnedAt: preciseOptionalTimestamp(row.earned_at, 'earnedAt'),
    appliedAt: preciseOptionalTimestamp(row.applied_at, 'appliedAt'),
    revokedAt: preciseOptionalTimestamp(row.revoked_at, 'revokedAt'),
    activeConsumptionStartedAt: preciseOptionalTimestamp(
      row.active_consumption_started_at,
      'activeConsumptionStartedAt'
    )
  });
  return Object.freeze({
    record,
    input: Object.freeze({
      referralRewardId: record.referralRewardId,
      state: record.state,
      maturesAt: record.maturesAt,
      admittedAt: record.admittedAt,
      earnedAt: record.earnedAt,
      appliedAt: record.appliedAt,
      revokedAt: record.revokedAt,
      earnedDurationUs: record.earnedDurationUs,
      appliedDurationUs: record.appliedDurationUs,
      consumedDurationUs: record.consumedDurationUs,
      revokedDurationUs: record.revokedDurationUs,
      activeConsumptionStartedAt: record.activeConsumptionStartedAt,
      sourceRevision: record.sourceRevision
    })
  });
}

export class PostgresReferralTimeBankRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async lockRewards(
    ownerIdInput: string,
    commercialAuthorityIdInput: string
  ): Promise<readonly LoadedReferralTimeBankReward[]> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        LOCK_REWARDS_SQL,
        [ownerId, commercialAuthorityId, MAX_REFERRAL_TIME_BANK_REWARDS + 1]
      );
      if (result.rows.length > MAX_REFERRAL_TIME_BANK_REWARDS) {
        throw new CommercialPersistenceIntegrityError();
      }
      return Object.freeze(result.rows.map(mapPreciseReward));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async listPaidBlockingIntervals(
    commercialAuthorityIdInput: string
  ): Promise<readonly ReferralPaidBlockingInterval[]> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    try {
      const result = await this.executor.query<PaidIntervalRow>(
        PAID_BLOCKING_INTERVALS_SQL,
        [commercialAuthorityId, MAX_REFERRAL_PAID_BLOCKING_INTERVALS + 1]
      );
      if (result.rows.length > MAX_REFERRAL_PAID_BLOCKING_INTERVALS) {
        throw new CommercialPersistenceIntegrityError();
      }
      return Object.freeze(
        result.rows.map((row) => {
          if (row.blocking_kind !== 'COVERAGE' && row.blocking_kind !== 'GRACE') {
            throw new CommercialPersistenceIntegrityError();
          }
          return Object.freeze({
            sourceEntityId: assertCommercialIdentifier(
              row.source_entity_id,
              'sourceEntityId'
            ),
            kind: row.blocking_kind,
            startsAt: assertReferralTimestamp(row.starts_at, 'startsAt'),
            endsAt: assertReferralTimestamp(row.ends_at, 'endsAt')
          });
        })
      );
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockSegments(
    commercialAuthorityIdInput: string
  ): Promise<readonly StoredReferralConsumptionSegment[]> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    try {
      const result = await this.executor.query<SegmentRow>(LOCK_SEGMENTS_SQL, [
        commercialAuthorityId,
        MAX_REFERRAL_TIME_BANK_SEGMENTS + 1
      ]);
      if (result.rows.length > MAX_REFERRAL_TIME_BANK_SEGMENTS) {
        throw new CommercialPersistenceIntegrityError();
      }
      return Object.freeze(
        result.rows.map((row) =>
          Object.freeze({
            referralConsumptionSegmentId: assertCommercialIdentifier(
              row.referral_consumption_segment_id,
              'referralConsumptionSegmentId'
            ),
            referralRewardId: assertCommercialIdentifier(
              row.referral_reward_id,
              'referralRewardId'
            ),
            consumedFrom: assertReferralTimestamp(
              row.consumed_from,
              'consumedFrom'
            ),
            consumedUntil: assertReferralTimestamp(
              row.consumed_until,
              'consumedUntil'
            ),
            consumedDurationUs: assertReferralDurationMicroseconds(
              row.consumed_duration_us,
              'consumedDurationUs'
            ),
            sourceRevision: assertCommercialRevision(row.source_revision)
          })
        )
      );
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async updateReward(
    commercialAuthorityIdInput: string,
    settlement: ReferralRewardSettlement,
    applicationEventIdInput: string | null,
    sourceRevisionInput: string,
    revocation: {
      readonly revokedAt: string;
      readonly revocationReason: string;
      readonly reversalEventId: string;
    } | null = null
  ): Promise<ReferralRewardRecord> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    const applicationEventId =
      applicationEventIdInput === null
        ? null
        : assertCommercialIdentifier(applicationEventIdInput, 'applicationEventId');
    const sourceRevision = assertCommercialRevision(sourceRevisionInput);
    try {
      const result = await this.executor.query<ReferralRewardRow>(
        UPDATE_REWARD_SQL,
        [
          assertCommercialIdentifier(
            settlement.referralRewardId,
            'referralRewardId'
          ),
          commercialAuthorityId,
          settlement.state,
          settlement.appliedAt,
          settlement.appliedDurationUs,
          settlement.consumedDurationUs,
          settlement.revokedDurationUs,
          settlement.activeConsumptionStartedAt,
          applicationEventId,
          sourceRevision,
          revocation === null
            ? null
            : assertReferralTimestamp(revocation.revokedAt, 'revokedAt'),
          revocation === null
            ? null
            : assertReferralReason(
                revocation.revocationReason,
                'revocationReason'
              ),
          revocation === null
            ? null
            : assertCommercialIdentifier(
                revocation.reversalEventId,
                'reversalEventId'
              )
        ]
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new ReferralRewardNotFoundError();
      }
      return mapPreciseReward(row).record;
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async replaceSegments(
    commercialAuthorityIdInput: string,
    segments: readonly ReferralConsumptionSegmentPlan[],
    sourceRevisionInput: string
  ): Promise<void> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    const sourceRevision = assertCommercialRevision(sourceRevisionInput);
    if (segments.length > MAX_REFERRAL_TIME_BANK_SEGMENTS) {
      throw new CommercialPersistenceIntegrityError();
    }
    try {
      await this.executor.query(DELETE_SEGMENTS_SQL, [commercialAuthorityId]);
      for (const segment of segments) {
        await this.executor.query(INSERT_SEGMENT_SQL, [
          assertCommercialIdentifier(
            segment.referralConsumptionSegmentId,
            'referralConsumptionSegmentId'
          ),
          commercialAuthorityId,
          assertCommercialIdentifier(segment.referralRewardId, 'referralRewardId'),
          assertReferralTimestamp(segment.consumedFrom, 'consumedFrom'),
          assertReferralTimestamp(segment.consumedUntil, 'consumedUntil'),
          assertReferralDurationMicroseconds(
            segment.consumedDurationUs,
            'consumedDurationUs'
          ),
          sourceRevision
        ]);
      }
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
