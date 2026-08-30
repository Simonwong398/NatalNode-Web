import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CommercialAuthorityUnavailableError,
  CommercialOwnerNotFoundError,
  PaidCoverageConflictError,
  PaidRelationshipTransitionConflictError,
  PostgresPaidBillingRelationshipRepository,
  createPostgresCommercialPersistence
} from '../dist/index.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('server/db/migrations/', REPOSITORY_ROOT)
);
const MIGRATION_PATH = new URL(
  'server/db/migrations/0012_paid_billing_coverage.sql',
  REPOSITORY_ROOT
);
const NOW = '2026-08-30T12:00:00.000Z';
const PERIOD_END = '2026-09-01T12:00:00.000Z';
const RENEWAL_END = '2026-10-01T12:00:00.000Z';
const DIGEST = 'a'.repeat(64);

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

function extractMigrationFunctionBody(migration, functionName) {
  const match = migration.match(
    new RegExp(
      `CREATE OR REPLACE FUNCTION ${functionName}\\(\\)[\\s\\S]*?AS \\$\\$([\\s\\S]*?)\\$\\$;`,
      'u'
    )
  );
  assert.ok(match, `Expected migration function ${functionName}`);
  return match[1];
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function authorityRow(id, owner) {
  return {
    commercial_authority_id: id,
    owner_id: owner,
    entitlement_revision: '0',
    created_at: NOW,
    updated_at: NOW
  };
}

function eventRow({
  eventId,
  eventType,
  authority = 'authority-a',
  effectiveAt = NOW
}) {
  return {
    event_id: eventId,
    commercial_authority_id: authority,
    event_type: eventType,
    source_type: 'PAID',
    effective_at: effectiveAt
  };
}

class PaidPersistenceExecutor {
  constructor() {
    this.users = new Set(['owner-a', 'owner-b']);
    this.authorities = new Map([
      ['authority-a', authorityRow('authority-a', 'owner-a')],
      ['authority-b', authorityRow('authority-b', 'owner-b')]
    ]);
    this.events = new Map();
    this.relationships = new Map();
    this.coverages = new Map();
    this.pendingReversals = new Map();
    this.now = NOW;
    this.calls = [];
  }

  addEvent(options) {
    const row = eventRow(options);
    this.events.set(row.event_id, row);
  }

  setNow(value) {
    this.now = value;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: structuredClone(params) });

    if (
      normalized.startsWith('SELECT user_id FROM users') &&
      normalized.endsWith('FOR KEY SHARE')
    ) {
      return {
        rows: this.users.has(params[0]) ? [{ user_id: params[0] }] : []
      };
    }

    if (
      normalized.startsWith('SELECT commercial_authority_id FROM commercial_authorities') &&
      normalized.includes('owner_id = $2')
    ) {
      const authority = this.authorities.get(params[0]);
      return {
        rows:
          authority?.owner_id === params[1]
            ? [{ commercial_authority_id: params[0] }]
            : []
      };
    }

    if (
      normalized.startsWith('SELECT commercial_authority_id, owner_id, entitlement_revision') &&
      normalized.includes('WHERE owner_id = $1') &&
      normalized.endsWith('FOR UPDATE')
    ) {
      const authority = [...this.authorities.values()].find(
        (row) => row.owner_id === params[0]
      );
      return { rows: authority === undefined ? [] : [clone(authority)] };
    }

    if (
      normalized.startsWith('UPDATE commercial_authorities') &&
      normalized.includes('entitlement_revision = entitlement_revision + 1')
    ) {
      const authority = this.authorities.get(params[0]);
      if (
        authority === undefined ||
        authority.owner_id !== params[1] ||
        authority.entitlement_revision !== params[2]
      ) {
        return { rows: [] };
      }
      authority.entitlement_revision = (
        BigInt(authority.entitlement_revision) + 1n
      ).toString();
      authority.updated_at = this.now;
      return { rows: [clone(authority)] };
    }

    if (
      normalized.startsWith('SELECT event_id, commercial_authority_id, event_type, effective_at')
    ) {
      const event = this.events.get(params[0]);
      return {
        rows:
          event?.commercial_authority_id === params[1] &&
          event.source_type === 'PAID'
            ? [clone(event)]
            : []
      };
    }

    if (
      normalized.startsWith('SELECT grace_until > CURRENT_TIMESTAMP AS grace_open')
    ) {
      const relationship = this.relationships.get(params[0]);
      return {
        rows:
          relationship === undefined
            ? []
            : [
                {
                  grace_open:
                    Date.parse(relationship.grace_until) > Date.parse(this.now)
                }
              ]
      };
    }

    if (normalized.startsWith('INSERT INTO paid_billing_relationships')) {
      const [
        paidRelationshipId,
        commercialAuthorityId,
        providerNamespace,
        providerContext,
        providerRelationshipRef,
        billingInterval,
        eventId,
        sourceRevision
      ] = params;
      if (
        this.relationships.has(paidRelationshipId) ||
        [...this.relationships.values()].some(
          (row) =>
            providerNamespace !== null &&
            providerContext !== null &&
            providerRelationshipRef !== null &&
            row.provider_namespace === providerNamespace &&
            row.provider_context === providerContext &&
            row.provider_relationship_ref === providerRelationshipRef
        )
      ) {
        return { rows: [] };
      }
      const row = {
        paid_relationship_id: paidRelationshipId,
        commercial_authority_id: commercialAuthorityId,
        provider_namespace: providerNamespace,
        provider_context: providerContext,
        provider_relationship_ref: providerRelationshipRef,
        billing_interval: billingInterval,
        lifecycle_state: 'PENDING_FIRST_PAYMENT',
        renewal_intent: 'ENABLED',
        current_period_start: null,
        current_period_end: null,
        grace_started_at: null,
        grace_until: null,
        failed_renewal_identity: null,
        ended_at: null,
        end_reason: null,
        last_reconciled_event_id: eventId,
        source_revision: sourceRevision,
        created_at: this.now,
        updated_at: this.now
      };
      this.relationships.set(paidRelationshipId, row);
      return { rows: [clone(row)] };
    }

    if (normalized.startsWith('UPDATE paid_billing_relationships')) {
      const [
        paidRelationshipId,
        commercialAuthorityId,
        lifecycleState,
        renewalIntent,
        currentPeriodStart,
        currentPeriodEnd,
        graceStartedAt,
        graceUntil,
        failedRenewalIdentity,
        endedAt,
        endReason,
        eventId,
        sourceRevision,
        expectedLifecycleState,
        expectedRenewalIntent
      ] = params;
      const row = this.relationships.get(paidRelationshipId);
      if (
        row === undefined ||
        row.commercial_authority_id !== commercialAuthorityId ||
        row.lifecycle_state !== expectedLifecycleState ||
        row.renewal_intent !== expectedRenewalIntent
      ) {
        return { rows: [] };
      }
      Object.assign(row, {
        lifecycle_state: lifecycleState,
        renewal_intent: renewalIntent,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        grace_started_at: graceStartedAt,
        grace_until: graceUntil,
        failed_renewal_identity: failedRenewalIdentity,
        ended_at: endedAt,
        end_reason: endReason,
        last_reconciled_event_id: eventId,
        source_revision: sourceRevision,
        updated_at: this.now
      });
      return { rows: [clone(row)] };
    }

    if (normalized.startsWith('INSERT INTO paid_coverages')) {
      if (normalized.includes("'REVERSED'")) {
        const [
          paidCoverageId,
          paidRelationshipId,
          commercialAuthorityId,
          purchaseNamespace,
          purchaseIdentity,
          billingInterval,
          coverageStartAt,
          scheduledCoverageEndAt,
          requestedEndAt,
          successEventId,
          reversalEventId,
          reversedAt,
          reversalReason,
          sourceRevision
        ] = params;
        const effectiveEnd = new Date(
          Math.max(
            Date.parse(coverageStartAt),
            Math.min(Date.parse(scheduledCoverageEndAt), Date.parse(requestedEndAt))
          )
        ).toISOString();
        const row = {
          paid_coverage_id: paidCoverageId,
          paid_relationship_id: paidRelationshipId,
          commercial_authority_id: commercialAuthorityId,
          purchase_namespace: purchaseNamespace,
          purchase_identity: purchaseIdentity,
          billing_interval: billingInterval,
          coverage_start_at: coverageStartAt,
          scheduled_coverage_end_at: scheduledCoverageEndAt,
          effective_coverage_end_at: effectiveEnd,
          coverage_state: 'REVERSED',
          success_event_id: successEventId,
          reversal_event_id: reversalEventId,
          reversed_at: reversedAt,
          reversal_reason: reversalReason,
          source_revision: sourceRevision,
          created_at: this.now,
          updated_at: this.now
        };
        this.coverages.set(paidCoverageId, row);
        return { rows: [clone(row)] };
      }
      const [
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
      ] = params;
      if (
        this.coverages.has(paidCoverageId) ||
        [...this.coverages.values()].some(
          (row) =>
            row.commercial_authority_id === commercialAuthorityId &&
            row.purchase_namespace === purchaseNamespace &&
            row.purchase_identity === purchaseIdentity
        )
      ) {
        return { rows: [] };
      }
      const row = {
        paid_coverage_id: paidCoverageId,
        paid_relationship_id: paidRelationshipId,
        commercial_authority_id: commercialAuthorityId,
        purchase_namespace: purchaseNamespace,
        purchase_identity: purchaseIdentity,
        billing_interval: billingInterval,
        coverage_start_at: coverageStartAt,
        scheduled_coverage_end_at: scheduledCoverageEndAt,
        effective_coverage_end_at: scheduledCoverageEndAt,
        coverage_state: 'VALID',
        success_event_id: successEventId,
        reversal_event_id: null,
        reversed_at: null,
        reversal_reason: null,
        source_revision: sourceRevision,
        created_at: this.now,
        updated_at: this.now
      };
      this.coverages.set(paidCoverageId, row);
      return { rows: [clone(row)] };
    }

    if (normalized.startsWith('INSERT INTO paid_coverage_reversal_intents')) {
      const [
        paidCoverageReversalId,
        paidCoverageId,
        paidRelationshipId,
        commercialAuthorityId,
        purchaseNamespace,
        purchaseIdentity,
        reversalEventId,
        reversedAt,
        reversalReason,
        effectiveCoverageEndAt,
        sourceRevision
      ] = params;
      if (
        this.pendingReversals.has(`${commercialAuthorityId}:${purchaseNamespace}:${purchaseIdentity}`) ||
        [...this.pendingReversals.values()].some(
          (row) => row.reversal_event_id === reversalEventId
        )
      ) {
        return { rows: [] };
      }
      const row = {
        paid_coverage_reversal_id: paidCoverageReversalId,
        paid_coverage_id: paidCoverageId,
        paid_relationship_id: paidRelationshipId,
        commercial_authority_id: commercialAuthorityId,
        purchase_namespace: purchaseNamespace,
        purchase_identity: purchaseIdentity,
        reversal_event_id: reversalEventId,
        reversed_at: reversedAt,
        reversal_reason: reversalReason,
        effective_coverage_end_at: effectiveCoverageEndAt,
        source_revision: sourceRevision,
        created_at: this.now,
        updated_at: this.now
      };
      this.pendingReversals.set(
        `${commercialAuthorityId}:${purchaseNamespace}:${purchaseIdentity}`,
        row
      );
      return { rows: [clone(row)] };
    }

    if (normalized.startsWith('DELETE FROM paid_coverage_reversal_intents')) {
      for (const [key, row] of this.pendingReversals) {
        if (row.paid_coverage_reversal_id === params[0]) {
          this.pendingReversals.delete(key);
        }
      }
      return { rows: [] };
    }

    if (normalized.startsWith('UPDATE paid_coverages')) {
      const row = this.coverages.get(params[0]);
      if (
        row === undefined ||
        row.paid_relationship_id !== params[1] ||
        row.commercial_authority_id !== params[2] ||
        row.coverage_state !== params[3]
      ) {
        return { rows: [] };
      }
      const currentEnd = Date.parse(row.effective_coverage_end_at);
      const requestedEnd = Date.parse(params[4]);
      const start = Date.parse(row.coverage_start_at);
      const effectiveEnd = new Date(
        Math.max(start, Math.min(currentEnd, requestedEnd))
      ).toISOString();
      if (normalized.includes("coverage_state = 'REVERSED'")) {
        if (row.reversal_event_id !== null) {
          return { rows: [] };
        }
        Object.assign(row, {
          effective_coverage_end_at: effectiveEnd,
          coverage_state: 'REVERSED',
          reversal_event_id: params[5],
          reversed_at: params[6],
          reversal_reason: params[7],
          source_revision: params[8],
          updated_at: this.now
        });
      } else {
        Object.assign(row, {
          effective_coverage_end_at: effectiveEnd,
          coverage_state: 'ENDED',
          source_revision: params[5],
          updated_at: this.now
        });
      }
      return { rows: [clone(row)] };
    }

    if (normalized.startsWith('SELECT paid_relationship_id')) {
      if (normalized.includes('FOR UPDATE')) {
        const row = this.relationships.get(params[0]);
        return {
          rows:
            row?.commercial_authority_id === params[1] ? [clone(row)] : []
        };
      }
      if (normalized.includes('WHERE commercial_authority_id = $1')) {
        return {
          rows: [...this.relationships.values()]
            .filter((row) => row.commercial_authority_id === params[0])
            .sort((left, right) =>
              left.paid_relationship_id.localeCompare(right.paid_relationship_id)
            )
            .map(clone)
        };
      }
      const row = this.relationships.get(params[0]);
      return { rows: row === undefined ? [] : [clone(row)] };
    }

    if (normalized.startsWith('SELECT paid_coverage_id')) {
      if (normalized.includes('FOR UPDATE')) {
        const row = this.coverages.get(params[0]);
        return {
          rows:
            row?.paid_relationship_id === params[1] &&
            row.commercial_authority_id === params[2]
              ? [clone(row)]
              : []
        };
      }
      if (normalized.includes('purchase_namespace = $2')) {
        const row = [...this.coverages.values()].find(
          (candidate) =>
            candidate.commercial_authority_id === params[0] &&
            candidate.purchase_namespace === params[1] &&
            candidate.purchase_identity === params[2]
        );
        return { rows: row === undefined ? [] : [clone(row)] };
      }
      if (normalized.includes('paid_relationship_id = $2')) {
        return {
          rows: [...this.coverages.values()]
            .filter(
              (row) =>
                row.commercial_authority_id === params[0] &&
                row.paid_relationship_id === params[1]
            )
            .sort((left, right) =>
              left.coverage_start_at.localeCompare(right.coverage_start_at) ||
              left.paid_coverage_id.localeCompare(right.paid_coverage_id)
            )
            .map(clone)
        };
      }
      const row = this.coverages.get(params[0]);
      return { rows: row === undefined ? [] : [clone(row)] };
    }

    if (normalized.startsWith('SELECT paid_coverage_reversal_id')) {
      const row = this.pendingReversals.get(
        `${params[0]}:${params[1]}:${params[2]}`
      );
      return { rows: row === undefined ? [] : [clone(row)] };
    }

    throw new Error(`Unexpected paid persistence SQL: ${normalized}`);
  }
}

