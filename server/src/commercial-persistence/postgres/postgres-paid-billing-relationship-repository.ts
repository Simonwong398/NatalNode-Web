import type { SqlExecutor } from '../../db/index.js';
import {
  COMMERCIAL_EVENT_TYPES,
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialRevision,
  assertPaidBillingInterval,
  assertPaidRelationshipEndReason,
  assertPaidRelationshipLifecycleState,
  assertPaidRenewalIntent,
  type CommercialEventType
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  PaidRelationshipConflictError,
  PaidRelationshipNotFoundError,
  PaidRelationshipTransitionConflictError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  CommercialTimestampInput,
  CreatePendingPaidBillingRelationshipInput,
  PaidBillingRelationshipRecord,
  PaidBillingRelationshipRepository,
  PaidRelationshipOwnerScope,
  TransitionPaidBillingRelationshipInput
} from '../repositories.js';
import {
  PAID_RELATIONSHIP_COLUMNS_SQL as RELATIONSHIP_COLUMNS_SQL,
  assertLiveOwnerAndAuthority,
  assertPaidRelationshipStateShape,
  assertPaidRelationshipTransition,
  mapPaidRelationshipRow,
  optionalIdentifier,
  optionalNamespace,
  requirePaidCommercialEvent,
  timestampParameter
} from './postgres-paid-persistence-shared.js';
import type { PaidRelationshipRow } from './postgres-paid-persistence-shared.js';

const PAID_EVENT_TYPES: readonly CommercialEventType[] = COMMERCIAL_EVENT_TYPES.filter(
  (eventType): eventType is CommercialEventType =>
    eventType.startsWith('PAID_') || eventType === 'COMMERCIAL_CORRECTION_RECORDED'
);

const FIND_RELATIONSHIP_BY_ID_SQL = `
  SELECT ${RELATIONSHIP_COLUMNS_SQL}
  FROM paid_billing_relationships
  WHERE paid_relationship_id = $1
`;

const FIND_RELATIONSHIPS_BY_AUTHORITY_SQL = `
  SELECT ${RELATIONSHIP_COLUMNS_SQL}
  FROM paid_billing_relationships
  WHERE commercial_authority_id = $1
  ORDER BY paid_relationship_id ASC
`;

const LOCK_RELATIONSHIP_SQL = `
  SELECT ${RELATIONSHIP_COLUMNS_SQL}
  FROM paid_billing_relationships
  WHERE paid_relationship_id = $1
    AND commercial_authority_id = $2
  FOR UPDATE
`;

const INSERT_PENDING_RELATIONSHIP_SQL = `
  INSERT INTO paid_billing_relationships (
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
    source_revision
  )
  VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_FIRST_PAYMENT', 'ENABLED',
          NULL, NULL, NULL, NULL, NULL, NULL, NULL, $7, $8)
  RETURNING ${RELATIONSHIP_COLUMNS_SQL}
`;

const TRANSITION_RELATIONSHIP_SQL = `
  UPDATE paid_billing_relationships
  SET
    lifecycle_state = $3,
    renewal_intent = $4,
    current_period_start = $5::timestamptz,
    current_period_end = $6::timestamptz,
    grace_started_at = $7::timestamptz,
    grace_until = $8::timestamptz,
    failed_renewal_identity = $9,
    ended_at = $10::timestamptz,
    end_reason = $11,
    last_reconciled_event_id = $12,
    source_revision = $13::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE paid_relationship_id = $1
    AND commercial_authority_id = $2
    AND lifecycle_state = $14
    AND renewal_intent = $15
  RETURNING ${RELATIONSHIP_COLUMNS_SQL}
`;

function normalizeProviderValues(input: {
  readonly providerNamespace: string | null;
  readonly providerContext: string | null;
  readonly providerRelationshipRef: string | null;
}): readonly [string | null, string | null, string | null] {
  const providerNamespace = optionalNamespace(
    input.providerNamespace,
    'providerNamespace'
  );
  const providerContext = optionalIdentifier(input.providerContext, 'providerContext');
  const providerRelationshipRef = optionalIdentifier(
    input.providerRelationshipRef,
    'providerRelationshipRef'
  );
  const values = [providerNamespace, providerContext, providerRelationshipRef];
  if (
    !values.every((value) => value === null) &&
    !values.every((value) => value !== null)
  ) {
    throw new CommercialPersistenceIntegrityError();
  }
  return [providerNamespace, providerContext, providerRelationshipRef];
}

