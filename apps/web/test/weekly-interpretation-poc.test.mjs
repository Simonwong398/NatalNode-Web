import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const poc = await import(
  new URL(
    '../dist/weekly-poc-characterization/features/interpretation/weekly-interpretation-poc.js',
    import.meta.url
  ).href
);
const editorial = await import(
  new URL(
    '../dist/weekly-poc-characterization/features/interpretation/weekly-editorial.js',
    import.meta.url
  ).href
);
const lint = await import(
  new URL(
    '../dist/weekly-poc-characterization/features/interpretation/weekly-editorial-lint.js',
    import.meta.url
  ).href
);

const {
  createWeeklyPocScenarios,
  getWeeklyPocScenario,
  groupWeeklySignalsByTheme,
  WEEKLY_POC_SCENARIOS
} = poc;
const {
  createWeeklyInterpretationDraft,
  renderWeeklyPocScenario
} = editorial;
const { assertWeeklyEditorialQuality } = lint;

const scenarioIds = [
  'SCENARIO_A_SUPPORTIVE_COMMUNICATION',
  'SCENARIO_B_MIXED_RELATIONSHIP',
  'SCENARIO_C_ACTION_EMOTIONAL_TENSION',
  'SCENARIO_D_BACKGROUND_MOMENTARY',
  'SCENARIO_E_UNKNOWN_TIME'
];
const styles = ['CLEAR', 'CASUAL', 'ASTROLOGER', 'SHARE'];

function sourceIds(draft) {
  return draft.coreThemes.flatMap((theme) => theme.sourceSignalIds);
}

test('the POC has five small curated development-only scenarios', () => {
  assert.deepEqual(createWeeklyPocScenarios().map((scenario) => scenario.scenarioId), scenarioIds);
  assert.equal(WEEKLY_POC_SCENARIOS.length, 5);

  for (const scenario of WEEKLY_POC_SCENARIOS) {
    assert.equal(scenario.sourceAuthority, 'DEVELOPMENT_FIXTURE');
    assert.equal(scenario.signalSet.signals.every((signal) => signal.authority === 'DEVELOPMENT_ONLY'), true);
    assert.equal(scenario.signalSet.signals.every((signal) =>
      signal.provenance.sourceAuthority === 'DEVELOPMENT_FIXTURE'
    ), true);
  }
});

test('scenario semantics exercise communication, mixed relationship, tension, lifecycle, and unknown time', () => {
  const scenarioA = getWeeklyPocScenario('SCENARIO_A_SUPPORTIVE_COMMUNICATION');
  assert.equal(scenarioA.signalSet.signals.some((signal) =>
    signal.domain === 'COMMUNICATION' && signal.direction === 'SUPPORTIVE' && signal.intensity === 'STRONG'
  ), true);
  assert.equal(scenarioA.signalSet.signals.some((signal) => signal.domain === 'ACTION_DECISION'), true);

  const scenarioB = getWeeklyPocScenario('SCENARIO_B_MIXED_RELATIONSHIP');
  const relationshipGroup = groupWeeklySignalsByTheme(scenarioB.signalSet.signals).find(
    (group) => group.theme === 'relationship-pace'
  );
  assert.equal(relationshipGroup.composition.direction, 'MIXED');
  assert.equal(relationshipGroup.composition.supportiveSignalIds.length, 1);
  assert.equal(relationshipGroup.composition.challengingSignalIds.length, 1);

  const scenarioC = getWeeklyPocScenario('SCENARIO_C_ACTION_EMOTIONAL_TENSION');
  assert.equal(scenarioC.signalSet.signals.some((signal) =>
    signal.domain === 'ACTION_DECISION' && signal.direction === 'SUPPORTIVE'
  ), true);
  assert.equal(scenarioC.signalSet.signals.some((signal) =>
    signal.domain === 'EMOTIONAL' && signal.direction === 'CHALLENGING'
  ), true);

  const scenarioD = getWeeklyPocScenario('SCENARIO_D_BACKGROUND_MOMENTARY');
  assert.equal(scenarioD.signalSet.signals.some((signal) => signal.priority === 'THEMATIC'), true);
  assert.equal(scenarioD.signalSet.signals.some((signal) => signal.priority === 'MOMENTARY'), true);

  const scenarioE = getWeeklyPocScenario('SCENARIO_E_UNKNOWN_TIME');
  assert.equal(scenarioE.birthTimeAuthority, 'UNKNOWN');
  assert.equal(scenarioE.signalSet.signals.every((signal) =>
    signal.provenance.sourceFactRefs.every((reference) => reference.factKind === 'NATAL_BODY_POSITION')
  ), true);
});