function addEvent(executor, eventId, eventType, options = {}) {
  executor.addEvent({ eventId, eventType, ...options });
}

function baseContext(eventId, overrides = {}) {
  return {
    ownerId: 'owner-a',
    commercialAuthorityId: 'authority-a',
    eventId,
    ...overrides
  };
}

async function openRelationship(executor, persistence, {
  relationshipId = 'relationship-a',
  eventId = 'event-open-a',
  billingInterval = 'MONTHLY',
  ownerId = 'owner-a',
  commercialAuthorityId = 'authority-a'
} = {}) {
  addEvent(executor, eventId, 'PAID_RELATIONSHIP_OPENED', {
    authority: commercialAuthorityId
  });
  return persistence.paidReconciliation.openFirstPaidRelationship({
    ownerId,
    commercialAuthorityId,
    eventId,
    paidRelationshipId: relationshipId,
    providerNamespace: null,
    providerContext: null,
    providerRelationshipRef: null,
    billingInterval
  });
}

async function addFirstPurchase(
  executor,
  persistence,
  {
    relationshipId = 'relationship-a',
    coverageId = 'coverage-a',
    eventId = 'event-first-success-a',
    purchaseIdentity = 'purchase-a',
    purchaseNamespace = 'billing.test',
    billingInterval = 'MONTHLY',
    ownerId = 'owner-a',
    commercialAuthorityId = 'authority-a',
    start = NOW,
    end = PERIOD_END,
    renewal = false
  } = {}
) {
  addEvent(executor, eventId, renewal ? 'PAID_RENEWAL_SUCCEEDED' : 'PAID_PURCHASE_SUCCEEDED', {
    authority: commercialAuthorityId,
    effectiveAt: start
  });
  const operation = renewal
    ? persistence.paidReconciliation.recordSuccessfulRenewal
    : persistence.paidReconciliation.recordSuccessfulFirstPurchase;
  return operation.call(persistence.paidReconciliation, {
    ownerId,
    commercialAuthorityId,
    eventId,
    paidRelationshipId: relationshipId,
    paidCoverageId: coverageId,
    purchaseNamespace,
    purchaseIdentity,
    billingInterval,
    coverageStartAt: start,
    scheduledCoverageEndAt: end
  });
}

