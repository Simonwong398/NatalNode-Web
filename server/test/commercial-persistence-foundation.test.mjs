import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CommercialAuthorityUnavailableError,
  CommercialIdempotencyConflictError,
  CommercialOwnerNotFoundError,
  CommercialPersistenceIntegrityError,
  CommercialPersistenceUnavailableError,
  CommercialRevisionConflictError,
  COMMERCIAL_EVENT_TYPES,
  COMMERCIAL_SOURCE_TYPES,
  PROVIDER_PROCESSING_STATUSES,
  PROVIDER_VERIFICATION_STATUSES,
  PostgresCommercialAuthorityRepository,
  PostgresCommercialEventRepository,
  PostgresProviderIngestionReceiptRepository,
  ProviderReceiptConflictError,
  assertCanonicalCommercialAttributes,
  digestCanonicalCommercialOperation
} from '../dist/index.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATION_PATH = new URL(
  'server/db/migrations/0011_commercial_persistence_foundation.sql',
  REPOSITORY_ROOT
);
const EVENT_REPOSITORY_PATH = new URL(
  '../src/commercial-persistence/postgres/postgres-commercial-event-repository.ts',
  import.meta.url
);
const NOW = '2026-08-30T12:00:00.000Z';
const LATER = '2026-08-30T12:00:01.000Z';
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

function copyRow(row) {
  return row === undefined ? undefined : structuredClone(row);
}

class AuthorityExecutor {
  constructor() {
    this.users = new Set(['owner-a', 'owner-b']);
    this.authorities = new Map();
    this.calls = [];
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: [...params] });

    if (
      normalized.startsWith('SELECT user_id FROM users') &&
      normalized.endsWith('FOR KEY SHARE')
    ) {
      return {
        rows: this.users.has(params[0]) ? [{ user_id: params[0] }] : []
      };
    }

    if (normalized.startsWith('INSERT INTO commercial_authorities')) {
      const [commercialAuthorityId, ownerId] = params;
      const ownerExists = this.authorities.has(ownerId);
      const idExists = [...this.authorities.values()].some(
        (row) => row.commercial_authority_id === commercialAuthorityId
      );
      if (ownerExists || idExists) {
        return { rows: [] };
      }
      const row = {
        commercial_authority_id: commercialAuthorityId,
        owner_id: ownerId,
        entitlement_revision: '0',
        created_at: NOW,
        updated_at: NOW
      };
      this.authorities.set(ownerId, row);
      return { rows: [{ commercial_authority_id: commercialAuthorityId }] };
    }

    if (
      normalized.includes('FROM commercial_authorities') &&
      normalized.includes('WHERE owner_id = $1')
    ) {
      return {
        rows: [copyRow(this.authorities.get(params[0]))].filter(Boolean)
      };
    }

    if (normalized.startsWith('UPDATE commercial_authorities')) {
      const [commercialAuthorityId, ownerId, expectedRevision] = params;
      const row = this.authorities.get(ownerId);
      if (
        row === undefined ||
        row.commercial_authority_id !== commercialAuthorityId ||
        row.entitlement_revision !== expectedRevision
      ) {
        return { rows: [] };
      }
      row.entitlement_revision = (BigInt(row.entitlement_revision) + 1n).toString();
      row.updated_at = LATER;
      return { rows: [copyRow(row)] };
    }

    throw new Error(`Unexpected authority SQL: ${normalized}`);
  }
}

function commercialEventRow(params) {
  return {
    event_id: params[0],
    commercial_authority_id: params[2],
    event_type: params[3],
    source_type: params[4],
    source_entity_id: params[5],
    source_namespace: params[6],
    provider_namespace: params[7],
    provider_context: params[8],
    provider_event_id: params[9],
    provider_receipt_id: params[10],
    idempotency_namespace: params[11],
    idempotency_key: params[12],
    operation_digest: params[13],
    occurred_at: params[14],
    effective_at: params[15],
    ingested_at: NOW,
    caused_by_event_id: params[16],
    corrects_event_id: params[17],
    reverses_event_id: params[18],
    attributes: JSON.parse(params[19]),
    attributes_version: params[20],
    schema_version: params[21],
    actor_class: params[22],
    actor_reference: params[23]
  };
}

