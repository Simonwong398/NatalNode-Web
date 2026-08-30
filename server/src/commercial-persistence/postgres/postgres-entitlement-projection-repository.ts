import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp
} from '../commercial-domain.js';
import {
  ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES,
  ENTITLEMENT_EVALUATOR_POLICY_VERSION,
  ENTITLEMENT_PROJECTION_SCHEMA_VERSION,
  ENTITLEMENT_PROJECTION_STATUSES,
  ENTITLEMENT_SOURCE_CLASSES,
  ENTITLEMENT_TIERS,
  ENTITLEMENT_VAULT_CAPACITY_CLASSES,
  type EntitlementAlertEligibilityClass,
  type EntitlementProjectionRecord,
  type EntitlementProjectionStatus,
  type EntitlementSourceClass,
  type EntitlementTier,
  type EntitlementVaultCapacityClass
} from '../entitlement-types.js';
import { projectionToEffectiveEntitlement } from '../entitlement-domain.js';
import {
  EntitlementIntegrityError,
  EntitlementProjectionConflictError,
  EntitlementRevisionConflictError,
  CommercialAuthorityUnavailableError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  EntitlementProjectionRepository,
  UpsertEntitlementProjectionInput as ProjectionWriteInput
} from '../repositories.js';
import { assertLiveOwnerAndAuthority } from './postgres-paid-persistence-shared.js';

interface EntitlementProjectionRow {
  commercial_authority_id: string;
  source_revision: string | number | bigint;
  projection_schema_version: number;
  evaluator_policy_version: string;
  projection_status: string;
  tier: string | null;
  effective_pro: boolean | null;
  effective_from: Date | string | null;
  effective_until: Date | string | null;
  current_source_classes: readonly string[];
  current_source_class: string | null;
  current_source_entity_id: string | null;
  paid_coverage_end_at: Date | string | null;
  grace_until: Date | string | null;
  queued_referral_duration_us: string | number | bigint | null;
  current_referral_reward_id: string | null;
  transition_to_free_at: Date | string | null;
  ad_free: boolean | null;
  vault_capacity_class: string | null;
  astrology_alerts_eligibility_class: string | null;
  next_evaluation_at: Date | string | null;
  computed_at: Date | string;
}

interface AuthorityRevisionRow {
  commercial_authority_id: string;
  owner_id: string;
  entitlement_revision: string | number | bigint;
}

const PROJECTION_COLUMNS_SQL = `
  commercial_authority_id,
  source_revision,
  projection_schema_version,
  evaluator_policy_version,
  projection_status,
  tier,
  effective_pro,
  effective_from,
  effective_until,
  current_source_classes,
  current_source_class,
  current_source_entity_id,
  paid_coverage_end_at,
  grace_until,
  queued_referral_duration_us,
  current_referral_reward_id,
  transition_to_free_at,
  ad_free,
  vault_capacity_class,
  astrology_alerts_eligibility_class,
  next_evaluation_at,
  computed_at
`;

const FIND_BY_AUTHORITY_SQL = `
  SELECT ${PROJECTION_COLUMNS_SQL}
  FROM entitlement_projections
  WHERE commercial_authority_id = $1
`;

const FIND_BY_OWNER_SQL = `
  SELECT ep.*
  FROM entitlement_projections AS ep
  INNER JOIN commercial_authorities AS ca
    ON ca.commercial_authority_id = ep.commercial_authority_id
  WHERE ca.owner_id = $1
`;

const LOCK_AUTHORITY_REVISION_SQL = `
  SELECT commercial_authority_id, owner_id, entitlement_revision
  FROM commercial_authorities
  WHERE commercial_authority_id = $1
    AND owner_id = $2
  FOR UPDATE
`;

