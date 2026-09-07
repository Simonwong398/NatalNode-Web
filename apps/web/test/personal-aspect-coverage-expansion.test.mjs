import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modules = '../dist/personal-aspect-coverage-expansion-characterization/features/interpretation/';
const synthesis = await import(new URL(`${modules}shared-root-relational-synthesis-poc.js`, import.meta.url).href);
const selector = await import(new URL(`${modules}chart-level-personal-theme-selector-poc.js`, import.meta.url).href);

const placementArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json', import.meta.url),
  'utf8'
));
const aspectArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/PERSONAL_ASPECT_SIGNAL_EXPANSION_V1.json', import.meta.url),
  'utf8'
));

const placementRules = new Map(
  placementArtifact.rules.map((rule) => [rule.compositionId, rule])
);
const aspectRules = new Map(
  aspectArtifact.rules.map((rule) => [rule.compositionId, rule])
);

function placement(compositionId) {
  const rule = placementRules.get(compositionId);
  assert.ok(rule, `missing placement rule ${compositionId}`);
  return synthesis.createSharedRootPlacementSignal(rule);
}

function aspect(compositionId) {
  const rule = aspectRules.get(compositionId);
  assert.ok(rule, `missing aspect rule ${compositionId}`);
  return synthesis.createAspectSignalResearchInput(rule);
}

function synthesize(signals, options = {}) {
  return synthesis.synthesizeSharedRootRelationalSignals(signals, options);
}

function themeForSignal(result, signalId) {
  const theme = result.synthesis.placementThemesBefore.find((candidate) =>
    candidate.sourceSignalIds.includes(signalId)
  );
  assert.ok(theme, `missing placement theme for ${signalId}`);
  return theme;
}

