import assert from 'node:assert/strict';
import test from 'node:test';

const poc = await import(
  new URL(
    '../dist/weekly-editorial-lint-characterization/features/interpretation/weekly-interpretation-poc.js',
    import.meta.url
  ).href
);
const editorial = await import(
  new URL(
    '../dist/weekly-editorial-lint-characterization/features/interpretation/weekly-editorial.js',
    import.meta.url
  ).href
);
const lint = await import(
  new URL(
    '../dist/weekly-editorial-lint-characterization/features/interpretation/weekly-editorial-lint.js',
    import.meta.url
  ).href
);

const { getWeeklyPocScenario } = poc;
const { createWeeklyInterpretationDraft } = editorial;
const { assertWeeklyEditorialQuality, lintWeeklyInterpretationDraft } = lint;

function clearDraft() {
  return createWeeklyInterpretationDraft(
    getWeeklyPocScenario('SCENARIO_A_SUPPORTIVE_COMMUNICATION'),
    'CLEAR'
  );
}

function issueCodes(draft) {
  return new Set(lintWeeklyInterpretationDraft(draft).map((issue) => issue.code));
}

test('valid POC drafts pass the light editorial lint', () => {
  for (const scenarioId of [
    'SCENARIO_A_SUPPORTIVE_COMMUNICATION',
    'SCENARIO_B_MIXED_RELATIONSHIP',
    'SCENARIO_C_ACTION_EMOTIONAL_TENSION',
    'SCENARIO_D_BACKGROUND_MOMENTARY',
    'SCENARIO_E_UNKNOWN_TIME'
  ]) {
    for (const style of ['CLEAR', 'CASUAL', 'ASTROLOGER', 'SHARE']) {
      const draft = createWeeklyInterpretationDraft(getWeeklyPocScenario(scenarioId), style);
      assert.deepEqual(lintWeeklyInterpretationDraft(draft), []);
      assert.doesNotThrow(() => assertWeeklyEditorialQuality(draft));
    }
  }
});

test('lint catches certainty language, technical ID leakage, duplicate text, and missing traceability', () => {
  const draft = clearDraft();
  const bad = {
    ...draft,
    hero: { ...draft.hero, text: 'You will meet someone.' },
    signatureLine: { ...draft.signatureLine, text: 'signal.weekly-poc.fake' },
    traceability: draft.traceability.filter((block) => block.contentBlockId !== draft.hero.contentBlockId),
    coreThemes: draft.coreThemes.map((theme, index) => index === 1
      ? { ...theme, content: { ...theme.content, text: draft.coreThemes[0].content.text } }
      : theme)
  };
  const codes = issueCodes(bad);

  assert.equal(codes.has('PROHIBITED_CERTAINTY'), true);
  assert.equal(codes.has('TECHNICAL_ID_LEAK'), true);
  assert.equal(codes.has('DUPLICATE_PARAGRAPH'), true);
  assert.equal(codes.has('REPEATED_CORE_THEME_TEXT'), true);
  assert.equal(codes.has('MISSING_TRACEABILITY'), true);
});

test('lint catches unsupported best windows and overlong share projections', () => {
  const unknownTime = createWeeklyInterpretationDraft(
    getWeeklyPocScenario('SCENARIO_E_UNKNOWN_TIME'),
    'CLEAR'
  );
  const unsupportedWindow = {
    ...unknownTime,
    bestWindow: { ...unknownTime.hero, role: 'best-window' }
  };
  assert.equal(issueCodes(unsupportedWindow).has('UNSUPPORTED_BEST_WINDOW'), true);

  const share = createWeeklyInterpretationDraft(
    getWeeklyPocScenario('SCENARIO_A_SUPPORTIVE_COMMUNICATION'),
    'SHARE'
  );
  const tooLong = {
    ...share,
    shareProjection: {
      ...share.shareProjection,
      insight: { ...share.shareProjection.insight, text: 'x'.repeat(321) }
    }
  };
  assert.equal(issueCodes(tooLong).has('SHARE_TOO_LONG'), true);
});
