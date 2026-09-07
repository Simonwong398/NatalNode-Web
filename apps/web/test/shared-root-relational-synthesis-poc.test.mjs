import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const poc = await import(
  new URL(
    '../dist/shared-root-relational-synthesis-poc-characterization/features/interpretation/shared-root-relational-synthesis-poc.js',
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

function placement(compositionId) {
  const rule = placementRules.get(compositionId);
  assert.ok(rule, `missing placement rule ${compositionId}`);
  return poc.createSharedRootPlacementSignal(rule);
}

function aspect(compositionId = 'body.moon_x_aspect.conjunction_x_body.mercury') {
  const rule = aspectRules.get(compositionId);
  assert.ok(rule, `missing aspect rule ${compositionId}`);
  return poc.createAspectSignalResearchInput(rule);
}

function synthesize(signals, options = {}) {
  return poc.synthesizeSharedRootRelationalSignals(signals, options);
}

const moonAries = placement('body.moon_x_sign.aries');
const mercuryAries = placement('body.mercury_x_sign.aries');
const moonTaurus = placement('body.moon_x_sign.taurus');
const moonMercuryConjunction = aspect();

test('positive bundle keeps two roots, three semantic units, and one relationally enriched theme', () => {
  const result = synthesize(
    [moonAries, mercuryAries, moonMercuryConjunction],
    { birthTimeAuthority: 'KNOWN' }
  );

  assert.equal(result.coherence.status, 'COHERENT');
  assert.equal(result.classification, 'RELATIONAL_ENRICHMENT');
  assert.equal(result.eligibleSignals.length, 3);
  assert.equal(result.suppressedSignals.length, 0);
  assert.equal(result.accounting.semanticUnitCount, 3);
  assert.equal(result.accounting.placementSemanticUnitCount, 2);
  assert.equal(result.accounting.relationalSemanticUnitCount, 1);
  assert.equal(result.accounting.relationalSemanticDimensionCount, 3);
  assert.equal(result.accounting.uniqueRootCount, 2);
  assert.deepEqual(result.accounting.uniqueRootKeys, [
    'body.mercury.position',
    'body.moon.position'
  ]);
  assert.equal(result.accounting.independentEvidenceUnitCount, 2);
  assert.equal(result.accounting.relationalFactIndependentEvidenceIncrement, 0);
  assert.equal(result.accounting.evidenceInflation, 0);

  assert.equal(result.synthesis.placementThemesBefore.length, 2);
  assert.equal(result.synthesis.enrichedThemes.length, 1);
  assert.equal(result.synthesis.outputThemes.length, 1);
  assert.equal(result.synthesis.standaloneAspectThemeCount, 0);
  const enriched = result.synthesis.enrichedThemes[0];
  assert.ok(enriched);
  assert.equal(enriched.semanticUnitCount, 3);
  assert.deepEqual(enriched.semanticDepth, {
    beforePlacementUnitCount: 2,
    afterRelationalUnitCount: 3,
    increased: true
  });
  assert.equal(enriched.uniqueRootCount, 2);
  assert.equal(enriched.convergence.status, 'RELATIONAL_ENRICHMENT');
  assert.equal(enriched.subsumptionState, 'SUBSUMES_PLACEMENT_THEMES');
  assert.equal(enriched.subsumedThemeIds.length, 2);
  assert.deepEqual(
    [...enriched.subsumedThemeIds].sort(),
    result.synthesis.placementThemesBefore.map((theme) => theme.themeId).sort()
  );
  assert.equal(enriched.domain, 'COMMUNICATION');
  assert.equal(enriched.domainDerivation.method, 'INTEGRATED_THEME_SEMANTICS');
  assert.equal(enriched.domainDerivation.majorityVote, false);
  assert.equal(enriched.direction, 'NEUTRAL');
  assert.equal(enriched.intensity, 'SUBTLE');
  assert.equal(enriched.confidence, 'LOW');
  assert.match(enriched.editorial.pattern, /response.*naming|naming.*response/u);
});

test('aspect accounting separates semantic dimensions from semantic units and roots', () => {
  assert.equal(moonMercuryConjunction.semanticUnit.type, 'BODY_ASPECT_BODY');
  assert.equal(moonMercuryConjunction.semanticUnit.count, 1);
  assert.equal(moonMercuryConjunction.semanticDimensions.count, 3);
  assert.deepEqual(moonMercuryConjunction.semanticDimensions.values, [
    'BODY_A_FUNCTION',
    'BODY_B_FUNCTION',
    'ASPECT_RELATIONAL_OPERATOR'
  ]);
  assert.deepEqual(moonMercuryConjunction.evidenceLineage.evidenceRootKeys, [
    'body.mercury.position',
    'body.moon.position'
  ]);
  assert.equal(moonMercuryConjunction.evidenceLineage.uniqueRootCount, 2);
  assert.equal(moonMercuryConjunction.evidenceLineage.relationalFactIndependentEvidenceIncrement, 0);

  const result = synthesize(
    [moonAries, mercuryAries, moonMercuryConjunction],
    { birthTimeAuthority: 'KNOWN' }
  );
  assert.deepEqual(
    new Set(result.accounting.semanticUnitIds),
    new Set([
      'semantic-unit.placement.body.moon.sign.aries',
      'semantic-unit.placement.body.mercury.sign.aries',
      'semantic-unit.relational.body.moon_aspect.conjunction_body.mercury'
    ])
  );
  assert.equal(result.accounting.semanticUnitIds.length, 3);
  assert.equal(result.accounting.uniqueRootKeys.length, 2);
});

test('all four representative Aspect rules preserve their relational meanings without adding roots', () => {
  for (const rule of aspectArtifact.rules) {
    const signal = poc.createAspectSignalResearchInput(rule);
    assert.equal(signal.compositionId, rule.compositionId);
    assert.equal(signal.domain, rule.eligibleDomain);
    assert.equal(signal.direction, rule.direction);
    assert.equal(signal.intensity, rule.candidateIntensity);
    assert.equal(signal.confidence, rule.candidateConfidence);
    assert.equal(signal.semanticUnit.id, rule.semanticUnit.id);
    assert.equal(signal.semanticUnit.count, 1);
    assert.equal(signal.semanticDimensions.count, 3);
    assert.deepEqual(signal.evidenceLineage.evidenceRootKeys, [
      'body.mercury.position',
      'body.moon.position'
    ]);
    assert.equal(signal.evidenceLineage.relationalFactIndependentEvidenceIncrement, 0);
  }
});

test('placement-only bundle remains two separate themes with no relational enrichment', () => {
  const result = synthesize([moonAries, mercuryAries]);

  assert.equal(result.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(result.accounting.semanticUnitCount, 2);
  assert.equal(result.accounting.uniqueRootCount, 2);
  assert.equal(result.accounting.relationalSemanticUnitCount, 0);
  assert.equal(result.synthesis.enrichedThemes.length, 0);
  assert.equal(result.synthesis.outputThemes.length, 2);
  assert.equal(result.synthesis.standaloneAspectThemeCount, 0);
  assert.ok(result.synthesis.outputThemes.every((theme) => theme.intensity === 'SUBTLE'));
  assert.ok(result.synthesis.outputThemes.every((theme) => theme.confidence === 'LOW'));
});

test('duplicate aspect is REDUNDANCY at input while the surviving bundle remains one enrichment', () => {
  const result = synthesize(
    [moonAries, mercuryAries, moonMercuryConjunction, moonMercuryConjunction],
    { birthTimeAuthority: 'KNOWN' }
  );

  assert.equal(result.classification, 'RELATIONAL_ENRICHMENT');
  assert.equal(result.accounting.semanticUnitCount, 3);
  assert.equal(result.accounting.uniqueRootCount, 2);
  assert.equal(result.suppressedSignals.length, 1);
  assert.deepEqual(result.suppressedSignals[0], {
    signalId: moonMercuryConjunction.signalId,
    reason: 'DUPLICATE_RELATIONAL_FACT'
  });
  assert.equal(result.synthesis.enrichedThemes.length, 1);
  assert.equal(result.synthesis.outputThemes.length, 1);
  assert.equal(result.synthesis.enrichedThemes[0].intensity, 'SUBTLE');
  assert.equal(result.synthesis.enrichedThemes[0].confidence, 'LOW');
});

test('shared roots alone do not qualify as semantic compatibility', () => {
  const decision = poc.evaluateRelationalCompatibility(
    [moonAries, mercuryAries],
    moonMercuryConjunction,
    { integratedSemanticBasisIds: ['body.venus', 'aspect.relation.conjunction'] }
  );

  assert.equal(decision.status, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(decision.ruleId, null);
  assert.match(decision.reason, /shared roots.*semantic basis/iu);
  assert.deepEqual(decision.sharedRootKeys, [
    'body.mercury.position',
    'body.moon.position'
  ]);
});

test('a compatible aspect is relational enrichment, not independent convergence or evidence promotion', () => {
  const decision = poc.evaluateRelationalCompatibility(
    [moonAries, mercuryAries],
    moonMercuryConjunction
  );
  assert.equal(decision.status, 'RELATIONAL_ENRICHMENT');
  assert.equal(decision.ruleId, 'shared-root-relational.compatibility.moon-mercury-conjunction');
  assert.match(decision.reason, /shared roots alone are insufficient/u);

  const result = synthesize(
    [moonAries, mercuryAries, moonMercuryConjunction],
    { birthTimeAuthority: 'KNOWN' }
  );
  const theme = result.synthesis.enrichedThemes[0];
  assert.equal(theme.convergence.independentEvidenceKeys.length, 0);
  assert.equal(theme.direction, 'NEUTRAL');
  assert.equal(theme.intensity, 'SUBTLE');
  assert.equal(theme.confidence, 'LOW');
});

test('same placement duplicate is distinct from a body-sign conflict', () => {
  const duplicate = synthesize([moonAries, moonAries]);
  assert.equal(duplicate.coherence.status, 'COHERENT');
  assert.equal(duplicate.suppressedSignals.length, 1);
  assert.equal(duplicate.suppressedSignals[0].reason, 'DUPLICATE_SAME_PLACEMENT');
  assert.equal(duplicate.synthesis.outputThemes.length, 1);

  const conflict = synthesize([moonAries, moonTaurus, mercuryAries, moonMercuryConjunction], {
    birthTimeAuthority: 'KNOWN'
  });
  assert.equal(conflict.coherence.status, 'INVALID');
  assert.equal(conflict.classification, 'CONFLICTING_BODY_SIGN_PLACEMENT');
  assert.equal(conflict.suppressedSignals.length, 0);
  assert.equal(conflict.synthesis.outputThemes.length, 0);
  assert.equal(conflict.accounting.semanticUnitCount, 0);
  assert.equal(conflict.eligibleSignals.length, 0);
  assert.equal(conflict.coherence.failures[0].code, 'CONFLICTING_BODY_SIGN_PLACEMENT');
});

test('different bodies may share a sign or occupy different signs', () => {
  const sameSign = synthesize([moonAries, mercuryAries]);
  const differentSigns = synthesize([moonTaurus, mercuryAries]);

  assert.equal(sameSign.coherence.status, 'COHERENT');
  assert.equal(differentSigns.coherence.status, 'COHERENT');
  assert.equal(sameSign.synthesis.outputThemes.length, 2);
  assert.equal(differentSigns.synthesis.outputThemes.length, 2);
});

test('unknown-time scenario stays placement-only and forbids fabricated time-dependent content', () => {
  const result = synthesize(
    [moonTaurus, mercuryAries],
    { birthTimeAuthority: 'UNKNOWN' }
  );

  assert.equal(result.birthTimeAuthority, 'UNKNOWN');
  assert.equal(result.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(result.accounting.semanticUnitCount, 2);
  assert.equal(result.accounting.uniqueRootCount, 2);
  assert.equal(result.synthesis.outputThemes.length, 2);
  assert.equal(result.synthesis.enrichedThemes.length, 0);
  const userFacingEditorial = result.synthesis.outputThemes.map((theme) => ({
    recognition: theme.editorial.recognition,
    strength: theme.editorial.strength,
    pattern: theme.editorial.pattern,
    tension: theme.editorial.tension,
    lever: theme.editorial.lever
  }));
  assert.doesNotMatch(JSON.stringify(userFacingEditorial), /noon|midnight|fabricated-time|house-derived-theme/u);
  assert.ok(result.synthesis.outputThemes.every((theme) =>
    theme.evidenceRefs.every((reference) =>
      reference.factKind === 'OTHER' &&
      !/\/angles\/|\/house/u.test(reference.canonicalPath)
    )
  ));
  assert.ok(result.synthesis.outputThemes.every((theme) =>
    theme.authorityRequirements.birthTimeDependency === 'UNKNOWN_TIME_SAFE'
  ));
});

test('unknown-time aspect is suppressed instead of fabricating certification', () => {
  const result = synthesize([moonAries, mercuryAries, moonMercuryConjunction]);

  assert.equal(result.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(result.suppressedSignals.length, 1);
  assert.deepEqual(result.suppressedSignals[0], {
    signalId: moonMercuryConjunction.signalId,
    reason: 'UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION'
  });
  assert.equal(result.accounting.semanticUnitCount, 2);
  assert.equal(result.synthesis.outputThemes.length, 2);
});

test('result and provenance are deterministic, separately trace placement and aspect chains, and preserve WHY/LEARN', () => {
  const first = synthesize(
    [moonAries, mercuryAries, moonMercuryConjunction],
    { birthTimeAuthority: 'KNOWN' }
  );
  const second = synthesize(
    [moonMercuryConjunction, mercuryAries, moonAries],
    { birthTimeAuthority: 'KNOWN' }
  );
  assert.deepEqual(first, second);

  const theme = first.synthesis.enrichedThemes[0];
  assert.equal(theme.provenance.placementChains.length, 2);
  assert.equal(theme.provenance.aspectChain.signalId, moonMercuryConjunction.signalId);
  assert.ok(theme.provenance.placementChains.every((chain) => chain.evidenceRootKey.endsWith('.position')));
  assert.equal(theme.provenance.aspectChain.sourceFactRefs[0].factKind, 'NATAL_ASPECT');
  assert.equal(theme.editorial.why.compatibilityRule.id, 'shared-root-relational.compatibility.moon-mercury-conjunction');
  assert.equal(theme.editorial.why.sourceSemanticUnitIds.length, 3);
  assert.ok(theme.editorial.learnReferences.some((reference) => reference.objectId === 'body.moon'));
  assert.ok(theme.editorial.learnReferences.some((reference) => reference.objectId === 'body.mercury'));
  assert.ok(theme.editorial.learnReferences.some((reference) => reference.objectId === 'aspect.conjunction'));
});

test('POC remains outside production wiring and never creates fake Engine authority', () => {
  const source = readFileSync(
    new URL('../src/features/interpretation/shared-root-relational-synthesis-poc.ts', import.meta.url),
    'utf8'
  );
  const interpretationIndex = readFileSync(
    new URL('../src/features/interpretation/index.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /AUTHORITATIVE_ENGINE/u);
  assert.doesNotMatch(source, /fetch\(|openai|calculateAstronomy/u);
  assert.doesNotMatch(interpretationIndex, /shared-root-relational-synthesis-poc/u);
  assert.equal(moonMercuryConjunction.authority, 'DEVELOPMENT_ONLY');
  assert.equal(moonMercuryConjunction.provenance.sourceAuthority, 'INCOMPLETE_RESEARCH');
  assert.equal(moonMercuryConjunction.birthTimeRequirement.requiresAuthoritativeCertification, true);
});
