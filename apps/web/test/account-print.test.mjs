import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import {
  buildAccountPrintModel,
  initializeAccountPrint,
  renderAccountPrintView
} from '../dist/account-print-characterization/features/account/account-print.js';
import {
  UI_CATALOGS,
  validateUiCatalogs
} from '../dist/account-print-characterization/lib/ui-catalog.js';

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const PRINT_MESSAGE_KEYS = [
  'account.data.print',
  'account.data.printDescription',
  'account.data.printHint',
  'account.data.printPreparing',
  'account.data.printError',
  'account.print.title',
  'account.print.exportedAt',
  'account.print.notificationChannel',
  'account.print.notAvailable',
  'account.print.practitioner',
  'account.print.dossierLabel',
  'account.print.profileDescriptor',
  'account.print.savedProfiles',
  'account.print.savedInputCount',
  'account.print.recordState',
  'account.print.savedInput',
  'account.print.awaitingCalculation',
  'account.print.privateRecord',
  'account.print.detailAppendix',
  'account.print.storyLead',
  'account.print.storyBody',
  'account.print.buildProfile',
  'account.print.browserPrintHint',
  'account.print.footerPrivate'
];
const GLOBAL_NAMES = ['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'Event', 'fetch'];
const ORIGINAL_GLOBALS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
let activeWindow;

function restore(object, property, descriptor) {
  if (descriptor) Object.defineProperty(object, property, descriptor);
  else delete object[property];
}

function installWindow(window, fetchImpl) {
  const values = {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    HTMLButtonElement: window.HTMLButtonElement,
    Event: window.Event,
    fetch: fetchImpl
  };

  for (const name of GLOBAL_NAMES) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: values[name]
    });
  }
}

async function settle() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function createResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return payload;
    }
  };
}

function createExportPayload(overrides = {}) {
  return {
    exportSchemaVersion: '1.2',
    exportedAt: '2026-08-25T12:00:00.000Z',
    account: {
      createdAt: '2026-08-20T12:00:00.000Z',
      updatedAt: '2026-08-25T12:00:00.000Z',
      identities: [
        {
          type: 'EMAIL_MAGIC_LINK',
          email: 'owner@example.test',
          providerSubject: 'provider-subject-must-not-print',
          linkedAt: '2026-08-20T12:00:00.000Z',
          updatedAt: '2026-08-25T12:00:00.000Z'
        }
      ]
    },
    charts: [
      {
        displayName: 'Private <Chart>',
        category: 'SELF',
        tags: ['private-tag'],
        favorite: true,
        normalizedChartRequest: {
          birth: {
            localDate: '1990-01-02',
            localTime: null,
            locationLabel: 'Shanghai, China',
            locationResolutionId: 'internal-location-resolution-id',
            latitude: 31.2304,
            longitude: 121.4737,
            ianaTimeZone: 'Asia/Shanghai',
            resolvedUtcInstant: null,
            utcOffsetSeconds: null,
            timezoneDatabaseVersion: 'internal-timezone-database',
            timezoneResolutionMethod: 'internal-provider',
            ambiguityStatus: 'UNKNOWN_TIME'
          },
          houseSystem: 'Placidus'
        },
        canonicalChartResult: null,
        calculation: {
          engineVersion: null,
          chartSchemaVersion: null,
          astronomyConfigurationId: null,
          provenanceEnvelopeId: null
        },
        createdAt: '2026-08-25T12:30:00.000Z',
        updatedAt: '2026-08-25T12:30:00.000Z',
        notes: [
          {
            content: 'Private note <unsafe>',
            createdAt: '2026-08-25T12:31:00.000Z',
            updatedAt: '2026-08-25T12:31:00.000Z'
          }
        ]
      }
    ],
    feedback: [
      {
        category: 'suggestion',
        message: 'Private feedback <unsafe>',
        createdAt: '2026-08-24T12:00:00.000Z'
      }
    ],
    notifications: {
      channelPreferences: [
        {
          channel: 'WEB_PUSH',
          enabled: true,
          createdAt: '2026-08-21T12:00:00.000Z',
          updatedAt: '2026-08-21T12:00:00.000Z'
        }
      ],
      categoryPreferences: [
        {
          category: 'ACCOUNT',
          enabled: false,
          createdAt: '2026-08-21T12:00:00.000Z',
          updatedAt: '2026-08-21T12:00:00.000Z'
        }
      ],
      pushSubscriptions: [
        {
          subscriptionId: 'private-push-subscription-id',
          channel: 'WEB_PUSH',
          status: 'ACTIVE',
          createdAt: '2026-08-21T12:00:00.000Z',
          updatedAt: '2026-08-21T12:00:00.000Z',
          lastSuccessAt: null,
          invalidatedAt: null
        }
      ]
    },
    practitioner: {
      application: null,
      profile: null,
      profileRevisions: []
    },
    ...overrides
  };
}