test('the same signal set deterministically produces the same four editorial styles', () => {
  for (const scenarioId of scenarioIds) {
    const scenario = getWeeklyPocScenario(scenarioId);
    const first = renderWeeklyPocScenario(scenario, 'en');
    const second = renderWeeklyPocScenario(scenario, 'en');

    assert.deepEqual(first, second);
    assert.deepEqual(first.map((draft) => draft.style), styles);
    assert.equal(new Set(first.map((draft) => draft.hero.theme)).size, 1);
    assert.equal(new Set(first.map((draft) => draft.hero.sourceSignalIds.join('|'))).size, 1);
    assert.equal(first.every((draft) => draft.authority === 'DEVELOPMENT_ONLY'), true);
  }
});

test('editorial styles preserve the same semantic themes and locale does not change authority', () => {
  for (const scenario of createWeeklyPocScenarios()) {
    const english = renderWeeklyPocScenario(scenario, 'en');
    const traditionalChinese = renderWeeklyPocScenario(scenario, 'zh-Hant');

    assert.deepEqual(
      english.map((draft) => draft.coreThemes.map((theme) => [theme.theme, theme.direction])),
      traditionalChinese.map((draft) => draft.coreThemes.map((theme) => [theme.theme, theme.direction]))
    );
    assert.equal(traditionalChinese.every((draft) => draft.authority === 'DEVELOPMENT_ONLY'), true);
    assert.equal(traditionalChinese.every((draft) => draft.locale === 'zh-Hant'), true);
    assert.notEqual(english[0].hero.text, traditionalChinese[0].hero.text);
  }
});

test('hero selection uses the strongest meaningful composed theme and separates momentary timing', () => {
  const scenarioC = getWeeklyPocScenario('SCENARIO_C_ACTION_EMOTIONAL_TENSION');
  const scenarioCDraft = createWeeklyInterpretationDraft(scenarioC, 'CLEAR');
  assert.equal(scenarioCDraft.hero.theme, 'forward-action');
  assert.equal(scenarioCDraft.hero.sourceSignalIds.length, 1);

  const scenarioD = getWeeklyPocScenario('SCENARIO_D_BACKGROUND_MOMENTARY');
  const scenarioDDraft = createWeeklyInterpretationDraft(scenarioD, 'CLEAR');
  assert.equal(scenarioDDraft.hero.theme, 'steady-progress');
  assert.equal(scenarioDDraft.bestWindow.theme, 'decision-window');
  assert.equal(scenarioDDraft.timeline.length, 2);
  assert.deepEqual(scenarioDDraft.timeline.map((entry) => entry.label), ['Fri–Sun', 'Mon–Sun']);
});

test('mixed relationship content acknowledges both evidence directions and traces the watch-out', () => {
  const scenario = getWeeklyPocScenario('SCENARIO_B_MIXED_RELATIONSHIP');
  const draft = createWeeklyInterpretationDraft(scenario, 'CLEAR');

  assert.equal(draft.coreThemes[0].direction, 'MIXED');
  assert.equal(draft.coreThemes[0].sourceSignalIds.length, 2);
  assert.notEqual(draft.watchOut, null);
  assert.deepEqual(draft.watchOut.sourceSignalIds, draft.coreThemes[0].sourceSignalIds);
  assert.doesNotMatch(draft.coreThemes[0].content.text, /relationships are mixed/iu);
  assert.match(draft.coreThemes[0].content.text, /warmth|friction/iu);
});

