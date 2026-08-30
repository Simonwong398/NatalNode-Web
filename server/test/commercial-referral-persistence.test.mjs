import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CommercialPersistenceIntegrityError,
  ReferralAttributionConflictError,
  ReferralNotEligibleError,
  ReferralRewardNotRevocableError,
  ReferralSelfReferralError,
  PostgresReferralPublicIdentityRepository,
  PostgresReferralReconciliationPrimitives,
  REFERRAL_REWARD_CAP,
  REFERRAL_REWARD_DURATION_US,
  REFERRAL_REWARD_MATURATION_DURATION_US,
  evaluateEffectiveEntitlement,
  exactReferralMaturesAt,
  getReferralGiveOfferEligibility
} from '../dist/index.js';
import { ensureD4ARewardShape, mapReferralRewardRow } from '../dist/commercial-persistence/postgres/postgres-referral-persistence-shared.js';
import { lockReferralOwners } from '../dist/commercial-persistence/postgres/postgres-referral-locking.js';
import { loadPostgresMigrations } from '../dist/runtime/postgres/migrations/load-postgres-migrations.js';

const REPOSITORY_ROOT = new URL('../../', import.meta.url);
const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('server/db/migrations/', REPOSITORY_ROOT)
);
const MIGRATION_PATH = new URL(
  'server/db/migrations/0014_referral_persistence.sql',
  REPOSITORY_ROOT
);
const REWARD_REPOSITORY_SOURCE_PATH = new URL(
  'server/src/commercial-persistence/postgres/postgres-referral-reward-repository.ts',
  REPOSITORY_ROOT
);
const LOCKING_SOURCE_PATH = new URL(
  'server/src/commercial-persistence/postgres/postgres-referral-locking.ts',
  REPOSITORY_ROOT
);
const RECONCILIATION_SOURCE_PATH = new URL(
  'server/src/commercial-persistence/postgres/postgres-referral-reconciliation-primitives.ts',
  REPOSITORY_ROOT
);
const NOW = '2026-08-30T12:00:00.000Z';
const PAYMENT_AT = '2026-08-16T12:00:00.000Z';
const MATURITY_AT = exactReferralMaturesAt(PAYMENT_AT);
const REFERRER_OWNER_ID = 'owner-a';
const REFERRED_OWNER_ID = 'owner-b';
const REFERRER_AUTHORITY_ID = 'authority-a';
const REFERRED_AUTHORITY_ID = 'authority-b';
const IDENTITY_ID = 'identity-a';
const ATTRIBUTION_ID = 'attribution-a';
const COVERAGE_ID = 'coverage-a';
const PURCHASE_EVENT_ID = 'purchase-event-a';
const REVERSAL_EVENT_ID = 'reversal-event-a';
const REFERRAL_REWARD_WINDOW_US = 360n * 24n * 60n * 60n * 1_000_000n;

function normalizeSql(sql) {
  return sql.replace(/\s+/gu, ' ').trim();
}

function toMicros(value) {
  const normalized = value instanceof Date ? value.toISOString() : value;
  const [whole, fraction = '000'] = normalized.replace(/Z$/u, '').split('.');
  return BigInt(Date.parse(`${whole}Z`)) * 1000n +
    BigInt(fraction.padEnd(6, '0'));
}

