import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const distRoot = '../dist/chart-level-convergence-counterevidence-characterization/features/interpretation/';
const policy = await import(new URL(`${distRoot}chart-level-convergence-counterevidence-poc.js`, import.meta.url).href);
const sharedRoot = await import(new URL(`${distRoot}shared-root-relational-synthesis-poc.js`, import.meta.url).href);

const placementArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/COMPOSITION_SIGNAL_REPRESENTATIVE_V1.json', import.meta.url),
  'utf8'
));
const aspectArtifact = JSON.parse(readFileSync(
  new URL('../../../docs/research/personal-synthesis/PERSONAL_ASPECT_SIGNAL_EXPANSION_V1.json', import.meta.url),
  'utf8'
));

const placementRules = new Map(placementArtifact.rules.map((rule) => [rule.compositionId, rule]));
const aspectRules = new Map(aspectArtifact.rules.map((rule) => [rule.compositionId, rule]));

function mechanismCandidate({
  id,
  roots,
  units = [`semantic-unit.${id}`],
  domain = 'SELF',
  readerMeaningKey = `meaning:${id}`,
  factIdentityKey = `fact:${id}`,
  semanticClaim = `Mechanism claim for ${id}.`,
  semanticQuestion = `Mechanism question for ${id}.`,
  placement,
  relationKind = 'NONE'
}) {
  return {
    candidateId: id,
    themeId: id,
    candidateKind: 'PROJECTION',
    sourceSignalIds: [`signal.${id}`],
    semanticUnitIds: units,
    rootKeys: roots,
    domain,
    direction: 'NEUTRAL',
    intensity: 'SUBTLE',
    confidence: 'LOW',
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `semantic:${id}`,
    readerMeaningKey,
    factIdentityKey,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: 'UNKNOWN_TIME_SAFE',
    semanticBasisIds: [`basis.${id}`],
    qualificationState: 'NONE',
    placement,
    provenance: {
      sourceAuthority: 'DEVELOPMENT_ONLY',
      sourceRefs: [`MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE:${id}`],
      sourceFactRefs: [`fact-ref:${id}`],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    },
    semanticClaim,
    semanticQuestion,
    integratedSemanticBasis: [`basis.${id}`],
    relationKind
  };
}

function admittedSharedQuestion() {
  return policy.createSemanticOverlapAdmission({
    semanticRelation: 'SHARED_LIFE_QUESTION',
    sharedLifeQuestion: 'How can a chosen direction become a revisable next step?',
    integratedSemanticBasis: ['question.direction', 'question.next-step'],
    selectedDomain: 'SELF',
    reason: 'Explicit mechanism-only shared question admission.'
  });
}

function admittedQualifyingQuestion() {
  return policy.createSemanticOverlapAdmission({
    semanticRelation: 'QUALIFYING_LIFE_QUESTION',
    sharedLifeQuestion: 'What condition narrows when the target claim applies?',
    integratedSemanticBasis: ['question.scope', 'question.condition'],
    selectedDomain: 'WORK_CREATION',
    reason: 'Explicit mechanism-only qualifying question admission.'
  });
}

