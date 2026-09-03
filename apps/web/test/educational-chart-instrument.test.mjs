import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHART_SEMANTIC_FOCUSES,
  isChartSemanticFocus
} from '../dist/educational-chart-characterization/core/chart/chart-semantic-focus.js';
import {
  EDUCATIONAL_CHART_LAYER_DEFINITIONS,
  EDUCATIONAL_CHART_LAYER_ORDER,
  getEducationalChartLayerDefinition,
  getEducationalChartLesson
} from '../dist/educational-chart-characterization/features/learn/educational-chart-model.js';
import {
  getFoundationsLessonById,
  FOUNDATIONS_LESSONS
} from '../dist/educational-chart-characterization/features/learn/foundations/registry.js';
import {
  getUiMessage,
  UI_CATALOGS,
  validateUiCatalogs
} from '../dist/educational-chart-characterization/lib/ui-catalog.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const EDUCATIONAL_KEYS = [
  'learn.educationalChart.label',
  'learn.educationalChart.chartLabel',
  'learn.educationalChart.controlsLabel',
  'learn.educationalChart.overviewDescription',
  'learn.educationalChart.planets',
  'learn.educationalChart.signs',
  'learn.educationalChart.houses',
  'learn.educationalChart.aspects',
  'learn.educationalChart.selectLayer',
  'learn.educationalChart.planetsDescription',
  'learn.educationalChart.signsDescription',
  'learn.educationalChart.housesDescription',
  'learn.educationalChart.aspectsDescription',
  'learn.educationalChart.learnAbout'
];

const chartRendererSource = readFileSync(
  new URL('../src/core/chart/ChartRenderer.tsx', import.meta.url),
  'utf8'
);
const chartStylesSource = readFileSync(
  new URL('../src/styles/global.css', import.meta.url),
  'utf8'
);
const educationalSource = readFileSync(
  new URL('../src/features/learn/educational-chart-source.ts', import.meta.url),
  'utf8'
);
const educationalComponentSource = readFileSync(
  new URL('../src/features/learn/EducationalChartInstrument.tsx', import.meta.url),
  'utf8'
);
const heroSource = readFileSync(
  new URL('../src/components/EditorialPlanetHero.astro', import.meta.url),
  'utf8'
);
const chartFocusDialogSource = readFileSync(
  new URL('../src/features/chart-workspace/ChartFocusDialog.tsx', import.meta.url),
  'utf8'
);
const mobileChartStylesSource = chartStylesSource.match(
  /@media \(max-width: 767px\)[\s\S]*?(?=\n\s*@media|\s*$)/u
)?.[0] ?? '';

test('Chart Core exposes a closed semantic-focus vocabulary with overview as the default', () => {
  assert.deepEqual([...CHART_SEMANTIC_FOCUSES], [
    'none',
    'planets',
    'signs',
    'houses',
    'aspects'
  ]);
  assert.equal(isChartSemanticFocus('none'), true);
  assert.equal(isChartSemanticFocus('planets'), true);
  assert.equal(isChartSemanticFocus('unknown'), false);
  assert.equal(isChartSemanticFocus(null), false);
  assert.match(chartRendererSource, /semanticFocus\?: ChartSemanticFocus/);
  assert.match(chartRendererSource, /semanticFocus = 'none'/);
  assert.match(chartRendererSource, /data-semantic-focus=\{semanticFocus\}/);
});

test('each educational layer is a presentation-only Chart Core layer', () => {
  assert.deepEqual([...EDUCATIONAL_CHART_LAYER_ORDER], [
    'planets',
    'signs',
    'houses',
    'aspects'
  ]);

  for (const layer of EDUCATIONAL_CHART_LAYER_ORDER) {
    assert.equal(getEducationalChartLayerDefinition(layer).focus, layer);
    assert.match(chartRendererSource, new RegExp(`data-chart-layer="${layer}"`));
    assert.match(chartStylesSource, new RegExp(`data-semantic-focus='${layer}'`));
  }

  assert.doesNotMatch(chartRendererSource, /semanticFocus[\s\S]{0,240}(?:chart\.(?:bodies|houses|aspects)|set[A-Z])/u);
  assert.doesNotMatch(chartRendererSource, /semanticFocus[\s\S]{0,240}longitude/u);
});

test('educational layers resolve to existing canonical Foundations hooks and slugs', () => {
  const expectedLessonIds = {
    planets: 'foundations.jupiter_saturn_outer_planets',
    signs: 'foundations.zodiac_structure',
    houses: 'foundations.houses_angles',
    aspects: 'foundations.aspects'
  };

  for (const [layer, lessonId] of Object.entries(expectedLessonIds)) {
    const definition = EDUCATIONAL_CHART_LAYER_DEFINITIONS[layer];
    assert.equal(definition.lessonId, lessonId, layer);
    const lesson = getFoundationsLessonById(lessonId);
    assert.notEqual(lesson, null, layer);
    assert.equal(getEducationalChartLesson(layer).slug, lesson.slug, layer);
  }

  assert.equal(FOUNDATIONS_LESSONS.length, 12);
});

