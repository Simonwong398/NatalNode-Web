import type { SqlExecutor } from '../../db/index.js';
import {
  COMMERCIAL_EVENT_SCHEMA_VERSION,
  assertCanonicalCommercialAttributes,
  assertCommercialActorClass,
  assertCommercialDigest,
  assertCommercialEventType,
  assertCommercialIdentifier,
  assertCommercialNamespace,
  assertCommercialSourceType,
  assertCommercialTimestamp,
  assertOptionalCommercialTimestamp,
  assertPositiveVersion,
  assertProviderContext,
  assertProviderEventId
} from '../commercial-domain.js';
import {
  CommercialAuthorityUnavailableError,
  CommercialIdempotencyConflictError,
  CommercialPersistenceIntegrityError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  AppendCommercialEventInput,
  AppendCommercialEventResult,
  CommercialEventRecord,
  CommercialEventRepository
} from '../repositories.js';

interface CommercialEventRow {
  event_id: string;
  commercial_authority_id: string;
  event_type: string;
  source_type: string;
  source_entity_id: string;
  source_namespace: string;
  provider_namespace: string | null;
  provider_context: string | null;
  provider_event_id: string | null;
  provider_receipt_id: string | null;
  idempotency_namespace: string;
  idempotency_key: string;
  operation_digest: string;
  occurred_at: Date | string | null;
  effective_at: Date | string;
  ingested_at: Date | string;
  caused_by_event_id: string | null;
  corrects_event_id: string | null;
  reverses_event_id: string | null;
  attributes: unknown;
  attributes_version: number;
  schema_version: number;
  actor_class: string | null;
  actor_reference: string | null;
  owner_id?: string;
}

const EVENT_COLUMNS_SQL = `
  event_id,
  commercial_authority_id,
  event_type,
  source_type,
  source_entity_id,
  source_namespace,
  provider_namespace,
  provider_context,
  provider_event_id,
  provider_receipt_id,
  idempotency_namespace,
  idempotency_key,
  operation_digest,
  occurred_at,
  effective_at,
  ingested_at,
  caused_by_event_id,
  corrects_event_id,
  reverses_event_id,
  attributes,
  attributes_version,
  schema_version,
  actor_class,
  actor_reference
`;

const EVENT_COLUMNS_QUALIFIED_SQL = EVENT_COLUMNS_SQL
  .split(',')
  .map((column) => `event.${column.trim()}`)
  .join(',\n    ');

const APPEND_EVENT_SQL = `
  INSERT INTO commercial_events (${EVENT_COLUMNS_SQL})
  SELECT
    $1,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15::timestamptz,
    $16::timestamptz,
    CURRENT_TIMESTAMP,
    $17,
    $18,
    $19,
    $20::jsonb,
    $21,
    $22,
    $23,
    $24
  FROM commercial_authorities AS authority
  WHERE authority.commercial_authority_id = $3
    AND authority.owner_id = $2
    AND (
      $11::text IS NULL
      OR EXISTS (
        SELECT 1
        FROM provider_ingestion_receipts AS receipt
        WHERE receipt.provider_receipt_id = $11
          AND receipt.provider_namespace = $8
          AND receipt.provider_context = $9
          AND receipt.provider_event_id = $10
          AND receipt.verification_status = 'VERIFIED'
      )
    )
  ON CONFLICT (idempotency_namespace, idempotency_key) DO NOTHING
  RETURNING ${EVENT_COLUMNS_SQL}
`;

const FIND_BY_IDEMPOTENCY_SQL = `
  SELECT
    ${EVENT_COLUMNS_QUALIFIED_SQL},
    authority.owner_id
  FROM commercial_events AS event
  JOIN commercial_authorities AS authority
    ON authority.commercial_authority_id = event.commercial_authority_id
  WHERE event.idempotency_namespace = $1
    AND event.idempotency_key = $2
`;

const FIND_AUTHORITY_GUARD_SQL = `
  SELECT commercial_authority_id
  FROM commercial_authorities
  WHERE commercial_authority_id = $1
    AND owner_id = $2
`;

function optionalIdentifier(value: unknown, fieldName: string): string | null {
  return value === null || value === undefined
    ? null
    : assertCommercialIdentifier(value, fieldName);
}

function parseAttributes(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new CommercialPersistenceIntegrityError();
  }
}

