import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_LOCALE,
  LOCALE_ORDER,
  LOCALE_REGISTRY,
  SUPPORTED_LOCALES,
  getLocaleIndependentPath,
  getLocaleFromPath,
  getLocalizedPath,
  getPresentationLocale,
  normalizeBrowserLocale,
  parseAcceptLanguage,
  parseLocalePath,
  parseSupportedLocale,
  resolveBrowserLocale,
  resolveLocale,
  resolveRequestLocale,
  resolveRootLocale
} from '../dist/localization-characterization/lib/localization.js';

test('the locale registry is exactly the frozen seven-locale set and order', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant']);
  assert.deepEqual(LOCALE_ORDER, SUPPORTED_LOCALES);
  assert.deepEqual(
    LOCALE_REGISTRY.map(({ id, displayName }) => ({ id, displayName })),
    [
      { id: 'en', displayName: 'English' },
      { id: 'es', displayName: 'Español' },
      { id: 'fr', displayName: 'Français' },
      { id: 'de', displayName: 'Deutsch' },
      { id: 'ja', displayName: '日本語' },
      { id: 'ko', displayName: '한국어' },
      { id: 'zh-Hant', displayName: '繁體中文' }
    ]
  );
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(parseSupportedLocale('zh-Hant'), 'zh-Hant');
  assert.equal(parseSupportedLocale('zh-Hans'), null);
  assert.equal(parseSupportedLocale('/ja'), null);
  assert.equal(parseSupportedLocale('ja/'), null);
  assert.equal(parseSupportedLocale(''), null);
});

test('browser locale normalization stays within the closed registry', () => {
  const supportedSamples = [
    ['en-US', 'en'],
    ['es-MX', 'es'],
    ['fr-CA', 'fr'],
    ['de-AT', 'de'],
    ['ja-JP', 'ja'],
    ['ko-KR', 'ko'],
    ['zh-TW', 'zh-Hant'],
    ['zh-HK', 'zh-Hant'],
    ['zh-MO', 'zh-Hant'],
    ['zh-Hant-TW', 'zh-Hant']
  ];

  for (const [input, expected] of supportedSamples) {
    assert.equal(normalizeBrowserLocale(input), expected, input);
  }

  for (const input of ['zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-TW', 'pt-BR']) {
    assert.equal(normalizeBrowserLocale(input), 'en', input);
  }

  for (const input of [null, undefined, '', '  ', 'en_US', '/ja', 'ja/']) {
    assert.equal(normalizeBrowserLocale(input), 'en', String(input));
  }
});

test('Accept-Language parsing orders valid entries by q-value and ignores malformed entries', () => {
  assert.deepEqual(
    parseAcceptLanguage('fr-CA;q=0.4, ja-JP;q=0.9, en-US, de-DE;q=0.000'),
    [
      { tag: 'en-US', quality: 1, order: 2 },
      { tag: 'ja-JP', quality: 0.9, order: 1 },
      { tag: 'fr-CA', quality: 0.4, order: 0 },
      { tag: 'de-DE', quality: 0, order: 3 }
    ]
  );
  assert.deepEqual(
    parseAcceptLanguage('pt-BR;q=bogus,, zh-Hans;q=1.1, ko-KR;q=0.8'),
    [{ tag: 'ko-KR', quality: 0.8, order: 3 }]
  );
  assert.equal(resolveBrowserLocale('pt-BR;q=1,ja-JP;q=0.8'), 'ja');
  assert.equal(resolveBrowserLocale('*;q=1,ja-JP;q=0.8'), 'en');
  assert.equal(resolveBrowserLocale('pt-BR'), 'en');
});

test('explicit URL locale is authoritative over browser and future preference input', () => {
  const japanese = resolveRequestLocale({
    pathname: '/ja/calculate',
    preferredLocale: 'en',
    acceptLanguage: 'en-US'
  });
  const english = resolveRequestLocale({
    pathname: '/en/calculate',
    preferredLocale: 'ja',
    acceptLanguage: 'ja-JP'
  });

  assert.equal(japanese.locale, 'ja');
  assert.equal(japanese.source, 'url');
  assert.equal(english.locale, 'en');
  assert.equal(english.source, 'url');
  assert.equal(getLocaleFromPath('/zh-Hant/vault'), 'zh-Hant');
  assert.equal(getPresentationLocale('/en/account', 'ja'), 'en');
});

test('root negotiation uses the supported browser locale, English fallback, and optional preference precedence', () => {
  assert.equal(resolveRootLocale({ browserLocale: 'ja-JP' }), 'ja');
  assert.equal(resolveRootLocale({ browserLocale: 'pt-BR' }), 'en');
  assert.equal(
    resolveLocale({ preferredLocale: 'es', browserLocale: 'ja-JP' }).locale,
    'es'
  );
  assert.equal(
    resolveLocale({ preferredLocale: 'zh-Hans', browserLocale: 'ja-JP' }).locale,
    'ja'
  );
});

test('locale path helpers preserve route identity, query, fragment, and zh-Hant as one segment', () => {
  const localized = getLocalizedPath('ja', '/en/chart/abc?tab=details#facts');

  assert.equal(localized, '/ja/chart/abc?tab=details#facts');
  assert.equal(getLocaleIndependentPath(localized), '/chart/abc?tab=details#facts');
  assert.equal(getLocalizedPath('zh-Hant', '/vault'), '/zh-Hant/vault');
  assert.deepEqual(parseLocalePath('/zh-Hant/vault'), {
    kind: 'localized',
    pathname: '/zh-Hant/vault',
    remainder: '/vault',
    locale: 'zh-Hant',
    localeSegment: 'zh-Hant'
  });
  assert.throws(() => getLocalizedPath('ja', '/pt/chart'), TypeError);
});

test('machine routes remain outside locale presentation routing and invalid locale prefixes stay rejected', () => {
  assert.equal(parseLocalePath('/api/auth/session').kind, 'machine');
  assert.equal(parseLocalePath('/robots.txt').kind, 'machine');
  assert.equal(getLocalizedPath('ja', '/api/auth/session'), '/api/auth/session');
  const legacy = resolveRequestLocale({ pathname: '/about', acceptLanguage: 'ja-JP' });
  assert.equal(legacy.path.kind, 'unlocalized');
  assert.equal(legacy.locale, 'ja');
  assert.equal(legacy.source, 'browser');
  assert.equal(parseLocalePath('/pt/chart').kind, 'invalid');
  assert.equal(parseLocalePath('/zh-CN/chart').kind, 'invalid');
  assert.equal(resolveRequestLocale({ pathname: '/pt/chart', acceptLanguage: 'ja-JP' }).locale, 'en');
});
