import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const signalArtifactPath = 'docs/research/personal-synthesis/COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json';
const compositionArtifactPath = 'docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1.json';

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const signal = readJson(signalArtifactPath);
const composition = readJson(compositionArtifactPath);

const expectedCompositionIds = [
  'body.moon_x_sign.aries',
  'body.mercury_x_sign.aries',
  'body.moon_x_sign.taurus',
  'body.mercury_x_sign.taurus',
];

const requiredRuleFields = [
  'ruleId',
  'ruleVersion',
  'compositionId',
  'requiredFactType',
  'placementEvidenceKey',
  'eligibleDomain',
  'direction',
  'intensityPolicy',
  'confidencePolicy',
  'semanticClaim',
  'constructiveCapacity',
  'possibleTension',
  'suppressionConditions',
  'authorityRequirements',
  'birthTimeRequirement',
  'provenance',
  'whyReferences',
  'learnReferences',
  'runtimeEligibility',
  'policyState',
  'editorialReviewStatus',
];

const ruleByCompositionId = (compositionId) => {
  const rule = signal.rules.find((candidate) => candidate.compositionId === compositionId);
  assert.ok(rule, `missing Signal rule for ${compositionId}`);
  return rule;
};

test('the representative artifact contains exactly the four admitted rules', () => {
  assert.deepEqual(signal.scope.includedCompositionIds, expectedCompositionIds);
  assert.deepEqual(signal.rules.map((rule) => rule.compositionId), expectedCompositionIds);
  assert.equal(signal.rules.length, 4);
  assert.equal(signal.scope.includedRuleCount, 4);
  assert.deepEqual(composition.compositions.map((item) => item.compositionId), expectedCompositionIds);
});

