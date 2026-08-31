import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getLocalizedPath,
  LOCALE_REGISTRY,
  resolveRequestLocale,
  resolveRootLocale
} from '../dist/locale-preference-characterization/lib/localization.js';
import {
  LOCALE_PREFERENCE_COOKIE_NAME,
  LOCALE_PREFERENCE_MAX_AGE_SECONDS,
  parseLocalePreferenceCookie,
  serializeLocalePreferenceCookie,
  writeLocalePreference
} from '../dist/locale-preference-characterization/lib/locale-preference.js';
import {
  buildLocaleSwitchPath,
  selectLocale
} from '../dist/locale-preference-characterization/features/localization/locale-selector.js';

const SUPPORTED_LOCALES = LOCALE_REGISTRY.map(({ id }) => id);

test('root negotiation prefers anonymous preference, then browser language, then English', () => {
  assert.equal(
    resolveRootLocale({ preferredLocale: 'ja', browserLocale: 'en-US' }),
    'ja'
  );
  assert.equal(
    resolveRootLocale({ preferredLocale: 'en', browserLocale: 'ja-JP' }),
    'en'
  );
  assert.equal(resolveRootLocale({ browserLocale: 'es-MX' }), 'es');
  assert.equal(resolveRootLocale({ browserLocale: 'zh-HK' }), 'zh-Hant');
  assert.equal(
    resolveRootLocale({ browserLocale: ['pt-BR', 'ja-JP'] }),
    'ja'
  );
  assert.equal(
    resolveRootLocale({ preferredLocale: 'garbage', browserLocale: 'ko-KR' }),
    'ko'
  );
  assert.equal(resolveRootLocale({ browserLocale: 'pt-BR' }), 'en');
  assert.equal(resolveRootLocale({ browserLocale: '' }), 'en');
  assert.equal(
    getLocalizedPath(
      resolveRootLocale({ browserLocale: 'ja-JP' }),
      '/?ref=x#section'
    ),
    '/ja/?ref=x#section'
  );
});

test('locale preference cookie parser accepts only canonical supported values', () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(
      parseLocalePreferenceCookie(`${LOCALE_PREFERENCE_COOKIE_NAME}=${locale}`),
      locale
    );
  }

  for (const invalid of ['pt', 'zh-CN', 'zh-Hans', '/ja', '../ja', '', 'garbage']) {
    assert.equal(
      parseLocalePreferenceCookie(`${LOCALE_PREFERENCE_COOKIE_NAME}=${invalid}`),
      null,
      invalid
    );
  }

  assert.equal(
    parseLocalePreferenceCookie(`${LOCALE_PREFERENCE_COOKIE_NAME}=%7A%68%2DHant`),
    'zh-Hant'
  );
  assert.equal(
    parseLocalePreferenceCookie('other=ja; natalnode_locale_extra=ko'),
    null
  );
  assert.equal(
    parseLocalePreferenceCookie('other=1; natalnode_locale=ja; another=2'),
    'ja'
  );
  assert.equal(
    parseLocalePreferenceCookie('natalnode_locale=%E0%A4%A'),
    null
  );
  assert.equal(
    parseLocalePreferenceCookie('natalnode_locale=ja; natalnode_locale=en'),
    null
  );
  assert.equal(parseLocalePreferenceCookie(null), null);
  assert.equal(parseLocalePreferenceCookie(undefined), null);
});