test('migration 0012 is the single forward D2 migration with bounded paid source tables', async () => {
  const migrations = (await readdir(new URL('server/db/migrations/', REPOSITORY_ROOT)))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const migration = await readFile(MIGRATION_PATH, 'utf8');

  assert.equal(migrations.at(-1), '0012_paid_billing_coverage.sql');
  assert.match(migration, /CREATE TABLE paid_billing_relationships/u);
  assert.match(migration, /CREATE TABLE paid_coverages/u);
  assert.match(migration, /paid_billing_relationships_authority_fk[\s\S]*ON DELETE CASCADE/u);
  assert.match(migration, /paid_coverages_relationship_authority_fk[\s\S]*REFERENCES paid_billing_relationships/u);
  assert.match(migration, /paid_coverages_authority_fk[\s\S]*ON DELETE CASCADE/u);
  assert.match(
    migration,
    /paid_coverage_reversal_intents_relationship_authority_fk[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(migration, /paid_coverage_reversal_intents_authority_fk[\s\S]*ON DELETE CASCADE/u);
  assert.match(migration, /paid_billing_relationships_provider_identity_unique/u);
  assert.match(migration, /paid_coverages_purchase_identity_unique/u);
  assert.match(migration, /paid_coverages_success_event_unique/u);
  assert.match(migration, /CREATE TABLE paid_coverage_reversal_intents/u);
  assert.match(migration, /grace_until = grace_started_at \+ INTERVAL '7 days'/u);
  assert.match(migration, /paid_coverages_half_open_interval_check/u);
  assert.match(migration, /enforce_paid_relationship_update_v1/u);
  assert.match(migration, /enforce_paid_coverage_update_v1/u);
  assert.match(migration, /paid_billing_relationships_event_guard/u);
  assert.match(migration, /paid_coverages_event_guard/u);
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\s*;/u);
  assert.doesNotMatch(
    migration,
    /\b(?:stripe|paddle|paypal|is_pro|tier|effective_entitlement|referral|grant|projection|birth_date|birth_time|chart_id|planet|aspect|price|currency)\b/iu
  );

  const loaded = await loadPostgresMigrations(MIGRATIONS_DIRECTORY);
  const migrationArtifact = loaded.find(({ version }) => version === '0012');
  assert.equal(migrationArtifact?.filename, '0012_paid_billing_coverage.sql');
  assert.match(migrationArtifact?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
  assert.doesNotMatch(migrationArtifact?.executableSql ?? '', /\b(?:BEGIN|COMMIT)\s*;/u);
});

test('migration 0012 event guards qualify commercial event columns without conflicting locals', async () => {
  const migration = await readFile(MIGRATION_PATH, 'utf8');
  const guardedLookups = [
    {
      functionName: 'enforce_paid_relationship_event_v1',
      eventReference: 'last_reconciled_event_id'
    },
    {
      functionName: 'enforce_paid_coverage_reversal_intent_update_v1',
      eventReference: 'reversal_event_id'
    }
  ];

  for (const { functionName, eventReference } of guardedLookups) {
    const body = extractMigrationFunctionBody(migration, functionName);
    assert.match(body, /resolved_event_authority_id TEXT;/u);
    assert.match(body, /resolved_event_source_type TEXT;/u);
    assert.match(body, /resolved_event_type TEXT;/u);
    assert.doesNotMatch(
      body,
      /^\s*(?:commercial_authority_id|source_type|event_type)\s+TEXT;/mu
    );
    assert.match(
      body,
      new RegExp(
        `SELECT\\s+ce\\.commercial_authority_id,\\s+ce\\.source_type,\\s+ce\\.event_type[\\s\\S]*?FROM commercial_events AS ce\\s+WHERE ce\\.event_id = NEW\\.${eventReference};`,
        'u'
      )
    );
  }

  const coverageEventBody = extractMigrationFunctionBody(
    migration,
    'enforce_paid_coverage_event_v1'
  );
  assert.equal(
    coverageEventBody.match(/FROM commercial_events AS ce/gu)?.length,
    2
  );
  assert.equal(
    coverageEventBody.match(
      /SELECT\s+ce\.commercial_authority_id,\s+ce\.source_type,\s+ce\.event_type/gu
    )?.length,
    2
  );
});

test('relationship creation is owner-scoped and preserves first-payment pending state', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  const opened = await openRelationship(executor, persistence);

  assert.equal(opened.outcome, 'APPLIED');
  assert.equal(opened.authority.entitlementRevision, '1');
  assert.equal(opened.relationship.lifecycleState, 'PENDING_FIRST_PAYMENT');
  assert.equal(opened.relationship.renewalIntent, 'ENABLED');
  assert.equal(opened.relationship.currentPeriodStart, null);
  assert.equal(opened.relationship.graceUntil, null);
  assert.equal(opened.relationship.sourceRevision, '1');

  await assert.rejects(
    openRelationship(executor, persistence, {
      relationshipId: 'missing-owner-relationship',
      eventId: 'event-missing-owner',
      ownerId: 'owner-missing',
      commercialAuthorityId: 'authority-a'
    }),
    CommercialOwnerNotFoundError
  );

  addEvent(executor, 'event-owner-mismatch', 'PAID_RELATIONSHIP_OPENED', {
    authority: 'authority-b'
  });
  await assert.rejects(
    persistence.paidReconciliation.openFirstPaidRelationship({
      ownerId: 'owner-a',
      commercialAuthorityId: 'authority-b',
      eventId: 'event-owner-mismatch',
      paidRelationshipId: 'mismatch-relationship',
      providerNamespace: null,
      providerContext: null,
      providerRelationshipRef: null,
      billingInterval: 'ANNUAL'
    }),
    CommercialAuthorityUnavailableError
  );
});

test('failed first purchase is distinct and creates neither coverage nor grace', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  addEvent(executor, 'event-first-failed-a', 'PAID_FIRST_PURCHASE_FAILED');

  const failed = await persistence.paidReconciliation.recordFailedFirstPurchase(
    baseContext('event-first-failed-a', { paidRelationshipId: 'relationship-a' })
  );
  assert.equal(failed.relationship.lifecycleState, 'FIRST_PAYMENT_FAILED');
  assert.equal(failed.relationship.graceStartedAt, null);
  assert.equal(failed.relationship.graceUntil, null);
  assert.equal(failed.authority.entitlementRevision, '2');
  assert.deepEqual(
    await persistence.paidCoverages.listByRelationship(
      'owner-a',
      'authority-a',
      'relationship-a'
    ),
    []
  );

  addEvent(executor, 'event-late-first-success-a', 'PAID_PURCHASE_SUCCEEDED');
  await assert.rejects(
    persistence.paidReconciliation.recordSuccessfulFirstPurchase({
      ...baseContext('event-late-first-success-a', {
        paidRelationshipId: 'relationship-a'
      }),
      paidCoverageId: 'coverage-late-a',
      purchaseNamespace: 'billing.test',
      purchaseIdentity: 'purchase-late-a',
      billingInterval: 'MONTHLY',
      coverageStartAt: NOW,
      scheduledCoverageEndAt: PERIOD_END
    }),
    PaidRelationshipTransitionConflictError
  );
});

