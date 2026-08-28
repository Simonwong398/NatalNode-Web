import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import { initializeAccountDeletion } from '../dist/account-deletion-characterization/features/account/account-deletion.js';
import { initializeAuthSessionControl } from '../dist/account-deletion-characterization/features/auth/auth-session-control.js';

const GLOBAL_NAMES = ['window', 'document', 'HTMLElement', 'Event', 'MouseEvent'];
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
    Event: window.Event,
    MouseEvent: window.MouseEvent
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

function emptyResponse(status) {
  return new Response(null, { status });
}

function installFetchQueue(responders) {
  const queue = [...responders];
  const calls = [];

  globalThis.fetch = async (input, init = {}) => {
    calls.push({ input, init });
    const responder = queue.shift();
    assert.notEqual(responder, undefined, `unexpected fetch call to ${input}`);
    return typeof responder === 'function'
      ? await responder({ input, init })
      : responder;
  };

  return calls;
}

function createAccountElements(document) {
  const root = document.createElement('section');
  root.setAttribute('aria-busy', 'true');
  root.innerHTML = `
    <p data-account-loading></p>
    <p data-account-session-error tabindex="-1" hidden></p>
    <div data-account-content hidden>
      <button data-account-delete-open aria-expanded="false" aria-controls="account-delete-confirmation">Delete account</button>
      <section id="account-delete-confirmation" data-account-delete-confirmation hidden>
        <form data-account-delete-form aria-busy="false">
          <label for="account-delete-phrase">Confirmation phrase</label>
          <input id="account-delete-phrase" data-account-delete-input aria-describedby="account-delete-help account-delete-error">
          <button data-account-delete-cancel type="button">Cancel</button>
          <button data-account-delete-submit type="submit" disabled>Delete account permanently</button>
          <p data-account-delete-pending hidden></p>
          <p id="account-delete-error" data-account-delete-error tabindex="-1" hidden></p>
          <section data-account-reauth tabindex="-1" hidden>
            <a href="/auth/sign-in">Sign in again</a>
          </section>
        </form>
      </section>
    </div>
  `;
  document.body.append(root);

  return {
    root,
    loading: root.querySelector('[data-account-loading]'),
    sessionError: root.querySelector('[data-account-session-error]'),
    accountContent: root.querySelector('[data-account-content]'),
    openButton: root.querySelector('[data-account-delete-open]'),
    confirmationRegion: root.querySelector('[data-account-delete-confirmation]'),
    form: root.querySelector('[data-account-delete-form]'),
    confirmationInput: root.querySelector('[data-account-delete-input]'),
    cancelButton: root.querySelector('[data-account-delete-cancel]'),
    submitButton: root.querySelector('[data-account-delete-submit]'),
    pendingStatus: root.querySelector('[data-account-delete-pending]'),
    errorStatus: root.querySelector('[data-account-delete-error]'),
    reauthStatus: root.querySelector('[data-account-reauth]')
  };
}

function createAuthElements(document) {
  const root = document.createElement('span');
  root.hidden = true;
  root.innerHTML = `
    <a data-auth-signed-out href="/auth/sign-in" hidden>Sign in</a>
    <a data-auth-account hidden>Account</a>
    <a data-auth-feedback href="/feedback" hidden>Feedback</a>
    <button data-auth-signed-in hidden>Sign out</button>
    <span data-auth-status hidden></span>
  `;
  document.body.append(root);

  return {
    root,
    signedOutLink: root.querySelector('[data-auth-signed-out]'),
    accountLink: root.querySelector('[data-auth-account]'),
    feedbackLink: root.querySelector('[data-auth-feedback]'),
    signedInButton: root.querySelector('[data-auth-signed-in]'),
    statusElement: root.querySelector('[data-auth-status]')
  };
}

