import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialDigest,
  assertCommercialEventType,
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp,
  assertProviderContext,
  assertProviderEventId,
  assertProviderProcessingStatus,
  assertProviderReceiptFailureClass,
  assertProviderVerificationStatus,
  type CommercialEventType,
  type ProviderProcessingStatus,
  type ProviderReceiptFailureClass,
  type ProviderVerificationStatus
} from '../commercial-domain.js';
import {
  CommercialPersistenceIntegrityError,
  InvalidCommercialStateTransitionError,
  ProviderReceiptConflictError,
  ProviderReceiptNotFoundError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  ClaimProviderIngestionReceiptInput,
  ClaimProviderIngestionReceiptResult,
  ProviderIngestionReceiptRecord,
  ProviderIngestionReceiptRepository,
  TransitionProviderIngestionReceiptInput
} from '../repositories.js';

interface ProviderReceiptRow {
  provider_receipt_id: string;
  provider_namespace: string;
  provider_context: string;
  provider_event_id: string;
  verification_status: string;
  processing_status: string;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  attempt_count: number;
  normalized_event_type: string | null;
  operation_digest: string;
  failure_class: string | null;
  processed_at: Date | string | null;
  reconciled_at: Date | string | null;
}

const RECEIPT_COLUMNS_SQL = `
  provider_receipt_id,
  provider_namespace,
  provider_context,
  provider_event_id,
  verification_status,
  processing_status,
  first_seen_at,
  last_seen_at,
  attempt_count,
  normalized_event_type,
  operation_digest,
  failure_class,
  processed_at,
  reconciled_at
`;

const INSERT_RECEIPT_SQL = `
  INSERT INTO provider_ingestion_receipts (${RECEIPT_COLUMNS_SQL})
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1,
    NULL,
    $7,
    $8,
    NULL,
    NULL
  )
  ON CONFLICT (provider_namespace, provider_context, provider_event_id)
  DO NOTHING
  RETURNING ${RECEIPT_COLUMNS_SQL}
`;

const FIND_BY_PROVIDER_IDENTITY_SQL = `
  SELECT ${RECEIPT_COLUMNS_SQL}
  FROM provider_ingestion_receipts
  WHERE provider_namespace = $1
    AND provider_context = $2
    AND provider_event_id = $3
`;

const FIND_BY_RECEIPT_ID_SQL = `
  SELECT ${RECEIPT_COLUMNS_SQL}
  FROM provider_ingestion_receipts
  WHERE provider_receipt_id = $1
`;

const RECORD_DUPLICATE_SQL = `
  UPDATE provider_ingestion_receipts
  SET
    last_seen_at = CURRENT_TIMESTAMP,
    attempt_count = LEAST(
      attempt_count::bigint + 1,
      2147483647
    )::integer
  WHERE provider_receipt_id = $1
    AND operation_digest = $2
  RETURNING ${RECEIPT_COLUMNS_SQL}
`;

const TRANSITION_RECEIPT_SQL = `
  UPDATE provider_ingestion_receipts
  SET
    verification_status = $4,
    processing_status = $5,
    normalized_event_type = $6,
    failure_class = $7,
    processed_at = CASE
      WHEN $5 = 'PROCESSED' THEN CURRENT_TIMESTAMP
      ELSE NULL
    END,
    reconciled_at = CASE
      WHEN $3 = 'RECONCILIATION_PENDING' AND $5 = 'PROCESSED'
        THEN CURRENT_TIMESTAMP
      ELSE NULL
    END
  WHERE provider_receipt_id = $1
    AND verification_status = $2
    AND processing_status = $3
  RETURNING ${RECEIPT_COLUMNS_SQL}
`;