function authority(id, ownerId, entitlementRevision = '0') {
  return Object.freeze({
    commercialAuthorityId: id,
    ownerId,
    entitlementRevision,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function authorityRow(value) {
  return {
    commercial_authority_id: value.commercialAuthorityId,
    owner_id: value.ownerId,
    entitlement_revision: value.entitlementRevision,
    created_at: value.createdAt,
    updated_at: value.updatedAt
  };
}

function paidCoverageRow(overrides = {}) {
  return {
    paid_coverage_id: COVERAGE_ID,
    paid_relationship_id: 'relationship-a',
    commercial_authority_id: REFERRED_AUTHORITY_ID,
    purchase_namespace: 'billing.test',
    purchase_identity: 'purchase-a',
    billing_interval: 'MONTHLY',
    coverage_start_at: PAYMENT_AT,
    scheduled_coverage_end_at: '2026-09-16T12:00:00.000Z',
    effective_coverage_end_at: '2026-09-16T12:00:00.000Z',
    coverage_state: 'VALID',
    success_event_id: PURCHASE_EVENT_ID,
    reversal_event_id: null,
    reversed_at: null,
    reversal_reason: null,
    source_revision: '1',
    created_at: PAYMENT_AT,
    updated_at: PAYMENT_AT,
    ...overrides
  };
}

function paidEventRow({
  eventId = PURCHASE_EVENT_ID,
  eventType = 'PAID_PURCHASE_SUCCEEDED',
  authorityId = REFERRED_AUTHORITY_ID,
  effectiveAt = PAYMENT_AT
} = {}) {
  return {
    eventId,
    commercialAuthorityId: authorityId,
    eventType,
    sourceType: 'PAID',
    effectiveAt
  };
}

function identityRecord(overrides = {}) {
  return Object.freeze({
    referralPublicIdentityId: IDENTITY_ID,
    commercialAuthorityId: REFERRER_AUTHORITY_ID,
    publicValue: 'nnr_test_identity_value',
    status: 'ACTIVE',
    createdAt: NOW,
    revokedAt: null,
    supersedesIdentityId: null,
    ...overrides
  });
}

function attributionRecord(overrides = {}) {
  const state = overrides.state ?? 'ATTRIBUTED';
  return Object.freeze({
    referralAttributionId: ATTRIBUTION_ID,
    referralPublicIdentityId: IDENTITY_ID,
    referrerAuthorityId: REFERRER_AUTHORITY_ID,
    referredAuthorityId: REFERRED_AUTHORITY_ID,
    state,
    attributedAt: PAYMENT_AT,
    lockedAt: state === 'LOCKED' ? PAYMENT_AT : null,
    qualifyingPaidCoverageId: state === 'LOCKED' ? COVERAGE_ID : null,
    invalidationReason: null,
    invalidatedAt: null,
    campaignReference: null,
    lastEventId: 'attribution-event-a',
    sourceRevision: '0',
    createdAt: PAYMENT_AT,
    updatedAt: PAYMENT_AT,
    ...overrides
  });
}

function rewardRecord(overrides = {}) {
  const state = overrides.state ?? 'PENDING';
  const qualifyingPaymentAt = overrides.qualifyingPaymentAt ?? PAYMENT_AT;
  const maturesAt = overrides.maturesAt ?? MATURITY_AT;
  const earnedDurationUs =
    overrides.earnedDurationUs ??
    (state === 'EARNED' || state === 'APPLIED' ? REFERRAL_REWARD_DURATION_US : '0');
  const appliedDurationUs = overrides.appliedDurationUs ?? '0';
  const consumedDurationUs = overrides.consumedDurationUs ?? '0';
  const revokedDurationUs = overrides.revokedDurationUs ?? '0';
  const earnedAt =
    overrides.earnedAt ??
    (state === 'EARNED' || state === 'APPLIED' ? MATURITY_AT : null);
  const appliedAt = overrides.appliedAt ?? (state === 'APPLIED' ? MATURITY_AT : null);
  const revokedAt = overrides.revokedAt ?? (state === 'REVOKED' ? NOW : null);
  const remaining =
    BigInt(earnedDurationUs) -
    BigInt(consumedDurationUs) -
    BigInt(revokedDurationUs);
  return Object.freeze({
    referralRewardId: 'reward-a',
    referrerAuthorityId: REFERRER_AUTHORITY_ID,
    referralAttributionId: ATTRIBUTION_ID,
    qualifyingPaidCoverageId: COVERAGE_ID,
    state,
    qualifyingPaymentAt,
    admittedAt: overrides.admittedAt ?? '2026-08-30T11:00:00.000Z',
    maturesAt,
    earnedAt,
    appliedAt,
    revokedAt,
    grantedDurationUs: REFERRAL_REWARD_DURATION_US,
    earnedDurationUs,
    appliedDurationUs,
    consumedDurationUs,
    revokedDurationUs,
    activeConsumptionStartedAt: null,
    remainingUnconsumedDurationUs: remaining.toString(),
    availableDurationUs: state === 'APPLIED' ? remaining.toString() : '0',
    revocationReason: state === 'REVOKED' ? 'QUALIFYING_PURCHASE_REVERSED' : null,
    reversalEventId: state === 'REVOKED' ? REVERSAL_EVENT_ID : null,
    pendingEventId: 'pending-event-a',
    maturationEventId:
      state === 'EARNED' || state === 'APPLIED' || (state === 'REVOKED' && earnedAt !== null)
        ? 'mature-event-a'
        : null,
    applicationEventId: null,
    sourceRevision: '1',
    createdAt: PAYMENT_AT,
    updatedAt: NOW,
    ...overrides
  });
}

function referralEvent({
  eventId,
  eventType,
  commercialAuthorityId,
  sourceType = 'REFERRAL',
  sourceEntityId,
  effectiveAt = NOW,
  attributes = {}
}) {
  return Object.freeze({
    eventId,
    commercialAuthorityId,
    eventType,
    sourceType,
    sourceEntityId,
    sourceNamespace: sourceType === 'REFERRAL' ? 'referral.v1' : 'paid.v1',
    providerNamespace: null,
    providerContext: null,
    providerEventId: null,
    providerReceiptId: null,
    idempotencyNamespace: 'commercial.referral.v1',
    idempotencyKey: `${eventType}:${eventId}`,
    operationDigest: 'a'.repeat(64),
    occurredAt: effectiveAt,
    effectiveAt,
    ingestedAt: effectiveAt,
    causedByEventId: null,
    correctsEventId: null,
    reversesEventId: null,
    attributes,
    attributesVersion: 1,
    schemaVersion: 1,
    actorClass: 'SYSTEM',
    actorReference: 'test'
  });
}

class ReferralExecutor {
  constructor({
    authorities = [
      authority(REFERRER_AUTHORITY_ID, REFERRER_OWNER_ID),
      authority(REFERRED_AUTHORITY_ID, REFERRED_OWNER_ID)
    ],
    coverages = [paidCoverageRow()],
    paidEvents = [paidEventRow()],
    identities = [],
    hasPurchase = false,
    hasOtherPurchase = false,
    now = NOW
  } = {}) {
    this.calls = [];
    this.authorities = new Map(authorities.map((value) => [value.commercialAuthorityId, value]));
    this.coverages = new Map(coverages.map((value) => [value.paid_coverage_id, value]));
    this.paidEvents = new Map(paidEvents.map((value) => [value.eventId, value]));
    this.identities = new Map(
      identities.map((value) => [value.referralPublicIdentityId, {
        referral_public_identity_id: value.referralPublicIdentityId,
        commercial_authority_id: value.commercialAuthorityId,
        public_value: value.publicValue,
        status: value.status,
        created_at: value.createdAt,
        revoked_at: value.revokedAt,
        supersedes_identity_id: value.supersedesIdentityId
      }])
    );
    this.hasPurchase = hasPurchase;
    this.hasOtherPurchase = hasOtherPurchase;
    this.now = now;
  }

  async query(sql, params = []) {
    const normalized = normalizeSql(sql);
    this.calls.push({ sql: normalized, params: [...params] });

    if (normalized === 'SELECT CURRENT_TIMESTAMP AS now') {
      return { rows: [{ now: this.now }] };
    }

    if (normalized.includes('clock_timestamp()') && normalized.includes('to_char(')) {
      return { rows: [{ now: this.now }] };
    }

    if (normalized.includes('FROM users') && normalized.includes('FOR KEY SHARE')) {
      const ownerId = params[0];
      return { rows: ownerId === undefined ? [] : [{ user_id: ownerId }] };
    }

    if (
      normalized.includes('FROM commercial_authorities AS ca') &&
      normalized.includes('ca.owner_id = $1') &&
      normalized.includes('FOR UPDATE')
    ) {
      const record = [...this.authorities.values()].find(
        (value) => value.ownerId === params[0]
      );
      return { rows: record === undefined ? [] : [authorityRow(record)] };
    }

    if (normalized.startsWith('SELECT ca.owner_id FROM commercial_authorities AS ca')) {
      const record = this.authorities.get(params[0]);
      return { rows: record === undefined ? [] : [{ owner_id: record.ownerId }] };
    }

    if (normalized.startsWith('SELECT commercial_authority_id FROM commercial_authorities')) {
      const record = this.authorities.get(params[0]);
      return {
        rows:
          record !== undefined && record.ownerId === params[1]
            ? [{ commercial_authority_id: record.commercialAuthorityId }]
            : []
      };
    }

    if (normalized.startsWith('SELECT EXISTS')) {
      return { rows: [{ has_successful_first_purchase: this.hasPurchase }] };
    }

    if (normalized.startsWith('SELECT COUNT(*)::text AS successful_first_purchase_count')) {
      return {
        rows: [{ successful_first_purchase_count: this.hasOtherPurchase ? '1' : '0' }]
      };
    }

    if (
      normalized.includes('FROM commercial_events AS ce') &&
      normalized.includes('ce.event_id = $1')
    ) {
      const event = this.paidEvents.get(params[0]);
      if (event === undefined || event.commercialAuthorityId !== params[1]) {
        return { rows: [] };
      }
      return {
        rows: [{
          event_id: event.eventId,
          commercial_authority_id: event.commercialAuthorityId,
          event_type: event.eventType,
          source_type: event.sourceType,
          effective_at: event.effectiveAt
        }]
      };
    }

    if (
      normalized.includes('FROM paid_coverages AS pc') &&
      normalized.includes('ANY($1::text[])')
    ) {
      const requested = new Set(params[0]);
      return {
        rows: [...this.coverages.values()]
          .filter((value) => requested.has(value.paid_coverage_id))
          .sort((left, right) =>
            left.paid_coverage_id.localeCompare(right.paid_coverage_id)
          )
      };
    }

    if (normalized.startsWith('INSERT INTO referral_public_identities')) {
      const [id, authorityId, publicValue] = params;
      const duplicate = [...this.identities.values()].some(
        (value) =>
          value.public_value === publicValue ||
          (value.commercial_authority_id === authorityId && value.status === 'ACTIVE')
      );
      if (duplicate) {
        return { rows: [] };
      }
      const row = {
        referral_public_identity_id: id,
        commercial_authority_id: authorityId,
        public_value: publicValue,
        status: 'ACTIVE',
        created_at: this.now,
        revoked_at: null,
        supersedes_identity_id: null
      };
      this.identities.set(id, row);
      return { rows: [row] };
    }

    if (normalized.includes('FROM referral_public_identities AS rpi')) {
      let row;
      if (normalized.includes('rpi.referral_public_identity_id = $1')) {
        row = [...this.identities.values()].find(
          (value) => value.referral_public_identity_id === params[0]
        );
      } else if (normalized.includes('rpi.public_value = $1')) {
        row = [...this.identities.values()].find(
          (value) => value.public_value === params[0] && value.status === 'ACTIVE'
        );
      } else {
        row = [...this.identities.values()].find(
          (value) =>
            value.commercial_authority_id === params[0] && value.status === 'ACTIVE'
        );
      }
      return { rows: row === undefined ? [] : [row] };
    }

    throw new Error(`Unhandled SQL in focused referral test: ${normalized}`);
  }
}

class FakeAuthorityRepository {
  constructor(authorities) {
    this.authorities = new Map(authorities.map((value) => [value.ownerId, value]));
    this.advanceCalls = [];
  }

  async getByOwnerId(ownerId) {
    return this.authorities.get(ownerId) ?? null;
  }

  async advanceRevisionAfterLock(input) {
    this.advanceCalls.push(input);
    const current = this.authorities.get(input.ownerId);
    assert.ok(current);
    assert.equal(current.commercialAuthorityId, input.commercialAuthorityId);
    assert.equal(current.entitlementRevision, input.expectedRevision);
    const updated = authority(
      current.commercialAuthorityId,
      current.ownerId,
      (BigInt(current.entitlementRevision) + 1n).toString()
    );
    this.authorities.set(input.ownerId, updated);
    return updated;
  }
}

class FakeEventRepository {
  constructor(initialEvents = []) {
    this.events = new Map(
      initialEvents.map((value) => [
        `${value.idempotencyNamespace}:${value.idempotencyKey}`,
        value
      ])
    );
    this.appendCalls = [];
  }

  async appendIdempotent(input) {
    this.appendCalls.push(input);
    const key = `${input.idempotencyNamespace}:${input.idempotencyKey}`;
    const existing = this.events.get(key);
    if (existing !== undefined) {
      return { outcome: 'DUPLICATE', event: existing };
    }
    const event = referralEvent({
      eventId: input.eventId,
      eventType: input.eventType,
      commercialAuthorityId: input.commercialAuthorityId,
      sourceType: input.sourceType,
      sourceEntityId: input.sourceEntityId,
      effectiveAt: input.effectiveAt,
      attributes: input.attributes
    });
    this.events.set(key, event);
    return { outcome: 'APPENDED', event };
  }

  async getByIdempotencyIdentity(namespace, key) {
    return this.events.get(`${namespace}:${key}`) ?? null;
  }
}

class FakeIdentityRepository {
  constructor(identities = []) {
    this.identities = new Map(
      identities.map((value) => [value.referralPublicIdentityId, value])
    );
  }

  async getById(id) {
    return this.identities.get(id) ?? null;
  }
}

class FakeAttributionRepository {
  constructor(record = null) {
    this.record = record;
    this.establishCalls = [];
    this.attachCalls = [];
  }

  async getById(id) {
    return this.record?.referralAttributionId === id ? this.record : null;
  }

  async getByReferredAuthority(authorityId) {
    return this.record?.referredAuthorityId === authorityId ? this.record : null;
  }

  async getByQualifyingPaidCoverage(coverageId) {
    return this.record?.qualifyingPaidCoverageId === coverageId ? this.record : null;
  }

  async lockForUpdate(id) {
    return this.record?.referralAttributionId === id ? this.record : null;
  }

  async lockByReferredAuthority(authorityId) {
    return this.record?.referredAuthorityId === authorityId ? this.record : null;
  }

  async lockByIds(ids) {
    return ids
      .map((id) => this.record?.referralAttributionId === id ? this.record : null)
      .filter((value) => value !== null);
  }

  async establish(input) {
    this.establishCalls.push(input);
    this.record = attributionRecord({
      referralAttributionId: input.referralAttributionId,
      referralPublicIdentityId: input.referralPublicIdentityId,
      referrerAuthorityId: input.referrerAuthorityId,
      referredAuthorityId: input.referredAuthorityId,
      attributedAt: input.attributedAt,
      campaignReference: input.campaignReference,
      lastEventId: input.lastEventId,
      sourceRevision: input.sourceRevision
    });
    return this.record;
  }

  async attachQualifyingPurchase(input) {
    this.attachCalls.push(input);
    this.record = attributionRecord({
      ...this.record,
      state: 'LOCKED',
      lockedAt: input.lockedAt,
      qualifyingPaidCoverageId: input.qualifyingPaidCoverageId,
      lastEventId: input.lastEventId,
      sourceRevision: input.sourceRevision,
      updatedAt: input.lockedAt
    });
    return this.record;
  }
}

class FakeRewardRepository {
  constructor({ reward = null, capRows = [], candidates = [] } = {}) {
    this.rewards = new Map(reward === null ? [] : [[reward.referralRewardId, reward]]);
    this.capRows = capRows;
    this.candidates = candidates;
    this.createCalls = [];
    this.matureCalls = [];
    this.revokeCalls = [];
  }

  async getById(id) {
    return this.rewards.get(id) ?? null;
  }

  async getByAttribution(id) {
    return [...this.rewards.values()].find(
      (value) => value.referralAttributionId === id
    ) ?? null;
  }

  async getByQualifyingPaidCoverage(id) {
    return [...this.rewards.values()].find(
      (value) => value.qualifyingPaidCoverageId === id
    ) ?? null;
  }

  async listMaturationCandidates() {
    return this.candidates;
  }

  async lockForUpdate(id) {
    return this.rewards.get(id) ?? null;
  }

  async lockByIds(ids) {
    return ids
      .map((id) => this.rewards.get(id) ?? this.candidates.find((value) => value.referralRewardId === id))
      .filter((value) => value !== undefined);
  }

  async lockCapWindow(_referrerAuthorityId, admittedAt) {
    const candidate = toMicros(admittedAt);
    return this.capRows
      .filter((row) => {
        const admission = toMicros(row.admittedAt);
        return admission >= candidate - REFERRAL_REWARD_WINDOW_US &&
          admission < candidate;
      })
      .sort((left, right) => {
        const leftAdmission = toMicros(left.admittedAt);
        const rightAdmission = toMicros(right.admittedAt);
        return leftAdmission < rightAdmission ? -1 : leftAdmission > rightAdmission ? 1 :
          left.referralRewardId.localeCompare(right.referralRewardId);
      });
  }

  async createPending(input) {
    this.createCalls.push(input);
    const reward = rewardRecord({
      referralRewardId: input.referralRewardId,
      referralAttributionId: input.referralAttributionId,
      qualifyingPaidCoverageId: input.qualifyingPaidCoverageId,
      qualifyingPaymentAt: input.qualifyingPaymentAt,
      admittedAt: input.admittedAt,
      maturesAt: exactReferralMaturesAt(input.qualifyingPaymentAt),
      pendingEventId: input.pendingEventId,
      sourceRevision: input.sourceRevision
    });
    this.rewards.set(reward.referralRewardId, reward);
    return reward;
  }

  async mature(input) {
    this.matureCalls.push(input);
    const existing = this.rewards.get(input.referralRewardId);
    assert.ok(existing);
    const updated = rewardRecord({
      ...existing,
      state: 'EARNED',
      earnedAt: input.earnedAt,
      earnedDurationUs: REFERRAL_REWARD_DURATION_US,
      maturationEventId: input.maturationEventId,
      sourceRevision: input.sourceRevision,
      updatedAt: input.earnedAt
    });
    this.rewards.set(updated.referralRewardId, updated);
    return updated;
  }

  async revoke(input) {
    this.revokeCalls.push(input);
    const existing = this.rewards.get(input.referralRewardId) ??
      this.candidates.find((value) => value.referralRewardId === input.referralRewardId);
    assert.ok(existing);
    const updated = rewardRecord({
      ...existing,
      state: 'REVOKED',
      revokedAt: input.revokedAt,
      revocationReason: input.revocationReason,
      reversalEventId: input.reversalEventId,
      revokedDurationUs:
        existing.earnedDurationUs === '0'
          ? '0'
          : (
              BigInt(existing.earnedDurationUs) -
              BigInt(existing.consumedDurationUs) -
              BigInt(existing.revokedDurationUs)
            ).toString(),
      sourceRevision: input.sourceRevision,
      updatedAt: input.revokedAt
    });
    this.rewards.set(updated.referralRewardId, updated);
    return updated;
  }
}

function makeHarness({
  authorities = [
    authority(REFERRER_AUTHORITY_ID, REFERRER_OWNER_ID),
    authority(REFERRED_AUTHORITY_ID, REFERRED_OWNER_ID)
  ],
  attribution = null,
  identities = [identityRecord()],
  reward = null,
  capRows = [],
  candidates = [],
  coverages = [paidCoverageRow()],
  paidEvents = [paidEventRow()],
  hasPurchase = false,
  hasOtherPurchase = false,
  now = NOW,
  timeBank = null
} = {}) {
  const executor = new ReferralExecutor({
    authorities,
    coverages,
    paidEvents,
    hasPurchase,
    hasOtherPurchase,
    now
  });
  const authorityRepository = new FakeAuthorityRepository(authorities);
  const eventRepository = new FakeEventRepository();
  const identityRepository = new FakeIdentityRepository(identities);
  const attributionRepository = new FakeAttributionRepository(attribution);
  const rewardRepository = new FakeRewardRepository({ reward, capRows, candidates });
  const service = new PostgresReferralReconciliationPrimitives(
    executor,
    authorityRepository,
    eventRepository,
    identityRepository,
    attributionRepository,
    rewardRepository,
    timeBank
  );
  return {
    executor,
    authorityRepository,
    eventRepository,
    identityRepository,
    attributionRepository,
    rewardRepository,
    timeBank,
    service
  };
}

test('frozen migration 0014 remains intact before loader-valid D4B migration 0015', async () => {
  const names = (await readdir(new URL('server/db/migrations/', REPOSITORY_ROOT)))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/u.test(name))
    .sort();
  assert.equal(names.at(-1), '0015_referral_time_bank.sql');
  assert.ok(names.includes('0011_commercial_persistence_foundation.sql'));
  assert.ok(names.includes('0012_paid_billing_coverage.sql'));
  assert.ok(names.includes('0013_entitlement_projection.sql'));
  assert.equal(
    names.indexOf('0014_referral_persistence.sql') + 1,
    names.indexOf('0015_referral_time_bank.sql')
  );

  const migration = await readFile(MIGRATION_PATH, 'utf8');
  assert.match(migration, /CREATE TABLE referral_public_identities/u);
  assert.match(migration, /CREATE TABLE referral_attributions/u);
  assert.match(migration, /CREATE TABLE referral_rewards/u);
  assert.match(migration, /referral_public_identities_public_value_unique/u);
  assert.match(migration, /referral_public_identities_one_active_authority_idx/u);
  assert.match(migration, /referral_attributions_referred_unique/u);
  assert.match(migration, /referral_attributions_not_self_check/u);
  assert.match(migration, /referral_rewards_one_active_consumption_idx/u);
  assert.match(migration, /referral_rewards_standard_duration_check/u);
  assert.match(migration, /admitted_at TIMESTAMPTZ NOT NULL/u);
  assert.match(
    migration,
    /referrer_authority_id,\s*admitted_at,\s*referral_reward_id/u
  );
  assert.match(migration, /NEW\.admitted_at IS DISTINCT FROM OLD\.admitted_at/u);
  assert.match(migration, /REFERRAL_REWARD_CAP_REJECTED/u);
  assert.match(migration, /Referral rewards must be created in PENDING state/u);
  assert.match(migration, /ON DELETE CASCADE/u);
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\s*;/u);
  assert.doesNotMatch(
    migration,
    /\b(?:stripe|paddle|paypal|coupon|currency|birth_date|birth_time|chart_id|planet|aspect|ad_click|impression)\b/iu
  );

  const loaded = await loadPostgresMigrations(MIGRATIONS_DIRECTORY);
  const artifact = loaded.find(({ version }) => version === '0014');
  assert.equal(artifact?.filename, '0014_referral_persistence.sql');
  assert.match(artifact?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
  assert.doesNotMatch(artifact?.executableSql ?? '', /\b(?:BEGIN|COMMIT)\s*;/u);
  const timeBankArtifact = loaded.find(({ version }) => version === '0015');
  assert.equal(timeBankArtifact?.filename, '0015_referral_time_bank.sql');
  assert.match(timeBankArtifact?.checksumSha256 ?? '', /^[0-9a-f]{64}$/u);
});

test('Referral cap uses admitted_at, exact 360 elapsed days, and every lifecycle state', async () => {
  const rewardRepositorySource = await readFile(REWARD_REPOSITORY_SOURCE_PATH, 'utf8');
  const capSql = rewardRepositorySource.match(
    /const LOCK_CAP_WINDOW_SQL = `([\s\S]*?)`;/u
  )?.[1];
  assert.ok(capSql);
  assert.match(capSql, /rr\.admitted_at\s+>=/u);
  assert.match(capSql, /INTERVAL '360 days'/u);
  assert.match(capSql, /rr\.admitted_at\s+<\s+\$2::timestamptz/u);
  assert.doesNotMatch(capSql, /12 months|qualifying_payment_at|rr\.state/iu);

  const candidate = '2025-03-01T00:00:00.000000Z';
  const exactLowerBoundary = '2024-03-06T00:00:00.000000Z';
  const justOutside = '2024-03-05T23:59:59.999999Z';
  const harness = makeHarness({
    capRows: [
      rewardRecord({
        referralRewardId: 'pending-boundary',
        admittedAt: exactLowerBoundary,
        state: 'PENDING'
      }),
      rewardRecord({
        referralRewardId: 'earned-revoked',
        admittedAt: '2025-02-28T23:59:59.999999Z',
        state: 'REVOKED',
        earnedAt: MATURITY_AT,
        earnedDurationUs: REFERRAL_REWARD_DURATION_US,
        revokedDurationUs: REFERRAL_REWARD_DURATION_US
      }),
      rewardRecord({
        referralRewardId: 'applied',
        admittedAt: '2025-02-28T12:00:00.000000Z',
        state: 'APPLIED',
        earnedAt: MATURITY_AT,
        appliedAt: MATURITY_AT,
        earnedDurationUs: REFERRAL_REWARD_DURATION_US,
        appliedDurationUs: REFERRAL_REWARD_DURATION_US
      }),
      rewardRecord({
        referralRewardId: 'pending-revoked',
        admittedAt: '2025-02-28T00:00:00.000001Z',
        state: 'REVOKED',
        revokedAt: NOW,
        revocationReason: 'QUALIFYING_PURCHASE_REVERSED',
        reversalEventId: REVERSAL_EVENT_ID
      }),
      rewardRecord({
        referralRewardId: 'outside-boundary',
        admittedAt: justOutside,
        state: 'EARNED',
        earnedAt: MATURITY_AT,
        earnedDurationUs: REFERRAL_REWARD_DURATION_US
      })
    ]
  });
  const locked = await harness.rewardRepository.lockCapWindow(
    REFERRER_AUTHORITY_ID,
    candidate
  );
  assert.deepEqual(
    locked.map((reward) => reward.referralRewardId),
    ['pending-boundary', 'pending-revoked', 'applied', 'earned-revoked']
  );
  assert.equal(locked.some((reward) => reward.referralRewardId === 'outside-boundary'), false);
});

test('admission uses a post-lock database wall clock with microsecond text precision', async () => {
  const lockingSource = await readFile(LOCKING_SOURCE_PATH, 'utf8');
  const admissionStart = lockingSource.indexOf('export async function referralAdmissionNow');
  assert.notEqual(admissionStart, -1);
  const admissionSource = lockingSource.slice(admissionStart);
  assert.match(admissionSource, /clock_timestamp\(\)/u);
  assert.match(admissionSource, /AT TIME ZONE 'UTC'/u);
  assert.match(admissionSource, /to_char\(/u);
  assert.doesNotMatch(admissionSource, /CURRENT_TIMESTAMP/u);

  const reconciliationSource = await readFile(RECONCILIATION_SOURCE_PATH, 'utf8');
  const qualificationStart = reconciliationSource.indexOf(
    'public async qualifyFirstPurchase'
  );
  assert.notEqual(qualificationStart, -1);
  const qualificationSource = reconciliationSource.slice(qualificationStart);
  const ownerLockIndex = qualificationSource.indexOf('await lockReferralOwners');
  const admissionIndex = qualificationSource.indexOf('const candidateAdmittedAt');
  const capLockIndex = qualificationSource.indexOf('await this.rewards.lockCapWindow');
  assert.ok(ownerLockIndex >= 0 && ownerLockIndex < admissionIndex);
  assert.ok(admissionIndex < capLockIndex);

  const harness = makeHarness({
    attribution: attributionRecord(),
    now: '2026-08-30T12:00:00.123456Z'
  });
  const result = await harness.service.qualifyFirstPurchase({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    qualifyingPaidCoverageId: COVERAGE_ID
  });
  assert.equal(result.outcome, 'APPLIED');
  assert.equal(
    harness.rewardRepository.createCalls[0].admittedAt,
    '2026-08-30T12:00:00.123456Z'
  );
  assert.notEqual(harness.rewardRepository.createCalls[0].admittedAt, PAYMENT_AT);
});

test('0014 trigger bodies use qualified table aliases and erasure deletes authority before user', async () => {
  const migration = await readFile(MIGRATION_PATH, 'utf8');
  const functionNames = [
    'enforce_referral_public_identity_update_v1',
    'enforce_referral_attribution_v1',
    'enforce_referral_reward_v1',
    'enforce_referral_cap_decision_v1',
    'enforce_referral_reward_cap_exclusion_v1'
  ];
  for (const functionName of functionNames) {
    assert.match(
      migration,
      new RegExp(`CREATE OR REPLACE FUNCTION ${functionName}\\(\\)[\\s\\S]*?LANGUAGE plpgsql`, 'u')
    );
  }
  const attributionBody = migration.match(
    /CREATE OR REPLACE FUNCTION enforce_referral_attribution_v1\(\)[\s\S]*?AS \$\$([\s\S]*?)\$\$;/u
  )?.[1];
  assert.ok(attributionBody);
  assert.match(attributionBody, /resolved_event_authority_id TEXT;/u);
  assert.doesNotMatch(attributionBody, /^\s*(?:commercial_authority_id|source_type|event_type)\s+TEXT;/mu);

  const rewardBody = migration.match(
    /CREATE OR REPLACE FUNCTION enforce_referral_reward_v1\(\)[\s\S]*?AS \$\$([\s\S]*?)\$\$;/u
  )?.[1];
  assert.ok(rewardBody);
  assert.match(rewardBody, /resolved_pending_event_authority_id TEXT;/u);
  assert.doesNotMatch(rewardBody, /^\s*(?:commercial_authority_id|source_type|event_type)\s+TEXT;/mu);

  const erasure = await readFile(
    new URL('server/src/persistence/postgres/postgres-account-erasure-repository.ts', REPOSITORY_ROOT),
    'utf8'
  );
  assert.ok(erasure.indexOf('DELETE_COMMERCIAL_AUTHORITY_SQL') < erasure.indexOf('DELETE_USER_ROOT_SQL'));
  assert.match(erasure, /DELETE FROM commercial_authorities/u);
  assert.match(erasure, /DELETE FROM users/u);
});

test('Give eligibility and exact Referral elapsed durations are provider-neutral', () => {
  const monthly = getReferralGiveOfferEligibility({
    attributionState: 'ATTRIBUTED',
    qualifyingPaidCoverageId: null,
    hasSuccessfulFirstPurchase: false,
    billingInterval: 'MONTHLY'
  });
  const annual = getReferralGiveOfferEligibility({
    attributionState: 'ATTRIBUTED',
    qualifyingPaidCoverageId: null,
    hasSuccessfulFirstPurchase: false,
    billingInterval: 'ANNUAL'
  });
  const noAttribution = getReferralGiveOfferEligibility({
    attributionState: null,
    qualifyingPaidCoverageId: null,
    hasSuccessfulFirstPurchase: false,
    billingInterval: 'MONTHLY'
  });
  const consumed = getReferralGiveOfferEligibility({
    attributionState: 'LOCKED',
    qualifyingPaidCoverageId: COVERAGE_ID,
    hasSuccessfulFirstPurchase: true,
    billingInterval: 'ANNUAL'
  });

  assert.equal(monthly.offerClass, 'FIRST_PAID_MONTH_50_PERCENT_OFF');
  assert.equal(annual.offerClass, 'FIRST_PAID_YEAR_15_PERCENT_OFF');
  assert.equal(noAttribution.offerClass, 'NOT_ELIGIBLE');
  assert.equal(consumed.offerClass, 'CONSUMED');
  assert.deepEqual(Object.keys(monthly).sort(), [
    'billingInterval',
    'offerClass',
    'outcome',
    'reason'
  ]);
  assert.equal(REFERRAL_REWARD_DURATION_US, '2592000000000');
  assert.equal(REFERRAL_REWARD_MATURATION_DURATION_US, '1209600000000');
  assert.equal(exactReferralMaturesAt(PAYMENT_AT), MATURITY_AT);
  assert.equal(monthly.provider, undefined);
  assert.equal(monthly.currency, undefined);
});

test('D4A acquisition rows alone do not authorize without a D4B Referral source snapshot', () => {
  const result = evaluateEffectiveEntitlement({
    commercialAuthorityId: REFERRER_AUTHORITY_ID,
    entitlementRevision: '1',
    evaluatedAt: NOW,
    paidBillingRelationships: [],
    paidCoverages: []
  });
  assert.equal(result.determination, 'DETERMINATE');
  assert.equal(result.effectivePro, false);
  assert.deepEqual(result.currentSourceClasses, []);
});

test('multi-owner referral locking sorts all owner roots before all authorities', async () => {
  const executor = new ReferralExecutor();
  const locked = await lockReferralOwners(executor, [REFERRED_OWNER_ID, REFERRER_OWNER_ID, REFERRER_OWNER_ID]);
  assert.deepEqual(
    locked.map((value) => value.ownerId),
    [REFERRER_OWNER_ID, REFERRED_OWNER_ID]
  );
  const lockCalls = executor.calls.filter((call) =>
    call.sql.includes('FOR KEY SHARE') ||
    (call.sql.includes('FROM commercial_authorities AS ca') && call.sql.includes('FOR UPDATE'))
  );
  assert.deepEqual(
    lockCalls.map((call) => call.params[0]),
    [REFERRER_OWNER_ID, REFERRED_OWNER_ID, REFERRER_OWNER_ID, REFERRED_OWNER_ID]
  );
  assert.ok(lockCalls[1].sql.includes('FROM users'));
  assert.ok(lockCalls[2].sql.includes('FROM commercial_authorities'));
});

test('public identity ensure creates one opaque stable identity per authority', async () => {
  const executor = new ReferralExecutor({ identities: [] });
  const repository = new PostgresReferralPublicIdentityRepository(executor);
  const first = await repository.ensure({
    ownerId: REFERRER_OWNER_ID,
    commercialAuthorityId: REFERRER_AUTHORITY_ID
  });
  const replay = await repository.ensure({
    ownerId: REFERRER_OWNER_ID,
    commercialAuthorityId: REFERRER_AUTHORITY_ID
  });
  const other = await repository.ensure({
    ownerId: REFERRED_OWNER_ID,
    commercialAuthorityId: REFERRED_AUTHORITY_ID
  });

  assert.equal(first.outcome, 'CREATED');
  assert.equal(replay.outcome, 'EXISTING');
  assert.equal(replay.identity.publicValue, first.identity.publicValue);
  assert.notEqual(other.identity.publicValue, first.identity.publicValue);
  assert.match(first.identity.publicValue, /^nnr_[A-Za-z0-9_-]{43}$/u);
  assert.equal(first.identity.publicValue.includes(REFERRER_OWNER_ID), false);
  assert.equal(first.identity.publicValue.includes(REFERRER_AUTHORITY_ID), false);
  assert.equal(Object.isFrozen(first.identity), true);
});

test('attribution is first-valid-wins, self-referral-safe, and pre-purchase only', async () => {
  const initial = makeHarness({ attribution: null });
  const established = await initial.service.establishAttribution({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    referralPublicIdentityId: IDENTITY_ID,
    campaignReference: 'launch-2026'
  });
  assert.equal(established.outcome, 'APPLIED');
  assert.equal(established.attribution.state, 'ATTRIBUTED');
  assert.equal(initial.authorityRepository.advanceCalls.length, 0);
  assert.deepEqual(
    initial.eventRepository.appendCalls.map((value) => value.eventType),
    ['REFERRAL_ATTRIBUTION_RECORDED']
  );

  const replay = makeHarness({ attribution: established.attribution });
  const replayResult = await replay.service.establishAttribution({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    referralPublicIdentityId: IDENTITY_ID
  });
  assert.equal(replayResult.outcome, 'DUPLICATE');
  assert.equal(replay.eventRepository.appendCalls.length, 0);
  assert.equal(replay.authorityRepository.advanceCalls.length, 0);

  const secondReferrer = makeHarness({
    authorities: [
      authority('authority-a', 'owner-a'),
      authority('authority-b', 'owner-b'),
      authority('authority-c', 'owner-c')
    ],
    identities: [
      identityRecord({
        referralPublicIdentityId: 'identity-c',
        commercialAuthorityId: 'authority-c'
      })
    ],
    attribution: established.attribution
  });
  await assert.rejects(
    secondReferrer.service.establishAttribution({
      referrerOwnerId: 'owner-c',
      referredOwnerId: REFERRED_OWNER_ID,
      referralAttributionId: 'attribution-c',
      referralPublicIdentityId: 'identity-c'
    }),
    ReferralAttributionConflictError
  );

  const afterPurchase = makeHarness({ attribution: null, hasPurchase: true });
  await assert.rejects(
    afterPurchase.service.establishAttribution({
      referrerOwnerId: REFERRER_OWNER_ID,
      referredOwnerId: REFERRED_OWNER_ID,
      referralAttributionId: ATTRIBUTION_ID,
      referralPublicIdentityId: IDENTITY_ID
    }),
    ReferralNotEligibleError
  );

  const self = makeHarness();
  await assert.rejects(
    self.service.establishAttribution({
      referrerOwnerId: REFERRER_OWNER_ID,
      referredOwnerId: REFERRER_OWNER_ID,
      referralAttributionId: ATTRIBUTION_ID,
      referralPublicIdentityId: IDENTITY_ID
    }),
    ReferralSelfReferralError
  );
});

test('successful first qualifying purchase creates one referrer-owned PENDING reward', async () => {
  const harness = makeHarness({ attribution: attributionRecord() });
  const result = await harness.service.qualifyFirstPurchase({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    qualifyingPaidCoverageId: COVERAGE_ID
  });

  assert.equal(result.outcome, 'APPLIED');
  assert.equal(result.reward?.state, 'PENDING');
  assert.equal(result.reward?.referrerAuthorityId, REFERRER_AUTHORITY_ID);
  assert.equal(result.reward?.referralAttributionId, ATTRIBUTION_ID);
  assert.equal(result.reward?.qualifyingPaidCoverageId, COVERAGE_ID);
  assert.equal(result.reward?.grantedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(result.reward?.admittedAt, NOW.replace('.000Z', '.000000Z'));
  assert.equal(result.attribution.state, 'LOCKED');
  assert.equal(result.attribution.qualifyingPaidCoverageId, COVERAGE_ID);
  assert.equal(harness.rewardRepository.createCalls.length, 1);
  assert.deepEqual(
    harness.eventRepository.appendCalls.map((value) => [value.eventType, value.commercialAuthorityId]),
    [
      ['REFERRAL_ATTRIBUTION_LOCKED', REFERRED_AUTHORITY_ID],
      ['REFERRAL_REWARD_PENDING', REFERRER_AUTHORITY_ID]
    ]
  );
  assert.deepEqual(
    harness.authorityRepository.advanceCalls.map((value) => value.ownerId).sort(),
    [REFERRER_OWNER_ID, REFERRED_OWNER_ID]
  );
  assert.equal(harness.authorityRepository.advanceCalls.length, 2);
  assert.equal(
    harness.authorityRepository.advanceCalls.find(
      (value) => value.ownerId === REFERRED_OWNER_ID
    ).expectedRevision,
    '0'
  );
  assert.equal(
    harness.authorityRepository.advanceCalls.find(
      (value) => value.ownerId === REFERRER_OWNER_ID
    ).expectedRevision,
    '0'
  );
});

test('failed, pending, renewal, reversed, and second purchases never qualify a Referral reward', async () => {
  for (const eventType of [
    'PAID_FIRST_PURCHASE_FAILED',
    'PAID_RENEWAL_FAILED',
    'PAID_RENEWAL_SUCCEEDED'
  ]) {
    const harness = makeHarness({
      attribution: attributionRecord(),
      paidEvents: [paidEventRow({ eventType })]
    });
    await assert.rejects(
      harness.service.qualifyFirstPurchase({
        referrerOwnerId: REFERRER_OWNER_ID,
        referredOwnerId: REFERRED_OWNER_ID,
        referralAttributionId: ATTRIBUTION_ID,
        qualifyingPaidCoverageId: COVERAGE_ID
      }),
      CommercialPersistenceIntegrityError
    );
    assert.equal(harness.rewardRepository.createCalls.length, 0);
    assert.equal(harness.authorityRepository.advanceCalls.length, 0);
  }

  const secondPurchase = makeHarness({
    attribution: attributionRecord(),
    hasOtherPurchase: true
  });
  await assert.rejects(
    secondPurchase.service.qualifyFirstPurchase({
      referrerOwnerId: REFERRER_OWNER_ID,
      referredOwnerId: REFERRED_OWNER_ID,
      referralAttributionId: ATTRIBUTION_ID,
      qualifyingPaidCoverageId: COVERAGE_ID
    }),
    ReferralNotEligibleError
  );
  assert.equal(secondPurchase.rewardRepository.createCalls.length, 0);
});

test('qualification replay is idempotent and the 13th in-window admission is cap-rejected', async () => {
  const replayHarness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: rewardRecord()
  });
  const replay = await replayHarness.service.qualifyFirstPurchase({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    qualifyingPaidCoverageId: COVERAGE_ID
  });
  assert.equal(replay.outcome, 'DUPLICATE');
  assert.equal(replayHarness.eventRepository.appendCalls.length, 0);
  assert.equal(replayHarness.authorityRepository.advanceCalls.length, 0);

  const capRows = Array.from({ length: REFERRAL_REWARD_CAP }, (_, index) =>
    rewardRecord({
      referralRewardId: `reward-${index}`,
      qualifyingPaymentAt: `2026-08-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`
    })
  );
  const capHarness = makeHarness({ attribution: attributionRecord(), capRows });
  const rejected = await capHarness.service.qualifyFirstPurchase({
    referrerOwnerId: REFERRER_OWNER_ID,
    referredOwnerId: REFERRED_OWNER_ID,
    referralAttributionId: ATTRIBUTION_ID,
    qualifyingPaidCoverageId: COVERAGE_ID
  });
  assert.equal(rejected.outcome, 'CAP_REJECTED');
  assert.equal(rejected.reward, null);
  assert.equal(capHarness.rewardRepository.createCalls.length, 0);
  assert.equal(capHarness.eventRepository.appendCalls.some(
    (value) => value.eventType === 'REFERRAL_REWARD_CAP_REJECTED'
  ), true);
  assert.equal(
    capHarness.authorityRepository.advanceCalls.map((value) => value.ownerId).join(','),
    REFERRED_OWNER_ID
  );
});

test('maturation uses database time, exact boundary, one revision, and pre-maturation reversal', async () => {
  const matureReward = rewardRecord({
    qualifyingPaymentAt: PAYMENT_AT,
    maturesAt: NOW,
    state: 'PENDING'
  });
  const matureCandidate = Object.freeze({
    ...matureReward,
    referredOwnerId: REFERRED_OWNER_ID,
    referredAuthorityId: REFERRED_AUTHORITY_ID
  });
  const harness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: matureReward,
    candidates: [matureCandidate],
    now: NOW
  });
  const matured = await harness.service.matureEligibleRewards({
    ownerId: REFERRER_OWNER_ID
  });
  assert.equal(matured.outcome, 'APPLIED');
  assert.equal(matured.rewards[0].state, 'EARNED');
  assert.equal(harness.authorityRepository.advanceCalls.length, 1);
  assert.deepEqual(
    harness.eventRepository.appendCalls.map((value) => value.eventType),
    ['REFERRAL_REWARD_MATURED']
  );

  const repeated = await harness.service.matureEligibleRewards({
    ownerId: REFERRER_OWNER_ID
  });
  assert.equal(repeated.outcome, 'NO_OP');
  assert.equal(harness.authorityRepository.advanceCalls.length, 1);

  const futureReward = rewardRecord({ maturesAt: '2026-09-01T12:00:00.000Z' });
  const futureCandidate = Object.freeze({
    ...futureReward,
    referredOwnerId: REFERRED_OWNER_ID,
    referredAuthorityId: REFERRED_AUTHORITY_ID
  });
  const futureHarness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: futureReward,
    candidates: [futureCandidate],
    now: NOW
  });
  const beforeBoundary = await futureHarness.service.matureEligibleRewards({
    ownerId: REFERRER_OWNER_ID
  });
  assert.equal(beforeBoundary.outcome, 'NO_OP');
  assert.equal(futureHarness.authorityRepository.advanceCalls.length, 0);

  const reversedCoverage = paidCoverageRow({
    coverage_state: 'REVERSED',
    reversal_event_id: REVERSAL_EVENT_ID,
    reversed_at: NOW,
    reversal_reason: 'REFUND'
  });
  const reversedReward = rewardRecord({ state: 'PENDING' });
  const reversedCandidate = Object.freeze({
    ...reversedReward,
    referredOwnerId: REFERRED_OWNER_ID,
    referredAuthorityId: REFERRED_AUTHORITY_ID
  });
  const reversalHarness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: reversedReward,
    candidates: [reversedCandidate],
    coverages: [reversedCoverage],
    paidEvents: [
      paidEventRow(),
      paidEventRow({
        eventId: REVERSAL_EVENT_ID,
        eventType: 'PAID_COVERAGE_REFUNDED',
        effectiveAt: NOW
      })
    ]
  });
  const revoked = await reversalHarness.service.matureEligibleRewards({
    ownerId: REFERRER_OWNER_ID
  });
  assert.equal(revoked.outcome, 'APPLIED');
  assert.equal(revoked.rewards[0].state, 'REVOKED');
  assert.equal(revoked.rewards[0].earnedDurationUs, '0');
  assert.equal(revoked.rewards[0].consumedDurationUs, '0');
});

