import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  SIGN_CLASSIFICATIONS
} from '../dist/discover-002-characterization/core/astrology-taxonomy/chart-taxonomy.js';
import {
  SUPPORTED_LOCALES
} from '../dist/discover-002-characterization/lib/localization.js';
import {
  ELEMENT_PAIR_CONTENT,
  ELEMENT_PAIR_KEYS,
  MODALITY_PAIR_CONTENT,
  MODALITY_PAIR_KEYS,
  getElementPairContent,
  getElementPairKey,
  getModalityPairContent,
  getModalityPairKey
} from '../dist/discover-002-characterization/content/discover/sign-match.js';
import {
  ELEMENT_ORDER,
  MODALITY_ORDER,
  ZODIAC_CROSS_CLASSIFICATION
} from '../dist/discover-002-characterization/content/discover/elements-modes.js';
import {
  DEFAULT_SIGN_MATCH_PAIR,
  parseSignMatchSearch
} from '../dist/discover-002-characterization/features/discover/sign-match.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const EXPECTED_SIGN_IDS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
];

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const matchContentSource = source('../src/content/discover/sign-match.ts');
const elementsContentSource = source('../src/content/discover/elements-modes.ts');
const matchFeatureSource = source('../src/features/discover/SignMatch.tsx');
const matchModelSource = source('../src/features/discover/sign-match.ts');
const elementsFeatureSource = source('../src/features/discover/ElementsModesExplorer.tsx');
const linksSource = source('../src/features/discover/discover-links.ts');
const landingSource = source('../src/pages/discover/index.astro');
const matchPageSource = source('../src/pages/discover/match/index.astro');
const localizedMatchRouteSource = source('../src/pages/[locale]/discover/match/index.astro');
const elementsPageSource = source('../src/pages/discover/elements-modes/index.astro');
const localizedElementsRouteSource = source('../src/pages/[locale]/discover/elements-modes/index.astro');
const zodiacFeatureSource = source('../src/features/discover/ZodiacExplorer.tsx');
const sitemapSource = source('../src/pages/sitemap.xml.ts');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Sign Match uses the canonical twelve sign IDs and accepts valid query state', () => {
  assert.deepEqual(SIGN_CLASSIFICATIONS.map(({ id }) => id), EXPECTED_SIGN_IDS);
  assert.deepEqual(parseSignMatchSearch('?a=scorpio&b=pisces'), {
    signA: 'scorpio',
    signB: 'pisces'
  });
  assert.deepEqual(parseSignMatchSearch('?a=aries&b=aries'), {
    signA: 'aries',
    signB: 'aries'
  });
  assert.match(matchModelSource, /params\.get\('a'\)/u);
  assert.match(matchModelSource, /params\.get\('b'\)/u);
});

test('invalid query state fails safely and pair order reuses one model', () => {
  assert.deepEqual(parseSignMatchSearch('?a=not-a-sign&b=also-invalid'), DEFAULT_SIGN_MATCH_PAIR);
  assert.deepEqual(parseSignMatchSearch('?a=scorpio&b=not-a-sign'), {
    signA: 'scorpio',
    signB: DEFAULT_SIGN_MATCH_PAIR.signB
  });
  assert.equal(getElementPairKey('Fire', 'Water'), getElementPairKey('Water', 'Fire'));
  assert.equal(getModalityPairKey('Cardinal', 'Fixed'), getModalityPairKey('Fixed', 'Cardinal'));
  assert.equal(getElementPairContent('Fire', 'Water', 'en'), getElementPairContent('Water', 'Fire', 'en'));
  assert.equal(getModalityPairContent('Cardinal', 'Mutable', 'en'), getModalityPairContent('Mutable', 'Cardinal', 'en'));
  assert.match(matchFeatureSource, /history\.pushState/u);
  assert.match(matchFeatureSource, /popstate/u);
});

test('element and modality relationship catalogs have the exact bounded sizes', () => {
  assert.equal(ELEMENT_PAIR_KEYS.length, 10);
  assert.equal(MODALITY_PAIR_KEYS.length, 6);
  assert.equal(Object.keys(ELEMENT_PAIR_CONTENT.en).length, 10);
  assert.equal(Object.keys(MODALITY_PAIR_CONTENT.en).length, 6);
  assert.doesNotMatch(matchContentSource, /aries.*scorpio|scorpio.*pisces/isu);
  assert.doesNotMatch(matchFeatureSource, /%|\b(?:score|soulmate|perfect match|bad match|toxic)\b/iu);
});

