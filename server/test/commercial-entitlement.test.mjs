import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

import {
  ENTITLEMENT_EVALUATOR_POLICY_VERSION,
  ENTITLEMENT_PROJECTION_SCHEMA_VERSION,
  EntitlementProjectionConflictError,
  PostgresEntitlementReadService,
  assessEntitlementProjectionFreshness,
  createEntitlementProjection,
  evaluateEffectiveEntitlement,
  evaluateEntitlementCapability,
  projectionToEffectiveEntitlement
} from '../dist/index.js';

const AUTHORITY_ID = 'authority-a';
const OWNER_ID = 'owner-a';
const REVISION = '7';
const PERIOD_START = '2026-01-01T00:00:00.000Z';
const PERIOD_END = '2026-01-10T00:00:00.000Z';
const NOW = '2026-01-05T00:00:00.000Z';
const REPOSITORY_ROOT = new URL('../../', import.meta.url);

function relationship(overrides = {}) {
  return {
    paidRelationshipId: 'relationship-a',
    commercialAuthorityId: AUTHORITY_ID,
    providerNamespace: null,
    providerContext: null,
    providerRelationshipRef: null,
    billingInterval: 'MONTHLY',
    lifecycleState: 'ACTIVE',
    renewalIntent: 'ENABLED',
    currentPeriodStart: PERIOD_START,
    currentPeriodEnd: PERIOD_END,
    graceStartedAt: null,
    graceUntil: null,
    failedRenewalIdentity: null,
    endedAt: null,
    endReason: null,
    lastReconciledEventId: 'event-a',
    sourceRevision: '6',
    createdAt: PERIOD_START,
    updatedAt: PERIOD_START,
    ...overrides
  };
}

function coverage(overrides = {}) {
  return {
    paidCoverageId: 'coverage-a',
    paidRelationshipId: 'relationship-a',
    commercialAuthorityId: AUTHORITY_ID,
    purchaseNamespace: 'billing.test',
    purchaseIdentity: 'purchase-a',
    billingInterval: 'MONTHLY',
    coverageStartAt: PERIOD_START,
    scheduledCoverageEndAt: PERIOD_END,
    effectiveCoverageEndAt: PERIOD_END,
    coverageState: 'VALID',
    successEventId: 'event-a',
    reversalEventId: null,
    reversedAt: null,
    reversalReason: null,
    sourceRevision: REVISION,
    createdAt: PERIOD_START,
    updatedAt: PERIOD_START,
    ...overrides
  };
}

function evaluate({
  evaluatedAt = NOW,
  entitlementRevision = REVISION,
  paidBillingRelationships = [],
  paidCoverages = [],
  referralSource = null
} = {}) {
  return evaluateEffectiveEntitlement({
    commercialAuthorityId: AUTHORITY_ID,
    entitlementRevision,
    evaluatedAt,
    paidBillingRelationships,
    paidCoverages,
    referralSource
  });
}

function assertDeterminate(result, expectedPro) {
  assert.equal(result.determination, 'DETERMINATE');
  assert.equal(result.effectivePro, expectedPro);
  assert.equal(result.tier, expectedPro ? 'PRO' : 'FREE');
  return result;
}

test('pure evaluator returns FREE with no Paid relationship or coverage', () => {
  const result = assertDeterminate(evaluate(), false);
  assert.deepEqual(result.currentSourceClasses, []);
  assert.equal(result.currentSourceClass, null);
});

test('pending first payment never grants Pro', () => {
  assertDeterminate(
    evaluate({
      paidBillingRelationships: [
        relationship({
          lifecycleState: 'PENDING_FIRST_PAYMENT',
          currentPeriodStart: null,
          currentPeriodEnd: null
        })
      ]
    }),
    false
  );
});

test('failed first payment never grants Pro or grace', () => {
  const result = assertDeterminate(
    evaluate({
      paidBillingRelationships: [
        relationship({
          lifecycleState: 'FIRST_PAYMENT_FAILED',
          currentPeriodStart: null,
          currentPeriodEnd: null
        })
      ]
    }),
    false
  );
  assert.equal(result.adFree, false);
});