test('first purchase, cancellation, restore, renewal, and exact replay remain source-local and idempotent', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  const first = await addFirstPurchase(executor, persistence);
  assert.equal(first.relationship.lifecycleState, 'ACTIVE');
  assert.equal(first.relationship.currentPeriodEnd, PERIOD_END);
  assert.equal(first.coverage.coverageState, 'VALID');
  assert.equal(first.authority.entitlementRevision, '2');

  addEvent(executor, 'event-cancel-a', 'PAID_CANCELLATION_SCHEDULED');
  const cancelled = await persistence.paidReconciliation.scheduleCancellation(
    baseContext('event-cancel-a', { paidRelationshipId: 'relationship-a' })
  );
  assert.equal(cancelled.relationship.renewalIntent, 'CANCEL_AT_PERIOD_END');
  assert.equal(cancelled.relationship.currentPeriodEnd, PERIOD_END);
  assert.equal(cancelled.authority.entitlementRevision, '3');

  addEvent(executor, 'event-restore-a', 'PAID_RENEWAL_RESTORED');
  const restored = await persistence.paidReconciliation.restoreRenewal(
    baseContext('event-restore-a', { paidRelationshipId: 'relationship-a' })
  );
  assert.equal(restored.relationship.renewalIntent, 'ENABLED');
  assert.equal(restored.authority.entitlementRevision, '4');
  assert.equal(executor.coverages.size, 1);

  const renewal = await addFirstPurchase(executor, persistence, {
    eventId: 'event-renewal-a',
    coverageId: 'coverage-renewal-a',
    purchaseIdentity: 'renewal-a',
    start: PERIOD_END,
    end: RENEWAL_END,
    renewal: true
  });
  assert.equal(renewal.relationship.lifecycleState, 'ACTIVE');
  assert.equal(renewal.authority.entitlementRevision, '5');
  assert.equal(executor.coverages.size, 2);

  const replay = await persistence.paidReconciliation.recordSuccessfulRenewal({
    ...baseContext('event-renewal-a', { paidRelationshipId: 'relationship-a' }),
    paidCoverageId: 'coverage-renewal-a-retry',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'renewal-a',
    billingInterval: 'MONTHLY',
    coverageStartAt: PERIOD_END,
    scheduledCoverageEndAt: RENEWAL_END
  });
  assert.equal(replay.outcome, 'DUPLICATE');
  assert.equal(replay.authority.entitlementRevision, '5');
  assert.equal(executor.coverages.size, 2);

  await assert.rejects(
    persistence.paidReconciliation.recordSuccessfulRenewal({
      ...baseContext('event-renewal-a', { paidRelationshipId: 'relationship-a' }),
      paidCoverageId: 'coverage-renewal-a-retry',
      purchaseNamespace: 'billing.test',
      purchaseIdentity: 'renewal-a',
      billingInterval: 'MONTHLY',
      coverageStartAt: PERIOD_END,
      scheduledCoverageEndAt: '2026-10-02T12:00:00.000Z'
    }),
    PaidCoverageConflictError
  );

  addEvent(executor, 'event-renewal-conflict-a', 'PAID_RENEWAL_SUCCEEDED');
  await assert.rejects(
    persistence.paidReconciliation.recordSuccessfulRenewal({
      ...baseContext('event-renewal-conflict-a', {
        paidRelationshipId: 'relationship-a'
      }),
      paidCoverageId: 'coverage-renewal-conflict-a',
      purchaseNamespace: 'billing.test',
      purchaseIdentity: 'renewal-a',
      billingInterval: 'MONTHLY',
      coverageStartAt: PERIOD_END,
      scheduledCoverageEndAt: RENEWAL_END
    }),
    PaidCoverageConflictError
  );

  addEvent(executor, 'event-cancel-after-renewal-a', 'PAID_CANCELLATION_SCHEDULED');
  const cancelledAfterRenewal =
    await persistence.paidReconciliation.scheduleCancellation(
      baseContext('event-cancel-after-renewal-a', {
        paidRelationshipId: 'relationship-a'
      })
    );
  assert.equal(cancelledAfterRenewal.relationship.renewalIntent, 'CANCEL_AT_PERIOD_END');
  assert.equal(executor.coverages.size, 2);
  assert.equal(cancelledAfterRenewal.authority.entitlementRevision, '6');
});

