import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const ARTIFACT_PATH = join(
  ROOT,
  'docs/research/astrology-knowledge-canon/aspects/BODY_ASPECT_BODY_REPRESENTATIVE_V1.json',
);
const METHOD_PATH = join(
  ROOT,
  'docs/product/NATALNODE_BODY_ASPECT_BODY_COMPOSITION_METHOD_V1.md',
);
const REVIEW_PATH = join(
  ROOT,
  'docs/research/astrology-knowledge-canon/aspects/BODY_ASPECT_BODY_REPRESENTATIVE_V1_REVIEW.md',
);

const artifactSource = readFileSync(ARTIFACT_PATH, 'utf8');
const artifact = JSON.parse(artifactSource);
const method = readFileSync(METHOD_PATH, 'utf8');
const review = readFileSync(REVIEW_PATH, 'utf8');
const compositions = artifact.compositions;
const compositionByAspect = new Map(compositions.map((composition) => [composition.aspectType, composition]));
const expectedAspects = ['conjunction', 'trine', 'square', 'opposition'];
const expectedCompositionIds = expectedAspects.map(
  (aspect) => `body.moon_x_aspect.${aspect}_x_body.mercury`,
);
const requiredRecordFields = [
  'compositionId',
  'compositionType',
  'bodyAId',
  'bodyBId',
  'aspectType',
  'bodyAFunction',
  'bodyBFunction',
  'aspectRelation',
  'integratedMeaning',
  'boundedChartQuestion',
  'constructivePotential',
  'possibleTradeOff',
  'nearbyDistinctions',
  'modifierRequirements',
  'forbiddenInferences',
  'evidenceLineage',
  'semanticDependencies',
  'sourceRefs',
  'schoolNotes',
  'authorityRequirements',
  'epistemicStatus',
  'policyState',
  'runtimeEligibility',
  'editorialReviewStatus',
];

function narrativeText(composition) {
  return [
    composition.bodyAFunction,
    composition.bodyBFunction,
    composition.aspectRelation.structuralQuality,
    composition.aspectRelation.integrates,
    composition.integratedMeaning,
    composition.boundedChartQuestion,
    composition.constructivePotential,
    composition.possibleTradeOff,
  ]
    .join(' ')
    .toLowerCase();
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(path);
    return [path];
  });
}

