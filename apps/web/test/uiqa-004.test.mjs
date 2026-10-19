import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(relativePath) {
  return readFileSync(new URL(`../src/${relativePath}`, import.meta.url), 'utf8');
}

test('chart sizing stays context-scoped and preserves the Learn instrument footprint', () => {
  const styles = readSource('styles/global.css');
  const chartRenderer = readSource('core/chart/ChartRenderer.tsx');

  assert.match(
    styles,
    /\.nn-chart-workspace \.nn-chart-renderer\[data-presentation-mode='workspace'\] \.nn-chart-renderer__svg[\s\S]*?max-width: 36rem;/u
  );
  assert.match(
    styles,
    /\.nn-chart-renderer\[data-chart-kind='sky'\] \.nn-chart-renderer__svg[\s\S]*?max-width: 36rem;/u
  );
  assert.match(
    styles,
    /\.nn-chart-focus-dialog:not\(\.nn-chart-focus-dialog--educational\) \.nn-chart-renderer\[data-presentation-mode='expanded'\] \.nn-chart-renderer__svg[\s\S]*?max-width: 52rem;/u
  );
  assert.match(
    styles,
    /\.nn-chart-renderer--showcase \.nn-chart-renderer__svg[\s\S]*?max-width: 36rem;/u
  );
  const chartContextStyles = styles.slice(
    styles.indexOf('/* Keep production-facing chart contexts compact'),
    styles.indexOf('  .nn-chart-focus-hint')
  );
  assert.doesNotMatch(chartContextStyles, /transform:\s*scale\(/u);
  assert.match(chartRenderer, /data-chart-kind=\{chartKind\}/u);
  assert.match(chartRenderer, /data-presentation-mode=\{presentationPolicy\.mode\}/u);

  assert.match(
    styles,
    /\.nn-educational-chart-instrument__chart-wrap > div \{\s*width: min\(100%, 20rem\);/u
  );
  assert.match(
    styles,
    /\.nn-educational-chart-instrument__chart-wrap > div \{\s*width: min\(100%, 19rem\);/u
  );
  assert.match(
    styles,
    /\.nn-chart-focus-dialog--educational[\s\S]*?max-width: min\(100%, 42rem, calc\(100dvh - 15rem\)\);/u
  );
});

test('development location output distinguishes entered labels from fixture authority', () => {
  const feedback = readSource('features/chart-input/BirthResolutionFeedback.tsx');
  const resolver = readSource('features/chart-input/development-resolver.ts');
  const form = readSource('features/chart-input/BirthInputForm.tsx');

  assert.match(feedback, /data-resolution-authority="development-fixture"/u);
  assert.match(feedback, /data-location-authority="user-entered"/u);
  assert.match(feedback, /data-location-authority="development-fixture"/u);
  assert.match(feedback, /birthInput\.resolution\.userEnteredLocation/u);
  assert.match(feedback, /birthInput\.resolution\.developmentFixtureLocation/u);
  assert.match(feedback, /birthInput\.resolution\.fixtureExplanation/u);
  assert.match(resolver, /DEVELOPMENT_RESOLVER_NOTICE/u);
  assert.match(resolver, /NOT PRODUCTION RESOLUTION/u);
  assert.match(resolver, /America\/New_York/u);
  assert.doesNotMatch(resolver, /\b(fetch|geocod|axios|timezonefinder)\b/iu);
  assert.doesNotMatch(form, /new DevelopmentBirthInputResolver\(\)/u);
  assert.match(form, /resolver: BirthInputResolver/u);
  const developmentExperience = readSource('features/chart-experience/ChartExperience.tsx');
  assert.match(developmentExperience, /new DevelopmentBirthInputResolver\(\)/u);
  assert.match(developmentExperience, /resolver=\{developmentResolver\}/u);
});

test('Calculation Details localizes human values while preserving fixture and production semantics', () => {
  const details = readSource('features/calculation-details/CalculationDetails.tsx');
  const chartUi = readSource('core/chart/chart-ui.ts');
  const styles = readSource('styles/global.css');
  const catalog = readSource('lib/surface-ui-catalog.ts');

  assert.match(details, /chart\.engineVersion === 'UI_FIXTURE_V1'/u);
  assert.match(details, /calculation\.developmentSource/u);
  assert.match(details, /calculation\.uiFixture/u);
  assert.match(details, /calculation\.fixtureId/u);
  assert.match(details, /calculation\.engineVersion/u);
  assert.match(details, /chartCalculationStatus/u);
  assert.match(details, /chartWarningSeverity/u);
  assert.doesNotMatch(details, /break-all/u);
  assert.doesNotMatch(
    details,
    /label="(?:Engine Version|Chart Schema|Calculation Status|Configuration Status|Astronomy Configuration|Provenance Envelope|Reason)"/u
  );
  assert.match(details, /lg:grid-cols-2/u);
  assert.match(details, /lg:col-span-2/u);
  assert.match(chartUi, /calculation\.complete/u);
  assert.match(chartUi, /calculation\.incompleteResearch/u);
  assert.match(chartUi, /calculation\.severity\.warning/u);
  assert.match(
    styles,
    /\.nn-calculation-details__identifier[\s\S]*?overflow-wrap: anywhere;[\s\S]*?word-break: normal;/u
  );

  for (const key of [
    'birthInput.resolution.userEnteredLocation',
    'birthInput.resolution.developmentFixtureLocation',
    'calculation.developmentSource',
    'calculation.uiFixture',
    'calculation.fixtureId',
    'calculation.complete',
    'calculation.severity.info',
    'calculation.severity.warning',
    'calculation.severity.error'
  ]) {
    assert.match(catalog, new RegExp(`['"]${key.replaceAll('.', '\\.') }['"]`, 'u'), key);
  }
});