test('renewal recovery uses exact seven-day grace and successful recovery clears it without a duplicate period', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  await addFirstPurchase(executor, persistence);
  addEvent(executor, 'event-renewal-failed-a', 'PAID_RENEWAL_FAILED', {
    effectiveAt: PERIOD_END
  });

  const grace = await persistence.paidReconciliation.enterRenewalRecovery({
    ...baseContext('event-renewal-failed-a', { paidRelationshipId: 'relationship-a' }),
    failedRenewalIdentity: 'renewal-at-period-end-a'
  });
  assert.equal(grace.relationship.lifecycleState, 'RECOVERY_GRACE');
  assert.equal(grace.relationship.graceStartedAt, PERIOD_END);
  assert.equal(grace.relationship.graceUntil, '2026-09-08T12:00:00.000Z');
  assert.equal(grace.relationship.failedRenewalIdentity, 'renewal-at-period-end-a');
  assert.equal(grace.authority.entitlementRevision, '3');

  addEvent(executor, 'event-recovery-success-a', 'PAID_RENEWAL_SUCCEEDED', {
    effectiveAt: '2026-09-02T12:00:00.000Z'
  });
  const recovered =
    await persistence.paidReconciliation.recoverFromRenewalRecovery({
      ...baseContext('event-recovery-success-a', { paidRelationshipId: 'relationship-a' }),
      paidCoverageId: 'coverage-recovery-a',
      purchaseNamespace: 'billing.test',
      purchaseIdentity: 'renewal-recovery-a',
      billingInterval: 'MONTHLY',
      coverageStartAt: PERIOD_END,
      scheduledCoverageEndAt: RENEWAL_END
    });
  assert.equal(recovered.relationship.lifecycleState, 'ACTIVE');
  assert.equal(recovered.relationship.graceUntil, null);
  assert.equal(recovered.relationship.failedRenewalIdentity, null);
  assert.equal(recovered.coverage.coverageState, 'VALID');
  assert.equal(executor.coverages.size, 2);
  assert.equal(recovered.authority.entitlementRevision, '4');
});

