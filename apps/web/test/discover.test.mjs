import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  SIGN_CLASSIFICATIONS,
  ZODIAC_SIGNS
} from '../dist/discover-characterization/core/astrology-taxonomy/chart-taxonomy.js';
import {
  LOCALE_ORDER,
  SUPPORTED_LOCALES
} from '../dist/discover-characterization/lib/localization.js';
import {
  ZODIAC_ELEMENT_CONTENT,
  ZODIAC_ELEMENT_MEMBERS,
  ZODIAC_MODALITY_CONTENT,
  ZODIAC_MODALITY_MEMBERS,
  ZODIAC_SIGN_CONTENT,
  getZodiacElementContent,
  getZodiacModalityContent,
  getZodiacSignContent
} from '../dist/discover-characterization/content/discover/zodiac.js';

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
const contentSource = source('../src/content/discover/zodiac.ts');
const featureSource = source('../src/features/discover/ZodiacExplorer.tsx');
const linksSource = source('../src/features/discover/discover-links.ts');
const landingSource = source('../src/pages/discover/index.astro');
const explorerPageSource = source('../src/pages/discover/zodiac/index.astro');
const signPageSource = source('../src/pages/discover/zodiac/[sign].astro');
const localizedSignRouteSource = source('../src/pages/[locale]/discover/zodiac/[sign].astro');
const toolsSource = source('../src/pages/tools/index.astro');
const seoSource = source('../src/components/SeoHead.astro');
const sitemapSource = source('../src/pages/sitemap.xml.ts');
const surfaceCatalogSource = source('../src/lib/surface-ui-catalog.ts');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('the canonical zodiac taxonomy exposes exactly twelve stable signs', () => {
  assert.deepEqual(SIGN_CLASSIFICATIONS.map(({ id }) => id), EXPECTED_SIGN_IDS);
  assert.deepEqual(ZODIAC_SIGNS, SIGN_CLASSIFICATIONS.map(({ label }) => label));
  assert.equal(new Set(EXPECTED_SIGN_IDS).size, 12);
});