test('active valid Monthly coverage grants Pro', () => {
  const result = assertDeterminate(
    evaluate({
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
  assert.equal(result.currentSourceClass, 'PAID');
  assert.equal(result.currentSourceEntityId, 'coverage-a');
});

test('active valid Annual coverage grants Pro', () => {
  assertDeterminate(
    evaluate({
      paidBillingRelationships: [
        relationship({
          billingInterval: 'ANNUAL',
          currentPeriodEnd: '2027-01-01T00:00:00.000Z'
        })
      ],
      paidCoverages: [
        coverage({
          billingInterval: 'ANNUAL',
          scheduledCoverageEndAt: '2027-01-01T00:00:00.000Z',
          effectiveCoverageEndAt: '2027-01-01T00:00:00.000Z'
        })
      ]
    }),
    true
  );
});

test('coverage start is inclusive', () => {
  assertDeterminate(
    evaluate({
      evaluatedAt: PERIOD_START,
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
});

test('coverage end is exclusive without a contiguous replacement', () => {
  const result = assertDeterminate(
    evaluate({
      evaluatedAt: PERIOD_END,
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    false
  );
  assert.equal(result.nextEvaluationAt, null);
});

test('contiguous Paid coverage has no artificial Free gap', () => {
  const result = assertDeterminate(
    evaluate({
      evaluatedAt: PERIOD_END,
      paidBillingRelationships: [relationship()],
      paidCoverages: [
        coverage(),
        coverage({
          paidCoverageId: 'coverage-b',
          coverageStartAt: PERIOD_END,
          scheduledCoverageEndAt: '2026-01-20T00:00:00.000Z',
          effectiveCoverageEndAt: '2026-01-20T00:00:00.000Z'
        })
      ]
    }),
    true
  );
  assert.equal(result.effectiveFrom, PERIOD_START);
  assert.equal(result.effectiveUntil, '2026-01-20T00:00:00.000Z');
});

test('expired historical PaidCoverage does not grant access', () => {
  assertDeterminate(
    evaluate({
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-20T00:00:00.000Z',
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    false
  );
});

test('cancel-at-period-end preserves current coverage access', () => {
  assertDeterminate(
    evaluate({
      paidBillingRelationships: [
        relationship({ renewalIntent: 'CANCEL_AT_PERIOD_END' })
      ],
      paidCoverages: [coverage()]
    }),
    true
  );
});

test('renewal grace grants Pro before grace_until', () => {
  const result = assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-10T00:00:00.000Z',
      paidBillingRelationships: [
        relationship({
          lifecycleState: 'RECOVERY_GRACE',
          currentPeriodEnd: PERIOD_END,
          graceStartedAt: PERIOD_END,
          graceUntil: '2026-01-17T00:00:00.000Z'
        })
      ]
    }),
    true
  );
  assert.equal(result.currentSourceClass, 'PAID');
  assert.equal(result.graceUntil, '2026-01-17T00:00:00.000Z');
});

test('renewal grace expires at its half-open boundary', () => {
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-17T00:00:00.000Z',
      paidBillingRelationships: [
        relationship({
          lifecycleState: 'RECOVERY_GRACE',
          currentPeriodEnd: PERIOD_END,
          graceStartedAt: PERIOD_END,
          graceUntil: '2026-01-17T00:00:00.000Z'
        })
      ]
    }),
    false
  );
});

test('recovered grace with a valid replacement coverage remains Pro', () => {
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-12T00:00:00.000Z',
      paidBillingRelationships: [
        relationship({
          currentPeriodStart: '2026-01-10T00:00:00.000Z',
          currentPeriodEnd: '2026-01-20T00:00:00.000Z'
        })
      ],
      paidCoverages: [
        coverage({
          coverageStartAt: '2026-01-10T00:00:00.000Z',
          scheduledCoverageEndAt: '2026-01-20T00:00:00.000Z',
          effectiveCoverageEndAt: '2026-01-20T00:00:00.000Z'
        })
      ]
    }),
    true
  );
});

test('reversed coverage retains only its surviving attributable interval', () => {
  const reversed = coverage({
    coverageState: 'REVERSED',
    effectiveCoverageEndAt: '2026-01-04T00:00:00.000Z',
    reversalEventId: 'event-refund-a',
    reversedAt: '2026-01-04T00:00:00.000Z',
    reversalReason: 'REFUND'
  });
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-03T00:00:00.000Z',
      paidBillingRelationships: [relationship()],
      paidCoverages: [reversed]
    }),
    true
  );
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-01-04T00:00:00.000Z',
      paidBillingRelationships: [relationship()],
      paidCoverages: [reversed]
    }),
    false
  );
});