test('ASPECT_COMPOSITION_METHOD: exact bounded inventory and machine-auditable schema', () => {
  assert.equal(artifact.artifactId, 'natalnode.body-aspect-body.representative-v1');
  assert.equal(artifact.taskId, 'WEB-P2-ASPECT-COMPOSITION-001');
  assert.equal(artifact.scope.zodiacModel, 'WESTERN_TROPICAL');
  assert.deepEqual(artifact.scope.bodyPair, ['body.moon', 'body.mercury']);
  assert.equal(artifact.scope.includedCompositionCount, 4);
  assert.deepEqual(artifact.scope.includedCompositionIds, expectedCompositionIds);
  assert.deepEqual(compositions.map((composition) => composition.aspectType), expectedAspects);
  assert.deepEqual(compositions.map((composition) => composition.compositionId), expectedCompositionIds);
  assert.equal(new Set(expectedCompositionIds).size, 4);

  for (const composition of compositions) {
    for (const field of requiredRecordFields) {
      assert.ok(Object.hasOwn(composition, field), `${composition.compositionId} lacks ${field}`);
    }
    assert.equal(composition.compositionType, 'BODY_X_ASPECT_X_BODY');
    assert.equal(composition.bodyAId, 'body.moon');
    assert.equal(composition.bodyBId, 'body.mercury');
    assert.equal(composition.epistemicStatus, 'EDITORIAL_SYNTHESIS');
    assert.equal(composition.policyState, 'ADOPTED_WITH_CONDITIONS');
    assert.equal(composition.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
    assert.equal(composition.editorialReviewStatus, 'REPRESENTATIVE_POLICY_REVIEWED');
  }
});

test('BODY_FUNCTION_SEPARATION: Moon and Mercury remain distinct semantic dimensions', () => {
  for (const composition of compositions) {
    assert.match(composition.bodyAFunction, /Moon/);
    assert.match(composition.bodyBFunction, /Mercury/);
    assert.notEqual(composition.bodyAFunction, composition.bodyBFunction);
    assert.equal(composition.semanticDependencies.bodyA.objectId, 'body.moon');
    assert.equal(composition.semanticDependencies.bodyB.objectId, 'body.mercury');
    assert.equal(composition.semanticDependencies.bodyA.dependencyType, 'POSITION_ROOT');
    assert.equal(composition.semanticDependencies.bodyB.dependencyType, 'POSITION_ROOT');
  }
});

test('ASPECT_RELATION_SEPARATION: relation is an operator, not a body or causal label', () => {
  assert.deepEqual([...compositionByAspect.keys()], expectedAspects);
  for (const composition of compositions) {
    const relation = composition.aspectRelation;
    assert.match(relation.operatorId, /^aspect\.relation\.(conjunction|trine|square|opposition)$/);
    assert.notEqual(relation.operatorId, composition.bodyAId);
    assert.notEqual(relation.operatorId, composition.bodyBId);
    assert.equal(relation.relationalNotCausal, true);
    assert.equal(relation.automaticValence, 'NOT_ASSIGNED');
    assert.equal(relation.automaticImportance, 'NOT_ASSIGNED');
    assert.ok(relation.structuralQuality);
    assert.ok(relation.integrates);
  }
});

test('CROSS_ASPECT_DIFFERENTIATION: all four operators produce distinct bounded questions', () => {
  for (const field of [
    'integratedMeaning',
    'boundedChartQuestion',
    'constructivePotential',
    'possibleTradeOff',
  ]) {
    assert.equal(new Set(compositions.map((composition) => composition[field])).size, 4, field);
  }

  assert.equal(artifact.comparisonMatrix.length, 6);
  assert.equal(new Set(artifact.comparisonMatrix.map((comparison) => comparison.comparisonId)).size, 6);
  for (const comparison of artifact.comparisonMatrix) {
    assert.notEqual(comparison.left, comparison.right);
    assert.ok(comparison.whatChanges);
    assert.ok(comparison.whyItMatters);
  }

  assert.match(compositionByAspect.get('conjunction').aspectRelation.structuralQuality, /concentration/);
  assert.match(compositionByAspect.get('trine').aspectRelation.structuralQuality, /easier circulation/);
  assert.match(compositionByAspect.get('square').aspectRelation.structuralQuality, /friction/);
  assert.match(compositionByAspect.get('opposition').aspectRelation.structuralQuality, /polarity/);
});

test('NO_VALENCE_COLLAPSE: aspect type does not assign direction, intensity, confidence, or priority', () => {
  assert.equal(artifact.valencePolicy.aspectTypeAloneDeterminesDirection, false);
  assert.equal(artifact.valencePolicy.directionAssignment, 'NOT_ASSIGNED');
  assert.equal(artifact.valencePolicy.intensityAssignment, 'NOT_ASSIGNED');
  assert.equal(artifact.valencePolicy.confidenceAssignment, 'NOT_ASSIGNED');
  assert.deepEqual(artifact.futureSignalBoundary, {
    createsSignalRule: false,
    createsPersonalTheme: false,
    direction: 'NOT_ASSIGNED',
    intensity: 'NOT_ASSIGNED',
    confidence: 'NOT_ASSIGNED',
    priority: 'NOT_ASSIGNED',
    futureRequirement: artifact.futureSignalBoundary.futureRequirement,
  });
  for (const composition of compositions) {
    assert.equal(Object.hasOwn(composition, 'direction'), false);
    assert.equal(Object.hasOwn(composition, 'intensity'), false);
    assert.equal(Object.hasOwn(composition, 'confidence'), false);
    assert.equal(Object.hasOwn(composition, 'priority'), false);
  }
});

test('ANTI_STEREOTYPE: forbidden shortcuts remain forbidden and reader text stays non-diagnostic', () => {
  const diagnosticTerms = /\b(?:diagnos|pathology|bipolar|split personality|family trauma)\b/i;
  for (const composition of compositions) {
    const text = narrativeText(composition);
    assert.doesNotMatch(text, diagnosticTerms);
    for (const forbiddenInference of composition.forbiddenInferences) {
      assert.ok(forbiddenInference.length > 0);
      assert.equal(text.includes(forbiddenInference.toLowerCase()), false, forbiddenInference);
    }
    assert.ok(composition.constructivePotential);
    assert.ok(composition.possibleTradeOff);
  }
});

test('ORB_AUTHORITY_BOUNDARY: no invented degrees, angular separation, or universal orb field', () => {
  assert.equal(artifact.method.numericScoring, 'NOT_USED');
  const serialized = JSON.stringify(artifact);
  assert.doesNotMatch(serialized, /\d+(?:\.\d+)?\s*°/);
  assert.doesNotMatch(serialized, /\b(?:orbValue|angularSeparation|exactDegree)\b/);
  for (const composition of compositions) {
    assert.ok(composition.modifierRequirements.some((modifier) => modifier.modifier === 'orb_policy'));
    assert.ok(composition.modifierRequirements.some((modifier) => modifier.modifier === 'phase_state'));
    assert.ok(composition.modifierRequirements.some((modifier) => modifier.modifier === 'exact_geometry'));
  }
});

test('EVIDENCE_LINEAGE and NO_FALSE_INDEPENDENCE: relation adds semantics but not a third root', () => {
  assert.equal(artifact.method.semanticDistinctnessIsNotEvidenceRootIndependence, true);
  for (const composition of compositions) {
    const lineage = composition.evidenceLineage;
    assert.deepEqual(lineage.dependentPositionFactKeys, [
      'body.moon.position',
      'body.mercury.position',
    ]);
    assert.deepEqual(lineage.evidenceRootKeys, lineage.dependentPositionFactKeys);
    assert.equal(lineage.independentRootCount, 2);
    assert.equal(lineage.semanticDimensionCount, 3);
    assert.equal(lineage.relationalFactIsIndependentRoot, false);
    assert.equal(lineage.relationalFactAddsSemanticInformation, true);
    assert.equal(lineage.relationalFactIndependentEvidenceIncrement, 0);
    assert.equal(lineage.countsAsThreeIndependentRoots, false);
    assert.match(lineage.deduplicationRule, /deduplicate/i);
    assert.equal(composition.semanticDependencies.aspectRelation.independentEvidence, false);
  }
});

test('UNKNOWN_TIME_AUTHORITY: unknown birth time suppresses aspect eligibility by default', () => {
  assert.equal(artifact.unknownBirthTimePolicy.status, 'FAIL_CLOSED_BY_DEFAULT');
  assert.equal(
    artifact.unknownBirthTimePolicy.aspectEligibility,
    'SUPPRESS_UNLESS_AUTHORITATIVE_ENGINE_CERTIFIES_TIME_UNCERTAINTY',
  );
  assert.equal(artifact.unknownBirthTimePolicy.moonPositionMayVaryAcrossUnknownWindow, true);
  assert.equal(artifact.unknownBirthTimePolicy.orbAndExactnessMayChange, true);
  for (const forbiddenFallback of [
    'noon',
    'midnight',
    'default time',
    'average time',
    'guessed birth time',
    'fake degrees',
    'synthetic angular separation',
  ]) {
    assert.ok(artifact.unknownBirthTimePolicy.forbiddenFallbacks.includes(forbiddenFallback));
  }
  for (const composition of compositions) {
    assert.equal(composition.authorityRequirements.unknownTimeDefault, 'SUPPRESS');
    assert.equal(composition.authorityRequirements.developmentFixtureEligibility, 'SUPPRESS');
  }
});

test('authority and runtime boundaries remain explicit', () => {
  const sourceByRef = new Map(artifact.sourceCatalog.map((source) => [source.refId, source]));
  for (const source of artifact.sourceCatalog) {
    assert.ok(source.refId);
    assert.ok(source.path);
    assert.ok(source.locator);
    assert.ok(source.sourceClass);
    assert.ok(source.supports);
    assert.ok(existsSync(join(ROOT, source.path)), source.path);
  }
  for (const composition of compositions) {
    for (const sourceRef of composition.sourceRefs) {
      assert.ok(sourceByRef.has(sourceRef), `${composition.compositionId} unresolved ${sourceRef}`);
    }
    assert.notEqual(composition.sourceAuthority, 'AUTHORITATIVE_ENGINE');
    assert.equal(composition.authorityRequirements.requiredAspectAuthority, 'AUTHORITATIVE_ENGINE_REQUIRED');
    assert.equal(composition.authorityRequirements.fixtureDoesNotClaimAuthority, true);
    assert.equal(composition.authorityRequirements.developmentFixtureEligibility, 'SUPPRESS');
  }

  assert.equal(artifact.futureSignalBoundary.createsSignalRule, false);
  assert.equal(artifact.futureSignalBoundary.createsPersonalTheme, false);
  assert.equal(artifact.personalSynthesisCompatibility.runtimeWiring, 'NONE');
  assert.equal(artifact.personalSynthesisCompatibility.compositionObjectsAreSignals, false);
  assert.equal(artifact.personalSynthesisCompatibility.compositionObjectsArePersonalThemes, false);
  assert.equal(artifact.personalSynthesisCompatibility.createsProductionPriority, false);

  const runtimeRoots = [
    join(ROOT, 'apps/web/src'),
    join(ROOT, 'server/src'),
    join(ROOT, 'packages/contracts/src'),
    join(ROOT, 'packages/engine-client/src'),
  ];
  const runtimeFiles = runtimeRoots.flatMap(walkFiles).filter((path) => /\.(?:js|mjs|ts|tsx)$/.test(path));
  for (const path of runtimeFiles) {
    const text = readFileSync(path, 'utf8');
    assert.equal(text.includes('BODY_ASPECT_BODY_REPRESENTATIVE_V1'), false, path);
    assert.equal(text.includes('body.moon_x_aspect.'), false, path);
  }
});

test('SCHOOL_POLICY and SOURCE_TRACEABILITY: named lenses stay separate and traceable', () => {
  assert.equal(artifact.scope.defaultCandidateLens, 'MODERN_PSYCHOLOGICAL_WESTERN');
  assert.ok(artifact.scope.comparisonLenses.includes('TRADITIONAL_CLASSICAL'));
  assert.ok(artifact.scope.comparisonLenses.includes('EARLY_MODERN'));
  for (const composition of compositions) {
    assert.equal(composition.schoolNotes.defaultLens, 'MODERN_PSYCHOLOGICAL_WESTERN');
    assert.ok(composition.schoolNotes.comparisonLenses.includes('TRADITIONAL_CLASSICAL'));
    assert.ok(composition.schoolNotes.comparisonLenses.includes('EARLY_MODERN'));
    assert.equal(composition.schoolNotes.schoolsAreNotSilentlyMerged, true);
    assert.equal(composition.schoolNotes.conjunctionClassificationNuance, 'UNRESOLVED_IN_REPOSITORY');
  }
  assert.ok(artifact.sourceGapRegister.length >= 4);
  assert.ok(artifact.sourceGapRegister.some((gap) => gap.gapId === 'ASPECT_NUMERIC_ORB_POLICY'));
  assert.ok(artifact.sourceGapRegister.some((gap) => gap.gapId === 'ASPECT_PHASE_INTERPRETATION'));
});

test('deterministic artifact and review retain all readiness gates', () => {
  assert.deepEqual(JSON.parse(artifactSource), JSON.parse(JSON.stringify(artifact)));
  for (const text of [method, review]) {
    for (const gate of [
      'ASPECT_COMPOSITION_METHOD PASS',
      'BODY_FUNCTION_SEPARATION PASS',
      'ASPECT_RELATION_SEPARATION PASS',
      'CROSS_ASPECT_DIFFERENTIATION PASS',
      'NO_VALENCE_COLLAPSE PASS',
      'ANTI_STEREOTYPE PASS',
      'EVIDENCE_LINEAGE PASS',
      'NO_FALSE_INDEPENDENCE PASS',
      'ORB_AUTHORITY_BOUNDARY PASS',
      'UNKNOWN_TIME_AUTHORITY PASS',
      'SOURCE_TRACEABILITY PASS',
      'SCHOOL_POLICY PASS',
      'PERSONAL_SYNTHESIS_COMPATIBILITY PASS',
      'READY_FOR_BOUNDED_ASPECT_COMPOSITION_ADMISSION YES',
      'READY_FOR_ASPECT_SIGNAL_POLICY NO',
      'READY_FOR_BROAD_SCALE NO',
      'RUNTIME_ADMISSION NO',
    ]) {
      assert.ok(text.includes(gate), gate);
    }
    for (const aspect of expectedAspects) assert.ok(text.includes(aspect), aspect);
  }
});
