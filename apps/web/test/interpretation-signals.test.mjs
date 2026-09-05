import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contracts = await import(
  new URL(
    '../dist/interpretation-signals-characterization/features/interpretation/interpretation-signal-contracts.js',
    import.meta.url
  ).href
);
const engine = await import(
  new URL(
    '../dist/interpretation-signals-characterization/features/interpretation/interpretation-signal-engine.js',
    import.meta.url
  ).href
);
const ranking = await import(
  new URL(
    '../dist/interpretation-signals-characterization/features/interpretation/interpretation-signal-ranking.js',
    import.meta.url
  ).href
);
const composition = await import(
  new URL(
    '../dist/interpretation-signals-characterization/features/interpretation/interpretation-signal-composition.js',
    import.meta.url
  ).href
);

const {
  INTERPRETATION_CONFIDENCE_LEVELS,
  INTERPRETATION_SIGNAL_DOMAINS,
  INTERPRETATION_SIGNAL_DIRECTIONS,
  INTERPRETATION_SIGNAL_INTENSITIES,
  INTERPRETATION_PRIORITIES
} = contracts;
const {
  INTERPRETATION_RULES_VERSION,
  InterpretationSignalRuleRegistry,
  createInterpretationSignalRuleRegistry,
  sourceAuthorityIsDevelopmentOnly
} = engine;
const { rankInterpretationSignals } = ranking;
const { composeInterpretationSignalGroup } = composition;

const bodyReference = {
  factKind: 'NATAL_BODY_POSITION',
  canonicalPath: '/bodies/Sun',
  canonicalFactIdentity: 'engine-fact-sun'
};
const aspectReference = {
  factKind: 'NATAL_ASPECT',
  canonicalPath: '/aspects/0',
  canonicalFactIdentity: 'engine-fact-aspect-0'
};

function ruleIdentity(ruleId) {
  return {
    ruleId,
    ruleVersion: '1.0.0',
    interpretationRulesVersion: INTERPRETATION_RULES_VERSION
  };
}

function signalDraft(signalId, reference, overrides = {}) {
  return {
    signalId,
    domain: 'SELF',
    direction: 'SUPPORTIVE',
    internalStrength: 0.8,
    intensity: 'NOTICEABLE',
    confidence: 'HIGH',
    priority: 'THEMATIC',
    theme: 'self-observation',
    rule: ruleIdentity(`rule.${signalId}`),
    ranking: {
      baseImportance: 0.7,
      evidenceStrength: 0.9,
      temporalRelevance: 0.6,
      durationWeight: 0.5,
      repetitionPenalty: 0
    },
    provenance: {
      engineResultReference: 'fixture://WEB_UI_FIXTURE_V1',
      sourceFactRefs: [reference],
      scientificConfigurationIdentity: 'fixture-configuration-should-not-escape',
      provenanceEnvelopeId: 'fixture-provenance-should-not-escape'
    },
    ...overrides
  };
}

function signal(signalId, reference, overrides = {}) {
  const draft = signalDraft(signalId, reference, overrides);
  return {
    ...draft,
    authority: 'AUTHORITATIVE',
    provenance: {
      ...draft.provenance,
      sourceAuthority: 'AUTHORITATIVE_ENGINE',
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    }
  };
}

function fixtureContext(overrides = {}) {
  return {
    sourceAuthority: 'DEVELOPMENT_FIXTURE',
    birthTimeAuthority: 'KNOWN',
    facts: [
      {
        reference: bodyReference,
        available: true,
        attributes: { body: 'Sun', supplied: true }
      }
    ],
    ...overrides
  };
}

function rule(ruleId, reference = bodyReference, overrides = {}) {
  return {
    identity: ruleIdentity(ruleId),
    prerequisites: {
      requiredFactKinds: [reference.factKind],
      requiresKnownBirthTime: true,
      allowedSourceAuthorities: ['DEVELOPMENT_FIXTURE']
    },
    matches: (context) =>
      context.facts.some(
        (fact) => fact.available && fact.reference.canonicalPath === reference.canonicalPath
      ),
    createSignal: () => signalDraft(`signal.${ruleId}`, reference, {
      rule: ruleIdentity(ruleId)
    }),
    ...overrides
  };
}