function mapEventRow(row: CommercialEventRow): CommercialEventRecord {
  const schemaVersion = assertPositiveVersion(row.schema_version, 'schemaVersion');
  if (schemaVersion !== COMMERCIAL_EVENT_SCHEMA_VERSION) {
    throw new CommercialPersistenceIntegrityError();
  }

  return Object.freeze({
    eventId: assertCommercialIdentifier(row.event_id, 'eventId'),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    eventType: assertCommercialEventType(row.event_type),
    sourceType: assertCommercialSourceType(row.source_type),
    sourceEntityId: assertCommercialIdentifier(
      row.source_entity_id,
      'sourceEntityId'
    ),
    sourceNamespace: assertCommercialNamespace(
      row.source_namespace,
      'sourceNamespace'
    ),
    providerNamespace:
      row.provider_namespace === null
        ? null
        : assertCommercialNamespace(row.provider_namespace, 'providerNamespace'),
    providerContext:
      row.provider_context === null
        ? null
        : assertProviderContext(row.provider_context),
    providerEventId:
      row.provider_event_id === null
        ? null
        : assertProviderEventId(row.provider_event_id),
    providerReceiptId: optionalIdentifier(
      row.provider_receipt_id,
      'providerReceiptId'
    ),
    idempotencyNamespace: assertCommercialNamespace(
      row.idempotency_namespace,
      'idempotencyNamespace'
    ),
    idempotencyKey: assertCommercialIdentifier(
      row.idempotency_key,
      'idempotencyKey'
    ),
    operationDigest: assertCommercialDigest(row.operation_digest),
    occurredAt: assertOptionalCommercialTimestamp(row.occurred_at, 'occurredAt'),
    effectiveAt: assertCommercialTimestamp(row.effective_at, 'effectiveAt'),
    ingestedAt: assertCommercialTimestamp(row.ingested_at, 'ingestedAt'),
    causedByEventId: optionalIdentifier(row.caused_by_event_id, 'causedByEventId'),
    correctsEventId: optionalIdentifier(row.corrects_event_id, 'correctsEventId'),
    reversesEventId: optionalIdentifier(row.reverses_event_id, 'reversesEventId'),
    attributes: assertCanonicalCommercialAttributes(
      parseAttributes(row.attributes)
    ),
    attributesVersion: assertPositiveVersion(
      row.attributes_version,
      'attributesVersion'
    ),
    schemaVersion: COMMERCIAL_EVENT_SCHEMA_VERSION,
    actorClass:
      row.actor_class === null
        ? null
        : assertCommercialActorClass(row.actor_class),
    actorReference: optionalIdentifier(row.actor_reference, 'actorReference')
  });
}

function validateInput(input: AppendCommercialEventInput): readonly unknown[] {
  const eventId = assertCommercialIdentifier(input.eventId, 'eventId');
  const ownerId = assertCommercialIdentifier(input.ownerId, 'ownerId');
  const commercialAuthorityId = assertCommercialIdentifier(
    input.commercialAuthorityId,
    'commercialAuthorityId'
  );
  const providerNamespace =
    input.providerNamespace === null
      ? null
      : assertCommercialNamespace(input.providerNamespace, 'providerNamespace');
  const providerContext =
    input.providerContext === null
      ? null
      : assertProviderContext(input.providerContext);
  const providerEventId =
    input.providerEventId === null
      ? null
      : assertProviderEventId(input.providerEventId);
  const providerReceiptId = optionalIdentifier(
    input.providerReceiptId,
    'providerReceiptId'
  );
  const providerParts = [
    providerNamespace,
    providerContext,
    providerEventId,
    providerReceiptId
  ];
  if (
    !providerParts.every((value) => value === null) &&
    !providerParts.every((value) => value !== null)
  ) {
    throw new CommercialPersistenceIntegrityError();
  }

  const actorClass =
    input.actorClass === null
      ? null
      : assertCommercialActorClass(input.actorClass);
  const actorReference = optionalIdentifier(input.actorReference, 'actorReference');
  if ((actorClass === null) !== (actorReference === null)) {
    throw new CommercialPersistenceIntegrityError();
  }

  const correctsEventId = optionalIdentifier(
    input.correctsEventId,
    'correctsEventId'
  );
  const reversesEventId = optionalIdentifier(
    input.reversesEventId,
    'reversesEventId'
  );
  if (correctsEventId !== null && reversesEventId !== null) {
    throw new CommercialPersistenceIntegrityError();
  }

  const schemaVersion = assertPositiveVersion(input.schemaVersion, 'schemaVersion');
  if (schemaVersion !== COMMERCIAL_EVENT_SCHEMA_VERSION) {
    throw new CommercialPersistenceIntegrityError();
  }
  const attributes = assertCanonicalCommercialAttributes(input.attributes);

  return [
    eventId,
    ownerId,
    commercialAuthorityId,
    assertCommercialEventType(input.eventType),
    assertCommercialSourceType(input.sourceType),
    assertCommercialIdentifier(input.sourceEntityId, 'sourceEntityId'),
    assertCommercialNamespace(input.sourceNamespace, 'sourceNamespace'),
    providerNamespace,
    providerContext,
    providerEventId,
    providerReceiptId,
    assertCommercialNamespace(
      input.idempotencyNamespace,
      'idempotencyNamespace'
    ),
    assertCommercialIdentifier(input.idempotencyKey, 'idempotencyKey'),
    assertCommercialDigest(input.operationDigest),
    assertOptionalCommercialTimestamp(input.occurredAt, 'occurredAt'),
    assertCommercialTimestamp(input.effectiveAt, 'effectiveAt'),
    optionalIdentifier(input.causedByEventId, 'causedByEventId'),
    correctsEventId,
    reversesEventId,
    JSON.stringify(attributes),
    assertPositiveVersion(input.attributesVersion, 'attributesVersion'),
    schemaVersion,
    actorClass,
    actorReference
  ];
}

