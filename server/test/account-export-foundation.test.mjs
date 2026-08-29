import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAccountDataExportJsonValue,
  presentAccountDataExportAccount,
  presentAccountDataExportChart,
  presentAccountDataExportFeedback,
  presentAccountDataExportIdentity,
  UnsafeAccountDataExportValueError,
  UnsupportedAccountDataExportIdentityError
} from '../dist/account/account-data-export.js';
import { PostgresAccountDataExportRepository } from '../dist/persistence/postgres/postgres-account-data-export-repository.js';

const USER_A = 'user-a';
const USER_B = 'user-b';
const SHARED_CREATED_AT = '2026-08-27T00:00:00.000Z';

function createState() {
  return {
    users: [
      {
        user_id: USER_A,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-08-27T00:00:00.000Z'
      },
      {
        user_id: USER_B,
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-08-27T01:00:00.000Z'
      }
    ],
    identities: [
      {
        identity_id: 'identity-a',
        user_id: USER_A,
        provider: 'EMAIL_MAGIC_LINK',
        provider_subject: 'a@example.test',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-08-27T00:00:00.000Z'
      },
      {
        identity_id: 'identity-b',
        user_id: USER_B,
        provider: 'EMAIL_MAGIC_LINK',
        provider_subject: 'b@example.test',
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-08-27T01:00:00.000Z'
      }
    ],
    charts: [
      createChart('chart-a-1', USER_A, SHARED_CREATED_AT, 'First chart'),
      createChart('chart-a-2', USER_A, SHARED_CREATED_AT, 'Second chart'),
      createChart('chart-b-1', USER_B, '2026-08-27T02:00:00.000Z', 'Other chart')
    ],
    notes: [
      createNote('note-a-own', 'chart-a-1', USER_A, 'A owns this note.'),
      createNote('note-a-on-b-chart', 'chart-b-1', USER_A, 'A does not own this chart.'),
      createNote('note-b-on-a-chart', 'chart-a-1', USER_B, 'B does not own this note.'),
      createNote('note-b-own', 'chart-b-1', USER_B, 'B owns this note.')
    ],
    feedback: [
      {
        feedback_id: 'feedback-a',
        user_id: USER_A,
        category: 'SUGGESTION',
        message: 'A private suggestion.',
        created_at: '2026-08-27T03:00:00.000Z'
      },
      {
        feedback_id: 'feedback-b',
        user_id: USER_B,
        category: 'BUG',
        message: 'B private feedback.',
        created_at: '2026-08-27T04:00:00.000Z'
      }
    ],
    notification_channel_preferences: [
      {
        user_id: USER_A,
        channel: 'WEB_PUSH',
        enabled: true,
        created_at: '2026-08-27T07:00:00.000Z',
        updated_at: '2026-08-27T07:00:00.000Z'
      },
      {
        user_id: USER_B,
        channel: 'WEB_PUSH',
        enabled: false,
        created_at: '2026-08-27T07:00:00.000Z',
        updated_at: '2026-08-27T07:00:00.000Z'
      }
    ],
    notification_category_preferences: [
      {
        user_id: USER_A,
        category: 'ACCOUNT',
        enabled: false,
        created_at: '2026-08-27T07:01:00.000Z',
        updated_at: '2026-08-27T07:01:00.000Z'
      },
      {
        user_id: USER_B,
        category: 'SYSTEM',
        enabled: true,
        created_at: '2026-08-27T07:01:00.000Z',
        updated_at: '2026-08-27T07:01:00.000Z'
      }
    ],
    push_subscriptions: [
      {
        subscription_id: 'subscription-a-active',
        user_id: USER_A,
        endpoint: 'https://push.example.test/a-active',
        endpoint_hash: 'a'.repeat(64),
        p256dh: 'synthetic-p256dh-a',
        auth: 'synthetic-auth-a',
        created_at: '2026-08-27T07:02:00.000Z',
        updated_at: '2026-08-27T07:02:00.000Z',
        last_success_at: null,
        status: 'ACTIVE',
        invalidated_at: null
      },
      {
        subscription_id: 'subscription-a-invalidated',
        user_id: USER_A,
        endpoint: 'https://push.example.test/a-invalidated',
        endpoint_hash: 'b'.repeat(64),
        p256dh: 'synthetic-p256dh-b',
        auth: 'synthetic-auth-b',
        created_at: '2026-08-27T07:03:00.000Z',
        updated_at: '2026-08-27T07:04:00.000Z',
        last_success_at: '2026-08-27T07:03:30.000Z',
        status: 'INVALIDATED',
        invalidated_at: '2026-08-27T07:04:00.000Z'
      },
      {
        subscription_id: 'subscription-b',
        user_id: USER_B,
        endpoint: 'https://push.example.test/b',
        endpoint_hash: 'c'.repeat(64),
        p256dh: 'synthetic-p256dh-c',
        auth: 'synthetic-auth-c',
        created_at: '2026-08-27T07:05:00.000Z',
        updated_at: '2026-08-27T07:05:00.000Z',
        last_success_at: null,
        status: 'ACTIVE',
        invalidated_at: null
      }
    ]
  };
}