function normalizeRelationshipTimestamp(
  value: CommercialTimestampInput | null,
  fieldName: string
): string | null {
  return timestampParameter(value, fieldName);
}

function validateScope(input: PaidRelationshipOwnerScope): readonly string[] {
  return [
    assertCommercialIdentifier(input.paidRelationshipId, 'paidRelationshipId'),
    assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    ),
    assertCommercialIdentifier(input.ownerId, 'ownerId')
  ];
}

function validateTransitionInput(input: TransitionPaidBillingRelationshipInput): {
  readonly paidRelationshipId: string;
  readonly commercialAuthorityId: string;
  readonly ownerId: string;
  readonly expectedLifecycleState: string;
  readonly expectedRenewalIntent: string;
  readonly nextLifecycleState: string;
  readonly nextRenewalIntent: string;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly graceStartedAt: string | null;
  readonly graceUntil: string | null;
  readonly failedRenewalIdentity: string | null;
  readonly endedAt: string | null;
  readonly endReason: TransitionPaidBillingRelationshipInput['endReason'];
  readonly lastReconciledEventId: string;
  readonly sourceRevision: string;
} {
  const [paidRelationshipId, commercialAuthorityId, ownerId] = validateScope(input);
  const expectedLifecycleState = assertPaidRelationshipLifecycleState(
    input.expectedLifecycleState
  );
  const expectedRenewalIntent = assertPaidRenewalIntent(input.expectedRenewalIntent);
  const nextLifecycleState = assertPaidRelationshipLifecycleState(
    input.nextLifecycleState
  );
  const nextRenewalIntent = assertPaidRenewalIntent(input.nextRenewalIntent);
  const currentPeriodStart = normalizeRelationshipTimestamp(
    input.currentPeriodStart,
    'currentPeriodStart'
  );
  const currentPeriodEnd = normalizeRelationshipTimestamp(
    input.currentPeriodEnd,
    'currentPeriodEnd'
  );
  const graceStartedAt = normalizeRelationshipTimestamp(
    input.graceStartedAt,
    'graceStartedAt'
  );
  const graceUntil = normalizeRelationshipTimestamp(input.graceUntil, 'graceUntil');
  const failedRenewalIdentity = optionalIdentifier(
    input.failedRenewalIdentity,
    'failedRenewalIdentity'
  );
  const endedAt = normalizeRelationshipTimestamp(input.endedAt, 'endedAt');
  const endReason =
    input.endReason === null
      ? null
      : assertPaidRelationshipEndReason(input.endReason);
  const lastReconciledEventId = assertCommercialIdentifier(
    input.lastReconciledEventId,
    'lastReconciledEventId'
  );
  const sourceRevision = assertCommercialRevision(input.sourceRevision);

  assertPaidRelationshipTransition(
    expectedLifecycleState,
    expectedRenewalIntent,
    nextLifecycleState,
    nextRenewalIntent
  );
  assertPaidRelationshipStateShape({
    lifecycleState: nextLifecycleState,
    renewalIntent: nextRenewalIntent,
    currentPeriodStart,
    currentPeriodEnd,
    graceStartedAt,
    graceUntil,
    failedRenewalIdentity,
    endedAt,
    endReason
  });

  return {
    paidRelationshipId,
    commercialAuthorityId,
    ownerId,
    expectedLifecycleState,
    expectedRenewalIntent,
    nextLifecycleState,
    nextRenewalIntent,
    currentPeriodStart,
    currentPeriodEnd,
    graceStartedAt,
    graceUntil,
    failedRenewalIdentity,
    endedAt,
    endReason,
    lastReconciledEventId,
    sourceRevision
  };
}

/**
 * Transaction-scoped repository for the normalized PaidBillingRelationship.
 * The caller owns BEGIN/COMMIT and must hold the authority lock before source
 * row mutation when composing a reconciliation transaction.
 */