test('locale preference cookie writer is finite, browser-readable, and protocol-aware', () => {
  assert.equal(
    serializeLocalePreferenceCookie('ja', false),
    `${LOCALE_PREFERENCE_COOKIE_NAME}=ja; Max-Age=${LOCALE_PREFERENCE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  );
  assert.equal(
    serializeLocalePreferenceCookie('zh-Hant', true),
    `${LOCALE_PREFERENCE_COOKIE_NAME}=zh-Hant; Max-Age=${LOCALE_PREFERENCE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`
  );
  assert.equal(serializeLocalePreferenceCookie('/ja', false), null);
  assert.equal(serializeLocalePreferenceCookie('zh-CN', false), null);
  assert.doesNotMatch(
    serializeLocalePreferenceCookie('ja', true),
    /HttpOnly/iu
  );

  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let written = '';
  const documentValue = {};
  Object.defineProperty(documentValue, 'cookie', {
    configurable: true,
    get: () => written,
    set: (value) => {
      written = value;
    }
  });

  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { protocol: 'https:' } }
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: documentValue
    });
    assert.equal(writeLocalePreference('ja'), true);
    assert.match(written, /^natalnode_locale=ja;/u);
    assert.match(written, /Path=\//u);
    assert.match(written, /SameSite=Lax/u);
    assert.match(written, /Secure/u);

    written = '';
    globalThis.window.location.protocol = 'http:';
    assert.equal(writeLocalePreference('ko'), true);
    assert.doesNotMatch(written, /Secure/u);
    assert.match(written, /^natalnode_locale=ko;/u);
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', previousWindow);
    }
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      Object.defineProperty(globalThis, 'document', previousDocument);
    }
  }
});

test('global selector exposes the frozen native-name order and preserves equivalent routes', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant']);
  assert.deepEqual(
    LOCALE_REGISTRY.map(({ displayName }) => displayName),
    ['English', 'Español', 'Français', 'Deutsch', '日本語', '한국어', '繁體中文']
  );
  assert.equal(
    buildLocaleSwitchPath('ja', '/en/chart/abc?mode=x#details'),
    '/ja/chart/abc?mode=x#details'
  );
  assert.equal(
    buildLocaleSwitchPath('zh-Hant', '/en/learn/guide?mode=x#details'),
    '/zh-Hant/learn/guide?mode=x#details'
  );
  assert.equal(buildLocaleSwitchPath('/ja', '/en/'), null);
  assert.equal(buildLocaleSwitchPath('pt', '/en/'), null);

  const events = [];
  assert.equal(
    selectLocale(
      'ja',
      '/en/chart/abc?mode=x#details',
      (locale) => events.push(['write', locale]),
      (destination) => events.push(['navigate', destination])
    ),
    true
  );
  assert.deepEqual(events, [
    ['write', 'ja'],
    ['navigate', '/ja/chart/abc?mode=x#details']
  ]);

  const navigationAfterWriteFailure = [];
  assert.equal(
    selectLocale(
      'ko',
      '/en/learn/guide?from=selector#intro',
      () => {
        throw new Error('preference storage unavailable');
      },
      (destination) => navigationAfterWriteFailure.push(destination)
    ),
    true
  );
  assert.deepEqual(navigationAfterWriteFailure, ['/ko/learn/guide?from=selector#intro']);
});

test('explicit locale URLs remain authoritative over anonymous preferences', () => {
  const resolution = resolveRequestLocale({
    pathname: '/ja/vault/chart',
    preferredLocale: 'en',
    acceptLanguage: 'en-US'
  });

  assert.equal(resolution.locale, 'ja');
  assert.equal(resolution.source, 'url');
  assert.equal(resolution.path.kind, 'localized');
});

test('root shell and selector stay within the static presentation boundary', () => {
  const selectorSource = readFileSync(
    new URL('../src/components/LanguageSelector.astro', import.meta.url),
    'utf8'
  );
  const shellSource = readFileSync(
    new URL('../src/components/LocaleNegotiationShell.astro', import.meta.url),
    'utf8'
  );
  const layoutSource = readFileSync(
    new URL('../src/layouts/SiteLayout.astro', import.meta.url),
    'utf8'
  );
  const middlewareSource = readFileSync(
    new URL('../src/middleware.ts', import.meta.url),
    'utf8'
  );

  assert.match(selectorSource, /LOCALE_REGISTRY\.map/u);
  assert.match(selectorSource, /selected=\{id === locale\}/u);
  assert.doesNotMatch(selectorSource, /flag|localStorage|sessionStorage/iu);
  assert.match(layoutSource, /LanguageSelector/u);
  assert.match(shellSource, /noindex,nofollow/u);
  assert.match(shellSource, /href="\/en\/"/u);
  assert.match(shellSource, /navigator\.languages/u);
  assert.match(shellSource, /navigator\.language/u);
  assert.match(shellSource, /resolveRootLocale/u);
  assert.match(shellSource, /location\.replace/u);
  assert.doesNotMatch(shellSource, /SiteLayout|ChartExperience|CurrentSky/iu);
  assert.match(middlewareSource, /resolution\.path\.kind === 'unlocalized'/u);
  assert.doesNotMatch(
    middlewareSource,
    /resolution\.path\.kind === 'root'\s*\|\|/u
  );
});