test('grace expiry is database-boundary controlled and ends the relationship', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  await addFirstPurchase(executor, persistence);
  addEvent(executor, 'event-renewal-failed-expiry', 'PAID_RENEWAL_FAILED', {
    effectiveAt: PERIOD_END
  });
  await persistence.paidReconciliation.enterRenewalRecovery({
    ...baseContext('event-renewal-failed-expiry', { paidRelationshipId: 'relationship-a' }),
    failedRenewalIdentity: 'renewal-expiry-a'
  });
  executor.setNow('2026-09-08T12:00:00.000Z');
  addEvent(executor, 'event-grace-expired-a', 'PAID_GRACE_EXPIRED', {
    effectiveAt: '2026-09-08T12:00:00.000Z'
  });

  const expired = await persistence.paidReconciliation.expireRenewalRecovery(
    baseContext('event-grace-expired-a', { paidRelationshipId: 'relationship-a' })
  );
  assert.equal(expired.relationship.lifecycleState, 'ENDED');
  assert.equal(expired.relationship.renewalIntent, 'DISABLED');
  assert.equal(expired.relationship.endReason, 'GRACE_EXPIRED');
  assert.equal(expired.relationship.graceStartedAt, null);
  assert.equal(expired.relationship.graceUntil, null);
  assert.equal(expired.authority.entitlementRevision, '4');
});