test('multiple historical rows with one current valid row grant Pro', () => {
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-02-05T00:00:00.000Z',
      paidBillingRelationships: [relationship()],
      paidCoverages: [
        coverage({
          paidCoverageId: 'coverage-old',
          coverageStartAt: '2025-12-01T00:00:00.000Z',
          scheduledCoverageEndAt: '2025-12-31T00:00:00.000Z',
          effectiveCoverageEndAt: '2025-12-31T00:00:00.000Z'
        }),
        coverage({
          paidCoverageId: 'coverage-current',
          coverageStartAt: '2026-02-01T00:00:00.000Z',
          scheduledCoverageEndAt: '2026-02-10T00:00:00.000Z',
          effectiveCoverageEndAt: '2026-02-10T00:00:00.000Z'
        })
      ]
    }),
    true
  );
});

test('no valid current Paid source returns Free', () => {
  assertDeterminate(
    evaluate({
      evaluatedAt: '2026-02-05T00:00:00.000Z',
      paidBillingRelationships: [
        relationship({
          lifecycleState: 'ENDED',
          renewalIntent: 'DISABLED',
          endedAt: PERIOD_END,
          endReason: 'PERIOD_END'
        })
      ],
      paidCoverages: [
        coverage({
          coverageState: 'ENDED',
          effectiveCoverageEndAt: PERIOD_END
        })
      ]
    }),
    false
  );
});

