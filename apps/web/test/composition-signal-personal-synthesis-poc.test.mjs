import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const adapter = await import(
  new URL(
    '../dist/composition-signal-synthesis-poc-characterization/features/interpretation/composition-signal-personal-synthesis-poc.js',
    import.meta.url
  ).href
);
const artifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json', import.meta.url),
  'utf8'
));

const rulesByCompositionId = new Map(
  artifact.rules.map((rule) => [rule.compositionId, rule])
);

function rules(...compositionIds) {
  return compositionIds.map((compositionId) => {
    const rule = rulesByCompositionId.get(compositionId);
    assert.ok(rule, `missing representative rule ${compositionId}`);
    return rule;
  });
}

function synthesize(...compositionIds) {
  return adapter.synthesizeCompositionSignalResearchInputs(rules(...compositionIds));
}

function theme(result, compositionId) {
  const selected = result.synthesis.coreThemes.find((candidate) =>
    candidate.representativeSignalTraces?.some((signal) => signal.compositionId === compositionId)
  );
  assert.ok(selected, `missing theme for ${compositionId}`);
  return selected;
}

test('representative Signals enter the existing Personal Synthesis POC without fake Engine authority', () => {
  const result = synthesize(
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries'
  );

  assert.equal(result.sourceType, 'RESEARCH_REPRESENTATIVE_SIGNAL');
  assert.equal(result.synthesis.authority, 'DEVELOPMENT_ONLY');
  assert.equal(result.synthesis.semanticBasisStatus, 'RUNTIME_NOT_ADMITTED');
  assert.equal(result.synthesis.evaluatedSignals.length, 2);
  assert.ok(result.synthesis.evaluatedSignals.every((signal) =>
    signal.sourceType === 'RESEARCH_REPRESENTATIVE_SIGNAL' &&
    signal.authority === 'DEVELOPMENT_ONLY' &&
    signal.provenance.sourceAuthority === 'INCOMPLETE_RESEARCH'
  ));
  assert.equal(result.suppressedSignals.length, 0);
  assert.equal(result.synthesis.coreThemes.length, 2);
});

test('Signal identity, domains, direction, intensity, confidence, and placement evidence survive unchanged', () => {
  const result = synthesize(
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries'
  );

  for (const rule of rules('body.moon_x_sign.aries', 'body.mercury_x_sign.aries')) {
    const selected = theme(result, rule.compositionId);
    const trace = selected.representativeSignalTraces.find((signal) => signal.signalId === rule.signalId);
    assert.ok(trace);
    assert.equal(trace.signalId, rule.signalId);
    assert.equal(trace.compositionId, rule.compositionId);
    assert.equal(trace.rule.ruleId, rule.ruleId);
    assert.equal(trace.rule.ruleVersion, rule.ruleVersion);
    assert.equal(trace.domain, rule.eligibleDomain);
    assert.equal(trace.direction, rule.direction);
    assert.equal(trace.intensity, rule.candidateIntensity);
    assert.equal(trace.confidence, rule.candidateConfidence);
    assert.equal(trace.placementEvidenceKey, rule.placementEvidenceKey);
    assert.equal(trace.evidenceUnitCount, 1);
    assert.equal(trace.suppressionState, 'ELIGIBLE');
    assert.equal('internalStrength' in trace, false);
    assert.equal('priority' in trace, false);
    assert.equal('ranking' in trace, false);
    assert.equal(trace.semanticClaim, rule.semanticClaim);
    assert.equal(trace.constructiveCapacity, rule.constructiveCapacity);
    assert.equal(trace.possibleTension, rule.possibleTension);
    assert.deepEqual(trace.semanticBasis, rule.semanticBasis);
    assert.deepEqual(trace.whyReferences, rule.whyReferences);
    assert.deepEqual(trace.learnReferences, rule.learnReferences);
    assert.deepEqual(trace.suppressionConditions, rule.suppressionConditions);
    assert.equal(trace.provenance.sourceAuthority, 'INCOMPLETE_RESEARCH');
    assert.deepEqual(selected.editorial.why.representativeSignalTraces, [trace]);
    assert.equal(selected.direction, 'NEUTRAL');
    assert.equal(selected.intensity, 'SUBTLE');
    assert.equal(selected.confidence, 'LOW');
    assert.match(selected.ranking.rationale.join(' '), /no priority inferred/u);
  }
});