test('Discover consumes Core taxonomy and only derives family membership from it', () => {
  assert.match(contentSource, /SIGN_CLASSIFICATIONS/u);
  assert.match(contentSource, /collectSignIdsBy/u);
  assert.doesNotMatch(contentSource, /const\s+(?:signs|elements|modalities)\s*=\s*\[/u);
  assert.match(featureSource, /SIGN_CLASSIFICATIONS/u);
  assert.doesNotMatch(featureSource, /const\s+(?:signs|elements|modalities)\s*=\s*\[/u);
});

test('every sign has a valid element, modality, and distinct route identity', () => {
  const classifications = new Map(SIGN_CLASSIFICATIONS.map((sign) => [sign.id, sign]));
  const elementKeys = new Set(['Fire', 'Earth', 'Air', 'Water']);
  const modalityKeys = new Set(['Cardinal', 'Fixed', 'Mutable']);

  for (const sign of SIGN_CLASSIFICATIONS) {
    assert.equal(elementKeys.has(sign.element), true, sign.id);
    assert.equal(modalityKeys.has(sign.modality), true, sign.id);
    assert.equal(classifications.has(sign.id), true, sign.id);
  }

  assert.deepEqual(Object.keys(ZODIAC_ELEMENT_MEMBERS), ['Fire', 'Earth', 'Air', 'Water']);
  assert.deepEqual(Object.keys(ZODIAC_MODALITY_MEMBERS), ['Cardinal', 'Fixed', 'Mutable']);
  assert.equal(new Set(EXPECTED_SIGN_IDS).size, EXPECTED_SIGN_IDS.length);
  assert.match(signPageSource, /SIGN_CLASSIFICATIONS\.find/u);
  assert.match(localizedSignRouteSource, /SIGN_CLASSIFICATIONS\.map/u);
  assert.match(localizedSignRouteSource, /SUPPORTED_LOCALES\.flatMap/u);
});

test('all seven locales contain admitted sign, element, and modality content', () => {
  assert.deepEqual(SUPPORTED_LOCALES, EXPECTED_LOCALES);
  assert.deepEqual(LOCALE_ORDER, EXPECTED_LOCALES);
  assert.deepEqual(Object.keys(ZODIAC_SIGN_CONTENT), EXPECTED_LOCALES);
  assert.deepEqual(Object.keys(ZODIAC_ELEMENT_CONTENT), EXPECTED_LOCALES);
  assert.deepEqual(Object.keys(ZODIAC_MODALITY_CONTENT), EXPECTED_LOCALES);

  for (const locale of EXPECTED_LOCALES) {
    assert.deepEqual(Object.keys(ZODIAC_SIGN_CONTENT[locale]), EXPECTED_SIGN_IDS, locale);

    for (const signId of EXPECTED_SIGN_IDS) {
      const content = getZodiacSignContent(signId, locale);
      assert.equal(content.locale, locale);
      assert.equal(content.signId, signId);
      assert.notEqual(content.summary.trim(), '', `${locale}/${signId} summary`);
      assert.notEqual(content.chartFunction.trim(), '', `${locale}/${signId} chart function`);
    }

    for (const element of Object.keys(ZODIAC_ELEMENT_CONTENT[locale])) {
      assert.notEqual(getZodiacElementContent(element, locale).description.trim(), '');
    }
    for (const modality of Object.keys(ZODIAC_MODALITY_CONTENT[locale])) {
      assert.notEqual(getZodiacModalityContent(modality, locale).description.trim(), '');
    }
  }

  assert.equal(Object.hasOwn(ZODIAC_SIGN_CONTENT, 'zh-Hans'), false);
});

test('Discover bridges to the canonical Foundations identity and existing Calculate route', () => {
  assert.match(linksSource, /capability === 'ZODIAC_STRUCTURE'/u);
  assert.match(linksSource, /lesson\.slug/u);
  assert.match(linksSource, /getLocalizedPath\(locale, '\/'\)/u);
  assert.match(explorerPageSource, /getZodiacFoundationsHref\(locale\)/u);
  assert.match(explorerPageSource, /getCalculateHref\(locale\)/u);
  assert.match(featureSource, /learnHref/u);
  assert.match(featureSource, /calculateHref/u);
});

test('Discover routes are public, localized, crawlable, and connected without an IA redesign', () => {
  assert.match(landingSource, /getDiscoverSeoAlternates\('\/discover\/'\)/u);
  assert.match(explorerPageSource, /getDiscoverSeoAlternates\(routePath\)/u);
  assert.match(signPageSource, /getDiscoverSeoAlternates\(routePath\)/u);
  assert.match(seoSource, /hreflang=\{alternateLocale\}/u);
  assert.match(sitemapSource, /discoverPaths/u);
  assert.match(sitemapSource, /SUPPORTED_LOCALES\.flatMap/u);
  assert.match(toolsSource, /localize\('\/discover\/'\)/u);
  assert.doesNotMatch(landingSource, /robots:\s*'noindex/u);
  assert.doesNotMatch(signPageSource, /robots:\s*'noindex/u);
});

test('Discover remains provider-independent and does not add a second calculation path', () => {
  const discoverSources = discoverSourcesForSafety();
  assert.doesNotMatch(discoverSources, /fetch\(|axios|ephemeris|timezone resolution|current positions|Sun position calculation/iu);
  assert.doesNotMatch(JSON.stringify(packageJson.dependencies ?? {}), /astronomy|ephemeris|three|chart\.js/iu);
  assert.doesNotMatch(JSON.stringify(packageJson.devDependencies ?? {}), /astronomy|ephemeris|three|chart\.js/iu);
  assert.doesNotMatch(discoverSources, /zh-Hans/u);
});

test('the selector is native, complete, disclosed, and does not imply a complete reading', () => {
  assert.match(featureSource, /aria-pressed=\{isSelected\}/u);
  assert.match(featureSource, /aria-current=\{isSelected \? 'page' : undefined\}/u);
  assert.match(featureSource, /type="button"/u);
  assert.match(featureSource, /data-sign-id=\{sign\.id\}/u);
  assert.match(featureSource, /discover\.zodiac\.disclosure/u);
  assert.match(featureSource, /discover\.zodiac\.learnCta/u);
  assert.match(featureSource, /discover\.zodiac\.calculateCta/u);
  assert.match(surfaceCatalogSource, /not a complete natal reading/u);
  assert.doesNotMatch(discoverSourcesForSafety(), /\bbest\b|\bworst\b|soulmate|lucky number|compatibility percentage|\byou will\b/iu);
});

function discoverSourcesForSafety() {
  return [contentSource, featureSource, linksSource, landingSource, explorerPageSource, signPageSource].join('\n');
}
