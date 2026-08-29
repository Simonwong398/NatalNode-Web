import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { afterEach, describe, test } from 'node:test';
import { Window } from 'happy-dom';

import {
  createNotificationClient,
} from '../dist/notifications-characterization/features/notifications/notification-client.js';
import {
  base64UrlToUint8Array,
  initializeNotificationSettings,
  pushSubscriptionToRequest
} from '../dist/notifications-characterization/features/notifications/notification-settings.js';
import {
  isSafeNotificationPath,
  parseNotificationPayload
} from '../dist/notifications-characterization/features/notifications/notification-sw-policy.js';

const GLOBAL_NAMES = [
  'window',
  'document',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'Event'
];
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
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLInputElement: window.HTMLInputElement,
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
  installWindow(window);
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

function validApplicationServerKey() {
  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.alloc(64, 0x01)
  ]).toString('base64url');
}

function createState(overrides = {}) {
  return {
    webPushCapability: {
      configured: true,
      applicationServerKey: validApplicationServerKey()
    },
    channelPreferences: { WEB_PUSH: null },
    categoryPreferences: {
      ACCOUNT: null,
      SYSTEM: null,
      ASTROLOGY_ALERT: null
    },
    pushSubscriptions: [],
    ...overrides
  };
}

function createElements(document) {
  const root = document.createElement('section');
  root.innerHTML = `
    <p data-notifications-loading></p>
    <div data-notifications-content>
      <p data-notifications-permission></p>
      <p data-notifications-connection></p>
      <button class="nn-button nn-button--primary" data-notifications-enable type="button"></button>
      <button data-notifications-disable type="button"></button>
      <input data-notifications-category="ACCOUNT" type="checkbox">
      <span data-notifications-category-state="ACCOUNT"></span>
      <input data-notifications-category="SYSTEM" type="checkbox">
      <span data-notifications-category-state="SYSTEM"></span>
      <input data-notifications-category="ASTROLOGY_ALERT" type="checkbox">
      <span data-notifications-category-state="ASTROLOGY_ALERT"></span>
      <p data-notifications-status></p>
      <p data-notifications-error></p>
    </div>
  `;
  document.body.append(root);

  return {
    root,
    loading: root.querySelector('[data-notifications-loading]'),
    content: root.querySelector('[data-notifications-content]'),
    permissionStatus: root.querySelector('[data-notifications-permission]'),
    connectionStatus: root.querySelector('[data-notifications-connection]'),
    enableButton: root.querySelector('[data-notifications-enable]'),
    disableButton: root.querySelector('[data-notifications-disable]'),
    status: root.querySelector('[data-notifications-status]'),
    error: root.querySelector('[data-notifications-error]'),
    categoryControls: ['ACCOUNT', 'SYSTEM', 'ASTROLOGY_ALERT'].map((category) => ({
      category,
      input: root.querySelector(`[data-notifications-category="${category}"]`),
      state: root.querySelector(`[data-notifications-category-state="${category}"]`)
    }))
  };
}

function createSubscription() {
  const key = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const auth = Uint8Array.from({ length: 8 }, (_, index) => index + 21);

  return {
    endpoint: 'https://push.example.test/subscription-a',
    getKey(name) {
      return name === 'p256dh' ? key.buffer : auth.buffer;
    },
    async unsubscribe() {
      return true;
    }
  };
}

