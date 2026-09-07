import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const ARTIFACT_PATH = 'docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1.json';
const METHOD_PATH = 'docs/product/NATALNODE_BODY_SIGN_COMPOSITION_METHOD_V1.md';
const REVIEW_PATH = 'docs/research/astrology-knowledge-canon/compositions/BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1_REVIEW.md';

const EXPECTED_COMPOSITION_IDS = [
  'body.moon_x_sign.aries',
  'body.mercury_x_sign.aries',
  'body.moon_x_sign.taurus',
  'body.mercury_x_sign.taurus'
];

const REQUIRED_FIELDS = [
  'compositionId',
  'bodyId',
  'signId',
  'bodyFunction',
  'signContribution',
  'elementContribution',
  'modalityContribution',
  'rulershipContext',
  'integratedMeaning',
  'boundedChartQuestion',
  'constructivePotential',
  'possibleTradeOff',
  'nearbyDistinctions',
  'modifierRequirements',
  'forbiddenInferences',
  'placementEvidence',
  'semanticDimensions',
  'semanticDependencies',
  'sourceRefs',
  'schoolNotes',
  'epistemicStatus',
  'policyState',
  'runtimeEligibility',
  'editorialReviewStatus'
];

function readText(relativePath) {
  return readFileSync(join(REPOSITORY_ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function collectSourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }
    if (/\.(?:astro|ts|tsx|mjs|js)$/u.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function collectReaderFacingText(composition) {
  return [
    composition.bodyFunction,
    composition.signContribution,
    composition.integratedMeaning,
    composition.boundedChartQuestion,
    composition.constructivePotential,
    composition.possibleTradeOff,
    ...composition.nearbyDistinctions.flatMap((distinction) => [
      distinction.comparison,
      distinction.distinction,
      distinction.whyItMatters
    ])
  ].join(' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

const artifact = readJson(ARTIFACT_PATH);

test('representative composition JSON has the required schema and exact inventory', () => {
  assert.equal(artifact.artifactId, 'natalnode.body-sign-composition.representative-v1');
  assert.equal(artifact.taskId, 'WEB-P2-COMPOSITION-001');
  assert.equal(artifact.scope.includedCompositionCount, 4);
  assert.deepEqual(
    artifact.compositions.map((composition) => composition.compositionId),
    EXPECTED_COMPOSITION_IDS
  );
  assert.equal(new Set(artifact.compositions.map((composition) => composition.compositionId)).size, 4);
  assert.deepEqual(artifact.requiredFields, REQUIRED_FIELDS);

  for (const composition of artifact.compositions) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(composition[field] !== undefined, `${composition.compositionId} is missing ${field}`);
    }
    assert.equal(composition.compositionType, 'BODY_X_SIGN');
    assert.equal(composition.epistemicStatus, 'EDITORIAL_SYNTHESIS');
    assert.equal(composition.sourceStatus, 'SOURCE_SUPPORTED_WITH_CONDITIONS');
    assert.equal(composition.policyState, 'ADOPTED_WITH_CONDITIONS');
    assert.equal(composition.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
    assert.ok(composition.sourceRefs.length >= 5);
    assert.ok(composition.modifierRequirements.length >= 8);
    assert.ok(composition.nearbyDistinctions.length >= 2);

    for (const sourceRef of composition.sourceRefs) {
      assert.ok(sourceRef.refId);
      assert.ok(sourceRef.path);
      assert.ok(existsSync(join(REPOSITORY_ROOT, sourceRef.path)), sourceRef.path);
      assert.ok(sourceRef.locator);
      assert.ok(sourceRef.sourceClass);
      assert.ok(sourceRef.supports);
    }
  }

  assert.equal(artifact.comparisonControl.compositionId, 'body.sun_x_sign.taurus');
  assert.ok(!artifact.compositions.some(
    (composition) => composition.compositionId === artifact.comparisonControl.compositionId
  ));
  assert.ok(existsSync(join(REPOSITORY_ROOT, artifact.comparisonControl.artifactPath)));
});

test('body and sign contributions remain semantically differentiated', () => {
  const integratedMeanings = artifact.compositions.map((composition) => composition.integratedMeaning);
  const chartQuestions = artifact.compositions.map((composition) => composition.boundedChartQuestion);
  const constructivePotentials = artifact.compositions.map((composition) => composition.constructivePotential);
  const tradeOffs = artifact.compositions.map((composition) => composition.possibleTradeOff);

  assert.equal(new Set(integratedMeanings).size, 4);
  assert.equal(new Set(chartQuestions).size, 4);
  assert.equal(new Set(constructivePotentials).size, 4);
  assert.equal(new Set(tradeOffs).size, 4);
  assert.equal(artifact.comparisonMatrix.length, 6);
  assert.equal(new Set(artifact.comparisonMatrix.map((entry) => entry.comparisonId)).size, 6);

  const moonCompositions = artifact.compositions.filter((composition) => composition.bodyId === 'body.moon');
  const mercuryCompositions = artifact.compositions.filter((composition) => composition.bodyId === 'body.mercury');
  const ariesCompositions = artifact.compositions.filter((composition) => composition.signId === 'sign.aries');
  const taurusCompositions = artifact.compositions.filter((composition) => composition.signId === 'sign.taurus');

  assert.equal(moonCompositions.length, 2);
  assert.equal(mercuryCompositions.length, 2);
  assert.equal(ariesCompositions.length, 2);
  assert.equal(taurusCompositions.length, 2);
  assert.match(moonCompositions[0].bodyFunction, /response|rhythm|receptivity|needs/u);
  assert.match(mercuryCompositions[0].bodyFunction, /thinking|naming|interpreting|comparing|learning|information/u);
  assert.match(ariesCompositions[0].signContribution, /initiated|activated|asserted|motion/u);
  assert.match(taurusCompositions[0].signContribution, /embodied|valued|maintained|tangible/u);
});

test('required anti-stereotype boundaries are absent from bounded meaning fields', () => {
  const forbiddenByComposition = {
    'body.moon_x_sign.aries': [
      'emotionally impulsive',
      'angry',
      'impatient',
      'aggressive',
      'emotionally unstable',
      'needs excitement'
    ],
    'body.mercury_x_sign.aries': [
      'fast',
      'blunt',
      'argumentative',
      'genius',
      'poor listener',
      'aggressive'
    ],
    'body.moon_x_sign.taurus': [
      'stable',
      'comfort-loving',
      'possessive',
      'stubborn',
      'sensual',
      'financially security-oriented'
    ],
    'body.mercury_x_sign.taurus': [
      'slow',
      'practical thinker',
      'stubborn thinker',
      'good money',
      'methodical communicator'
    ]
  };

  for (const composition of artifact.compositions) {
    const readerText = collectReaderFacingText(composition).toLowerCase();
    for (const forbiddenInference of forbiddenByComposition[composition.compositionId]) {
      assert.doesNotMatch(
        readerText,
        new RegExp(`\\b${escapeRegExp(forbiddenInference.toLowerCase())}\\b`, 'u'),
        `${composition.compositionId} leaked ${forbiddenInference}`
      );
    }
    for (const forbiddenInference of forbiddenByComposition[composition.compositionId]) {
      assert.ok(
        composition.forbiddenInferences.some((entry) => entry.toLowerCase().includes(forbiddenInference.toLowerCase())),
        `${composition.compositionId} does not record ${forbiddenInference} as forbidden`
      );
    }
  }
});

test('each Body × Sign composition has exactly one placement evidence unit', () => {
  const evidenceAccounting = artifact.method.evidenceAccounting;

  assert.equal(evidenceAccounting.authoritativeEvidenceUnit, 'BODY_SIGN_PLACEMENT');
  assert.equal(evidenceAccounting.independentEvidenceUnitsPerPlacement, 1);
  assert.equal(evidenceAccounting.bodyAndSignAreDistinctSemanticDimensions, true);
  assert.equal(evidenceAccounting.bodyAndSignAreSeparateEvidenceUnits, false);
  assert.equal(evidenceAccounting.samePlacementMaySelfConverge, false);
  assert.equal(evidenceAccounting.distinctAuthoritativePlacementFactsMayConvergeLater, true);
  assert.equal(evidenceAccounting.repeatedPlacementReferencesIncreaseConfidenceOrPriority, false);
  assert.equal(evidenceAccounting.derivedSignLayersCountAsIndependentEvidence, false);

  for (const composition of artifact.compositions) {
    const placementEvidence = composition.placementEvidence;
    assert.equal(placementEvidence.evidenceType, 'BODY_SIGN_PLACEMENT');
    assert.equal(placementEvidence.bodyId, composition.bodyId);
    assert.equal(placementEvidence.signId, composition.signId);
    assert.equal(placementEvidence.independentEvidenceUnits, 1);
    assert.equal(placementEvidence.samePlacementMaySelfConverge, false);
    assert.equal(new Set([placementEvidence.evidenceId]).size, 1);
  }
});

test('semantic dimensions remain distinct while sharing one placement fact', () => {
  for (const composition of artifact.compositions) {
    const dimensions = composition.semanticDimensions;
    assert.notEqual(dimensions.body.id, dimensions.sign.id);
    assert.equal(dimensions.body.semanticDimension, true);
    assert.equal(dimensions.sign.semanticDimension, true);
    assert.equal(dimensions.body.independentEvidence, false);
    assert.equal(dimensions.sign.independentEvidence, false);
    assert.equal(composition.semanticDependencies.body.independentEvidence, false);
    assert.equal(composition.semanticDependencies.sign.independentEvidence, false);

    for (const layer of ['element', 'modality', 'rulership']) {
      assert.equal(dimensions[layer].derivedSignLayer, true);
      assert.equal(dimensions[layer].derivedFrom, composition.signId);
      assert.equal(dimensions[layer].independentEvidence, false);
      assert.equal(composition.semanticDependencies[layer].independentEvidence, false);
      assert.equal(composition.semanticDependencies[layer].derivedFrom, composition.signId);
    }
    assert.equal(composition.elementContribution.independentEvidence, false);
    assert.equal(composition.modalityContribution.independentEvidence, false);
  }
});

test('only genuinely different placement facts may converge later', () => {
  const moonAries = artifact.compositions.find(
    (composition) => composition.compositionId === 'body.moon_x_sign.aries'
  );
  const mercuryAries = artifact.compositions.find(
    (composition) => composition.compositionId === 'body.mercury_x_sign.aries'
  );

  assert.notEqual(moonAries.placementEvidence.evidenceId, mercuryAries.placementEvidence.evidenceId);
  assert.equal(
    new Set([
      moonAries.placementEvidence.evidenceId,
      mercuryAries.placementEvidence.evidenceId
    ]).size,
    2
  );
  assert.equal(artifact.method.evidenceAccounting.distinctAuthoritativePlacementFactsMayConvergeLater, true);

  const repeatedPlacementReferences = [
    moonAries.placementEvidence.evidenceId,
    moonAries.placementEvidence.evidenceId
  ];
  assert.equal(new Set(repeatedPlacementReferences).size, 1);
  assert.equal(artifact.method.evidenceAccounting.samePlacementMaySelfConverge, false);
  assert.equal(artifact.method.evidenceAccounting.repeatedPlacementReferencesIncreaseConfidenceOrPriority, false);
  for (const composition of artifact.compositions) {
    assert.equal('confidence' in composition, false);
    assert.equal('priority' in composition, false);
    assert.equal('strength' in composition, false);
  }
});

test('rulership remains a named relation without imported semantics or co-rulers', () => {
  const expectedRulers = new Map([
    ['sign.aries', 'body.mars'],
    ['sign.taurus', 'body.venus']
  ]);

  for (const composition of artifact.compositions) {
    assert.equal(composition.rulershipContext.tradition, 'TRADITIONAL_CLASSICAL');
    assert.equal(composition.rulershipContext.rulerBodyId, expectedRulers.get(composition.signId));
    assert.equal(composition.rulershipContext.importsCompleteRulerSemantics, false);
    assert.equal(composition.rulershipContext.independentEvidence, false);
    assert.equal(composition.rulershipContext.defaultCoRuler, false);
    assert.deepEqual(composition.rulershipContext.modernAlternatives, []);
    assert.doesNotMatch(composition.rulershipContext.relation, /controls|causes|strength score/u);
  }
});

test('unknown-time and Personal Synthesis boundaries remain explicit', () => {
  assert.match(artifact.method.unknownTimeRule, /unknown|ASC|MC|houses/u);
  assert.equal(artifact.personalSynthesisCompatibility.compositionObjectsArePersonalThemes, false);
  assert.equal(artifact.personalSynthesisCompatibility.compositionObjectsSetProductionPriority, false);
  assert.equal(artifact.personalSynthesisCompatibility.numericStrengthOrPriority, 'NOT_ALLOWED');
  assert.equal(artifact.personalSynthesisCompatibility.requiresIndependentEvidenceKey, true);
  assert.equal(artifact.personalSynthesisCompatibility.requiresBirthTimeEligibility, true);
  assert.equal(artifact.personalSynthesisCompatibility.requiresSuppressionAndLimitations, true);
  assert.equal(artifact.personalSynthesisCompatibility.requiresWhyAndLearnTrace, true);

  for (const composition of artifact.compositions) {
    const modifierNames = composition.modifierRequirements.map((modifier) => modifier.modifier);
    for (const requiredModifier of [
      'authoritative_body_sign_fact',
      'zodiac_model',
      'school_choice',
      'birth_time_authority',
      'house_and_house_system',
      'aspects_orb_and_phase',
      'degrees_or_decans',
      'other_chart_factors_and_counterevidence',
      'temporal_context'
    ]) {
      assert.ok(modifierNames.includes(requiredModifier), `${composition.compositionId} lacks ${requiredModifier}`);
    }
    assert.match(
      composition.modifierRequirements.find((modifier) => modifier.modifier === 'birth_time_authority').requirement,
      /unknown birth time|Unknown birth time/u
    );
  }
});

test('production/runtime entrypoint semantics remain unchanged and the artifact is not imported', () => {
  const runtimeTokens = [
    'BODY_SIGN_COMPOSITION_REPRESENTATIVE_V1',
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries',
    'body.moon_x_sign.taurus',
    'body.mercury_x_sign.taurus'
  ];

  const sourceRoots = [
    join(REPOSITORY_ROOT, 'apps', 'web', 'src'),
    join(REPOSITORY_ROOT, 'server', 'src'),
    join(REPOSITORY_ROOT, 'packages', 'contracts', 'src'),
    join(REPOSITORY_ROOT, 'packages', 'engine-client', 'src')
  ];

  for (const sourceRoot of sourceRoots) {
    for (const sourcePath of collectSourceFiles(sourceRoot)) {
      const source = readFileSync(sourcePath, 'utf8');
      for (const runtimeToken of runtimeTokens) {
        assert.equal(source.includes(runtimeToken), false, `${sourcePath} imports ${runtimeToken}`);
      }
    }
  }

  const rootPackage = readJson('package.json');
  const serverPackage = readJson('server/package.json');
  assert.equal(rootPackage.scripts['server:start'], 'npm run start --workspace=server');
  assert.equal(serverPackage.scripts.start, 'node dist/executable/server-main.js');
  assert.equal(serverPackage.scripts.migrate, 'node --env-file-if-exists=../.env dist/executable/migration-main.js');
  assert.equal(serverPackage.scripts.local, 'node --env-file-if-exists=../.env dist/executable/local-main.js');
  assert.doesNotMatch(readText('apps/web/src/features/interpretation/index.ts'), /BODY_SIGN_COMPOSITION|body\.moon_x_sign/u);
});

test('method and review dossier record the same bounded decision', () => {
  const method = readText(METHOD_PATH);
  const review = readText(REVIEW_PATH);

  for (const marker of [
    'READY_FOR_BOUNDED_COMPOSITION_ADMISSION: YES',
    'READY_FOR_BROAD_SCALE: NO',
    'RUNTIME_ADMISSION: NO',
    'NO_SEMANTIC_DOUBLE_COUNTING',
    'PLACEMENT_EVIDENCE_MODEL',
    'UNKNOWN_TIME_COMPATIBILITY',
    'PERSONAL_SYNTHESIS_COMPATIBILITY'
  ]) {
    assert.match(method, new RegExp(escapeRegExp(marker), 'u'));
    assert.match(review, new RegExp(escapeRegExp(marker), 'u'));
  }

  for (const compositionName of ['Moon × Aries', 'Mercury × Aries', 'Moon × Taurus', 'Mercury × Taurus']) {
    assert.match(review, new RegExp(escapeRegExp(compositionName), 'u'));
  }
});