test('Effective Pro is Ad-Free and Free is not an advertising permission', () => {
  const pro = assertDeterminate(
    evaluate({
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
  const free = assertDeterminate(evaluate(), false);
  assert.equal(pro.adFree, true);
  assert.equal(free.adFree, false);
  assert.equal(evaluateEntitlementCapability(pro, 'AD_FREE'), 'ALLOWED');
  assert.equal(evaluateEntitlementCapability(free, 'AD_FREE'), 'DENIED');
});

test('Effective Pro has the bounded Vault and Astrology Alerts outputs', () => {
  const pro = assertDeterminate(
    evaluate({
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
  const free = assertDeterminate(evaluate(), false);
  assert.equal(pro.vaultCapacityClass, 'PRO_UNLIMITED');
  assert.equal(free.vaultCapacityClass, 'FREE_LIMIT_3');
  assert.equal(pro.astrologyAlertsEligible, true);
  assert.equal(free.astrologyAlertsEligible, false);
});

test('corrupt source state is INDETERMINATE rather than silently Free', () => {
  const result = evaluate({
    paidBillingRelationships: [relationship({ currentPeriodEnd: null })],
    paidCoverages: [coverage()]
  });
  assert.equal(result.determination, 'INDETERMINATE');
  assert.equal(result.reasonClass, 'INVALID_SOURCE_STATE');
});

function projectionAt({ sourceRevision = REVISION, computedAt = NOW } = {}) {
  const evaluation = evaluate({
    entitlementRevision: sourceRevision,
    evaluatedAt: computedAt,
    paidBillingRelationships: [relationship()],
    paidCoverages: [coverage()]
  });
  assert.equal(evaluation.determination, 'DETERMINATE');
  return createEntitlementProjection(evaluation, computedAt);
}

test('projection stores the exact authority revision and derived semantic fields', () => {
  const projection = projectionAt();
  assert.equal(projection.commercialAuthorityId, AUTHORITY_ID);
  assert.equal(projection.sourceRevision, REVISION);
  assert.equal(projection.projectionStatus, 'CURRENT');
  assert.equal(projection.evaluatorPolicyVersion, ENTITLEMENT_EVALUATOR_POLICY_VERSION);
  assert.equal(projection.projectionSchemaVersion, ENTITLEMENT_PROJECTION_SCHEMA_VERSION);
  assert.equal(projection.effectivePro, true);
  assert.deepEqual(projection.currentSourceClasses, ['PAID']);
});

test('projection freshness uses revision, schema, evaluator version, and database deadline', () => {
  const current = projectionAt();
  assert.equal(
    assessEntitlementProjectionFreshness(
      current,
      REVISION,
      '2026-01-05T00:00:00.000Z'
    ),
    'CURRENT'
  );
  assert.equal(
    assessEntitlementProjectionFreshness(
      current,
      '8',
      '2026-01-05T00:00:00.000Z'
    ),
    'STALE'
  );
  assert.equal(
    assessEntitlementProjectionFreshness(
      { ...current, sourceRevision: '8' },
      REVISION,
      NOW
    ),
    'INTEGRITY_CONFLICT'
  );
  assert.equal(
    assessEntitlementProjectionFreshness(current, REVISION, current.nextEvaluationAt),
    'STALE'
  );
  assert.equal(
    assessEntitlementProjectionFreshness(
      { ...current, evaluatorPolicyVersion: 'D3_PAID_V0' },
      REVISION,
      NOW
    ),
    'STALE'
  );
});

test('projection converts back to the canonical public entitlement result', () => {
  const result = projectionToEffectiveEntitlement(projectionAt());
  assert.equal(result.determination, 'DETERMINATE');
  assert.equal(result.entitlementRevision, REVISION);
  assert.equal(result.effectivePro, true);
  assert.equal(result.currentSourceClass, 'PAID');
});

test('capability evaluation is ALLOWED, DENIED, or INDETERMINATE only', () => {
  const pro = assertDeterminate(
    evaluate({
      paidBillingRelationships: [relationship()],
      paidCoverages: [coverage()]
    }),
    true
  );
  const free = assertDeterminate(evaluate(), false);
  const indeterminate = evaluate({
    paidBillingRelationships: [relationship({ currentPeriodEnd: null })],
    paidCoverages: [coverage()]
  });
  assert.equal(
    evaluateEntitlementCapability(pro, 'ADVANCED_WORKSPACE'),
    'ALLOWED'
  );
  assert.equal(
    evaluateEntitlementCapability(free, 'ADVANCED_WORKSPACE'),
    'DENIED'
  );
  assert.equal(
    evaluateEntitlementCapability(indeterminate, 'ADVANCED_WORKSPACE'),
    'INDETERMINATE'
  );
});

class TransactionExecutor {
  constructor(now = NOW) {
    this.now = now;
    this.calls = [];
  }

  async query(sql) {
    const normalized = sql.trim().replace(/\s+/gu, ' ');
    this.calls.push(normalized);
    if (
      normalized === 'BEGIN' ||
      normalized === 'COMMIT' ||
      normalized === 'ROLLBACK'
    ) {
      return { rows: [] };
    }
    if (normalized === 'SELECT clock_timestamp() AS now') {
      return { rows: [{ now: this.now }] };
    }
    throw new Error(`Unexpected test SQL: ${normalized}`);
  }
}

function createReadRepositories({
  authorityRevision = REVISION,
  initialProjection = null
} = {}) {
  let projection = initialProjection;
  let authorityLockCount = 0;
  let revisionAdvanceCount = 0;
  const authority = {
    async lockForUpdate(ownerId) {
      assert.equal(ownerId, OWNER_ID);
      authorityLockCount += 1;
      return {
        commercialAuthorityId: AUTHORITY_ID,
        ownerId: OWNER_ID,
        entitlementRevision: authorityRevision,
        createdAt: PERIOD_START,
        updatedAt: PERIOD_START
      };
    },
    async advanceRevisionAfterLock() {
      revisionAdvanceCount += 1;
      throw new Error('read model must not advance authority revision');
    }
  };
  const relationships = {
    async getByAuthority(ownerId, commercialAuthorityId) {
      assert.equal(ownerId, OWNER_ID);
      assert.equal(commercialAuthorityId, AUTHORITY_ID);
      return [relationship()];
    }
  };
  const coverages = {
    async listByRelationship(
      ownerId,
      commercialAuthorityId,
      paidRelationshipId
    ) {
      assert.equal(ownerId, OWNER_ID);
      assert.equal(commercialAuthorityId, AUTHORITY_ID);
      assert.equal(paidRelationshipId, 'relationship-a');
      return [coverage()];
    }
  };
  const projections = {
    async getByAuthority(commercialAuthorityId) {
      assert.equal(commercialAuthorityId, AUTHORITY_ID);
      return projection;
    },
    async getByOwner() {
      return projection;
    },
    async upsertAtRevision({ ownerId, projection: nextProjection }) {
      assert.equal(ownerId, OWNER_ID);
      if (
        projection !== null &&
        BigInt(projection.sourceRevision) > BigInt(nextProjection.sourceRevision)
      ) {
        throw new EntitlementProjectionConflictError();
      }
      projection = nextProjection;
      return projection;
    }
  };
  return {
    repositories: {
      authorities: authority,
      paidBillingRelationships: relationships,
      paidCoverages: coverages,
      entitlementProjections: projections
    },
    get authorityLockCount() {
      return authorityLockCount;
    },
    get revisionAdvanceCount() {
      return revisionAdvanceCount;
    },
    get projection() {
      return projection;
    }
  };
}

test('rebuild is revision-aware and does not increment CommercialAuthority', async () => {
  const executor = new TransactionExecutor();
  const state = createReadRepositories();
  const service = new PostgresEntitlementReadService(executor, state.repositories);
  const result = await service.rebuildEntitlementProjection(OWNER_ID);
  assert.equal(result.determination, 'DETERMINATE');
  assert.equal(result.entitlementRevision, REVISION);
  assert.equal(state.projection.sourceRevision, REVISION);
  assert.equal(state.revisionAdvanceCount, 0);
  assert.deepEqual(executor.calls.slice(0, 2), [
    'BEGIN',
    'SELECT clock_timestamp() AS now'
  ]);
  assert.equal(executor.calls.at(-1), 'COMMIT');
});

test('read path rebuilds a stale projection and converges duplicate same-revision rebuilds', async () => {
  const executor = new TransactionExecutor();
  const state = createReadRepositories({
    authorityRevision: '8',
    initialProjection: projectionAt({ sourceRevision: REVISION })
  });
  const service = new PostgresEntitlementReadService(executor, state.repositories);
  const first = await service.getEffectiveEntitlement(OWNER_ID);
  assert.equal(first.determination, 'DETERMINATE');
  assert.equal(first.entitlementRevision, '8');
  assert.equal(state.projection.sourceRevision, '8');

  const second = await service.rebuildEntitlementProjection(OWNER_ID);
  assert.equal(second.determination, 'DETERMINATE');
  assert.equal(state.projection.sourceRevision, '8');
  assert.equal(state.revisionAdvanceCount, 0);
});

test('indeterminate source/persistence state never becomes Free or ALLOWED', async () => {
  const executor = new TransactionExecutor();
  const state = createReadRepositories();
  state.repositories.paidBillingRelationships.getByAuthority = async () => [
    relationship({ currentPeriodEnd: null })
  ];
  const service = new PostgresEntitlementReadService(executor, state.repositories);
  const result = await service.rebuildEntitlementProjection(OWNER_ID);
  assert.equal(result.determination, 'INDETERMINATE');
  assert.equal(result.reasonClass, 'INVALID_SOURCE_STATE');
  assert.equal(
    await service.evaluateCapability(OWNER_ID, 'ADVANCED_EXPORT'),
    'INDETERMINATE'
  );
});

test('account erasure cascade and bounded schema do not retain the projection', async () => {
  const migration = await readFile(
    new URL(
      'server/db/migrations/0013_entitlement_projection.sql',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE entitlement_projections/u);
  assert.match(
    migration,
    /FOREIGN KEY \(commercial_authority_id\)[\s\S]*ON DELETE CASCADE/u
  );
  assert.match(migration, /source_revision BIGINT NOT NULL/u);
  assert.match(migration, /projection_status TEXT NOT NULL/u);
  assert.match(migration, /next_evaluation_at TIMESTAMPTZ/u);
  assert.doesNotMatch(migration, /INSERT INTO entitlement_projections/u);
});

test('frozen D3 migration remains ordered before D4A and D4B migrations', async () => {
  const migrations = (
    await readdir(new URL('server/db/migrations/', REPOSITORY_ROOT))
  )
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/u.test(name))
    .sort();
  assert.ok(migrations.includes('0013_entitlement_projection.sql'));
  assert.ok(migrations.includes('0014_referral_persistence.sql'));
  assert.ok(migrations.includes('0015_referral_time_bank.sql'));
  assert.ok(
    migrations.indexOf('0013_entitlement_projection.sql') <
      migrations.indexOf('0014_referral_persistence.sql')
  );
  assert.ok(
    migrations.indexOf('0014_referral_persistence.sql') <
      migrations.indexOf('0015_referral_time_bank.sql')
  );
  assert.ok(migrations.includes('0011_commercial_persistence_foundation.sql'));
  assert.ok(migrations.includes('0012_paid_billing_coverage.sql'));
  const migration = await readFile(
    new URL(
      'server/db/migrations/0013_entitlement_projection.sql',
      REPOSITORY_ROOT
    ),
    'utf8'
  );
  assert.doesNotMatch(migration, /\b(?:BEGIN|COMMIT)\s*;/u);
  assert.doesNotMatch(migration, /paid_billing_relationships|paid_coverages/u);
});
