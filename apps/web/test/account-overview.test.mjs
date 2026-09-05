import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import { initializeAccountOverview } from '../dist/account-overview-characterization/features/account/account-overview.js';

const GLOBAL_NAMES = ['window', 'document', 'HTMLElement', 'Event'];
const ORIGINAL_GLOBALS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
const ORIGINAL_FETCH = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
let activeWindow;

function restore(object, property, descriptor) {
  if (descriptor) Object.defineProperty(object, property, descriptor);
  else delete object[property];
}

function installWindow(window) {
  const values = {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    Event: window.Event
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

async function withDom(exercise) {
  assert.equal(activeWindow, undefined, 'a previous test leaked its DOM window');
  const window = new Window({ url: 'https://example.test/en/account' });
  const replaceDescriptor = Object.getOwnPropertyDescriptor(window.location, 'replace');
  const replaceCalls = [];

  installWindow(window);
  window.document.documentElement.dataset.locale = 'en';
  activeWindow = window;
  Object.defineProperty(window.location, 'replace', {
    configurable: true,
    writable: true,
    value: (path) => replaceCalls.push(path)
  });

  try {
    await exercise({ document: window.document, replaceCalls });
  } finally {
    window.document.body.replaceChildren();
    restore(window.location, 'replace', replaceDescriptor);
    window.close();
    restore(globalThis, 'fetch', ORIGINAL_FETCH);
    for (const [name, descriptor] of ORIGINAL_GLOBALS) {
      restore(globalThis, name, descriptor);
    }
    activeWindow = undefined;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function createElements(document) {
  const root = document.createElement('section');
  root.setAttribute('aria-busy', 'true');
  root.innerHTML = `
    <p data-account-overview-loading></p>
    <p data-account-overview-error tabindex="-1" hidden>Could not load account</p>
    <dl data-account-overview-content hidden>
      <dd data-account-overview-identity></dd>
      <dd data-account-overview-methods></dd>
      <dd data-account-overview-created></dd>
      <dd data-account-overview-vault-usage></dd>
    </dl>
  `;
  document.body.append(root);

  return {
    root,
    loading: root.querySelector('[data-account-overview-loading]'),
    content: root.querySelector('[data-account-overview-content]'),
    error: root.querySelector('[data-account-overview-error]'),
    identity: root.querySelector('[data-account-overview-identity]'),
    methods: root.querySelector('[data-account-overview-methods]'),
    createdAt: root.querySelector('[data-account-overview-created]'),
    vaultUsage: root.querySelector('[data-account-overview-vault-usage]')
  };
}

const emailOverview = {
  authentication: {
    methods: ['EMAIL_MAGIC_LINK', 'GOOGLE'],
    emailAddresses: ['owner@example.test']
  },
  account: { createdAt: '2026-08-20T12:00:00.000Z' },
  vaultCapacity: {
    used: 2,
    limit: 3,
    tier: 'FREE',
    proExpansionAvailable: false
  }
};

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('Account overview page boundary', { concurrency: false }, () => {
  test('renders a private overview and links to the existing legal pages', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');

    assert.match(page, /robots: 'noindex,nofollow'/u);
    assert.match(page, /data-account-overview/u);
    assert.match(page, /account\.overview\.identity/u);
    assert.match(page, /localize\('\/privacy'\)/u);
    assert.match(page, /localize\('\/terms'\)/u);
    assert.doesNotMatch(page, /billing|checkout|upgrade|subscription/u);
  });
});

describe('Account overview interaction', { concurrency: false }, () => {
  test('loads owner-scoped identity, creation date, authentication methods, and Vault capacity', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const calls = [];
      globalThis.fetch = async (...args) => {
        calls.push(args);
        return jsonResponse(emailOverview);
      };

      initializeAccountOverview(elements);
      await settle();

      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], '/api/account');
      assert.equal(calls[0][1].method, 'GET');
      assert.equal(calls[0][1].credentials, 'same-origin');
      assert.equal(calls[0][1].cache, 'no-store');
      assert.deepEqual(calls[0][1].headers, { Accept: 'application/json' });
      assert.equal(elements.identity.textContent, 'owner@example.test');
      assert.equal(elements.methods.textContent, 'Email Magic Link, Google');
      assert.equal(
        elements.createdAt.textContent,
        new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(emailOverview.account.createdAt)
        )
      );
      assert.equal(elements.vaultUsage.textContent, '2 / 3');
      assert.equal(elements.loading.hidden, true);
      assert.equal(elements.error.hidden, true);
      assert.equal(elements.content.hidden, false);
      assert.equal(elements.root.getAttribute('aria-busy'), 'false');
    });
  });

  test('does not expose a Google provider subject when no email identity is available', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      globalThis.fetch = async () => jsonResponse({
        authentication: {
          methods: ['GOOGLE'],
          emailAddresses: []
        },
        account: { createdAt: '2026-08-20T12:00:00.000Z' },
        vaultCapacity: {
          used: 0,
          limit: 3,
          tier: 'FREE',
          proExpansionAvailable: false
        }
      });

      initializeAccountOverview(elements);
      await settle();

      assert.equal(elements.identity.textContent, 'Google account');
      assert.equal(elements.methods.textContent, 'Google');
      assert.equal(elements.content.hidden, false);
    });
  });

  test('redirects an expired private session to the localized sign-in route', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createElements(document);
      globalThis.fetch = async () => new Response(null, { status: 401 });

      initializeAccountOverview(elements);
      await settle();

      assert.deepEqual(replaceCalls, ['/en/auth/sign-in']);
      assert.equal(elements.content.hidden, true);
    });
  });

  test('keeps malformed or failed overview responses unavailable', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      globalThis.fetch = async () => jsonResponse({
        authentication: { methods: ['EMAIL_MAGIC_LINK'], emailAddresses: [] },
        account: { createdAt: 'not-a-date' },
        vaultCapacity: {
          used: 0,
          limit: 3,
          tier: 'FREE',
          proExpansionAvailable: false
        }
      });

      initializeAccountOverview(elements);
      await settle();

      assert.equal(elements.content.hidden, true);
      assert.equal(elements.error.hidden, false);
      assert.equal(elements.root.getAttribute('aria-busy'), 'false');
      assert.strictEqual(document.activeElement, elements.error);
    });
  });
});