test('unknown birth time omits timing, house, and angle interpretation while retaining useful content', () => {
  const scenario = getWeeklyPocScenario('SCENARIO_E_UNKNOWN_TIME');
  const drafts = renderWeeklyPocScenario(scenario, 'en');

  for (const draft of drafts) {
    assert.equal(draft.timeline.length, 0);
    assert.equal(draft.bestWindow, null);
    assert.equal(draft.signals.every((signal) => signal.provenance.sourceFactRefs.every((reference) =>
      reference.factKind !== 'NATAL_HOUSE_PLACEMENT' && reference.factKind !== 'NATAL_ANGLE_POSITION'
    )), true);
    assert.equal(draft.coreThemes.length > 0, true);
    assert.doesNotMatch(draft.hero.text, /\b(?:House\s+\d+|ASC|MC|Ascendant)\b/iu);
  }
});

test('every rendered content style passes traceability, fixture, privacy, and editorial quality gates', () => {
  for (const scenario of createWeeklyPocScenarios()) {
    for (const draft of renderWeeklyPocScenario(scenario, 'en')) {
      assert.doesNotThrow(() => assertWeeklyEditorialQuality(draft));
      assert.equal(draft.traceability.length > 0, true);
      assert.equal(draft.traceability.every((block) =>
        block.sourceSignalIds.length > 0 && block.sourceFactRefs.length > 0 &&
        block.fixtureAuthority === 'DEVELOPMENT_ONLY'
      ), true);
      assert.equal(draft.traceability.every((block) =>
        block.contentStyle === draft.style && block.templateVersion === 'NATALNODE_WEEKLY_EDITORIAL_V1@1.0.0'
      ), true);
      assert.equal(sourceIds(draft).every((signalId) => draft.signals.some((signal) =>
        signal.signalId === signalId
      )), true);
    }
  }
});

test('share projection is compact and privacy-safe', () => {
  for (const scenario of createWeeklyPocScenarios()) {
    const draft = createWeeklyInterpretationDraft(scenario, 'SHARE', 'en');
    const share = draft.shareProjection;
    const shareText = [share.hook.text, share.insight.text, share.cta.text].join('\n');

    assert.equal(shareText.length <= 320, true);
    assert.equal(share.cta.text, 'natalnode.com');
    assert.doesNotMatch(shareText, /email|account|birth|user\s+id|password|token|fixture:\/\//iu);
    assert.equal(share.hook.sourceSignalIds.length > 0, true);
    assert.equal(share.insight.sourceFactRefs.length > 0, true);
  }
});

test('weekly POC keeps the legacy interpretation authority isolated', () => {
  const legacySource = readFileSync(new URL('../src/features/interpretation/deterministic-interpretation.ts', import.meta.url), 'utf8');
  const weeklySources = [
    'src/features/interpretation/weekly-interpretation-poc.ts',
    'src/features/interpretation/weekly-editorial.ts',
    'src/features/interpretation/weekly-editorial-lint.ts'
  ].map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).join('\n');

  assert.match(legacySource, /export function createDeterministicInterpretation/u);
  assert.doesNotMatch(weeklySources, /createDeterministicInterpretation|InterpretationPanel|ChartResult/u);
  assert.doesNotMatch(weeklySources, /fetch\(|axios|HttpEngineClient|@natalnode\/engine-client|\/api\//u);
  assert.doesNotMatch(weeklySources, /Math\.(?:sin|cos|tan)|ephemeris|astronomy/iu);
  assert.doesNotMatch(weeklySources, /src\/pages\//u);
  assert.doesNotMatch(weeklySources, /from\s+['"][^'"]+\.astro['"]/u);
});