class EventExecutor {
  constructor() {
    this.authorities = new Map([
      ['authority-a', 'owner-a'],
      ['authority-b', 'owner-b']
    ]);
    this.receipts = new Map();
    this.eventsByIdempotency = new Map();
    this.calls = [];
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (normalized.startsWith('INSERT INTO commercial_events')) {
      const ownerMatches = this.authorities.get(params[2]) === params[1];
      const providerMatches =
        params[10] === null ||
        (
          this.receipts.get(params[10])?.verification_status === 'VERIFIED' &&
          this.receipts.get(params[10])?.provider_namespace === params[7] &&
          this.receipts.get(params[10])?.provider_context === params[8] &&
          this.receipts.get(params[10])?.provider_event_id === params[9]
        );
      const key = `${params[11]}:${params[12]}`;
      if (!ownerMatches || !providerMatches || this.eventsByIdempotency.has(key)) {
        return { rows: [] };
      }
      const row = commercialEventRow(params);
      this.eventsByIdempotency.set(key, row);
      return { rows: [copyRow(row)] };
    }

    if (
      normalized.includes('FROM commercial_events AS event') &&
      normalized.includes('JOIN commercial_authorities AS authority')
    ) {
      const row = this.eventsByIdempotency.get(`${params[0]}:${params[1]}`);
      return {
        rows: row === undefined
          ? []
          : [{ ...copyRow(row), owner_id: this.authorities.get(row.commercial_authority_id) }]
      };
    }

    if (
      normalized.startsWith('SELECT commercial_authority_id') &&
      normalized.includes('FROM commercial_authorities')
    ) {
      return {
        rows: this.authorities.get(params[0]) === params[1]
          ? [{ commercial_authority_id: params[0] }]
          : []
      };
    }

    throw new Error(`Unexpected event SQL: ${normalized}`);
  }
}

function eventInput(overrides = {}) {
  return {
    eventId: 'event-a',
    ownerId: 'owner-a',
    commercialAuthorityId: 'authority-a',
    eventType: 'PAID_RELATIONSHIP_OPENED',
    sourceType: 'PAID',
    sourceEntityId: 'paid-source-a',
    sourceNamespace: 'billing.adapter',
    providerNamespace: null,
    providerContext: null,
    providerEventId: null,
    providerReceiptId: null,
    idempotencyNamespace: 'paid.relationship',
    idempotencyKey: 'paid-source-a:opened',
    operationDigest: DIGEST_A,
    occurredAt: NOW,
    effectiveAt: NOW,
    causedByEventId: null,
    correctsEventId: null,
    reversesEventId: null,
    attributes: { relationship_identity: 'paid-source-a' },
    attributesVersion: 1,
    schemaVersion: 1,
    actorClass: 'SYSTEM',
    actorReference: 'commercial-service',
    ...overrides
  };
}

function receiptRow({
  receiptId = 'receipt-a',
  namespace = 'provider.test',
  context = 'sandbox',
  eventId = 'provider-event-a',
  digest = DIGEST_A,
  verification = 'VERIFIED',
  processing = verification === 'REJECTED' ? 'FAILED_TERMINAL' : 'PENDING',
  failure = verification === 'VERIFIED' ? null : 'VERIFICATION',
  attemptCount = 1,
  normalizedEventType = null,
  processedAt = null,
  reconciledAt = null
} = {}) {
  return {
    provider_receipt_id: receiptId,
    provider_namespace: namespace,
    provider_context: context,
    provider_event_id: eventId,
    verification_status: verification,
    processing_status: processing,
    first_seen_at: NOW,
    last_seen_at: attemptCount === 1 ? NOW : LATER,
    attempt_count: attemptCount,
    normalized_event_type: normalizedEventType,
    operation_digest: digest,
    failure_class: failure,
    processed_at: processedAt,
    reconciled_at: reconciledAt
  };
}

