import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const projectionModule = await import(
  new URL(
    '../dist/relational-my-chart-poc-characterization/features/my-chart/my-chart-relational-content-poc.js',
    import.meta.url
  ).href
);
const sharedRootModule = await import(
  new URL(
    '../dist/relational-my-chart-poc-characterization/features/interpretation/shared-root-relational-synthesis-poc.js',
    import.meta.url
  ).href
);
const componentModule = await import(
  new URL(
    '../dist/relational-my-chart-poc-characterization/features/my-chart/MyChartRelationalPoc.js',
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

function project(scenario) {
  return projectionModule.projectMyChartRelationalContent(
    scenario,
    placementArtifact.rules,
    aspectArtifact.rules
  );
}

function renderScenario(scenario) {
  return renderToStaticMarkup(createElement(componentModule.default, {
    initialScenario: scenario,
    placementRules: placementArtifact.rules,
    aspectRules: aspectArtifact.rules
  }));
}

function primaryReaderText(projection) {
  return JSON.stringify({
    hook: projection.reading.hook,
    introduction: projection.reading.introduction,
    sectionKicker: projection.reading.sectionKicker,
    sectionTitle: projection.reading.sectionTitle,
    sectionBody: projection.reading.sectionBody,
    themes: projection.reading.themes.map((theme) => ({
      title: theme.title,
      domain: theme.domain,
      directionLabel: theme.directionLabel,
      evidence: theme.evidence,
      recognition: theme.recognition,
      constructiveCapacity: theme.constructiveCapacity,
      pattern: theme.pattern,
      tension: theme.tension,
      lever: theme.lever,
      why: theme.why
    }))
  });
}

function technicalText(projection) {
  return JSON.stringify({
    technical: projection.technical,
    themes: projection.reading.themes.map((theme) => theme.technical),
    disclosure: projection.developmentDisclosure
  });
}

test('relational-known-time renders exactly one enriched primary theme', () => {
  const projection = project('relational-known-time');
  assert.equal(projection.authority, 'DEVELOPMENT_ONLY');
  assert.equal(projection.fixture.birthTimeAuthority, 'KNOWN');
  assert.equal(projection.reading.themes.length, 1);
  assert.equal(projection.technical.classification, 'RELATIONAL_ENRICHMENT');
  assert.equal(projection.technical.semanticUnitCount, 3);
  assert.equal(projection.technical.uniqueRootCount, 2);
  assert.equal(projection.technical.sourcePlacementSignalIds.length, 2);
  assert.ok(projection.technical.sourceAspectSignalId);

  const theme = projection.reading.themes[0];
  assert.equal(theme.technical.classification, 'RELATIONAL_ENRICHMENT');
  assert.equal(theme.technical.semanticUnitCount, 3);
  assert.equal(theme.technical.uniqueRootCount, 2);
  assert.equal(theme.technical.sourceSemanticUnitIds.length, 3);
  assert.equal(theme.technical.subsumedThemeIds.length, 2);
  assert.equal(theme.directionLabel, 'An open question');
  assert.equal(theme.technical.direction, 'NEUTRAL');
  assert.equal(theme.technical.intensity, 'SUBTLE');
  assert.equal(theme.technical.confidence, 'LOW');
});

test('relational-known-time owns the relational reader shell and technical trace', () => {
  const projection = project('relational-known-time');
  const html = renderScenario('relational-known-time');

  assert.match(primaryReaderText(projection), /When response becomes language/iu);
  assert.match(primaryReaderText(projection), /one interaction pattern at a time/iu);
  assert.match(html, /data-my-chart-scenario="relational-known-time"/u);
  assert.match(html, /data-my-chart-classification="RELATIONAL_ENRICHMENT"/u);
  assert.match(html, /My Chart · Relational Reading POC/u);
  assert.match(html, /When response becomes language\./u);
  assert.match(html, /When response and naming arrive together/u);
  assert.match(html, /Semantic units<\/dt><dd>3/u);
  assert.match(html, /Aspect Signal ID<\/dt><dd>signal\.aspect/u);
  assert.match(html, /shared-root-relational\.compatibility\.moon-mercury-conjunction@1\.0\.0/u);
  assert.match(html, /personal-theme\.mercury-aries-information-initiation/u);
  assert.match(html, /personal-theme\.moon-aries-response-initiation/u);
});

test('reader theme is derived from the shared-root synthesis output, not a manual theme bypass', () => {
  const moonRule = placementRules.get('body.moon_x_sign.aries');
  const mercuryRule = placementRules.get('body.mercury_x_sign.aries');
  const aspectRule = aspectRules.get('body.moon_x_aspect.conjunction_x_body.mercury');
  assert.ok(moonRule && mercuryRule && aspectRule);
  const synthesis = sharedRootModule.synthesizeSharedRootRelationalSignals([
    sharedRootModule.createSharedRootPlacementSignal(moonRule),
    sharedRootModule.createSharedRootPlacementSignal(mercuryRule),
    sharedRootModule.createAspectSignalResearchInput(aspectRule)
  ], { birthTimeAuthority: 'KNOWN' });
  const projection = project('relational-known-time');

  assert.equal(
    projection.reading.themes[0].themeId,
    synthesis.synthesis.enrichedThemes[0].themeId
  );
  assert.equal(projection.technical.classification, synthesis.classification);

  const projectionSource = readFileSync(
    new URL('../src/features/my-chart/my-chart-relational-content-poc.ts', import.meta.url),
    'utf8'
  );
  assert.match(projectionSource, /synthesizeSharedRootRelationalSignals/u);
  assert.match(projectionSource, /result\.synthesis\.enrichedThemes/u);
  assert.match(projectionSource, /getMyChartPlacementReaderCopy/u);
  assert.doesNotMatch(projectionSource, /themeId:\s*['"]shared-root-relational/u);
  assert.doesNotMatch(projectionSource, /AUTHORITATIVE_ENGINE/u);
});

test('all three source semantic units and both roots remain represented in technical provenance', () => {
  const theme = project('relational-known-time').reading.themes[0];
  assert.deepEqual(new Set(theme.technical.sourceSemanticUnitIds), new Set([
    'semantic-unit.placement.body.moon.sign.aries',
    'semantic-unit.placement.body.mercury.sign.aries',
    'semantic-unit.relational.body.moon_aspect.conjunction_body.mercury'
  ]));
  assert.deepEqual(theme.technical.uniqueRootKeys, [
    'body.mercury.position',
    'body.moon.position'
  ]);
  assert.equal(theme.technical.placementProvenance.length, 2);
  assert.equal(theme.technical.aspectProvenance.length, 3);
  assert.match(theme.technical.aspectProvenance[0], /relational\.body\.moon_aspect\.conjunction_body\.mercury/u);
});

test('relational reader copy explains an interaction pattern unavailable from either placement alone', () => {
  const relational = project('relational-known-time');
  const placementOnly = project('placement-only');
  const relationalText = primaryReaderText(relational);
  const placementText = primaryReaderText(placementOnly);

  assert.match(relationalText, /response.*naming|naming.*response/iu);
  assert.match(relationalText, /close together|close coupling|one more pass/iu);
  assert.match(relational.reading.themes[0].why.synthesis, /Moon in Aries/iu);
  assert.match(relational.reading.themes[0].why.synthesis, /Mercury in Aries/iu);
  assert.match(relational.reading.themes[0].why.synthesis, /Moon conjunct Mercury/iu);
  assert.match(relational.reading.themes[0].why.synthesis, /Together/iu);
  assert.doesNotMatch(placementText, /conjunct|conjunction|close coupling|relational enrichment/iu);
});

test('reader prose preserves bounded meaning without certainty or importance inflation', () => {
  const readerText = primaryReaderText(project('relational-known-time'));
  assert.doesNotMatch(readerText, /one of your defining patterns|deeply wired|powerful configuration|major theme of your life|unusually strong|highly significant|central to who you are|\bdefinitely\b|\balways\b|naturally gifted/iu);
  assert.doesNotMatch(readerText, /semantic unit|root key|compatibility classifier|rule version|evidence accounting|synthesis adapter|INCOMPLETE_RESEARCH|DEVELOPMENT_ONLY|\bSUBTLE\b|\bLOW\b|\bNEUTRAL\b/iu);
  assert.match(readerText, /may|can|sometimes/iu);
});

test('WHY is astrologically recognizable while engineering trace stays outside the primary view', () => {
  const projection = project('relational-known-time');
  const why = projection.reading.themes[0].why;
  assert.deepEqual(why.factors.map((factor) => factor.label), [
    'Moon in Aries',
    'Mercury in Aries',
    'Moon conjunct Mercury'
  ]);
  assert.match(why.factors[0].contribution, /response|receptivity|need/iu);
  assert.match(why.factors[0].contribution, /initiation|immediacy|first move/iu);
  assert.match(why.factors[1].contribution, /naming|interpretation|exchange/iu);
  assert.match(why.factors[2].contribution, /close coupling|concentration/iu);
  assert.doesNotMatch(JSON.stringify(why), /semantic unit|root key|compatibility rule|rule version/iu);
});

test('technical provenance is collapsed by default and exposes the required inspection fields', () => {
  const componentSource = readFileSync(
    new URL('../src/features/my-chart/MyChartRelationalPoc.tsx', import.meta.url),
    'utf8'
  );
  const projection = project('relational-known-time');
  const technical = technicalText(projection);
  assert.match(componentSource, /data-relational-technical/u);
  assert.match(componentSource, /Astrologer's view/u);
  assert.match(componentSource, /Source Aspect Signal/u);
  assert.match(componentSource, /Semantic units/u);
  assert.match(componentSource, /Unique roots/u);
  assert.match(componentSource, /Orb boundary/u);
  assert.match(technical, /RELATIONAL_ENRICHMENT/u);
  assert.match(technical, /shared-root-relational\.compatibility\.moon-mercury-conjunction@1\.0\.0/u);
  assert.match(technical, /RESEARCH_REPRESENTATIVE_SIGNAL|INCOMPLETE_RESEARCH|DEVELOPMENT_ONLY/u);
  assert.doesNotMatch(componentSource, /<details[^>]+open/u);
});

test('placement-only comparison stays fair and contains no Aspect semantics', () => {
  const projection = project('placement-only');
  const readerText = primaryReaderText(projection);
  const html = renderScenario('placement-only');
  assert.equal(projection.reading.themes.length, 2);
  assert.equal(projection.technical.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(projection.technical.semanticUnitCount, 2);
  assert.equal(projection.technical.uniqueRootCount, 2);
  assert.equal(projection.technical.sourceAspectSignalId, null);
  assert.equal(projection.technical.compatibilityRule, null);
  assert.equal(projection.technical.subsumedThemeIds.length, 0);
  assert.doesNotMatch(readerText, /response becomes language|arrive close together|close coupling|conjunct|conjunction|relational enrichment|interaction pattern/iu);
  assert.equal(
    projection.reading.themes.find((theme) => theme.evidence[0] === 'Moon in Aries')?.title,
    'A response that can begin without rushing itself'
  );
  assert.match(html, /data-my-chart-scenario="placement-only"/u);
  assert.match(html, /data-my-chart-classification="NO_RELATIONAL_ENRICHMENT"/u);
  assert.match(html, /My Chart · Placement Reading POC/u);
  assert.match(html, /Two patterns worth noticing\./u);
  assert.match(html, /Core personal themes/u);
  assert.match(html, /What keeps showing up/u);
  assert.match(html, /Semantic units<\/dt><dd>2/u);
  assert.match(html, /Unique roots<\/dt><dd>2/u);
  assert.match(html, /Aspect Signal ID<\/dt><dd>None/u);
  assert.match(html, /Compatibility rule<\/dt><dd>None/u);
  assert.match(html, /Subsumed source themes<\/dt><dd>None/u);
  assert.doesNotMatch(html, /When response becomes language|When response and naming arrive together|arrive close together|close coupling|conjunct|conjunction|Relational Reading POC|data-my-chart-classification="RELATIONAL_ENRICHMENT"|shared-root-relational\.compatibility|semantic-unit\.relational|shared-root-relational\.moon-mercury-conjunction/u);
  assert.ok(projection.reading.themes.every((theme) => theme.evidence.length === 1));
  assert.ok(projection.reading.themes.every((theme) => theme.technical.semanticUnitCount === 1));
  assert.ok(projection.reading.themes.every((theme) => theme.technical.intensity === 'SUBTLE'));
  assert.ok(projection.reading.themes.every((theme) => theme.technical.confidence === 'LOW'));
});

test('unknown-time scenario remains useful without Aspect enrichment or fabricated time', () => {
  const projection = project('unknown-time');
  const readerText = primaryReaderText(projection);
  const html = renderScenario('unknown-time');
  assert.equal(projection.fixture.birthTimeAuthority, 'UNKNOWN');
  assert.equal(projection.unknownTime.presentationStatus, 'UNKNOWN_TIME_READING');
  assert.equal(projection.reading.themes.length, 2);
  assert.equal(projection.technical.classification, 'NO_RELATIONAL_ENRICHMENT');
  assert.equal(projection.technical.semanticUnitCount, 2);
  assert.equal(projection.technical.uniqueRootCount, 2);
  assert.equal(projection.technical.sourceAspectSignalId, null);
  assert.equal(projection.technical.compatibilityRule, null);
  assert.equal(projection.technical.subsumedThemeIds.length, 0);
  assert.match(projection.unknownTime.message, /precise birth time|placements remain useful/iu);
  assert.equal(
    projection.reading.themes.find((theme) => theme.evidence[0] === 'Moon in Taurus')?.title,
    'Steadiness that still leaves room to respond'
  );
  assert.doesNotMatch(readerText, /response becomes language|arrive close together|close coupling|conjunct|conjunction|relational enrichment|interaction pattern|ASC|MC|houses|fabricated time|fake aspect|fake orb|noon|midnight|12:00/iu);
  assert.match(html, /data-my-chart-scenario="unknown-time"/u);
  assert.match(html, /data-my-chart-classification="NO_RELATIONAL_ENRICHMENT"/u);
  assert.match(html, /My Chart · Unknown-Time Reading POC/u);
  assert.match(html, /Two patterns still in view\./u);
  assert.match(html, /Core personal themes/u);
  assert.match(html, /What keeps showing up/u);
  assert.match(html, /Unknown-time reading/u);
  assert.match(html, /Semantic units<\/dt><dd>2/u);
  assert.match(html, /Unique roots<\/dt><dd>2/u);
  assert.match(html, /Aspect Signal ID<\/dt><dd>None/u);
  assert.match(html, /Compatibility rule<\/dt><dd>None/u);
  assert.match(html, /Subsumed source themes<\/dt><dd>None/u);
  assert.doesNotMatch(html, /When response becomes language|When response and naming arrive together|arrive close together|close coupling|conjunct|conjunction|Relational Reading POC|data-my-chart-classification="RELATIONAL_ENRICHMENT"|shared-root-relational\.compatibility|semantic-unit\.relational|shared-root-relational\.moon-mercury-conjunction|A supported personal theme/u);
  assert.ok(projection.reading.themes.every((theme) =>
    theme.technical.birthTimeState.includes('UNKNOWN_TIME_SAFE')
  ));
});

test('Learn bridges include Moon, Mercury, Aries, and conjunction without duplicate destinations', () => {
  const theme = project('relational-known-time').reading.themes[0];
  const labels = theme.learn.map((bridge) => bridge.label);
  assert.ok(labels.some((label) => /Moon/iu.test(label)));
  assert.ok(labels.some((label) => /Mercury/iu.test(label)));
  assert.ok(labels.some((label) => /Aries/iu.test(label)));
  assert.ok(labels.some((label) => /conjunction|major aspects/iu.test(label)));
  assert.equal(
    new Set(theme.learn.map((bridge) => bridge.lessonId ?? bridge.objectId)).size,
    theme.learn.length
  );
  assert.ok(theme.learn.every((bridge) => bridge.contentAvailability === 'AVAILABLE'));
});

test('route isolation preserves the accepted My Chart POC and keeps the new route development-only', () => {
  const routeSource = readFileSync(
    new URL('../src/pages/dev/my-chart-relational.astro', import.meta.url),
    'utf8'
  );
  const existingRouteSource = readFileSync(
    new URL('../src/pages/dev/my-chart-contextual-learn.astro', import.meta.url),
    'utf8'
  );
  assert.match(routeSource, /MyChartRelationalPoc/u);
  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /robots: 'noindex,nofollow'/u);
  assert.match(routeSource, /COMPOSITION_SIGNAL_REPRESENTATIVE_V1\.json/u);
  assert.match(routeSource, /ASPECT_SIGNAL_REPRESENTATIVE_V1\.json/u);
  assert.match(routeSource, /client:only="react"/u);
  assert.doesNotMatch(routeSource, /fetch\(|HttpEngineClient|ENGINE_API_URL|Provider/iu);
  assert.match(existingRouteSource, /MyChartContextualLearnStageA/u);
  assert.doesNotMatch(existingRouteSource, /MyChartRelationalPoc|ASPECT_SIGNAL_REPRESENTATIVE_V1/u);
});

test('contextual Learn bridges resolve to the existing intended destinations', () => {
  const theme = project('relational-known-time').reading.themes[0];
  const bridgesByObjectId = new Map(theme.learn.map((bridge) => [bridge.objectId, bridge]));

  assert.equal(bridgesByObjectId.get('body.moon')?.lessonId, 'foundations.sun_moon');
  assert.equal(bridgesByObjectId.get('body.moon')?.slug, 'the-sun-and-moon');
  assert.equal(bridgesByObjectId.get('body.mercury')?.lessonId, 'foundations.mercury_venus_mars');
  assert.equal(bridgesByObjectId.get('body.mercury')?.slug, 'mercury-venus-and-mars');
  assert.equal(bridgesByObjectId.get('sign.aries')?.lessonId, 'foundations.zodiac_structure');
  assert.equal(bridgesByObjectId.get('sign.aries')?.slug, 'the-zodiac-polarity-elements-and-modes');
  assert.equal(bridgesByObjectId.get('aspect.conjunction')?.lessonId, 'foundations.aspects');
  assert.equal(bridgesByObjectId.get('aspect.conjunction')?.slug, 'aspects-relationships-between-planets');
  assert.ok(theme.learn.every((bridge) => bridge.contentAvailability === 'AVAILABLE'));
});

test('all three scenarios are deterministic and route-selectable', () => {
  for (const scenario of ['relational-known-time', 'placement-only', 'unknown-time']) {
    assert.deepEqual(project(scenario), project(scenario));
  }
  assert.deepEqual(
    project('relational-known-time').reading.themes.map((theme) => theme.themeId),
    ['shared-root-relational.moon-mercury-conjunction']
  );
});