function createPrintElements(document) {
  const accountPage = document.createElement('section');
  const accountContent = document.createElement('div');
  const button = document.createElement('button');
  const view = document.createElement('article');
  const status = document.createElement('p');
  const error = document.createElement('p');
  const reauthStatus = document.createElement('section');

  accountContent.hidden = false;
  button.type = 'button';
  button.textContent = 'Printable version';
  view.setAttribute('aria-hidden', 'true');
  status.hidden = true;
  error.hidden = true;
  reauthStatus.hidden = true;
  accountPage.append(accountContent, button, view, status, error, reauthStatus);
  document.body.append(accountPage);

  return {
    accountPage,
    accountContent,
    button,
    view,
    status,
    error,
    reauthStatus
  };
}

async function withDom(exercise, fetchImpl) {
  assert.equal(activeWindow, undefined, 'a previous test leaked its DOM window');
  const window = new Window({ url: 'https://example.test/en/account' });
  window.document.documentElement.lang = 'en';
  installWindow(window, fetchImpl);
  activeWindow = window;

  try {
    await exercise({ window, document: window.document });
  } finally {
    window.document.body.replaceChildren();
    window.close();
    for (const [name, descriptor] of ORIGINAL_GLOBALS) {
      restore(globalThis, name, descriptor);
    }
    activeWindow = undefined;
  }
}

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('Account printable projection', { concurrency: false }, () => {
  test('projects user-meaningful fields and excludes internal or sensitive fields', () => {
    const window = new Window();
    const model = buildAccountPrintModel(createExportPayload());
    assert.ok(model);

    const view = window.document.createElement('article');
    renderAccountPrintView(view, model, 'en');
    const text = view.textContent;

    assert.match(text, /Private <Chart>/u);
    assert.match(text, /Shanghai, China/u);
    assert.match(text, /Unknown birth time/u);
    assert.match(text, /Saved input/u);
    assert.match(text, /Awaiting authoritative chart calculation/u);
    assert.match(text, /Private note <unsafe>/u);
    assert.match(text, /Private feedback <unsafe>/u);
    assert.doesNotMatch(text, /internal-location-resolution-id|internal-timezone-database|internal-provider/u);
    assert.doesNotMatch(text, /provider-subject-must-not-print|private-push-subscription-id/u);
    assert.doesNotMatch(text, /astronomyConfigurationId|provenanceEnvelopeId|session|credential/u);
    assert.equal(view.querySelector('script'), null);
    assert.match(view.innerHTML, /&lt;Chart&gt;/u);
    assert.match(view.innerHTML, /&lt;unsafe&gt;/u);
    window.close();
  });

  test('keeps a non-authoritative UI fixture visibly non-scientific', () => {
    const payload = createExportPayload({
      charts: [
        {
          ...createExportPayload().charts[0],
          canonicalChartResult: {
            calculationStatus: 'INCOMPLETE_RESEARCH',
            engineVersion: 'UI_FIXTURE_V1',
            bodies: [{ bodyId: 'Sun', longitude: 1, sign: 'Aries' }]
          },
          calculation: {
            engineVersion: 'UI_FIXTURE_V1',
            chartSchemaVersion: '1.0.0',
            astronomyConfigurationId: null,
            provenanceEnvelopeId: null
          }
        }
      ]
    });
    const model = buildAccountPrintModel(payload);
    assert.ok(model);
    const window = new Window();
    const view = window.document.createElement('article');
    renderAccountPrintView(view, model, 'en');

    assert.match(view.textContent, /Development fixture snapshot; not scientific evidence\./u);
    assert.doesNotMatch(view.textContent, /UI_FIXTURE_V1|Sun/u);
    window.close();
  });
});

