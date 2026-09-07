import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const personalSynthesis = await import(
  new URL(
    '../dist/personal-synthesis-poc-characterization/features/interpretation/personal-synthesis-poc.js',
    import.meta.url
  ).href
);

const {
  PERSONAL_SYNTHESIS_POC_FIXTURES,
  getPersonalSynthesisPocFixture,
  synthesizePersonalThemes
} = personalSynthesis;

function fixture(scenarioId) {
  return getPersonalSynthesisPocFixture(scenarioId);
}

function synthesize(scenarioId, options) {
  return synthesizePersonalThemes(fixture(scenarioId), options);
}

function theme(result, semanticThemeKey) {
  const selected = result.coreThemes.find((candidate) => candidate.semanticThemeKey === semanticThemeKey);
  assert.ok(selected, `expected selected theme ${semanticThemeKey}`);
  return selected;
}

test('the five POC fixtures are development-only, bounded, and repeatable', () => {
  assert.deepEqual(
    PERSONAL_SYNTHESIS_POC_FIXTURES.map((candidate) => candidate.scenarioId),
    [
      'CASE_A_CONVERGENT_SUPPORT',
      'CASE_B_MEANINGFUL_TENSION',
      'CASE_C_REDUNDANCY',
      'CASE_D_UNKNOWN_BIRTH_TIME',
      'CASE_E_DOMAIN_PRIORITIES'
    ]
  );

  for (const candidate of PERSONAL_SYNTHESIS_POC_FIXTURES) {
    const first = synthesizePersonalThemes(candidate);
    const second = synthesizePersonalThemes(candidate);

    assert.deepEqual(first, second, `${candidate.scenarioId} must be deterministic`);
    assert.equal(first.authority, 'DEVELOPMENT_ONLY');
    assert.equal(first.semanticBasisStatus, 'RUNTIME_NOT_ADMITTED');
    assert.ok(first.coreThemes.length <= 5);
    assert.ok(first.coreThemes.every((selected) => selected.sourceSignalIds.length > 0));
  }
});

test('convergent evidence merges into one theme and repeated evidence does not count twice', () => {
  const result = synthesize('CASE_A_CONVERGENT_SUPPORT');
  const communication = theme(result, 'communication-clarity');

  assert.equal(result.coreThemes.filter((candidate) => candidate.domain === 'COMMUNICATION').length, 1);
  assert.equal(communication.convergence.status, 'CONVERGENT');
  assert.deepEqual(communication.convergence.independentEvidenceKeys, [
    'mercury-aspect',
    'mercury-placement'
  ]);
  assert.equal(communication.sourceSignalIds.length, 3);
  assert.equal(
    result.candidateTrace.find((candidate) => candidate.candidateKey === 'mercury-aspect-clarity').decision,
    'MERGED_CONVERGENCE'
  );
  assert.equal(
    result.candidateTrace.find((candidate) => candidate.candidateKey === 'mercury-placement-repeat').decision,
    'MERGED_SAME_EVIDENCE'
  );
  assert.ok(result.coreThemes.length < result.naiveFactDump.length);
});

test('meaningful tension preserves both directions and derives a mixed theme', () => {
  const result = synthesize('CASE_B_MEANINGFUL_TENSION');
  const action = theme(result, 'deliberate-action');

  assert.equal(action.direction, 'MIXED');
  assert.equal(action.editorial.why.tension.status, 'MIXED');
  assert.equal(action.editorial.why.tension.supportiveSignalIds.length, 1);
  assert.equal(action.editorial.why.tension.challengingSignalIds.length, 1);
  assert.equal(action.convergence.status, 'CONVERGENT');
  assert.match(action.editorial.tension, /Momentum|pacing/u);
  assert.match(action.editorial.lever, /reversible|missing/u);
  assert.match(action.editorial.why.text, /remain together|trade-off/u);
});

test('redundant candidates are suppressed in favor of the clearest representative', () => {
  const result = synthesize('CASE_C_REDUNDANCY');
  const communication = theme(result, 'communication-clarity');

  assert.equal(result.coreThemes.some((candidate) => candidate.semanticThemeKey === 'communication-directness'), false);
  assert.deepEqual(communication.redundancy.suppressedThemeKeys, ['communication-directness']);
  const suppressed = result.candidateTrace.find(
    (candidate) => candidate.candidateKey === 'directness-restatement'
  );
  assert.equal(suppressed?.decision, 'SUPPRESSED_REDUNDANCY');
  assert.match(suppressed?.decisionReason ?? '', /communication-clarity/u);
});

