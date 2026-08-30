import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialRevision,
  assertPaidBillingInterval,
  assertPaidCoverageReversalReason,
  assertPaidCoverageState,
  type CommercialEventType,
  type PaidCoverageState
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  PaidCoverageConflictError,
  PaidCoverageNotFoundError,
  PaidCoverageReversalConflictError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  ApplyPaidCoverageReversalInput,
  CommercialTimestampInput,
  CreatePaidCoverageInput,
  CreatePendingPaidCoverageReversalInput,
  EndPaidCoverageInput,
  PaidCoverageOwnerScope,
  PaidCoverageRecord,
  PaidCoverageReversalRecord,
  PaidCoverageRepository
} from '../repositories.js';
import {
  PAID_COVERAGE_COLUMNS_SQL,
  PAID_COVERAGE_REVERSAL_INTENT_COLUMNS_SQL,
  type PaidCoverageRow,
  type PaidCoverageReversalIntentRow,
  assertCoverageInterval,
  assertLiveOwnerAndAuthority,
  mapPaidCoverageRow,
  mapPaidCoverageReversalIntentRow,
  requirePaidCommercialEvent,
  timestampParameter
} from './postgres-paid-persistence-shared.js';
import { PostgresPaidBillingRelationshipRepository } from './postgres-paid-billing-relationship-repository.js';

const PAID_SUCCESS_EVENT_TYPES: readonly CommercialEventType[] = [
  'PAID_PURCHASE_SUCCEEDED',
  'PAID_RENEWAL_SUCCEEDED'
];

const PAID_REVERSAL_EVENT_TYPES: readonly CommercialEventType[] = [
  'PAID_COVERAGE_REFUNDED',
  'PAID_COVERAGE_CHARGEBACKED',
  'COMMERCIAL_CORRECTION_RECORDED'
];

const FIND_COVERAGE_BY_ID_SQL = `
  SELECT ${PAID_COVERAGE_COLUMNS_SQL}
  FROM paid_coverages
  WHERE paid_coverage_id = $1
`;

const FIND_COVERAGE_BY_PURCHASE_SQL = `
  SELECT ${PAID_COVERAGE_COLUMNS_SQL}
  FROM paid_coverages
  WHERE commercial_authority_id = $1
    AND purchase_namespace = $2
    AND purchase_identity = $3
`;

const FIND_PENDING_REVERSAL_SQL = `
  SELECT ${PAID_COVERAGE_REVERSAL_INTENT_COLUMNS_SQL}
  FROM paid_coverage_reversal_intents
  WHERE commercial_authority_id = $1
    AND purchase_namespace = $2
    AND purchase_identity = $3
`;

const FIND_COVERAGES_BY_RELATIONSHIP_SQL = `
  SELECT ${PAID_COVERAGE_COLUMNS_SQL}
  FROM paid_coverages
  WHERE commercial_authority_id = $1
    AND paid_relationship_id = $2
  ORDER BY coverage_start_at ASC, paid_coverage_id ASC
`;

const LOCK_COVERAGE_SQL = `
  SELECT ${PAID_COVERAGE_COLUMNS_SQL}
  FROM paid_coverages
  WHERE paid_coverage_id = $1
    AND paid_relationship_id = $2
    AND commercial_authority_id = $3
  FOR UPDATE
`;

const INSERT_COVERAGE_SQL = `
  INSERT INTO paid_coverages (
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
    source_revision
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7::timestamptz,
    $8::timestamptz,
    $8::timestamptz,
    'VALID',
    $9,
    $10::bigint
  )
  RETURNING ${PAID_COVERAGE_COLUMNS_SQL}
`;

const INSERT_REVERSED_COVERAGE_SQL = `
  INSERT INTO paid_coverages (
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
    source_revision
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7::timestamptz,
    $8::timestamptz,
    GREATEST(
      $7::timestamptz,
      LEAST($8::timestamptz, $9::timestamptz)
    ),
    'REVERSED',
    $10,
    $11,
    $12::timestamptz,
    $13,
    $14::bigint
  )
  RETURNING ${PAID_COVERAGE_COLUMNS_SQL}
`;