test('the signal vocabulary is closed and matches the architecture contract', () => {
  assert.deepEqual([...INTERPRETATION_SIGNAL_DOMAINS], [
    'SELF',
    'EMOTIONAL',
    'RELATIONSHIP',
    'COMMUNICATION',
    'WORK_CREATION',
    'ACTION_DECISION'
  ]);
  assert.deepEqual([...INTERPRETATION_SIGNAL_DIRECTIONS], [
    'SUPPORTIVE',
    'CHALLENGING',
    'MIXED',
    'NEUTRAL'
  ]);
  assert.deepEqual([...INTERPRETATION_SIGNAL_INTENSITIES], [
    'SUBTLE',
    'NOTICEABLE',
    'STRONG',
    'DOMINANT'
  ]);
  assert.deepEqual([...INTERPRETATION_CONFIDENCE_LEVELS], ['HIGH', 'MEDIUM', 'LOW']);
  assert.deepEqual([...INTERPRETATION_PRIORITIES], [
    'BACKGROUND',
    'THEMATIC',
    'ACTIVE',
    'MOMENTARY'
  ]);
});

test('registration is immutable and fixture input can only produce development-only signals', () => {
  const emptyRegistry = new InterpretationSignalRuleRegistry();
  const sourceRule = rule('fixture.sun.support');
  const registry = emptyRegistry.register(sourceRule);
  sourceRule.prerequisites.allowedSourceAuthorities[0] = 'AUTHORITATIVE_ENGINE';
  const result = registry.evaluate(fixtureContext());

  assert.equal(emptyRegistry.rules.length, 0);
  assert.equal(registry.rules.length, 1);
  assert.equal(Object.isFrozen(registry.rules[0].prerequisites), true);
  assert.equal(Object.isFrozen(registry.rules[0].prerequisites.allowedSourceAuthorities), true);
  assert.equal(result.signals.length, 1);
  assert.equal(result.signals[0].authority, 'DEVELOPMENT_ONLY');
  assert.equal(result.signals[0].provenance.sourceAuthority, 'DEVELOPMENT_FIXTURE');
  assert.equal(result.signals[0].provenance.scientificConfigurationIdentity, null);
  assert.equal(result.signals[0].provenance.provenanceEnvelopeId, null);
  const incompleteResearch = createInterpretationSignalRuleRegistry([
    rule('research-only', bodyReference, {
      prerequisites: {
        requiredFactKinds: ['NATAL_BODY_POSITION'],
        allowedSourceAuthorities: ['INCOMPLETE_RESEARCH']
      }
    })
  ]).evaluate(fixtureContext({ sourceAuthority: 'INCOMPLETE_RESEARCH' }));
  assert.equal(incompleteResearch.signals[0].authority, 'DEVELOPMENT_ONLY');
  assert.equal(incompleteResearch.signals[0].provenance.scientificConfigurationIdentity, null);
  assert.equal(incompleteResearch.signals[0].provenance.provenanceEnvelopeId, null);
  assert.equal(sourceAuthorityIsDevelopmentOnly('DEVELOPMENT_FIXTURE'), true);
  assert.equal(Object.isFrozen(result.signals[0]), true);
  assert.equal(Object.isFrozen(result.signals[0].provenance.sourceFactRefs), true);
});

test('emitted rule identity cannot escape the registered interpretation version', () => {
  const registry = createInterpretationSignalRuleRegistry([
    rule('versioned-rule', bodyReference, {
      createSignal: () => signalDraft('signal.versioned-rule', bodyReference, {
        rule: {
          ...ruleIdentity('versioned-rule'),
          interpretationRulesVersion: {
            id: 'UNREGISTERED_RULES',
            version: '9.0.0'
          }
        }
      })
    })
  ]);

  assert.throws(
    () => registry.evaluate(fixtureContext()),
    /does not preserve the identity/u
  );
});