function placementCandidate(compositionId) {
  const rule = placementRules.get(compositionId);
  assert.ok(rule, `missing placement rule ${compositionId}`);
  const signal = sharedRoot.createSharedRootPlacementSignal(rule);
  return {
    candidateId: `candidate.${compositionId}`,
    themeId: `theme.${compositionId}`,
    candidateKind: 'PLACEMENT',
    sourceSignalIds: [signal.signalId],
    semanticUnitIds: [`semantic-unit.${signal.placementEvidenceKey}`],
    rootKeys: [`${signal.bodyId}.position`],
    domain: signal.domain,
    direction: signal.direction,
    intensity: signal.intensity,
    confidence: signal.confidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `placement:${signal.compositionId}`,
    readerMeaningKey: `meaning:${signal.bodyId}:${signal.signId}`,
    factIdentityKey: `fact:${signal.placementEvidenceKey}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: 'UNKNOWN_TIME_SAFE',
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
      sourceFactRefs: signal.provenance.sourceFactRefs.map((reference) => reference.canonicalFactIdentity),
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    },
    semanticClaim: signal.semanticClaim,
    semanticQuestion: signal.domain,
    integratedSemanticBasis: signal.semanticBasisIds,
    relationKind: 'NONE'
  };
}

function aspectCandidate(compositionId) {
  const rule = aspectRules.get(compositionId);
  assert.ok(rule, `missing aspect rule ${compositionId}`);
  const signal = sharedRoot.createAspectSignalResearchInput(rule);
  return {
    candidateId: `candidate.${compositionId}`,
    themeId: `theme.${compositionId}`,
    candidateKind: 'RELATIONAL',
    sourceSignalIds: [signal.signalId],
    semanticUnitIds: [signal.semanticUnit.id],
    rootKeys: signal.evidenceLineage.evidenceRootKeys,
    domain: signal.domain,
    direction: signal.direction,
    intensity: signal.intensity,
    confidence: signal.confidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `aspect:${signal.compositionId}`,
    readerMeaningKey: `meaning:aspect:${signal.compositionId}`,
    factIdentityKey: `fact:${signal.relationalFactId}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: 'REQUIRES_KNOWN',
    semanticBasisIds: signal.semanticBasisIds,
    qualificationState: 'NONE',
    provenance: {
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      sourceRefs: [signal.rule.ruleId, ...signal.learnReferences.map((reference) => reference.sourcePath)],
      sourceFactRefs: [signal.relationalFactId],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    },
    semanticClaim: signal.semanticClaim,
    semanticQuestion: signal.aspectType,
    integratedSemanticBasis: signal.semanticBasisIds,
    relationKind: 'RELATIONAL'
  };
}

function decision(sources, options = {}) {
  return policy.classifyChartLevelThemes(sources, options);
}

test('policy exposes explicit deterministic authority without numeric or AI semantics', () => {
  assert.equal(policy.CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.decisionMode, 'DETERMINISTIC_EXPLICIT_ADMISSION');
  assert.equal(policy.CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.numericScoring, false);
  assert.equal(policy.CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.embeddingSimilarity, false);
  assert.equal(policy.CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.llmSemanticAuthority, false);
  assert.equal(policy.CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.explicitAdmissionRequired, true);
  assert.equal(policy.CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.noNumericSimilarity, true);
});

test('disjoint mechanism roots plus admitted shared question produce independent convergence', () => {
  const result = decision([
    mechanismCandidate({ id: 'mechanism.source-a', roots: ['mechanism.root.source-a'] }),
    mechanismCandidate({ id: 'mechanism.source-b', roots: ['mechanism.root.source-b'] })
  ], { semanticOverlap: admittedSharedQuestion() });

  assert.equal(result.classification, 'INDEPENDENT_CONVERGENCE');
  assert.equal(result.effect, 'CONVERGE');
  assert.equal(result.uniqueRootCount, 2);
  assert.deepEqual(result.uniqueRootKeys, ['mechanism.root.source-a', 'mechanism.root.source-b']);
  assert.equal(result.semanticRelation, 'SHARED_LIFE_QUESTION');
  assert.equal(result.sourceThemeStates.every((source) => source.state === 'CONVERGED_SUPPORTING_SOURCE'), true);
  assert.equal(result.independentSupport, true);
  assert.equal(result.direction, 'NEUTRAL');
  assert.equal(result.intensity, 'SUBTLE');
  assert.equal(result.confidence, 'LOW');
  assert.equal(result.provenance.runtimeStatus, 'RUNTIME_NOT_ADMITTED');
  assert.equal(result.whyReferences.overlapPolicyId, 'NATALNODE_CHART_LEVEL_SEMANTIC_OVERLAP_POLICY_V1');
});

test('same sign, same domain, and same wording do not create convergence', () => {
  const sameSign = decision([
    placementCandidate('body.moon_x_sign.aries'),
    placementCandidate('body.mercury_x_sign.aries')
  ]);
  assert.equal(sameSign.classification, 'DISTINCT');
  assert.equal(sameSign.effect, 'NONE');

  const sameDomain = decision([
    mechanismCandidate({ id: 'mechanism.domain-a', roots: ['mechanism.root.domain-a'], domain: 'SELF' }),
    mechanismCandidate({ id: 'mechanism.domain-b', roots: ['mechanism.root.domain-b'], domain: 'SELF', semanticQuestion: 'Different question.' })
  ]);
  assert.equal(sameDomain.classification, 'DISTINCT');

  const sameWording = decision([
    mechanismCandidate({ id: 'mechanism.word-a', roots: ['mechanism.root.word-a'], semanticClaim: 'The same words appear.' }),
    mechanismCandidate({ id: 'mechanism.word-b', roots: ['mechanism.root.word-b'], semanticClaim: 'The same words appear.' })
  ]);
  assert.equal(sameWording.classification, 'DISTINCT');
});

