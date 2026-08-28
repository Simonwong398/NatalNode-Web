import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import { initializeAccountExport } from '../dist/account-export-characterization/features/account/account-export.js';

const GLOBAL_NAMES = ['window', 'document', 'HTMLElement', 'HTMLIFrameElement', 'Event'];
const ORIGINAL_GLOBALS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
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
    HTMLIFrameElement: window.HTMLIFrameElement,
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
  const window = new Window({ url: 'https://example.test/account' });
  const replaceDescriptor = Object.getOwnPropertyDescriptor(window.location, 'replace');
  const replaceCalls = [];

  installWindow(window);
  activeWindow = window;
  Object.defineProperty(window.location, 'replace', {
    configurable: true,
    writable: true,
    value: (path) => replaceCalls.push(path)
  });

  try {
    await exercise({ window, document: window.document, replaceCalls });
  } finally {
    window.document.body.replaceChildren();
    restore(window.location, 'replace', replaceDescriptor);
    window.close();
    for (const [name, descriptor] of ORIGINAL_GLOBALS) {
      restore(globalThis, name, descriptor);
    }
    activeWindow = undefined;
  }
}

function createAccountExportElements(document) {
  const accountContent = document.createElement('div');
  accountContent.innerHTML = `
    <section data-account-export>
      <form method="post" action="/api/account/export" target="account-export-response" aria-busy="false">
        <button data-account-export-submit type="submit">Download your data</button>
        <p data-account-export-status role="status" aria-live="polite" hidden></p>
        <p data-account-export-error role="alert" tabindex="-1" hidden></p>
        <section data-account-export-reauth role="alert" tabindex="-1" hidden>
          <a href="/auth/sign-in">Sign in again</a>
        </section>
      </form>
    </section>
  `;
  const responseFrame = document.createElement('iframe');
  responseFrame.name = 'account-export-response';
  document.body.append(accountContent, responseFrame);

  return {
    accountContent,
    form: accountContent.querySelector('form'),
    submitButton: accountContent.querySelector('[data-account-export-submit]'),
    statusElement: accountContent.querySelector('[data-account-export-status]'),
    errorStatus: accountContent.querySelector('[data-account-export-error]'),
    reauthStatus: accountContent.querySelector('[data-account-export-reauth]'),
    responseFrame
  };
}

function submit(elements) {
  const event = new Event('submit', {
    bubbles: true,
    cancelable: true
  });
  elements.form.dispatchEvent(event);
  return event;
}