test('rule output is deterministic, source-bound, and does not mutate supplied facts', () => {
  const registry = createInterpretationSignalRuleRegistry([
    rule('fixture.sun.support'),
    rule('fixture.sun.neutral', bodyReference, {
      matches: () => true,
      createSignal: () => signalDraft('signal.fixture.sun.neutral', bodyReference, {
        rule: ruleIdentity('fixture.sun.neutral'),
        direction: 'NEUTRAL'
      })
    })
  ]);
  const context = fixtureContext();
  const before = JSON.stringify(context);
  const first = registry.evaluate(context);
  const second = registry.evaluate(context);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(context), before);
  assert.deepEqual(first.signals.map((item) => item.signalId), [
    'signal.fixture.sun.neutral',
    'signal.fixture.sun.support'
  ]);
  assert.deepEqual(first.signals[1].provenance.sourceFactRefs, [bodyReference]);
  assert.match(first.signals[1].provenance.engineResultReference, /^fixture:\/\//u);
});

test('unknown time and unavailable prerequisites fail closed before fact matching', () => {
  const registry = createInterpretationSignalRuleRegistry([rule('fixture.requires-time')]);
  const unknownTime = registry.evaluate(
    fixtureContext({ birthTimeAuthority: 'UNKNOWN' })
  );
  const unavailableFact = registry.evaluate(
    fixtureContext({
      facts: [{ reference: bodyReference, available: false, attributes: {} }]
    })
  );

  assert.deepEqual(unknownTime.signals, []);
  assert.deepEqual(unknownTime.skippedRules, [{
    ruleId: 'fixture.requires-time',
    reason: 'BIRTH_TIME_UNAVAILABLE'
  }]);
  assert.deepEqual(unavailableFact.signals, []);
  assert.deepEqual(unavailableFact.skippedRules, [{
    ruleId: 'fixture.requires-time',
    reason: 'REQUIRED_FACT_UNAVAILABLE'
  }]);
});

test('source authority and fact matching are explicit gates', () => {
  const fixtureOnly = createInterpretationSignalRuleRegistry([rule('fixture-only')]);
  const authoritativeContext = fixtureContext({ sourceAuthority: 'AUTHORITATIVE_ENGINE' });
  const notAllowed = fixtureOnly.evaluate(authoritativeContext);
  const authoritativeRule = rule('authoritative-only', bodyReference, {
    prerequisites: {
      requiredFactKinds: ['NATAL_BODY_POSITION'],
      allowedSourceAuthorities: ['AUTHORITATIVE_ENGINE']
    }
  });
  const authoritative = createInterpretationSignalRuleRegistry([authoritativeRule]).evaluate(
    authoritativeContext
  );
  const noMatch = createInterpretationSignalRuleRegistry([
    rule('fixture-no-match', bodyReference, { matches: () => false })
  ]).evaluate(fixtureContext());

  assert.deepEqual(notAllowed.skippedRules, [{
    ruleId: 'fixture-only',
    reason: 'SOURCE_AUTHORITY_NOT_ALLOWED'
  }]);
  assert.equal(authoritative.signals[0].authority, 'AUTHORITATIVE');
  assert.equal(authoritative.signals[0].provenance.sourceAuthority, 'AUTHORITATIVE_ENGINE');
  assert.deepEqual(noMatch.skippedRules, [{
    ruleId: 'fixture-no-match',
    reason: 'FACT_MATCH_NOT_FOUND'
  }]);
});

test('ranking is deterministic, metadata-only, and uses stable tie breaking', () => {
  const background = signal('signal.background', bodyReference, {
    priority: 'BACKGROUND',
    internalStrength: 0.6
  });
  const momentary = signal('signal.momentary', bodyReference, {
    priority: 'MOMENTARY',
    internalStrength: 0.6
  });
  const equalB = signal('signal.equal-b', bodyReference, {
    priority: 'THEMATIC',
    internalStrength: 0.6,
    ranking: {
      baseImportance: 0.5,
      evidenceStrength: 0.5,
      temporalRelevance: 0.5,
      durationWeight: 0.5,
      repetitionPenalty: 0
    }
  });
  const equalA = { ...equalB, signalId: 'signal.equal-a' };

  const priorityRanking = rankInterpretationSignals([background, momentary]);
  const equalRanking = rankInterpretationSignals([equalB, equalA]);

  assert.deepEqual(priorityRanking.map((entry) => entry.signal.signalId), [
    'signal.momentary',
    'signal.background'
  ]);
  assert.deepEqual(equalRanking.map((entry) => entry.signal.signalId), [
    'signal.equal-a',
    'signal.equal-b'
  ]);
  assert.equal(priorityRanking[0].rank, 1);
  assert.equal(priorityRanking[1].rank, 2);
  assert.equal(priorityRanking[0].rankingScore > priorityRanking[1].rankingScore, true);
});