test('same-sign different placements remain separate and do not auto-converge', () => {
  const aries = synthesize(
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries'
  );
  const taurus = synthesize(
    'body.moon_x_sign.taurus',
    'body.mercury_x_sign.taurus'
  );
  const sameBody = synthesize(
    'body.moon_x_sign.aries',
    'body.moon_x_sign.taurus'
  );

  for (const result of [aries, taurus]) {
    assert.equal(result.synthesis.coreThemes.length, 2);
    assert.ok(result.synthesis.coreThemes.every((candidate) => candidate.convergence.status === 'SINGLE_EVIDENCE'));
    assert.ok(result.synthesis.coreThemes.every((candidate) => candidate.sourceSignalIds.length === 1));
    assert.deepEqual(
      result.synthesis.coreThemes.map((candidate) => candidate.domain).sort(),
      ['COMMUNICATION', 'EMOTIONAL']
    );
  }
  assert.equal(sameBody.synthesis.coreThemes.length, 2);
  assert.ok(sameBody.synthesis.coreThemes.every((candidate) => candidate.convergence.status === 'SINGLE_EVIDENCE'));
  assert.ok(sameBody.synthesis.coreThemes.every((candidate) => candidate.domain === 'EMOTIONAL'));
});

test('different compositions do not introduce forced domain diversity or invented tension', () => {
  const result = synthesize(
    'body.moon_x_sign.taurus',
    'body.mercury_x_sign.aries'
  );

  assert.equal(result.synthesis.coreThemes.length, 2);
  assert.deepEqual(
    result.synthesis.coreThemes.map((candidate) => candidate.domain).sort(),
    ['COMMUNICATION', 'EMOTIONAL']
  );
  assert.ok(result.synthesis.coreThemes.every((candidate) => candidate.direction === 'NEUTRAL'));
  assert.ok(result.synthesis.coreThemes.every((candidate) => candidate.editorial.why.tension.status === 'SINGLE_DIRECTION'));
  assert.ok(result.synthesis.coreThemes.every((candidate) => candidate.convergence.status === 'SINGLE_EVIDENCE'));
});

test('duplicate same placement is suppressed before synthesis without inflation', () => {
  const moonAries = rules('body.moon_x_sign.aries')[0];
  const result = adapter.synthesizeCompositionSignalResearchInputs([moonAries, moonAries]);

  assert.equal(result.inputSignals.length, 2);
  assert.equal(result.eligibleSignals.length, 1);
  assert.equal(result.suppressedSignals.length, 1);
  assert.deepEqual(result.suppressedSignals[0], {
    signalId: moonAries.signalId,
    placementEvidenceKey: moonAries.placementEvidenceKey,
    reason: 'DUPLICATE_SAME_PLACEMENT'
  });
  assert.equal(result.synthesis.coreThemes.length, 1);
  assert.equal(result.synthesis.coreThemes[0].sourceSignalIds.length, 1);
  assert.equal(result.synthesis.coreThemes[0].representativeSignalTraces.length, 1);
  assert.equal(result.synthesis.coreThemes[0].confidence, 'LOW');
  assert.equal(result.synthesis.coreThemes[0].intensity, 'SUBTLE');
  assert.equal(result.synthesis.coreThemes[0].ranking.convergence, 'SINGLE_EVIDENCE');
});