describe('Account printable boundary', { concurrency: false }, () => {
  test('adds the localized action and keeps the page private with one main heading', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');
    const feature = readFileSync(new URL('../src/features/account/account-print.ts', import.meta.url), 'utf8');

    assert.match(page, /robots: 'noindex,nofollow'/u);
    assert.match(page, /data-account-print-submit/u);
    assert.match(page, /data-account-print-view/u);
    assert.equal((page.match(/<h1\b/gu) ?? []).length, 1);
    assert.match(feature, /window\.print\(\)/u);
    assert.match(feature, /cache: 'no-store'/u);
    assert.doesNotMatch(feature, /innerHTML/u);
    assert.equal(validateUiCatalogs(UI_CATALOGS), true);

    for (const locale of LOCALES) {
      for (const key of PRINT_MESSAGE_KEYS) {
        assert.equal(typeof UI_CATALOGS[locale][key], 'string');
        assert.notEqual(UI_CATALOGS[locale][key].trim(), '');
      }
    }
  });

  test('uses the same recent-auth preparation and export payload before printing', async () => {
    const fetchCalls = [];

    await withDom(async ({ window, document }) => {
      const elements = createPrintElements(document);
      let printCalls = 0;
      Object.defineProperty(window, 'print', {
        configurable: true,
        writable: true,
        value: () => {
          printCalls += 1;
        }
      });
      initializeAccountPrint(elements);
      elements.button.click();
      await settle();

      assert.equal(fetchCalls.length, 2);
      assert.equal(fetchCalls[0][0], '/api/account/export/prepare');
      assert.equal(fetchCalls[0][1].method, 'POST');
      assert.equal(fetchCalls[0][1].credentials, 'same-origin');
      assert.equal('body' in fetchCalls[0][1], false);
      assert.equal(fetchCalls[1][0], '/api/account/export');
      assert.equal(fetchCalls[1][1].method, 'POST');
      assert.equal(fetchCalls[1][1].credentials, 'same-origin');
      assert.equal(fetchCalls[1][1].cache, 'no-store');
      assert.equal('body' in fetchCalls[1][1], false);
      assert.equal(printCalls, 1);
      assert.equal(elements.accountPage.getAttribute('data-account-print-active'), 'true');
      assert.match(elements.view.textContent, /Saved input/u);

      window.dispatchEvent(new Event('afterprint'));
      assert.equal(elements.accountPage.hasAttribute('data-account-print-active'), false);
      assert.equal(elements.view.textContent, '');
      assert.equal(elements.view.getAttribute('aria-hidden'), 'true');
    }, async (...args) => {
      fetchCalls.push(args);
      return args[0] === '/api/account/export/prepare'
        ? createResponse(204)
        : createResponse(200, createExportPayload());
    });
  });

  test('keeps the printable action behind the existing recent-auth gate', async () => {
    const fetchCalls = [];

    await withDom(async ({ document }) => {
      const elements = createPrintElements(document);
      initializeAccountPrint(elements);
      elements.button.click();
      await settle();

      assert.equal(fetchCalls.length, 1);
      assert.equal(elements.reauthStatus.hidden, false);
      assert.equal(elements.error.hidden, true);
      assert.equal(elements.button.disabled, false);
    }, async (...args) => {
      fetchCalls.push(args);
      return createResponse(403, { code: 'RECENT_AUTHENTICATION_REQUIRED' });
    });
  });

  test('does not open print for a malformed export payload', async () => {
    const fetchCalls = [];

    await withDom(async ({ window, document }) => {
      const elements = createPrintElements(document);
      let printCalls = 0;
      Object.defineProperty(window, 'print', {
        configurable: true,
        writable: true,
        value: () => {
          printCalls += 1;
        }
      });
      initializeAccountPrint(elements);
      elements.button.click();
      await settle();

      assert.equal(fetchCalls.length, 2);
      assert.equal(printCalls, 0);
      assert.equal(elements.error.hidden, false);
      assert.equal(elements.accountPage.hasAttribute('data-account-print-active'), false);
      assert.equal(elements.button.disabled, false);
    }, async (...args) => {
      fetchCalls.push(args);
      return args[0] === '/api/account/export/prepare'
        ? createResponse(204)
        : createResponse(200, { exportSchemaVersion: 'unexpected' });
    });
  });
});
