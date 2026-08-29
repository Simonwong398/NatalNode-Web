import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PostgresPrivacyAccessAuditRepository
} from '../dist/index.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATION_PATH = new URL(
  'server/db/migrations/0006_privacy_access_audit.sql',
  REPOSITORY_ROOT
);
const OCCURRED_AT = '2026-08-29T12:00:00.000Z';

function createValidEvent(overrides = {}) {
  return {
    auditEventId: 'audit-event-1',
    occurredAt: OCCURRED_AT,
    actorType: 'HUMAN',
    actorId: 'actor-1',
    subjectAccountId: 'subject-account-1',
    action: 'READ',
    resourceCategory: 'VAULT',
    outcome: 'SUCCESS',
    requestId: 'request-1',
    ...overrides
  };
}

function createRepository({ query = async () => ({ rows: [] }) } = {}) {
  const calls = [];
  const repository = new PostgresPrivacyAccessAuditRepository({
    async query(sql, params) {
      calls.push({ sql, params });
      return query(sql, params);
    }
  });

  return { calls, repository };
}

test('Postgres privacy audit repository exposes only append', () => {
  assert.deepEqual(
    Object.getOwnPropertyNames(
      PostgresPrivacyAccessAuditRepository.prototype
    ).sort(),
    ['append', 'constructor']
  );
});

test('valid event maps to one parameterized bounded insert', async () => {
  const { calls, repository } = createRepository();
  const event = createValidEvent();

  await repository.append(event);

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO audit_events/u);
  assert.match(
    calls[0].sql,
    /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9\)/u
  );
  assert.deepEqual(calls[0].params, [
    event.auditEventId,
    event.occurredAt,
    event.actorType,
    event.actorId,
    event.subjectAccountId,
    event.action,
    event.resourceCategory,
    event.outcome,
    event.requestId
  ]);
  assert.doesNotMatch(calls[0].sql, /ON CONFLICT|UPDATE|DELETE|JSON/iu);
});

test('multi-subject audit review may omit the subject without changing the bounded shape', async () => {
  const { calls, repository } = createRepository();

  await repository.append(
    createValidEvent({
      actorType: 'SERVICE',
      actorId: 'service-audit-review',
      subjectAccountId: undefined,
      action: 'REVIEW',
      resourceCategory: 'AUDIT',
      outcome: 'SUCCESS',
      requestId: undefined
    })
  );

  assert.deepEqual(calls[0].params, [
    'audit-event-1',
    OCCURRED_AT,
    'SERVICE',
    'service-audit-review',
    null,
    'REVIEW',
    'AUDIT',
    'SUCCESS',
    null
  ]);
});

test('account-scoped events require a subject and reserve REVIEW for AUDIT', async () => {
  const missingSubject = createRepository();
  await assert.rejects(
    missingSubject.repository.append(
      createValidEvent({ subjectAccountId: undefined })
    ),
    /subjectAccountId/u
  );
  assert.equal(missingSubject.calls.length, 0);

  const invalidReviewScope = createRepository();
  await assert.rejects(
    invalidReviewScope.repository.append(
      createValidEvent({ action: 'REVIEW', resourceCategory: 'VAULT' })
    ),
    /action\/resourceCategory/u
  );
  assert.equal(invalidReviewScope.calls.length, 0);
});

test('invalid bounded dimensions are rejected before persistence', async () => {
  for (const [field, value] of [
    ['actorType', 'ADMIN'],
    ['resourceCategory', 'CHART'],
    ['action', 'WRITE'],
    ['outcome', 'ERROR']
  ]) {
    const { calls, repository } = createRepository();
    await assert.rejects(
      repository.append(createValidEvent({ [field]: value })),
      new RegExp(field, 'u')
    );
    assert.equal(calls.length, 0);
  }
});

test('opaque identifiers are bounded and invalid values never reach SQL', async () => {
  for (const field of ['auditEventId', 'actorId', 'subjectAccountId', 'requestId']) {
    const { calls, repository } = createRepository();
    await assert.rejects(
      repository.append(createValidEvent({ [field]: 'x'.repeat(257) })),
      new RegExp(field, 'u')
    );
    assert.equal(calls.length, 0);
  }
});

test('append persistence failure propagates without fallback', async () => {
  const persistenceError = new Error('database failure');
  const { calls, repository } = createRepository({
    query: async () => {
      throw persistenceError;
    }
  });

  await assert.rejects(
    repository.append(createValidEvent()),
    (error) => error === persistenceError
  );
  assert.equal(calls.length, 1);
});

test('migration creates bounded append-only storage without private payload or account cascade', async () => {
  const migration = await readFile(MIGRATION_PATH, 'utf8');

  assert.match(migration, /CREATE TABLE audit_events/u);
  assert.match(migration, /audit_event_id VARCHAR\(256\) PRIMARY KEY/u);
  assert.match(migration, /occurred_at TIMESTAMPTZ NOT NULL/u);
  assert.match(migration, /actor_type VARCHAR\(7\) NOT NULL/u);
  assert.match(migration, /actor_id VARCHAR\(256\) NOT NULL/u);
  assert.match(migration, /subject_account_id VARCHAR\(256\)/u);
  assert.match(migration, /action VARCHAR\(6\) NOT NULL/u);
  assert.match(migration, /resource_category VARCHAR\(16\) NOT NULL/u);
  assert.match(migration, /outcome VARCHAR\(7\) NOT NULL/u);
  assert.match(migration, /request_id VARCHAR\(256\)/u);
  assert.match(migration, /actor_type IN \('HUMAN', 'SERVICE'\)/u);
  assert.match(
    migration,
    /action IN \('READ', 'EXPORT', 'DELETE', 'REVIEW'\)/u
  );
  assert.match(
    migration,
    /outcome IN \('SUCCESS', 'DENIED', 'FAILED'\)/u
  );
  assert.match(migration, /audit_events_occurred_at_idx/u);
  assert.match(migration, /audit_events_subject_account_id_idx/u);
  assert.doesNotMatch(
    migration,
    /(?:metadata|payload|details|message|description|email|phone|ip|user_agent|chart_id|note_id|feedback_id|export_id|reason_code|FOREIGN KEY|REFERENCES users|ON DELETE CASCADE)/iu
  );
  assert.doesNotMatch(migration, /(?:BEGIN|COMMIT|ON CONFLICT)/u);
});