const INSERT_PENDING_REVERSAL_SQL = `
  INSERT INTO paid_coverage_reversal_intents (
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
    source_revision
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8::timestamptz,
    $9,
    $10::timestamptz,
    $11::bigint
  )
  RETURNING ${PAID_COVERAGE_REVERSAL_INTENT_COLUMNS_SQL}
`;

const DELETE_PENDING_REVERSAL_SQL = `
  DELETE FROM paid_coverage_reversal_intents
  WHERE paid_coverage_reversal_id = $1
`;

const APPLY_REVERSAL_SQL = `
  UPDATE paid_coverages
  SET
    effective_coverage_end_at = GREATEST(
      coverage_start_at,
      LEAST(effective_coverage_end_at, $5::timestamptz)
    ),
    coverage_state = 'REVERSED',
    reversal_event_id = $6,
    reversed_at = $7::timestamptz,
    reversal_reason = $8,
    source_revision = $9::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE paid_coverage_id = $1
    AND paid_relationship_id = $2
    AND commercial_authority_id = $3
    AND coverage_state = $4
    AND reversal_event_id IS NULL
  RETURNING ${PAID_COVERAGE_COLUMNS_SQL}
`;

const END_COVERAGE_SQL = `
  UPDATE paid_coverages
  SET
    effective_coverage_end_at = GREATEST(
      coverage_start_at,
      LEAST(effective_coverage_end_at, $5::timestamptz)
    ),
    coverage_state = 'ENDED',
    source_revision = $6::bigint,
    updated_at = CURRENT_TIMESTAMP
  WHERE paid_coverage_id = $1
    AND paid_relationship_id = $2
    AND commercial_authority_id = $3
    AND coverage_state = $4
  RETURNING ${PAID_COVERAGE_COLUMNS_SQL}
`;

function validateOwnerScope(input: PaidCoverageOwnerScope): readonly string[] {
  return [
    assertCommercialIdentifier(input.paidCoverageId, 'paidCoverageId'),
    assertCommercialIdentifier(input.paidRelationshipId, 'paidRelationshipId'),
    assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    ),
    assertCommercialIdentifier(input.ownerId, 'ownerId')
  ];
}

function normalizeCoverageTimestamp(
  value: CommercialTimestampInput,
  fieldName: string
): string {
  const normalized = timestampParameter(value, fieldName);
  if (normalized === null) {
    throw new CommercialPersistenceIntegrityError();
  }
  return normalized;
}

function validateCoverageState(value: PaidCoverageState): PaidCoverageState {
  return assertPaidCoverageState(value);
}

/**
 * Transaction-scoped repository for attributable PaidCoverage. Original
 * interval and success provenance are immutable; only bounded state-local
 * ending or reversal fields may change.
 */