test('unknown birth time fails closed for ASC, MC, and houses while retaining safe evidence', () => {
  const result = synthesize('CASE_D_UNKNOWN_BIRTH_TIME');

  assert.equal(result.birthTimeAuthority, 'UNKNOWN');
  assert.deepEqual(result.coreThemes.map((candidate) => candidate.semanticThemeKey), [
    'communication-clarity',
    'emotional-pacing'
  ]);
  assert.equal(result.skippedRules.length, 2);
  assert.deepEqual(
    result.skippedRules.map((skip) => skip.reason),
    ['BIRTH_TIME_UNAVAILABLE', 'BIRTH_TIME_UNAVAILABLE']
  );
  assert.ok(result.coreThemes.every((candidate) =>
    candidate.evidenceRefs.every((reference) =>
      reference.factKind !== 'NATAL_ANGLE_POSITION' &&
      reference.factKind !== 'NATAL_HOUSE_PLACEMENT' &&
      !/\/angles\//u.test(reference.canonicalPath) &&
      !/\/house/u.test(reference.canonicalPath)
    )
  ));
  assert.equal(result.coreThemes.some((candidate) => candidate.semanticThemeKey === 'self-direction'), false);
  assert.equal(result.coreThemes.some((candidate) => candidate.semanticThemeKey === 'work-continuity'), false);
  assert.doesNotMatch(JSON.stringify(result.coreThemes), /noon|midnight|12:00|00:00/u);
});

test('domain-aware selection represents materially supported domains without forcing weak diversity', () => {
  const result = synthesize('CASE_E_DOMAIN_PRIORITIES');
  const domains = new Set(result.coreThemes.map((candidate) => candidate.domain));

  assert.equal(result.coreThemes.length, 5);
  assert.deepEqual([...domains].sort(), [
    'ACTION_DECISION',
    'COMMUNICATION',
    'EMOTIONAL',
    'SELF',
    'WORK_CREATION'
  ]);

  const capped = synthesize('CASE_E_DOMAIN_PRIORITIES', { maxThemes: 3 });
  assert.equal(capped.coreThemes.length, 3);
  assert.deepEqual(capped.coreThemes.map((candidate) => candidate.ranking.rank), [1, 2, 3]);
  assert.ok(capped.coreThemes.every((candidate) => candidate.confidence !== 'LOW'));
});

test('every selected theme preserves evidence, composition, authority, and contextual Learn references', () => {
  for (const candidate of PERSONAL_SYNTHESIS_POC_FIXTURES) {
    const result = synthesizePersonalThemes(candidate);
    for (const selected of result.coreThemes) {
      assert.equal(selected.authority, 'DEVELOPMENT_ONLY');
      assert.ok(selected.evidenceRefs.length > 0);
      assert.ok(selected.semanticBasisIds.length > 0);
      assert.ok(selected.compositionRuleRefs.length > 0);
      assert.ok(selected.sourceSignalIds.length > 0);
      assert.ok(selected.editorial.learnReferences.length > 0);
      assert.ok(selected.editorial.why.sourceChartFacts.length > 0);
      assert.deepEqual(selected.editorial.why.sourceChartFacts, selected.evidenceRefs);
      assert.equal(selected.editorial.why.confidence, selected.confidence);
      assert.equal(selected.editorial.why.birthTimeAuthority, result.birthTimeAuthority);
      assert.doesNotMatch(JSON.stringify(selected), /(?:percent|accuracy score|probability)/iu);
    }
  }
});

test('stable tie-breaking is deterministic and unsupported semantic inputs fail closed', () => {
  const source = fixture('CASE_C_REDUNDANCY');
  const tiedCandidates = source.candidates
    .filter((candidate) => ['aries-self', 'fixed-work'].includes(candidate.candidateKey))
    .map((candidate) => ({
      ...candidate,
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      ranking: {
        ...candidate.ranking,
        baseImportance: 0.7,
        evidenceStrength: 0.7
      }
    }));
  const tiedFixture = {
    ...source,
    scenarioId: 'CASE_TIE_BREAK',
    candidates: tiedCandidates
  };
  const first = synthesizePersonalThemes(tiedFixture, { maxThemes: 1 });
  const second = synthesizePersonalThemes(tiedFixture, { maxThemes: 1 });
  assert.deepEqual(first, second);
  assert.equal(first.coreThemes.length, 1);
  assert.equal(first.coreThemes[0].semanticThemeKey, 'self-direction');

  const unsupportedFixture = {
    ...source,
    scenarioId: 'CASE_UNSUPPORTED_SEMANTIC',
    candidates: source.candidates.map((candidate, index) => index === 0
      ? { ...candidate, semanticBasisId: 'unsupported.primitive' }
      : candidate)
  };
  assert.throws(
    () => synthesizePersonalThemes(unsupportedFixture),
    /unsupported semantic basis/u
  );
});

test('the POC remains isolated from production UI and contains no AI or transport integration', () => {
  const source = readFileSync(
    new URL('../src/features/interpretation/personal-synthesis-poc.ts', import.meta.url),
    'utf8'
  );
  const interpretationIndex = readFileSync(
    new URL('../src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /(?:openai|fetch\(|axios|from\s+["'](?:react|astro))/iu);
  assert.doesNotMatch(interpretationIndex, /personal-synthesis-poc/u);
});
