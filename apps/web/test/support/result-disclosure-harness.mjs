import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

import { WEB_UI_FIXTURE_V1 } from '@natalnode/test-fixtures';
import { Window } from 'happy-dom';
import React from 'react';

const GLOBAL_NAMES = [
  'window',
  'document',
  'navigator',
  'Node',
  'Element',
  'HTMLElement',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'IS_REACT_ACT_ENVIRONMENT'
];

const ORIGINAL_GLOBAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
const WORKSPACE_URL = new URL(
  '../../dist/result-disclosure-characterization/features/chart-workspace/ChartWorkspaceView.js',
  import.meta.url
);
const INTERPRETATION_URL = new URL(
  '../../dist/result-disclosure-characterization/features/interpretation/InterpretationPanel.js',
  import.meta.url
);
const DETERMINISTIC_INTERPRETATION_URL = new URL(
  '../../dist/result-disclosure-characterization/features/interpretation/deterministic-interpretation.js',
  import.meta.url
);
const INTERPRETATION_CONTENT_URL = new URL(
  '../../dist/result-disclosure-characterization/features/interpretation/interpretation-content.js',
  import.meta.url
);
const PROXIES_URL = new URL('./result-disclosure-proxies.mjs', import.meta.url);

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
    KeyboardEvent: window.KeyboardEvent,
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
          specifier === '@/features/calculation-details' ||
          specifier === '@/features/chart-renderer' ||
          specifier === '@/features/interpretation' ||
          (specifier === './AstrologicalNotation' && context.parentURL === WORKSPACE_URL.href)
        ) {
          return nextResolve(PROXIES_URL.href, context);
        }

        if (
          specifier === './deterministic-interpretation' &&
          context.parentURL === INTERPRETATION_URL.href
        ) {
          return nextResolve(DETERMINISTIC_INTERPRETATION_URL.href, context);
        }

        if (
          specifier === './interpretation-content' &&
          context.parentURL === DETERMINISTIC_INTERPRETATION_URL.href
        ) {
          return nextResolve(INTERPRETATION_CONTENT_URL.href, context);
        }

        return nextResolve(specifier, context);
      }
    });

    try {
      return (await import(WORKSPACE_URL.href)).default;
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

function normalizedText(element) {
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

function exactTextElements(root, selector, text) {
  return [...root.querySelectorAll(selector)].filter(
    (element) => normalizedText(element) === text
  );
}

function findTab(root, name) {
  const matches = exactTextElements(root, '[role="tab"]', name);
  assert.equal(matches.length, 1, `expected one ${name} tab, found ${matches.length}`);
  return matches[0];
}

function findDisclosure(root, name) {
  const matches = [...root.querySelectorAll('button[aria-expanded]')].filter((button) =>
    [...button.querySelectorAll('.nn-type-label')].some(
      (label) => normalizedText(label) === name
    )
  );
  assert.equal(matches.length, 1, `expected one ${name} disclosure, found ${matches.length}`);
  return matches[0];
}

function findAvailability(root, name) {
  const matches = [...root.querySelectorAll('section')].filter((section) => {
    const heading = section.querySelector(':scope > h4');
    return heading && normalizedText(heading) === name && section.querySelector('button') === null;
  });
  assert.equal(matches.length, 1, `expected one ${name} availability section, found ${matches.length}`);
  return matches[0];
}

function panelForTab(root, name) {
  const tab = findTab(root, name);
  const panel = root.ownerDocument.getElementById(tab.getAttribute('aria-controls'));
  assert.ok(panel, `expected a panel controlled by the ${name} tab`);
  assert.ok(root.contains(panel), `expected the ${name} panel inside the result workspace`);
  return panel;
}

function makeScope(window, container, root, render) {
  return {
    window,
    document: window.document,
    container,
    root,
    render,
    tab(name) {
      return findTab(container, name);
    },
    panel(name) {
      return panelForTab(container, name);
    },
    disclosure(name) {
      return findDisclosure(container, name);
    },
    availability(name) {
      return findAvailability(container, name);
    },
    disclosureContent(name) {
      const control = findDisclosure(container, name);
      const content = window.document.getElementById(control.getAttribute('aria-controls'));
      assert.ok(content === null || container.contains(content));
      return content;
    },
    text(element = container) {
      return normalizedText(element);
    },
    async click(element) {
      await React.act(async () => {
        element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      });
    },
    async key(element, key) {
      await React.act(async () => {
        element.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, key }));
      });
    }
  };
}

export const AVAILABLE_POLICY = {
  showAngles: true,
  showHouses: true,
  showHouseInterpretation: true
};

export const UNKNOWN_TIME_POLICY = {
  showAngles: false,
  showHouses: false,
  showHouseInterpretation: false
};

export function focusedChart() {
  const bodyIds = new Set(['Sun', 'Moon', 'Mercury']);

  return {
    ...WEB_UI_FIXTURE_V1,
    bodies: WEB_UI_FIXTURE_V1.bodies.filter((body) => bodyIds.has(body.bodyId)),
    aspects: WEB_UI_FIXTURE_V1.aspects.filter(
      (aspect) => bodyIds.has(aspect.firstBodyId) && bodyIds.has(aspect.secondBodyId)
    ).slice(0, 1)
  };
}

export function assertNoResultDisclosureHarnessLeak() {
  assert.equal(activeScope, undefined, 'a result disclosure test leaked its active scope');

  for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, name),
      descriptor,
      `global descriptor leaked for ${name}`
    );
  }
}

export async function withResultWorkspace(options = {}, exercise) {
  assert.equal(activeScope, undefined, 'a prior result disclosure test leaked its DOM scope');

  const window = new Window({ url: 'https://example.test/' });
  installWindowGlobals(window);
  const container = window.document.createElement('div');
  window.document.body.append(container);
  let root;
  activeScope = { window, root: null };

  try {
    const { createRoot } = await loadReactDomClient();
    const ChartWorkspaceView = await loadComponent();
    root = createRoot(container);
    activeScope.root = root;
    const chart = options.chart ?? focusedChart();
    const presentationPolicy = options.presentationPolicy ?? AVAILABLE_POLICY;
    const savePanel = React.createElement(
      'section',
      { 'data-testid': 'save-chart-panel' },
      'Save this chart'
    );
    const render = () => {
      root.render(
        React.createElement(
          ChartWorkspaceView,
          {
            chart,
            presentationPolicy,
            requestedHouseSystem: 'PLACIDUS'
          },
          savePanel
        )
      );
    };

    await React.act(async () => render());
    return await exercise(makeScope(window, container, root, render));
  } finally {
    if (root) {
      React.act(() => root.unmount());
    }
    container.remove();
    window.close();

    for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
      restoreDescriptor(globalThis, name, descriptor);
    }

    activeScope = undefined;
  }
}