export class PostgresPaidCoverageRepository implements PaidCoverageRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async createAttributable(
    input: CreatePaidCoverageInput
  ): Promise<PaidCoverageRecord> {
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const paidRelationshipId = assertCommercialIdentifier(
      input.paidRelationshipId,
      'paidRelationshipId'
    );
    const paidCoverageId = assertCommercialIdentifier(
      input.paidCoverageId,
      'paidCoverageId'
    );
    const purchaseNamespace = assertCommercialNamespace(
      input.purchaseNamespace,
      'purchaseNamespace'
    );
    const purchaseIdentity = assertCommercialIdentifier(
      input.purchaseIdentity,
      'purchaseIdentity'
    );
    const billingInterval = assertPaidBillingInterval(input.billingInterval);
    const coverageStartAt = normalizeCoverageTimestamp(
      input.coverageStartAt,
      'coverageStartAt'
    );
    const scheduledCoverageEndAt = normalizeCoverageTimestamp(
      input.scheduledCoverageEndAt,
      'scheduledCoverageEndAt'
    );
    assertCoverageInterval(
      coverageStartAt,
      scheduledCoverageEndAt,
      scheduledCoverageEndAt
    );
    const successEventId = assertCommercialIdentifier(
      input.successEventId,
      'successEventId'
    );
    const sourceRevision = assertCommercialRevision(input.sourceRevision);

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      const relationshipRepository = new PostgresPaidBillingRelationshipRepository(
        this.executor
      );
      const relationship = await relationshipRepository.getById(
        paidRelationshipId
      );
      if (
        relationship === null ||
        relationship.commercialAuthorityId !== commercialAuthorityId
      ) {
        throw new PaidCoverageConflictError();
      }
      if (relationship.billingInterval !== billingInterval) {
        throw new PaidCoverageConflictError();
      }
      await requirePaidCommercialEvent(
        this.executor,
        successEventId,
        commercialAuthorityId,
        PAID_SUCCESS_EVENT_TYPES
      );

      const pendingReversal = await this.getPendingReversal(
        commercialAuthorityId,
        purchaseNamespace,
        purchaseIdentity
      );
      if (pendingReversal !== null) {
        if (pendingReversal.paidCoverageId !== paidCoverageId) {
          throw new PaidCoverageConflictError();
        }
        const reversedInsert = await this.executor.query<PaidCoverageRow>(
          INSERT_REVERSED_COVERAGE_SQL,
          [
            paidCoverageId,
            paidRelationshipId,
            commercialAuthorityId,
            purchaseNamespace,
            purchaseIdentity,
            billingInterval,
            coverageStartAt,
            scheduledCoverageEndAt,
            pendingReversal.effectiveCoverageEndAt,
            successEventId,
            pendingReversal.reversalEventId,
            pendingReversal.reversedAt,
            pendingReversal.reversalReason,
            sourceRevision
          ]
        );
        const reversedRow = reversedInsert.rows[0];
        if (reversedRow === undefined) {
          throw new PaidCoverageConflictError();
        }
        await this.executor.query<never>(DELETE_PENDING_REVERSAL_SQL, [
          pendingReversal.paidCoverageReversalId
        ]);
        return mapPaidCoverageRow(reversedRow);
      }

      const inserted = await this.executor.query<PaidCoverageRow>(
        INSERT_COVERAGE_SQL,
        [
          paidCoverageId,
          paidRelationshipId,
          commercialAuthorityId,
          purchaseNamespace,
          purchaseIdentity,
          billingInterval,
          coverageStartAt,
          scheduledCoverageEndAt,
          successEventId,
          sourceRevision
        ]
      );
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapPaidCoverageRow(row);
      }

      const existingByPurchase = await this.getByPurchaseIdentity(
        commercialAuthorityId,
        purchaseNamespace,
        purchaseIdentity
      );
      if (existingByPurchase !== null) {
        throw new PaidCoverageConflictError();
      }
      const existingById = await this.getById(paidCoverageId);
      if (existingById !== null) {
        throw new PaidCoverageConflictError();
      }
      throw new CommercialPersistenceIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new PaidCoverageConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getById(
    paidCoverageIdInput: string
  ): Promise<PaidCoverageRecord | null> {
    const paidCoverageId = assertCommercialIdentifier(
      paidCoverageIdInput,
      'paidCoverageId'
    );

    try {
      const result = await this.executor.query<PaidCoverageRow>(
        FIND_COVERAGE_BY_ID_SQL,
        [paidCoverageId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapPaidCoverageRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByPurchaseIdentity(
    commercialAuthorityIdInput: string,
    purchaseNamespaceInput: string,
    purchaseIdentityInput: string
  ): Promise<PaidCoverageRecord | null> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    const purchaseNamespace = assertCommercialNamespace(
      purchaseNamespaceInput,
      'purchaseNamespace'
    );
    const purchaseIdentity = assertCommercialIdentifier(
      purchaseIdentityInput,
      'purchaseIdentity'
    );

    try {
      const result = await this.executor.query<PaidCoverageRow>(
        FIND_COVERAGE_BY_PURCHASE_SQL,
        [commercialAuthorityId, purchaseNamespace, purchaseIdentity]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapPaidCoverageRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getPendingReversal(
    commercialAuthorityIdInput: string,
    purchaseNamespaceInput: string,
    purchaseIdentityInput: string
  ): Promise<PaidCoverageReversalRecord | null> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    const purchaseNamespace = assertCommercialNamespace(
      purchaseNamespaceInput,
      'purchaseNamespace'
    );
    const purchaseIdentity = assertCommercialIdentifier(
      purchaseIdentityInput,
      'purchaseIdentity'
    );

    try {
      const result = await this.executor.query<PaidCoverageReversalIntentRow>(
        FIND_PENDING_REVERSAL_SQL,
        [commercialAuthorityId, purchaseNamespace, purchaseIdentity]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapPaidCoverageReversalIntentRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async recordPendingReversal(
    input: CreatePendingPaidCoverageReversalInput
  ): Promise<PaidCoverageReversalRecord> {
    const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      input.commercialAuthorityId,
      'commercialAuthorityId'
    );
    const paidCoverageReversalId = assertCommercialIdentifier(
      input.paidCoverageReversalId,
      'paidCoverageReversalId'
    );
    const paidCoverageId = assertCommercialIdentifier(
      input.paidCoverageId,
      'paidCoverageId'
    );
    const paidRelationshipId = assertCommercialIdentifier(
      input.paidRelationshipId,
      'paidRelationshipId'
    );
    const purchaseNamespace = assertCommercialNamespace(
      input.purchaseNamespace,
      'purchaseNamespace'
    );
    const purchaseIdentity = assertCommercialIdentifier(
      input.purchaseIdentity,
      'purchaseIdentity'
    );
    const reversalReason = assertPaidCoverageReversalReason(
      input.reversalReason
    );
    const effectiveCoverageEndAt = normalizeCoverageTimestamp(
      input.effectiveCoverageEndAt,
      'effectiveCoverageEndAt'
    );
    const sourceRevision = assertCommercialRevision(input.sourceRevision);
    const eventId = assertCommercialIdentifier(input.eventId, 'eventId');

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      const relationshipRepository = new PostgresPaidBillingRelationshipRepository(
        this.executor
      );
      const relationship = await relationshipRepository.getById(
        paidRelationshipId
      );
      if (
        relationship === null ||
        relationship.commercialAuthorityId !== commercialAuthorityId
      ) {
        throw new PaidCoverageConflictError();
      }
      const event = await requirePaidCommercialEvent(
        this.executor,
        eventId,
        commercialAuthorityId,
        PAID_REVERSAL_EVENT_TYPES
      );
      const inserted = await this.executor.query<PaidCoverageReversalIntentRow>(
        INSERT_PENDING_REVERSAL_SQL,
        [
          paidCoverageReversalId,
          paidCoverageId,
          paidRelationshipId,
          commercialAuthorityId,
          purchaseNamespace,
          purchaseIdentity,
          eventId,
          event.effectiveAt,
          reversalReason,
          effectiveCoverageEndAt,
          sourceRevision
        ]
      );
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapPaidCoverageReversalIntentRow(row);
      }

      const existing = await this.getPendingReversal(
        commercialAuthorityId,
        purchaseNamespace,
        purchaseIdentity
      );
      if (existing?.reversalEventId === eventId) {
        return existing;
      }
      if (existing !== null) {
        throw new PaidCoverageReversalConflictError();
      }
      throw new CommercialPersistenceIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new PaidCoverageReversalConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async listByRelationship(
    ownerIdInput: string,
    commercialAuthorityIdInput: string,
    paidRelationshipIdInput: string
  ): Promise<readonly PaidCoverageRecord[]> {
    const ownerId = assertCommercialIdentifier(ownerIdInput, 'ownerId');
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );
    const paidRelationshipId = assertCommercialIdentifier(
      paidRelationshipIdInput,
      'paidRelationshipId'
    );
    await assertLiveOwnerAndAuthority(
      this.executor,
      ownerId,
      commercialAuthorityId
    );

    try {
      const result = await this.executor.query<PaidCoverageRow>(
        FIND_COVERAGES_BY_RELATIONSHIP_SQL,
        [commercialAuthorityId, paidRelationshipId]
      );
      return Object.freeze(result.rows.map(mapPaidCoverageRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async lockForUpdate(
    input: PaidCoverageOwnerScope
  ): Promise<PaidCoverageRecord> {
    const [paidCoverageId, paidRelationshipId, commercialAuthorityId, ownerId] =
      validateOwnerScope(input);

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      const result = await this.executor.query<PaidCoverageRow>(
        LOCK_COVERAGE_SQL,
        [paidCoverageId, paidRelationshipId, commercialAuthorityId]
      );
      const row = result.rows[0];
      if (row === undefined) {
        const existing = await this.getById(paidCoverageId);
        if (existing !== null) {
          throw new PaidCoverageConflictError();
        }
        throw new PaidCoverageNotFoundError();
      }
      return mapPaidCoverageRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async applyReversal(
    input: ApplyPaidCoverageReversalInput
  ): Promise<PaidCoverageRecord> {
    const [paidCoverageId, paidRelationshipId, commercialAuthorityId, ownerId] =
      validateOwnerScope(input);
    const expectedCoverageState = validateCoverageState(input.expectedCoverageState);
    if (expectedCoverageState === 'REVERSED') {
      throw new PaidCoverageReversalConflictError();
    }
    const reversalEventId = assertCommercialIdentifier(
      input.reversalEventId,
      'reversalEventId'
    );
    const reversedAt = normalizeCoverageTimestamp(input.reversedAt, 'reversedAt');
    const reversalReason = assertPaidCoverageReversalReason(input.reversalReason);
    const effectiveCoverageEndAt = normalizeCoverageTimestamp(
      input.effectiveCoverageEndAt,
      'effectiveCoverageEndAt'
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
        reversalEventId,
        commercialAuthorityId,
        PAID_REVERSAL_EVENT_TYPES
      );
      const result = await this.executor.query<PaidCoverageRow>(
        APPLY_REVERSAL_SQL,
        [
          paidCoverageId,
          paidRelationshipId,
          commercialAuthorityId,
          expectedCoverageState,
          effectiveCoverageEndAt,
          reversalEventId,
          reversedAt,
          reversalReason,
          sourceRevision
        ]
      );
      const row = result.rows[0];
      if (row === undefined) {
        const existing = await this.getById(paidCoverageId);
        if (existing?.reversalEventId === reversalEventId) {
          return existing;
        }
        if (existing !== null) {
          throw new PaidCoverageReversalConflictError();
        }
        throw new PaidCoverageNotFoundError();
      }
      return mapPaidCoverageRow(row);
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new PaidCoverageReversalConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async end(input: EndPaidCoverageInput): Promise<PaidCoverageRecord> {
    const [paidCoverageId, paidRelationshipId, commercialAuthorityId, ownerId] =
      validateOwnerScope(input);
    const expectedCoverageState = validateCoverageState(input.expectedCoverageState);
    if (expectedCoverageState === 'REVERSED') {
      throw new PaidCoverageReversalConflictError();
    }
    const effectiveCoverageEndAt = normalizeCoverageTimestamp(
      input.effectiveCoverageEndAt,
      'effectiveCoverageEndAt'
    );
    const sourceRevision = assertCommercialRevision(input.sourceRevision);
    const eventId = assertCommercialIdentifier(input.eventId, 'eventId');

    try {
      await assertLiveOwnerAndAuthority(
        this.executor,
        ownerId,
        commercialAuthorityId
      );
      await requirePaidCommercialEvent(
        this.executor,
        eventId,
        commercialAuthorityId,
        ['PAID_COVERAGE_ENDED']
      );
      const result = await this.executor.query<PaidCoverageRow>(
        END_COVERAGE_SQL,
        [
          paidCoverageId,
          paidRelationshipId,
          commercialAuthorityId,
          expectedCoverageState,
          effectiveCoverageEndAt,
          sourceRevision
        ]
      );
      const row = result.rows[0];
      if (row === undefined) {
        const existing = await this.getById(paidCoverageId);
        if (existing?.coverageState === 'ENDED') {
          return existing;
        }
        if (existing !== null) {
          throw new PaidCoverageConflictError();
        }
        throw new PaidCoverageNotFoundError();
      }
      return mapPaidCoverageRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