test('refund and chargeback clamp only their attributable coverage and cannot create negative time', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  const first = await addFirstPurchase(executor, persistence);
  const second = await addFirstPurchase(executor, persistence, {
    eventId: 'event-renewal-reversal-a',
    coverageId: 'coverage-renewal-reversal-a',
    purchaseIdentity: 'renewal-reversal-a',
    start: PERIOD_END,
    end: RENEWAL_END,
    renewal: true
  });

  addEvent(executor, 'event-refund-a', 'PAID_COVERAGE_REFUNDED', {
    effectiveAt: '2026-08-31T12:00:00.000Z'
  });
  const refunded = await persistence.paidReconciliation.applyRefund({
    ...baseContext('event-refund-a', { paidRelationshipId: 'relationship-a' }),
    paidCoverageId: 'coverage-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-a',
    effectiveCoverageEndAt: '2026-08-31T12:00:00.000Z'
  });
  assert.equal(refunded.coverage.coverageState, 'REVERSED');
  assert.equal(refunded.coverage.effectiveCoverageEndAt, '2026-08-31T12:00:00.000Z');
  assert.equal(executor.coverages.get('coverage-renewal-reversal-a').coverage_state, 'VALID');
  assert.equal(refunded.authority.entitlementRevision, '4');

  const refundReplay = await persistence.paidReconciliation.applyRefund({
    ...baseContext('event-refund-a', { paidRelationshipId: 'relationship-a' }),
    paidCoverageId: 'coverage-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-a',
    effectiveCoverageEndAt: NOW
  });
  assert.equal(refundReplay.outcome, 'DUPLICATE');
  assert.equal(refundReplay.authority.entitlementRevision, '4');

  addEvent(executor, 'event-chargeback-a', 'PAID_COVERAGE_CHARGEBACKED', {
    effectiveAt: '2026-09-02T12:00:00.000Z'
  });
  const chargedBack = await persistence.paidReconciliation.applyChargeback({
    ...baseContext('event-chargeback-a', { paidRelationshipId: 'relationship-a' }),
    paidCoverageId: 'coverage-renewal-reversal-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'renewal-reversal-a',
    effectiveCoverageEndAt: '2026-08-01T12:00:00.000Z'
  });
  assert.equal(chargedBack.coverage.coverageState, 'REVERSED');
  assert.equal(
    chargedBack.coverage.effectiveCoverageEndAt,
    chargedBack.coverage.coverageStartAt
  );
  assert.ok(
    Date.parse(chargedBack.coverage.effectiveCoverageEndAt) >=
      Date.parse(chargedBack.coverage.coverageStartAt)
  );
  assert.equal(executor.coverages.get('coverage-a').coverage_state, 'REVERSED');

  const chargebackReplay = await persistence.paidReconciliation.applyChargeback({
    ...baseContext('event-chargeback-a', { paidRelationshipId: 'relationship-a' }),
    paidCoverageId: 'coverage-renewal-reversal-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'renewal-reversal-a',
    effectiveCoverageEndAt: NOW
  });
  assert.equal(chargebackReplay.outcome, 'DUPLICATE');
  assert.equal(chargebackReplay.authority.entitlementRevision, '5');
  assert.equal(first.coverage.coverageState, 'VALID');
  assert.equal(second.coverage.coverageState, 'VALID');
});

