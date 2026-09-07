import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compositionArtifact = JSON.parse(readFileSync(
  new URL('../docs/research/astrology-knowledge-canon/aspects/PERSONAL_BODY_ASPECT_BODY_EXPANSION_V1.json', import.meta.url),
  'utf8'
));
const signalArtifact = JSON.parse(readFileSync(
  new URL('../docs/research/personal-synthesis/PERSONAL_ASPECT_SIGNAL_EXPANSION_V1.json', import.meta.url),
  'utf8'
));

const pairs = [
  ['body.moon', 'body.venus'],
  ['body.mercury', 'body.mars']
];
const aspectTypes = ['conjunction', 'trine', 'square', 'opposition'];
const expectedCompositionIds = pairs.flatMap(([bodyAId, bodyBId]) =>
  aspectTypes.map((aspectType) => `${bodyAId}_x_aspect.${aspectType}_x_${bodyBId}`)
);
const expectedSignalIds = expectedCompositionIds.map(
  (compositionId) => `signal.aspect.${compositionId}`
);
const closedDomains = new Set([
  'SELF',
  'EMOTIONAL',
  'RELATIONSHIP',
  'COMMUNICATION',
  'WORK_CREATION',
  'ACTION_DECISION'
]);
const interpretiveFields = [
  'bodyAFunction',
  'bodyBFunction',
  'integratedMeaning',
  'boundedChartQuestion',
  'constructivePotential',
  'possibleTradeOff'
];
const forbiddenStereotypeTerms = [
  'romantic',
  'beautiful',
  'attractive',
  'lovable',
  'people pleaser',
  'needy in relationships',
  'wealth',
  'aggressive',
  'argumentative',
  'angry',
  'violent',
  'dangerous',
  'warrior'
];

const compositionsById = new Map(
  compositionArtifact.compositions.map((composition) => [composition.compositionId, composition])
);
const rulesById = new Map(
  signalArtifact.rules.map((rule) => [rule.compositionId, rule])
);

test('scope admits exactly Moon-Venus and Mercury-Mars across four major operators', () => {
  assert.deepEqual(compositionArtifact.scope.includedBodyPairs, pairs);
  assert.deepEqual(compositionArtifact.scope.includedAspectTypes, aspectTypes);
  assert.deepEqual(compositionArtifact.scope.includedCompositionIds, expectedCompositionIds);
  assert.equal(compositionArtifact.scope.includedCompositionCount, 8);
  assert.equal(compositionArtifact.compositions.length, 8);
  assert.deepEqual(signalArtifact.rules.map((rule) => rule.compositionId), expectedCompositionIds);
  assert.deepEqual(signalArtifact.rules.map((rule) => rule.signalId), expectedSignalIds);
  assert.equal(signalArtifact.rules.length, 8);
  assert.equal(signalArtifact.scope.includedRuleCount, 8);
  assert.equal(signalArtifact.sextileDecision.SEXTILE_SEMANTIC_ADMISSION, 'DEFERRED');
  assert.equal(compositionArtifact.sextileDecision.SEXTILE_SEMANTIC_ADMISSION, 'DEFERRED');
  assert.ok(signalArtifact.rules.every((rule) => !rule.aspectType.includes('sextile')));
});