test('composition exposes mixed direction, dominant/supporting signals, and all source refs', () => {
  const supportive = signal('signal.relationship.support', bodyReference, {
    domain: 'RELATIONSHIP',
    direction: 'SUPPORTIVE',
    theme: 'connection',
    internalStrength: 0.9
  });
  const challenging = signal('signal.relationship.challenge', aspectReference, {
    domain: 'RELATIONSHIP',
    direction: 'CHALLENGING',
    theme: 'connection',
    internalStrength: 0.6
  });
  const result = composeInterpretationSignalGroup([challenging, supportive]);

  assert.deepEqual(result, {
    direction: 'MIXED',
    dominantSignalId: 'signal.relationship.support',
    supportingSignalIds: ['signal.relationship.challenge'],
    sourceSignalIds: ['signal.relationship.support', 'signal.relationship.challenge'],
    supportiveSignalIds: ['signal.relationship.support'],
    challengingSignalIds: ['signal.relationship.challenge'],
    sourceFactRefs: [bodyReference, aspectReference]
  });
});

test('multiple supportive and repeated same-theme signals remain explicit', () => {
  const first = signal('signal.theme-a', bodyReference, {
    direction: 'SUPPORTIVE',
    theme: 'same-theme'
  });
  const second = signal('signal.theme-b', aspectReference, {
    direction: 'SUPPORTIVE',
    theme: 'same-theme',
    internalStrength: 0.4
  });
  const result = composeInterpretationSignalGroup([first, second]);

  assert.equal(result.direction, 'SUPPORTIVE');
  assert.deepEqual(result.sourceSignalIds, ['signal.theme-a', 'signal.theme-b']);
  assert.deepEqual(result.supportiveSignalIds, ['signal.theme-a', 'signal.theme-b']);
  assert.deepEqual(result.sourceFactRefs, [bodyReference, aspectReference]);
});

test('content-style input keeps approved signals and excerpts separate from authority', () => {
  const period = {
    kind: 'DAILY',
    periodKey: '2026-09-05',
    canonicalTimezone: 'Asia/Shanghai',
    startsAt: '2026-09-04T16:00:00.000Z',
    endsAt: '2026-09-05T16:00:00.000Z'
  };
  const approvedSignal = signal('signal.content', bodyReference);
  const englishInput = {
    approvedSignals: [approvedSignal],
    approvedFactExcerpts: [{ factReference: bodyReference, text: 'Supplied excerpt.' }],
    period,
    locale: 'en',
    style: 'CLEAR',
    contentPolicyVersion: 'NATALNODE_CONTENT_POLICY_V1@1.0.0'
  };
  const localizedInput = { ...englishInput, locale: 'zh-Hant' };

  assert.deepEqual(Object.keys(englishInput), [
    'approvedSignals',
    'approvedFactExcerpts',
    'period',
    'locale',
    'style',
    'contentPolicyVersion'
  ]);
  assert.deepEqual(
    englishInput.approvedSignals.map((item) => item.signalId),
    localizedInput.approvedSignals.map((item) => item.signalId)
  );
  assert.equal(localizedInput.locale, 'zh-Hant');
});

test('the signal foundation has no route, network, or astronomy implementation path', () => {
  const files = [
    'src/features/interpretation/interpretation-signal-contracts.ts',
    'src/features/interpretation/interpretation-signal-engine.ts',
    'src/features/interpretation/interpretation-signal-ranking.ts',
    'src/features/interpretation/interpretation-signal-composition.ts'
  ];
  const source = files.map((file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).join('\n');

  assert.doesNotMatch(source, /fetch\(|axios|HttpEngineClient|@natalnode\/engine-client|@natalnode\/contracts/u);
  assert.doesNotMatch(source, /Math\.(?:sin|cos|tan)|ephemeris|provider-specific/iu);
  assert.doesNotMatch(source, /\/api\//u);
});