test('out-of-order reversal converges through a pending source intent', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);

  addEvent(executor, 'event-refund-before-success', 'PAID_COVERAGE_REFUNDED', {
    effectiveAt: '2026-08-31T12:00:00.000Z'
  });
  const pending = await persistence.paidReconciliation.applyRefund({
    ...baseContext('event-refund-before-success', {
      paidRelationshipId: 'relationship-a'
    }),
    paidCoverageId: 'coverage-late-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-late-a',
    effectiveCoverageEndAt: '2026-08-31T12:00:00.000Z'
  });
  assert.equal(pending.outcome, 'APPLIED');
  assert.equal(pending.coverage, null);
  assert.equal(pending.relationship.lifecycleState, 'PENDING_FIRST_PAYMENT');
  assert.equal(pending.authority.entitlementRevision, '2');
  assert.equal(executor.pendingReversals.size, 1);

  const completed = await addFirstPurchase(executor, persistence, {
    eventId: 'event-late-success-a',
    coverageId: 'coverage-late-a',
    purchaseIdentity: 'purchase-late-a'
  });
  assert.equal(completed.relationship.lifecycleState, 'ACTIVE');
  assert.equal(completed.coverage.coverageState, 'REVERSED');
  assert.equal(
    completed.coverage.effectiveCoverageEndAt,
    '2026-08-31T12:00:00.000Z'
  );
  assert.equal(completed.authority.entitlementRevision, '3');
  assert.equal(executor.pendingReversals.size, 0);

  const replay = await persistence.paidReconciliation.applyRefund({
    ...baseContext('event-refund-before-success', {
      paidRelationshipId: 'relationship-a'
    }),
    paidCoverageId: 'coverage-late-a',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-late-a',
    effectiveCoverageEndAt: NOW
  });
  assert.equal(replay.outcome, 'DUPLICATE');
  assert.equal(replay.coverage.coverageState, 'REVERSED');
  assert.equal(replay.authority.entitlementRevision, '3');
});

test('cross-owner source linkage and stale expected-state transitions are rejected', async () => {
  const executor = new PaidPersistenceExecutor();
  const persistence = createPostgresCommercialPersistence(executor);
  await openRelationship(executor, persistence);
  await addFirstPurchase(executor, persistence);

  addEvent(executor, 'event-open-b', 'PAID_RELATIONSHIP_OPENED', {
    authority: 'authority-b'
  });
  await persistence.paidReconciliation.openFirstPaidRelationship({
    ownerId: 'owner-b',
    commercialAuthorityId: 'authority-b',
    eventId: 'event-open-b',
    paidRelationshipId: 'relationship-b',
    providerNamespace: null,
    providerContext: null,
    providerRelationshipRef: null,
    billingInterval: 'ANNUAL'
  });
  addEvent(executor, 'event-b-first', 'PAID_PURCHASE_SUCCEEDED', {
    authority: 'authority-b'
  });
  await persistence.paidReconciliation.recordSuccessfulFirstPurchase({
    ownerId: 'owner-b',
    commercialAuthorityId: 'authority-b',
    eventId: 'event-b-first',
    paidRelationshipId: 'relationship-b',
    paidCoverageId: 'coverage-b',
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-b',
    billingInterval: 'ANNUAL',
    coverageStartAt: NOW,
    scheduledCoverageEndAt: '2027-08-30T12:00:00.000Z'
  });

  addEvent(executor, 'event-cross-owner-refund', 'PAID_COVERAGE_REFUNDED', {
    authority: 'authority-b'
  });
  await assert.rejects(
    persistence.paidReconciliation.applyRefund({
      ownerId: 'owner-b',
      commercialAuthorityId: 'authority-b',
      eventId: 'event-cross-owner-refund',
      paidRelationshipId: 'relationship-b',
      paidCoverageId: 'coverage-a',
      purchaseNamespace: 'billing.test',
      purchaseIdentity: 'purchase-a',
      effectiveCoverageEndAt: NOW
    }),
    PaidCoverageConflictError
  );

  addEvent(executor, 'event-stale-transition', 'PAID_CANCELLATION_SCHEDULED');
  const relationshipRepository = new PostgresPaidBillingRelationshipRepository(
    executor
  );
  await assert.rejects(
    relationshipRepository.transition({
      ownerId: 'owner-a',
      commercialAuthorityId: 'authority-a',
      paidRelationshipId: 'relationship-a',
      expectedLifecycleState: 'PENDING_FIRST_PAYMENT',
      expectedRenewalIntent: 'ENABLED',
      nextLifecycleState: 'FIRST_PAYMENT_FAILED',
      nextRenewalIntent: 'ENABLED',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      graceStartedAt: null,
      graceUntil: null,
      failedRenewalIdentity: null,
      endedAt: null,
      endReason: null,
      lastReconciledEventId: 'event-stale-transition',
      sourceRevision: '99'
    }),
    PaidRelationshipTransitionConflictError
  );
  assert.equal(executor.authorities.get('authority-a').entitlement_revision, '2');
});

test('D2 public surface stays bounded, journal-linked, and excludes derived entitlement fields', async () => {
  const relationshipMethods = Object.getOwnPropertyNames(
    PostgresPaidBillingRelationshipRepository.prototype
  );
  assert.deepEqual(
    relationshipMethods.filter((name) => /delete/iu.test(name)),
    []
  );
  const relationshipSource = await readFile(
    new URL(
      '../src/commercial-persistence/postgres/postgres-paid-billing-relationship-repository.ts',
      import.meta.url
    ),
    'utf8'
  );
  const coverageSource = await readFile(
    new URL(
      '../src/commercial-persistence/postgres/postgres-paid-coverage-repository.ts',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(relationshipSource, /last_reconciled_event_id/u);
  assert.match(coverageSource, /success_event_id/u);
  assert.match(coverageSource, /reversal_event_id/u);
  assert.doesNotMatch(
    `${relationshipSource}\n${coverageSource}`,
    /\b(?:isPro|is_pro|tier|effectiveEntitlement|entitlementProjection)\b/u
  );
});
