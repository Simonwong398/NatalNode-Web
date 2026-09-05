import assert from 'node:assert/strict';
import test from 'node:test';

const poc = await import(
  new URL(
    '../dist/weekly-reading-model-characterization/features/interpretation/weekly-interpretation-poc.js',
    import.meta.url
  ).href
);
const editorial = await import(
  new URL(
    '../dist/weekly-reading-model-characterization/features/interpretation/weekly-editorial.js',
    import.meta.url
  ).href
);
const reading = await import(
  new URL(
    '../dist/weekly-reading-model-characterization/features/interpretation/weekly-reading-model.js',
    import.meta.url
  ).href
);

const {
  getWeeklyPocScenario
} = poc;
const { createWeeklyInterpretationDraft } = editorial;
const {
  assertWeeklyReadingModelInvariants,
  createWeeklyReadingModel
} = reading;

const scenarioIds = [
  'SCENARIO_A_SUPPORTIVE_COMMUNICATION',
  'SCENARIO_B_MIXED_RELATIONSHIP',
  'SCENARIO_C_ACTION_EMOTIONAL_TENSION',
  'SCENARIO_D_BACKGROUND_MOMENTARY',
  'SCENARIO_E_UNKNOWN_TIME'
];

function modelFor(scenarioId, style = 'CLEAR', locale = 'en') {
  return createWeeklyReadingModel(
    createWeeklyInterpretationDraft(
      getWeeklyPocScenario(scenarioId),
      style,
      locale
    )
  );
}

function semanticSignature(model) {
  return {
    schema: model.schemaVersion,
    authority: model.authority,
    birthTimeAuthority: model.birthTimeAuthority,
    hero: model.hero.traceability,
    themes: model.atAGlance.map((theme) => ({
      direction: theme.direction,
      intensity: theme.intensity,
      confidence: theme.confidence,
      traceability: theme.traceability
    })),
    domains: model.domains.map((domain) => ({
      id: domain.id,
      traceability: domain.traceability
    })),
    timeline: model.timeline?.entries.map((entry) => ({
      period: entry.period,
      sourceSignalIds: entry.traceability.sourceSignalIds,
      priority: entry.priority,
      category: entry.category,
      emphasis: entry.emphasis
    })) ?? null,
    watchOut: model.watchOut?.traceability ?? null,
    disclosures: model.disclosures.map((disclosure) => disclosure.kind),
    astrologerAvailable: model.astrologerView.available,
    decisions: model.traceability.decisions.map((item) => ({
      target: item.target,
      action: item.action,
      owner: item.owner,
      semanticKey: item.semanticKey,
      sourceEditorialBlockIds: item.sourceEditorialBlockIds,
      sourceSignalIds: item.sourceSignalIds
    }))
  };
}

function sourceSignalIds(model) {
  return model.atAGlance.flatMap((theme) => theme.traceability.sourceSignalIds);
}

test('all five development scenarios transform into an explicit development-only model', () => {
  for (const scenarioId of scenarioIds) {
    const model = modelFor(scenarioId);

    assert.equal(model.authority.status, 'DEVELOPMENT_ONLY');
    assert.equal(model.authority.productionEligible, false);
    assert.equal(model.schemaVersion.id, 'NATALNODE_WEEKLY_READING_MODEL_V1');
    assert.equal(model.transformationVersion.id, 'NATALNODE_WEEKLY_READING_TRANSFORMATION_V1');
    assert.equal(model.traceability.visibility, 'INTERNAL_ONLY');
    assert.equal('signals' in model, false);
    assert.equal(model.hero.text.length > 0, true);
    assert.equal(model.print.summary.source, 'HERO');
    assert.equal(model.share.site, 'natalnode.com');
  }
});

test('the pure transformation is deterministic for the same draft', () => {
  for (const scenarioId of scenarioIds) {
    const draft = createWeeklyInterpretationDraft(
      getWeeklyPocScenario(scenarioId),
      'CLEAR',
      'en'
    );

    assert.deepEqual(
      createWeeklyReadingModel(draft),
      createWeeklyReadingModel(draft)
    );
  }
});

test('locale changes copy and labels but not semantic selection or deduplication', () => {
  for (const scenarioId of scenarioIds) {
    const english = modelFor(scenarioId, 'CLEAR', 'en');
    const traditionalChinese = modelFor(scenarioId, 'CLEAR', 'zh-Hant');

    assert.deepEqual(semanticSignature(english), semanticSignature(traditionalChinese));
    assert.notEqual(english.period.label, traditionalChinese.period.label);
    assert.notEqual(english.hero.text, traditionalChinese.hero.text);
  }
});

