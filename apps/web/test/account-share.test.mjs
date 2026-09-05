import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import {
  buildAccountPrintModel
} from '../dist/account-share-characterization/features/account/account-print.js';
import {
  initializeAccountShare,
  renderAccountShareSummary
} from '../dist/account-share-characterization/features/account/account-share.js';
import {
  UI_CATALOGS,
  validateUiCatalogs
} from '../dist/account-share-characterization/lib/ui-catalog.js';

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const SHARE_MESSAGE_KEYS = [
  'account.data.shareSummary',
  'account.data.shareDescription',
  'account.data.sharePreparing',
  'account.data.shareError',
  'account.data.shareClose',
  'account.share.title',
  'account.share.eyebrow',
  'account.share.profileCount',
  'account.share.statement',
  'account.share.cta',
  'account.share.privatePreview',
  'account.share.close'
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
  const chart = {
    displayName: 'Jojo <private>',
    category: 'SELF',
    normalizedChartRequest: {
      birth: {
        localDate: '1990-01-02',
        localTime: '14:30',
        locationLabel: 'Shanghai, China',
        locationResolutionId: 'internal-location-id',
        latitude: 31.2304,
        longitude: 121.4737,
        ianaTimeZone: 'Asia/Shanghai',
        ambiguityStatus: 'EXACT'
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
    notes: [
      {
        content: 'Private note must stay private',
        createdAt: '2026-08-25T12:31:00.000Z'
      }
    ]
  };

  return {
    exportSchemaVersion: '1.2',
    exportedAt: '2026-08-25T12:00:00.000Z',
    account: {
      createdAt: '2026-08-20T12:00:00.000Z',
      identities: [
        {
          type: 'EMAIL_MAGIC_LINK',
          email: 'owner@example.test',
          providerSubject: 'internal-provider-subject'
        }
      ]
    },
    charts: [
      chart,
      {
        ...chart,
        displayName: 'Second profile',
        category: 'PARTNER',
        notes: []
      }
    ],
    feedback: [
      {
        category: 'suggestion',
        message: 'Private feedback must stay private',
        createdAt: '2026-08-24T12:00:00.000Z'
      }
    ],
    notifications: {
      channelPreferences: [],
      categoryPreferences: [],
      pushSubscriptions: [
        {
          subscriptionId: 'internal-subscription-id',
          channel: 'WEB_PUSH',
          status: 'ACTIVE'
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

function createShareElements(document) {
  const accountPage = document.createElement('section');
  const accountContent = document.createElement('div');
  const button = document.createElement('button');
  const view = document.createElement('aside');
  const status = document.createElement('p');
  const error = document.createElement('p');
  const reauthStatus = document.createElement('section');

  button.type = 'button';
  button.textContent = 'Share summary';
  view.hidden = true;
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

describe('Account share summary projection', { concurrency: false }, () => {
  test('renders a distinct 4:5 private preview without sensitive or internal fields', () => {
    const model = buildAccountPrintModel(createExportPayload());
    assert.ok(model);

    const window = new Window();
    const view = window.document.createElement('aside');
    renderAccountShareSummary(view, model, 'en');
    const text = view.textContent;
    const card = view.querySelector('.account-share-card');

    assert.ok(card);
    assert.match(text, /Second profile/u);
    assert.match(text, /Share-safe preview/u);
    assert.match(text, /2 celestial profiles saved\./u);
    assert.match(text, /Saved input/u);
    assert.match(text, /natalnode\.com/u);
    assert.equal(
      view.querySelector('.account-share-card-logo').getAttribute('src'),
      '/brand/natalnode-lockup-horizontal-dark.svg'
    );
    assert.equal(view.querySelectorAll('script').length, 0);
    assert.match(
      readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8'),
      /\.account-share-card\s*\{[\s\S]*aspect-ratio:\s*4\s*\/\s*5/u
    );

    for (const forbidden of [
      'owner@example.test',
      '1990-01-02',
      '14:30',
      'Shanghai, China',
      '31.2304',
      '121.4737',
      'Asia/Shanghai',
      '2026-08-20',
      'internal-provider-subject',
      'internal-location-id',
      'Private note must stay private',
      'Private feedback must stay private',
      'internal-subscription-id',
      'UI_FIXTURE_V1',
      'provenanceEnvelopeId'
    ]) {
      assert.doesNotMatch(text, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    }

    window.close();
  });

  test('covers exactly the supported locale catalog without zh-Hans drift', () => {
    assert.equal(validateUiCatalogs(UI_CATALOGS), true);
    assert.equal(UI_CATALOGS['zh-Hans'], undefined);

    const model = buildAccountPrintModel(createExportPayload());
    assert.ok(model);
    const window = new Window();

    for (const locale of LOCALES) {
      const view = window.document.createElement('aside');
      renderAccountShareSummary(view, model, locale);
      for (const key of SHARE_MESSAGE_KEYS) {
        assert.equal(typeof UI_CATALOGS[locale][key], 'string');
        assert.notEqual(UI_CATALOGS[locale][key].trim(), '');
      }
      assert.equal(view.querySelector('.account-share-card-link').textContent, 'natalnode.com');
      assert.equal(
        view.querySelector('.account-share-card-logo').getAttribute('src'),
        '/brand/natalnode-lockup-horizontal-dark.svg'
      );
    }

    window.close();
  });
});

describe('Account share summary boundary', { concurrency: false }, () => {
  test('uses recent-auth preparation, one export payload, and a reversible client-only view', async () => {
    const fetchCalls = [];

    await withDom(async ({ document, window }) => {
      const elements = createShareElements(document);
      initializeAccountShare(elements);
      elements.button.click();
      await settle();

      assert.equal(fetchCalls.length, 2);
      assert.equal(fetchCalls[0][0], '/api/account/export/prepare');
      assert.equal(fetchCalls[0][1].method, 'POST');
      assert.equal(fetchCalls[0][1].credentials, 'same-origin');
      assert.equal(fetchCalls[1][0], '/api/account/export');
      assert.equal(fetchCalls[1][1].method, 'POST');
      assert.equal(fetchCalls[1][1].credentials, 'same-origin');
      assert.equal(fetchCalls[1][1].cache, 'no-store');
      assert.equal('body' in fetchCalls[1][1], false);
      assert.equal(elements.view.hidden, false);
      assert.equal(elements.view.getAttribute('aria-hidden'), 'false');
      assert.equal(elements.accountPage.getAttribute('data-account-share-active'), 'true');
      assert.equal(window.document.body.hasAttribute('data-account-share-active'), true);
      assert.match(elements.view.textContent, /natalnode\.com/u);

      elements.view.querySelector('[data-account-share-close]').click();
      assert.equal(elements.view.hidden, true);
      assert.equal(elements.view.getAttribute('aria-hidden'), 'true');
      assert.equal(elements.accountPage.hasAttribute('data-account-share-active'), false);
      assert.equal(window.document.body.hasAttribute('data-account-share-active'), false);
      assert.equal(elements.view.textContent, '');
    }, async (...args) => {
      fetchCalls.push(args);
      return args[0] === '/api/account/export/prepare'
        ? createResponse(204)
        : createResponse(200, createExportPayload());
    });
  });

  test('keeps the preview behind the existing recent-auth gate', async () => {
    const fetchCalls = [];

    await withDom(async ({ document }) => {
      const elements = createShareElements(document);
      initializeAccountShare(elements);
      elements.button.click();
      await settle();

      assert.equal(fetchCalls.length, 1);
      assert.equal(elements.reauthStatus.hidden, false);
      assert.equal(elements.error.hidden, true);
      assert.equal(elements.view.hidden, true);
    }, async (...args) => {
      fetchCalls.push(args);
      return createResponse(403, { code: 'RECENT_AUTHENTICATION_REQUIRED' });
    });
  });
});