function input(elements, value) {
  elements.confirmationInput.value = value;
  elements.confirmationInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(elements) {
  elements.form.dispatchEvent(new Event('submit', {
    bubbles: true,
    cancelable: true
  }));
}

async function initializeAuthenticatedAccount(document, deletionResponder) {
  const calls = installFetchQueue([
    jsonResponse({ authenticated: true }),
    ...(deletionResponder === undefined ? [] : [deletionResponder])
  ]);
  const elements = createAccountElements(document);
  initializeAccountDeletion(elements);
  await settle();
  assert.equal(elements.accountContent.hidden, false);
  return { calls, elements };
}

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('private Account route and discovery', { concurrency: false }, () => {
  test('/account is noindex, absent from the sitemap, and not statically linked publicly', () => {
    const page = readFileSync(new URL('../src/pages/account.astro', import.meta.url), 'utf8');
    const sitemap = readFileSync(new URL('../src/pages/sitemap.xml.ts', import.meta.url), 'utf8');
    const robots = readFileSync(new URL('../src/pages/robots.txt.ts', import.meta.url), 'utf8');
    const sessionControl = readFileSync(
      new URL('../src/components/AuthSessionControl.astro', import.meta.url),
      'utf8'
    );

    assert.match(page, /robots: 'noindex,nofollow'/u);
    assert.doesNotMatch(page, /structuredData|application\/ld\+json|og:/u);
    assert.doesNotMatch(sitemap, /['"]\/account/u);
    assert.match(robots, /'Disallow: \/account'/u);
    assert.doesNotMatch(sessionControl, /href=["']\/account["']/u);
  });

  test('signed-out Account navigation stays undiscoverable and signed-in navigation gains a fixed link', async () => {
    await withDom(async ({ document }) => {
      installFetchQueue([jsonResponse({ authenticated: false })]);
      const elements = createAuthElements(document);
      initializeAuthSessionControl(elements);
      await settle();

      assert.equal(elements.signedOutLink.hidden, false);
      assert.equal(elements.accountLink.hidden, true);
      assert.equal(elements.accountLink.hasAttribute('href'), false);
    });

    await withDom(async ({ document }) => {
      installFetchQueue([jsonResponse({ authenticated: true })]);
      const elements = createAuthElements(document);
      initializeAuthSessionControl(elements);
      await settle();

      assert.equal(elements.signedOutLink.hidden, true);
      assert.equal(elements.accountLink.hidden, false);
      assert.equal(elements.accountLink.getAttribute('href'), '/account');
      assert.equal(elements.feedbackLink.hidden, false);
      assert.equal(elements.signedInButton.hidden, false);
    });
  });

  test('an unauthenticated Account route follows the existing fixed sign-in redirect', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      installFetchQueue([jsonResponse({ authenticated: false })]);
      const elements = createAccountElements(document);
      initializeAccountDeletion(elements);
      await settle();

      assert.deepEqual(replaceCalls, ['/auth/sign-in']);
      assert.equal(elements.accountContent.hidden, true);
    });
  });
});

describe('bounded confirmation behavior', { concurrency: false }, () => {
  test('the first click only opens the disclosure and focuses the labeled input', async () => {
    await withDom(async ({ document }) => {
      const { calls, elements } = await initializeAuthenticatedAccount(document);
      elements.openButton.click();

      assert.equal(calls.length, 1);
      assert.equal(elements.confirmationRegion.hidden, false);
      assert.equal(elements.openButton.getAttribute('aria-expanded'), 'true');
      assert.strictEqual(document.activeElement, elements.confirmationInput);
      assert.strictEqual(document.querySelector('label').control, elements.confirmationInput);
      assert.equal(elements.submitButton.disabled, true);
    });
  });

  test('only exact case-sensitive DELETE enables the final action', async () => {
    await withDom(async ({ document }) => {
      const { elements } = await initializeAuthenticatedAccount(document);
      elements.openButton.click();

      for (const value of ['', 'delete', 'Delete', ' DELETE', 'DELETE ']) {
        input(elements, value);
        assert.equal(elements.submitButton.disabled, true, `${JSON.stringify(value)} enabled deletion`);
      }

      input(elements, 'DELETE');
      assert.equal(elements.submitButton.disabled, false);
    });
  });

  test('Cancel closes and resets the disclosure without another API call', async () => {
    await withDom(async ({ document }) => {
      const { calls, elements } = await initializeAuthenticatedAccount(document);
      elements.openButton.click();
      input(elements, 'DELETE');
      elements.cancelButton.click();

      assert.equal(calls.length, 1);
      assert.equal(elements.confirmationInput.value, '');
      assert.equal(elements.confirmationRegion.hidden, true);
      assert.equal(elements.openButton.getAttribute('aria-expanded'), 'false');
      assert.strictEqual(document.activeElement, elements.openButton);
    });
  });
});

describe('account deletion request and response handling', { concurrency: false }, () => {
  test('sends the exact target-free request and blocks duplicate submission while pending', async () => {
    await withDom(async ({ document }) => {
      let releaseDeletion;
      const deletionResponse = new Promise((resolve) => {
        releaseDeletion = resolve;
      });
      const { calls, elements } = await initializeAuthenticatedAccount(
        document,
        () => deletionResponse
      );
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      submit(elements);

      assert.equal(calls.length, 2);
      const deletionCall = calls[1];
      assert.equal(deletionCall.input, '/api/account');
      assert.equal(deletionCall.init.method, 'DELETE');
      assert.deepEqual(deletionCall.init.headers, { 'Content-Type': 'application/json' });
      assert.equal(deletionCall.init.credentials, 'same-origin');
      assert.equal(deletionCall.init.body, '{"confirmation":"DELETE"}');
      assert.deepEqual(Object.keys(JSON.parse(deletionCall.init.body)), ['confirmation']);
      assert.equal(elements.form.getAttribute('aria-busy'), 'true');
      assert.equal(elements.submitButton.disabled, true);
      assert.equal(elements.confirmationInput.disabled, true);
      assert.equal(elements.pendingStatus.hidden, false);

      releaseDeletion(emptyResponse(500));
      await settle();
    });
  });

  test('204 hides private state and uses replacement navigation to home', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const { elements } = await initializeAuthenticatedAccount(document, emptyResponse(204));
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      await settle();

      assert.deepEqual(replaceCalls, ['/']);
      assert.equal(elements.accountContent.hidden, true);
      assert.equal(elements.form.getAttribute('aria-busy'), 'true');
    });
  });

  test('403 presents focused Email Magic Link reauthentication without retrying', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const { calls, elements } = await initializeAuthenticatedAccount(
        document,
        jsonResponse({
          error: {
            code: 'RECENT_AUTHENTICATION_REQUIRED',
            message: 'Recent authentication is required.'
          }
        }, 403)
      );
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      await settle();

      assert.equal(calls.length, 2);
      assert.equal(elements.reauthStatus.hidden, false);
      assert.strictEqual(document.activeElement, elements.reauthStatus);
      assert.equal(elements.reauthStatus.querySelector('a').getAttribute('href'), '/auth/sign-in');
      assert.equal(elements.confirmationInput.disabled, true);
      assert.equal(elements.submitButton.disabled, true);
      assert.deepEqual(replaceCalls, []);
    });
  });

  test('an unrelated 403 remains a generic failure instead of impersonating reauthentication', async () => {
    await withDom(async ({ document }) => {
      const { elements } = await initializeAuthenticatedAccount(
        document,
        jsonResponse({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } }, 403)
      );
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      await settle();

      assert.equal(elements.reauthStatus.hidden, true);
      assert.equal(elements.errorStatus.hidden, false);
      assert.match(elements.errorStatus.textContent, /No successful deletion was confirmed/u);
    });
  });

  test('400 leaves a bounded focused error and does not claim success', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const { elements } = await initializeAuthenticatedAccount(document, emptyResponse(400));
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      await settle();

      assert.equal(elements.errorStatus.hidden, false);
      assert.match(elements.errorStatus.textContent, /confirmation/u);
      assert.strictEqual(document.activeElement, elements.errorStatus);
      assert.equal(elements.confirmationInput.getAttribute('aria-invalid'), 'true');
      assert.equal(elements.submitButton.disabled, true);
      assert.equal(elements.accountContent.hidden, false);
      assert.deepEqual(replaceCalls, []);
    });
  });

  test('401 hides private state and follows fixed signed-out navigation without deletion success', async () => {
    await withDom(async ({ document, replaceCalls }) => {
      const { elements } = await initializeAuthenticatedAccount(document, emptyResponse(401));
      elements.openButton.click();
      input(elements, 'DELETE');
      submit(elements);
      await settle();

      assert.deepEqual(replaceCalls, ['/auth/sign-in']);
      assert.equal(elements.accountContent.hidden, true);
      assert.equal(elements.errorStatus.hidden, true);
    });
  });

  for (const [name, responder] of [
    ['500', emptyResponse(500)],
    ['network failure', () => Promise.reject(new Error('network unavailable'))]
  ]) {
    test(`${name} preserves the page and reports no confirmed success`, async () => {
      await withDom(async ({ document, replaceCalls }) => {
        const { elements } = await initializeAuthenticatedAccount(document, responder);
        elements.openButton.click();
        input(elements, 'DELETE');
        submit(elements);
        await settle();

        assert.equal(elements.accountContent.hidden, false);
        assert.equal(elements.errorStatus.hidden, false);
        assert.match(elements.errorStatus.textContent, /No successful deletion was confirmed/u);
        assert.equal(elements.form.getAttribute('aria-busy'), 'false');
        assert.equal(elements.confirmationInput.value, 'DELETE');
        assert.deepEqual(replaceCalls, []);
      });
    });
  }
});