test('pre-consumption reversal is idempotent and APPLIED reversal requires the D4B collaborator', async () => {
  const earned = rewardRecord({
    state: 'EARNED',
    earnedAt: MATURITY_AT,
    maturationEventId: 'mature-event-a'
  });
  const coverage = paidCoverageRow({
    coverage_state: 'REVERSED',
    reversal_event_id: REVERSAL_EVENT_ID,
    reversed_at: NOW,
    reversal_reason: 'CHARGEBACK'
  });
  const harness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: earned,
    coverages: [coverage],
    paidEvents: [
      paidEventRow(),
      paidEventRow({
        eventId: REVERSAL_EVENT_ID,
        eventType: 'PAID_COVERAGE_CHARGEBACKED',
        effectiveAt: NOW
      })
    ]
  });
  const revoked = await harness.service.revokeForPaidReversal({
    referrerOwnerId: REFERRER_OWNER_ID,
    referralRewardId: earned.referralRewardId
  });
  assert.equal(revoked.outcome, 'APPLIED');
  assert.equal(revoked.reward.state, 'REVOKED');
  assert.equal(revoked.reward.revokedDurationUs, REFERRAL_REWARD_DURATION_US);
  assert.equal(revoked.reward.consumedDurationUs, '0');
  assert.equal(harness.authorityRepository.advanceCalls.length, 1);

  const replay = await harness.service.revokeForPaidReversal({
    referrerOwnerId: REFERRER_OWNER_ID,
    referralRewardId: earned.referralRewardId
  });
  assert.equal(replay.outcome, 'DUPLICATE');
  assert.equal(harness.authorityRepository.advanceCalls.length, 1);

  const applied = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: rewardRecord({
      state: 'APPLIED',
      earnedAt: MATURITY_AT,
      appliedAt: MATURITY_AT,
      appliedDurationUs: REFERRAL_REWARD_DURATION_US,
      maturationEventId: 'mature-event-a'
    }),
    coverages: [coverage],
    paidEvents: [
      paidEventRow(),
      paidEventRow({
        eventId: REVERSAL_EVENT_ID,
        eventType: 'PAID_COVERAGE_CHARGEBACKED',
        effectiveAt: NOW
      })
    ]
  });
  await assert.rejects(
    applied.service.revokeForPaidReversal({
      referrerOwnerId: REFERRER_OWNER_ID,
      referralRewardId: 'reward-a'
    }),
    ReferralRewardNotRevocableError
  );
  assert.equal(applied.authorityRepository.advanceCalls.length, 0);
});

