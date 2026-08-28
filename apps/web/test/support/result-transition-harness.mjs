import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

import { Window } from 'happy-dom';
import React from 'react';

import {
  calculationCalls,
  queueCalculation,
  resetResultTransitionProxies
} from './result-transition-proxies.mjs';

const GLOBAL_NAMES = [
  'window',
  'document',
  'navigator',
  'Node',
  'Element',
  'HTMLElement',
  'Event',
  'MouseEvent',
  'FocusEvent',
  'IS_REACT_ACT_ENVIRONMENT'
];

const ORIGINAL_GLOBAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
const EXPERIENCE_URL = new URL(
  '../../dist/result-transition-characterization/features/chart-experience/ChartExperience.js',
  import.meta.url
);
const CHART_REQUEST_URL = new URL(
  '../../dist/result-transition-characterization/features/chart-experience/chart-request.js',
  import.meta.url
);
const PROXIES_URL = new URL('./result-transition-proxies.mjs', import.meta.url);

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

function installWindowGlobals(window) {
  const values = {
    window,
    document: window.document,
    navigator: window.navigator,
    Node: window.Node,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    FocusEvent: window.FocusEvent,
    IS_REACT_ACT_ENVIRONMENT: true
  };

  for (const name of GLOBAL_NAMES) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      enumerable: ORIGINAL_GLOBAL_DESCRIPTORS.get(name)?.enumerable ?? false,
      writable: true,
      value: values[name]
    });
  }
}

async function loadComponent() {
  componentPromise ??= (async () => {
    const hook = registerHooks({
      resolve(specifier, context, nextResolve) {
        if (
          specifier === '@/features/chart-input' ||
          specifier === '@/features/chart-workspace' ||
          specifier === '@/lib/engine-client'
        ) {
          return nextResolve(PROXIES_URL.href, context);
        }

        if (specifier === './chart-request' && context.parentURL === EXPERIENCE_URL.href) {
          return nextResolve(CHART_REQUEST_URL.href, context);
        }

        return nextResolve(specifier, context);
      }
    });

    try {
      return (await import(EXPERIENCE_URL.href)).default;
    } finally {
      hook.deregister();
    }
  })();

  return componentPromise;
}

async function loadReactDomClient() {
  reactDomClientPromise ??= import('react-dom/client');
  return reactDomClientPromise;
}

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function normalizedText(element) {
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

function findButton(root, name) {
  const matches = [...root.querySelectorAll('button')].filter(
    (button) => normalizedText(button) === name
  );
  assert.equal(matches.length, 1, `expected one ${name} button, found ${matches.length}`);
  return matches[0];
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

export function chartResult(schemaVersion) {
  return { schemaVersion };
}

export function assertNoResultTransitionHarnessLeak() {
  assert.equal(activeScope, undefined, 'a result transition test leaked its active scope');

  for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, name),
      descriptor,
      `global descriptor leaked for ${name}`
    );
  }
}

export async function withResultTransition(exercise) {
  assert.equal(activeScope, undefined, 'a prior result transition test leaked its DOM scope');

  const window = new Window({ url: 'https://example.test/' });
  const focusCalls = [];
  const scrollCalls = [];
  const nativeFocus = window.HTMLElement.prototype.focus;

  Object.defineProperty(window.HTMLElement.prototype, 'focus', {
    configurable: true,
    writable: true,
    value(options) {
      focusCalls.push({ element: this, options });
      return nativeFocus.call(this, options);
    }
  });
  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value(options) {
      scrollCalls.push({ element: this, options });
    }
  });

  installWindowGlobals(window);
  resetResultTransitionProxies();
  const container = window.document.createElement('div');
  window.document.body.append(container);
  let root;
  activeScope = { window };

  const resultFocusCalls = () =>
    focusCalls.filter((call) => call.element.dataset.testid === 'result-target');
  const resultScrollCalls = () =>
    scrollCalls.filter((call) => call.element.dataset.testid === 'result-target');

  const scope = {
    window,
    document: window.document,
    container,
    calculationCalls,
    queueCalculation,
    button(name) {
      return findButton(container, name);
    },
    resultTarget() {
      return container.querySelector('[data-testid="result-target"]');
    },
    activeMode() {
      return container.querySelector('[data-testid="active-mode"]')?.textContent ?? null;
    },
    resultFocusCalls,
    resultScrollCalls,
    async click(element) {
      await React.act(async () => {
        element.click();
        await drainMicrotasks();
      });
    },
    async settle(operation, method, value) {
      await React.act(async () => {
        operation[method](value);
        await drainMicrotasks();
      });
    },
    async rerender() {
      const ChartExperience = await loadComponent();
      await React.act(async () => {
        root.render(React.createElement(ChartExperience));
        await drainMicrotasks();
      });
    }
  };

  try {
    const [{ createRoot }, ChartExperience] = await Promise.all([
      loadReactDomClient(),
      loadComponent()
    ]);
    root = createRoot(container);
    await React.act(async () => {
      root.render(React.createElement(ChartExperience));
      await drainMicrotasks();
    });

    return await exercise(scope);
  } finally {
    if (root) {
      React.act(() => root.unmount());
    }
    container.remove();
    window.close();
    resetResultTransitionProxies();

    for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
      restoreDescriptor(globalThis, name, descriptor);
    }

    activeScope = undefined;
  }
}