test('scenario A keeps one communication hero, two useful themes, and two Timeline windows', () => {
  const model = modelFor('SCENARIO_A_SUPPORTIVE_COMMUNICATION');

  assert.equal(model.atAGlance.length, 2);
  assert.deepEqual(
    model.atAGlance.map((theme) => theme.label),
    ['Clear communication', 'Deliberate next step']
  );
  assert.deepEqual(
    sourceSignalIds(model),
    [
      'weekly-poc.SCENARIO_A_SUPPORTIVE_COMMUNICATION.communication',
      'weekly-poc.SCENARIO_A_SUPPORTIVE_COMMUNICATION.next-step'
    ]
  );
  assert.equal(model.domains.length, 0);
  assert.equal(model.timeline.entries.length, 2);
  assert.deepEqual(
    model.timeline.entries.map((entry) => entry.label),
    ['Mon–Thu', 'Fri–Sun']
  );
  assert.equal(model.timeline.entries.filter((entry) => entry.emphasis === 'BEST_WINDOW').length, 1);
  assert.equal(model.watchOut, null);
  assert.equal('bestWindow' in model, false);
  assert.equal(
    model.timeline.entries.every((entry) =>
      !entry.meaning.includes('The timeline marks this explicit window:')
    ),
    true
  );
  assert.equal(
    model.traceability.decisions.some((item) =>
      item.target === 'DOMAIN' &&
      item.action === 'MERGE' &&
      item.owner === 'AT_A_GLANCE'
    ),
    true
  );
});

test('scenario B keeps mixed relationship meaning and independently labeled overlapping windows', () => {
  const model = modelFor('SCENARIO_B_MIXED_RELATIONSHIP');

  assert.equal(model.atAGlance.length, 1);
  assert.equal(model.atAGlance[0].direction, 'MIXED');
  assert.equal(model.atAGlance[0].label, 'Mixed relationship');
  assert.equal(model.watchOut?.text, 'Pause before treating a difference in pace as proof of a difference in care.');
  assert.equal(model.timeline.entries.length, 2);
  assert.deepEqual(
    model.timeline.entries.map((entry) => entry.label),
    ['Mon–Wed', 'Wed–Sun']
  );
  assert.equal(
    new Set(model.timeline.entries.map((entry) => entry.traceability.sourceSignalIds[0])).size,
    2
  );
  assert.equal(
    model.timeline.entries.every((entry) => entry.category === 'CORE'),
    true
  );
  assert.equal(
    model.traceability.decisions.some((item) =>
      item.target === 'BEST_WINDOW' && item.action === 'DOWNGRADE'
    ),
    true
  );

  const astrologer = modelFor('SCENARIO_B_MIXED_RELATIONSHIP', 'ASTROLOGER');
  assert.equal(astrologer.astrologerView.available, true);
  assert.equal(astrologer.astrologerView.visibility, 'ADVANCED_ONLY');
  assert.equal(astrologer.astrologerView.traceability.sourceFactRefs.length > 0, true);
});

test('scenario C keeps action and emotional meanings, caution, and overlapping windows', () => {
  const model = modelFor('SCENARIO_C_ACTION_EMOTIONAL_TENSION');

  assert.equal(model.atAGlance.length, 2);
  assert.deepEqual(
    model.atAGlance.map((theme) => theme.label),
    ['Forward action', 'Reactive emotion']
  );
  assert.deepEqual(
    model.timeline.entries.map((entry) => entry.label),
    ['Mon–Wed', 'Wed–Sun']
  );
  assert.equal(model.timeline.entries.filter((entry) => entry.emphasis === 'BEST_WINDOW').length, 1);
  assert.equal(model.watchOut?.text, 'Pause before treating temporary frustration as a final answer.');
  assert.equal(model.domains.length, 0);
});

test('scenario D keeps the broad background theme dominant while preserving the shorter window', () => {
  const model = modelFor('SCENARIO_D_BACKGROUND_MOMENTARY');

  assert.equal(model.hero.traceability.sourceSignalIds[0].endsWith('.steady-progress'), true);
  assert.deepEqual(
    model.atAGlance.map((theme) => theme.label),
    ['Steady progress', 'Decision window']
  );
  assert.deepEqual(
    model.timeline.entries.map((entry) => entry.label),
    ['Mon–Sun', 'Fri–Sun']
  );
  assert.deepEqual(
    model.timeline.entries.map((entry) => entry.category),
    ['CORE', 'MOMENTARY']
  );
  assert.equal(model.timeline.entries[1].emphasis, 'BEST_WINDOW');
  assert.equal(model.watchOut, null);
});

test('scenario E omits timing, preserves placement value, and discloses unknown birth time humanely', () => {
  const model = modelFor('SCENARIO_E_UNKNOWN_TIME');

  assert.equal(model.birthTimeAuthority, 'UNKNOWN');
  assert.equal(model.timeline, null);
  assert.equal(model.atAGlance.length, 2);
  assert.equal(model.watchOut, null);
  assert.equal(model.astrologerView.available, false);
  assert.equal(model.disclosures.length, 1);
  assert.equal(model.disclosures[0].kind, 'UNKNOWN_BIRTH_TIME');
  assert.match(model.why.text, /Birth time is unknown/iu);
  assert.match(model.why.text, /Timeline/iu);
  assert.equal(
    model.traceability.decisions.some((item) =>
      item.target === 'TIMELINE' && item.action === 'OMIT'
    ),
    true
  );
  assert.equal(
    model.traceability.decisions.some((item) =>
      item.target === 'BEST_WINDOW' && item.action === 'OMIT'
    ),
    true
  );

  const astrologer = modelFor('SCENARIO_E_UNKNOWN_TIME', 'ASTROLOGER');
  assert.equal(astrologer.astrologerView.available, true);
  assert.equal(
    astrologer.astrologerView.traceability.sourceFactRefs.every((reference) =>
      reference.factKind === 'NATAL_BODY_POSITION'
    ),
    true
  );
  assert.doesNotMatch(astrologer.astrologerView.text, /\b(?:House\s+\d+|ASC|MC|Ascendant)\b/iu);
});

