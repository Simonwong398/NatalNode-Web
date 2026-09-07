import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const {
  projectMyChartPersonalContent
} = await import(
  new URL('../dist/my-chart-contextual-learn-characterization/features/my-chart/my-chart-personal-content-poc.js', import.meta.url)
);
const {
  synthesizeCompositionSignalResearchInputs
} = await import(
  new URL('../dist/my-chart-contextual-learn-characterization/features/interpretation/composition-signal-personal-synthesis-poc.js', import.meta.url)
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

function project(scenario) {
  return projectMyChartPersonalContent(scenario, artifact.rules);
}

function themeBySignalId(projection, signalId) {
  return projection.reading.themes.find((theme) =>
    theme.technical.signalIds.includes(signalId)
  );
}

const readerProjection = (projection) => projection.reading.themes.map((theme) => ({
  title: theme.title,
  domain: theme.domain,
  directionLabel: theme.directionLabel,
  recognition: theme.recognition,
  strength: theme.strength,
  pattern: theme.pattern,
  tension: theme.tension,
  lever: theme.lever,
  evidence: theme.evidence,
  why: theme.why
}));

test('known-time page consumes two synthesized representative Signals and PersonalThemes', () => {
  const projection = project('known-time');

  assert.equal(projection.authority, 'DEVELOPMENT_ONLY');
  assert.equal(projection.fixture.scenarioId, 'MY_CHART_SIGNAL_BACKED_KNOWN_TIME_RESEARCH_PREVIEW');
  assert.equal(projection.developmentDisclosure.evidence, 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY');
  assert.equal(projection.reading.themes.length, 2);
  assert.equal(projection.technical.evaluatedSignalCount, 2);
  assert.equal(projection.technical.coherenceStatus, 'COHERENT');
  assert.equal(projection.technical.sourceType, 'RESEARCH_REPRESENTATIVE_SIGNAL');
  assert.equal(projection.technical.sourceAuthority, 'INCOMPLETE_RESEARCH');
  assert.equal(projection.technical.synthesisAuthority, 'DEVELOPMENT_ONLY');
  assert.deepEqual(
    projection.reading.themes.flatMap((theme) => theme.evidence.map((evidence) => evidence.label)).sort(),
    ['Mercury in Taurus', 'Moon in Aries']
  );
  assert.ok(themeBySignalId(projection, 'signal.composition.body.moon_x_sign.aries'));
  assert.ok(themeBySignalId(projection, 'signal.composition.body.mercury_x_sign.taurus'));
});

test('the page does not bypass synthesis with manually duplicated fake themes', () => {
  const projectionSource = readFileSync(
    new URL('../src/features/my-chart/my-chart-personal-content-poc.ts', import.meta.url),
    'utf8'
  );

  assert.match(projectionSource, /synthesizeCompositionSignalResearchInputs/u);
  assert.match(projectionSource, /result\.synthesis\.coreThemes\.map/u);
  assert.doesNotMatch(projectionSource, /synthesizePersonalThemes\(/u);
  assert.doesNotMatch(projectionSource, /AUTHORITATIVE_ENGINE/u);
  assert.ok(project('known-time').reading.themes.every((theme) => theme.technical.signalIds.length === 1));
});

test('surviving Signals remain differentiated, one theme each, without fake convergence', () => {
  const projection = project('known-time');

  assert.deepEqual(
    projection.reading.themes.map((theme) => theme.domain).sort(),
    ['Communication', 'Emotional patterns']
  );
  for (const theme of projection.reading.themes) {
    assert.equal(theme.evidence.length, 1);
    assert.match(theme.technical.convergence, /one admitted Body × Sign placement/u);
    assert.equal(theme.technical.direction, 'NEUTRAL');
    assert.equal(theme.technical.intensity, 'SUBTLE');
    assert.equal(theme.technical.confidence, 'LOW');
  }
});

test('reader prose remains restrained while the internal Signal bounds survive', () => {
  const projection = project('known-time');
  const readerText = JSON.stringify(readerProjection(projection));

  assert.doesNotMatch(readerText, /AUTHORITATIVE_ENGINE|INCOMPLETE_RESEARCH|DEVELOPMENT_ONLY/iu);
  assert.doesNotMatch(readerText, /\bLOW\b|\bSUBTLE\b|confidence|dominant|guarantee|certain|diagnos/iu);
  assert.doesNotMatch(readerText, /major life theme|objective truth|fixed personality/iu);
  assert.match(readerText, /pattern worth noticing/u);
});

test('WHY preserves body, sign, and integrated composition semantics', () => {
  const projection = project('known-time');

  for (const theme of projection.reading.themes) {
    const evidence = theme.evidence[0];
    assert.ok(evidence);
    assert.ok(theme.why.factors.some((factor) => factor.label === evidence.label.split(' in ')[0]));
    assert.ok(theme.why.factors.some((factor) => factor.label === evidence.label.split(' in ')[1]));
    assert.match(theme.why.synthesis, /Together, this composition/iu);
    assert.match(theme.why.synthesis, /may be explored through/iu);
    assert.match(theme.why.synthesis, /possible trade-off/iu);
  }
});

test('technical provenance is available under collapsed inspection, not in primary order', () => {
  const componentSource = readFileSync(
    new URL('../src/features/my-chart/MyChartContextualLearnStageA.tsx', import.meta.url),
    'utf8'
  );
  const projection = project('known-time');

  assert.match(componentSource, /details className="my-chart-contextual-learn__technical"/u);
  assert.match(componentSource, /data-theme-technical/u);
  assert.match(componentSource, /Representative Signal IDs/u);
  assert.match(componentSource, /Intensity \/ confidence/u);
  assert.ok(projection.reading.themes.every((theme) => theme.technical.signalIds.length > 0));
  assert.ok(projection.reading.themes.every((theme) => theme.technical.sourceFactRefs.every((path) => path.startsWith('/research/composition-signals/'))));
});

test('Learn bridges preserve relevant body/sign destinations and deduplicate lesson destinations', () => {
  for (const projection of [project('known-time'), project('unknown-time')]) {
    for (const theme of projection.reading.themes) {
      const labels = theme.learn.map((bridge) => bridge.label);
      assert.ok(labels.some((label) => /Moon|Mercury/u.test(label)));
      assert.ok(labels.some((label) => /Aries|Taurus/u.test(label)));
      assert.equal(
        new Set(theme.learn.map((bridge) => bridge.lessonId ?? bridge.objectId)).size,
        theme.learn.length
      );
      assert.ok(theme.learn.every((bridge) => bridge.contentAvailability === 'AVAILABLE'));
    }
  }
});

test('unknown-time scenario remains useful without ASC, MC, houses, or fabricated time', () => {
  const projection = project('unknown-time');
  const readerText = JSON.stringify(readerProjection(projection));

  assert.equal(projection.fixture.birthTimeAuthority, 'UNKNOWN');
  assert.equal(projection.unknownTime.presentationStatus, 'UNKNOWN_TIME_READING');
  assert.match(projection.unknownTime.message, /time-sensitive chart layers are unavailable/u);
  assert.deepEqual(
    projection.reading.themes.flatMap((theme) => theme.evidence.map((evidence) => evidence.label)).sort(),
    ['Mercury in Aries', 'Moon in Taurus']
  );
  assert.ok(projection.reading.themes.every((theme) => theme.technical.birthTimeEligibility.every((status) => status === 'UNKNOWN_TIME_SAFE')));
  assert.ok(projection.unknownTime.omittedLayers.includes('houses'));
  assert.doesNotMatch(readerText, /ASC|MC|house|noon|midnight|12:00|fabricated-time/iu);
});

test('same-body conflicting placements remain rejected and never become page themes', () => {
  const conflict = synthesizeCompositionSignalResearchInputs(rules(
    'body.moon_x_sign.aries',
    'body.moon_x_sign.taurus'
  ));

  assert.equal(conflict.coherence.status, 'INVALID');
  assert.equal(conflict.coherence.failures[0]?.code, 'CONFLICTING_BODY_SIGN_PLACEMENT');
  assert.equal(conflict.suppressedSignals.length, 0);
  assert.equal(conflict.synthesis.coreThemes.length, 0);
});

test('repeated projection is deterministic and the route remains dev-only', () => {
  const first = project('known-time');
  const second = project('known-time');
  assert.deepEqual(first, second);

  const routeSource = readFileSync(
    new URL('../src/pages/dev/my-chart-contextual-learn.astro', import.meta.url),
    'utf8'
  );
  const projectionSource = readFileSync(
    new URL('../src/features/my-chart/my-chart-personal-content-poc.ts', import.meta.url),
    'utf8'
  );
  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /robots: 'noindex,nofollow'/u);
  assert.match(routeSource, /COMPOSITION_SIGNAL_REPRESENTATIVE_V1\.json/u);
  assert.match(routeSource, /representativeSignalRules/u);
  assert.doesNotMatch(routeSource, /HttpEngineClient|ENGINE_API_URL|Provider|fetch\(/iu);
  assert.doesNotMatch(projectionSource, /HttpEngineClient|fetch\(|axios|openai|llm|AUTHORITATIVE_ENGINE/iu);
});

test('component preserves the human-first progressive disclosure baseline', () => {
  const componentSource = readFileSync(
    new URL('../src/features/my-chart/MyChartContextualLearnStageA.tsx', import.meta.url),
    'utf8'
  );
  const styleSource = readFileSync(
    new URL('../src/styles/my-chart-contextual-learn.css', import.meta.url),
    'utf8'
  );

  assert.match(componentSource, /projection\.reading\.themes\.map/u);
  assert.match(componentSource, /Recognition/u);
  assert.match(componentSource, /Strength/u);
  assert.match(componentSource, /Pattern/u);
  assert.match(componentSource, /Tension/u);
  assert.match(componentSource, /Lever/u);
  assert.match(componentSource, /Why this shows up/u);
  assert.match(componentSource, /Learn next/u);
  assert.match(componentSource, /Astrologer's view/u);
  assert.doesNotMatch(componentSource, /Math\.random|Date\.now|fetch\(|axios|openai|llm/iu);
  assert.match(styleSource, /focus-visible/u);
  assert.match(styleSource, /prefers-reduced-motion/u);
  assert.match(styleSource, /theme-details/u);
  assert.match(styleSource, /theme-learn/u);
  assert.doesNotMatch(styleSource, /overflow-x\s*:\s*(?:auto|scroll)/u);
});