test('APPLIED reversal delegates corrected consumption to D4B with cross-owner provenance intact', async () => {
  const appliedReward = rewardRecord({
    state: 'APPLIED',
    earnedAt: MATURITY_AT,
    appliedAt: MATURITY_AT,
    appliedDurationUs: REFERRAL_REWARD_DURATION_US,
    consumedDurationUs: (12n * 24n * 60n * 60n * 1_000_000n).toString(),
    maturationEventId: 'mature-event-a',
    applicationEventId: 'application-event-a'
  });
  const coverage = paidCoverageRow({
    coverage_state: 'REVERSED',
    reversal_event_id: REVERSAL_EVENT_ID,
    reversed_at: NOW,
    reversal_reason: 'CHARGEBACK'
  });
  const timeBank = {
    calls: [],
    async reconcileAfterAuthorityLock(input) {
      this.calls.push(input);
      const consumed = BigInt(appliedReward.consumedDurationUs);
      return {
        outcome: 'APPLIED',
        authority: {
          ...input.authority,
          entitlementRevision: (
            BigInt(input.authority.entitlementRevision) + 1n
          ).toString()
        },
        rewards: [
          rewardRecord({
            ...appliedReward,
            state: 'REVOKED',
            revokedAt: input.revocation.revokedAt,
            revokedDurationUs: (
              BigInt(REFERRAL_REWARD_DURATION_US) - consumed
            ).toString(),
            activeConsumptionStartedAt: null,
            revocationReason: input.revocation.revocationReason,
            reversalEventId: input.revocation.reversalEventId,
            sourceRevision: (
              BigInt(input.authority.entitlementRevision) + 1n
            ).toString()
          })
        ],
        source: null
      };
    }
  };
  const harness = makeHarness({
    attribution: attributionRecord({ state: 'LOCKED' }),
    reward: appliedReward,
    coverages: [coverage],
    paidEvents: [
      paidEventRow(),
      paidEventRow({
        eventId: REVERSAL_EVENT_ID,
        eventType: 'PAID_COVERAGE_CHARGEBACKED',
        effectiveAt: NOW
      })
    ],
    timeBank
  });

  const result = await harness.service.revokeForPaidReversal({
    referrerOwnerId: REFERRER_OWNER_ID,
    referralRewardId: appliedReward.referralRewardId
  });
  assert.equal(result.outcome, 'APPLIED');
  assert.equal(result.reward.state, 'REVOKED');
  assert.equal(result.reward.consumedDurationUs, appliedReward.consumedDurationUs);
  assert.equal(
    result.reward.revokedDurationUs,
    (BigInt(REFERRAL_REWARD_DURATION_US) - BigInt(appliedReward.consumedDurationUs)).toString()
  );
  assert.equal(timeBank.calls.length, 1);
  assert.equal(timeBank.calls[0].ownerId, REFERRER_OWNER_ID);
  assert.equal(
    timeBank.calls[0].authority.commercialAuthorityId,
    REFERRER_AUTHORITY_ID
  );
  assert.equal(timeBank.calls[0].revocation.reversalEventId, REVERSAL_EVENT_ID);
  assert.equal(
    harness.eventRepository.appendCalls.at(-1).causedByEventId,
    REVERSAL_EVENT_ID
  );
  assert.equal(harness.authorityRepository.advanceCalls.length, 0);
});