class ReceiptExecutor {
  constructor() {
    this.receiptsByIdentity = new Map();
    this.receiptsById = new Map();
    this.calls = [];
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (normalized.startsWith('INSERT INTO provider_ingestion_receipts')) {
      const key = `${params[1]}:${params[2]}:${params[3]}`;
      if (this.receiptsByIdentity.has(key) || this.receiptsById.has(params[0])) {
        return { rows: [] };
      }
      const row = receiptRow({
        receiptId: params[0],
        namespace: params[1],
        context: params[2],
        eventId: params[3],
        verification: params[4],
        processing: params[5],
        digest: params[6],
        failure: params[7]
      });
      this.receiptsByIdentity.set(key, row);
      this.receiptsById.set(row.provider_receipt_id, row);
      return { rows: [copyRow(row)] };
    }

    if (
      normalized.startsWith('SELECT provider_receipt_id') &&
      normalized.includes('WHERE provider_namespace = $1')
    ) {
      const row = this.receiptsByIdentity.get(`${params[0]}:${params[1]}:${params[2]}`);
      return { rows: [copyRow(row)].filter(Boolean) };
    }

    if (
      normalized.startsWith('UPDATE provider_ingestion_receipts') &&
      normalized.includes('attempt_count = LEAST')
    ) {
      const row = this.receiptsById.get(params[0]);
      if (row === undefined || row.operation_digest !== params[1]) {
        return { rows: [] };
      }
      row.attempt_count += 1;
      row.last_seen_at = LATER;
      return { rows: [copyRow(row)] };
    }

    if (
      normalized.startsWith('UPDATE provider_ingestion_receipts') &&
      normalized.includes('verification_status = $4')
    ) {
      const row = this.receiptsById.get(params[0]);
      if (
        row === undefined ||
        row.verification_status !== params[1] ||
        row.processing_status !== params[2]
      ) {
        return { rows: [] };
      }
      row.verification_status = params[3];
      row.processing_status = params[4];
      row.normalized_event_type = params[5];
      row.failure_class = params[6];
      row.processed_at = params[4] === 'PROCESSED' ? LATER : null;
      row.reconciled_at =
        params[2] === 'RECONCILIATION_PENDING' && params[4] === 'PROCESSED'
          ? LATER
          : null;
      return { rows: [copyRow(row)] };
    }

    if (
      normalized.startsWith('SELECT provider_receipt_id') &&
      normalized.includes('WHERE provider_receipt_id = $1')
    ) {
      return { rows: [copyRow(this.receiptsById.get(params[0]))].filter(Boolean) };
    }

    throw new Error(`Unexpected receipt SQL: ${normalized}`);
  }
}

function receiptInput(overrides = {}) {
  return {
    providerReceiptId: 'receipt-a',
    providerNamespace: 'provider.test',
    providerContext: 'sandbox',
    providerEventId: 'provider-event-a',
    operationDigest: DIGEST_A,
    verificationStatus: 'VERIFIED',
    failureClass: null,
    ...overrides
  };
}