function createBrowser({ permission = 'default', subscription = null } = {}) {
  const calls = [];
  let currentSubscription = subscription;
  const registration = { name: 'registration', pushManager: {} };
  const browser = {
    getPermission() {
      calls.push(['permission']);
      return permission;
    },
    async requestPermission() {
      calls.push(['requestPermission']);
      return 'granted';
    },
    async getExistingServiceWorkerRegistration() {
      calls.push(['getExistingRegistration']);
      return currentSubscription === null ? null : registration;
    },
    async registerServiceWorker(scriptUrl, scope) {
      calls.push(['registerServiceWorker', scriptUrl, scope]);
      return registration;
    },
    async getSubscription(receivedRegistration) {
      assert.equal(receivedRegistration, registration);
      calls.push(['getSubscription']);
      return currentSubscription;
    },
    async subscribe(receivedRegistration, applicationServerKey) {
      assert.equal(receivedRegistration, registration);
      assert.equal(applicationServerKey.length, 65);
      assert.equal(applicationServerKey[0], 0x04);
      calls.push(['subscribe', applicationServerKey]);
      currentSubscription = createSubscription();
      return currentSubscription;
    },
    async unsubscribe(receivedSubscription) {
      assert.equal(receivedSubscription, currentSubscription);
      calls.push(['unsubscribe']);
      currentSubscription = null;
      return true;
    },
    toRegistrationRequest(receivedSubscription) {
      calls.push(['mapSubscription']);
      return pushSubscriptionToRequest(receivedSubscription);
    }
  };

  return { browser, calls, registration };
}

function createClient(initialState, calls, overrides = {}) {
  let currentState = initialState;
  return {
    async getState() {
      calls.push(['getState']);
      return { status: 'success', state: currentState };
    },
    async setChannelPreference(enabled) {
      calls.push(['setChannel', enabled]);
      currentState = {
        ...currentState,
        channelPreferences: { WEB_PUSH: enabled }
      };
      return { status: 'success', preference: { preference: { enabled } } };
    },
    async setCategoryPreference(category, enabled) {
      calls.push(['setCategory', category, enabled]);
      currentState = {
        ...currentState,
        categoryPreferences: {
          ...currentState.categoryPreferences,
          [category]: enabled
        }
      };
      return { status: 'success', preference: { preference: { category, enabled } } };
    },
    async registerPushSubscription(request) {
      calls.push(['register', request]);
      return {
        status: 'success',
        subscription: {
          subscriptionId: 'server-subscription-1',
          channel: 'WEB_PUSH',
          status: 'ACTIVE',
          createdAt: '2026-08-29T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:00.000Z',
          lastSuccessAt: null,
          invalidatedAt: null
        }
      };
    },
    async removePushSubscription(subscriptionId) {
      calls.push(['remove', subscriptionId]);
      return { status: 'success' };
    },
    ...overrides
  };
}

const SUPPORTED = {
  notification: true,
  serviceWorker: true,
  pushManager: true,
  supported: true
};

afterEach(() => {
  assert.equal(activeWindow, undefined, 'test cleanup did not finish');
});