test('visibility and deduplication decisions keep internal detail out of normal reading blocks', () => {
  const models = [
    modelFor('SCENARIO_A_SUPPORTIVE_COMMUNICATION'),
    modelFor('SCENARIO_B_MIXED_RELATIONSHIP', 'ASTROLOGER'),
    modelFor('SCENARIO_E_UNKNOWN_TIME')
  ];

  for (const model of models) {
    assert.equal(model.hero.visibility, 'VISIBLE_DEFAULT');
    assert.equal(model.atAGlance.every((theme) => theme.visibility === 'VISIBLE_DEFAULT'), true);
    assert.equal(model.domains.every((domain) => domain.visibility === 'EXPANDABLE'), true);
    assert.equal(model.why.visibility, 'EXPANDABLE');
    assert.equal(model.astrologerView.visibility, 'ADVANCED_ONLY');
    assert.equal(model.traceability.decisions.every((item) => item.visibility === 'INTERNAL_ONLY'), true);
    assert.equal(
      model.traceability.decisions.some((item) => item.action === 'MERGE'),
      true
    );
    assert.equal(
      model.traceability.decisions.some((item) => item.action === 'DOWNGRADE'),
      true
    );

    const normalCopy = [
      model.hero.text,
      ...model.atAGlance.flatMap((theme) => [theme.label, theme.meaning]),
      ...model.domains.flatMap((domain) => [domain.label, domain.meaning]),
      ...(model.timeline?.entries.flatMap((entry) => [entry.label, entry.meaning]) ?? []),
      ...(model.watchOut === null ? [] : [model.watchOut.text]),
      model.why.text,
      ...(model.astrologerView.text === null ? [] : [model.astrologerView.text]),
      ...model.disclosures.map((disclosure) => disclosure.text)
    ].join('\n');
    assert.doesNotMatch(
      normalCopy,
      /(?:fixture:\/\/|weekly-poc\.|signal\.|rule\.|\/bodies\/|\/aspects\/|DEVELOPMENT_ONLY|DEVELOPMENT_FIXTURE|INCOMPLETE_RESEARCH)/iu
    );
  }
});

test('screen, print, and share are separate projections with no pixel or navigation state', () => {
  const model = modelFor('SCENARIO_A_SUPPORTIVE_COMMUNICATION');

  assert.deepEqual(
    model.screen.readingOrder,
    ['HERO', 'AT_A_GLANCE', 'TIMELINE', 'WHY', 'ACTIONS', 'SIGNATURE']
  );
  assert.equal('actions' in model.print, false);
  assert.equal(model.print.summary.source, 'HERO');
  assert.equal(model.print.hero, model.hero);
  assert.deepEqual(
    Object.keys(model.share).sort(),
    ['cta', 'hook', 'identity', 'insight', 'optionalSecondLine', 'site', 'visibility'].sort()
  );
  assert.equal(model.share.identity, 'NatalNode');
  assert.equal(model.share.site, 'natalnode.com');
  assert.equal(model.share.optionalSecondLine, null);
  assert.doesNotMatch(
    [model.share.hook, model.share.insight, model.share.cta].join('\n'),
    /(?:email|account|birth|user\s+id|password|token|fixture:\/\/|signal\.|rule\.)/iu
  );
  assert.deepEqual(
    model.actions.map((action) => [action.kind, action.status]),
    [
      ['SAVE', 'AVAILABLE'],
      ['SHARE', 'AVAILABLE'],
      ['PRINT', 'AVAILABLE'],
      ['COLLECT', 'FUTURE']
    ]
  );
});

test('all explicit decision actions are represented across the five development examples', () => {
  const decisions = [
    ...modelFor('SCENARIO_A_SUPPORTIVE_COMMUNICATION').traceability.decisions,
    ...modelFor('SCENARIO_B_MIXED_RELATIONSHIP', 'ASTROLOGER').traceability.decisions,
    ...modelFor('SCENARIO_E_UNKNOWN_TIME').traceability.decisions
  ];
  const actions = new Set(decisions.map((item) => item.action));

  for (const action of ['KEEP', 'MERGE', 'DOWNGRADE', 'OMIT', 'ADVANCED_ONLY']) {
    assert.equal(actions.has(action), true);
  }
});

test('exported invariant assertion is fail-fast and returns the validated model', () => {
  const model = modelFor('SCENARIO_D_BACKGROUND_MOMENTARY');
  assert.equal(assertWeeklyReadingModelInvariants(model), model);
});