test('every Signal rule satisfies the structured rule contract', () => {
  for (const rule of signal.rules) {
    for (const field of requiredRuleFields) {
      assert.ok(rule[field] !== undefined, `${rule.ruleId} is missing ${field}`);
    }

    assert.equal(rule.requiredFactType, 'NATAL_BODY_POSITION');
    assert.match(rule.ruleVersion, /^\d+\.\d+\.\d+$/);
    assert.equal(rule.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
    assert.equal(rule.policyState, 'ADOPTED_WITH_CONDITIONS');
    assert.equal(rule.editorialReviewStatus, 'REPRESENTATIVE_POLICY_REVIEWED');
    assert.ok(rule.semanticClaim.length > 0);
    assert.ok(rule.constructiveCapacity.length > 0);
    assert.ok(rule.possibleTension.length > 0);
    assert.ok(rule.suppressionConditions.length > 0);
    assert.ok(rule.learnReferences.length > 0);
    assert.ok(rule.provenance.sourceRefs.length > 0);
  }
});

test('one placement preserves one evidence unit while body and sign stay distinct semantic dimensions', () => {
  assert.equal(signal.evidencePolicy.independentEvidenceUnitsPerPlacement, 1);
  assert.equal(signal.evidencePolicy.bodyAndSignAreDistinctSemanticDimensions, true);
  assert.equal(signal.evidencePolicy.bodyAndSignCreateSeparateEvidenceUnits, false);
  assert.equal(signal.evidencePolicy.derivedSignLayersCreateEvidence, false);

  for (const item of composition.compositions) {
    assert.equal(item.placementEvidence.independentEvidenceUnits, 1, item.compositionId);
    assert.equal(item.semanticDimensions.body.semanticDimension, true, item.compositionId);
    assert.equal(item.semanticDimensions.sign.semanticDimension, true, item.compositionId);
    assert.equal(item.semanticDimensions.body.independentEvidence, false, item.compositionId);
    assert.equal(item.semanticDimensions.sign.independentEvidence, false, item.compositionId);

    for (const derivedLayer of ['element', 'modality', 'rulership']) {
      assert.equal(item.semanticDimensions[derivedLayer].derivedSignLayer, true, `${item.compositionId}:${derivedLayer}`);
      assert.equal(item.semanticDimensions[derivedLayer].independentEvidence, false, `${item.compositionId}:${derivedLayer}`);
      assert.equal(item.semanticDependencies[derivedLayer].independentEvidence, false, `${item.compositionId}:${derivedLayer}`);
    }

    const rule = ruleByCompositionId(item.compositionId);
    assert.equal(rule.placementEvidenceKey, item.placementEvidence.evidenceId, item.compositionId);
    assert.equal(rule.placementEvidence.independentEvidenceUnits, 1, item.compositionId);
    assert.equal(rule.semanticBasis.evidenceUnitCount, 1, item.compositionId);
    assert.deepEqual(rule.placementEvidence.semanticDimensions, [
      'body',
      'sign',
      'element',
      'modality',
      'rulership',
    ]);
  }
});

test('each placement has at most one primary Signal and cannot self-converge', () => {
  assert.equal(signal.primarySignalPolicy.maxPrimarySignalsPerPlacement, 1);
  assert.equal(signal.primarySignalPolicy.compositionAlternativesFromSamePlacement, 'SUPPRESS');
  assert.equal(signal.evidencePolicy.samePlacementMaySelfConverge, false);

  for (const rule of signal.rules) {
    assert.equal(rule.primarySignalPolicy.maxSignalsPerPlacement, 1, rule.ruleId);
    assert.equal(rule.primarySignalPolicy.samePlacementConvergence, 'NOT_ELIGIBLE', rule.ruleId);
    assert.equal(rule.placementEvidence.independentEvidenceUnits, 1, rule.ruleId);
  }

  const duplicate = signal.convergenceExamples.find((example) => example.exampleId === 'same-placement-duplicate');
  assert.ok(duplicate);
  assert.equal(duplicate.samePlacement, true);
  assert.equal(duplicate.evidenceUnitCount, 1);
  assert.equal(duplicate.eligibleForLaterConvergenceReview, false);
  assert.equal(duplicate.outcome, 'ONE_PRIMARY_SIGNAL_AND_DUPLICATE_SUPPRESSED');
});

test('distinct placement facts may be reviewed for convergence, but shared sign is not enough', () => {
  const distinct = signal.convergenceExamples.find((example) => example.exampleId === 'same-sign-different-placement');
  assert.ok(distinct);
  assert.equal(distinct.samePlacement, false);
  assert.equal(distinct.evidenceUnitCount, 2);
  assert.equal(new Set(distinct.placementEvidenceKeys).size, 2);
  assert.equal(distinct.eligibleForLaterConvergenceReview, true);
  assert.equal(distinct.automaticMerge, false);

  const unrelated = signal.convergenceExamples.find((example) => example.exampleId === 'different-placement-no-semantic-overlap');
  assert.ok(unrelated);
  assert.equal(unrelated.evidenceUnitCount, 2);
  assert.equal(unrelated.eligibleForLaterConvergenceReview, false);
  assert.equal(unrelated.automaticMerge, false);
});

test('repeated placement references cannot inflate confidence, intensity, priority, or convergence', () => {
  assert.equal(signal.evidencePolicy.repeatedPlacementReferencesIncreaseConfidence, false);
  assert.equal(signal.evidencePolicy.repeatedPlacementReferencesIncreaseIntensity, false);
  assert.equal(signal.evidencePolicy.repeatedPlacementReferencesIncreasePriority, false);
  assert.equal(signal.primarySignalPolicy.priorityAssignment, 'DEFERRED_TO_PERSONAL_SYNTHESIS');

  const duplicate = signal.convergenceExamples.find((example) => example.exampleId === 'same-placement-duplicate');
  assert.deepEqual(duplicate.placementEvidenceKeys, [
    'placement.body.moon.sign.aries',
    'placement.body.moon.sign.aries',
  ]);
  assert.equal(duplicate.evidenceUnitCount, 1);
});

test('existing cross-matrix differentiation and rulership boundaries remain intact', () => {
  assert.equal(composition.validationGates.CROSS_MATRIX_DIFFERENTIATION, 'PASS');
  assert.equal(composition.validationGates.RULERSHIP_BOUNDARY, 'PASS');

  const moonAries = composition.compositions.find((item) => item.compositionId === 'body.moon_x_sign.aries');
  const mercuryAries = composition.compositions.find((item) => item.compositionId === 'body.mercury_x_sign.aries');
  const moonTaurus = composition.compositions.find((item) => item.compositionId === 'body.moon_x_sign.taurus');
  assert.notEqual(moonAries.integratedMeaning, mercuryAries.integratedMeaning);
  assert.notEqual(moonAries.integratedMeaning, moonTaurus.integratedMeaning);

  for (const item of composition.compositions) {
    assert.equal(item.rulershipContext.importsCompleteRulerSemantics, false, item.compositionId);
    assert.equal(item.rulershipContext.independentEvidence, false, item.compositionId);
  }
});

test('domains, directions, intensity, and confidence stay within existing vocabularies', () => {
  assert.deepEqual(signal.signalTaxonomy.domains, [
    'SELF',
    'EMOTIONAL',
    'RELATIONSHIP',
    'COMMUNICATION',
    'WORK_CREATION',
    'ACTION_DECISION',
  ]);
  assert.deepEqual(signal.signalTaxonomy.directions, ['SUPPORTIVE', 'CHALLENGING', 'MIXED', 'NEUTRAL']);
  assert.deepEqual(signal.signalTaxonomy.intensities, ['SUBTLE', 'NOTICEABLE', 'STRONG', 'DOMINANT']);
  assert.deepEqual(signal.signalTaxonomy.confidences, ['HIGH', 'MEDIUM', 'LOW']);
  assert.equal(signal.directionPolicy.defaultForTheseRules, 'NEUTRAL');
  assert.equal(signal.directionPolicy.constructiveAndTensionBecomeMixedAutomatically, false);
  assert.deepEqual(signal.intensityPolicy.singlePlacementAllowedValues, ['SUBTLE', 'NOTICEABLE']);
  assert.equal(signal.intensityPolicy.singlePlacementMaximum, 'NOTICEABLE');
  assert.equal(signal.confidencePolicy.singlePlacementCandidateValue, 'LOW');
  assert.equal(signal.confidencePolicy.factAuthorityEqualsInterpretiveConfidence, false);
  assert.equal(signal.confidencePolicy.isProbability, false);
  assert.equal(signal.confidencePolicy.usesPercentages, false);

  for (const rule of signal.rules) {
    assert.ok(signal.signalTaxonomy.domains.includes(rule.eligibleDomain), rule.ruleId);
    assert.equal(rule.direction, 'NEUTRAL', rule.ruleId);
    assert.equal(rule.candidateIntensity, 'NOTICEABLE', rule.ruleId);
    assert.equal(rule.intensityPolicy.maximum, 'NOTICEABLE', rule.ruleId);
    assert.equal(rule.candidateConfidence, 'LOW', rule.ruleId);
    assert.match(rule.intensityPolicy.strongOrDominant, /Not eligible/);
  }
});

test('missing or unsupported admission fails closed', () => {
  assert.equal(signal.primarySignalPolicy.proseFallback, 'NO_SIGNAL');
  assert.equal(signal.failClosedPolicy.missingRuleOutcome, 'NO_SIGNAL');
  assert.equal(signal.failClosedPolicy.unsupportedCompositionOutcome, 'NO_SIGNAL');
  assert.equal(signal.failClosedPolicy.fallbackAstrology, false);

  for (const condition of [
    'MISSING_AUTHORITATIVE_PLACEMENT',
    'COMPOSITION_NOT_ADMITTED',
    'SIGNAL_RULE_NOT_ADMITTED',
    'UNSUPPORTED_ZODIAC_MODEL',
    'INCOMPATIBLE_SCHOOL_OR_POLICY',
    'DUPLICATE_SAME_PLACEMENT_SIGNAL',
    'INSUFFICIENT_AUTHORITY',
    'FORBIDDEN_TIME_DEPENDENCY',
    'UNSUPPORTED_SEMANTIC_INFERENCE',
  ]) {
    assert.ok(signal.failClosedPolicy.conditions.includes(condition), condition);
  }
});

test('unknown birth time remains bounded to authoritative planetary sign placement', () => {
  for (const rule of signal.rules) {
    assert.equal(rule.birthTimeRequirement.status, 'UNKNOWN_TIME_SAFE', rule.ruleId);
    assert.equal(rule.birthTimeRequirement.requiresKnownBirthTime, false, rule.ruleId);
    for (const forbiddenDependency of ['ASC', 'MC', 'houses', 'house-derived-domain', 'angle-prominence', 'fabricated-time']) {
      assert.ok(rule.birthTimeRequirement.forbiddenDependencies.includes(forbiddenDependency), `${rule.ruleId}:${forbiddenDependency}`);
    }
  }
});

test('anti-stereotype boundaries and WHY / LEARN traceability are explicit', () => {
  const forbiddenByComposition = {
    'body.moon_x_sign.aries': ['angry', 'impulsive', 'unstable', 'aggressive'],
    'body.mercury_x_sign.aries': ['blunt', 'fast speaker', 'argumentative', 'genius', 'poor listener'],
    'body.moon_x_sign.taurus': ['stubborn', 'possessive', 'comfort-loving', 'sensual', 'financially security-oriented'],
    'body.mercury_x_sign.taurus': ['slow thinker', 'practical thinker', 'good with money', 'methodical communicator'],
  };

  for (const rule of signal.rules) {
    for (const forbiddenInference of forbiddenByComposition[rule.compositionId]) {
      assert.ok(rule.forbiddenInferences.includes(forbiddenInference), `${rule.ruleId}:${forbiddenInference}`);
    }
    assert.equal(rule.whyReferences.compositionId, rule.compositionId);
    assert.equal(rule.whyReferences.rule, `${rule.ruleId}@${rule.ruleVersion}`);
    assert.equal(rule.whyReferences.chartFact, rule.placementEvidenceKey);
    assert.equal(rule.whyReferences.authorityState, 'AUTHORITATIVE_ENGINE_REQUIRED');
    assert.equal(rule.whyReferences.birthTimeEligibility, 'UNKNOWN_TIME_SAFE');
    assert.ok(rule.whyReferences.semanticBasis.includes(rule.semanticBasis.bodyId));
    assert.ok(rule.whyReferences.semanticBasis.includes(rule.semanticBasis.signId));
    for (const learnReference of rule.learnReferences) {
      assert.ok(fs.existsSync(path.join(root, learnReference.sourcePath)), learnReference.sourcePath);
    }
  }
});

test('Personal Synthesis compatibility is explicit without runtime admission', () => {
  assert.equal(signal.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
  assert.ok(signal.scope.excluded.includes('PersonalTheme emission'));
  assert.ok(signal.scope.excluded.includes('runtime interpretation import'));
  assert.equal(signal.readiness.READY_FOR_MY_CHART_SIGNAL_POC, 'NO');
  assert.equal(signal.readiness.READY_FOR_BROAD_SCALE, 'NO');
  assert.equal(signal.readiness.RUNTIME_ADMISSION, 'NO');

  const runtimeRoots = ['apps/web/src', 'server/src', 'packages'];
  const sourceFiles = [];
  const collectSourceFiles = (relativeDir) => {
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) return;
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build'].includes(entry.name)) collectSourceFiles(relativePath);
      } else if (/\.(c|m)?js|tsx?$/.test(entry.name)) {
        sourceFiles.push(relativePath);
      }
    }
  };
  runtimeRoots.forEach(collectSourceFiles);

  const forbiddenRuntimeTokens = [
    'COMPOSITION_SIGNAL_REPRESENTATIVE_V1',
    'composition-signal.body.moon_x_sign.aries',
    'composition-signal.body.mercury_x_sign.aries',
    'composition-signal.body.moon_x_sign.taurus',
    'composition-signal.body.mercury_x_sign.taurus',
  ];
  for (const sourceFile of sourceFiles) {
    const source = readText(sourceFile);
    for (const token of forbiddenRuntimeTokens) {
      assert.equal(source.includes(token), false, `${sourceFile} imports policy token ${token}`);
    }
  }

  const serverPackage = readJson('server/package.json');
  assert.equal(serverPackage.scripts.start, 'node dist/executable/server-main.js');
  assert.equal(serverPackage.scripts.migrate, 'node --env-file-if-exists=../.env dist/executable/migration-main.js');
  assert.equal(serverPackage.scripts.local, 'node --env-file-if-exists=../.env dist/executable/local-main.js');
});

test('the structured policy remains deterministic and all source references resolve', () => {
  assert.equal(signal.artifactId, 'natalnode.composition-signal.representative-v1');
  assert.equal(signal.status, 'REPRESENTATIVE_COMPOSITION_SIGNAL_POLICY_PASS');
  assert.equal(signal.baseline, 'ce8ea09825dcc0d7063886249f3b07fcedc4e20d');
  assert.equal(signal.validationGates.SIGNAL_RULE_CONTRACT, 'PASS');
  assert.equal(signal.validationGates.PLACEMENT_EVIDENCE_PRESERVATION, 'PASS');
  assert.equal(signal.validationGates.ONE_PLACEMENT_ONE_PRIMARY_SIGNAL, 'PASS');

  for (const reference of signal.sourceReferences) {
    assert.ok(fs.existsSync(path.join(root, reference.path)), reference.path);
  }
  assert.deepEqual(signal.rules.map((rule) => rule.ruleId), [
    'composition-signal.body.moon_x_sign.aries',
    'composition-signal.body.mercury_x_sign.aries',
    'composition-signal.body.moon_x_sign.taurus',
    'composition-signal.body.mercury_x_sign.taurus',
  ]);
});