function createChart(chartId, userId, createdAt, displayName) {
  return {
    chart_id: chartId,
    user_id: userId,
    display_name: displayName,
    category: 'SELF',
    tags: ['persisted', 'research'],
    favorite: chartId === 'chart-a-1',
    normalized_input: {
      legacyRequest: true,
      birth: { localDate: '1990-01-01', locationLabel: 'Stored place' }
    },
    canonical_result: {
      legacyResult: true,
      metadata: {
        configurationStatus: 'INCOMPLETE_RESEARCH',
        astronomyConfigurationId: null,
        provenanceEnvelopeId: null
      }
    },
    engine_version: 'stored-engine',
    chart_schema_version: 'stored-schema',
    astronomy_configuration_id: null,
    provenance_envelope_id: 'stored-provenance',
    created_at: createdAt,
    updated_at: '2026-08-27T05:00:00.000Z'
  };
}

function createNote(noteId, chartId, userId, content) {
  return {
    note_id: noteId,
    chart_id: chartId,
    user_id: userId,
    content,
    created_at: '2026-08-27T06:00:00.000Z',
    updated_at: '2026-08-27T06:00:00.000Z'
  };
}

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim().toUpperCase();
}

function compareTuple(left, right) {
  const leftTime = Date.parse(left.created_at);
  const rightTime = Date.parse(right.createdAt);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.internal_id < right.internalId
    ? -1
    : left.internal_id > right.internalId
      ? 1
      : 0;
}

function afterCursor(row, createdAt, internalId, rowId) {
  if (createdAt === null) {
    return true;
  }

  return compareTuple(
    { created_at: row.created_at, internal_id: row[rowId] },
    { createdAt, internalId }
  ) > 0;
}

function sortedPage(rows, createdAt, internalId, rowId, limit) {
  return rows
    .filter((row) => afterCursor(row, createdAt, internalId, rowId))
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at);
      const rightTime = Date.parse(right.created_at);
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left[rowId] < right[rowId] ? -1 : left[rowId] > right[rowId] ? 1 : 0;
    })
    .slice(0, limit);
}