test('the new Learn UI catalog entries are non-empty and complete in all seven locales', () => {
  assert.deepEqual(Object.keys(UI_CATALOGS), EXPECTED_LOCALES);
  assert.equal(validateUiCatalogs(UI_CATALOGS), true);

  for (const locale of EXPECTED_LOCALES) {
    for (const key of EDUCATIONAL_KEYS) {
      const message = getUiMessage(locale, key);
      assert.equal(typeof message, 'string', `${locale}.${key}`);
      assert.notEqual(message.trim(), '', `${locale}.${key}`);
    }
  }

  assert.equal(getUiMessage('en', 'learn.educationalChart.label'), 'Teaching example');
  assert.equal(getUiMessage('zh-Hant', 'learn.educationalChart.label'), '教學範例');
});

test('Learn consumes the existing mock boundary and never adds a browser science or live-sky path', () => {
  assert.match(educationalSource, /MockEngineClient/);
  assert.match(educationalSource, /calculateChart/);
  assert.doesNotMatch(educationalSource, /HttpEngineClient|fetch\(|axios|astronomy|timezone resolution/iu);
  assert.doesNotMatch(educationalComponentSource, /MockEngineClient|WEB_UI_FIXTURE_V1|fetch\(|axios|astronomy/iu);
  assert.doesNotMatch(educationalComponentSource, /Current sky|Live sky|Live chart|Today's chart/iu);
});

test('Learn replaces the hero teaching surface while retaining the existing brand instrument source', () => {
  assert.match(heroSource, /EducationalChartInstrument/);
  assert.doesNotMatch(heroSource, /NatalNodeBrandInstrument/);
  assert.equal(
    existsSync(new URL('../src/components/brand/NatalNodeBrandInstrument.astro', import.meta.url)),
    true
  );
});

test('Learn embeds a reserved focus-card slot and reuses the shared expandable chart dialog', () => {
  assert.match(educationalComponentSource, /focusCardLayout="reserved"/u);
  assert.match(educationalComponentSource, /ChartFocusDialog/gu);
  assert.match(educationalComponentSource, /aria-controls=\{focusDialogId\}/u);
  assert.match(educationalComponentSource, /aria-expanded=\{isChartFocusOpen\}/u);
  assert.match(educationalComponentSource, /setExpandedSemanticFocus\(activeFocus\)/u);
  assert.match(educationalComponentSource, /setIsChartFocusOpen\(false\)/u);
  assert.match(educationalComponentSource, /document\.body\.classList\.add\('nn-chart-focus-lock'\)/u);
  assert.match(educationalComponentSource, /returnFocusTarget\?\.focus\(\)/u);
  assert.match(chartRendererSource, /focusCardLayout\?: ChartFocusCardLayout/u);
  assert.match(chartRendererSource, /focusCardLayout = 'inline'/u);
  assert.match(chartRendererSource, /nn-chart-focus-card-slot--reserved/u);
  assert.match(chartStylesSource, /\.nn-chart-focus-card-slot--reserved[\s\S]*display:\s*grid/u);
  assert.match(chartStylesSource, /grid-template-columns:\s*minmax\(0, 20rem\)\s+minmax\(0, 1fr\)/u);
  assert.doesNotMatch(mobileChartStylesSource, /nn-chart-focus-card-slot--reserved[\s\S]*min-height/u);
  assert.match(chartFocusDialogSource, /aria-modal="true"/u);
  assert.match(chartFocusDialogSource, /semanticFocus=\{semanticFocus\}/u);
});

test('Learn keeps semantic copy presentation stable and isolates its expanded dialog layout', () => {
  assert.match(educationalComponentSource, /EDUCATIONAL_DETAIL_FOCUSES/u);
  assert.match(educationalComponentSource, /aria-hidden=\{!isActive\}/u);
  assert.match(educationalComponentSource, /tabIndex=\{isActive \? 0 : -1\}/u);
  assert.match(educationalComponentSource, /layoutVariant="educational"/u);
  assert.match(educationalComponentSource, /\bportal\b/u);
  assert.match(chartStylesSource, /nn-educational-chart-instrument__details\s*\{[\s\S]*display:\s*grid/u);
  assert.match(chartStylesSource, /nn-educational-chart-instrument__details-panel\s*\{[\s\S]*grid-area:\s*1 \/ 1[\s\S]*visibility:\s*hidden[\s\S]*pointer-events:\s*none/u);
  assert.match(chartStylesSource, /nn-chart-focus-dialog--educational[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\)/u);
  assert.match(chartStylesSource, /nn-chart-focus-dialog--educational[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)\s+minmax\(17rem, 23rem\)/u);
  assert.match(chartFocusDialogSource, /createPortal\(dialog, document\.body\)/u);
  assert.match(chartFocusDialogSource, /focusCardLayout = 'inline'/u);
  assert.match(chartFocusDialogSource, /layoutVariant = 'default'/u);
  assert.match(chartFocusDialogSource, /portal = false/u);
  assert.match(chartFocusDialogSource, /focusCardLayout=\{focusCardLayout\}/u);
});
