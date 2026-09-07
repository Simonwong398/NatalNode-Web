import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const matrixPath = 'docs/research/personal-synthesis/PERSONAL_CHART_COVERAGE_MATRIX_V1.json';
const architecturePath = 'docs/product/NATALNODE_PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1.md';
const reviewPath = 'docs/research/personal-synthesis/PERSONAL_CHART_COVERAGE_ARCHITECTURE_V1_REVIEW.md';

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const matrix = readJson(matrixPath);
const architecture = readText(architecturePath);
const review = readText(reviewPath);
const capabilities = matrix.capabilities;
const capabilityById = (capabilityId) => {
  const capability = capabilities.find((candidate) => candidate.capabilityId === capabilityId);
  assert.ok(capability, `missing capability ${capabilityId}`);
  return capability;
};

const requiredFields = [
  'capabilityId',
  'conceptualLayer',
  'readerValue',
  'requiredChartFacts',
  'requiredSemanticMethod',
  'requiredSignalPolicy',
  'synthesisRole',
  'birthTimeDependency',
  'sourceSupport',
  'policyAdmission',
  'implementationState',
  'productionAuthorityState',
  'currentUsability',
  'missingDependencies',
  'recommendedNextGate',
  'readiness'
];

test('the coverage matrix is valid JSON with the required audit shape', () => {
  assert.equal(matrix.status, 'ARCHITECTURE_FROZEN_WITH_CONDITIONS');
  assert.equal(matrix.scope.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
  assert.equal(matrix.capabilities.length, 35);
  assert.deepEqual(matrix.readinessDimensionOrder, [
    'SOURCE_READINESS',
    'SEMANTIC_METHOD_READINESS',
    'SIGNAL_POLICY_READINESS',
    'SYNTHESIS_READINESS',
    'PRODUCTION_FACT_AUTHORITY'
  ]);

  const ids = new Set();
  for (const capability of capabilities) {
    for (const field of requiredFields) {
      assert.notEqual(capability[field], undefined, `${capability.capabilityId} missing ${field}`);
    }

    assert.equal(ids.has(capability.capabilityId), false, `duplicate ${capability.capabilityId}`);
    ids.add(capability.capabilityId);
    assert.deepEqual(Object.keys(capability.readiness).sort(), [
      'productionFactAuthority',
      'semanticMethod',
      'signalPolicy',
      'source',
      'synthesis'
    ]);
  }
});

test('all major mature coverage layers and admitted personal bodies are represented', () => {
  const layers = new Set(capabilities.map((capability) => capability.conceptualLayer));
  for (const layer of [
    'CORE_IDENTITY_ORIENTATION',
    'INNER_RESPONSE_NEED',
    'THINKING_NAMING',
    'RELATING_VALUING',
    'ACTION_DESIRE',
    'ANGLES_ORIENTATION_TO_LIFE',
    'HOUSES_LIFE_CONTEXT',
    'PLANET_PLANET_RELATIONSHIPS',
    'REPEATED_THEMES_CONVERGENCE',
    'RELATIONAL_ENRICHMENT',
    'COUNTEREVIDENCE_TRADEOFFS',
    'LIFE_DOMAIN_SYNTHESIS',
    'PERSONAL_EDITORIAL_OUTPUT',
    'WHY_LEARN_ASTROLOGER_VIEW'
  ]) {
    assert.equal(layers.has(layer), true, `missing conceptual layer ${layer}`);
  }

  for (const body of ['sun', 'moon', 'mercury', 'venus', 'mars']) {
    assert.ok(capabilityById(`placement.${body}`));
  }

  for (const aspect of ['conjunction', 'trine', 'square', 'opposition', 'sextile']) {
    assert.ok(capabilityById(aspect === 'sextile'
      ? 'relation.body-aspect-body.sextile'
      : `relation.moon-mercury.${aspect}`));
  }
});

test('representative proof is distinct from mature target and production authority', () => {
  for (const capabilityId of [
    'composition.moon-aries',
    'composition.mercury-aries',
    'composition.moon-taurus',
    'composition.mercury-taurus'
  ]) {
    const capability = capabilityById(capabilityId);
    assert.equal(capability.policyAdmission.status, 'BOUNDED_POC_ONLY');
    assert.equal(capability.implementationState.status, 'BOUNDED_RESEARCH_POC');
    assert.equal(capability.readiness.source, 'SOURCE_READY');
    assert.equal(capability.readiness.semanticMethod, 'BOUNDED_POC_READY');
    assert.equal(capability.readiness.signalPolicy, 'BOUNDED_POC_READY');
    assert.equal(capability.readiness.synthesis, 'BOUNDED_POC_READY');
    assert.equal(capability.productionAuthorityState.status, 'NOT_AVAILABLE_PROVIDER_DEFERRED');
    assert.notEqual(capability.readiness.productionFactAuthority, 'BOUNDED_POC_READY');
  }

  const futureHouse = capabilityById('house.body-sign-house');
  assert.equal(futureHouse.policyAdmission.status, 'FUTURE_SCOPE');
  assert.equal(futureHouse.readiness.semanticMethod, 'FUTURE_SCOPE');
  assert.equal(futureHouse.readiness.signalPolicy, 'FUTURE_SCOPE');
});

test('targeted Sun, Venus, and Mars Body × Sign expansion is bounded to composition and Signal POC', () => {
  for (const [body, compositionId] of [
    ['sun', 'composition.sun-aries'],
    ['venus', 'composition.venus-taurus'],
    ['mars', 'composition.mars-aries']
  ]) {
    const placement = capabilityById(`placement.${body}`);
    assert.equal(placement.policyAdmission.status, 'BOUNDED_POC_ONLY');
    assert.equal(placement.implementationState.status, 'BOUNDED_RESEARCH_POC');
    assert.equal(placement.readiness.semanticMethod, 'BOUNDED_POC_READY');
    assert.equal(placement.readiness.signalPolicy, 'BOUNDED_POC_READY');
    assert.equal(placement.readiness.synthesis, 'NOT_READY');
    assert.notEqual(placement.readiness.productionFactAuthority, 'BOUNDED_POC_READY');

    const composition = capabilityById(compositionId);
    assert.equal(composition.policyAdmission.status, 'BOUNDED_POC_ONLY');
    assert.equal(composition.implementationState.status, 'BOUNDED_RESEARCH_POC');
    assert.equal(composition.readiness.semanticMethod, 'BOUNDED_POC_READY');
    assert.equal(composition.readiness.signalPolicy, 'BOUNDED_POC_READY');
    assert.equal(composition.readiness.synthesis, 'NOT_READY');
    assert.equal(composition.productionAuthorityState.status, 'NOT_AVAILABLE_PROVIDER_DEFERRED');
  }
});

test('selection budget, hierarchy, and anti-card-explosion policies are explicit', () => {
  assert.deepEqual(matrix.themeBudget.coreTarget, {
    minimum: 3,
    maximum: 5,
    isQuota: false,
    label: '3–5 CORE PERSONAL THEMES'
  });
  assert.equal(matrix.themeBudget.oneFactOneCard, false);
  assert.equal(matrix.themeBudget.oneThemePerDomain, false);
  assert.equal(matrix.themeBudget.automaticSunMoonAscThreeCards, false);
  assert.equal(matrix.selectionPolicy.newNumericWeights, false);
  assert.equal(matrix.selectionPolicy.editorialPriorityIsInterpretiveConfidence, false);
  assert.deepEqual(Object.keys(matrix.themeHierarchy).sort(), ['level1', 'level2', 'level3']);
  assert.equal(matrix.themeHierarchy.level2.primaryCardByDefault, false);
  assert.equal(matrix.themeHierarchy.level3.primaryThemeByDefault, false);
});

test('domains are closed and breadth is not a quota', () => {
  assert.deepEqual(matrix.closedDomains, [
    'SELF',
    'EMOTIONAL',
    'RELATIONSHIP',
    'COMMUNICATION',
    'WORK_CREATION',
    'ACTION_DECISION'
  ]);
  assert.equal(matrix.selectionPolicy.gates.includes('USEFUL_DOMAIN_BREADTH_WITHOUT_QUOTA'), true);
  assert.match(architecture, /Domain breadth is a quality consideration, not a one-per-domain\s+quota/u);
  assert.match(review, /Domain breadth is a quality consideration, not a one-per-domain\s+quota/u);
});

test('relational enrichment, subsumption, and supporting WHY roles are represented', () => {
  const enrichment = capabilityById('synthesis.relational-enrichment');
  const subsumption = capabilityById('synthesis.subsumption');
  const why = capabilityById('output.why-learn-astrologer');
  assert.equal(enrichment.synthesisRole.includes('RELATIONAL_ENRICHMENT'), true);
  assert.equal(enrichment.synthesisRole.includes('SUBSUMPTION'), true);
  assert.equal(subsumption.synthesisRole.includes('RETAIN_PROVENANCE'), true);
  assert.equal(why.synthesisRole.includes('WHY'), true);
  assert.equal(why.synthesisRole.includes('LEARN'), true);
  assert.equal(why.synthesisRole.includes('ASTROLOGERS_VIEW'), true);
  assert.match(architecture, /three semantic units/iu);
  assert.match(architecture, /two unique astronomical roots/iu);
});

test('unknown-time behavior, provider deferral, and runtime boundary are explicit', () => {
  const unknownTime = capabilityById('output.unknown-time-degradation');
  assert.equal(unknownTime.birthTimeDependency, 'UNKNOWN_TIME_FIRST_CLASS');
  assert.equal(unknownTime.readiness.source, 'SOURCE_READY');
  assert.equal(unknownTime.productionAuthorityState.status, 'TIME_AUTHORITY_REQUIRED');
  assert.match(architecture, /must not fabricate noon, midnight, an\s+average time/i);
  assert.match(architecture, /The Web never derives longitude/i);
  assert.match(review, /Provider\/scientific authority and\s+production My Chart remain later, independent gates/i);
  assert.equal(matrix.gates.READY_FOR_BROAD_SCALE, 'NO');
  assert.equal(matrix.gates.READY_FOR_PRODUCTION_MY_CHART, 'NO');
  assert.equal(matrix.gates.RUNTIME_ADMISSION, 'NO');
});

test('matrix gates and review gates agree', () => {
  const requiredGates = [
    'MATURE_COVERAGE_MODEL',
    'READINESS_DIMENSION_SEPARATION',
    'PRIMARY_THEME_BUDGET',
    'SUPPORTING_THREAD_MODEL',
    'NO_CARD_EXPLOSION',
    'DOMAIN_BREADTH_WITHOUT_QUOTA',
    'RELATIONAL_SYNTHESIS_ROLE',
    'SUBSUMPTION_POLICY',
    'REDUNDANCY_POLICY',
    'COUNTEREVIDENCE_ARCHITECTURE',
    'UNKNOWN_TIME_DEGRADATION',
    'PRODUCTION_AUTHORITY_BOUNDARY',
    'NEXT_GATE_PRIORITIZATION'
  ];

  for (const gate of requiredGates) {
    assert.equal(matrix.gates[gate], 'PASS', `${gate} is not PASS in matrix`);
    assert.match(review, new RegExp('`' + gate + '`\\s*\\|\\s*`PASS`', 'u'));
  }
});
