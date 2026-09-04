import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ABOUT_CONTENT,
  getAboutContent
} from '../dist/public-content-localization-characterization/content/public/about.js';
import {
  METHODOLOGY_CONTENT,
  getMethodologyContent
} from '../dist/public-content-localization-characterization/content/public/methodology.js';
import {
  createPublicSeo,
  getPublicSeoAlternates
} from '../dist/public-content-localization-characterization/lib/public-seo.js';
import {
  getLocalizedPath,
  SUPPORTED_LOCALES
} from '../dist/public-content-localization-characterization/lib/localization.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const LEARN_ROOT = new URL('../src/content/learn/', import.meta.url);

function readLearnEntry(locale) {
  return readFileSync(
    new URL(
      locale === 'en'
        ? 'what-is-a-natal-chart.md'
        : `${locale}/what-is-a-natal-chart.md`,
      LEARN_ROOT
    ),
    'utf8'
  );
}

function editorialText(page) {
  return [
    page.eyebrow,
    page.title,
    page.description,
    ...page.sections.flatMap((section) => [
      section.eyebrow,
      section.title,
      ...section.paragraphs,
      ...(section.bullets ?? []),
      ...(section.link === undefined
        ? []
        : [section.link.label, section.link.href])
    ])
  ].join('\n');
}

function assertCompleteEditorialPage(page, locale) {
  assert.equal(page.locale, locale);
  assert.notEqual(page.title.trim(), '');
  assert.notEqual(page.description.trim(), '');
  assert.ok(page.sections.length > 0, locale);

  for (const section of page.sections) {
    assert.notEqual(section.id.trim(), '');
    assert.notEqual(section.title.trim(), '');
    assert.ok(section.paragraphs.length > 0 || (section.bullets?.length ?? 0) > 0);

    if (section.link !== undefined) {
      assert.match(section.link.href, /^\//u);
      assert.notEqual(section.link.label.trim(), '');
    }
  }
}

test('About and Methodology have complete independent content for the admitted locale set', () => {
  assert.deepEqual(SUPPORTED_LOCALES, EXPECTED_LOCALES);
  assert.deepEqual(Object.keys(ABOUT_CONTENT), EXPECTED_LOCALES);
  assert.deepEqual(Object.keys(METHODOLOGY_CONTENT), EXPECTED_LOCALES);

  const englishAbout = editorialText(ABOUT_CONTENT.en);
  const englishMethodology = editorialText(METHODOLOGY_CONTENT.en);

  for (const locale of EXPECTED_LOCALES) {
    const about = getAboutContent(locale);
    const methodology = getMethodologyContent(locale);

    assertCompleteEditorialPage(about, locale);
    assertCompleteEditorialPage(methodology, locale);

    if (locale !== 'en') {
      assert.notEqual(editorialText(about), englishAbout, `${locale} About`);
      assert.notEqual(
        editorialText(methodology),
        englishMethodology,
        `${locale} Methodology`
      );
    }
  }

  assert.equal(Object.hasOwn(ABOUT_CONTENT, 'zh-Hans'), false);
  assert.equal(Object.hasOwn(METHODOLOGY_CONTENT, 'zh-Hans'), false);
});

test('public editorial SEO alternates preserve route identity and locale', () => {
  const alternates = getPublicSeoAlternates('/about');

  assert.deepEqual(
    alternates.map(({ locale, url }) => ({ locale, url })),
    [
      ...EXPECTED_LOCALES.map((locale) => ({
        locale,
        url: getLocalizedPath(locale, '/about')
      })),
      { locale: 'x-default', url: '/en/about' }
    ]
  );
  assert.equal(alternates.some(({ locale }) => locale === 'zh-Hans'), false);

  const seo = createPublicSeo(
    'zh-Hant',
    '/methodology',
    '方法論 | NatalNode',
    '可檢視的計算。'
  );
  assert.equal(seo.canonical, '/zh-Hant/methodology');
  assert.equal(seo.title, '方法論 | NatalNode');
  assert.equal(seo.description, '可檢視的計算。');
  assert.equal(seo.alternates?.length, EXPECTED_LOCALES.length + 1);
});

test('Learn entries are locale-explicit and do not silently reuse the English body', () => {
  const englishEntry = readLearnEntry('en');
  const englishBody = englishEntry.split('---').slice(2).join('---').trim();

  for (const locale of EXPECTED_LOCALES) {
    const entry = readLearnEntry(locale);

    assert.match(entry, /^---\r?\n/u, locale);
    assert.match(entry, new RegExp(`^locale: ${locale}$`, 'mu'));
    assert.match(entry, /^contentId: what-is-a-natal-chart$/mu);
    assert.match(entry, new RegExp(`^slug: ${locale}/what-is-a-natal-chart$`, 'mu'));
    assert.doesNotMatch(entry, /zh-Hans/u);

    const body = entry.split('---').slice(2).join('---').trim();
    assert.notEqual(body, '');
    if (locale !== 'en') {
      assert.notEqual(body, englishBody, `${locale} Learn body`);
      assert.doesNotMatch(body, /## The three main inputs/u, locale);
      assert.doesNotMatch(body, /\/en\//u, locale);
    }
  }
});

test('route composition delegates long-form copy to content modules and keeps Learn locale-aware', () => {
  const aboutRoute = readFileSync(
    new URL('../src/pages/about.astro', import.meta.url),
    'utf8'
  );
  const methodologyRoute = readFileSync(
    new URL('../src/pages/methodology.astro', import.meta.url),
    'utf8'
  );
  const learnHubRoute = readFileSync(
    new URL('../src/pages/learn/index.astro', import.meta.url),
    'utf8'
  );

  assert.match(aboutRoute, /getAboutContent\(locale\)/u);
  assert.match(methodologyRoute, /getMethodologyContent\(locale\)/u);
  assert.doesNotMatch(aboutRoute, /A chart can become one opaque result/u);
  assert.doesNotMatch(methodologyRoute, /The Engine owns the calculation/u);
  assert.match(learnHubRoute, /data\.locale === locale/u);
  assert.match(learnHubRoute, /article\.data\.contentId/u);
  assert.doesNotMatch(learnHubRoute, /article\.data\.slug/u);
});

test('localized editorial links keep the active locale instead of hardcoding English', () => {
  for (const locale of EXPECTED_LOCALES) {
    const aboutLink = ABOUT_CONTENT[locale].sections.at(-1)?.link;
    const methodologyLink = METHODOLOGY_CONTENT[locale].sections.at(-1)?.link;

    assert.equal(aboutLink?.href, '/methodology');
    assert.equal(methodologyLink?.href, '/about');
    assert.equal(getLocalizedPath(locale, aboutLink.href), `/${locale}/methodology`);
    assert.equal(getLocalizedPath(locale, methodologyLink.href), `/${locale}/about`);
  }
});