const UPSERT_PROJECTION_SQL = `
  INSERT INTO entitlement_projections (
    commercial_authority_id,
    source_revision,
    projection_schema_version,
    evaluator_policy_version,
    projection_status,
    tier,
    effective_pro,
    effective_from,
    effective_until,
    current_source_classes,
    current_source_class,
    current_source_entity_id,
    paid_coverage_end_at,
    grace_until,
    queued_referral_duration_us,
    current_referral_reward_id,
    transition_to_free_at,
    ad_free,
    vault_capacity_class,
    astrology_alerts_eligibility_class,
    next_evaluation_at,
    computed_at
  )
  VALUES (
    $1,
    $2::bigint,
    $3::integer,
    $4,
    $5,
    $6,
    $7::boolean,
    $8::timestamptz,
    $9::timestamptz,
    $10::text[],
    $11,
    $12,
    $13::timestamptz,
    $14::timestamptz,
    $15::bigint,
    $16,
    $17::timestamptz,
    $18::boolean,
    $19,
    $20,
    $21::timestamptz,
    $22::timestamptz
  )
  ON CONFLICT (commercial_authority_id) DO UPDATE
  SET
    source_revision = EXCLUDED.source_revision,
    projection_schema_version = EXCLUDED.projection_schema_version,
    evaluator_policy_version = EXCLUDED.evaluator_policy_version,
    projection_status = EXCLUDED.projection_status,
    tier = EXCLUDED.tier,
    effective_pro = EXCLUDED.effective_pro,
    effective_from = EXCLUDED.effective_from,
    effective_until = EXCLUDED.effective_until,
    current_source_classes = EXCLUDED.current_source_classes,
    current_source_class = EXCLUDED.current_source_class,
    current_source_entity_id = EXCLUDED.current_source_entity_id,
    paid_coverage_end_at = EXCLUDED.paid_coverage_end_at,
    grace_until = EXCLUDED.grace_until,
    queued_referral_duration_us = EXCLUDED.queued_referral_duration_us,
    current_referral_reward_id = EXCLUDED.current_referral_reward_id,
    transition_to_free_at = EXCLUDED.transition_to_free_at,
    ad_free = EXCLUDED.ad_free,
    vault_capacity_class = EXCLUDED.vault_capacity_class,
    astrology_alerts_eligibility_class = EXCLUDED.astrology_alerts_eligibility_class,
    next_evaluation_at = EXCLUDED.next_evaluation_at,
    computed_at = EXCLUDED.computed_at
  WHERE entitlement_projections.source_revision <= EXCLUDED.source_revision
  RETURNING ${PROJECTION_COLUMNS_SQL}
`;

function isFrom<const Values extends readonly string[]>(
  values: Values,
  value: unknown
): value is Values[number] {
  return typeof value === 'string' && values.includes(value);
}

function optionalIdentifier(value: unknown, fieldName: string): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialIdentifier(value, fieldName);
}

