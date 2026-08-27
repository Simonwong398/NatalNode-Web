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
  'HTMLSelectElement',
  'HTMLButtonElement',
  'HTMLFormElement',
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
const COMPILED_ROOT_URL = new URL(
  '../../dist/birth-input-form-characterization/',
  import.meta.url
);
const COMPONENT_URL = new URL(
  'features/chart-input/BirthInputForm.js',
  COMPILED_ROOT_URL
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
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLFormElement: window.HTMLFormElement,
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
          if (specifier.startsWith('@/')) {
            const compiledUrl = new URL(`${specifier.slice(2)}.js`, COMPILED_ROOT_URL);
            return nextResolve(compiledUrl.href, context);
          }

          if (
            context.parentURL?.startsWith(COMPILED_ROOT_URL.href) &&
            specifier.startsWith('.') &&
            !specifier.endsWith('.js')
          ) {
            return nextResolve(`${specifier}.js`, context);
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
    `expected one ${role}${text === undefined ? '' : ` named "${text}"`}, found ${candidates.length}`
  );
  return candidates[0];
}

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createFetchBoundary() {
  const calls = [];
  return {
    calls,
    fetchStub(input, init) {
      calls.push({ input, init });
      throw new Error(`Unexpected network access: ${String(input)}`);
    }
  };
}

function renderProps(state, onResolvedInputCalls) {
  const onResolvedInput = state.onResolvedInput;
  const props = {
    isCalculationPending: state.isCalculationPending ?? false,
    onResolvedInput(selection) {
      onResolvedInputCalls.push(selection);
      onResolvedInput?.(selection);
    }
  };

  if (state.resolver !== undefined) {
    props.resolver = state.resolver;
  }

  return props;
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

export function makeExactResolution(overrides = {}) {
  return {
    localDate: '2000-02-29',
    localTime: '07:05',
    locationLabel: 'Exact Fixture Place',
    latitude: 51.5074,
    longitude: -0.1278,
    ianaTimeZone: 'Europe/London',
    resolvedUtcInstant: '2000-02-29T07:05:00.000Z',
    utcOffsetSeconds: 0,
    timezoneDatabaseVersion: 'fixture-tzdb-2026a',
    timezoneResolutionMethod: 'fixture-exact',
    ambiguityStatus: 'EXACT',
    ...overrides
  };
}

export function makeAmbiguousResolution(overrides = {}) {
  return {
    localDate: '2000-11-05',
    localTime: '01:30',
    locationLabel: 'Ambiguous Fixture Place',
    latitude: 40.7128,
    longitude: -74.006,
    ianaTimeZone: 'America/New_York',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    timezoneDatabaseVersion: 'fixture-tzdb-2026a',
    timezoneResolutionMethod: 'fixture-ambiguous',
    ambiguityStatus: 'AMBIGUOUS',
    candidates: [
      {
        occurrence: 'EARLIER',
        resolvedUtcInstant: '2000-11-05T05:30:00.000Z',
        utcOffsetSeconds: -14_400
      },
      {
        occurrence: 'LATER',
        resolvedUtcInstant: '2000-11-05T06:30:00.000Z',
        utcOffsetSeconds: -18_000
      }
    ],
    ...overrides
  };
}

export function makeNonexistentResolution(overrides = {}) {
  return {
    localDate: '2000-04-02',
    localTime: '02:30',
    locationLabel: 'Nonexistent Fixture Place',
    latitude: 40.7128,
    longitude: -74.006,
    ianaTimeZone: 'America/New_York',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    timezoneDatabaseVersion: 'fixture-tzdb-2026a',
    timezoneResolutionMethod: 'fixture-nonexistent',
    ambiguityStatus: 'NONEXISTENT',
    ...overrides
  };
}

export function makeUnknownTimeResolution(overrides = {}) {
  return {
    localDate: '2000-02-29',
    localTime: null,
    locationLabel: 'Unknown Time Fixture Place',
    latitude: 35.6762,
    longitude: 139.6503,
    ianaTimeZone: 'Asia/Tokyo',
    resolvedUtcInstant: null,
    utcOffsetSeconds: null,
    timezoneDatabaseVersion: 'fixture-tzdb-2026a',
    timezoneResolutionMethod: 'fixture-unknown-time',
    ambiguityStatus: 'UNKNOWN_TIME',
    ...overrides
  };
}

export function assertNoBirthInputFormHarnessLeak() {
  assert.equal(activeScope, undefined, 'a BirthInputForm test leaked its active scope');
  for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, name),
      descriptor,
      `global descriptor leaked for ${name}`
    );
  }
}

export async function withBirthInputForm(options = {}, exercise) {
  assert.equal(activeScope, undefined, 'a prior BirthInputForm test leaked its DOM scope');

  const window = new Window({ url: 'https://example.test/calculate' });
  const fetchBoundary = createFetchBoundary();
  const originalLocationHref = window.location.href;
  const state = { ...options };
  const onResolvedInputCalls = [];
  let root;
  let container;

  installWindowGlobals(window, fetchBoundary.fetchStub);
  activeScope = { window };

  const scope = {
    window,
    document: window.document,
    fetchCalls: fetchBoundary.calls,
    onResolvedInputCalls,
    get container() {
      return container;
    },
    text(element) {
      return normalizedText(element);
    },
    button(text) {
      return findButton(container, text);
    },
    buttons(text) {
      return exactTextElements(container, 'button', text);
    },
    control(labelText) {
      return findControl(container, labelText);
    },
    id(id) {
      const element = container.querySelector(`#${id}`);
      assert.ok(element, `expected element #${id}`);
      return element;
    },
    role(role, text = undefined) {
      return findRole(container, role, text);
    },
    roles(role) {
      return [...container.querySelectorAll(`[role="${role}"]`)];
    },
    exact(selector, text) {
      const matches = exactTextElements(container, selector, text);
      assert.equal(matches.length, 1, `expected one ${selector} named "${text}", found ${matches.length}`);
      return matches[0];
    },
    queryExact(selector, text) {
      return exactTextElements(container, selector, text);
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
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(
            control,
            value
          );
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
    async submit() {
      const form = container.querySelector('form');
      assert.ok(form, 'expected BirthInputForm form');
      await React.act(async () => {
        form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
        await drainMicrotasks();
      });
    },
    async mount() {
      assert.equal(root, undefined, 'scope already has a mounted React root');
      const [{ createRoot }, BirthInputForm] = await Promise.all([
        loadReactDomClient(),
        loadComponent()
      ]);
      container = window.document.createElement('div');
      window.document.body.append(container);
      root = createRoot(container);
      await React.act(async () => {
        root.render(React.createElement(BirthInputForm, renderProps(state, onResolvedInputCalls)));
        await drainMicrotasks();
      });
    },
    async rerender(nextOptions = {}) {
      assert.ok(root, 'scope has no mounted React root');
      Object.assign(state, nextOptions);
      const BirthInputForm = await loadComponent();
      await React.act(async () => {
        root.render(React.createElement(BirthInputForm, renderProps(state, onResolvedInputCalls)));
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
      assert.equal(window.location.href, originalLocationHref, 'location state leaked');
      window.close();
    } finally {
      for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
        restoreDescriptor(globalThis, name, descriptor);
      }
      activeScope = undefined;
    }
  }
}