class FakeClient {
  constructor(state, options) {
    this.snapshot = structuredClone(state);
    this.options = options;
    this.calls = [];
    this.releaseCalls = [];
    this.transactionOpen = false;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    const copiedParams = [...params];
    this.calls.push({ sql, normalized, params: copiedParams });

    if (normalized === 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY') {
      this.transactionOpen = true;
      return { rows: [] };
    }

    if (normalized === 'COMMIT') {
      this.transactionOpen = false;
      return { rows: [] };
    }

    if (normalized === 'ROLLBACK') {
      if (this.options.failRollback) {
        throw new Error('rollback failed');
      }
      this.transactionOpen = false;
      return { rows: [] };
    }

    if (/\b(?:INSERT|UPDATE|DELETE)\b/u.test(normalized)) {
      throw new Error('export snapshot attempted a write');
    }

    if (normalized.includes('AUTH_SESSIONS') || normalized.includes('EMAIL_MAGIC_LINK_CHALLENGES')) {
      throw new Error('security state must not be read');
    }

    if (this.options.failWhen?.(normalized)) {
      throw new Error('injected query failure');
    }

    if (normalized.includes('FROM USERS')) {
      return {
        rows: this.snapshot.users.filter((row) => row.user_id === copiedParams[0])
      };
    }

    if (normalized.includes('SELECT DISTINCT PROVIDER')) {
      return {
        rows: [...new Set(
          this.snapshot.identities
            .filter((row) => row.user_id === copiedParams[0])
            .map((row) => row.provider)
        )].sort().map((provider) => ({ provider }))
      };
    }

    if (normalized.includes('FROM AUTH_IDENTITIES')) {
      const rows = this.snapshot.identities.filter((row) => row.user_id === copiedParams[0]);
      return {
        rows: sortedPage(rows, copiedParams[1], copiedParams[2], 'identity_id', copiedParams[3])
      };
    }

    if (normalized.includes('FROM CHART_NOTES')) {
      const [userId, chartId, createdAt, internalId, limit] = copiedParams;
      const chart = this.snapshot.charts.find((row) => row.chart_id === chartId);
      const rows = this.snapshot.notes.filter(
        (row) =>
          row.user_id === userId &&
          row.chart_id === chartId &&
          chart?.user_id === userId
      );
      return {
        rows: sortedPage(rows, createdAt, internalId, 'note_id', limit)
      };
    }

    if (normalized.includes('FROM CHARTS')) {
      const rows = this.snapshot.charts.filter((row) => row.user_id === copiedParams[0]);
      return {
        rows: sortedPage(rows, copiedParams[1], copiedParams[2], 'chart_id', copiedParams[3])
      };
    }

    if (normalized.includes('FROM FEEDBACK_SUBMISSIONS')) {
      const rows = this.snapshot.feedback.filter((row) => row.user_id === copiedParams[0]);
      return {
        rows: sortedPage(rows, copiedParams[1], copiedParams[2], 'feedback_id', copiedParams[3])
      };
    }

    if (normalized.includes('FROM NOTIFICATION_CHANNEL_PREFERENCES')) {
      return {
        rows: this.snapshot.notification_channel_preferences
          .filter((row) => row.user_id === copiedParams[0])
          .sort((left, right) => left.channel.localeCompare(right.channel))
          .map((row) => ({
            channel: row.channel,
            enabled: row.enabled,
            created_at: row.created_at,
            updated_at: row.updated_at
          }))
      };
    }

    if (normalized.includes('FROM NOTIFICATION_CATEGORY_PREFERENCES')) {
      return {
        rows: this.snapshot.notification_category_preferences
          .filter((row) => row.user_id === copiedParams[0])
          .sort((left, right) => left.category.localeCompare(right.category))
          .map((row) => ({
            category: row.category,
            enabled: row.enabled,
            created_at: row.created_at,
            updated_at: row.updated_at
          }))
      };
    }

    if (normalized.includes('FROM PUSH_SUBSCRIPTIONS')) {
      const rows = this.snapshot.push_subscriptions
        .filter((row) => row.user_id === copiedParams[0])
        .sort((left, right) =>
          left.created_at.localeCompare(right.created_at) ||
          left.subscription_id.localeCompare(right.subscription_id)
        );

      return {
        rows: sortedPage(
          rows,
          copiedParams[1],
          copiedParams[2],
          'subscription_id',
          copiedParams[3]
        )
          .map((row) => ({
            subscription_id: row.subscription_id,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_success_at: row.last_success_at,
            invalidated_at: row.invalidated_at
          }))
      };
    }

    throw new Error(`unhandled SQL: ${normalized}`);
  }

  release(error) {
    this.releaseCalls.push(error);
  }
}

class FakePool {
  constructor(state, options = {}) {
    this.state = state;
    this.options = options;
    this.clients = [];
  }

  async connect() {
    const client = new FakeClient(this.state, this.options);
    this.clients.push(client);
    return client;
  }
}

function createRepository(options = {}) {
  const state = createState();
  const pool = new FakePool(state, options);
  return { repository: new PostgresAccountDataExportRepository(pool), pool, state };
}

async function commitSnapshot(snapshot) {
  await snapshot.commit();
}