test('migration 0011 is forward-only, bounded, provider-neutral, and D1-only', async () => {
  const migrations = (await readdir(new URL('server/db/migrations/', REPOSITORY_ROOT)))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const migration = await readFile(MIGRATION_PATH, 'utf8');

  assert.equal(migrations.at(-1), '0011_commercial_persistence_foundation.sql');
  assert.match(migration, /CREATE TABLE commercial_authorities/u);
  assert.match(migration, /CREATE TABLE commercial_events/u);
  assert.match(migration, /CREATE TABLE provider_ingestion_receipts/u);
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\s*;/u);
  assert.doesNotMatch(
    migration,
    /\b(?:stripe|paddle|paypal|is_pro|tier|birth_date|birth_time|chart_id|planet|aspect)\b/iu
  );
  assert.doesNotMatch(
    migration,
    /CREATE TABLE (?:paid_billing_relationships|paid_coverages|referral_attributions|referral_rewards|grant_entitlements|entitlement_projections)/iu
  );
  assert.match(
    migration,
    /commercial_authorities_owner_unique[\s\S]*UNIQUE \(owner_id\)/u
  );
  assert.match(
    migration,
    /commercial_authorities_revision_check[\s\S]*entitlement_revision >= 0/u
  );
  assert.match(
    migration,
    /Commercial authority revision must advance by one/u
  );
  assert.match(
    migration,
    /commercial_events_business_idempotency_unique[\s\S]*UNIQUE \(idempotency_namespace, idempotency_key\)/u
  );
  assert.match(
    migration,
    /provider_ingestion_receipts_provider_identity_unique[\s\S]*UNIQUE \(provider_namespace, provider_context, provider_event_id\)/u
  );
  assert.match(migration, /commercial_events_corrects_source_fk/u);
  assert.match(migration, /commercial_events_reverses_source_fk/u);
  assert.match(migration, /commercial_events_authority_history_idx/u);
  assert.match(migration, /commercial_events_provider_receipt_idx/u);
  for (const value of [
    ...COMMERCIAL_EVENT_TYPES,
    ...COMMERCIAL_SOURCE_TYPES,
    ...PROVIDER_PROCESSING_STATUSES,
    ...PROVIDER_VERIFICATION_STATUSES
  ]) {
    assert.match(migration, new RegExp(`'${value}'`, 'u'));
  }

  const receiptTable = migration.slice(
    migration.indexOf('CREATE TABLE provider_ingestion_receipts'),
    migration.indexOf('CREATE TABLE commercial_events')
  );
  assert.doesNotMatch(receiptTable, /\b(?:owner_id|commercial_authority_id)\b/u);
});