describe('notification browser foundation', { concurrency: false }, () => {
  test('initial load reads state without requesting permission or mutating subscription state', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();

      initializeNotificationSettings(
        elements,
        {
          client: createClient(createState(), clientCalls),
          browser: browser.browser,
          getCapabilities: () => SUPPORTED
        }
      );
      await settle();

      assert.deepEqual(clientCalls, [['getState']]);
      assert.deepEqual(browser.calls, [['permission'], ['getExistingRegistration']]);
      assert.equal(elements.enableButton.disabled, false);
      assert.equal(elements.permissionStatus.textContent, 'Permission has not been requested on this browser.');
    });
  });

  test('unsupported or unconfigured environments never request permission', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();
      initializeNotificationSettings(
        elements,
        {
          client: createClient(createState({
            webPushCapability: { configured: false, applicationServerKey: null }
          }), clientCalls),
          browser: browser.browser,
          getCapabilities: () => ({ ...SUPPORTED, supported: false, pushManager: false })
        }
      );
      await settle();

      assert.deepEqual(clientCalls, [['getState']]);
      assert.equal(browser.calls.some(([name]) => name === 'requestPermission'), false);
      assert.equal(elements.enableButton.disabled, true);
      assert.equal(elements.enableButton.classList.contains('nn-button--primary'), false);
      assert.equal(elements.enableButton.classList.contains('nn-button--unavailable'), true);
      assert.equal(elements.connectionStatus.textContent, 'Browser notifications are currently unavailable.');
      assert.doesNotMatch(
        elements.connectionStatus.textContent,
        /VAPID|application server key|PushSubscription|Service Worker|this environment|server configuration|Web Push/iu
      );
    });
  });

  test('denied permission is never re-prompted or mutated by an enable action', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser({ permission: 'denied' });
      initializeNotificationSettings(elements, {
        client: createClient(createState(), clientCalls),
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.enableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.equal(browser.calls.some(([name]) => name === 'requestPermission'), false);
      assert.equal(clientCalls.some(([name]) => name === 'register'), false);
      assert.equal(clientCalls.some(([name]) => name === 'setChannel'), false);
      assert.equal(elements.enableButton.disabled, true);
      assert.equal(elements.enableButton.classList.contains('nn-button--primary'), false);
      assert.equal(elements.enableButton.classList.contains('nn-button--unavailable'), true);
      assert.match(
        elements.permissionStatus.textContent,
        /Browser permission is blocked\. Update this site's browser permission/iu
      );
    });
  });

  test('explicit enable requests permission, registers the worker, creates and registers a subscription, then enables the channel', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();
      initializeNotificationSettings(
        elements,
        {
          client: createClient(createState(), clientCalls),
          browser: browser.browser,
          getCapabilities: () => SUPPORTED
        }
      );
      await settle();
      elements.enableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.deepEqual(browser.calls.map(([name]) => name), [
        'permission',
        'getExistingRegistration',
        'permission',
        'getExistingRegistration',
        'requestPermission',
        'registerServiceWorker',
        'getSubscription',
        'subscribe',
        'mapSubscription',
        'permission',
        'getExistingRegistration',
        'getSubscription'
      ]);
      assert.deepEqual(clientCalls.map(([name]) => name), [
        'getState',
        'getState',
        'register',
        'setChannel',
        'getState'
      ]);
      assert.deepEqual(clientCalls[2][1], {
        endpoint: 'https://push.example.test/subscription-a',
        keys: {
          p256dh: 'AQIDBAUGBwgJCgsMDQ4PEA',
          auth: 'FRYXGBkaGxw'
        }
      });
      assert.equal(elements.status.textContent, 'Notification preference saved for this browser.');
    });
  });

  test('registration conflict rolls back only a subscription created by this enable attempt', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();
      const client = createClient(createState(), clientCalls, {
        async registerPushSubscription() {
          clientCalls.push(['register']);
          return { status: 'conflict' };
        }
      });
      initializeNotificationSettings(elements, {
        client,
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.enableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.equal(browser.calls.some(([name]) => name === 'unsubscribe'), true);
      assert.equal(clientCalls.some(([name]) => name === 'setChannel'), false);
      assert.match(elements.error.textContent, /associated with another account/u);
    });
  });

  test('pre-existing subscription is never unsubscribed when registration fails', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser({ permission: 'granted', subscription: createSubscription() });
      const client = createClient(createState(), clientCalls, {
        async registerPushSubscription() {
          clientCalls.push(['register']);
          return { status: 'unavailable' };
        }
      });
      initializeNotificationSettings(elements, {
        client,
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.enableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.equal(browser.calls.some(([name]) => name === 'unsubscribe'), false);
      assert.equal(clientCalls.some(([name]) => name === 'setChannel'), false);
    });
  });

  test('disable resolves and releases the current subscription before turning off the channel', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser({ permission: 'granted', subscription: createSubscription() });
      const client = createClient(createState({
        channelPreferences: { WEB_PUSH: true }
      }), clientCalls);
      initializeNotificationSettings(elements, {
        client,
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.disableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      const names = clientCalls.map(([name]) => name);
      assert.deepEqual(names, ['getState', 'getState', 'register', 'remove', 'setChannel', 'getState']);
      assert.equal(browser.calls.some(([name]) => name === 'unsubscribe'), true);
      assert.equal(elements.status.textContent, 'Notifications disabled on this browser.');
    });
  });

  test('disable conflict does not delete, unsubscribe, or change the channel preference', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser({ permission: 'granted', subscription: createSubscription() });
      const client = createClient(createState({
        channelPreferences: { WEB_PUSH: true }
      }), clientCalls, {
        async registerPushSubscription() {
          clientCalls.push(['register']);
          return { status: 'conflict' };
        }
      });
      initializeNotificationSettings(elements, {
        client,
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.disableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.equal(clientCalls.some(([name]) => name === 'remove'), false);
      assert.equal(clientCalls.some(([name]) => name === 'setChannel'), false);
      assert.equal(browser.calls.some(([name]) => name === 'unsubscribe'), false);
    });
  });

  test('disable without a native browser subscription changes only the account channel preference', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();
      const client = createClient(createState({
        channelPreferences: { WEB_PUSH: true }
      }), clientCalls);
      initializeNotificationSettings(elements, {
        client,
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      elements.disableButton.dispatchEvent(new Event('click', { bubbles: true }));
      await settle();

      assert.deepEqual(clientCalls.map(([name]) => name), [
        'getState',
        'getState',
        'setChannel',
        'getState'
      ]);
      assert.equal(clientCalls.some(([name]) => name === 'remove'), false);
    });
  });

  test('category rendering keeps null neutral and distinguishes false and true without mutating state', async () => {
    await withDom(async ({ document }) => {
      const elements = createElements(document);
      const clientCalls = [];
      const browser = createBrowser();
      initializeNotificationSettings(elements, {
        client: createClient(createState({
          categoryPreferences: {
            ACCOUNT: null,
            SYSTEM: false,
            ASTROLOGY_ALERT: true
          }
        }), clientCalls),
        browser: browser.browser,
        getCapabilities: () => SUPPORTED
      });
      await settle();
      const accountInput = elements.categoryControls[0].input;
      assert.equal(accountInput.indeterminate, false);
      assert.equal(accountInput.checked, false);
      assert.equal(accountInput.hasAttribute('aria-checked'), false);
      assert.equal(elements.categoryControls[0].state.textContent, 'Not set');
      assert.equal(elements.categoryControls[1].input.indeterminate, false);
      assert.equal(elements.categoryControls[1].input.checked, false);
      assert.equal(elements.categoryControls[1].state.textContent, 'Off');
      assert.equal(elements.categoryControls[2].input.indeterminate, false);
      assert.equal(elements.categoryControls[2].input.checked, true);
      assert.equal(elements.categoryControls[2].state.textContent, 'On');
      assert.deepEqual(clientCalls, [['getState']]);
      accountInput.click();
      await settle();

      assert.deepEqual(clientCalls.map(([name]) => name), [
        'getState',
        'setCategory',
        'getState'
      ]);
      assert.equal(elements.categoryControls[0].state.textContent, 'On');
    });
  });
});