test('export presenters expose only approved fields and copy persisted JSON safely', () => {
  const sourceJson = { legacy: { preserved: true }, list: [1, 'two'] };
  const account = presentAccountDataExportAccount({
    userId: USER_A,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  const identity = presentAccountDataExportIdentity({
    provider: 'EMAIL_MAGIC_LINK',
    providerSubject: 'normalized@example.test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  const googleIdentity = presentAccountDataExportIdentity({
    provider: 'GOOGLE',
    providerSubject: 'google-subject-secret',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  const chart = presentAccountDataExportChart({
    displayName: 'Stored chart',
    category: 'SELF',
    tags: ['one'],
    favorite: true,
    normalizedChartRequest: sourceJson,
    canonicalChartResult: { research: true },
    engineVersion: 'engine',
    chartSchemaVersion: 'schema',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
    notes: [{ content: 'private note', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z' }]
  });
  const feedback = presentAccountDataExportFeedback({
    feedbackId: 'feedback-secret',
    userId: USER_A,
    category: 'BUG',
    message: 'Private message',
    createdAt: '2026-08-27T00:00:00.000Z'
  });

  assert.deepEqual(account, {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  assert.deepEqual(identity, {
    type: 'EMAIL_MAGIC_LINK',
    email: 'normalized@example.test',
    linkedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  assert.deepEqual(googleIdentity, {
    type: 'GOOGLE',
    linkedAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });
  assert.deepEqual(chart.normalizedChartRequest, sourceJson);
  assert.deepEqual(chart.notes, [{
    content: 'private note',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  }]);
  assert.deepEqual(feedback, {
    category: 'BUG',
    message: 'Private message',
    createdAt: '2026-08-27T00:00:00.000Z'
  });

  assert.equal('userId' in account, false);
  assert.equal('identityId' in identity, false);
  assert.equal('providerSubject' in identity, false);
  assert.equal('providerSubject' in googleIdentity, false);
  assert.equal('email' in googleIdentity, false);
  assert.equal('chartId' in chart, false);
  assert.equal('userId' in chart, false);
  assert.equal('noteId' in chart.notes[0], false);
  assert.equal('feedbackId' in feedback, false);

  chart.normalizedChartRequest.legacy.preserved = false;
  assert.equal(sourceJson.legacy.preserved, true);

  const cloned = assertAccountDataExportJsonValue(sourceJson, 'testJson');
  cloned.legacy.preserved = false;
  assert.equal(sourceJson.legacy.preserved, true);

  const cycle = {};
  cycle.self = cycle;
  assert.throws(
    () => assertAccountDataExportJsonValue(cycle, 'canonicalChartResult'),
    UnsafeAccountDataExportValueError
  );
});

test('unsupported identity providers fail closed before any identity is presented', async () => {
  const { repository, pool } = createRepository();
  pool.state.identities.push({
    identity_id: 'identity-google',
    user_id: USER_A,
    provider: 'UNSUPPORTED_PROVIDER',
    provider_subject: 'provider-secret',
    created_at: '2026-08-27T07:00:00.000Z',
    updated_at: '2026-08-27T07:00:00.000Z'
  });

  await assert.rejects(
    () => repository.openSnapshot(USER_A),
    (error) => {
      assert.equal(error instanceof UnsupportedAccountDataExportIdentityError, true);
      assert.equal(error.provider, 'UNSUPPORTED_PROVIDER');
      assert.doesNotMatch(error.message, /provider-secret|identity-google|user-a/iu);
      return true;
    }
  );

  assert.equal(pool.clients.length, 1);
  assert.deepEqual(pool.clients[0].releaseCalls, [false]);
  assert.equal(pool.clients[0].calls.at(-1).normalized, 'ROLLBACK');
});

test('account root, identity, chart, note, and feedback reads are strictly scoped to User A', async () => {
  const { repository, pool, state } = createRepository();
  const before = structuredClone(state);
  const opened = await repository.openSnapshot(USER_A);

  assert.equal(opened.outcome, 'opened');
  const snapshot = opened.snapshot;
  assert.deepEqual(snapshot.account, {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  });

  const identities = await snapshot.listIdentities();
  assert.deepEqual(identities.items, [{
    type: 'EMAIL_MAGIC_LINK',
    email: 'a@example.test',
    linkedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z'
  }]);

  const charts = await snapshot.listCharts();
  assert.equal(charts.items.length, 1);
  assert.equal(charts.items[0].chart.displayName, 'First chart');
  assert.equal(charts.items[0].chart.canonicalChartResult.legacyResult, true);
  assert.deepEqual(charts.items[0].chart.calculation, {
    engineVersion: 'stored-engine',
    chartSchemaVersion: 'stored-schema',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: 'stored-provenance'
  });

  const notes = await charts.items[0].listNotes();
  assert.deepEqual(notes.items, [{
    content: 'A owns this note.',
    createdAt: '2026-08-27T06:00:00.000Z',
    updatedAt: '2026-08-27T06:00:00.000Z'
  }]);

  const feedback = await snapshot.listFeedback();
  assert.deepEqual(feedback.items, [{
    category: 'SUGGESTION',
    message: 'A private suggestion.',
    createdAt: '2026-08-27T03:00:00.000Z'
  }]);

  const notifications = await snapshot.listNotifications();
  assert.deepEqual(notifications, {
    channelPreferences: [{
      channel: 'WEB_PUSH',
      enabled: true,
      createdAt: '2026-08-27T07:00:00.000Z',
      updatedAt: '2026-08-27T07:00:00.000Z'
    }],
    categoryPreferences: [{
      category: 'ACCOUNT',
      enabled: false,
      createdAt: '2026-08-27T07:01:00.000Z',
      updatedAt: '2026-08-27T07:01:00.000Z'
    }],
    pushSubscriptions: {
      items: [{
        subscriptionId: 'subscription-a-active',
        channel: 'WEB_PUSH',
        status: 'ACTIVE',
        createdAt: '2026-08-27T07:02:00.000Z',
        updatedAt: '2026-08-27T07:02:00.000Z',
        lastSuccessAt: null,
        invalidatedAt: null
      }, {
        subscriptionId: 'subscription-a-invalidated',
        channel: 'WEB_PUSH',
        status: 'INVALIDATED',
        createdAt: '2026-08-27T07:03:00.000Z',
        updatedAt: '2026-08-27T07:04:00.000Z',
        lastSuccessAt: '2026-08-27T07:03:30.000Z',
        invalidatedAt: '2026-08-27T07:04:00.000Z'
      }],
      nextCursor: null
    }
  });

  const serialized = JSON.stringify({
    account: snapshot.account,
    identities: identities.items,
    chart: charts.items[0].chart,
    notes: notes.items,
    feedback: feedback.items,
    notifications
  });
  for (const internalId of [
    'user-a',
    'user-b',
    'identity-a',
    'identity-b',
    'chart-a-1',
    'chart-b-1',
    'note-a-own',
    'note-b-own',
    'feedback-a',
    'feedback-b',
    'subscription-b'
  ]) {
    assert.equal(serialized.includes(internalId), false, internalId);
  }
  for (const sensitiveValue of [
    'https://push.example.test/a-active',
    'synthetic-p256dh-a',
    'synthetic-auth-a',
    'a'.repeat(64)
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, sensitiveValue);
  }

  await commitSnapshot(snapshot);
  assert.deepEqual(state, before);
  assert.equal(pool.clients.length, 1);
  assert.deepEqual(pool.clients[0].releaseCalls, [undefined]);
  assert.equal(pool.clients[0].calls.some((call) => /\b(?:INSERT|UPDATE|DELETE)\b/iu.test(call.normalized)), false);
  assert.equal(pool.clients[0].calls.some((call) => /AUTH_SESSIONS|CHALLENGES/iu.test(call.normalized)), false);
});

test('the snapshot uses one repeatable-read read-only client and deterministic bounded tuple pages', async () => {
  const { repository, pool } = createRepository();
  const opened = await repository.openSnapshot(USER_A);
  assert.equal(opened.outcome, 'opened');

  const snapshot = opened.snapshot;
  const firstPage = await snapshot.listCharts();
  assert.equal(firstPage.items[0].chart.displayName, 'First chart');
  assert.notEqual(firstPage.nextCursor, null);

  const secondPage = await snapshot.listCharts(firstPage.nextCursor);
  assert.equal(secondPage.items[0].chart.displayName, 'Second chart');

  const thirdPage = await snapshot.listCharts(secondPage.nextCursor);
  assert.deepEqual(thirdPage.items, []);
  assert.equal(thirdPage.nextCursor, null);

  const chartCalls = pool.clients[0].calls.filter((call) => call.normalized.includes('FROM CHARTS'));
  assert.equal(chartCalls.length, 3);
  assert.match(chartCalls[0].normalized, /\(CREATED_AT, CHART_ID\) > \(\$2::TIMESTAMPTZ, \$3::TEXT\)/u);
  assert.match(chartCalls[0].normalized, /ORDER BY CREATED_AT ASC, CHART_ID ASC LIMIT \$4$/u);
  assert.deepEqual(chartCalls[0].params, [USER_A, null, null, 1]);
  assert.deepEqual(chartCalls[1].params, [USER_A, SHARED_CREATED_AT, 'chart-a-1', 1]);
  assert.deepEqual(
    [firstPage.items[0].chart.displayName, secondPage.items[0].chart.displayName],
    ['First chart', 'Second chart']
  );

  const identityPage = await snapshot.listIdentities();
  const feedbackPage = await snapshot.listFeedback();
  assert.equal(identityPage.items.length, 1);
  assert.equal(feedbackPage.items.length, 1);
  const identityCall = pool.clients[0].calls.find((call) => call.normalized.includes('FROM AUTH_IDENTITIES') && !call.normalized.includes('SELECT DISTINCT'));
  const feedbackCall = pool.clients[0].calls.find((call) => call.normalized.includes('FROM FEEDBACK_SUBMISSIONS'));
  assert.equal(identityCall.params.at(-1), 100);
  assert.equal(feedbackCall.params.at(-1), 100);

  const notePage = await firstPage.items[0].listNotes();
  const noteCall = pool.clients[0].calls.find((call) => call.normalized.includes('FROM CHART_NOTES'));
  assert.equal(notePage.items.length, 1);
  assert.equal(noteCall.params.at(-1), 100);
  assert.match(noteCall.normalized, /NOTES\.USER_ID = \$1/u);
  assert.match(noteCall.normalized, /CHARTS\.USER_ID = \$1/u);

  assert.equal(pool.clients.length, 1);
  assert.equal(pool.clients[0].calls[0].normalized, 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await commitSnapshot(snapshot);
});

test('missing account is a narrow repository result and does not expose another account', async () => {
  const { repository, pool } = createRepository();
  const result = await repository.openSnapshot('missing-user');

  assert.deepEqual(result, { outcome: 'account-not-found' });
  assert.equal(pool.clients.length, 1);
  assert.equal(pool.clients[0].calls[0].normalized, 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  assert.equal(pool.clients[0].calls.at(-1).normalized, 'COMMIT');
  assert.deepEqual(pool.clients[0].releaseCalls, [undefined]);
});

test('query failure rolls back and releases the checked-out client', async () => {
  const { repository, pool } = createRepository({
    failWhen: (sql) => sql.includes('FROM CHARTS')
  });
  const opened = await repository.openSnapshot(USER_A);
  assert.equal(opened.outcome, 'opened');

  await assert.rejects(() => opened.snapshot.listCharts(), /injected query failure/u);
  const client = pool.clients[0];
  assert.equal(client.calls.at(-1).normalized, 'ROLLBACK');
  assert.deepEqual(client.releaseCalls, [undefined]);
  await assert.rejects(() => opened.snapshot.listFeedback(), /snapshot is no longer open/u);
});

test('rollback cleanup destroys a client when rollback itself cannot be trusted', async () => {
  const { repository, pool } = createRepository({
    failWhen: (sql) => sql.includes('FROM CHARTS'),
    failRollback: true
  });
  const opened = await repository.openSnapshot(USER_A);
  assert.equal(opened.outcome, 'opened');

  await assert.rejects(
    () => opened.snapshot.listCharts(),
    (error) => {
      assert.equal(error instanceof AggregateError, true);
      return true;
    }
  );
  assert.deepEqual(pool.clients[0].releaseCalls, [true]);
});