function frameError(elements, code) {
  elements.responseFrame.contentDocument.body.textContent = JSON.stringify({
    error: { code, message: 'server detail is intentionally ignored' }
  });
  elements.responseFrame.dispatchEvent(new Event('load'));
}

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('Account export page boundary', { concurrency: false }, () => {
  test('/account exposes Your data before a separate Danger zone and preserves private SEO', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');

    assert.match(page, /robots: 'noindex,nofollow'/u);
    assert.match(page, /<p class="nn-eyebrow">Your data<\/p>/u);
    assert.match(page, /Download your data/u);
    assert.match(page, /<p class="nn-eyebrow">Danger zone<\/p>/u);
    assert.ok(page.indexOf('data-account-export') < page.indexOf('account-danger-surface'));
    assert.match(page, /data-account-delete-open/u);
    assert.doesNotMatch(page, /href=["'][^"']*export/u);
  });

  test('uses a native POST contract with no account selector or client buffering', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');
    const feature = readFileSync(new URL('../src/features/account/account-export.ts', import.meta.url), 'utf8');
    const formMarkup = page.match(/<form[\s\S]*?data-account-export-form[\s\S]*?<\/form>/u)?.[0];

    assert.ok(formMarkup);
    assert.match(formMarkup, /method="post"/u);
    assert.match(formMarkup, /action="\/api\/account\/export"/u);
    assert.match(formMarkup, /target="account-export-response"/u);
    assert.doesNotMatch(formMarkup, /(?:userId|accountId|ownerId|email|format|filename|timestamp)/u);
    assert.doesNotMatch(formMarkup, /<(?:input|select|textarea)\b/u);
    assert.doesNotMatch(formMarkup, /\?/u);
    assert.doesNotMatch(feature, /fetch\s*\(/u);
    assert.doesNotMatch(feature, /\.blob\s*\(/u);
    assert.doesNotMatch(feature, /createObjectURL/u);
    assert.doesNotMatch(feature, /showSaveFilePicker/u);
    assert.doesNotMatch(feature, /sessionCreatedAt|600|cookie|returnTo|redirect/u);
    assert.doesNotMatch(feature, /\/api\/account(?:["'`]|\b)/u);
  });
});

describe('Account export interaction', { concurrency: false }, () => {
  test('keeps the native request empty and prevents duplicate initiation in one turn', async () => {
    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);

      const firstEvent = submit(elements);
      const secondEvent = submit(elements);

      assert.equal(firstEvent.defaultPrevented, false);
      assert.equal(secondEvent.defaultPrevented, true);
      assert.equal(elements.form.method, 'post');
      assert.equal(elements.form.action, 'https://example.test/api/account/export');
      assert.equal(elements.form.target, 'account-export-response');
      assert.equal(elements.form.querySelectorAll('input, select, textarea').length, 0);
      assert.equal(elements.form.getAttribute('aria-busy'), 'true');
      assert.equal(elements.submitButton.disabled, true);

      await settle();
      assert.equal(elements.form.getAttribute('aria-busy'), 'false');
      assert.equal(elements.statusElement.hidden, false);
      assert.match(elements.statusElement.textContent, /request sent/u);
    });
  });

  test('handles recent-auth failure with the fixed Email Magic Link route', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      frameError(elements, 'RECENT_AUTHENTICATION_REQUIRED');
      await settle();

      assert.equal(elements.reauthStatus.hidden, false);
      assert.strictEqual(document.activeElement, elements.reauthStatus);
      assert.equal(elements.reauthStatus.querySelector('a').getAttribute('href'), '/auth/sign-in');
      assert.deepEqual(replaceCalls, []);
    });
  });

  test('follows signed-out behavior for unauthorized export responses', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      frameError(elements, 'UNAUTHORIZED');
      await settle();

      assert.equal(elements.accountContent.hidden, true);
      assert.deepEqual(replaceCalls, ['/auth/sign-in']);
      assert.equal(elements.errorStatus.hidden, true);
    });
  });

  for (const [code, expected] of [
    ['INVALID_REQUEST', /prepare your download/u],
    ['RATE_LIMITED', /wait a moment/u],
    ['INTERNAL_ERROR', /start your download/u],
    ['FORBIDDEN', /start your download/u]
  ]) {
    test(`${code} is a bounded, focusable failure`, async () => {
      await withDom(async ({ document }) => {
        const elements = createAccountExportElements(document);
        initializeAccountExport(elements);
        submit(elements);
        frameError(elements, code);
        await settle();

        assert.equal(elements.errorStatus.hidden, false);
        assert.match(elements.errorStatus.textContent, expected);
        assert.doesNotMatch(elements.errorStatus.textContent, new RegExp(code, 'u'));
        assert.strictEqual(document.activeElement, elements.errorStatus);
        assert.equal(elements.accountContent.hidden, false);
        assert.equal(elements.submitButton.disabled, false);
      });
    });
  }

  test('network failure reports no false completion and remains retryable', async () => {
    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      elements.responseFrame.dispatchEvent(new Event('error'));
      await settle();

      assert.equal(elements.errorStatus.hidden, false);
      assert.match(elements.errorStatus.textContent, /start your download/u);
      assert.doesNotMatch(elements.errorStatus.textContent, /completed|success/u);
      assert.equal(elements.submitButton.disabled, false);
      assert.equal(elements.accountContent.hidden, false);
    });
  });

  test('successful native handoff does not change account state or trigger navigation', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.accountContent.hidden, false);
      assert.equal(elements.errorStatus.hidden, true);
      assert.match(elements.statusElement.textContent, /request sent/u);
      assert.deepEqual(replaceCalls, []);
    });
  });
});