test('reward row mapper exposes non-negative derived balances and D4A never creates APPLIED', () => {
  const row = {
    referral_reward_id: 'reward-row',
    referrer_authority_id: REFERRER_AUTHORITY_ID,
    referral_attribution_id: ATTRIBUTION_ID,
    qualifying_paid_coverage_id: COVERAGE_ID,
    state: 'PENDING',
    qualifying_payment_at: PAYMENT_AT,
    admitted_at: '2026-08-30T11:00:00.123456Z',
    matures_at: MATURITY_AT,
    earned_at: null,
    applied_at: null,
    revoked_at: null,
    granted_duration_us: REFERRAL_REWARD_DURATION_US,
    earned_duration_us: '0',
    applied_duration_us: '0',
    consumed_duration_us: '0',
    revoked_duration_us: '0',
    active_consumption_started_at: null,
    revocation_reason: null,
    reversal_event_id: null,
    pending_event_id: 'pending-row',
    maturation_event_id: null,
    application_event_id: null,
    source_revision: '0',
    created_at: PAYMENT_AT,
    updated_at: PAYMENT_AT
  };
  const mapped = mapReferralRewardRow(row);
  ensureD4ARewardShape(mapped);
  assert.equal(mapped.remainingUnconsumedDurationUs, '0');
  assert.equal(mapped.availableDurationUs, '0');
  assert.equal(mapped.admittedAt, '2026-08-30T11:00:00.123456Z');
  assert.equal(Object.isFrozen(mapped), true);
});
