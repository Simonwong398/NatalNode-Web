import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const selector = await import(
  new URL(
    '../dist/chart-level-personal-theme-selector-poc-characterization/features/interpretation/chart-level-personal-theme-selector-poc.js',
    import.meta.url
  ).href
);

const placementArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json', import.meta.url),
  'utf8'
));
const aspectArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/ASPECT_SIGNAL_REPRESENTATIVE_V1.json', import.meta.url),
  'utf8'
));

const placementRules = new Map(
  placementArtifact.rules.map((rule) => [rule.compositionId, rule])
);
const aspectRules = new Map(
  aspectArtifact.rules.map((rule) => [rule.compositionId, rule])
);

function placement(compositionId, overrides = {}) {
  const rule = placementRules.get(compositionId);
  assert.ok(rule, `missing placement rule ${compositionId}`);
  const placementEvidence = rule.placementEvidence;
  return {
    candidateId: `candidate.${compositionId}`,
    themeId: `theme.${compositionId}`,
    candidateKind: 'PLACEMENT',
    sourceSignalIds: [rule.signalId],
    semanticUnitIds: [`semantic-unit.${rule.placementEvidenceKey}`],
    rootKeys: [`${placementEvidence.bodyId}.position`],
    domain: rule.eligibleDomain,
    direction: rule.direction,
    intensity: rule.candidateIntensity,
    confidence: rule.candidateConfidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `placement:${rule.compositionId}`,
    readerMeaningKey: `meaning:${placementEvidence.bodyId}:${placementEvidence.signId}`,
    factIdentityKey: `fact:${rule.placementEvidenceKey}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: rule.birthTimeRequirement.status,
    semanticBasisIds: [rule.compositionId],
    qualificationState: 'NONE',
    placement: {
      scope: 'SINGLE_NATAL_CHART',
      placementType: 'NATAL_BODY_POSITION',
      bodyId: placementEvidence.bodyId,
      signId: placementEvidence.signId,
      evidenceKey: rule.placementEvidenceKey
    },
    provenance: {
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      sourceRefs: rule.provenance.sourceRefs,
      sourceFactRefs: [rule.placementEvidenceKey],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    },
    ...overrides
  };
}

function aspectCandidate({
  compositionId = 'body.moon_x_aspect.conjunction_x_body.mercury',
  candidateId = 'candidate.aspect.moon-mercury.conjunction',
  themeId = 'theme.aspect.moon-mercury.conjunction',
  sourceSignalIds,
  semanticUnitIds,
  relationalEnrichmentState = 'ENRICHED',
  subsumptionState = 'NONE',
  subsumedCandidateIds = [],
  readerMeaningKey = `meaning:aspect:${compositionId}`,
  factIdentityKey = `fact:aspect:${compositionId}`,
  personalRelevance = 'DIRECT'
} = {}) {
  const rule = aspectRules.get(compositionId);
  assert.ok(rule, `missing aspect rule ${compositionId}`);
  return {
    candidateId,
    themeId,
    candidateKind: 'RELATIONAL',
    sourceSignalIds: sourceSignalIds ?? [rule.signalId],
    semanticUnitIds: semanticUnitIds ?? [rule.semanticUnit.id],
    rootKeys: rule.evidenceLineage.evidenceRootKeys,
    domain: rule.eligibleDomain,
    direction: rule.direction,
    intensity: rule.candidateIntensity,
    confidence: rule.candidateConfidence,
    personalRelevance,
    semanticIdentityKey: `relation:${rule.compositionId}`,
    readerMeaningKey,
    factIdentityKey,
    relationalEnrichmentState,
    subsumptionState,
    subsumedCandidateIds,
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: rule.birthTimeRequirement.status,
    semanticBasisIds: [rule.relationalFactId],
    qualificationState: 'NONE',
    provenance: {
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      sourceRefs: rule.provenance.sourceRefs,
      sourceFactRefs: [rule.relationalFactId],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    }
  };
}

const sunAries = placement('body.sun_x_sign.aries');
const moonAries = placement('body.moon_x_sign.aries');
const moonTaurus = placement('body.moon_x_sign.taurus');
const mercuryAries = placement('body.mercury_x_sign.aries');
const venusTaurus = placement('body.venus_x_sign.taurus');
const marsAries = placement('body.mars_x_sign.aries');

const coherentFive = [sunAries, moonTaurus, mercuryAries, venusTaurus, marsAries];

const relationalTheme = aspectCandidate({
  sourceSignalIds: [moonAries.sourceSignalIds[0], mercuryAries.sourceSignalIds[0], 'signal.aspect.body.moon_x_aspect.conjunction_x_body.mercury'],
  semanticUnitIds: [moonAries.semanticUnitIds[0], mercuryAries.semanticUnitIds[0], 'semantic-unit.relational.body.moon_aspect.conjunction_body.mercury'],
  subsumptionState: 'SUBSUMES_PLACEMENTS',
  subsumedCandidateIds: [moonAries.candidateId, mercuryAries.candidateId]
});

const duplicateMoonTaurus = {
  ...moonTaurus,
  candidateId: 'candidate.moon-taurus.copy',
  themeId: 'theme.moon-taurus.copy'
};

const redundantMoonTaurusProjection = {
  ...moonTaurus,
  candidateId: 'candidate.moon-taurus.projection',
  themeId: 'theme.moon-taurus.projection',
  candidateKind: 'PROJECTION',
  semanticIdentityKey: 'projection:moon-taurus:alternate',
  factIdentityKey: 'fact:projection:moon-taurus:alternate'
};

const supportingMoonTaurusProjection = {
  ...moonTaurus,
  candidateId: 'candidate.z-moon-taurus-supporting',
  themeId: 'theme.z-moon-taurus-supporting',
  candidateKind: 'PROJECTION',
  semanticIdentityKey: 'projection:moon-taurus:supporting-context',
  readerMeaningKey: 'meaning:moon:taurus:supporting-context',
  factIdentityKey: 'fact:projection:moon-taurus:supporting-context'
};

const supportingMarsAriesProjection = {
  ...marsAries,
  candidateId: 'candidate.z-mars-aries-supporting',
  themeId: 'theme.z-mars-aries-supporting',
  candidateKind: 'PROJECTION',
  semanticIdentityKey: 'projection:mars-aries:supporting-context',
  readerMeaningKey: 'meaning:mars:aries:supporting-context',
  factIdentityKey: 'fact:projection:mars-aries:supporting-context'
};

function select(candidates, options = {}) {
  return selector.selectChartLevelPersonalThemes(candidates, options);
}

function allOutputThemes(result) {
  return [
    ...result.coreThemes,
    ...result.supportingThemes,
    ...result.subsumedThemes,
    ...result.suppressedThemes
  ];
}

test('chart-level selector exposes an ordinal contract with no numeric ranking', () => {
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.selectionMode, 'ORDINAL_RULES');
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.numericRanking, false);
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.hardMinimum, false);
  assert.deepEqual(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.preferredCoreRange, { min: 3, max: 5 });
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.bodyAutomaticPriority, false);
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.domainQuota, false);

  const source = readFileSync(
    new URL('../src/features/interpretation/chart-level-personal-theme-selector-poc.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /themeScore|score\s*=|weight\s*=|percentage|pseudo-precision|summed\s+intensity/iu);
});

test('Scenario A preserves five distinct admitted themes even when signs repeat', () => {
  const result = select(coherentFive, { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.failureState, null);
  assert.equal(result.coreThemes.length, 5);
  assert.equal(result.supportingThemes.length, 0);
  assert.equal(result.subsumedThemes.length, 0);
  assert.equal(result.suppressedThemes.length, 0);
  assert.deepEqual(new Set(result.coreThemeIds), new Set(coherentFive.map((candidate) => candidate.themeId)));
  assert.equal(new Set(result.coreThemes.map((theme) => theme.placement.signId)).size, 2);
  assert.equal(result.decisionTrace.some((trace) => trace.reason.includes('DOMAIN_BREADTH')), true);
});

test('Scenario B caps core themes at five and accounts for overflow plus duplicate', () => {
  const result = select([
    ...coherentFive,
    supportingMoonTaurusProjection,
    supportingMarsAriesProjection,
    { ...sunAries, candidateId: 'candidate.sun-aries.copy', themeId: 'theme.sun-aries.copy' }
  ], { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.inputCandidateIds.length, 8);
  assert.equal(result.coreThemes.length, 5);
  assert.equal(result.supportingThemes.length, 2);
  assert.equal(result.subsumedThemes.length, 0);
  assert.equal(result.suppressedThemes.length, 1);
  assert.ok(result.suppressedThemeIds.includes('theme.sun-aries.copy'));
  assert.ok(result.decisionTrace.some((trace) => trace.reason === 'SUPPORTING_CONTEXT_CORE_BUDGET_REACHED'));
  assert.deepEqual(
    new Set(allOutputThemes(result).map((theme) => theme.candidateId)),
    new Set(result.inputCandidateIds)
  );
  assert.ok(result.supportingThemes.every((theme) => theme.editorialRole === 'SUPPORTING_THREAD'));
});

test('Scenario C allows fewer than three and returns exactly two core themes without filler', () => {
  const result = select([moonTaurus, mercuryAries], { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.coreThemes.length, 2);
  assert.equal(result.supportingThemes.length, 0);
  assert.equal(result.subsumedThemes.length, 0);
  assert.equal(result.suppressedThemes.length, 0);
  assert.deepEqual([...result.coreThemeIds].sort(), [moonTaurus.themeId, mercuryAries.themeId].sort());
  assert.ok(result.coreThemes.every((theme) => result.inputCandidateIds.includes(theme.candidateId)));
});

test('Scenario D retains relational enrichment as one core and subsumes placement themes', () => {
  const result = select([
    moonAries,
    mercuryAries,
    relationalTheme,
    venusTaurus,
    marsAries
  ], { birthTimeAuthority: 'KNOWN' });

  assert.equal(result.failureState, null);
  assert.equal(result.coreThemes.length, 3);
  assert.ok(result.coreThemeIds.includes(relationalTheme.themeId));
  assert.ok(result.coreThemeIds.includes(venusTaurus.themeId));
  assert.ok(result.coreThemeIds.includes(marsAries.themeId));
  assert.deepEqual(new Set(result.subsumedThemeIds), new Set([moonAries.themeId, mercuryAries.themeId]));
  assert.equal(result.subsumedThemes.length, 2);
  assert.ok(result.subsumedThemes.every((theme) => theme.editorialRole === 'SUBSUMED'));
  assert.ok(result.subsumedThemes.every((theme) => theme.sourceSignalIds.length > 0));
  assert.ok(result.decisionTrace.some((trace) => trace.reason === 'SUBSUMED_BY_RELATIONAL_THEME'));
});

test('Scenario E distinguishes duplicate suppression from redundant projection suppression', () => {
  const result = select([
    moonTaurus,
    duplicateMoonTaurus,
    redundantMoonTaurusProjection
  ], { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.coreThemes.length, 1);
  assert.ok([
    moonTaurus.themeId,
    redundantMoonTaurusProjection.themeId
  ].includes(result.coreThemes[0].themeId));
  assert.deepEqual(
    new Set(result.suppressedThemeIds),
    new Set([duplicateMoonTaurus.themeId, redundantMoonTaurusProjection.themeId])
  );
  assert.ok(result.decisionTrace.some((trace) => trace.outcome === 'DUPLICATE'));
  assert.ok(result.decisionTrace.some((trace) => trace.outcome === 'REDUNDANT'));
  assert.ok(result.suppressedThemes.every((theme) => theme.sourceSignalIds.length > 0));
});

test('Scenario F fails closed for same body with two different signs', () => {
  const result = select([moonAries, moonTaurus], { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.failureState?.code, 'CONFLICTING_BODY_SIGN_PLACEMENT');
  assert.deepEqual(
    new Set(result.failureState.relatedCandidateIds),
    new Set([moonAries.candidateId, moonTaurus.candidateId])
  );
  assert.equal(result.coreThemes.length, 0);
  assert.equal(result.supportingThemes.length, 0);
  assert.equal(result.subsumedThemes.length, 0);
  assert.equal(result.decisionTrace.filter((trace) => trace.outcome === 'FAIL').length, 2);
  assert.equal(result.decisionTrace.some((trace) => trace.reason === 'FAIL_CLOSED_CONFLICTING_BODY_SIGN_PLACEMENT'), true);
});

test('Scenario G selects unknown-time-safe placements without time-sensitive layers', () => {
  const result = select(coherentFive, { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.failureState, null);
  assert.equal(result.coreThemes.length, 5);
  assert.ok(result.coreThemes.every((theme) => theme.unknownTimeEligibility === 'UNKNOWN_TIME_SAFE'));
  assert.ok(result.coreThemes.every((theme) => theme.candidateKind === 'PLACEMENT'));
  assert.ok(result.coreThemes.every((theme) => !('ascId' in theme) && !('mcId' in theme) && !('houseId' in theme)));
  assert.ok(result.decisionTrace.every((trace) => !/ASC|MC|house|fabricated\s+time/iu.test(trace.reason)));
});

test('same domain alone does not create redundancy and no domain quota is applied', () => {
  const relationWithoutSubsumption = aspectCandidate({
    candidateId: 'candidate.aspect.same-domain',
    themeId: 'theme.aspect.same-domain',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    readerMeaningKey: 'meaning:aspect:same-domain',
    factIdentityKey: 'fact:aspect:same-domain'
  });
  const result = select([mercuryAries, relationWithoutSubsumption], { birthTimeAuthority: 'KNOWN' });

  assert.equal(mercuryAries.domain, relationWithoutSubsumption.domain);
  assert.equal(result.coreThemes.length, 2);
  assert.equal(result.suppressedThemes.length, 0);
  assert.equal(result.coreThemes.filter((theme) => theme.domain === 'COMMUNICATION').length, 2);
  assert.equal(selector.CHART_LEVEL_THEME_SELECTOR_POC_POLICY.domainQuota, false);
});

test('same sign alone does not create redundancy', () => {
  const result = select([sunAries, mercuryAries, marsAries], { birthTimeAuthority: 'UNKNOWN' });

  assert.equal(result.coreThemes.length, 3);
  assert.equal(result.suppressedThemes.length, 0);
  assert.equal(new Set(result.coreThemes.map((theme) => theme.placement.signId)).size, 1);
});

test('editorial role never changes direction, intensity, or confidence', () => {
  const result = select([
    ...coherentFive,
    supportingMoonTaurusProjection,
    relationalTheme
  ], { birthTimeAuthority: 'KNOWN' });
  const inputById = new Map([
    ...coherentFive,
    supportingMoonTaurusProjection,
    relationalTheme
  ].map((candidate) => [candidate.candidateId, candidate]));

  for (const theme of allOutputThemes(result)) {
    const input = inputById.get(theme.candidateId);
    assert.ok(input);
    assert.equal(theme.direction, input.direction);
    assert.equal(theme.intensity, input.intensity);
    assert.equal(theme.confidence, input.confidence);
  }
});

test('stable identity resolves equivalent candidates without Sun or Moon priority', () => {
  const result = select([
    { ...sunAries, candidateId: 'candidate.z-sun', themeId: 'theme.z-sun' },
    { ...moonTaurus, candidateId: 'candidate.a-moon', themeId: 'theme.a-moon' }
  ], { birthTimeAuthority: 'UNKNOWN', maxCoreThemes: 1 });

  assert.equal(result.coreThemes.length, 1);
  assert.equal(result.coreThemes[0].candidateId, 'candidate.a-moon');
  assert.equal(result.coreThemes[0].editorialReason, 'CORE_SEMANTICALLY_DISTINCT');
});

test('repeated selection is deterministic and preserves provenance', () => {
  const input = [sunAries, moonTaurus, mercuryAries, venusTaurus, marsAries];
  const first = select(input, { birthTimeAuthority: 'UNKNOWN' });
  const second = select(input, { birthTimeAuthority: 'UNKNOWN' });

  assert.deepEqual(second, first);
  assert.ok(first.coreThemes.every((theme) => theme.provenance.sourceRefs.length > 0));
  assert.ok(first.coreThemes.every((theme) => theme.provenance.sourceFactRefs.length > 0));
  assert.ok(first.coreThemes.every((theme) => theme.provenance.whyReady && theme.provenance.learnReady));
  assert.equal(first.selectorPolicyId, 'NATALNODE_CHART_LEVEL_PERSONAL_THEME_SELECTOR_POC_V1');
  assert.equal(first.selectorPolicyVersion, '1.0.0');
});

test('production interpretation entrypoints do not import or wire the selector POC', () => {
  const files = [
    '../src/features/interpretation/index.ts',
    '../src/features/interpretation/InterpretationPanel.tsx',
    '../src/features/interpretation/deterministic-interpretation.ts'
  ];
  for (const relativePath of files) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /chart-level-personal-theme-selector-poc/u);
  }
});