test('pair functions and aspect operators remain separate semantic dimensions', () => {
  for (const [bodyAId, bodyBId] of pairs) {
    const pairRules = signalArtifact.rules.filter((rule) =>
      rule.bodyAId === bodyAId && rule.bodyBId === bodyBId
    );
    assert.equal(pairRules.length, 4);
    assert.equal(new Set(pairRules.map((rule) => rule.aspectType)).size, 4);
    assert.ok(pairRules.every((rule) => rule.semanticBasis.bodyAFunction.length > 0));
    assert.ok(pairRules.every((rule) => rule.semanticBasis.bodyBFunction.length > 0));
    assert.ok(pairRules.every((rule) => rule.semanticBasis.aspectOperator.length > 0));
    assert.ok(pairRules.every((rule) => rule.semanticBasis.semanticDimensionCount === 3));
    assert.equal(new Set(pairRules.map((rule) => rule.relationalSemanticClaim)).size, 4);
    assert.equal(new Set(pairRules.map((rule) => rule.domainRationale)).size, 4);
  }

  for (const composition of compositionArtifact.compositions) {
    assert.equal(composition.compositionType, 'BODY_X_ASPECT_X_BODY');
    assert.equal(composition.aspectRelation.relationalNotCausal, true);
    assert.equal(composition.aspectRelation.automaticValence, 'NOT_ASSIGNED');
    assert.equal(composition.aspectRelation.automaticImportance, 'NOT_ASSIGNED');
    assert.equal(composition.evidenceLineage.semanticDimensionCount, 3);
    assert.equal(composition.evidenceLineage.independentRootCount, 2);
    assert.equal(composition.evidenceLineage.relationalFactIndependentEvidenceIncrement, 0);
  }
});

test('cross-aspect differentiation is semantic rather than valence-based and avoids stereotypes', () => {
  for (const [bodyAId, bodyBId] of pairs) {
    const pairCompositions = compositionArtifact.compositions.filter((composition) =>
      composition.bodyAId === bodyAId && composition.bodyBId === bodyBId
    );
    const operatorMeanings = pairCompositions.map((composition) =>
      `${composition.aspectRelation.structuralQuality}|${composition.integratedMeaning}|${composition.boundedChartQuestion}|${composition.possibleTradeOff}`
    );
    assert.equal(new Set(operatorMeanings).size, 4);
    assert.ok(pairCompositions.every((composition) =>
      composition.aspectRelation.automaticValence === 'NOT_ASSIGNED'
    ));

    for (const composition of pairCompositions) {
      const prose = interpretiveFields.map((field) => composition[field]).join(' ');
      for (const term of forbiddenStereotypeTerms) {
        assert.doesNotMatch(prose, new RegExp(`\\b${term.replaceAll(' ', '\\s+')}\\b`, 'iu')),
          `${composition.compositionId} contains forbidden stereotype wording: ${term}`;
      }
    }
  }
});

test('Signal policy derives closed domains from integrated composition semantics', () => {
  assert.equal(signalArtifact.domainPolicy.BODY_ONLY_DOMAIN_MAPPING, 'FORBIDDEN');
  assert.equal(signalArtifact.domainPolicy.DOMAIN_FROM_COMPOSITION_SEMANTICS, 'REQUIRED');
  assert.equal(signalArtifact.domainPolicy.majorityVoting, false);
  assert.equal(signalArtifact.domainPolicy.ambiguousOutcome, 'NO_SIGNAL');

  for (const rule of signalArtifact.rules) {
    assert.ok(closedDomains.has(rule.eligibleDomain));
    assert.equal(rule.domainDerivation.method, 'INTEGRATED_COMPOSITION_SEMANTICS');
    assert.equal(rule.domainDerivation.bodyOnlyMapping, 'FORBIDDEN');
    assert.equal(rule.domainDerivation.majorityVote, false);
    assert.equal(rule.domainDerivation.ambiguousOutcome, 'NO_SIGNAL');
    assert.match(rule.domainRationale, /integrated|composition|not inherited|not a body-only/iu);
    assert.equal(rule.semanticBasis.integratedCompositionId, rule.compositionId);
  }
});

