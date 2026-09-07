import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const artifactPath = '../docs/research/personal-synthesis/CHART_CONVERGENCE_COUNTEREVIDENCE_REPRESENTATIVE_V1.json';
const artifact = JSON.parse(readFileSync(new URL(artifactPath, import.meta.url), 'utf8'));

test('the policy freezes the complete classification taxonomy and mechanism-only admission state', () => {
  assert.deepEqual(artifact.scope.classificationInventory, [
    'INDEPENDENT_CONVERGENCE',
    'COUNTEREVIDENCE',
    'RELATIONAL_ENRICHMENT',
    'REDUNDANCY',
    'DUPLICATE',
    'DISTINCT',
    'CONFLICT'
  ]);
  assert.equal(artifact.currentInventoryAudit.astrologyIndependentConvergenceCaseAdmitted, 'NO');
  assert.equal(artifact.currentInventoryAudit.astrologyCounterevidenceCaseAdmitted, 'NO');
  assert.equal(artifact.epistemicStatus, 'MECHANISM_PROOF_WITH_ASTROLOGY_CASES_NOT_ADMITTED');
  assert.ok(artifact.currentInventoryAudit.mechanismFixtureUse.includes('MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE'));
  assert.equal(artifact.scope.productionRuntimeChanges, false);
  assert.equal(artifact.scope.newSelectorCreated, false);
});

test('independent convergence requires disjoint roots and explicit semantic overlap', () => {
  const policy = artifact.independentConvergencePolicy;
  assert.equal(policy.requiresSeparateRootSets, true);
  assert.equal(policy.requiresAdmittedSemanticOverlap, true);
  assert.equal(policy.rootRule.includes('pairwise-disjoint'), true);
  assert.equal(policy.changesConfidence, false);
  assert.equal(policy.changesIntensity, false);
  assert.equal(policy.changesDirection, false);
  assert.equal(policy.astrologyPositiveCaseAdmitted, false);
});

test('same-sign/domain/body/wording/element/modality/aspect shortcuts are explicitly insufficient', () => {
  assert.deepEqual(artifact.semanticOverlapContract.insufficientShortcuts, [
    'same sign',
    'same domain',
    'same body',
    'same wording',
    'same aspect type',
    'same element',
    'same modality',
    'shared roots'
  ]);
  assert.equal(artifact.semanticOverlapContract.numericSimilarity, false);
  assert.equal(artifact.semanticOverlapContract.embeddingSimilarity, false);
  assert.equal(artifact.semanticOverlapContract.llmDecision, false);
});

test('relational enrichment, counterevidence, redundancy, duplicate, and conflict remain distinct', () => {
  assert.equal(artifact.relationalEnrichmentPolicy.isIndependentConvergence, false);
  assert.equal(artifact.relationalEnrichmentPolicy.independentEvidenceIncrement, 0);
  assert.equal(artifact.counterevidencePolicy.requiresSeparatelyAdmittedSemanticUnit, true);
  assert.equal(artifact.counterevidencePolicy.requiresIndependentRootContribution, true);
  assert.equal(artifact.counterevidencePolicy.negativeSoundingSemanticsAreSufficient, false);
  assert.equal(artifact.counterevidencePolicy.squareIsAutomaticCounterevidence, false);
  assert.equal(artifact.counterevidencePolicy.oppositionIsAutomaticCounterevidence, false);
  assert.equal(artifact.classificationPolicy.duplicate.outcome, 'DUPLICATE');
  assert.equal(artifact.classificationPolicy.redundancy.outcome, 'REDUNDANCY');
  assert.equal(artifact.classificationPolicy.conflict.outcome, 'CONFLICT');
  assert.equal(artifact.classificationPolicy.conflict.isCounterevidence, false);
});

test('counterevidence changes claim scope only and preserves epistemic fields', () => {
  assert.deepEqual(artifact.counterevidencePolicy.allowedEffects, [
    'QUALIFY',
    'NARROW',
    'SUPPRESS_OVERBROAD'
  ]);
  assert.equal(artifact.counterevidencePolicy.changesClaimScope, true);
  assert.equal(artifact.counterevidencePolicy.changesConfidence, false);
  assert.equal(artifact.counterevidencePolicy.changesIntensity, false);
  assert.equal(artifact.counterevidencePolicy.changesDirection, false);
  assert.equal(artifact.counterevidencePolicy.sameRootFallback, 'RELATIONAL_ENRICHMENT_OR_INTERNAL_TENSION');
  assert.equal(artifact.epistemicPolicy.lowPlusLowDoesNotBecomeMedium, true);
  assert.equal(artifact.epistemicPolicy.subtlePlusSubtleDoesNotBecomeNoticeable, true);
  assert.equal(artifact.epistemicPolicy.noNegativeScore, true);
});

test('mechanism-only fixtures cannot masquerade as astrology admission', () => {
  assert.equal(artifact.mechanismOnlyFixtures.length, 4);
  for (const fixture of artifact.mechanismOnlyFixtures) {
    assert.equal(fixture.fixtureType, 'MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE');
    assert.equal(fixture.astrologyIndependentConvergenceCaseAdmitted ?? fixture.astrologyCounterevidenceCaseAdmitted, false);
    assert.ok(JSON.stringify(fixture).includes('mechanism.root'));
    assert.equal(JSON.stringify(fixture).includes('AUTHORITATIVE_ENGINE'), false);
  }
});

test('all declared source references exist and no production interpretation entrypoint imports the POC', () => {
  for (const source of artifact.sourceCatalog) {
    assert.ok(source.refId);
    assert.ok(source.path);
    assert.ok(existsSync(new URL(`../${source.path}`, import.meta.url)), source.path);
  }
  const productionIndex = readFileSync(
    new URL('../apps/web/src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(productionIndex, /chart-level-convergence-counterevidence-poc/iu);
});

test('all policy gates and readiness boundaries are explicit', () => {
  for (const [gate, status] of Object.entries(artifact.validationGates)) {
    assert.equal(status, 'PASS', gate);
  }
  assert.equal(artifact.readiness.READY_FOR_HOUSE_ANGLE_SEMANTIC_GATE, 'YES');
  assert.equal(artifact.readiness.READY_FOR_PRODUCTION_CONVERGENCE, 'NO');
  assert.equal(artifact.readiness.READY_FOR_PRODUCTION_COUNTEREVIDENCE, 'NO');
  assert.equal(artifact.readiness.READY_FOR_PRODUCTION_MY_CHART, 'NO');
  assert.equal(artifact.readiness.READY_FOR_BROAD_SCALE, 'NO');
  assert.equal(artifact.readiness.RUNTIME_ADMISSION, 'NO');
});

test('policy artifact is deterministic JSON without numeric semantic authority', () => {
  const serialized = JSON.stringify(artifact);
  assert.equal(JSON.stringify(JSON.parse(serialized)), serialized);
  assert.equal(artifact.classificationPolicy.precedence.length, 7);
  assert.equal(serialized.includes('embeddingThreshold'), false);
  assert.equal(serialized.includes('similarityScore'), false);
  assert.equal(artifact.epistemicPolicy.confidencePreserved, true);
});
