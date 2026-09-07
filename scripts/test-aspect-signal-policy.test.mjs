import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactPath = 'docs/research/personal-synthesis/ASPECT_SIGNAL_REPRESENTATIVE_V1.json';
const compositionPath = 'docs/research/astrology-knowledge-canon/aspects/BODY_ASPECT_BODY_REPRESENTATIVE_V1.json';
const methodPath = 'docs/product/NATALNODE_ASPECT_SIGNAL_POLICY_V1.md';
const reviewPath = 'docs/research/personal-synthesis/ASPECT_SIGNAL_REPRESENTATIVE_V1_REVIEW.md';

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const signal = readJson(artifactPath);
const composition = readJson(compositionPath);
const method = readText(methodPath);
const review = readText(reviewPath);
const serializedSignal = JSON.stringify(signal);

const expectedAspects = ['conjunction', 'trine', 'square', 'opposition'];
const expectedCompositionIds = expectedAspects.map(
  (aspect) => `body.moon_x_aspect.${aspect}_x_body.mercury`,
);
const expectedRuleIds = expectedAspects.map(
  (aspect) => `aspect-signal.body.moon_x_aspect.${aspect}_x_body.mercury`,
);
const expectedRootKeys = ['body.moon.position', 'body.mercury.position'];
const requiredRuleFields = [
  'ruleId',
  'ruleVersion',
  'compositionId',
  'requiredFactType',
  'relationalFactId',
  'bodyAId',
  'bodyBId',
  'aspectType',
  'eligibleDomain',
  'direction',
  'intensityPolicy',
  'confidencePolicy',
  'relationalSemanticClaim',
  'constructiveCapacity',
  'possibleTension',
  'evidenceLineage',
  'suppressionConditions',
  'authorityRequirements',
  'orbRequirements',
  'birthTimeRequirement',
  'provenance',
  'whyReferences',
  'learnReferences',
  'runtimeEligibility',
  'policyState',
  'editorialReviewStatus',
];

const ruleByAspect = (aspect) => {
  const rule = signal.rules.find((candidate) => candidate.aspectType === aspect);
  assert.ok(rule, `missing rule for ${aspect}`);
  return rule;
};

const narrativeText = (rule) => [
  rule.domainRationale,
  rule.domainDerivation.compositionQuestion,
  rule.relationalSemanticClaim,
  rule.constructiveCapacity,
  rule.possibleTension,
].join(' ').toLowerCase();

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build'].includes(entry.name)) return [];
      return walkFiles(absolutePath);
    }
    return [absolutePath];
  });
}