export class PostgresPaidBillingRelationshipRepository
  implements PaidBillingRelationshipRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async createPending(
    input: CreatePendingPaidBillingRelationshipInput
  ): Promise<PaidBillingRelationshipRecord> {
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const paidRelationshipId = assertCommercialIdentifier(
      input.paidRelationshipId,
      'paidRelationshipId'
    );
    const [providerNamespace, providerContext, providerRelationshipRef] =
      normalizeProviderValues(input);
    const billingInterval = assertPaidBillingInterval(input.billingInterval);
    const lastReconciledEventId = assertCommercialIdentifier(
      input.lastReconciledEventId,
      'lastReconciledEventId'
    );
    const sourceRevision = assertCommercialRevision(input.sourceRevision);

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      await requirePaidCommercialEvent(
        this.executor,
        lastReconciledEventId,
        commercialAuthorityId,
        ['PAID_RELATIONSHIP_OPENED']
      );

      const inserted = await this.executor.query<PaidRelationshipRow>(
        INSERT_PENDING_RELATIONSHIP_SQL,
        [
          paidRelationshipId,
          commercialAuthorityId,
          providerNamespace,
          providerContext,
          providerRelationshipRef,
          billingInterval,
          lastReconciledEventId,
          sourceRevision
        ]
      );
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapPaidRelationshipRow(row);
      }

      const existing = await this.getById(paidRelationshipId);
      if (existing !== null) {
        throw new PaidRelationshipConflictError();
      }
      throw new CommercialPersistenceIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new PaidRelationshipConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getById(
    paidRelationshipIdInput: string
  ): Promise<PaidBillingRelationshipRecord | null> {
    const paidRelationshipId = assertCommercialIdentifier(
      paidRelationshipIdInput,
      'paidRelationshipId'
    );

    try {
      const result = await this.executor.query<PaidRelationshipRow>(
        FIND_RELATIONSHIP_BY_ID_SQL,
        [paidRelationshipId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapPaidRelationshipRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByAuthority(
    ownerIdInput: string,
    commercialAuthorityIdInput: string
  ): Promise<readonly PaidBillingRelationshipRecord[]> {
    const { commercialAuthorityId } = await assertLiveOwnerAndAuthority(
      this.executor,
      ownerIdInput,
      commercialAuthorityIdInput
    );

    try {
      const result = await this.executor.query<PaidRelationshipRow>(
        FIND_RELATIONSHIPS_BY_AUTHORITY_SQL,
        [commercialAuthorityId]
      );
      return Object.freeze(result.rows.map(mapPaidRelationshipRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockForUpdate(
    input: PaidRelationshipOwnerScope
  ): Promise<PaidBillingRelationshipRecord> {
    const [paidRelationshipId, commercialAuthorityId, ownerId] = validateScope(input);

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      const result = await this.executor.query<PaidRelationshipRow>(
        LOCK_RELATIONSHIP_SQL,
        [paidRelationshipId, commercialAuthorityId]
      );
      const row = result.rows[0];
      if (row === undefined) {
        const existing = await this.getById(paidRelationshipId);
        if (existing !== null) {
          throw new PaidRelationshipTransitionConflictError();
        }
        throw new PaidRelationshipNotFoundError();
      }
      return mapPaidRelationshipRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async transition(
    input: TransitionPaidBillingRelationshipInput
  ): Promise<PaidBillingRelationshipRecord> {
    const normalized = validateTransitionInput(input);

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        normalized.ownerId,
        normalized.commercialAuthorityId
      );
      await requirePaidCommercialEvent(
        this.executor,
        normalized.lastReconciledEventId,
        normalized.commercialAuthorityId,
        PAID_EVENT_TYPES
      );

      const result = await this.executor.query<PaidRelationshipRow>(
        TRANSITION_RELATIONSHIP_SQL,
        [
          normalized.paidRelationshipId,
          normalized.commercialAuthorityId,
          normalized.nextLifecycleState,
          normalized.nextRenewalIntent,
          normalized.currentPeriodStart,
          normalized.currentPeriodEnd,
          normalized.graceStartedAt,
          normalized.graceUntil,
          normalized.failedRenewalIdentity,
          normalized.endedAt,
          normalized.endReason,
          normalized.lastReconciledEventId,
          normalized.sourceRevision,
          normalized.expectedLifecycleState,
          normalized.expectedRenewalIntent
        ]
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new PaidRelationshipTransitionConflictError();
      }
      return mapPaidRelationshipRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
