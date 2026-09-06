import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  projectMyChartEvidence
} from '../dist/my-chart-contextual-learn-characterization/features/my-chart/my-chart-evidence-projection.js';

const fixtureChart = {
  calculationStatus: 'INCOMPLETE_RESEARCH',
  schemaVersion: '1.0.0',
  engineVersion: 'UI_FIXTURE_V1',
  bodies: [
    { bodyId: 'Sun', longitude: 45.25, sign: 'Taurus', house: 11, retrograde: false }
  ],
  angles: [{ angleId: 'ASC', longitude: 109.8, sign: 'Cancer' }],
  houses: { system: 'Placidus', cusps: [] },
  aspects: [],
  warnings: [],
  metadata: {
    configurationStatus: 'INCOMPLETE_RESEARCH',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    reason: 'INCOMPLETE_RESEARCH'
  }
};

const projectionSource = readFileSync(
  new URL('../src/features/my-chart/my-chart-evidence-projection.ts', import.meta.url),
  'utf8'
);
const componentSource = readFileSync(
  new URL('../src/features/my-chart/MyChartContextualLearnStageA.tsx', import.meta.url),
  'utf8'
);
const routeSource = readFileSync(
  new URL('../src/pages/dev/my-chart-contextual-learn.astro', import.meta.url),
  'utf8'
);
const styleSource = readFileSync(
  new URL('../src/styles/my-chart-contextual-learn.css', import.meta.url),
  'utf8'
);

test('Stage A projects one supplied body × sign fact without deriving or inventing identity', () => {
  const projection = projectMyChartEvidence(fixtureChart);

  assert.equal(projection.authority, 'DEVELOPMENT_RESEARCH_ONLY');
  assert.equal(projection.developmentDisclosure.label, 'DEVELOPMENT RESEARCH PREVIEW');
  assert.equal(projection.developmentDisclosure.evidence, 'SAMPLE / FIXTURE-BACKED / INCOMPLETE RESEARCH');
  assert.equal(projection.primaryEvidence?.kind, 'BODY_SIGN_PLACEMENT');
  assert.equal(projection.primaryEvidence?.bodyId, 'Sun');
  assert.equal(projection.primaryEvidence?.sign, 'Taurus');
  assert.equal(projection.primaryEvidence?.longitude, 45.25);
  assert.equal(projection.primaryEvidence?.house, 11);
  assert.equal(projection.primaryEvidence?.factIdentity, null);
  assert.match(projectionSource, /ChartResult/u);
  assert.match(projectionSource, /primaryEvidence/u);
  assert.doesNotMatch(projectionSource, /Math.random|Date.now|pseudo.?id/iu);
});

test('Stage A keeps meaning bounded to admitted interpretation content and links existing Foundations', () => {
  const projection = projectMyChartEvidence(fixtureChart);

  assert.equal(projection.meaning.eligibility, 'BOUNDED_EXISTING_CONTENT');
  assert.equal(projection.meaning.source, 'EXISTING_INTERPRETATION_CONTENT');
  assert.match(projection.meaning.text, /identity and vitality/u);
  assert.equal(projection.learn.lessonId, 'foundations.sun_moon');
  assert.equal(projection.learn.slug, 'the-sun-and-moon');
  assert.equal(projection.learn.hookId, 'my_chart.luminaries');
  assert.equal(projection.learn.contentAvailability, 'AVAILABLE');
  assert.match(projection.learn.description, /luminaries|chart components/u);
});

test('Stage A preserves incomplete research metadata and never promotes fixture authority', () => {
  const projection = projectMyChartEvidence(fixtureChart);

  assert.equal(projection.technical.calculationStatus, 'INCOMPLETE_RESEARCH');
  assert.equal(projection.technical.engineVersion, 'UI_FIXTURE_V1');
  assert.equal(projection.technical.astronomyConfigurationId, null);
  assert.equal(projection.technical.provenanceEnvelopeId, null);
  assert.equal(projection.unknownTime.runtimePropagation, 'NOT_AVAILABLE');
  assert.match(projectionSource, /SAMPLE \/ FIXTURE-BACKED \/ INCOMPLETE RESEARCH/u);
  assert.match(componentSource, /developmentDisclosure\.evidence/u);
  assert.match(componentSource, /not a[\s\S]*production personal chart/u);
  assert.doesNotMatch(componentSource, /your (?:real|natal|personal) chart/iu);
});

test('Unknown-time presentation omits time-dependent facts without claiming runtime propagation', () => {
  const projection = projectMyChartEvidence(fixtureChart, 'unknown-time');

  assert.equal(projection.unknownTime.presentationStatus, 'UNKNOWN_TIME_PRESENTATION');
  assert.deepEqual(projection.unknownTime.omittedFacts, ['HOUSES', 'ANGLES', 'HOUSE_BASED_CONTEXT']);
  assert.equal(projection.primaryEvidence?.house, null);
  assert.equal(projection.technical.housesOmitted, true);
  assert.equal(projection.technical.anglesOmitted, true);
  assert.equal(projection.unknownTime.runtimePropagation, 'NOT_AVAILABLE');
  assert.match(componentSource, /data-unknown-time-presentation/u);
  assert.match(componentSource, /unknown-time runtime[\s\S]*propagation is not available/u);
});

test('Stage A presents the required Fact → Meaning → Learn → Technical sequence accessibly', () => {
  assert.match(componentSource, /<h1[^>]*>My Chart<\/h1>/u);
  assert.match(componentSource, /Chart fact/u);
  assert.match(componentSource, /<details/u);
  assert.match(componentSource, /<summary/u);
  assert.match(componentSource, /<AstrologyGlyph/u);
  assert.match(componentSource, /data-my-chart-technical/u);
  assert.match(componentSource, /aria-label=\{evidence\.bodyLabel\}/u);
  assert.match(componentSource, /<a className="my-chart-contextual-learn__learn-link"/u);
  assert.match(styleSource, /focus-visible/u);
  assert.match(styleSource, /prefers-reduced-motion/u);
  assert.doesNotMatch(styleSource, /overflow-x\s*:\s*(?:auto|scroll)/u);
});

test('Route is a noindex development-only sibling and does not alter normal navigation', () => {
  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /NATALNODE_LOCAL_DEV_PREVIEW/u);
  assert.match(routeSource, /robots: 'noindex,nofollow'/u);
  assert.match(routeSource, /getEducationalChart/u);
  assert.doesNotMatch(routeSource, /HttpEngineClient|fetch\(|axios|Provider|ENGINE_API_URL/iu);
  assert.doesNotMatch(routeSource, /<nav|href=/u);
});

test('Default presentation retains the stable primary fact while unknown-time removes only time-dependent detail', () => {
  const defaultProjection = projectMyChartEvidence(fixtureChart, 'default');
  const unknownProjection = projectMyChartEvidence(fixtureChart, 'unknown-time');

  assert.equal(defaultProjection.primaryEvidence?.bodyId, unknownProjection.primaryEvidence?.bodyId);
  assert.equal(defaultProjection.primaryEvidence?.sign, unknownProjection.primaryEvidence?.sign);
  assert.equal(defaultProjection.primaryEvidence?.house, 11);
  assert.equal(unknownProjection.primaryEvidence?.house, null);
});