test('one surviving Signal produces at most one PersonalTheme and max five is only a ceiling', () => {
  const single = synthesize('body.moon_x_sign.aries');
  const all = synthesize(
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries',
    'body.moon_x_sign.taurus',
    'body.mercury_x_sign.taurus'
  );
  const capped = adapter.synthesizeCompositionSignalResearchInputs(
    rules(
      'body.moon_x_sign.aries',
      'body.mercury_x_sign.aries',
      'body.moon_x_sign.taurus',
      'body.mercury_x_sign.taurus'
    ),
    { maxThemes: 2 }
  );

  assert.equal(single.synthesis.coreThemes.length, 1);
  assert.equal(single.synthesis.coreThemes[0].sourceSignalIds.length, 1);
  assert.equal(all.synthesis.coreThemes.length, 4);
  assert.ok(all.synthesis.coreThemes.length <= 5);
  assert.equal(capped.synthesis.coreThemes.length, 2);
});

test('unknown-time-safe representative Signals remain usable without time-dependent content', () => {
  const result = synthesize(
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries',
    'body.moon_x_sign.taurus',
    'body.mercury_x_sign.taurus'
  );

  assert.equal(result.synthesis.birthTimeAuthority, 'UNKNOWN');
  for (const themeCandidate of result.synthesis.coreThemes) {
    assert.equal(themeCandidate.authorityRequirements.birthTimeDependency, 'UNKNOWN_TIME_SAFE');
    for (const signal of themeCandidate.representativeSignalTraces) {
      assert.equal(signal.birthTimeRequirement.status, 'UNKNOWN_TIME_SAFE');
      assert.equal(signal.birthTimeRequirement.requiresKnownBirthTime, false);
      assert.ok(signal.birthTimeRequirement.forbiddenDependencies.includes('ASC'));
      assert.ok(signal.birthTimeRequirement.forbiddenDependencies.includes('MC'));
      assert.ok(signal.birthTimeRequirement.forbiddenDependencies.includes('houses'));
    }
  }
  assert.ok(result.synthesis.coreThemes.every((candidate) =>
    candidate.evidenceRefs.every((reference) =>
      reference.factKind === 'OTHER' &&
      !/\/angles\/|\/house/u.test(reference.canonicalPath)
    )
  ));
  assert.doesNotMatch(
    JSON.stringify(result.synthesis.coreThemes.map((candidate) => candidate.editorial)),
    /noon|midnight|12:00|00:00|house-derived-theme/u
  );
});

test('representative synthesis is deterministic and preserves the five-theme ceiling', () => {
  const first = synthesize(
    'body.mercury_x_sign.taurus',
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries',
    'body.moon_x_sign.taurus'
  );
  const second = synthesize(
    'body.mercury_x_sign.taurus',
    'body.moon_x_sign.aries',
    'body.mercury_x_sign.aries',
    'body.moon_x_sign.taurus'
  );
  assert.deepEqual(first, second);
  assert.ok(first.synthesis.coreThemes.length <= 5);
  assert.ok(first.synthesis.coreThemes.every((candidate) =>
    candidate.representativeSignalTraces.length === 1
  ));
});

test('the adapter cannot create fake Engine authority and remains outside production wiring', () => {
  const adapterSource = readFileSync(
    new URL('../src/features/interpretation/composition-signal-personal-synthesis-poc.ts', import.meta.url),
    'utf8'
  );
  const interpretationIndex = readFileSync(
    new URL('../src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );
  const result = synthesize('body.moon_x_sign.aries');

  assert.ok(result.synthesis.evaluatedSignals.every((signal) =>
    signal.provenance.sourceAuthority !== 'AUTHORITATIVE_ENGINE'
  ));
  assert.doesNotMatch(adapterSource, /sourceAuthority:\s*['"]AUTHORITATIVE_ENGINE['"]/u);
  assert.doesNotMatch(adapterSource, /COMPOSITION_SIGNAL_REPRESENTATIVE_V1\.json/u);
  assert.doesNotMatch(adapterSource, /fetch\(|axios|openai/iu);
  assert.doesNotMatch(interpretationIndex, /composition-signal-personal-synthesis-poc/u);
});