function mapReceiptRow(row: ProviderReceiptRow): ProviderIngestionReceiptRecord {
  if (
    !Number.isSafeInteger(row.attempt_count) ||
    row.attempt_count < 1 ||
    row.attempt_count > 2147483647
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  return Object.freeze({
    providerReceiptId: assertCommercialIdentifier(
      row.provider_receipt_id,
      'providerReceiptId'
    ),
    providerNamespace: assertCommercialNamespace(
      row.provider_namespace,
      'providerNamespace'
    ),
    providerContext: assertProviderContext(row.provider_context),
    providerEventId: assertProviderEventId(row.provider_event_id),
    verificationStatus: assertProviderVerificationStatus(
      row.verification_status
    ),
    processingStatus: assertProviderProcessingStatus(row.processing_status),
    firstSeenAt: assertCommercialTimestamp(row.first_seen_at, 'firstSeenAt'),
    lastSeenAt: assertCommercialTimestamp(row.last_seen_at, 'lastSeenAt'),
    attemptCount: row.attempt_count,
    normalizedEventType:
      row.normalized_event_type === null
        ? null
        : assertCommercialEventType(row.normalized_event_type),
    operationDigest: assertCommercialDigest(row.operation_digest),
    failureClass:
      row.failure_class === null
        ? null
        : assertProviderReceiptFailureClass(row.failure_class),
    processedAt: assertOptionalCommercialTimestamp(row.processed_at, 'processedAt'),
    reconciledAt: assertOptionalCommercialTimestamp(
      row.reconciled_at,
      'reconciledAt'
    )
  });
}

function initialReceiptState(input: ClaimProviderIngestionReceiptInput): {
  readonly verificationStatus: ProviderVerificationStatus;
  readonly processingStatus: ProviderProcessingStatus;
  readonly failureClass: ProviderReceiptFailureClass | null;
} {
  const verificationStatus = assertProviderVerificationStatus(
    input.verificationStatus
  );
  const failureClass =
    input.failureClass === null
      ? null
      : assertProviderReceiptFailureClass(input.failureClass);

  if (verificationStatus === 'VERIFIED' && failureClass === null) {
    return { verificationStatus, processingStatus: 'PENDING', failureClass };
  }
  if (
    verificationStatus === 'REJECTED' &&
    failureClass === 'VERIFICATION'
  ) {
    return {
      verificationStatus,
      processingStatus: 'FAILED_TERMINAL',
      failureClass
    };
  }
  if (
    verificationStatus === 'INDETERMINATE' &&
    failureClass === 'VERIFICATION'
  ) {
    return { verificationStatus, processingStatus: 'PENDING', failureClass };
  }

  throw new CommercialPersistenceIntegrityError();
}

function isAllowedTransition(
  expectedVerification: ProviderVerificationStatus,
  expectedProcessing: ProviderProcessingStatus,
  nextVerification: ProviderVerificationStatus,
  nextProcessing: ProviderProcessingStatus
): boolean {
  if (
    expectedVerification === 'INDETERMINATE' &&
    expectedProcessing === 'PENDING'
  ) {
    return (
      (nextVerification === 'VERIFIED' && nextProcessing === 'PENDING') ||
      (nextVerification === 'REJECTED' && nextProcessing === 'FAILED_TERMINAL')
    );
  }
  if (expectedVerification !== 'VERIFIED' || nextVerification !== 'VERIFIED') {
    return false;
  }
  if (expectedProcessing === 'PENDING') {
    return (
      nextProcessing === 'PROCESSED' ||
      nextProcessing === 'RECONCILIATION_PENDING' ||
      nextProcessing === 'FAILED_TERMINAL'
    );
  }
  return (
    expectedProcessing === 'RECONCILIATION_PENDING' &&
    (nextProcessing === 'PROCESSED' || nextProcessing === 'FAILED_TERMINAL')
  );
}

function validateTransitionShape(input: TransitionProviderIngestionReceiptInput): {
  readonly receiptId: string;
  readonly expectedVerification: ProviderVerificationStatus;
  readonly expectedProcessing: ProviderProcessingStatus;
  readonly nextVerification: ProviderVerificationStatus;
  readonly nextProcessing: ProviderProcessingStatus;
  readonly normalizedEventType: CommercialEventType | null;
  readonly failureClass: ProviderReceiptFailureClass | null;
} {
  const receiptId = assertCommercialIdentifier(
    input.providerReceiptId,
    'providerReceiptId'
  );
  const expectedVerification = assertProviderVerificationStatus(
    input.expectedVerificationStatus
  );
  const expectedProcessing = assertProviderProcessingStatus(
    input.expectedProcessingStatus
  );
  const nextVerification = assertProviderVerificationStatus(
    input.nextVerificationStatus
  );
  const nextProcessing = assertProviderProcessingStatus(
    input.nextProcessingStatus
  );
  const normalizedEventType =
    input.normalizedEventType === null
      ? null
      : assertCommercialEventType(input.normalizedEventType);
  const failureClass =
    input.failureClass === null
      ? null
      : assertProviderReceiptFailureClass(input.failureClass);

  if (
    !isAllowedTransition(
      expectedVerification,
      expectedProcessing,
      nextVerification,
      nextProcessing
    )
  ) {
    throw new InvalidCommercialStateTransitionError();
  }

  const validShape =
    (nextProcessing === 'PENDING' &&
      nextVerification === 'VERIFIED' &&
      normalizedEventType === null &&
      failureClass === null) ||
    (nextProcessing === 'PROCESSED' &&
      nextVerification === 'VERIFIED' &&
      normalizedEventType !== null &&
      failureClass === null) ||
    (nextProcessing === 'RECONCILIATION_PENDING' &&
      nextVerification === 'VERIFIED' &&
      normalizedEventType !== null &&
      (failureClass === 'ASSOCIATION' || failureClass === 'RECONCILIATION')) ||
    (nextProcessing === 'FAILED_TERMINAL' &&
      failureClass !== null &&
      (nextVerification !== 'REJECTED' || failureClass === 'VERIFICATION'));

  if (!validShape) {
    throw new InvalidCommercialStateTransitionError();
  }

  return {
    receiptId,
    expectedVerification,
    expectedProcessing,
    nextVerification,
    nextProcessing,
    normalizedEventType,
    failureClass
  };
}

/** Provider-neutral, transaction-composable replay receipt repository. */
export class PostgresProviderIngestionReceiptRepository
  implements ProviderIngestionReceiptRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async claimIdempotent(
    input: ClaimProviderIngestionReceiptInput
  ): Promise<ClaimProviderIngestionReceiptResult> {
    const providerReceiptId = assertCommercialIdentifier(
      input.providerReceiptId,
      'providerReceiptId'
    );
    const providerNamespace = assertCommercialNamespace(
      input.providerNamespace,
      'providerNamespace'
    );
    const providerContext = assertProviderContext(input.providerContext);
    const providerEventId = assertProviderEventId(input.providerEventId);
    const operationDigest = assertCommercialDigest(input.operationDigest);
    const state = initialReceiptState(input);

    try {
      const inserted = await this.executor.query<ProviderReceiptRow>(
        INSERT_RECEIPT_SQL,
        [
          providerReceiptId,
          providerNamespace,
          providerContext,
          providerEventId,
          state.verificationStatus,
          state.processingStatus,
          operationDigest,
          state.failureClass
        ]
      );
      const insertedRow = inserted.rows[0];
      if (insertedRow !== undefined) {
        return { outcome: 'CLAIMED', receipt: mapReceiptRow(insertedRow) };
      }

      const existing = await this.getByProviderIdentity(
        providerNamespace,
        providerContext,
        providerEventId
      );
      if (existing === null || existing.operationDigest !== operationDigest) {
        throw new ProviderReceiptConflictError();
      }

      const duplicate = await this.executor.query<ProviderReceiptRow>(
        RECORD_DUPLICATE_SQL,
        [existing.providerReceiptId, operationDigest]
      );
      const duplicateRow = duplicate.rows[0];
      if (duplicateRow === undefined) {
        throw new ProviderReceiptConflictError();
      }

      return { outcome: 'DUPLICATE', receipt: mapReceiptRow(duplicateRow) };
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new ProviderReceiptConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async transition(
    input: TransitionProviderIngestionReceiptInput
  ): Promise<ProviderIngestionReceiptRecord> {
    const transition = validateTransitionShape(input);

    try {
      const result = await this.executor.query<ProviderReceiptRow>(
        TRANSITION_RECEIPT_SQL,
        [
          transition.receiptId,
          transition.expectedVerification,
          transition.expectedProcessing,
          transition.nextVerification,
          transition.nextProcessing,
          transition.normalizedEventType,
          transition.failureClass
        ]
      );
      const row = result.rows[0];
      if (row !== undefined) {
        return mapReceiptRow(row);
      }

      const current = await this.executor.query<ProviderReceiptRow>(
        FIND_BY_RECEIPT_ID_SQL,
        [transition.receiptId]
      );
      if (current.rows.length === 0) {
        throw new ProviderReceiptNotFoundError();
      }
      throw new InvalidCommercialStateTransitionError();
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByProviderIdentity(
    providerNamespaceInput: string,
    providerContextInput: string,
    providerEventIdInput: string
  ): Promise<ProviderIngestionReceiptRecord | null> {
    const providerNamespace = assertCommercialNamespace(
      providerNamespaceInput,
      'providerNamespace'
    );
    const providerContext = assertProviderContext(providerContextInput);
    const providerEventId = assertProviderEventId(providerEventIdInput);

    try {
      const result = await this.executor.query<ProviderReceiptRow>(
        FIND_BY_PROVIDER_IDENTITY_SQL,
        [providerNamespace, providerContext, providerEventId]
      );
      const row = result.rows[0];
      return row === undefined ? null : mapReceiptRow(row);
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