test('exact four-rule inventory and Signal contract', () => {
  assert.equal(signal.artifactId, 'natalnode.aspect-signal.representative-v1');
  assert.equal(signal.taskId, 'WEB-P2-ASPECT-SIGNAL-001');
  assert.equal(signal.status, 'REPRESENTATIVE_ASPECT_SIGNAL_POLICY_PASS');
  assert.equal(signal.scope.zodiacModel, 'WESTERN_TROPICAL');
  assert.deepEqual(signal.scope.bodyPair, ['body.moon', 'body.mercury']);
  assert.equal(signal.scope.includedRuleCount, 4);
  assert.deepEqual(signal.scope.includedAspectTypes, expectedAspects);
  assert.deepEqual(signal.scope.includedCompositionIds, expectedCompositionIds);
  assert.deepEqual(signal.rules.map((rule) => rule.ruleId), expectedRuleIds);
  assert.deepEqual(signal.rules.map((rule) => rule.compositionId), expectedCompositionIds);
  assert.equal(new Set(signal.rules.map((rule) => rule.ruleId)).size, 4);
  assert.deepEqual(composition.scope.includedCompositionIds, expectedCompositionIds);

  for (const rule of signal.rules) {
    for (const field of requiredRuleFields) {
      assert.ok(Object.hasOwn(rule, field), `${rule.ruleId} lacks ${field}`);
    }
    assert.match(rule.ruleVersion, /^\d+\.\d+\.\d+$/);
    assert.equal(rule.requiredFactType, 'NATAL_ASPECT');
    assert.equal(rule.bodyAId, 'body.moon');
    assert.equal(rule.bodyBId, 'body.mercury');
    assert.equal(rule.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
    assert.equal(rule.policyState, 'ADOPTED_WITH_CONDITIONS');
    assert.equal(rule.editorialReviewStatus, 'REPRESENTATIVE_POLICY_REVIEWED');
  }
});
test('DOMAIN_SEMANTICS: domain comes from integrated relation, not body ownership', () => {
  assert.equal(signal.domainPolicy.derivation, 'INTEGRATED_COMPOSITION_SEMANTICS');
  assert.equal(signal.domainPolicy.bodyRole, 'SEMANTIC_FUNCTION_INPUT');
  assert.equal(signal.domainPolicy.aspectRole, 'RELATIONAL_OPERATOR');
  assert.equal(signal.domainPolicy.BODY_ONLY_DOMAIN_MAPPING, 'FORBIDDEN');
  assert.equal(signal.domainPolicy.DOMAIN_FROM_COMPOSITION_SEMANTICS, 'REQUIRED');
  assert.equal(signal.domainPolicy.bodyOnlyMappingFallback, 'NO_SIGNAL');
  assert.equal(signal.domainPolicy.ambiguousCompositionOutcome, 'NO_SIGNAL');
  assert.equal(signal.domainPolicy.relationshipDomainShortcut, 'FORBIDDEN');

  const policyAndReview = `${method}\n${review}\n${serializedSignal}`;
  assert.doesNotMatch(policyAndReview, /Moon\s*[-→>]\s*EMOTIONAL/i);
  assert.doesNotMatch(policyAndReview, /Mercury\s*[-→>]\s*COMMUNICATION/i);

  for (const rule of signal.rules) {
    assert.equal(rule.eligibleDomain, 'COMMUNICATION', rule.ruleId);
    assert.equal(rule.domainDerivation.method, 'INTEGRATED_COMPOSITION_SEMANTICS', rule.ruleId);
    assert.equal(rule.domainDerivation.bodyOnlyMapping, 'FORBIDDEN', rule.ruleId);
    assert.equal(rule.domainDerivation.ambiguousOutcome, 'NO_SIGNAL', rule.ruleId);
    assert.match(rule.domainRationale, /integrated composition/i, rule.ruleId);
    assert.match(rule.domainRationale, /specific life-question/i, rule.ruleId);
    assert.match(rule.domainRationale, /Moon/i, rule.ruleId);
    assert.match(rule.domainRationale, /Mercury/i, rule.ruleId);
    assert.match(rule.domainRationale, new RegExp(rule.aspectType, 'i'), rule.ruleId);
    assert.ok(rule.domainDerivation.compositionQuestion.length > 0, rule.ruleId);
  }
});

test('DIRECTION_POLICY and NO_VALENCE_COLLAPSE: aspect type does not set orientation', () => {
  assert.equal(signal.directionPolicy.aspectTypeAloneDeterminesDirection, false);
  assert.equal(signal.directionPolicy.defaultForTheseRules, 'NEUTRAL');
  assert.equal(signal.directionPolicy.constructiveAndTensionBecomeMixedAutomatically, false);
  assert.deepEqual(signal.directionPolicy.forbiddenMappings, [
    'trine -> SUPPORTIVE',
    'square -> CHALLENGING',
    'opposition -> MIXED',
    'conjunction -> fixed direction',
  ]);
  for (const rule of signal.rules) {
    assert.equal(rule.direction, 'NEUTRAL', rule.ruleId);
    assert.match(rule.directionPolicy, /does not establish/i, rule.ruleId);
    assert.ok(rule.constructiveCapacity.length > 0, rule.ruleId);
    assert.ok(rule.possibleTension.length > 0, rule.ruleId);
  }
});

test('INTENSITY_POLICY: single aspect existence defaults to SUBTLE only', () => {
  assert.deepEqual(signal.intensityPolicy.singleAspectAllowedValues, ['SUBTLE']);
  assert.equal(signal.intensityPolicy.singleAspectCandidateValue, 'SUBTLE');
  assert.equal(signal.intensityPolicy.singleAspectMaximum, 'SUBTLE');
  assert.equal(signal.intensityPolicy.noticeablePromotionAdmittedForTheseRules, false);
  assert.equal(signal.intensityPolicy.orbMayPromoteIntensity, false);
  assert.match(signal.intensityPolicy.noticeableRequires, /explicitly admitted promotion/i);
  assert.match(signal.intensityPolicy.strongRequires, /none of these four rules may emit STRONG/i);
  assert.match(signal.intensityPolicy.dominantRequires, /none of these four rules may emit DOMINANT/i);

  for (const rule of signal.rules) {
    assert.equal(rule.candidateIntensity, 'SUBTLE', rule.ruleId);
    assert.deepEqual(rule.intensityPolicy.allowedSingleAspectValues, ['SUBTLE'], rule.ruleId);
    assert.equal(rule.intensityPolicy.maximum, 'SUBTLE', rule.ruleId);
    assert.equal(rule.intensityPolicy.orbMayPromote, false, rule.ruleId);
    assert.equal(['NOTICEABLE', 'STRONG', 'DOMINANT'].includes(rule.candidateIntensity), false);
  }
});

test('CONFIDENCE_POLICY: fact authority does not promote interpretation confidence', () => {
  assert.equal(signal.confidencePolicy.factAuthority, 'AUTHORITATIVE_ENGINE_REQUIRED');
  assert.equal(signal.confidencePolicy.singleAspectCandidateValue, 'LOW');
  assert.equal(signal.confidencePolicy.factAuthorityEqualsInterpretiveConfidence, false);
  assert.equal(signal.confidencePolicy.sharedRootsPromoteConfidence, false);
  assert.equal(signal.confidencePolicy.isProbability, false);
  assert.equal(signal.confidencePolicy.usesPercentages, false);

  for (const rule of signal.rules) {
    assert.equal(rule.candidateConfidence, 'LOW', rule.ruleId);
    assert.equal(rule.confidencePolicy.candidateValue, 'LOW', rule.ruleId);
    assert.equal(rule.confidencePolicy.factAuthority, 'AUTHORITATIVE_ENGINE_REQUIRED', rule.ruleId);
    assert.match(rule.confidencePolicy.higherConfidence, /separately admitted independent evidence/i);
  }
});

test('EVIDENCE_LINEAGE_PRESERVATION: exact Moon and Mercury roots are retained', () => {
  assert.deepEqual(signal.evidencePolicy.positionRootKeys, expectedRootKeys);
  assert.equal(signal.evidencePolicy.independentRootCount, 2);
  assert.equal(signal.evidencePolicy.relationalFactAddsSemanticInformation, true);
  assert.equal(signal.evidencePolicy.relationalFactIndependentEvidenceIncrement, 0);
  assert.equal(signal.evidencePolicy.aspectIntroducesIndependentPositionRoot, false);
  assert.equal(signal.evidencePolicy.semanticDistinctnessIsNotEvidenceRootIndependence, true);

  for (const rule of signal.rules) {
    const lineage = rule.evidenceLineage;
    assert.deepEqual(lineage.dependentPositionFactKeys, expectedRootKeys, rule.ruleId);
    assert.deepEqual(lineage.evidenceRootKeys, expectedRootKeys, rule.ruleId);
    assert.equal(lineage.independentRootCount, 2, rule.ruleId);
    assert.equal(lineage.semanticUnitCount, 3, rule.ruleId);
    assert.equal(lineage.relationalFactAddsSemanticInformation, true, rule.ruleId);
    assert.equal(lineage.relationalFactIsIndependentRoot, false, rule.ruleId);
    assert.equal(lineage.relationalFactIndependentEvidenceIncrement, 0, rule.ruleId);
    assert.equal(lineage.countsAsThreeIndependentRoots, false, rule.ruleId);
    assert.equal(lineage.relationalSemanticUnit, 'BODY_ASPECT_BODY', rule.ruleId);
    assert.equal(lineage.rootDeduplicationOperation, 'ROOT_DEDUPLICATION', rule.ruleId);
    assert.equal(lineage.relationalSemanticEnrichmentOperation, 'RELATIONAL_ENRICHMENT', rule.ruleId);
  }
});

test('ROOT_DEDUPLICATION: placement plus placement plus aspect has two roots and three semantic units', () => {
  const example = signal.convergencePolicy.examples.find(
    (candidate) => candidate.exampleId === 'placement-plus-aspect-shared-roots',
  );
  assert.ok(example);
  assert.deepEqual(example.uniqueRootKeys, expectedRootKeys);
  assert.equal(example.uniqueRootCount, 2);
  assert.equal(example.semanticUnits.length, 3);
  assert.deepEqual(example.semanticUnits, [
    'MOON_PLACEMENT',
    'MERCURY_PLACEMENT',
    'MOON_MERCURY_RELATION',
  ]);
  assert.equal(example.automaticConvergence, false);
  assert.equal(example.requiresSemanticOverlapDecision, true);
  assert.equal(signal.evidencePolicy.placementPlusPlacementPlusAspectUniqueRootCount, 2);
  assert.equal(signal.evidencePolicy.placementPlusPlacementPlusAspectSemanticUnitCount, 3);
});

test('RELATIONAL_SEMANTIC_ENRICHMENT: no new root still preserves new interaction meaning', () => {
  assert.equal(signal.evidencePolicy.relationalSemanticEnrichmentOperation, 'RELATIONAL_ENRICHMENT');
  assert.ok(signal.convergencePolicy.classificationVocabulary.includes('RELATIONAL_ENRICHMENT'));
  assert.ok(signal.convergencePolicy.classificationVocabulary.includes('INDEPENDENT_CONVERGENCE'));
  assert.notEqual(
    signal.convergencePolicy.classifications.RELATIONAL_ENRICHMENT.definition,
    signal.convergencePolicy.classifications.INDEPENDENT_CONVERGENCE.definition,
  );
  assert.equal(signal.convergencePolicy.classifications.RELATIONAL_ENRICHMENT.automaticPromotion, false);
  assert.equal(signal.convergencePolicy.classifications.INDEPENDENT_CONVERGENCE.automaticPromotion, false);

  const independent = signal.convergencePolicy.examples.find(
    (candidate) => candidate.exampleId === 'separate-roots-with-admitted-overlap',
  );
  assert.equal(independent.classification, 'INDEPENDENT_CONVERGENCE');
  assert.equal(independent.requiresAdmittedSemanticOverlap, true);
  assert.notDeepEqual(independent.rootSets[0], independent.rootSets[1]);
});

test('NO_FALSE_CONVERGENCE: shared roots, body, domain, or wording are insufficient', () => {
  assert.equal(signal.convergencePolicy.automaticAspectPlacementConvergence, false);
  assert.equal(signal.convergencePolicy.sharedRootsAreNotConvergence, true);
  assert.equal(signal.convergencePolicy.sameBodyIsNotConvergence, true);
  assert.equal(signal.convergencePolicy.sameDomainIsNotConvergence, true);
  assert.equal(signal.convergencePolicy.sameThemeWordingIsNotConvergence, true);
  assert.equal(signal.primarySignalPolicy.signalExistenceDoesNotImplyConvergence, true);
  assert.equal(signal.convergencePolicy.requiresFutureSemanticOverlapDecision, true);
  assert.match(signal.convergencePolicy.classifications.RELATIONAL_ENRICHMENT.definition, /compatibility decision/i);
});

test('DUPLICATE_RELATIONAL_FACT: duplicate relation is suppressed, not promoted', () => {
  assert.equal(signal.primarySignalPolicy.maxSignalsPerRelationalFact, 1);
  assert.equal(signal.primarySignalPolicy.duplicateRelationalFactOutcome, 'SUPPRESS_DUPLICATE');
  const duplicate = signal.convergencePolicy.examples.find(
    (candidate) => candidate.exampleId === 'same-relational-fact-duplicate',
  );
  assert.ok(duplicate);
  assert.equal(duplicate.classification, 'REDUNDANCY');
  assert.equal(duplicate.outcome, 'DUPLICATE_RELATIONAL_FACT_SUPPRESSED');
  assert.equal(duplicate.uniqueRootCount, 2);
  assert.equal(duplicate.eligibleForConvergence, false);
  assert.equal(duplicate.automaticPromotion, false);
  for (const rule of signal.rules) {
    assert.ok(rule.suppressionConditions.includes('DUPLICATE_RELATIONAL_FACT'), rule.ruleId);
    assert.equal(rule.suppressionReasonOnDuplicate, 'REDUNDANCY', rule.ruleId);
  }
});

test('fail-closed authority boundary: fixtures never claim AUTHORITATIVE_ENGINE', () => {
  for (const condition of [
    'MISSING_AUTHORITATIVE_ASPECT_FACT',
    'MISSING_POSITION_LINEAGE',
    'COMPOSITION_NOT_ADMITTED',
    'SIGNAL_RULE_NOT_ADMITTED',
    'UNSUPPORTED_ASPECT_TYPE',
    'UNSUPPORTED_ZODIAC_MODEL',
    'INCOMPATIBLE_SCHOOL_OR_POLICY',
    'MISSING_ORB_AUTHORITY',
    'UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION',
    'DUPLICATE_RELATIONAL_FACT',
    'INCONSISTENT_BODY_PAIR',
    'UNSUPPORTED_SEMANTIC_INFERENCE',
    'FAKE_OR_DEVELOPMENT_ASTRONOMY_AUTHORITY',
  ]) {
    assert.ok(signal.failClosedPolicy.conditions.includes(condition), condition);
  }
  for (const rule of signal.rules) {
    assert.equal(rule.authorityRequirements.requiredAspectAuthority, 'AUTHORITATIVE_ENGINE_REQUIRED');
    assert.deepEqual(rule.authorityRequirements.allowedSourceAuthorities, ['AUTHORITATIVE_ENGINE']);
    assert.equal(rule.authorityRequirements.developmentFixtureEligibility, 'SUPPRESS');
    assert.equal(rule.authorityRequirements.fixtureDoesNotClaimAuthority, true);
    assert.equal(Object.hasOwn(rule.provenance, 'sourceAuthority'), false);
    assert.notEqual(rule.provenance.sourceAuthority, 'AUTHORITATIVE_ENGINE');
  }
});

test('ORB_AUTHORITY_BOUNDARY: no invented orb, geometry, or phase interpretation', () => {
  assert.equal(signal.intensityPolicy.orbMayPromoteIntensity, false);
  assert.doesNotMatch(serializedSignal, /\d+(?:\.\d+)?\s*°/);
  assert.doesNotMatch(serializedSignal, /\b(?:orbValue|angularSeparation|exactDegree)\b/);
  for (const rule of signal.rules) {
    assert.equal(rule.orbRequirements.requiresAdmittedUpstreamPolicy, true, rule.ruleId);
    assert.equal(rule.orbRequirements.numericValueProvided, false, rule.ruleId);
    assert.equal(rule.orbRequirements.usedForIntensity, false, rule.ruleId);
    assert.equal(rule.orbRequirements.phasePreservedOnlyAsTechnicalProvenance, true, rule.ruleId);
    assert.equal(rule.orbRequirements.phaseInterpretationAdmitted, false, rule.ruleId);
  }
});

test('UNKNOWN_TIME_AUTHORITY: no aspect Signal without explicit Engine certification', () => {
  assert.equal(signal.unknownBirthTimePolicy.status, 'FAIL_CLOSED_BY_DEFAULT');
  assert.equal(
    signal.unknownBirthTimePolicy.aspectSignalEligibility,
    'NO_ASPECT_SIGNAL_UNLESS_AUTHORITATIVE_ENGINE_CERTIFIES',
  );
  assert.equal(signal.unknownBirthTimePolicy.requiresAuthoritativeCertification, true);
  for (const fallback of [
    'noon',
    'midnight',
    'default time',
    'average time',
    'guessed birth time',
    'fake degrees',
    'synthetic angular separation',
  ]) {
    assert.ok(signal.unknownBirthTimePolicy.forbiddenFallbacks.includes(fallback), fallback);
  }
  for (const rule of signal.rules) {
    assert.equal(rule.birthTimeRequirement.status, 'UNKNOWN_TIME_FAIL_CLOSED', rule.ruleId);
    assert.equal(rule.birthTimeRequirement.requiresAuthoritativeCertification, true, rule.ruleId);
    assert.equal(rule.birthTimeRequirement.requiresKnownBirthTime, false, rule.ruleId);
    assert.ok(rule.suppressionConditions.includes('UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION'));
  }
});

test('cross-aspect semantics remain distinct without valence labels', () => {
  assert.equal(signal.comparisonMatrix.length, 6);
  assert.equal(new Set(signal.comparisonMatrix.map((comparison) => comparison.comparisonId)).size, 6);
  for (const comparison of signal.comparisonMatrix) {
    assert.notEqual(comparison.left, comparison.right);
    assert.ok(comparison.whatChanges);
    assert.ok(comparison.whyItMatters);
  }
  assert.equal(new Set(signal.rules.map((rule) => rule.relationalSemanticClaim)).size, 4);
  assert.equal(new Set(signal.rules.map((rule) => rule.semanticBasis.aspectOperator)).size, 4);
  assert.match(ruleByAspect('conjunction').semanticBasis.aspectOperator, /coupling/i);
  assert.match(ruleByAspect('trine').semanticBasis.aspectOperator, /circulation/i);
  assert.match(ruleByAspect('square').semanticBasis.aspectOperator, /friction/i);
  assert.match(ruleByAspect('opposition').semanticBasis.aspectOperator, /polarity/i);
});

test('ANTI_STEREOTYPE: relation language does not become diagnosis or fixed type', () => {
  const forbiddenByAspect = {
    conjunction: ['STRONG', 'dominant', 'fused personality', 'emotionally intelligent'],
    trine: ['SUPPORTIVE', 'talent', 'gift', 'virtue', 'success', 'high confidence'],
    square: ['CHALLENGING', 'badness', 'pathology', 'emotional instability', 'communication problem'],
    opposition: ['MIXED', 'conflict', 'split personality', 'projection as universal doctrine', 'relationship problems'],
  };
  for (const rule of signal.rules) {
    for (const forbiddenInference of forbiddenByAspect[rule.aspectType]) {
      assert.ok(rule.forbiddenInferences.includes(forbiddenInference), `${rule.ruleId}:${forbiddenInference}`);
      assert.equal(narrativeText(rule).includes(forbiddenInference.toLowerCase()), false, `${rule.ruleId}:${forbiddenInference}`);
    }
    assert.doesNotMatch(narrativeText(rule), /diagnos|pathology|split personality|projection/i);
    assert.ok(rule.constructiveCapacity.length > 0, rule.ruleId);
    assert.ok(rule.possibleTension.length > 0, rule.ruleId);
  }
});

test('WHY_TRACEABILITY: every rule preserves fact, roots, composition, rule, source, and Learn trace', () => {
  const sourceByRef = new Map(signal.sourceCatalog.map((source) => [source.refId, source]));
  for (const source of signal.sourceCatalog) {
    assert.ok(source.refId);
    assert.ok(source.path);
    assert.ok(source.locator);
    assert.ok(source.sourceClass);
    assert.ok(source.supports);
    assert.ok(fs.existsSync(path.join(root, source.path)), source.path);
  }
  for (const rule of signal.rules) {
    const why = rule.whyReferences;
    assert.equal(why.aspectFact, rule.relationalFactId, rule.ruleId);
    assert.deepEqual(why.dependentPositionRoots, expectedRootKeys, rule.ruleId);
    assert.equal(why.compositionId, rule.compositionId, rule.ruleId);
    assert.equal(why.rule, `${rule.ruleId}@${rule.ruleVersion}`, rule.ruleId);
    assert.equal(why.authorityState, 'AUTHORITATIVE_ENGINE_REQUIRED', rule.ruleId);
    assert.equal(why.orbState, 'ADMITTED_UPSTREAM_POLICY_REQUIRED', rule.ruleId);
    assert.equal(why.birthTimeEligibility, 'UNKNOWN_TIME_REQUIRES_CERTIFICATION', rule.ruleId);
    assert.ok(why.semanticBasis.includes(rule.bodyAId), rule.ruleId);
    assert.ok(why.semanticBasis.includes(rule.bodyBId), rule.ruleId);
    for (const sourceRef of rule.provenance.sourceRefs) {
      assert.ok(sourceByRef.has(sourceRef), `${rule.ruleId}:${sourceRef}`);
    }
    for (const sourceRef of rule.whyReferences.sourcePolicyRefs) {
      assert.ok(sourceByRef.has(sourceRef), `${rule.ruleId}:${sourceRef}`);
    }
    for (const learnReference of rule.learnReferences) {
      assert.ok(fs.existsSync(path.join(root, learnReference.sourcePath)), learnReference.sourcePath);
    }
  }
});

test('PERSONAL_SYNTHESIS_COMPATIBILITY and runtime boundary remain explicit', () => {
  assert.equal(signal.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
  assert.equal(signal.readiness.READY_FOR_SHARED_ROOT_SYNTHESIS_POC, 'YES');
  assert.equal(signal.readiness.READY_FOR_BROAD_SCALE, 'NO');
  assert.equal(signal.readiness.RUNTIME_ADMISSION, 'NO');
  assert.ok(signal.scope.excluded.includes('PersonalTheme emission'));
  assert.ok(signal.scope.excluded.includes('runtime wiring'));

  const runtimeRoots = [
    path.join(root, 'apps/web/src'),
    path.join(root, 'server/src'),
    path.join(root, 'packages'),
  ];
  const runtimeFiles = runtimeRoots
    .flatMap(walkFiles)
    .filter((filePath) => /\.(?:c|m)?js|tsx?$/.test(filePath));
  for (const filePath of runtimeFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    assert.equal(source.includes('ASPECT_SIGNAL_REPRESENTATIVE_V1'), false, filePath);
    assert.equal(source.includes('aspect-signal.body.moon_x_aspect.'), false, filePath);
  }
});

test('deterministic structured output, source trace, gates, and readiness', () => {
  assert.deepEqual(JSON.parse(readText(artifactPath)), JSON.parse(JSON.stringify(signal)));
  for (const reference of signal.sourceReferences) {
    assert.ok(fs.existsSync(path.join(root, reference.path)), reference.path);
    assert.ok(signal.sourceCatalog.some((source) => source.refId === reference.refId), reference.refId);
  }
  for (const [gate, result] of Object.entries(signal.validationGates)) {
    assert.equal(result, 'PASS', gate);
  }
  for (const text of [method, review]) {
    for (const gate of [
      'ASPECT_SIGNAL_CONTRACT PASS',
      'DOMAIN_SEMANTICS PASS',
      'DIRECTION_POLICY PASS',
      'INTENSITY_POLICY PASS',
      'CONFIDENCE_POLICY PASS',
      'EVIDENCE_LINEAGE_PRESERVATION PASS',
      'ROOT_DEDUPLICATION PASS',
      'RELATIONAL_SEMANTIC_ENRICHMENT PASS',
      'NO_FALSE_CONVERGENCE PASS',
      'NO_VALENCE_COLLAPSE PASS',
      'ORB_AUTHORITY_BOUNDARY PASS',
      'UNKNOWN_TIME_AUTHORITY PASS',
      'ANTI_STEREOTYPE PASS',
      'WHY_TRACEABILITY PASS',
      'PERSONAL_SYNTHESIS_COMPATIBILITY PASS',
      'READY_FOR_BOUNDED_ASPECT_SIGNAL_ADMISSION YES',
      'READY_FOR_SHARED_ROOT_SYNTHESIS_POC YES',
      'READY_FOR_BROAD_SCALE NO',
      'RUNTIME_ADMISSION NO',
    ]) {
      assert.ok(text.includes(gate), gate);
    }
    for (const aspect of expectedAspects) assert.ok(text.includes(aspect), aspect);
  }
});