function placementCandidate(signal, theme, candidateId = `candidate.${signal.compositionId}`) {
  return {
    candidateId,
    themeId: theme.themeId,
    candidateKind: 'PLACEMENT',
    sourceSignalIds: [signal.signalId],
    semanticUnitIds: [`semantic-unit.${signal.placementEvidenceKey}`],
    rootKeys: [`${signal.bodyId}.position`],
    domain: theme.domain,
    direction: theme.direction,
    intensity: theme.intensity,
    confidence: theme.confidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `placement:${signal.compositionId}`,
    readerMeaningKey: `meaning:${signal.bodyId}:${signal.signId}`,
    factIdentityKey: `fact:${signal.placementEvidenceKey}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: signal.birthTimeRequirement.status,
    semanticBasisIds: [signal.compositionId],
    qualificationState: 'NONE',
    placement: {
      scope: 'SINGLE_NATAL_CHART',
      placementType: 'NATAL_BODY_POSITION',
      bodyId: signal.bodyId,
      signId: signal.signId,
      evidenceKey: signal.placementEvidenceKey
    },
    provenance: {
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      sourceRefs: [signal.rule.ruleId, ...signal.learnReferences.map((reference) => reference.sourcePath)],
      sourceFactRefs: [signal.placementEvidenceKey],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    }
  };
}

function relationalCandidate(result, placementCandidates, candidateId) {
  const theme = result.synthesis.enrichedThemes[0];
  assert.ok(theme);
  return {
    candidateId,
    themeId: theme.themeId,
    candidateKind: 'RELATIONAL',
    sourceSignalIds: theme.sourceSignalIds,
    semanticUnitIds: theme.sourceSemanticUnitIds,
    rootKeys: theme.uniqueRootKeys,
    domain: theme.domain,
    direction: theme.direction,
    intensity: theme.intensity,
    confidence: theme.confidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `relation:${theme.semanticThemeKey}`,
    readerMeaningKey: `meaning:${theme.semanticThemeKey}`,
    factIdentityKey: `fact:${theme.sourceAspectSignalId}`,
    relationalEnrichmentState: 'ENRICHED',
    subsumptionState: 'SUBSUMES_PLACEMENTS',
    subsumedCandidateIds: placementCandidates.map((candidate) => candidate.candidateId),
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: theme.authorityRequirements.birthTimeDependency === 'UNKNOWN_TIME_SAFE'
      ? 'UNKNOWN_TIME_SAFE'
      : 'REQUIRES_KNOWN',
    semanticBasisIds: theme.semanticBasisIds,
    qualificationState: 'NONE',
    provenance: {
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      sourceRefs: theme.compositionRuleRefs,
      sourceFactRefs: [theme.sourceAspectSignalId, ...theme.sourcePlacementSignalIds],
      whyReady: true,
      learnReady: theme.editorial.learnReferences.length > 0,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    }
  };
}

test('all eight expanded aspect rules adapt without authority or semantic-policy loss', () => {
  for (const rule of aspectArtifact.rules) {
    const signal = synthesis.createAspectSignalResearchInput(rule);
    assert.equal(signal.compositionId, rule.compositionId);
    assert.equal(signal.bodyAId, rule.bodyAId);
    assert.equal(signal.bodyBId, rule.bodyBId);
    assert.equal(signal.aspectType, rule.aspectType);
    assert.equal(signal.semanticUnit.count, 1);
    assert.equal(signal.semanticDimensions.count, 3);
    assert.deepEqual(signal.evidenceLineage.evidenceRootKeys, [...rule.evidenceLineage.evidenceRootKeys].sort());
    assert.equal(signal.evidenceLineage.relationalFactIndependentEvidenceIncrement, 0);
    assert.equal(signal.direction, 'NEUTRAL');
    assert.equal(signal.intensity, 'SUBTLE');
    assert.equal(signal.confidence, 'LOW');
    assert.equal(signal.authority, 'DEVELOPMENT_ONLY');
    assert.equal(signal.birthTimeRequirement.status, 'UNKNOWN_TIME_FAIL_CLOSED');
  }
});

test('Moon-Venus and Mercury-Mars conjunctions each enrich two placements as one relational theme', () => {
  const bundles = [
    {
      name: 'Moon-Venus',
      placementSignals: [placement('body.moon_x_sign.taurus'), placement('body.venus_x_sign.taurus')],
      aspectSignal: aspect('body.moon_x_aspect.conjunction_x_body.venus'),
      domain: 'RELATIONSHIP',
      themeId: 'shared-root-relational.moon-venus-conjunction',
      rootKeys: ['body.moon.position', 'body.venus.position']
    },
    {
      name: 'Mercury-Mars',
      placementSignals: [placement('body.mercury_x_sign.aries'), placement('body.mars_x_sign.aries')],
      aspectSignal: aspect('body.mercury_x_aspect.conjunction_x_body.mars'),
      domain: 'ACTION_DECISION',
      themeId: 'shared-root-relational.mercury-mars-conjunction',
      rootKeys: ['body.mars.position', 'body.mercury.position']
    }
  ];

  for (const bundle of bundles) {
    const result = synthesize(
      [...bundle.placementSignals, bundle.aspectSignal],
      { birthTimeAuthority: 'KNOWN' }
    );
    assert.equal(result.coherence.status, 'COHERENT', bundle.name);
    assert.equal(result.classification, 'RELATIONAL_ENRICHMENT', bundle.name);
    assert.equal(result.eligibleSignals.length, 3, bundle.name);
    assert.equal(result.suppressedSignals.length, 0, bundle.name);
    assert.equal(result.accounting.semanticUnitCount, 3, bundle.name);
    assert.equal(result.accounting.placementSemanticUnitCount, 2, bundle.name);
    assert.equal(result.accounting.relationalSemanticUnitCount, 1, bundle.name);
    assert.equal(result.accounting.relationalSemanticDimensionCount, 3, bundle.name);
    assert.equal(result.accounting.uniqueRootCount, 2, bundle.name);
    assert.deepEqual(result.accounting.uniqueRootKeys, bundle.rootKeys, bundle.name);
    assert.equal(result.accounting.independentEvidenceUnitCount, 2, bundle.name);
    assert.equal(result.accounting.relationalFactIndependentEvidenceIncrement, 0, bundle.name);
    assert.equal(result.accounting.evidenceInflation, 0, bundle.name);
    assert.equal(result.synthesis.enrichedThemes.length, 1, bundle.name);
    assert.equal(result.synthesis.outputThemes.length, 1, bundle.name);
    const theme = result.synthesis.enrichedThemes[0];
    assert.ok(theme);
    assert.equal(theme.themeId, bundle.themeId, bundle.name);
    assert.equal(theme.domain, bundle.domain, bundle.name);
    assert.equal(theme.subsumptionState, 'SUBSUMES_PLACEMENT_THEMES', bundle.name);
    assert.equal(theme.subsumedThemeIds.length, 2, bundle.name);
    assert.equal(theme.direction, 'NEUTRAL', bundle.name);
    assert.equal(theme.intensity, 'SUBTLE', bundle.name);
    assert.equal(theme.confidence, 'LOW', bundle.name);
    assert.equal(theme.provenance.placementChains.length, 2, bundle.name);
    assert.equal(theme.provenance.aspectChain.evidenceRootKeys.length, 2, bundle.name);
    assert.ok(theme.editorial.why.sourceSemanticUnitIds.length === 3, bundle.name);
    assert.ok(theme.editorial.learnReferences.length > 0, bundle.name);
  }
});

test('duplicate aspect, unknown time, and same-sign inputs remain distinct boundaries', () => {
  const moon = placement('body.moon_x_sign.taurus');
  const venus = placement('body.venus_x_sign.taurus');
  const moonVenus = aspect('body.moon_x_aspect.conjunction_x_body.venus');

  const duplicate = synthesize([moon, venus, moonVenus, moonVenus], { birthTimeAuthority: 'KNOWN' });
  assert.equal(duplicate.accounting.semanticUnitCount, 3);
  assert.equal(duplicate.accounting.uniqueRootCount, 2);
  assert.deepEqual(duplicate.suppressedSignals, [{
    signalId: moonVenus.signalId,
    reason: 'DUPLICATE_RELATIONAL_FACT'
  }]);
  assert.equal(duplicate.synthesis.enrichedThemes.length, 1);
  assert.equal(duplicate.synthesis.enrichedThemes[0].confidence, 'LOW');
  assert.equal(duplicate.synthesis.enrichedThemes[0].intensity, 'SUBTLE');

  const unknown = synthesize([moon, venus, moonVenus], { birthTimeAuthority: 'UNKNOWN' });
  assert.equal(unknown.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(unknown.accounting.semanticUnitCount, 2);
  assert.equal(unknown.accounting.uniqueRootCount, 2);
  assert.equal(unknown.synthesis.enrichedThemes.length, 0);
  assert.deepEqual(unknown.suppressedSignals, [{
    signalId: moonVenus.signalId,
    reason: 'UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION'
  }]);
  assert.equal(unknown.synthesis.outputThemes.length, 2);

  const sameSignWithoutAspect = synthesize([
    placement('body.moon_x_sign.taurus'),
    placement('body.venus_x_sign.taurus')
  ]);
  assert.equal(sameSignWithoutAspect.synthesis.enrichedThemes.length, 0);
  assert.equal(sameSignWithoutAspect.synthesis.outputThemes.length, 2);
});

test('the coherent five-body bundle accounts for seven semantic units and five roots before selector roles', () => {
  const sun = placement('body.sun_x_sign.aries');
  const moon = placement('body.moon_x_sign.taurus');
  const venus = placement('body.venus_x_sign.taurus');
  const mercury = placement('body.mercury_x_sign.aries');
  const mars = placement('body.mars_x_sign.aries');
  const moonVenus = aspect('body.moon_x_aspect.conjunction_x_body.venus');
  const mercuryMars = aspect('body.mercury_x_aspect.conjunction_x_body.mars');

  const moonVenusResult = synthesize([moon, venus, moonVenus], { birthTimeAuthority: 'KNOWN' });
  const mercuryMarsResult = synthesize([mercury, mars, mercuryMars], { birthTimeAuthority: 'KNOWN' });
  const sunTheme = {
    themeId: 'personal-placement.sun-aries',
    domain: 'SELF',
    direction: sun.direction,
    intensity: sun.intensity,
    confidence: sun.confidence
  };
  const sunCandidate = placementCandidate(sun, sunTheme, 'candidate.personal-placement.sun-aries');
  const moonCandidate = placementCandidate(
    moon,
    themeForSignal(moonVenusResult, moon.signalId),
    'candidate.personal-placement.moon-taurus'
  );
  const venusCandidate = placementCandidate(
    venus,
    themeForSignal(moonVenusResult, venus.signalId),
    'candidate.personal-placement.venus-taurus'
  );
  const mercuryCandidate = placementCandidate(
    mercury,
    themeForSignal(mercuryMarsResult, mercury.signalId),
    'candidate.personal-placement.mercury-aries'
  );
  const marsCandidate = placementCandidate(
    mars,
    themeForSignal(mercuryMarsResult, mars.signalId),
    'candidate.personal-placement.mars-aries'
  );
  const moonVenusCandidate = relationalCandidate(
    moonVenusResult,
    [moonCandidate, venusCandidate],
    'candidate.relational.moon-venus'
  );
  const mercuryMarsCandidate = relationalCandidate(
    mercuryMarsResult,
    [mercuryCandidate, marsCandidate],
    'candidate.relational.mercury-mars'
  );

  const semanticUnitIds = new Set([
    ...sunCandidate.semanticUnitIds,
    ...moonVenusResult.accounting.semanticUnitIds,
    ...mercuryMarsResult.accounting.semanticUnitIds
  ]);
  const rootKeys = new Set([
    ...sunCandidate.rootKeys,
    ...moonVenusResult.accounting.uniqueRootKeys,
    ...mercuryMarsResult.accounting.uniqueRootKeys
  ]);
  assert.equal(semanticUnitIds.size, 7);
  assert.equal(rootKeys.size, 5);
  assert.equal(moonVenusResult.accounting.relationalFactIndependentEvidenceIncrement, 0);
  assert.equal(mercuryMarsResult.accounting.relationalFactIndependentEvidenceIncrement, 0);
  assert.deepEqual(
    [...new Set(moonVenusResult.accounting.uniqueRootKeys)].filter((root) =>
      mercuryMarsResult.accounting.uniqueRootKeys.includes(root)
    ),
    []
  );

  const result = selector.selectChartLevelPersonalThemes([
    sunCandidate,
    moonCandidate,
    venusCandidate,
    mercuryCandidate,
    marsCandidate,
    moonVenusCandidate,
    mercuryMarsCandidate
  ], { birthTimeAuthority: 'KNOWN' });

  assert.equal(result.failureState, null);
  assert.equal(result.inputCandidateIds.length, 7);
  assert.equal(result.coreThemes.length, 3);
  assert.equal(result.supportingThemes.length, 0);
  assert.equal(result.subsumedThemes.length, 4);
  assert.deepEqual(new Set(result.coreThemeIds), new Set([
    sunCandidate.themeId,
    moonVenusCandidate.themeId,
    mercuryMarsCandidate.themeId
  ]));
  assert.deepEqual(new Set(result.subsumedThemeIds), new Set([
    moonCandidate.themeId,
    venusCandidate.themeId,
    mercuryCandidate.themeId,
    marsCandidate.themeId
  ]));
  assert.ok(result.coreThemes.some((theme) => theme.relationalEnrichmentState === 'ENRICHED'));
  assert.ok(result.decisionTrace.some((trace) => trace.reason === 'SUBSUMED_BY_RELATIONAL_THEME'));
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.hardMinimum, false);
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.maximumCoreThemes, 5);
  assert.equal(result.coreThemes.length < selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.maximumCoreThemes, true);
  assert.deepEqual(
    [moonVenus.signalId, mercuryMars.signalId].sort(),
    [moonVenusResult.aspectSignals[0].signalId, mercuryMarsResult.aspectSignals[0].signalId].sort()
  );
});

test('expanded synthesis is deterministic and does not promote evidence, intensity, or confidence', () => {
  const inputs = [
    placement('body.moon_x_sign.taurus'),
    placement('body.venus_x_sign.taurus'),
    aspect('body.moon_x_aspect.conjunction_x_body.venus')
  ];
  const left = synthesize(inputs, { birthTimeAuthority: 'KNOWN' });
  const right = synthesize([...inputs].reverse(), { birthTimeAuthority: 'KNOWN' });
  assert.deepEqual(left, right);
  const theme = left.synthesis.enrichedThemes[0];
  assert.ok(theme);
  assert.equal(theme.convergence.independentEvidenceKeys.length, 0);
  assert.equal(theme.direction, 'NEUTRAL');
  assert.equal(theme.intensity, 'SUBTLE');
  assert.equal(theme.confidence, 'LOW');
  assert.equal(theme.uniqueRootCount, 2);
  assert.equal(theme.semanticUnitCount, 3);
});
