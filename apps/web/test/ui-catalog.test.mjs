import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CANONICAL_UI_CATALOG,
  UI_CATALOGS,
  UI_MESSAGE_KEYS,
  getUiMessage,
  validateUiCatalogs
} from '../dist/ui-catalog-characterization/lib/ui-catalog.js';
import { DEFAULT_LOCALE } from '../dist/ui-catalog-characterization/lib/localization.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];

test('the UI catalog has exactly the frozen seven locales and no zh-Hans catalog', () => {
  assert.deepEqual(Object.keys(UI_CATALOGS), EXPECTED_LOCALES);
  assert.equal(Object.hasOwn(UI_CATALOGS, 'en'), true);
  assert.equal(Object.hasOwn(UI_CATALOGS, 'zh-Hans'), false);
  assert.equal(Object.hasOwn(UI_CATALOGS, 'pt-BR'), false);
  assert.strictEqual(UI_CATALOGS.en, CANONICAL_UI_CATALOG);
});

test('the catalog keys are stable, unique, semantic identities with exact parity', () => {
  assert.equal(new Set(UI_MESSAGE_KEYS).size, UI_MESSAGE_KEYS.length);

  for (const locale of EXPECTED_LOCALES) {
    assert.deepEqual(Object.keys(UI_CATALOGS[locale]), UI_MESSAGE_KEYS, locale);
    for (const key of UI_MESSAGE_KEYS) {
      assert.equal(typeof UI_CATALOGS[locale][key], 'string', `${locale}.${key}`);
      assert.notEqual(UI_CATALOGS[locale][key].trim(), '', `${locale}.${key}`);
    }
  }

  assert.equal(validateUiCatalogs(UI_CATALOGS), true);
  assert.equal(validateUiCatalogs({ ...UI_CATALOGS, 'zh-Hans': UI_CATALOGS.en }), false);
});

test('lookup resolves every supported locale and keeps invalid input inside English fallback', () => {
  for (const locale of EXPECTED_LOCALES) {
    for (const key of UI_MESSAGE_KEYS) {
      assert.equal(getUiMessage(locale, key), UI_CATALOGS[locale][key]);
    }
  }

  for (const invalidLocale of [null, undefined, '', '/ja', 'zh-Hans', 'pt-BR', 42]) {
    assert.equal(getUiMessage(invalidLocale, 'nav.learn'), CANONICAL_UI_CATALOG['nav.learn']);
  }
  assert.equal(getUiMessage('ja-JP', 'nav.learn'), CANONICAL_UI_CATALOG['nav.learn']);
  assert.equal(getUiMessage(DEFAULT_LOCALE, 'auth.signIn'), 'Sign in');
});

test('a controlled missing entry uses canonical English fallback without weakening parity validation', () => {
  const incompleteCatalogs = Object.fromEntries(
    Object.entries(UI_CATALOGS).map(([locale, catalog]) => [locale, { ...catalog }])
  );
  delete incompleteCatalogs.ja['nav.learn'];

  assert.equal(validateUiCatalogs(incompleteCatalogs), false);
  assert.equal(
    getUiMessage('ja', 'nav.learn', incompleteCatalogs),
    CANONICAL_UI_CATALOG['nav.learn']
  );
});

test('representative global-shell labels are localized for English, Spanish, Japanese, and Traditional Chinese', () => {
  for (const key of ['nav.learn', 'auth.signIn', 'accessibility.skipToMain']) {
    const values = ['en', 'es', 'ja', 'zh-Hant'].map((locale) => getUiMessage(locale, key));
    assert.equal(new Set(values).size, values.length, key);
  }
});

test('Calculate and Chart Workspace Class A labels are localized without changing stable catalog identities', () => {
  for (const key of [
    'calculate.title',
    'birthInput.birthDate',
    'birthInput.calculate',
    'workspace.chartTab',
    'workspace.detailsTab'
  ]) {
    const values = ['en', 'es', 'ja', 'zh-Hant'].map((locale) => getUiMessage(locale, key));
    assert.equal(new Set(values).size, values.length, key);
  }

  assert.equal(getUiMessage('zh-Hant', 'birthInput.calculate'), '計算星盤');
  assert.equal(getUiMessage('ja', 'workspace.detailsTab'), '詳細');
});

test('guest Quick Chart labels are localized and never claim that a chart was calculated', () => {
  const quickChartKeys = [
    'quickChart.createMyChart',
    'quickChart.checkInputs',
    'quickChart.unavailable',
    'quickChart.inputValidated'
  ];

  for (const key of quickChartKeys) {
    const messages = EXPECTED_LOCALES.map((locale) => getUiMessage(locale, key));
    assert.equal(new Set(messages).size, EXPECTED_LOCALES.length, key);
  }

  assert.equal(getUiMessage('en', 'quickChart.checkInputs'), 'Check birth details');
  assert.match(getUiMessage('en', 'quickChart.unavailable'), /cannot be calculated/u);
  assert.match(getUiMessage('en', 'quickChart.unavailable'), /not sent or saved/u);
  assert.match(getUiMessage('en', 'quickChart.inputValidated'), /No chart was calculated/u);
});
