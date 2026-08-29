import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';

import { initializeGoogleSignIn } from '../dist/google-sign-in-characterization/features/auth/google-sign-in.js';

const GLOBAL_NAMES = [
  'window',
  'document',
  'HTMLElement',
  'HTMLFormElement',
  'Event',
  'fetch'
];
const ORIGINAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);

function restore(object, property, descriptor) {
  if (descriptor === undefined) {
    delete object[property];
    return;
  }

  Object.defineProperty(object, property, descriptor);
}

function installGlobals(window, fetch) {
  const values = {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    HTMLFormElement: window.HTMLFormElement,
    Event: window.Event,
    fetch
  };

  for (const name of GLOBAL_NAMES) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: ORIGINAL_DESCRIPTORS.get(name)?.enumerable ?? false,
      writable: true,
      value: values[name]
    });
  }
}

function jsonResponse(payload, status = 200) {
  return {
    status,
    async json() {
      return payload;
    }
  };
}

function createElements(document) {
  const emailForm = document.createElement('form');
  const emailInput = document.createElement('input');
  emailForm.append(emailInput);

  const option = document.createElement('div');
  option.setAttribute('aria-hidden', 'true');
  option.hidden = true;

  const googleForm = document.createElement('form');
  googleForm.method = 'post';
  googleForm.action = '/api/auth/google/start';
  const googleButton = document.createElement('button');
  googleButton.type = 'submit';
  googleButton.textContent = 'Continue with Google';
  googleForm.append(googleButton);
  option.append(googleForm);

  const failureStatus = document.createElement('p');
  failureStatus.hidden = true;

  document.body.append(emailForm, option, failureStatus);

  return { emailForm, emailInput, option, failureStatus };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function withScope(url, fetchImplementation, exercise) {
  const window = new Window({ url });
  installGlobals(window, fetchImplementation);
  const elements = createElements(window.document);

  try {
    return await exercise({ window, ...elements });
  } finally {
    window.document.body.replaceChildren();
    window.close();
    for (const [name, descriptor] of ORIGINAL_DESCRIPTORS) {
      restore(globalThis, name, descriptor);
    }
  }
}

afterEach(() => {
  for (const [name, descriptor] of ORIGINAL_DESCRIPTORS) {
    assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, name), descriptor);
  }
});

test('server-owned capability reveals one empty native Google POST action', async () => {
  const calls = [];

  await withScope(
    'https://example.test/auth/sign-in',
    async (input, options) => {
      calls.push({ input, options });
      return jsonResponse({
        authenticated: false,
        googleSignInAvailable: true
      });
    },
    async ({ option }) => {
      initializeGoogleSignIn({
        emailForm: option.previousElementSibling,
        option,
        failureStatus: option.nextElementSibling
      });
      await settle();

      assert.equal(calls.length, 1);
      assert.equal(calls[0].input, '/api/auth/session');
      assert.deepEqual(calls[0].options, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      });
      assert.equal(option.hidden, false);
      assert.equal(option.hasAttribute('aria-hidden'), false);

      const form = option.querySelector('form');
      const button = option.querySelector('button');
      assert.equal(form.getAttribute('method'), 'post');
      assert.equal(form.getAttribute('action'), '/api/auth/google/start');
      assert.equal(form.querySelectorAll('input').length, 0);
      assert.equal(button.textContent, 'Continue with Google');
      assert.equal(option.querySelectorAll('button').length, 1);
    }
  );
});

test('capability false keeps the Google action hidden without affecting Email Magic Link', async () => {
  await withScope(
    'https://example.test/auth/sign-in',
    async () => jsonResponse({ authenticated: false, googleSignInAvailable: false }),
    async ({ emailForm, option, failureStatus }) => {
      initializeGoogleSignIn({ emailForm, option, failureStatus });
      await settle();

      assert.equal(option.hidden, true);
      assert.equal(option.getAttribute('aria-hidden'), 'true');
      assert.equal(emailForm.hidden, false);
      assert.equal(failureStatus.hidden, true);
    }
  );
});

test('capability request failure fails closed and does not display raw errors', async () => {
  const rawError = 'provider-secret=should-never-render';

  await withScope(
    'https://example.test/auth/sign-in',
    async () => {
      throw new Error(rawError);
    },
    async ({ emailForm, option, failureStatus }) => {
      initializeGoogleSignIn({ emailForm, option, failureStatus });
      await settle();

      assert.equal(option.hidden, true);
      assert.equal(emailForm.hidden, false);
      assert.equal(failureStatus.textContent, '');
      assert.doesNotMatch(document.body.textContent, /provider-secret/u);
    }
  );
});

test('fixed callback failure marker renders bounded copy and clears on email interaction', async () => {
  await withScope(
    'https://example.test/auth/sign-in#google-auth-failed',
    async () => jsonResponse({ authenticated: false, googleSignInAvailable: false }),
    async ({ emailForm, emailInput, option, failureStatus }) => {
      initializeGoogleSignIn({ emailForm, option, failureStatus });
      await settle();

      assert.equal(failureStatus.hidden, false);
      assert.equal(
        failureStatus.textContent,
        'Google sign-in could not be completed. Try again or use email sign-in.'
      );

      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      assert.equal(failureStatus.hidden, true);
      assert.equal(failureStatus.textContent, '');
    }
  );
});

test('non-marker fragments never become dynamic Google error content', async () => {
  await withScope(
    'https://example.test/auth/sign-in#error=provider-secret',
    async () => jsonResponse({ authenticated: false, googleSignInAvailable: true }),
    async ({ emailForm, option, failureStatus }) => {
      initializeGoogleSignIn({ emailForm, option, failureStatus });
      await settle();

      assert.equal(failureStatus.hidden, true);
      assert.equal(failureStatus.textContent, '');
      assert.equal(option.hidden, false);
    }
  );
});
