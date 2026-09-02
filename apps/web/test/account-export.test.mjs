import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import { initializeAccountExport } from '../dist/account-export-characterization/features/account/account-export.js';

const GLOBAL_NAMES = [
  'window',
  'document',
  'HTMLElement',
  'HTMLIFrameElement',
  'Event',
  'fetch'
];
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
    HTMLIFrameElement: window.HTMLIFrameElement,
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

function createFetchResponse(status, payload) {
  return {
    status,
    async json() {
      return payload;
    }
  };
}

async function withDom(exercise, fetchImpl = async () => createFetchResponse(204)) {
  assert.equal(activeWindow, undefined, 'a previous test leaked its DOM window');
  const window = new Window({ url: 'https://example.test/account' });
  const replaceDescriptor = Object.getOwnPropertyDescriptor(window.location, 'replace');
  const replaceCalls = [];

  installWindow(window, fetchImpl);
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
          <a href="/en/auth/sign-in">Sign in again</a>
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

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('Account export page boundary', { concurrency: false }, () => {
  test('/account exposes Your data before a separate Danger zone and preserves private SEO', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');

    assert.match(page, /robots: 'noindex,nofollow'/u);
    assert.match(page, /account\.data\.eyebrow/u);
    assert.match(page, /account\.data\.download/u);
    assert.match(page, /account\.danger\.eyebrow/u);
    assert.ok(page.indexOf('data-account-export') < page.indexOf('account-danger-surface'));
    assert.match(page, /data-account-delete-open/u);
    assert.doesNotMatch(page, /href=["'][^"']*export/u);
  });

  test('uses Stage 1 fetch and a native Stage 2 POST without account selectors or buffering', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');
    const feature = readFileSync(new URL('../src/features/account/account-export.ts', import.meta.url), 'utf8');
    const formMarkup = page.match(/<form\b(?=[^>]*\bdata-account-export-form\b)[^>]*>[\s\S]*?<\/form>/u)?.[0];

    assert.ok(formMarkup);
    assert.match(formMarkup, /method="post"/u);
    assert.match(formMarkup, /action="\/api\/account\/export"/u);
    assert.match(formMarkup, /target="account-export-response"/u);
    assert.doesNotMatch(formMarkup, /(?:userId|accountId|ownerId|email|format|filename|timestamp)/u);
    assert.doesNotMatch(formMarkup, /<(?:input|select|textarea)\b/u);
    assert.doesNotMatch(formMarkup, /\?/u);
    assert.match(feature, /fetch\s*\(/u);
    assert.match(feature, /\/api\/account\/export\/prepare/u);
    assert.doesNotMatch(feature, /\.blob\s*\(/u);
    assert.doesNotMatch(feature, /createObjectURL/u);
    assert.doesNotMatch(feature, /showSaveFilePicker/u);
    assert.doesNotMatch(feature, /sessionCreatedAt|600|cookie|returnTo|redirect/u);
    assert.doesNotMatch(feature, /contentDocument|contentWindow|body\.textContent/u);
    assert.doesNotMatch(feature, /JSON\.parse|payload\.error|responseFrame\.addEventListener/u);
    assert.doesNotMatch(feature, /fetch\([\s\S]*\/api\/account\/export["'`]/u);
  });
});

describe('Account export interaction', { concurrency: false }, () => {
  test('fetches prepare without a body and submits the native transfer exactly once after 204', async () => {
    const fetchCalls = [];
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      let nativeSubmitCalls = 0;
      elements.form.submit = () => {
        nativeSubmitCalls += 1;
      };
      initializeAccountExport(elements);

      const firstEvent = submit(elements);
      const secondEvent = submit(elements);

      assert.equal(firstEvent.defaultPrevented, true);
      assert.equal(secondEvent.defaultPrevented, true);
      assert.equal(fetchCalls.length, 1);
      assert.equal(fetchCalls[0][0], '/api/account/export/prepare');
      assert.equal(fetchCalls[0][1].method, 'POST');
      assert.equal(fetchCalls[0][1].credentials, 'same-origin');
      assert.equal(fetchCalls[0][1].headers.Accept, 'application/problem+json');
      assert.equal('body' in fetchCalls[0][1], false);
      assert.equal(elements.form.method, 'post');
      assert.equal(elements.form.action, 'https://example.test/api/account/export');
      assert.equal(elements.form.target, 'account-export-response');
      assert.equal(elements.form.querySelectorAll('input, select, textarea').length, 0);
      assert.equal(elements.form.getAttribute('aria-busy'), 'true');
      assert.equal(elements.submitButton.disabled, true);

      resolveFetch(createFetchResponse(204));
      await settle();
      assert.equal(nativeSubmitCalls, 1);
      assert.equal(elements.form.getAttribute('aria-busy'), 'false');
      assert.equal(elements.statusElement.hidden, false);
      assert.match(elements.statusElement.textContent, /request sent/u);
    }, async (...args) => {
      fetchCalls.push(args);
      return fetchPromise;
    });
  });

  test('handles recent-auth failure with the fixed Email Magic Link route', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.reauthStatus.hidden, false);
      assert.strictEqual(document.activeElement, elements.reauthStatus);
      assert.equal(elements.reauthStatus.querySelector('a').getAttribute('href'), '/en/auth/sign-in');
      assert.deepEqual(replaceCalls, []);
    }, async () => createFetchResponse(403, {
      code: 'RECENT_AUTHENTICATION_REQUIRED'
    }));
  });

  test('follows signed-out behavior for unauthorized export responses', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.accountContent.hidden, true);
      assert.deepEqual(replaceCalls, ['/en/auth/sign-in']);
      assert.equal(elements.errorStatus.hidden, true);
    }, async () => createFetchResponse(401, { code: 'UNAUTHORIZED' }));
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
        await settle();

        assert.equal(elements.errorStatus.hidden, false);
        assert.match(elements.errorStatus.textContent, expected);
        assert.doesNotMatch(elements.errorStatus.textContent, new RegExp(code, 'u'));
        assert.strictEqual(document.activeElement, elements.errorStatus);
        assert.equal(elements.accountContent.hidden, false);
        assert.equal(elements.submitButton.disabled, false);
      }, async () => createFetchResponse(
        code === 'RATE_LIMITED'
          ? 429
          : code === 'INVALID_REQUEST'
            ? 400
            : code === 'FORBIDDEN'
              ? 403
              : 500,
        { code }
      ));
    });
  }

  test('nested legacy error data does not control the page', async () => {
    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.errorStatus.hidden, false);
      assert.match(elements.errorStatus.textContent, /start your download/u);
      assert.equal(elements.reauthStatus.hidden, true);
      assert.equal(elements.submitButton.disabled, false);
      assert.equal(elements.accountContent.hidden, false);
    }, async () => createFetchResponse(500, {
      error: { code: 'RECENT_AUTHENTICATION_REQUIRED' }
    }));
  });

  test('a mismatched top-level code does not override the HTTP status', async () => {
    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.errorStatus.hidden, false);
      assert.equal(elements.reauthStatus.hidden, true);
      assert.match(elements.errorStatus.textContent, /start your download/u);
    }, async () => createFetchResponse(500, {
      code: 'RECENT_AUTHENTICATION_REQUIRED'
    }));
  });

  test('network failure reports no false completion and remains retryable', async () => {
    await withDom(async ({ document }) => {
      const elements = createAccountExportElements(document);
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(elements.errorStatus.hidden, false);
      assert.match(elements.errorStatus.textContent, /start your download/u);
      assert.doesNotMatch(elements.errorStatus.textContent, /completed|success/u);
      assert.equal(elements.submitButton.disabled, false);
    }, async () => {
      throw new Error('network failure');
    });
  });

  test('successful native handoff does not claim completion or stay pending', async () => {
    const fetchCalls = [];
    await withDom(async ({ document, replaceCalls }) => {
      const elements = createAccountExportElements(document);
      let nativeSubmitCalls = 0;
      elements.form.submit = () => {
        nativeSubmitCalls += 1;
      };
      initializeAccountExport(elements);
      submit(elements);
      await settle();

      assert.equal(nativeSubmitCalls, 1);
      assert.equal(fetchCalls.length, 1);
      assert.equal(elements.accountContent.hidden, false);
      assert.equal(elements.errorStatus.hidden, true);
      assert.equal(elements.submitButton.disabled, false);
      assert.equal(elements.form.getAttribute('aria-busy'), 'false');
      assert.match(elements.statusElement.textContent, /request sent/u);
      assert.doesNotMatch(elements.statusElement.textContent, /completed|success/u);
      assert.deepEqual(replaceCalls, []);

      elements.responseFrame.dispatchEvent(new Event('load'));
      assert.equal(nativeSubmitCalls, 1);
    }, async (...args) => {
      fetchCalls.push(args);
      return createFetchResponse(204);
    });
  });
});
