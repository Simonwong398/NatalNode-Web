import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

import { Window } from 'happy-dom';
import React from 'react';

const GLOBAL_NAMES = [
  'window',
  'self',
  'document',
  'navigator',
  'Node',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'IS_REACT_ACT_ENVIRONMENT',
  'fetch'
];

const ORIGINAL_GLOBAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
const COMPONENT_URL = new URL(
  '../../dist/vault-chart-management-characterization/VaultChartManagement.js',
  import.meta.url
);

let activeScope;
let componentPromise;
let reactDomClientPromise;

function restoreDescriptor(object, property, descriptor) {
  if (descriptor === undefined) {
    delete object[property];
  } else {
    Object.defineProperty(object, property, descriptor);
  }
}

function installGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: ORIGINAL_GLOBAL_DESCRIPTORS.get(name)?.enumerable ?? false,
    writable: true,
    value
  });
}

function installWindowGlobals(window, fetchStub) {
  const values = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    Node: window.Node,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    HTMLSelectElement: window.HTMLSelectElement,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    KeyboardEvent: window.KeyboardEvent,
    FocusEvent: window.FocusEvent,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: fetchStub
  };

  for (const name of GLOBAL_NAMES) {
    installGlobal(name, values[name]);
  }
}

async function loadComponent() {
  if (componentPromise === undefined) {
    componentPromise = (async () => {
      const hook = registerHooks({
        resolve(specifier, context, nextResolve) {
          if (
            specifier === './vault-management' &&
            context.parentURL === COMPONENT_URL.href
          ) {
            return nextResolve('./vault-management.js', context);
          }

          return nextResolve(specifier, context);
        }
      });

      try {
        return (await import(COMPONENT_URL.href)).default;
      } finally {
        hook.deregister();
      }
    })();
  }

  return componentPromise;
}

async function loadReactDomClient() {
  reactDomClientPromise ??= import('react-dom/client');
  return reactDomClientPromise;
}

function requestMethod(init) {
  return init?.method ?? 'GET';
}

function createFetchController() {
  const calls = [];
  const routes = [];

  const fetchStub = async (input, init = undefined) => {
    const call = {
      input,
      init,
      method: requestMethod(init),
      url: String(input)
    };
    calls.push(call);

    const route = routes.find(
      (candidate) =>
        !candidate.used &&
        candidate.method === call.method &&
        candidate.url === call.url
    );

    if (route === undefined) {
      throw new Error(`Unexpected fetch: ${call.method} ${call.url}`);
    }

    route.used = true;
    return typeof route.response === 'function'
      ? route.response(call)
      : route.response;
  };

  return {
    calls,
    fetchStub,
    enqueue(method, url, response) {
      routes.push({ method, url, response, used: false });
    },
    callsFor(method, url) {
      return calls.filter((call) => call.method === method && call.url === url);
    },
    unusedRoutes() {
      return routes.filter((route) => !route.used);
    }
  };
}

function normalizedText(element) {
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

function exactTextElements(root, selector, text) {
  return [...root.querySelectorAll(selector)].filter(
    (element) => normalizedText(element) === text
  );
}

function findButton(root, text) {
  const matches = exactTextElements(root, 'button', text);
  assert.equal(matches.length, 1, `expected one button named "${text}", found ${matches.length}`);
  return matches[0];
}

function findControl(root, labelText) {
  const labels = exactTextElements(root, 'label', labelText);
  assert.equal(labels.length, 1, `expected one label named "${labelText}", found ${labels.length}`);
  assert.ok(labels[0].control, `label "${labelText}" has no associated control`);
  return labels[0].control;
}

function findRole(root, role, text = undefined) {
  const candidates = [...root.querySelectorAll(`[role="${role}"]`)].filter(
    (element) => text === undefined || normalizedText(element) === text
  );
  assert.equal(
    candidates.length,
    1,
    `expected one ${role}${text === undefined ? '' : ` containing "${text}"`}, found ${candidates.length}`
  );
  return candidates[0];
}

function findNoteRow(root, content) {
  const rows = [...root.querySelectorAll('li')].filter((row) =>
    [...row.querySelectorAll('p')].some((paragraph) => normalizedText(paragraph) === content)
  );
  assert.equal(rows.length, 1, `expected one note row for "${content}", found ${rows.length}`);
  return rows[0];
}

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function statusResponse(status) {
  return new Response(null, { status });
}

export function makeVaultChart(overrides = {}) {
  return {
    chartId: 'chart-a',
    userId: 'user-fixture',
    displayName: 'Fixture chart',
    category: 'SELF',
    tags: ['fixture'],
    favorite: false,
    normalizedChartRequest: {},
    canonicalChartResult: {},
    engineVersion: 'fixture-engine',
    chartSchemaVersion: 'fixture-schema',
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
    ...overrides
  };
}

export function makeChartNote(overrides = {}) {
  return {
    noteId: 'note-a',
    chartId: 'chart-a',
    userId: 'user-fixture',
    content: 'First fixture note',
    createdAt: '2026-08-25T01:00:00.000Z',
    updatedAt: '2026-08-25T01:00:00.000Z',
    ...overrides
  };
}

export function requestBody(call) {
  assert.equal(typeof call.init?.body, 'string');
  return JSON.parse(call.init.body);
}

export function assertNoVaultHarnessLeak() {
  assert.equal(activeScope, undefined, 'a Vault component test leaked its active scope');
  for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, name),
      descriptor,
      `global descriptor leaked for ${name}`
    );
  }
}

