import type { SqlExecutor } from '../../db/index.js';
import {
  PAID_RENEWAL_GRACE_HOURS,
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialRevision,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp,
  assertPaidBillingInterval,
  assertPaidCoverageReversalReason,
  assertPaidCoverageState,
  assertPaidRelationshipEndReason,
  assertPaidRelationshipLifecycleState,
  assertPaidRenewalIntent,
  type CommercialEventType,
  type PaidBillingInterval,
  type PaidCoverageReversalReason,
  type PaidCoverageState,
  type PaidRelationshipEndReason,
  type PaidRelationshipLifecycleState,
  type PaidRenewalIntent
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialOwnerNotFoundError,
  CommercialPersistenceIntegrityError,
  CommercialRevisionConflictError,
  PaidCommercialEventNotFoundError,
  PaidRelationshipTransitionConflictError,
  mapCommercialPersistenceFailure
} from '../commercial-persistence-errors.js';
import type {
  CommercialTimestampInput,
  PaidBillingRelationshipRecord,
  PaidCoverageRecord,
  PaidCoverageReversalRecord
} from '../repositories.js';

export interface PaidCommercialEventFact {
  readonly eventId: string;
  readonly commercialAuthorityId: string;
  readonly eventType: CommercialEventType;
  readonly effectiveAt: string;
}

export interface PaidRelationshipRow {
  paid_relationship_id: string;
  commercial_authority_id: string;
  provider_namespace: string | null;
  provider_context: string | null;
  provider_relationship_ref: string | null;
  billing_interval: string;
  lifecycle_state: string;
  renewal_intent: string;
  current_period_start: Date | string | null;
  current_period_end: Date | string | null;
  grace_started_at: Date | string | null;
  grace_until: Date | string | null;
  failed_renewal_identity: string | null;
  ended_at: Date | string | null;
  end_reason: string | null;
  last_reconciled_event_id: string;
  source_revision: string | number | bigint;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PaidCoverageRow {
  paid_coverage_id: string;
  paid_relationship_id: string;
  commercial_authority_id: string;
  purchase_namespace: string;
  purchase_identity: string;
  billing_interval: string;
  coverage_start_at: Date | string;
  scheduled_coverage_end_at: Date | string;
  effective_coverage_end_at: Date | string;
  coverage_state: string;
  success_event_id: string;
  reversal_event_id: string | null;
  reversed_at: Date | string | null;
  reversal_reason: string | null;
  source_revision: string | number | bigint;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PaidCoverageReversalIntentRow {
  paid_coverage_reversal_id: string;
  paid_coverage_id: string;
  paid_relationship_id: string;
  commercial_authority_id: string;
  purchase_namespace: string;
  purchase_identity: string;
  reversal_event_id: string;
  reversed_at: Date | string;
  reversal_reason: string;
  effective_coverage_end_at: Date | string;
  source_revision: string | number | bigint;
  created_at: Date | string;
  updated_at: Date | string;
}

export const PAID_RELATIONSHIP_COLUMNS_SQL = `
  paid_relationship_id,
  commercial_authority_id,
  provider_namespace,
  provider_context,
  provider_relationship_ref,
  billing_interval,
  lifecycle_state,
  renewal_intent,
  current_period_start,
  current_period_end,
  grace_started_at,
  grace_until,
  failed_renewal_identity,
  ended_at,
  end_reason,
  last_reconciled_event_id,
  source_revision,
  created_at,
  updated_at
`;

export const PAID_COVERAGE_COLUMNS_SQL = `
  paid_coverage_id,
  paid_relationship_id,
  commercial_authority_id,
  purchase_namespace,
  purchase_identity,
  billing_interval,
  coverage_start_at,
  scheduled_coverage_end_at,
  effective_coverage_end_at,
  coverage_state,
  success_event_id,
  reversal_event_id,
  reversed_at,
  reversal_reason,
  source_revision,
  created_at,
  updated_at
`;

export const PAID_COVERAGE_REVERSAL_INTENT_COLUMNS_SQL = `
  paid_coverage_reversal_id,
  paid_coverage_id,
  paid_relationship_id,
  commercial_authority_id,
  purchase_namespace,
  purchase_identity,
  reversal_event_id,
  reversed_at,
  reversal_reason,
  effective_coverage_end_at,
  source_revision,
  created_at,
  updated_at
`;

export const FIND_PAID_EVENT_SQL = `
  SELECT event_id, commercial_authority_id, event_type, effective_at
  FROM commercial_events
  WHERE event_id = $1
    AND commercial_authority_id = $2
    AND source_type = 'PAID'
`;

export const CHECK_LIVE_OWNER_SQL = `
  SELECT user_id
  FROM users
  WHERE user_id = $1
  FOR KEY SHARE
`;

export const CHECK_AUTHORITY_OWNER_SQL = `
  SELECT commercial_authority_id
  FROM commercial_authorities
  WHERE commercial_authority_id = $1
    AND owner_id = $2
`;

const CHECK_GRACE_BOUNDARY_SQL = `
  SELECT grace_until > CURRENT_TIMESTAMP AS grace_open
  FROM paid_billing_relationships
  WHERE paid_relationship_id = $1
`;

export function timestampParameter(
  value: CommercialTimestampInput | null,
  fieldName: string
): string | null {
  return value === null
    ? null
    : assertCommercialTimestamp(value, fieldName);
}

export function optionalIdentifier(
  value: unknown,
  fieldName: string
): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialIdentifier(value, fieldName);
}

export function optionalNamespace(
  value: unknown,
  fieldName: string
): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialNamespace(value, fieldName);
}