test('migration loader accepts 0011 with runner-owned transaction semantics', async () => {
  const migrations = await loadPostgresMigrations(
    fileURLToPath(new URL('server/db/migrations/', REPOSITORY_ROOT))
  );
  const migration = migrations.find(({ version }) => version === '0011');

  assert.equal(
    migration?.filename,
    '0011_commercial_persistence_foundation.sql'
  );
  assert.match(migration?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
  assert.match(
    migration?.executableSql ?? '',
    /CREATE TABLE commercial_authorities/u
  );
  assert.doesNotMatch(
    migration?.executableSql ?? '',
    /\b(?:BEGIN|COMMIT)\s*;/u
  );
});

test('authority initialization is idempotent, owner-locked, unique, and revision-zero', async () => {
  const executor = new AuthorityExecutor();
  const repository = new PostgresCommercialAuthorityRepository(executor);
  const [first, second] = await Promise.all([
    repository.ensureAndLockForUpdate({
      commercialAuthorityId: 'authority-a',
      ownerId: 'owner-a'
    }),
    repository.ensureAndLockForUpdate({
      commercialAuthorityId: 'authority-a-race',
      ownerId: 'owner-a'
    })
  ]);

  assert.deepEqual(new Set([first.outcome, second.outcome]), new Set(['CREATED', 'EXISTING']));
  assert.equal(first.authority.commercialAuthorityId, 'authority-a');
  assert.equal(second.authority.commercialAuthorityId, 'authority-a');
  assert.equal(first.authority.entitlementRevision, '0');
  assert.equal(executor.authorities.size, 1);
  assert.equal(Object.isFrozen(first.authority), true);
  assert.equal('isPro' in first.authority, false);
  assert.equal('tier' in first.authority, false);

  const firstLock = executor.calls.findIndex((call) => call.sql.includes('FOR KEY SHARE'));
  const firstInsert = executor.calls.findIndex((call) => call.sql.startsWith('INSERT INTO commercial_authorities'));
  const firstAuthorityLock = executor.calls.findIndex((call) => call.sql.endsWith('FOR UPDATE'));
  assert.ok(firstLock >= 0 && firstLock < firstInsert && firstInsert < firstAuthorityLock);
});

test('authority refuses missing owners and revision increment is atomic with expected-state guard', async () => {
  const executor = new AuthorityExecutor();
  const repository = new PostgresCommercialAuthorityRepository(executor);

  await assert.rejects(
    repository.ensureAndLockForUpdate({
      commercialAuthorityId: 'authority-missing',
      ownerId: 'owner-missing'
    }),
    CommercialOwnerNotFoundError
  );

  const created = await repository.ensureAndLockForUpdate({
    commercialAuthorityId: 'authority-a',
    ownerId: 'owner-a'
  });
  const advanced = await repository.advanceRevisionAfterLock({
    commercialAuthorityId: created.authority.commercialAuthorityId,
    ownerId: created.authority.ownerId,
    expectedRevision: created.authority.entitlementRevision
  });
  assert.equal(advanced.entitlementRevision, '1');
  await assert.rejects(
    repository.advanceRevisionAfterLock({
      commercialAuthorityId: 'authority-a',
      ownerId: 'owner-a',
      expectedRevision: '0'
    }),
    CommercialRevisionConflictError
  );
});

test('raw PostgreSQL failures are mapped to a bounded persistence error', async () => {
  const repository = new PostgresCommercialAuthorityRepository({
    async query() {
      const error = new Error('private SQL detail with owner identifier');
      error.code = '08006';
      throw error;
    }
  });

  await assert.rejects(
    repository.getByOwnerId('owner-a'),
    (error) => {
      assert.equal(error instanceof CommercialPersistenceUnavailableError, true);
      assert.equal(error.message, 'Commercial persistence is unavailable.');
      assert.doesNotMatch(error.message, /private|owner-a|SQL/iu);
      return true;
    }
  );
});

test('commercial event append is immutable and exact replay does not duplicate', async () => {
  const executor = new EventExecutor();
  const repository = new PostgresCommercialEventRepository(executor);
  const first = await repository.appendIdempotent(eventInput());
  const replay = await repository.appendIdempotent(
    eventInput({ eventId: 'event-retry' })
  );

  assert.equal(first.outcome, 'APPENDED');
  assert.equal(replay.outcome, 'DUPLICATE');
  assert.equal(replay.event.eventId, 'event-a');
  assert.equal(executor.eventsByIdempotency.size, 1);
  assert.equal(Object.isFrozen(first.event), true);
  assert.equal(Object.isFrozen(first.event.attributes), true);

  const publicMethods = Object.getOwnPropertyNames(
    PostgresCommercialEventRepository.prototype
  );
  assert.ok(publicMethods.includes('appendIdempotent'));
  assert.ok(publicMethods.includes('getByIdempotencyIdentity'));
  assert.equal(publicMethods.some((name) => /update|delete/iu.test(name)), false);
  const repositorySource = await readFile(EVENT_REPOSITORY_PATH, 'utf8');
  assert.doesNotMatch(repositorySource, /(?:UPDATE|DELETE FROM) commercial_events/iu);
});

test('commercial event digest reuse conflicts and owner guard rejects cross-owner mutation', async () => {
  const executor = new EventExecutor();
  const repository = new PostgresCommercialEventRepository(executor);
  await repository.appendIdempotent(eventInput());

  await assert.rejects(
    repository.appendIdempotent(
      eventInput({ eventId: 'event-conflict', operationDigest: DIGEST_B })
    ),
    CommercialIdempotencyConflictError
  );
  await assert.rejects(
    repository.appendIdempotent(
      eventInput({
        eventId: 'event-cross-owner',
        ownerId: 'owner-b',
        idempotencyKey: 'cross-owner-attempt'
      })
    ),
    CommercialAuthorityUnavailableError
  );
  assert.equal(executor.eventsByIdempotency.size, 1);
});

test('provider-origin event requires an exactly matching verified receipt', async () => {
  const executor = new EventExecutor();
  const repository = new PostgresCommercialEventRepository(executor);
  executor.receipts.set('receipt-verified', {
    provider_namespace: 'provider.test',
    provider_context: 'sandbox',
    provider_event_id: 'provider-event-a',
    verification_status: 'VERIFIED'
  });
  executor.receipts.set('receipt-rejected', {
    provider_namespace: 'provider.test',
    provider_context: 'sandbox',
    provider_event_id: 'provider-event-b',
    verification_status: 'REJECTED'
  });

  const appended = await repository.appendIdempotent(
    eventInput({
      providerNamespace: 'provider.test',
      providerContext: 'sandbox',
      providerEventId: 'provider-event-a',
      providerReceiptId: 'receipt-verified'
    })
  );
  assert.equal(appended.outcome, 'APPENDED');
  assert.equal(appended.event.providerReceiptId, 'receipt-verified');

  await assert.rejects(
    repository.appendIdempotent(
      eventInput({
        eventId: 'event-rejected-receipt',
        providerNamespace: 'provider.test',
        providerContext: 'sandbox',
        providerEventId: 'provider-event-b',
        providerReceiptId: 'receipt-rejected',
        idempotencyKey: 'rejected-receipt'
      })
    ),
    CommercialPersistenceIntegrityError
  );
});

test('canonical attributes are bounded, key-sorted, secret-resistant, and digest-stable', () => {
  assert.equal(
    digestCanonicalCommercialOperation({ b: 2, a: { d: 4, c: 3 } }),
    digestCanonicalCommercialOperation({ a: { c: 3, d: 4 }, b: 2 })
  );
  assert.throws(
    () => assertCanonicalCommercialAttributes({ raw_payload: 'secret' }),
    /attributes is invalid/u
  );
  assert.throws(
    () => assertCanonicalCommercialAttributes({ birth_time: NOW }),
    /attributes is invalid/u
  );
});

test('provider receipt exact duplicate is replay-safe and incompatible digest conflicts', async () => {
  const executor = new ReceiptExecutor();
  const repository = new PostgresProviderIngestionReceiptRepository(executor);
  const first = await repository.claimIdempotent(receiptInput());
  const duplicate = await repository.claimIdempotent(
    receiptInput({ providerReceiptId: 'receipt-retry' })
  );

  assert.equal(first.outcome, 'CLAIMED');
  assert.equal(duplicate.outcome, 'DUPLICATE');
  assert.equal(duplicate.receipt.providerReceiptId, 'receipt-a');
  assert.equal(duplicate.receipt.attemptCount, 2);
  assert.equal(executor.receiptsByIdentity.size, 1);

  await assert.rejects(
    repository.claimIdempotent(
      receiptInput({ providerReceiptId: 'receipt-conflict', operationDigest: DIGEST_B })
    ),
    ProviderReceiptConflictError
  );
  assert.equal(executor.receiptsByIdentity.size, 1);
});

test('provider namespace separates equal event IDs and bounded processing transition works', async () => {
  const executor = new ReceiptExecutor();
  const repository = new PostgresProviderIngestionReceiptRepository(executor);
  await repository.claimIdempotent(receiptInput());
  const other = await repository.claimIdempotent(
    receiptInput({
      providerReceiptId: 'receipt-b',
      providerNamespace: 'provider.other'
    })
  );
  assert.equal(other.outcome, 'CLAIMED');
  assert.equal(executor.receiptsByIdentity.size, 2);

  const processed = await repository.transition({
    providerReceiptId: 'receipt-a',
    expectedVerificationStatus: 'VERIFIED',
    expectedProcessingStatus: 'PENDING',
    nextVerificationStatus: 'VERIFIED',
    nextProcessingStatus: 'PROCESSED',
    normalizedEventType: 'PAID_RELATIONSHIP_OPENED',
    failureClass: null
  });
  assert.equal(processed.processingStatus, 'PROCESSED');
  assert.equal(processed.normalizedEventType, 'PAID_RELATIONSHIP_OPENED');
  assert.equal(processed.processedAt, LATER);
});