/** Caller-owned transaction repository; append is the only journal mutation. */
export class PostgresCommercialEventRepository
  implements CommercialEventRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async appendIdempotent(
    input: AppendCommercialEventInput
  ): Promise<AppendCommercialEventResult> {
    const params = validateInput(input);

    try {
      const inserted = await this.executor.query<CommercialEventRow>(
        APPEND_EVENT_SQL,
        params
      );
      const insertedRow = inserted.rows[0];
      if (insertedRow !== undefined) {
        return { outcome: 'APPENDED', event: mapEventRow(insertedRow) };
      }

      const existing = await this.findByIdempotencyIdentityWithOwner(
        input.idempotencyNamespace,
        input.idempotencyKey
      );
      if (existing !== null) {
        if (
          existing.ownerId !== input.ownerId ||
          existing.event.commercialAuthorityId !== input.commercialAuthorityId ||
          existing.event.operationDigest !== input.operationDigest
        ) {
          throw new CommercialIdempotencyConflictError();
        }

        return { outcome: 'DUPLICATE', event: existing.event };
      }

      const authority = await this.executor.query<{ commercial_authority_id: string }>(
        FIND_AUTHORITY_GUARD_SQL,
        [input.commercialAuthorityId, input.ownerId]
      );
      if (authority.rows.length !== 1) {
        throw new CommercialAuthorityUnavailableError();
      }

      throw new CommercialPersistenceIntegrityError();
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new CommercialIdempotencyConflictError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async getByIdempotencyIdentity(
    idempotencyNamespaceInput: string,
    idempotencyKeyInput: string
  ): Promise<CommercialEventRecord | null> {
    const result = await this.findByIdempotencyIdentityWithOwner(
      idempotencyNamespaceInput,
      idempotencyKeyInput
    );
    return result?.event ?? null;
  }

  private async findByIdempotencyIdentityWithOwner(
    idempotencyNamespaceInput: string,
    idempotencyKeyInput: string
  ): Promise<{ readonly event: CommercialEventRecord; readonly ownerId: string } | null> {
    const idempotencyNamespace = assertCommercialNamespace(
      idempotencyNamespaceInput,
      'idempotencyNamespace'
    );
    const idempotencyKey = assertCommercialIdentifier(
      idempotencyKeyInput,
      'idempotencyKey'
    );

    try {
      const result = await this.executor.query<CommercialEventRow>(
        FIND_BY_IDEMPOTENCY_SQL,
        [idempotencyNamespace, idempotencyKey]
      );
      const row = result.rows[0];
      if (row === undefined) {
        return null;
      }
      return {
        event: mapEventRow(row),
        ownerId: assertCommercialIdentifier(row.owner_id, 'ownerId')
      };
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