function normalizeProjectionRow(
  row: EntitlementProjectionRow
): EntitlementProjectionRecord {
  if (!Array.isArray(row.current_source_classes)) {
    throw new EntitlementIntegrityError();
  }
  const currentSourceClasses = row.current_source_classes.map((value) => {
    if (!isFrom(ENTITLEMENT_SOURCE_CLASSES, value)) {
      throw new EntitlementIntegrityError();
    }
    return value;
  });
  const projectionStatus = isFrom(ENTITLEMENT_PROJECTION_STATUSES, row.projection_status)
    ? row.projection_status
    : (() => {
        throw new EntitlementIntegrityError();
      })();
  const tier =
    row.tier === null
      ? null
      : isFrom(ENTITLEMENT_TIERS, row.tier)
        ? row.tier
        : (() => {
            throw new EntitlementIntegrityError();
          })();
  const currentSourceClass =
    row.current_source_class === null
      ? null
      : isFrom(ENTITLEMENT_SOURCE_CLASSES, row.current_source_class)
        ? row.current_source_class
        : (() => {
            throw new EntitlementIntegrityError();
          })();
  const vaultCapacityClass =
    row.vault_capacity_class === null
      ? null
      : isFrom(ENTITLEMENT_VAULT_CAPACITY_CLASSES, row.vault_capacity_class)
        ? row.vault_capacity_class
        : (() => {
            throw new EntitlementIntegrityError();
          })();
  const astrologyAlertsEligibilityClass =
    row.astrology_alerts_eligibility_class === null
      ? null
      : isFrom(
            ENTITLEMENT_ALERT_ELIGIBILITY_CLASSES,
            row.astrology_alerts_eligibility_class
          )
        ? row.astrology_alerts_eligibility_class
        : (() => {
            throw new EntitlementIntegrityError();
          })();

  return Object.freeze({
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    sourceRevision: assertCommercialRevision(row.source_revision),
    projectionSchemaVersion: row.projection_schema_version,
    evaluatorPolicyVersion: assertCommercialIdentifier(
      row.evaluator_policy_version,
      'evaluatorPolicyVersion'
    ),
    projectionStatus,
    tier,
    effectivePro: row.effective_pro,
    effectiveFrom: assertOptionalCommercialTimestamp(
      row.effective_from,
      'effectiveFrom'
    ),
    effectiveUntil: assertOptionalCommercialTimestamp(
      row.effective_until,
      'effectiveUntil'
    ),
    currentSourceClasses: Object.freeze(currentSourceClasses),
    currentSourceClass,
    currentSourceEntityId: optionalIdentifier(
      row.current_source_entity_id,
      'currentSourceEntityId'
    ),
    paidCoverageEndAt: assertOptionalCommercialTimestamp(
      row.paid_coverage_end_at,
      'paidCoverageEndAt'
    ),
    graceUntil: assertOptionalCommercialTimestamp(row.grace_until, 'graceUntil'),
    queuedReferralDurationUs:
      row.queued_referral_duration_us === null
        ? null
        : assertCommercialRevision(row.queued_referral_duration_us),
    currentReferralRewardId: optionalIdentifier(
      row.current_referral_reward_id,
      'currentReferralRewardId'
    ),
    transitionToFreeAt: assertOptionalCommercialTimestamp(
      row.transition_to_free_at,
      'transitionToFreeAt'
    ),
    adFree: row.ad_free,
    vaultCapacityClass,
    astrologyAlertsEligibilityClass,
    nextEvaluationAt: assertOptionalCommercialTimestamp(
      row.next_evaluation_at,
      'nextEvaluationAt'
    ),
    computedAt: assertCommercialTimestamp(row.computed_at, 'computedAt')
  });
}

function validateProjectionInput(
  input: ProjectionWriteInput
): { readonly ownerId: string; readonly projection: EntitlementProjectionRecord } {
  const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
  const projection = input.projection;
  const commercialAuthorityId = assertCommercialIdentifier(
    projection.commercialAuthorityId,
    'commercialAuthorityId'
  );
  if (
    projection.projectionSchemaVersion !== ENTITLEMENT_PROJECTION_SCHEMA_VERSION ||
    projection.evaluatorPolicyVersion !== ENTITLEMENT_EVALUATOR_POLICY_VERSION ||
    !isFrom(ENTITLEMENT_PROJECTION_STATUSES, projection.projectionStatus) ||
    !Array.isArray(projection.currentSourceClasses) ||
    projection.currentSourceClasses.length > ENTITLEMENT_SOURCE_CLASSES.length
  ) {
    throw new EntitlementIntegrityError();
  }
  if (
    projection.currentSourceClasses.some(
      (sourceClass) => !isFrom(ENTITLEMENT_SOURCE_CLASSES, sourceClass)
    ) ||
    projection.currentSourceClasses.some(
      (sourceClass, index, all) =>
        index > 0 && sourceClass <= (all[index - 1] ?? '')
    )
  ) {
    throw new EntitlementIntegrityError();
  }
  assertCommercialRevision(projection.sourceRevision);
  assertCommercialTimestamp(projection.computedAt, 'computedAt');
  return {
    ownerId,
    projection: Object.freeze({
      ...projection,
      commercialAuthorityId,
      currentSourceClasses: Object.freeze([
        ...projection.currentSourceClasses
      ])
    })
  };
}