describe('notification payload and browser credential boundaries', () => {
  test('notification API client maps bounded Problem Details statuses without exposing response bodies', async () => {
    for (const [status, expected] of [
      [400, 'invalid-request'],
      [401, 'unauthorized'],
      [409, 'conflict'],
      [429, 'rate-limited'],
      [503, 'unavailable']
    ]) {
      const client = createNotificationClient(async () => new Response('private detail', { status }));
      const result = await client.getState();
      assert.deepEqual(result, { status: expected });
    }
  });

  test('accepts bounded minimal payloads and rejects unsafe paths or extra data', () => {
    assert.deepEqual(parseNotificationPayload({
      version: 1,
      title: 'NatalNode',
      body: 'A bounded update is available.',
      path: '/learn'
    }), {
      version: 1,
      title: 'NatalNode',
      body: 'A bounded update is available.',
      path: '/learn'
    });
    assert.deepEqual(parseNotificationPayload({
      version: 1,
      title: 'NatalNode',
      body: 'Open NatalNode.'
    }).path, '/');
    assert.equal(parseNotificationPayload({
      version: 2,
      title: 'NatalNode',
      body: 'Wrong version.'
    }), null);
    assert.equal(parseNotificationPayload({
      version: 1,
      title: 'NatalNode',
      body: 'Has arbitrary data.',
      data: { endpoint: 'secret' }
    }), null);
    assert.equal(parseNotificationPayload({
      version: 1,
      title: 'NatalNode',
      body: 'Unsafe path.',
      path: 'https://evil.example'
    }), null);
    assert.equal(isSafeNotificationPath('/learn/article-1'), true);
    assert.equal(isSafeNotificationPath('/?redirect=https://evil.example'), false);
    assert.equal(isSafeNotificationPath('//evil.example'), false);
    assert.equal(isSafeNotificationPath('/javascript:alert(1)'), false);
  });

  test('maps only endpoint and native p256dh/auth keys and never uses browser storage', () => {
    const subscription = createSubscription();
    const request = pushSubscriptionToRequest(subscription);

    assert.deepEqual(Object.keys(request), ['endpoint', 'keys']);
    assert.deepEqual(Object.keys(request.keys), ['p256dh', 'auth']);
    assert.equal(request.endpoint, subscription.endpoint);
    assert.equal(base64UrlToUint8Array(validApplicationServerKey()).length, 65);

    const source = readFileSync(
      new URL('../src/features/notifications/notification-settings.ts', import.meta.url),
      'utf8'
    );
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie|analytics/iu);
    assert.doesNotMatch(source, /new\s+Notification\s*\(/u);
  });

  test('keeps the worker narrow and without fetch/cache lifecycle behavior', () => {
    const worker = readFileSync(
      new URL('../public/notification-sw.js', import.meta.url),
      'utf8'
    );
    assert.match(worker, /addEventListener\(['"]push['"]/u);
    assert.match(worker, /addEventListener\(['"]notificationclick['"]/u);
    assert.doesNotMatch(worker, /addEventListener\(['"]fetch['"]/u);
    assert.doesNotMatch(worker, /skipWaiting|clientsClaim|importScripts|caches\./u);
  });

  test('worker displays a bounded fallback for invalid payloads and routes clicks only to safe same-origin paths', async () => {
    const workerSource = readFileSync(
      new URL('../public/notification-sw.js', import.meta.url),
      'utf8'
    );
    const handlers = new Map();
    const shownNotifications = [];
    const openedPaths = [];
    const workerScope = {
      location: { origin: 'https://example.test' },
      registration: {
        async showNotification(title, options) {
          shownNotifications.push({ title, options });
        }
      },
      clients: {
        async matchAll() {
          return [];
        },
        async openWindow(path) {
          openedPaths.push(path);
        }
      },
      addEventListener(name, handler) {
        handlers.set(name, handler);
      }
    };

    vm.runInNewContext(workerSource, {
      self: workerScope,
      URL,
      decodeURIComponent,
      Array,
      Object,
      Promise
    });

    const pushWaits = [];
    handlers.get('push')({
      data: {
        json() {
          return {
            version: 1,
            title: 'NatalNode',
            body: 'not safe',
            path: 'https://evil.example',
            data: { secret: 'must not display' }
          };
        }
      },
      waitUntil(promise) {
        pushWaits.push(promise);
      }
    });
    await Promise.all(pushWaits);

    assert.equal(JSON.stringify(shownNotifications), JSON.stringify([{
      title: 'NatalNode',
      options: {
        body: 'Open NatalNode to view the update.',
        data: { path: '/' }
      }
      }]));

    const clickWaits = [];
    let closed = false;
    handlers.get('notificationclick')({
      notification: {
        data: { path: 'javascript:alert(1)' },
        close() {
          closed = true;
        }
      },
      waitUntil(promise) {
        clickWaits.push(promise);
      }
    });
    await Promise.all(clickWaits);

    assert.equal(closed, true);
    assert.deepEqual(openedPaths, ['/']);
  });
});
