import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialTimestamp
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialOwnerNotFoundError,
  CommercialPersistenceIntegrityError,
  mapCommercialPersistenceFailure
} from '../commercial-persistence-errors.js';
import type { CommercialAuthorityRecord, PaidCoverageRecord } from '../repositories.js';
import {
  PAID_COVERAGE_COLUMNS_SQL,
  type PaidCoverageRow,
  mapPaidCoverageRow
} from './postgres-paid-persistence-shared.js';

export interface LockedReferralOwner {
  readonly ownerId: string;
  readonly authority: CommercialAuthorityRecord;
}

interface AuthorityRow {
  readonly commercial_authority_id: string;
  readonly owner_id: string;
  readonly entitlement_revision: string | number | bigint;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

interface OwnerRow {
  readonly user_id: string;
}

interface AuthorityOwnerRow {
  readonly owner_id: string;
}

interface BooleanRow {
  readonly has_successful_first_purchase: boolean;
}

interface PaidEventRow {
  readonly event_id: string;
  readonly commercial_authority_id: string;
  readonly event_type: string;
  readonly source_type: string;
  readonly effective_at: Date | string;
}

interface CountRow {
  readonly successful_first_purchase_count: string | number | bigint;
}

const LOCK_OWNER_SQL = `
  SELECT u.user_id
  FROM users AS u
  WHERE u.user_id = $1
  FOR KEY SHARE
`;

const LOCK_AUTHORITY_SQL = `
  SELECT
    ca.commercial_authority_id,
    ca.owner_id,
    ca.entitlement_revision,
    ca.created_at,
    ca.updated_at
  FROM commercial_authorities AS ca
  WHERE ca.owner_id = $1
  FOR UPDATE
`;

const FIND_AUTHORITY_OWNER_SQL = `
  SELECT ca.owner_id
  FROM commercial_authorities AS ca
  WHERE ca.commercial_authority_id = $1
`;

const FIND_SUCCESSFUL_FIRST_PURCHASE_SQL = `
  SELECT EXISTS (
    SELECT 1
    FROM paid_coverages AS pc
    JOIN commercial_events AS ce
      ON ce.event_id = pc.success_event_id
    WHERE pc.commercial_authority_id = $1
      AND ce.commercial_authority_id = pc.commercial_authority_id
      AND ce.source_type = 'PAID'
      AND ce.event_type = 'PAID_PURCHASE_SUCCEEDED'
  ) AS has_successful_first_purchase
`;

const FIND_PAID_SUCCESS_EVENT_SQL = `
  SELECT
    ce.event_id,
    ce.commercial_authority_id,
    ce.event_type,
    ce.source_type,
    ce.effective_at
  FROM commercial_events AS ce
  WHERE ce.event_id = $1
    AND ce.commercial_authority_id = $2
`;

const FIND_PAID_REVERSAL_EVENT_SQL = `
  SELECT
    ce.event_id,
    ce.commercial_authority_id,
    ce.event_type,
    ce.source_type,
    ce.effective_at
  FROM commercial_events AS ce
  WHERE ce.event_id = $1
    AND ce.commercial_authority_id = $2
`;

const COUNT_OTHER_SUCCESSFUL_FIRST_PURCHASES_SQL = `
  SELECT COUNT(*)::text AS successful_first_purchase_count
  FROM paid_coverages AS pc
  JOIN commercial_events AS ce
    ON ce.event_id = pc.success_event_id
  WHERE pc.commercial_authority_id = $1
    AND pc.paid_coverage_id <> $2
    AND ce.commercial_authority_id = pc.commercial_authority_id
    AND ce.source_type = 'PAID'
    AND ce.event_type = 'PAID_PURCHASE_SUCCEEDED'
`;

const LOCK_PAID_COVERAGES_SQL = `
  SELECT ${PAID_COVERAGE_COLUMNS_SQL}
  FROM paid_coverages AS pc
  WHERE pc.paid_coverage_id = ANY($1::text[])
  ORDER BY pc.paid_coverage_id ASC
  FOR UPDATE
`;

function mapAuthority(row: AuthorityRow): CommercialAuthorityRecord {
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

function normalizedOwnerIds(ownerIds: readonly string[]): readonly string[] {
  const normalized = [...new Set(ownerIds.map((value) =>
    assertCommercialIdentifier(value, 'ownerId')))].sort();
  if (normalized.length === 0) {
    throw new CommercialPersistenceIntegrityError();
  }
  return normalized;
}

/**
 * Acquires every live root lock first, then every authority lock, both in
 * lexical owner order. This deliberately does not call the single-owner
 * authority repository because that repository interleaves the two locks.
 */
export async function lockReferralOwners(
  executor: SqlExecutor,
  ownerIdsInput: readonly string[]
): Promise<readonly LockedReferralOwner[]> {
  const ownerIds = normalizedOwnerIds(ownerIdsInput);
  try {
    for (const ownerId of ownerIds) {
      const owner = await executor.query<OwnerRow>(LOCK_OWNER_SQL, [ownerId]);
      if (owner.rows.length !== 1) {
        throw new CommercialOwnerNotFoundError();
      }
    }

    const locked: LockedReferralOwner[] = [];
    for (const ownerId of ownerIds) {
      const authority = await executor.query<AuthorityRow>(LOCK_AUTHORITY_SQL, [
        ownerId
      ]);
      const row = authority.rows[0];
      if (row === undefined || authority.rows.length !== 1) {
        throw new CommercialAuthorityUnavailableError();
      }
      const mapped = mapAuthority(row);
      if (mapped.ownerId !== ownerId) {
        throw new CommercialAuthorityUnavailableError();
      }
      locked.push(Object.freeze({ ownerId, authority: mapped }));
    }
    return Object.freeze(locked);
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function findAuthorityOwner(
  executor: SqlExecutor,
  authorityIdInput: string
): Promise<string | null> {
  const authorityId = assertCommercialIdentifier(
    authorityIdInput,
    'commercialAuthorityId'
  );
  try {
    const result = await executor.query<AuthorityOwnerRow>(
      FIND_AUTHORITY_OWNER_SQL,
      [authorityId]
    );
    const row = result.rows[0];
    return row === undefined
      ? null
      : assertCommercialIdentifier(row.owner_id, 'ownerId');
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function hasSuccessfulFirstPurchase(
  executor: SqlExecutor,
  authorityIdInput: string
): Promise<boolean> {
  const authorityId = assertCommercialIdentifier(
    authorityIdInput,
    'commercialAuthorityId'
  );
  try {
    const result = await executor.query<BooleanRow>(
      FIND_SUCCESSFUL_FIRST_PURCHASE_SQL,
      [authorityId]
    );
    const row = result.rows[0];
    if (row === undefined || typeof row.has_successful_first_purchase !== 'boolean') {
      throw new CommercialPersistenceIntegrityError();
    }
    return row.has_successful_first_purchase;
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function requirePaidPurchaseSuccessEvent(
  executor: SqlExecutor,
  eventIdInput: string,
  authorityIdInput: string
): Promise<{ readonly eventId: string; readonly effectiveAt: string }> {
  const eventId = assertCommercialIdentifier(eventIdInput, 'eventId');
  const authorityId = assertCommercialIdentifier(
    authorityIdInput,
    'commercialAuthorityId'
  );
  try {
    const result = await executor.query<PaidEventRow>(
      FIND_PAID_SUCCESS_EVENT_SQL,
      [eventId, authorityId]
    );
    const row = result.rows[0];
    if (
      row === undefined ||
      row.source_type !== 'PAID' ||
      row.event_type !== 'PAID_PURCHASE_SUCCEEDED'
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
    return Object.freeze({
      eventId: assertCommercialIdentifier(row.event_id, 'eventId'),
      effectiveAt: assertCommercialTimestamp(row.effective_at, 'effectiveAt')
    });
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function requirePaidReversalEvent(
  executor: SqlExecutor,
  eventIdInput: string,
  authorityIdInput: string
): Promise<void> {
  const eventId = assertCommercialIdentifier(eventIdInput, 'reversalEventId');
  const authorityId = assertCommercialIdentifier(
    authorityIdInput,
    'referredAuthorityId'
  );
  try {
    const result = await executor.query<PaidEventRow>(
      FIND_PAID_REVERSAL_EVENT_SQL,
      [eventId, authorityId]
    );
    const row = result.rows[0];
    if (
      row === undefined ||
      row.source_type !== 'PAID' ||
      ![
        'PAID_COVERAGE_REFUNDED',
        'PAID_COVERAGE_CHARGEBACKED',
        'COMMERCIAL_CORRECTION_RECORDED'
      ].includes(row.event_type)
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function hasOtherSuccessfulFirstPurchase(
  executor: SqlExecutor,
  authorityIdInput: string,
  coverageIdInput: string
): Promise<boolean> {
  const authorityId = assertCommercialIdentifier(
    authorityIdInput,
    'commercialAuthorityId'
  );
  const coverageId = assertCommercialIdentifier(
    coverageIdInput,
    'paidCoverageId'
  );
  try {
    const result = await executor.query<CountRow>(
      COUNT_OTHER_SUCCESSFUL_FIRST_PURCHASES_SQL,
      [authorityId, coverageId]
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new CommercialPersistenceIntegrityError();
    }
    const count = BigInt(row.successful_first_purchase_count);
    if (count < 0n) {
      throw new CommercialPersistenceIntegrityError();
    }
    return count > 0n;
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function lockReferralPaidCoverages(
  executor: SqlExecutor,
  coverageIdsInput: readonly string[]
): Promise<readonly PaidCoverageRecord[]> {
  const coverageIds = [...new Set(coverageIdsInput.map((value) =>
    assertCommercialIdentifier(value, 'paidCoverageId')))].sort();
  if (coverageIds.length === 0) {
    return Object.freeze([]);
  }
  try {
    const result = await executor.query<PaidCoverageRow>(
      LOCK_PAID_COVERAGES_SQL,
      [coverageIds]
    );
    if (result.rows.length !== coverageIds.length) {
      throw new CommercialPersistenceIntegrityError();
    }
    return Object.freeze(result.rows.map(mapPaidCoverageRow));
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function databaseNow(executor: SqlExecutor): Promise<string> {
  const result = await executor.query<{ now: Date | string }>(
    'SELECT CURRENT_TIMESTAMP AS now'
  );
  const row = result.rows[0];
  if (row === undefined) {
    throw new CommercialPersistenceIntegrityError();
  }
  return assertCommercialTimestamp(row.now, 'authoritativeNow');
}