test('all new Signal rules preserve neutral, subtle, low and one-unit/two-root accounting', () => {
  for (const rule of signalArtifact.rules) {
    assert.equal(rule.direction, 'NEUTRAL');
    assert.equal(rule.candidateIntensity, 'SUBTLE');
    assert.equal(rule.candidateConfidence, 'LOW');
    assert.equal(rule.semanticUnit.type, 'BODY_ASPECT_BODY');
    assert.equal(rule.semanticUnit.count, 1);
    assert.deepEqual(rule.semanticDimensions, {
      count: 3,
      values: ['BODY_A_FUNCTION', 'BODY_B_FUNCTION', 'ASPECT_RELATIONAL_OPERATOR']
    });
    assert.equal(rule.evidenceLineage.independentRootCount, 2);
    assert.equal(rule.evidenceLineage.uniqueRootCount, 2);
    assert.equal(rule.evidenceLineage.semanticUnitCount, 1);
    assert.equal(rule.evidenceLineage.semanticDimensionCount, 3);
    assert.equal(rule.evidenceLineage.relationalFactIndependentEvidenceIncrement, 0);
    assert.equal(rule.evidenceLineage.relationalFactIsIndependentRoot, false);
    assert.equal(rule.evidenceLineage.countsAsThreeIndependentRoots, false);
    assert.equal(rule.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
    assert.equal(rule.provenance.runtimeStatus, 'RUNTIME_NOT_ADMITTED');
  }
  assert.equal(signalArtifact.intensityPolicy.noticeablePromotionAdmittedForTheseRules, false);
  assert.equal(signalArtifact.confidencePolicy.sharedRootsPromoteConfidence, false);
});

test('duplicate, orb/phase, unknown-time, and fail-closed boundaries remain explicit', () => {
  assert.equal(signalArtifact.duplicatePolicy.duplicateClassification, 'REDUNDANCY');
  assert.equal(signalArtifact.duplicatePolicy.rootDeduplicationIsDistinctFromSemanticUnitDeduplication, true);
  assert.equal(signalArtifact.duplicatePolicy.duplicateAddsConfidence, false);
  assert.equal(signalArtifact.duplicatePolicy.duplicateAddsIntensity, false);
  assert.equal(signalArtifact.orbPhasePolicy.numericValueProvided, false);
  assert.equal(signalArtifact.orbPhasePolicy.pairSpecificOrbTable, false);
  assert.equal(signalArtifact.orbPhasePolicy.phaseInterpretationAdmitted, false);
  assert.equal(signalArtifact.unknownBirthTimePolicy.status, 'FAIL_CLOSED_BY_DEFAULT');
  assert.equal(signalArtifact.unknownBirthTimePolicy.requiresAuthoritativeCertification, true);
  assert.equal(signalArtifact.rules.every((rule) =>
    rule.birthTimeRequirement.status === 'UNKNOWN_TIME_FAIL_CLOSED'
  ), true);
  assert.equal(signalArtifact.rules.every((rule) =>
    rule.birthTimeRequirement.requiresAuthoritativeCertification === true
  ), true);
  assert.ok(signalArtifact.rules.every((rule) =>
    rule.birthTimeRequirement.forbiddenDependencies.includes('ASC') &&
    rule.birthTimeRequirement.forbiddenDependencies.includes('MC') &&
    rule.birthTimeRequirement.forbiddenDependencies.includes('houses')
  ));
});

test('composition and Signal provenance is deterministic and production remains unwired', () => {
  const compositionJson = JSON.stringify(compositionArtifact);
  const signalJson = JSON.stringify(signalArtifact);
  assert.equal(JSON.stringify(JSON.parse(compositionJson)), compositionJson);
  assert.equal(JSON.stringify(JSON.parse(signalJson)), signalJson);
  assert.ok(signalArtifact.rules.every((rule) =>
    rule.provenance.compositionArtifactPath.endsWith('PERSONAL_BODY_ASPECT_BODY_EXPANSION_V1.json')
  ));
  assert.ok(signalArtifact.rules.every((rule) =>
    rule.provenance.sourceRefs.includes('SHARED_ROOT_SYNTHESIS_POC')
  ));

  const productionIndex = readFileSync(
    new URL('../apps/web/src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(productionIndex, /PERSONAL_ASPECT_SIGNAL_EXPANSION_V1|PERSONAL_BODY_ASPECT_BODY_EXPANSION_V1|shared-root-relational-synthesis-poc/iu);
});