export async function withVaultChartManagement(options = {}, exercise) {
  assert.equal(activeScope, undefined, 'a prior Vault component test leaked its DOM scope');

  const window = new Window({ url: 'https://example.test/vault/chart?chartId=chart-a' });
  const fetchController = createFetchController();
  const originalLocationHref = window.location.href;
  const originalLocationReplaceDescriptor = Object.getOwnPropertyDescriptor(
    window.location,
    'replace'
  );
  const originalConfirmDescriptor = Object.getOwnPropertyDescriptor(window, 'confirm');
  const confirmCalls = [];
  const confirmResults = [...(options.confirmResults ?? [])];
  const locationReplaceCalls = [];
  let root;
  let container;
  let currentChart = options.chart ?? makeVaultChart();
  const onChartUpdatedCalls = [];
  const onDeletedCalls = [];

  Object.defineProperty(window, 'confirm', {
    configurable: true,
    writable: true,
    value(message) {
      confirmCalls.push(message);
      return confirmResults.length > 0 ? confirmResults.shift() : false;
    }
  });
  Object.defineProperty(window.location, 'replace', {
    configurable: true,
    writable: true,
    value(destination) {
      locationReplaceCalls.push(destination);
    }
  });

  installWindowGlobals(window, fetchController.fetchStub);
  activeScope = { window };

  const scope = {
    window,
    document: window.document,
    fetch: fetchController,
    confirmCalls,
    confirmResults,
    locationReplaceCalls,
    onChartUpdatedCalls,
    onDeletedCalls,
    get container() {
      return container;
    },
    get chart() {
      return currentChart;
    },
    text(element) {
      return normalizedText(element);
    },
    button(text, within = container) {
      return findButton(within, text);
    },
    buttons(text, within = container) {
      return exactTextElements(within, 'button', text);
    },
    control(label, within = container) {
      return findControl(within, label);
    },
    role(role, text = undefined, within = container) {
      return findRole(within, role, text);
    },
    roles(role, within = container) {
      return [...within.querySelectorAll(`[role="${role}"]`)];
    },
    noteRow(content) {
      return findNoteRow(container, content);
    },
    async flush() {
      await React.act(async () => {
        await drainMicrotasks();
      });
    },
    async change(control, value) {
      await React.act(async () => {
        if (control instanceof window.HTMLSelectElement) {
          control.value = value;
          control.dispatchEvent(new window.Event('change', { bubbles: true }));
        } else {
          const prototype = control instanceof window.HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value);
          control.dispatchEvent(new window.Event('input', { bubbles: true }));
          control.dispatchEvent(new window.Event('change', { bubbles: true }));
        }
        await drainMicrotasks();
      });
    },
    async click(element) {
      await React.act(async () => {
        element.click();
        await drainMicrotasks();
      });
    },
    async submit(form) {
      await React.act(async () => {
        form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
        await drainMicrotasks();
      });
    },
    async mount(chart = currentChart) {
      assert.equal(root, undefined, 'scope already has a mounted React root');
      currentChart = chart;
      const [{ createRoot }, VaultChartManagement] = await Promise.all([
        loadReactDomClient(),
        loadComponent()
      ]);
      container = window.document.createElement('div');
      window.document.body.append(container);
      root = createRoot(container);

      await React.act(async () => {
        root.render(
          React.createElement(
            VaultChartManagement,
            {
              chart: currentChart,
              onChartUpdated(updatedChart) {
                onChartUpdatedCalls.push(updatedChart);
                options.onChartUpdated?.(updatedChart);
              },
              onDeleted() {
                onDeletedCalls.push(undefined);
                options.onDeleted?.();
              }
            },
            options.children ?? React.createElement(
              'div',
              { 'data-vault-workspace-sentinel': true },
              'Workspace sentinel'
            )
          )
        );
        await drainMicrotasks();
      });
    },
    async rerender(chart) {
      assert.ok(root, 'scope has no mounted React root');
      currentChart = chart;
      const VaultChartManagement = await loadComponent();
      await React.act(async () => {
        root.render(
          React.createElement(
            VaultChartManagement,
            {
              chart: currentChart,
              onChartUpdated(updatedChart) {
                onChartUpdatedCalls.push(updatedChart);
                options.onChartUpdated?.(updatedChart);
              },
              onDeleted() {
                onDeletedCalls.push(undefined);
                options.onDeleted?.();
              }
            },
            options.children ?? React.createElement(
              'div',
              { 'data-vault-workspace-sentinel': true },
              'Workspace sentinel'
            )
          )
        );
        await drainMicrotasks();
      });
    },
    async unmount() {
      if (root !== undefined) {
        await React.act(async () => {
          root.unmount();
          await drainMicrotasks();
        });
        root = undefined;
      }
    }
  };

  try {
    return await exercise(scope);
  } finally {
    try {
      await scope.unmount();
      if (container !== undefined) {
        assert.equal(container.innerHTML, '', 'React root retained rendered content');
      }
      window.document.body.replaceChildren();
      assert.equal(window.document.body.children.length, 0, 'DOM scope retained body children');
      restoreDescriptor(window.location, 'replace', originalLocationReplaceDescriptor);
      assert.deepEqual(
        Object.getOwnPropertyDescriptor(window.location, 'replace'),
        originalLocationReplaceDescriptor,
        'location.replace descriptor was not restored'
      );
      assert.equal(window.location.href, originalLocationHref, 'location state leaked');
      restoreDescriptor(window, 'confirm', originalConfirmDescriptor);
      assert.deepEqual(
        Object.getOwnPropertyDescriptor(window, 'confirm'),
        originalConfirmDescriptor,
        'confirm descriptor was not restored'
      );
      window.close();
    } finally {
      for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
        restoreDescriptor(globalThis, name, descriptor);
      }
      activeScope = undefined;
    }
  }
}