test('shared roots are not independent convergence without a relational admission', () => {
  const result = decision([
    mechanismCandidate({ id: 'mechanism.shared-a', roots: ['mechanism.root.shared'] }),
    mechanismCandidate({ id: 'mechanism.shared-b', roots: ['mechanism.root.shared'] })
  ], { semanticOverlap: admittedSharedQuestion() });

  assert.equal(result.classification, 'DISTINCT');
  assert.equal(result.failureState?.code, 'INDEPENDENT_ROOTS_REQUIRED');
  assert.equal(result.independentSupport, false);
});

test('existing Moon-Venus bundle remains relational enrichment rather than convergence', () => {
  const moon = sharedRoot.createSharedRootPlacementSignal(placementRules.get('body.moon_x_sign.taurus'));
  const venus = sharedRoot.createSharedRootPlacementSignal(placementRules.get('body.venus_x_sign.taurus'));
  const relation = sharedRoot.createAspectSignalResearchInput(aspectRules.get('body.moon_x_aspect.conjunction_x_body.venus'));
  const bundle = sharedRoot.synthesizeSharedRootRelationalSignals([moon, venus, relation], {
    birthTimeAuthority: 'KNOWN'
  });
  assert.equal(bundle.classification, 'RELATIONAL_ENRICHMENT');
  const placementThemes = bundle.synthesis.placementThemesBefore.map((theme) => mechanismCandidate({
    id: `existing.${theme.themeId}`,
    roots: theme.sourceSignalIds.map((signalId) => signalId.includes('moon') ? 'body.moon.position' : 'body.venus.position'),
    units: theme.sourceSemanticUnitIds,
    domain: theme.domain,
    semanticClaim: theme.editorial.pattern,
    semanticQuestion: theme.domain,
    relationKind: 'NONE'
  }));
  const relationTheme = aspectCandidate('body.moon_x_aspect.conjunction_x_body.venus');
  const result = decision([...placementThemes, relationTheme], {
    relationMode: 'RELATIONAL_ENRICHMENT'
  });
  assert.equal(result.classification, 'RELATIONAL_ENRICHMENT');
  assert.equal(result.uniqueRootCount, 2);
  assert.equal(result.sourceSemanticUnitIds.length, 3);
  assert.equal(result.independentSupport, false);
  assert.equal(result.sourceThemeStates.every((source) => source.state === 'RELATIONAL_SOURCE'), true);
});

test('independent qualifier deterministically supports QUALIFY, NARROW, and SUPPRESS_OVERBROAD', () => {
  const effects = [
    ['QUALIFY', 'QUALIFIED'],
    ['NARROW', 'NARROWED'],
    ['SUPPRESS_OVERBROAD', 'SUPPRESSED_OVERBROAD']
  ];
  for (const [effect, scope] of effects) {
    const target = mechanismCandidate({ id: `mechanism.target.${effect}`, roots: [`mechanism.root.target.${effect}`], domain: 'WORK_CREATION' });
    const qualifier = mechanismCandidate({ id: `mechanism.qualifier.${effect}`, roots: [`mechanism.root.qualifier.${effect}`], domain: 'WORK_CREATION', semanticQuestion: 'Independent qualifying question.' });
    const result = decision([target, qualifier], {
      semanticOverlap: admittedQualifyingQuestion(),
      counterevidence: {
        targetThemeId: target.themeId,
        qualifierThemeId: qualifier.themeId,
        effect
      }
    });
    assert.equal(result.classification, 'COUNTEREVIDENCE');
    assert.equal(result.effect, effect);
    assert.equal(result.claimScope.state, scope);
    assert.equal(result.uniqueRootCount, 2);
    assert.equal(result.direction, 'NEUTRAL');
    assert.equal(result.intensity, 'SUBTLE');
    assert.equal(result.confidence, 'LOW');
    assert.deepEqual(new Set(result.sourceThemeIds), new Set([target.themeId, qualifier.themeId]));
    assert.ok(result.provenance.sourceThemes.every((source) => source.sourceFactRefs.length > 0));
    const selected = policy.selectSynthesisDecision(result, { birthTimeAuthority: 'UNKNOWN' });
    if (effect === 'SUPPRESS_OVERBROAD') {
      assert.equal(selected.candidate, null);
      assert.equal(selected.selector, null);
    } else {
      assert.ok(selected.candidate);
      assert.ok(selected.selector);
      assert.equal(selected.selector.coreThemes.length, 1);
      assert.equal(selected.selector.supportingThemes.length, 0);
      assert.equal(selected.selector.subsumedThemes.length, 0);
      assert.equal(selected.candidate?.qualificationState, 'QUALIFICATION_REQUIRED');
    }
  }
});