test('Elements & Modes derives a complete one-cell-per-sign matrix from Core', () => {
  assert.deepEqual(ELEMENT_ORDER, ['Fire', 'Earth', 'Air', 'Water']);
  assert.deepEqual(MODALITY_ORDER, ['Cardinal', 'Fixed', 'Mutable']);
  assert.equal(ZODIAC_CROSS_CLASSIFICATION.length, 12);
  assert.equal(new Set(ZODIAC_CROSS_CLASSIFICATION.map(({ signId }) => signId)).size, 12);
  assert.deepEqual(
    [...new Set(ZODIAC_CROSS_CLASSIFICATION.map(({ signId }) => signId))].sort(),
    [...EXPECTED_SIGN_IDS].sort()
  );
  assert.equal(new Set(ZODIAC_CROSS_CLASSIFICATION.map(({ element, modality }) => `${element}|${modality}`)).size, 12);
  assert.match(elementsContentSource, /SIGN_CLASSIFICATIONS/u);
  assert.match(elementsContentSource, /ZODIAC_ELEMENT_MEMBERS/u);
  assert.match(elementsContentSource, /ZODIAC_MODALITY_MEMBERS/u);
  assert.match(elementsFeatureSource, /getCrossClassificationCell/u);
  assert.doesNotMatch(elementsContentSource, /const\s+(?:signs|members)\s*=\s*\[/u);
});

test('all required Discover relationship content is explicitly localized', () => {
  assert.deepEqual(SUPPORTED_LOCALES, EXPECTED_LOCALES);

  for (const locale of EXPECTED_LOCALES) {
    assert.deepEqual(Object.keys(ELEMENT_PAIR_CONTENT[locale]), [...ELEMENT_PAIR_KEYS], locale);
    assert.deepEqual(Object.keys(MODALITY_PAIR_CONTENT[locale]), [...MODALITY_PAIR_KEYS], locale);
    for (const key of ELEMENT_PAIR_KEYS) {
      assert.notEqual(ELEMENT_PAIR_CONTENT[locale][key].trim(), '', `${locale}/${key}`);
    }
    for (const key of MODALITY_PAIR_KEYS) {
      assert.notEqual(MODALITY_PAIR_CONTENT[locale][key].trim(), '', `${locale}/${key}`);
    }
  }

  assert.doesNotMatch(matchContentSource, /zh-Hans/u);
});

test('Sign Match and Elements & Modes routes are localized, canonical, and query-safe', () => {
  assert.match(matchPageSource, /parseSignMatchSearch\(Astro\.url\.searchParams\)/u);
  assert.match(matchPageSource, /canonical: getLocalizedPath\(locale, routePath\)/u);
  assert.match(matchPageSource, /getDiscoverSeoAlternates\(routePath\)/u);
  assert.match(localizedMatchRouteSource, /getLocaleStaticPaths/u);
  assert.match(elementsPageSource, /getDiscoverSeoAlternates\(routePath\)/u);
  assert.match(localizedElementsRouteSource, /getLocaleStaticPaths/u);
  assert.match(sitemapSource, /\/discover\/match\//u);
  assert.match(sitemapSource, /\/discover\/elements-modes\//u);
  assert.match(sitemapSource, /SUPPORTED_LOCALES\.flatMap/u);
  assert.match(linksSource, /getDiscoverMatchHref/u);
  assert.match(linksSource, /getElementsModesHref/u);
  assert.doesNotMatch(sitemapSource, /a=scorpio|b=pisces/u);
});

test('all three Discover experiences are connected without changing primary navigation', () => {
  assert.match(landingSource, /discover\.signMatchAction/u);
  assert.match(landingSource, /discover\.elementsModesAction/u);
  assert.match(zodiacFeatureSource, /matchHref/u);
  assert.match(zodiacFeatureSource, /elementsModesHref/u);
  assert.match(matchFeatureSource, /elementsModesHref/u);
  assert.match(elementsFeatureSource, /matchHref/u);
  assert.match(landingSource, /discover\.entryAction/u);
});

test('new Discover code remains non-scientific and provider-independent', () => {
  const newSources = [
    matchContentSource,
    elementsContentSource,
    matchModelSource,
    matchFeatureSource,
    elementsFeatureSource,
    matchPageSource,
    elementsPageSource
  ].join('\n');
  assert.doesNotMatch(newSources, /fetch\(|axios|ephemeris|\btransits?\b|house calculation|Sun position calculation|\btimezone\b/iu);
  assert.doesNotMatch(newSources, /zh-Hans/u);
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies ?? {}), /astronomy|ephemeris|three|chart\.js/iu);
  assert.doesNotMatch(JSON.stringify(packageJson.devDependencies ?? {}), /astronomy|ephemeris|three|chart\.js/iu);
});
