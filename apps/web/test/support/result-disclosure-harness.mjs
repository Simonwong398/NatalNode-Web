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
  'IS_REACT_ACT_ENVIRONMENT',
  'fetch'
];

const ORIGINAL_GLOBAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);
const WORKSPACE_URL = new URL(
  '../../dist/result-disclosure-characterization/features/chart-workspace/ChartWorkspaceView.js',
  import.meta.url
);
const ASTROLOGICAL_NOTATION_URL = new URL(
  '../../dist/result-disclosure-characterization/features/chart-workspace/AstrologicalNotation.js',
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
const SAVE_PANEL_URL = new URL(
  '../../dist/result-disclosure-characterization/features/vault/SaveChartPanel.js',
  import.meta.url
);
const SAVE_VAULT_CHART_URL = new URL(
  '../../dist/result-disclosure-characterization/features/vault/save-vault-chart.js',
  import.meta.url
);
const LOCALIZATION_URL = new URL(
  '../../dist/result-disclosure-characterization/lib/localization.js',
  import.meta.url
);
const CHART_UI_URL = new URL(
  '../../dist/result-disclosure-characterization/core/chart/chart-ui.js',
  import.meta.url
);
const CHART_POLICY_URL = new URL(
  '../../dist/result-disclosure-characterization/core/chart/chart-presentation-policy.js',
  import.meta.url
);
const ASTROLOGY_GLYPH_URL = new URL(
  '../../dist/result-disclosure-characterization/core/astrology-taxonomy/AstrologyGlyph.js',
  import.meta.url
);
const ASTROLOGY_GLOSSARY_URL = new URL(
  '../../dist/result-disclosure-characterization/core/astrology-taxonomy/astrology-glossary.js',
  import.meta.url
);
const CHART_TAXONOMY_URL = new URL(
  '../../dist/result-disclosure-characterization/core/astrology-taxonomy/chart-taxonomy.js',
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

function installWindowGlobals(window, fetchStub) {
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
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: fetchStub
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
          specifier === '@/core/chart' ||
          specifier === '@/features/interpretation'
        ) {
          return nextResolve(PROXIES_URL.href, context);
        }

        if (specifier === './AstrologicalNotation' && context.parentURL === WORKSPACE_URL.href) {
          return nextResolve(ASTROLOGICAL_NOTATION_URL.href, context);
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

        if (specifier === './save-vault-chart' && context.parentURL === SAVE_PANEL_URL.href) {
          return nextResolve(SAVE_VAULT_CHART_URL.href, context);
        }

        if (specifier === '@/lib/localization') {
          return nextResolve(LOCALIZATION_URL.href, context);
        }

        if (specifier === '@/core/chart/chart-ui') {
          return nextResolve(CHART_UI_URL.href, context);
        }

        if (specifier === '@/core/chart/chart-presentation-policy') {
          return nextResolve(CHART_POLICY_URL.href, context);
        }

        if (specifier === '@/core/astrology-taxonomy/AstrologyGlyph') {
          return nextResolve(ASTROLOGY_GLYPH_URL.href, context);
        }

        if (
          specifier === '@/core/astrology-taxonomy/astrology-glossary' ||
          specifier === '@/core/astrology-taxonomy/astrology-glossary.js'
        ) {
          return nextResolve(ASTROLOGY_GLOSSARY_URL.href, context);
        }

        if (specifier === '@/core/astrology-taxonomy/chart-taxonomy') {
          return nextResolve(CHART_TAXONOMY_URL.href, context);
        }

        return nextResolve(specifier, context);
      }
    });

    try {
      const [workspaceModule, savePanelModule] = await Promise.all([
        import(WORKSPACE_URL.href),
        import(SAVE_PANEL_URL.href)
      ]);

      return {
        ChartWorkspaceView: workspaceModule.default,
        SaveChartPanel: savePanelModule.default
      };
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

function findButton(root, name) {
  const matches = exactTextElements(root, 'button', name);
  assert.equal(matches.length, 1, `expected one ${name} button, found ${matches.length}`);
  return matches[0];
}

function findControl(root, labelText) {
  const labels = exactTextElements(root, 'label', labelText);
  assert.equal(labels.length, 1, `expected one ${labelText} label, found ${labels.length}`);
  assert.ok(labels[0].control, `expected ${labelText} to label a control`);
  return labels[0].control;
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

function makeScope(window, container, root, render, fetchCalls) {
  return {
    window,
    document: window.document,
    container,
    root,
    render,
    fetchCalls,
    tab(name) {
      return findTab(container, name);
    },
    panel(name) {
      return panelForTab(container, name);
    },
    button(name) {
      return findButton(container, name);
    },
    control(name) {
      return findControl(container, name);
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
    },
    async change(control, value) {
      const prototype = control instanceof window.HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      descriptor.set.call(control, value);

      await React.act(async () => {
        control.dispatchEvent(new window.Event('input', { bubbles: true }));
        control.dispatchEvent(new window.Event('change', { bubbles: true }));
      });
    },
    async submit(form) {
      await React.act(async () => {
        form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      });
    },
    async flush() {
      await React.act(async () => {
        await Promise.resolve();
        await Promise.resolve();
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

export const TEST_CHART_REQUEST = {
  birth: {
    localDate: '1990-05-15',
    localTime: '07:05',
    locationLabel: 'Fixture City',
    latitude: 34.0522,
    longitude: -118.2437,
    ianaTimeZone: 'America/Los_Angeles',
    resolvedUtcInstant: '1990-05-15T14:05:00.000Z',
    utcOffsetSeconds: -25200,
    timezoneDatabaseVersion: 'fixture-tzdb',
    timezoneResolutionMethod: 'FIXTURE',
    ambiguityStatus: 'EXACT'
  },
  houseSystem: 'PLACIDUS'
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
  const fetchCalls = [];
  const fetchStub = async (input, init) => {
    fetchCalls.push({ input, init, url: String(input) });
    return new Response(null, { status: 500 });
  };
  installWindowGlobals(window, fetchStub);
  const container = window.document.createElement('div');
  window.document.body.append(container);
  let root;
  activeScope = { window, root: null };

  try {
    const { createRoot } = await loadReactDomClient();
    const { ChartWorkspaceView, SaveChartPanel } = await loadComponent();
    root = createRoot(container);
    activeScope.root = root;
    const chart = options.chart ?? focusedChart();
    const presentationPolicy = options.presentationPolicy ?? AVAILABLE_POLICY;
    const chartRequest = options.chartRequest ?? TEST_CHART_REQUEST;
    const savePanel = React.createElement(SaveChartPanel, {
      chartRequest,
      locale: options.locale
    });
    const render = () => {
      root.render(
        React.createElement(
          ChartWorkspaceView,
          {
            chart,
            locale: options.locale,
            presentationPolicy,
            requestedHouseSystem: chartRequest.houseSystem,
            resultTargetRef: options.resultTargetRef
          },
          savePanel
        )
      );
    };

    await React.act(async () => render());
    return await exercise(makeScope(window, container, root, render, fetchCalls));
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