test('same-root qualifying tension is relational, not chart-level counterevidence', () => {
  const target = mechanismCandidate({
    id: 'mechanism.same-root-target',
    roots: ['body.moon.position', 'body.venus.position'],
    units: ['semantic-unit.moon', 'semantic-unit.venus']
  });
  const square = mechanismCandidate({
    id: 'mechanism.same-root-square',
    roots: ['body.moon.position', 'body.venus.position'],
    units: ['semantic-unit.moon-venus-square'],
    semanticQuestion: 'Friction requires adjustment.',
    relationKind: 'RELATIONAL'
  });
  const opposition = mechanismCandidate({
    id: 'mechanism.same-root-opposition',
    roots: ['body.moon.position', 'body.venus.position'],
    units: ['semantic-unit.moon-venus-opposition'],
    semanticQuestion: 'Polarity requires negotiation.',
    relationKind: 'RELATIONAL'
  });
  for (const qualifier of [square, opposition]) {
    const result = decision([target, qualifier], {
      semanticOverlap: admittedQualifyingQuestion(),
      counterevidence: {
        targetThemeId: target.themeId,
        qualifierThemeId: qualifier.themeId,
        effect: 'NARROW'
      }
    });
    assert.equal(result.classification, 'RELATIONAL_ENRICHMENT');
    assert.notEqual(result.classification, 'COUNTEREVIDENCE');
    assert.equal(result.claimScope.state, 'INTERNAL_TENSION');
    assert.equal(result.failureState?.code, 'COUNTEREVIDENCE_REQUIRES_INDEPENDENT_ROOT');
  }
});

test('negative wording or a challenging relation label alone does not create counterevidence', () => {
  const result = decision([
    mechanismCandidate({
      id: 'mechanism.negative-target',
      roots: ['mechanism.root.negative-target'],
      semanticClaim: 'This claim sounds blocked and difficult.',
      semanticQuestion: 'What blocks progress?',
      relationKind: 'RELATIONAL'
    }),
    mechanismCandidate({
      id: 'mechanism.negative-qualifier',
      roots: ['mechanism.root.negative-qualifier'],
      semanticClaim: 'This claim sounds restrictive and tense.',
      semanticQuestion: 'What feels restrictive?',
      relationKind: 'RELATIONAL'
    })
  ]);
  assert.equal(result.classification, 'DISTINCT');
  assert.equal(result.effect, 'NONE');
  assert.notEqual(result.classification, 'COUNTEREVIDENCE');
});

test('conflict, duplicate, and redundancy do not become convergence or counterevidence', () => {
  const conflict = decision([
    placementCandidate('body.moon_x_sign.aries'),
    placementCandidate('body.moon_x_sign.taurus')
  ]);
  assert.equal(conflict.classification, 'CONFLICT');
  assert.equal(conflict.failureState?.code, 'CONFLICTING_BODY_SIGN_PLACEMENT');
  assert.equal(conflict.effect, 'NONE');

  const duplicate = decision([
    mechanismCandidate({ id: 'mechanism.duplicate-a', roots: ['mechanism.root.duplicate'], factIdentityKey: 'same-fact' }),
    mechanismCandidate({ id: 'mechanism.duplicate-b', roots: ['mechanism.root.duplicate'], factIdentityKey: 'same-fact' })
  ]);
  assert.equal(duplicate.classification, 'DUPLICATE');
  assert.equal(duplicate.uniqueRootCount, 1);

  const redundancy = decision([
    mechanismCandidate({ id: 'mechanism.redundant-a', roots: ['mechanism.root.redundant-a'], readerMeaningKey: 'same-meaning' }),
    mechanismCandidate({ id: 'mechanism.redundant-b', roots: ['mechanism.root.redundant-b'], readerMeaningKey: 'same-meaning' })
  ]);
  assert.equal(redundancy.classification, 'REDUNDANCY');
  assert.equal(redundancy.uniqueRootCount, 2);
  assert.equal(redundancy.effect, 'NONE');
});