export function mapPaidRelationshipRow(
  row: PaidRelationshipRow
): PaidBillingRelationshipRecord {
  return Object.freeze({
    paidRelationshipId: assertCommercialIdentifier(
      row.paid_relationship_id,
      'paidRelationshipId'
    ),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    providerNamespace: optionalNamespace(
      row.provider_namespace,
      'providerNamespace'
    ),
    providerContext: optionalIdentifier(row.provider_context, 'providerContext'),
    providerRelationshipRef: optionalIdentifier(
      row.provider_relationship_ref,
      'providerRelationshipRef'
    ),
    billingInterval: assertPaidBillingInterval(row.billing_interval),
    lifecycleState: assertPaidRelationshipLifecycleState(row.lifecycle_state),
    renewalIntent: assertPaidRenewalIntent(row.renewal_intent),
    currentPeriodStart: assertOptionalCommercialTimestamp(
      row.current_period_start,
      'currentPeriodStart'
    ),
    currentPeriodEnd: assertOptionalCommercialTimestamp(
      row.current_period_end,
      'currentPeriodEnd'
    ),
    graceStartedAt: assertOptionalCommercialTimestamp(
      row.grace_started_at,
      'graceStartedAt'
    ),
    graceUntil: assertOptionalCommercialTimestamp(row.grace_until, 'graceUntil'),
    failedRenewalIdentity: optionalIdentifier(
      row.failed_renewal_identity,
      'failedRenewalIdentity'
    ),
    endedAt: assertOptionalCommercialTimestamp(row.ended_at, 'endedAt'),
    endReason:
      row.end_reason === null
        ? null
        : assertPaidRelationshipEndReason(row.end_reason),
    lastReconciledEventId: assertCommercialIdentifier(
      row.last_reconciled_event_id,
      'lastReconciledEventId'
    ),
    sourceRevision: assertCommercialRevision(row.source_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

export function mapPaidCoverageRow(row: PaidCoverageRow): PaidCoverageRecord {
  return Object.freeze({
    paidCoverageId: assertCommercialIdentifier(
      row.paid_coverage_id,
      'paidCoverageId'
    ),
    paidRelationshipId: assertCommercialIdentifier(
      row.paid_relationship_id,
      'paidRelationshipId'
    ),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    purchaseNamespace: assertCommercialNamespace(
      row.purchase_namespace,
      'purchaseNamespace'
    ),
    purchaseIdentity: assertCommercialIdentifier(
      row.purchase_identity,
      'purchaseIdentity'
    ),
    billingInterval: assertPaidBillingInterval(row.billing_interval),
    coverageStartAt: assertCommercialTimestamp(
      row.coverage_start_at,
      'coverageStartAt'
    ),
    scheduledCoverageEndAt: assertCommercialTimestamp(
      row.scheduled_coverage_end_at,
      'scheduledCoverageEndAt'
    ),
    effectiveCoverageEndAt: assertCommercialTimestamp(
      row.effective_coverage_end_at,
      'effectiveCoverageEndAt'
    ),
    coverageState: assertPaidCoverageState(row.coverage_state),
    successEventId: assertCommercialIdentifier(
      row.success_event_id,
      'successEventId'
    ),
    reversalEventId: optionalIdentifier(row.reversal_event_id, 'reversalEventId'),
    reversedAt: assertOptionalCommercialTimestamp(row.reversed_at, 'reversedAt'),
    reversalReason:
      row.reversal_reason === null
        ? null
        : assertPaidCoverageReversalReason(row.reversal_reason),
    sourceRevision: assertCommercialRevision(row.source_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

export function mapPaidCoverageReversalIntentRow(
  row: PaidCoverageReversalIntentRow
): PaidCoverageReversalRecord {
  return Object.freeze({
    paidCoverageReversalId: assertCommercialIdentifier(
      row.paid_coverage_reversal_id,
      'paidCoverageReversalId'
    ),
    paidCoverageId: assertCommercialIdentifier(
      row.paid_coverage_id,
      'paidCoverageId'
    ),
    paidRelationshipId: assertCommercialIdentifier(
      row.paid_relationship_id,
      'paidRelationshipId'
    ),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    purchaseNamespace: assertCommercialNamespace(
      row.purchase_namespace,
      'purchaseNamespace'
    ),
    purchaseIdentity: assertCommercialIdentifier(
      row.purchase_identity,
      'purchaseIdentity'
    ),
    reversalEventId: assertCommercialIdentifier(
      row.reversal_event_id,
      'reversalEventId'
    ),
    reversedAt: assertCommercialTimestamp(row.reversed_at, 'reversedAt'),
    reversalReason: assertPaidCoverageReversalReason(row.reversal_reason),
    effectiveCoverageEndAt: assertCommercialTimestamp(
      row.effective_coverage_end_at,
      'effectiveCoverageEndAt'
    ),
    sourceRevision: assertCommercialRevision(row.source_revision),
    createdAt: assertCommercialTimestamp(row.created_at, 'createdAt'),
    updatedAt: assertCommercialTimestamp(row.updated_at, 'updatedAt')
  });
}

export async function assertLiveOwnerAndAuthority(
  executor: SqlExecutor,
  ownerIdInput: string,
  commercialAuthorityIdInput: string
): Promise<{
  readonly ownerId: string;
  readonly commercialAuthorityId: string;
}> {
  const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
  const commercialAuthorityId = assertCommercialIdentifier(
    commercialAuthorityIdInput,
    'commercialAuthorityId'
  );

  try {
    const owner = await executor.query<{ user_id: string }>(
      CHECK_LIVE_OWNER_SQL,
      [ownerId]
    );
    if (owner.rows.length !== 1) {
      throw new CommercialOwnerNotFoundError();
    }

    const authority = await executor.query<{ commercial_authority_id: string }>(
      CHECK_AUTHORITY_OWNER_SQL,
      [commercialAuthorityId, ownerId]
    );
    if (authority.rows.length !== 1) {
      throw new CommercialAuthorityUnavailableError();
    }

    return { ownerId, commercialAuthorityId };
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export async function requirePaidCommercialEvent(
  executor: SqlExecutor,
  eventIdInput: string,
  commercialAuthorityIdInput: string,
  expectedEventTypes: readonly CommercialEventType[]
): Promise<PaidCommercialEventFact> {
  const eventId = assertCommercialIdentifier(eventIdInput, 'eventId');
  const commercialAuthorityId = assertCommercialIdentifier(
    commercialAuthorityIdInput,
    'commercialAuthorityId'
  );

  try {
    const result = await executor.query<{
      event_id: string;
      commercial_authority_id: string;
      event_type: string;
      effective_at: Date | string;
    }>(FIND_PAID_EVENT_SQL, [eventId, commercialAuthorityId]);
    const row = result.rows[0];
    if (row === undefined) {
      throw new PaidCommercialEventNotFoundError();
    }

    const eventType = row.event_type as CommercialEventType;
    if (!expectedEventTypes.includes(eventType)) {
      throw new PaidRelationshipTransitionConflictError();
    }

    return Object.freeze({
      eventId: assertCommercialIdentifier(row.event_id, 'eventId'),
      commercialAuthorityId: assertCommercialIdentifier(
        row.commercial_authority_id,
        'commercialAuthorityId'
      ),
      eventType,
      effectiveAt: assertCommercialTimestamp(row.effective_at, 'effectiveAt')
    });
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export function incrementRevision(revisionInput: string): string {
  const revision = BigInt(assertCommercialRevision(revisionInput));
  if (revision >= 9223372036854775807n) {
    throw new CommercialRevisionConflictError();
  }
  return (revision + 1n).toString();
}

export async function assertGraceBoundary(
  executor: SqlExecutor,
  paidRelationshipIdInput: string,
  shouldBeOpen: boolean
): Promise<void> {
  const paidRelationshipId = assertCommercialIdentifier(
    paidRelationshipIdInput,
    'paidRelationshipId'
  );
  try {
    const result = await executor.query<{ grace_open: boolean }>(
      CHECK_GRACE_BOUNDARY_SQL,
      [paidRelationshipId]
    );
    const row = result.rows[0];
    if (row === undefined || row.grace_open !== shouldBeOpen) {
      throw new PaidRelationshipTransitionConflictError();
    }
  } catch (error) {
    throw mapCommercialPersistenceFailure(error);
  }
}

export function exactGraceUntil(graceStartedAtInput: string): string {
  const graceStartedAt = Date.parse(graceStartedAtInput);
  if (!Number.isFinite(graceStartedAt)) {
    throw new CommercialPersistenceIntegrityError();
  }
  return new Date(
    graceStartedAt + PAID_RENEWAL_GRACE_HOURS * 60 * 60 * 1000
  ).toISOString();
}

function timestampMilliseconds(value: string | null): number | null {
  return value === null ? null : Date.parse(value);
}

export function assertPaidRelationshipStateShape(input: {
  readonly lifecycleState: PaidRelationshipLifecycleState;
  readonly renewalIntent: PaidRenewalIntent;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly graceStartedAt: string | null;
  readonly graceUntil: string | null;
  readonly failedRenewalIdentity: string | null;
  readonly endedAt: string | null;
  readonly endReason: PaidRelationshipEndReason | null;
}): void {
  const start = timestampMilliseconds(input.currentPeriodStart);
  const end = timestampMilliseconds(input.currentPeriodEnd);
  if (
    (start === null) !== (end === null) ||
    (start !== null && end !== null && !(start < end))
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  if (
    (input.lifecycleState === 'ACTIVE' ||
      input.lifecycleState === 'RECOVERY_GRACE') &&
    (start === null || end === null)
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  if (
    input.lifecycleState === 'PENDING_FIRST_PAYMENT' ||
    input.lifecycleState === 'FIRST_PAYMENT_FAILED'
  ) {
    if (
      input.renewalIntent !== 'ENABLED' ||
      start !== null ||
      end !== null ||
      input.graceStartedAt !== null ||
      input.graceUntil !== null ||
      input.endedAt !== null ||
      input.endReason !== null
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
  }

  if (input.lifecycleState === 'RECOVERY_GRACE') {
    if (
      input.renewalIntent !== 'ENABLED' ||
      input.graceStartedAt === null ||
      input.graceUntil === null ||
      Date.parse(input.graceUntil) - Date.parse(input.graceStartedAt) !==
        PAID_RENEWAL_GRACE_HOURS * 60 * 60 * 1000
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
  } else if (input.graceStartedAt !== null || input.graceUntil !== null) {
    throw new CommercialPersistenceIntegrityError();
  }

  if (input.lifecycleState === 'ENDED') {
    if (
      input.renewalIntent !== 'DISABLED' ||
      input.endedAt === null ||
      input.endReason === null
    ) {
      throw new CommercialPersistenceIntegrityError();
    }
  } else if (input.endedAt !== null || input.endReason !== null) {
    throw new CommercialPersistenceIntegrityError();
  }

  if (
    input.failedRenewalIdentity !== null &&
    (input.failedRenewalIdentity.length === 0 ||
      input.failedRenewalIdentity.length > 256 ||
      input.failedRenewalIdentity.trim() !== input.failedRenewalIdentity ||
      /[\u0000-\u001f\u007f]/u.test(input.failedRenewalIdentity))
  ) {
    throw new CommercialPersistenceIntegrityError();
  }
}

export function assertPaidRelationshipTransition(
  currentState: PaidRelationshipLifecycleState,
  currentIntent: PaidRenewalIntent,
  nextState: PaidRelationshipLifecycleState,
  nextIntent: PaidRenewalIntent
): void {
  const lifecycleChanged = currentState !== nextState;
  const intentChanged = currentIntent !== nextIntent;

  if (!lifecycleChanged && !intentChanged) {
    if (currentState !== 'ACTIVE') {
      throw new PaidRelationshipTransitionConflictError();
    }
    return;
  }

  if (
    currentState === 'PENDING_FIRST_PAYMENT' &&
    !['ACTIVE', 'FIRST_PAYMENT_FAILED'].includes(nextState)
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }
  if (
    currentState === 'ACTIVE' &&
    !['ACTIVE', 'RECOVERY_GRACE', 'ENDED'].includes(nextState)
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }
  if (
    currentState === 'RECOVERY_GRACE' &&
    !['ACTIVE', 'ENDED'].includes(nextState)
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }
  if (
    (currentState === 'ENDED' || currentState === 'FIRST_PAYMENT_FAILED') &&
    lifecycleChanged
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }

  if (
    intentChanged &&
    currentState !== 'ACTIVE' &&
    !(currentState === 'RECOVERY_GRACE' && nextState === 'ENDED')
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }
  if (
    nextState === 'RECOVERY_GRACE' &&
    nextIntent !== 'ENABLED'
  ) {
    throw new PaidRelationshipTransitionConflictError();
  }
  if (nextState === 'ENDED' && nextIntent !== 'DISABLED') {
    throw new PaidRelationshipTransitionConflictError();
  }
}

export function assertCoverageInterval(
  startInput: string,
  scheduledEndInput: string,
  effectiveEndInput: string
): void {
  const start = Date.parse(startInput);
  const scheduledEnd = Date.parse(scheduledEndInput);
  const effectiveEnd = Date.parse(effectiveEndInput);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(scheduledEnd) ||
    !Number.isFinite(effectiveEnd) ||
    start >= scheduledEnd ||
    effectiveEnd < start ||
    effectiveEnd > scheduledEnd
  ) {
    throw new CommercialPersistenceIntegrityError();
  }
}

export function assertOptionalCoverageBoundary(value: CommercialTimestampInput): string {
  return assertCommercialTimestamp(value, 'effectiveCoverageEndAt');
}

export function assertCoverageReversalState(
  state: PaidCoverageState,
  reversalEventId: string | null,
  reversedAt: string | null,
  reversalReason: PaidCoverageReversalReason | null
): void {
  const hasReversal =
    reversalEventId !== null || reversedAt !== null || reversalReason !== null;
  if ((state === 'REVERSED') !== hasReversal) {
    throw new CommercialPersistenceIntegrityError();
  }
  if (
    state === 'REVERSED' &&
    (reversalEventId === null || reversedAt === null || reversalReason === null)
  ) {
    throw new CommercialPersistenceIntegrityError();
  }
}