/**
 * Transaction-scoped repository for the rebuildable entitlement projection.
 * The caller should hold the live-owner and authority locks before invoking
 * the write; the write repeats the authority check and revision guard so a
 * stale writer cannot publish over a newer projection.
 */
export class PostgresEntitlementProjectionRepository
  implements EntitlementProjectionRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async getByAuthority(
    commercialAuthorityIdInput: string
  ): Promise<EntitlementProjectionRecord | null> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    try {
      const result = await this.executor.query<EntitlementProjectionRow>(
        FIND_BY_AUTHORITY_SQL,
        [commercialAuthorityId]
      );
      const row = result.rows[0];
      return row === undefined ? null : normalizeProjectionRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByOwner(
    ownerIdInput: string
  ): Promise<EntitlementProjectionRecord | null> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    try {
      const result = await this.executor.query<EntitlementProjectionRow>(
        FIND_BY_OWNER_SQL,
        [ownerId]
      );
      const row = result.rows[0];
      return row === undefined ? null : normalizeProjectionRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async upsertAtRevision(
    input: ProjectionWriteInput
  ): Promise<EntitlementProjectionRecord> {
    const normalized = validateProjectionInput(input);
    const { projection } = normalized;
    const projectionResult = projectionToEffectiveEntitlement(projection);
    if (projectionResult.determination !== 'DETERMINATE') {
      throw new EntitlementIntegrityError();
    }

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        normalized.ownerId,
        projection.commercialAuthorityId
      );
      const authorityResult = await this.executor.query<AuthorityRevisionRow>(
        LOCK_AUTHORITY_REVISION_SQL,
        [projection.commercialAuthorityId, normalized.ownerId]
      );
      const authority = authorityResult.rows[0];
      if (authority === undefined) {
        throw new CommercialAuthorityUnavailableError();
      }
      const authorityRevision = assertCommercialRevision(
        authority.entitlement_revision
      );
      const sourceRevision = assertCommercialRevision(projection.sourceRevision);
      if (BigInt(sourceRevision) > BigInt(authorityRevision)) {
        throw new EntitlementIntegrityError();
      }
      if (BigInt(sourceRevision) < BigInt(authorityRevision)) {
        throw new EntitlementRevisionConflictError();
      }

      const result = await this.executor.query<EntitlementProjectionRow>(
        UPSERT_PROJECTION_SQL,
        [
          projection.commercialAuthorityId,
          sourceRevision,
          projection.projectionSchemaVersion,
          projection.evaluatorPolicyVersion,
          projection.projectionStatus,
          projection.tier,
          projection.effectivePro,
          projection.effectiveFrom,
          projection.effectiveUntil,
          projection.currentSourceClasses,
          projection.currentSourceClass,
          projection.currentSourceEntityId,
          projection.paidCoverageEndAt,
          projection.graceUntil,
          projection.queuedReferralDurationUs,
          projection.currentReferralRewardId,
          projection.transitionToFreeAt,
          projection.adFree,
          projection.vaultCapacityClass,
          projection.astrologyAlertsEligibilityClass,
          projection.nextEvaluationAt,
          projection.computedAt
        ]
      );
      const row = result.rows[0];
      if (row !== undefined) {
        return normalizeProjectionRow(row);
      }

      const existing = await this.getByAuthority(projection.commercialAuthorityId);
      if (
        existing !== null &&
        BigInt(existing.sourceRevision) > BigInt(sourceRevision)
      ) {
        throw new EntitlementProjectionConflictError();
      }
      throw new EntitlementIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new EntitlementProjectionConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