test('selector consumes one converged candidate and preserves source state without relational subsumption', () => {
  const convergence = decision([
    mechanismCandidate({ id: 'mechanism.selector-a', roots: ['mechanism.root.selector-a'] }),
    mechanismCandidate({ id: 'mechanism.selector-b', roots: ['mechanism.root.selector-b'] })
  ], { semanticOverlap: admittedSharedQuestion() });
  const selected = policy.selectSynthesisDecision(convergence, {
    birthTimeAuthority: 'UNKNOWN',
    maxCoreThemes: 1
  });
  assert.ok(selected.candidate);
  assert.ok(selected.selector);
  assert.equal(selected.selector.coreThemes.length, 1);
  assert.equal(selected.selector.supportingThemes.length, 0);
  assert.equal(selected.selector.subsumedThemes.length, 0);
  assert.equal(selected.candidate?.synthesisClassification, 'INDEPENDENT_CONVERGENCE');
  assert.equal(selected.candidate?.independentSupportState, 'INDEPENDENTLY_SUPPORTED');
  assert.equal(selected.candidate?.subsumptionState, 'NONE');
  assert.equal(selected.candidate?.sourceThemeStates?.every((source) =>
    source.state === 'CONVERGED_SUPPORTING_SOURCE'
  ), true);
  assert.equal(selected.candidate?.sourceThemeStates?.length, 2);
});

test('selector consumes one qualified theme and does not create a counterevidence card', () => {
  const target = mechanismCandidate({ id: 'mechanism.selector-target', roots: ['mechanism.root.selector-target'], domain: 'WORK_CREATION' });
  const qualifier = mechanismCandidate({ id: 'mechanism.selector-qualifier', roots: ['mechanism.root.selector-qualifier'], domain: 'WORK_CREATION' });
  const qualified = decision([target, qualifier], {
    semanticOverlap: admittedQualifyingQuestion(),
    counterevidence: {
      targetThemeId: target.themeId,
      qualifierThemeId: qualifier.themeId,
      effect: 'QUALIFY'
    }
  });
  const selected = policy.selectSynthesisDecision(qualified, { birthTimeAuthority: 'UNKNOWN' });
  assert.ok(selected.selector);
  assert.equal(selected.selector.coreThemes.length, 1);
  assert.equal(selected.selector.supportingThemes.length, 0);
  assert.equal(selected.selector.subsumedThemes.length, 0);
  assert.equal(selected.selector.suppressedThemes.length, 0);
  assert.equal(selected.candidate?.synthesisClassification, 'COUNTEREVIDENCE');
  assert.equal(selected.candidate?.claimScopeState, 'QUALIFIED');
  assert.equal(selected.candidate?.qualificationState, 'QUALIFICATION_REQUIRED');
});

test('repeated decisions are deterministic and preserve no evidence/intensity/confidence promotion', () => {
  const sources = [
    mechanismCandidate({ id: 'mechanism.deterministic-a', roots: ['mechanism.root.deterministic-a'] }),
    mechanismCandidate({ id: 'mechanism.deterministic-b', roots: ['mechanism.root.deterministic-b'] })
  ];
  const first = decision(sources, { semanticOverlap: admittedSharedQuestion() });
  const second = decision([...sources].reverse(), { semanticOverlap: admittedSharedQuestion() });
  assert.deepEqual(first, second);
  assert.equal(first.direction, 'NEUTRAL');
  assert.equal(first.intensity, 'SUBTLE');
  assert.equal(first.confidence, 'LOW');
  assert.equal(first.uniqueRootCount, 2);
  assert.equal(first.sourceSemanticUnitIds.length, 2);
  assert.equal(first.effect, 'CONVERGE');
});

test('the POC is not wired into the production interpretation index and has no external semantic authority', () => {
  const productionIndex = readFileSync(
    new URL('../src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );
  const source = readFileSync(
    new URL('../src/features/interpretation/chart-level-convergence-counterevidence-poc.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(productionIndex, /chart-level-convergence-counterevidence-poc/iu);
  assert.doesNotMatch(source, /from\s+['"][^'"]*(openai|embedding|vector|similarity)[^'"]*['"]/iu);
  assert.doesNotMatch(source, /score\s*[=:]/iu);
  assert.match(source, /RUNTIME_NOT_ADMITTED/u);
});
