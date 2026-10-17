import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { Window } from 'happy-dom';
import React from 'react';
import { WEB_UI_FIXTURE_V1 } from '@natalnode/test-fixtures';

const COMPILED_ROOT_URL = new URL(
  '../dist/location-resolution-birth-input-characterization/',
  import.meta.url
);
const COMPONENT_URL = new URL(
  'features/chart-experience/ChartExperience.js',
  COMPILED_ROOT_URL
);

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
  'HTMLFormElement',
  'SVGElement',
  'SVGSVGElement',
  'HTMLDetailsElement',
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

let activeFetchBoundary;
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

async function fetchBoundary(input, init) {
  if (activeFetchBoundary === undefined) {
    throw new Error(`Unexpected network access: ${String(input)}`);
  }

  return activeFetchBoundary.handle(input, init);
}

function installWindowGlobals(window) {
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
    HTMLFormElement: window.HTMLFormElement,
    SVGElement: window.SVGElement,
    SVGSVGElement: window.SVGSVGElement,
    HTMLDetailsElement: window.HTMLDetailsElement,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    KeyboardEvent: window.KeyboardEvent,
    FocusEvent: window.FocusEvent,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: fetchBoundary
  };

  for (const name of GLOBAL_NAMES) {
    installGlobal(name, values[name]);
  }
}

function resolveCompiledAlias(specifier, context, nextResolve) {
  if (!specifier.startsWith('@/')) {
    return undefined;
  }

  const relativePath = specifier.slice(2).replace(/\.js$/u, '');
  const fileUrl = new URL(`${relativePath}.js`, COMPILED_ROOT_URL);
  if (existsSync(fileURLToPath(fileUrl))) {
    return nextResolve(fileUrl.href, context);
  }

  const indexUrl = new URL(`${relativePath}/index.js`, COMPILED_ROOT_URL);
  if (existsSync(fileURLToPath(indexUrl))) {
    return nextResolve(indexUrl.href, context);
  }

  throw new Error(`Compiled alias target does not exist: ${specifier}`);
}

async function loadComponent() {
  componentPromise ??= (async () => {
    const hook = registerHooks({
      resolve(specifier, context, nextResolve) {
        const aliasResolution = resolveCompiledAlias(specifier, context, nextResolve);
        if (aliasResolution !== undefined) {
          return aliasResolution;
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

  return componentPromise;
}

async function loadReactDomClient() {
  reactDomClientPromise ??= import('react-dom/client');
  return reactDomClientPromise;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizedText(element) {
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

function requestBody(call) {
  return JSON.parse(call.init.body);
}

function createFetchBoundary({ search, resolve, chart, vault } = {}) {
  const calls = [];
  let searchIndex = 0;
  let resolveIndex = 0;
  let chartIndex = 0;
  let vaultIndex = 0;

  async function respond(handler, index, endpoint, input, init) {
    if (typeof handler !== 'function') {
      throw new Error(`Unexpected ${endpoint} request in this test.`);
    }

    const result = await handler({ index, input, init });
    if (result instanceof Error) {
      throw result;
    }

    return result instanceof Response ? result : jsonResponse(result);
  }

  return {
    calls,
    async handle(input, init) {
      const endpoint = String(input);
      const call = { endpoint, init };
      calls.push(call);

      if (endpoint === '/api/location/search') {
        return respond(search, searchIndex++, endpoint, input, init);
      }

      if (endpoint === '/api/location/resolve') {
        return respond(resolve, resolveIndex++, endpoint, input, init);
      }

      if (endpoint === '/api/chart') {
        return respond(chart, chartIndex++, endpoint, input, init);
      }

      if (endpoint === '/api/vault/charts') {
        return respond(vault, vaultIndex++, endpoint, input, init);
      }

      throw new Error(`Unexpected endpoint in test: ${endpoint}`);
    }
  };
}

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function candidate({
  candidateId,
  canonicalDisplayName,
  locality,
  region,
  country,
  countryCode = 'CN'
}) {
  return {
    candidateId,
    canonicalDisplayName,
    locality,
    region,
    country,
    countryCode,
    coordinates: { latitude: 31.22222, longitude: 121.45806 },
    authority: {
      kind: 'GEOCODING',
      sourceId: 'geonames-free-web-services',
      recordId: candidateId
    },
    source: {
      sourceVersion: 'geonames-free-web-services-v1',
      datasetVersion: null,
      attribution: { label: 'GeoNames', url: 'https://www.geonames.org/' }
    }
  };
}

function resolvedLocation(locationCandidate, resolutionId = locationCandidate.candidateId) {
  return {
    resolutionId,
    canonicalDisplayName: locationCandidate.canonicalDisplayName,
    locality: locationCandidate.locality,
    region: locationCandidate.region,
    country: locationCandidate.country,
    countryCode: locationCandidate.countryCode,
    coordinates: locationCandidate.coordinates,
    ianaTimeZone: 'Asia/Shanghai',
    status: 'RESOLVED',
    authority: locationCandidate.authority,
    source: locationCandidate.source
  };
}

const englishShanghai = candidate({
  candidateId: 'candidate-shanghai',
  canonicalDisplayName: 'Shanghai, China',
  locality: 'Shanghai',
  region: null,
  country: 'China'
});

const traditionalShanghai = candidate({
  candidateId: 'candidate-shanghai-zh',
  canonicalDisplayName: '上海, 上海市, 中國',
  locality: '上海',
  region: '上海市',
  country: '中國'
});

const beijingCandidate = {
  ...englishShanghai,
  candidateId: 'candidate-beijing',
  canonicalDisplayName: 'Beijing, China',
  locality: 'Beijing',
  coordinates: { latitude: 39.9042, longitude: 116.4074 },
  authority: {
    ...englishShanghai.authority,
    recordId: 'candidate-beijing'
  }
};

const seoulCandidate = {
  ...candidate({
    candidateId: 'candidate-seoul',
    canonicalDisplayName: 'Seoul, South Korea',
    locality: 'Seoul',
    region: null,
    country: 'South Korea',
    countryCode: 'KR'
  }),
  coordinates: { latitude: 37.5665, longitude: 126.978 },
  authority: {
    ...englishShanghai.authority,
    recordId: 'candidate-seoul'
  }
};

const seoulLocation = {
  ...resolvedLocation(seoulCandidate),
  ianaTimeZone: 'Asia/Seoul'
};

const completeChartResult = {
  schemaVersion: '1.0.0',
  engineVersion: 'engine-v1',
  bodies: [
    {
      bodyId: 'Sun',
      longitude: 45.25,
      sign: 'Taurus',
      house: 11,
      retrograde: false
    }
  ],
  angles: [],
  houses: null,
  aspects: [],
  warnings: [],
  calculationStatus: 'COMPLETE',
  metadata: {
    configurationStatus: 'COMPLETE',
    astronomyConfigurationId: 'astro-config-v1',
    provenanceEnvelopeId: 'provenance-v1'
  }
};

function savedInputOnlyRecord(chart) {
  return {
    chartId: 'vault-input-1',
    userId: 'owner-1',
    displayName: 'Shanghai input',
    category: 'SELF',
    tags: [],
    favorite: false,
    normalizedChartRequest: chart,
    canonicalChartResult: null,
    engineVersion: null,
    chartSchemaVersion: null,
    astronomyConfigurationId: null,
    provenanceEnvelopeId: null,
    recordVersion: 1,
    scientificStatus: 'INPUT_ONLY',
    calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
    recordOrigin: 'USER_INPUT',
    sourceContext: 'chart-workspace',
    timeAuthorityState: 'RESOLVED',
    chartResultContractVersion: null,
    scientificConfigurationIdentity: null,
    scientificProvenance: {
      schemaVersion: '1',
      recordOrigin: 'USER_INPUT',
      sourceContext: 'chart-workspace',
      savedAt: '2026-09-04T00:00:00.000Z',
      timeAuthorityState: 'RESOLVED',
      calculationAuthorityState: 'AUTHORITY_INCOMPLETE',
      chartResultContractVersion: null,
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    },
    savedAt: '2026-09-04T00:00:00.000Z',
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z'
  };
}

async function withChartExperience(
  { boundary, locale = 'en', requireResolvedLocation = false },
  exercise
) {
  const window = new Window({ url: `https://example.test/${locale}/` });
  installWindowGlobals(window);
  activeFetchBoundary = boundary;
  const container = window.document.createElement('div');
  window.document.body.append(container);
  let root;

  try {
    const [ChartExperience, { createRoot }] = await Promise.all([
      loadComponent(),
      loadReactDomClient()
    ]);

    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(ChartExperience, {
          locale,
          requireResolvedLocation
        })
      );
      await drainMicrotasks();
    });

    const scope = {
      container,
      input() {
        const element = container.querySelector('#birth-place');
        assert.ok(element, 'expected the real BirthLocationFields input');
        return element;
      },
      form() {
        const element = container.querySelector('form');
        assert.ok(element, 'expected the real BirthInputForm form');
        return element;
      },
      panel() {
        const element = container.querySelector('[data-location-resolution-state]');
        assert.ok(element, 'expected the mounted LocationResolutionPanel');
        return element;
      },
      state() {
        return scope.panel().dataset.locationResolutionState;
      },
      candidateButtons() {
        return [...scope.panel().querySelectorAll('button[data-location-candidate-id]')];
      },
      canonical() {
        return scope.panel().querySelector('[data-location-canonical]');
      },
      rawQuery() {
        return scope.panel().querySelector('[data-location-raw-query]');
      },
      searchCalls() {
        return boundary.calls.filter((call) => call.endpoint === '/api/location/search');
      },
      resolveCalls() {
        return boundary.calls.filter((call) => call.endpoint === '/api/location/resolve');
      },
      chartCalls() {
        return boundary.calls.filter((call) => call.endpoint === '/api/chart');
      },
      vaultCalls() {
        return boundary.calls.filter((call) => call.endpoint === '/api/vault/charts');
      },
      savePanel() {
        const element = container.querySelector('[data-vault-save-mode="INPUT_ONLY"]');
        assert.ok(element, 'expected the current-input Vault save panel');
        return element;
      },
      async change(value) {
        await React.act(async () => {
          const element = scope.input();
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;
          setter.call(element, value);
          element.dispatchEvent(new window.Event('input', { bubbles: true }));
          element.dispatchEvent(new window.Event('change', { bubbles: true }));
          await drainMicrotasks();
        });
      },
      async setValue(id, value) {
        await React.act(async () => {
          const element = container.querySelector(`#${id}`);
          assert.ok(element, `expected #${id}`);
          const prototype = element instanceof window.HTMLSelectElement
            ? window.HTMLSelectElement.prototype
            : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
          setter.call(element, value);
          element.dispatchEvent(new window.Event('input', { bubbles: true }));
          element.dispatchEvent(new window.Event('change', { bubbles: true }));
          await drainMicrotasks();
        });
      },
      async wait(milliseconds = 450) {
        await React.act(async () => {
          await new Promise((resolve) => setTimeout(resolve, milliseconds));
          await drainMicrotasks();
        });
      },
      async flush() {
        await React.act(async () => {
          await drainMicrotasks();
        });
      },
      async click(button) {
        await React.act(async () => {
          button.click();
          await drainMicrotasks();
        });
      },
      async submit() {
        await React.act(async () => {
          scope.form().dispatchEvent(
            new window.Event('submit', { bubbles: true, cancelable: true })
          );
          await new Promise((resolve) => setTimeout(resolve, 10));
          await drainMicrotasks();
        });
      },
      async setSaveValue(name, value) {
        await React.act(async () => {
          const element = scope.savePanel().querySelector(`[name="${name}"]`);
          assert.ok(element, `expected the Vault save field ${name}`);
          const prototype = element instanceof window.HTMLSelectElement
            ? window.HTMLSelectElement.prototype
            : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
          setter.call(element, value);
          element.dispatchEvent(new window.Event('input', { bubbles: true }));
          element.dispatchEvent(new window.Event('change', { bubbles: true }));
          await drainMicrotasks();
        });
      },
      async submitSave() {
        await React.act(async () => {
          const element = scope.savePanel().querySelector('form');
          assert.ok(element, 'expected the current-input Vault save form');
          element.dispatchEvent(
            new window.Event('submit', { bubbles: true, cancelable: true })
          );
          await new Promise((resolve) => setTimeout(resolve, 10));
          await drainMicrotasks();
        });
      },
      text() {
        return normalizedText(container);
      }
    };

    return await exercise(scope);
  } finally {
    if (root !== undefined) {
      await React.act(async () => {
        root.unmount();
        await drainMicrotasks();
      });
    }

    activeFetchBoundary = undefined;
    container.remove();
    window.close();
    for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
      restoreDescriptor(globalThis, name, descriptor);
    }
  }
}

test('the actual English birth page renders and resolves a Shanghai candidate', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [englishShanghai] }),
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) })
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    assert.ok(scope.form());
    assert.equal(scope.state(), 'EMPTY');

    await scope.change('Shanghai China');
    assert.equal(scope.state(), 'SEARCHING');
    assert.equal(scope.candidateButtons().length, 0);

    await scope.wait();

    assert.equal(scope.searchCalls().length, 1);
    assert.equal(scope.searchCalls()[0].endpoint, '/api/location/search');
    assert.equal(scope.searchCalls()[0].init.method, 'POST');
    assert.equal(scope.searchCalls()[0].init.credentials, 'same-origin');
    assert.equal(scope.searchCalls()[0].init.cache, 'no-store');
    assert.deepEqual(requestBody(scope.searchCalls()[0]), {
      query: 'Shanghai China',
      locale: 'en'
    });
    assert.equal(scope.state(), 'CANDIDATES');
    assert.equal(scope.panel().hidden, false);
    assert.strictEqual(scope.panel().previousElementSibling, scope.input());

    const buttons = scope.candidateButtons();
    assert.equal(buttons.length, 1);
    assert.equal(buttons[0].disabled, false);
    assert.match(normalizedText(buttons[0]), /Shanghai, China/u);
    assert.equal(scope.canonical(), null);

    await scope.click(buttons[0]);

    assert.equal(scope.resolveCalls().length, 1);
    assert.equal(scope.resolveCalls()[0].init.method, 'POST');
    assert.equal(scope.resolveCalls()[0].init.credentials, 'same-origin');
    assert.deepEqual(requestBody(scope.resolveCalls()[0]), {
      candidateId: 'candidate-shanghai',
      locale: 'en'
    });
    assert.equal(scope.state(), 'RESOLVED');
    assert.ok(scope.canonical());
    assert.match(normalizedText(scope.canonical()), /Shanghai, China/u);
    assert.match(normalizedText(scope.canonical()), /31\.22222, 121\.45806/u);
    assert.match(normalizedText(scope.canonical()), /Asia\/Shanghai/u);
    assert.match(normalizedText(scope.panel().querySelector('[data-location-attribution]')), /GeoNames/u);
    assert.match(normalizedText(scope.rawQuery()), /Shanghai China/u);
    assert.notStrictEqual(scope.rawQuery(), scope.canonical());
  });
});

test('the actual zh-Hant birth page keeps location labels localized through resolution', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [traditionalShanghai] }),
    resolve: () => ({
      state: 'RESOLVED',
      location: resolvedLocation(traditionalShanghai)
    })
  });

  await withChartExperience({ boundary, locale: 'zh-Hant' }, async (scope) => {
    assert.equal(scope.input().getAttribute('placeholder'), '城市、地區、國家');
    assert.equal(scope.input().previousElementSibling.textContent, '出生地');

    await scope.change('Shanghai China');
    await scope.wait();

    assert.equal(scope.state(), 'CANDIDATES');
    assert.match(normalizedText(scope.panel()), /地點候選項目/u);
    assert.match(normalizedText(scope.candidateButtons()[0]), /上海，上海市，中國/u);
    assert.doesNotMatch(normalizedText(scope.panel()), /Location candidates/u);

    await scope.click(scope.candidateButtons()[0]);

    assert.equal(scope.state(), 'RESOLVED');
    assert.match(normalizedText(scope.panel()), /已選取的標準地點/u);
    assert.match(normalizedText(scope.canonical()), /標準地點/u);
    assert.match(normalizedText(scope.canonical()), /座標/u);
    assert.match(normalizedText(scope.canonical()), /IANA 時區/u);
    assert.match(normalizedText(scope.panel().querySelector('[data-location-attribution]')), /地點資料：.*GeoNames/u);
    assert.doesNotMatch(normalizedText(scope.panel()), /Canonical location|IANA time zone/u);
  });
});

test('the actual birth page recovers from a location ERROR on a later successful search', async () => {
  const boundary = createFetchBoundary({
    search: ({ index }) => index === 0
      ? jsonResponse({ code: 'LOCATION_RESOLUTION_UNAVAILABLE' }, 503)
      : { state: 'CANDIDATES', candidates: [englishShanghai] },
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) })
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait();
    assert.equal(scope.state(), 'ERROR');
    assert.ok(scope.panel().querySelector('[role="alert"]'));
    assert.match(scope.text(), /Location search is unavailable/u);

    await scope.change('Shanghai China updated');
    await scope.wait();

    assert.equal(scope.searchCalls().length, 2);
    assert.equal(scope.state(), 'CANDIDATES');
    assert.equal(scope.panel().querySelector('[role="alert"]'), null);
    assert.equal(scope.candidateButtons().length, 1);
    assert.match(normalizedText(scope.candidateButtons()[0]), /Shanghai, China/u);
  });
});

test('editing the actual resolved birthplace invalidates its canonical location immediately', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [englishShanghai] }),
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) })
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait();
    await scope.click(scope.candidateButtons()[0]);
    assert.equal(scope.state(), 'RESOLVED');
    assert.match(normalizedText(scope.canonical()), /Asia\/Shanghai/u);

    await scope.change('Beijing China');

    assert.equal(scope.state(), 'SEARCHING');
    assert.equal(scope.canonical(), null);
    assert.doesNotMatch(normalizedText(scope.panel()), /Asia\/Shanghai|31\.22222/u);
    assert.match(normalizedText(scope.rawQuery()), /Beijing China/u);
  });
});

test('the actual calculate form rejects a stale location after the birthplace changes', async () => {
  const boundary = createFetchBoundary({
    search: ({ init }) => requestBody({ init }).query === 'Shanghai China'
      ? { state: 'CANDIDATES', candidates: [englishShanghai] }
      : { state: 'UNRESOLVED', candidates: [] },
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) }),
    chart: () => jsonResponse({ chart: completeChartResult })
  });

  await withChartExperience(
    { boundary, locale: 'en', requireResolvedLocation: true },
    async (scope) => {
      await scope.change('Shanghai China');
      await scope.wait();
      await scope.click(scope.candidateButtons()[0]);
      await scope.setValue('birth-date-day', '15');
      await scope.setValue('birth-date-month', '05');
      await scope.setValue('birth-date-year', '1990');
      await scope.setValue('birth-time', '07:05');

      await scope.change('Beijing China');
      await scope.wait();
      assert.equal(scope.canonical(), null);

      await scope.submit();

      assert.equal(scope.chartCalls().length, 0);
      assert.equal(scope.input().value, 'Beijing China');
      assert.equal(scope.canonical(), null);
      assert.match(scope.text(), /Select a canonical location before calculating a chart/u);
    }
  );
});

test('multiple real candidates remain explicit and selectable in the actual birth form', async () => {
  const secondCandidate = candidate({
    candidateId: 'candidate-shanghai-alt',
    canonicalDisplayName: 'Shanghai, China (alternate)',
    locality: 'Shanghai',
    region: 'Shanghai Municipality',
    country: 'China'
  });
  const boundary = createFetchBoundary({
    search: () => ({
      state: 'CANDIDATES',
      candidates: [englishShanghai, secondCandidate]
    }),
    resolve: ({ init }) => ({
      state: 'RESOLVED',
      location: resolvedLocation(
        JSON.parse(init.body).candidateId === secondCandidate.candidateId
          ? secondCandidate
          : englishShanghai
      )
    })
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait();

    assert.equal(scope.state(), 'AMBIGUOUS');
    assert.equal(scope.candidateButtons().length, 2);
    assert.equal(scope.canonical(), null);
    assert.match(scope.text(), /Shanghai, Shanghai Municipality, China/u);

    await scope.click(scope.candidateButtons()[1]);

    assert.equal(scope.state(), 'RESOLVED');
    assert.deepEqual(requestBody(scope.resolveCalls()[0]), {
      candidateId: 'candidate-shanghai-alt',
      locale: 'en'
    });
    assert.match(normalizedText(scope.canonical()), /Shanghai Municipality/u);
  });
});

test('an UNRESOLVED response renders the actual no-result state without candidate controls', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'UNRESOLVED', candidates: [] })
  });

  await withChartExperience({ boundary, locale: 'zh-Hant' }, async (scope) => {
    await scope.change('Not A Real Place');
    await scope.wait();

    assert.equal(scope.state(), 'UNRESOLVED');
    assert.equal(scope.panel().hidden, false);
    assert.equal(scope.candidateButtons().length, 0);
    assert.match(normalizedText(scope.panel()), /找不到相符的有人居住地。/u);
    assert.match(normalizedText(scope.panel()), /找不到標準地點/u);
  });
});

test('the actual birth page saves current resolved input without calculating a chart', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [englishShanghai] }),
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) }),
    vault: ({ init }) => {
      const body = requestBody({ init });
      return jsonResponse({ chart: savedInputOnlyRecord(body.chart) }, 201);
    }
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait();
    await scope.click(scope.candidateButtons()[0]);
    await scope.setValue('birth-date-day', '15');
    await scope.setValue('birth-date-month', '05');
    await scope.setValue('birth-date-year', '1990');
    await scope.setValue('birth-time', '07:05');

    assert.equal(scope.chartCalls().length, 0);
    assert.equal(scope.container.querySelector('#house-system').value, 'Placidus');
    assert.equal(scope.savePanel().dataset.vaultSaveMode, 'INPUT_ONLY');
    assert.match(normalizedText(scope.savePanel()), /Save birth details/u);

    await scope.setSaveValue('displayName', 'Shanghai input');
    await scope.submitSave();

    assert.equal(scope.chartCalls().length, 0);
    assert.equal(scope.vaultCalls().length, 1);
    const saveBody = requestBody(scope.vaultCalls()[0]);
    assert.equal(saveBody.saveMode, 'INPUT_ONLY');
    assert.equal(Object.hasOwn(saveBody, 'chartResult'), false);
    assert.equal(saveBody.chart.birth.localDate, '1990-05-15');
    assert.equal(saveBody.chart.birth.localTime, '07:05');
    assert.equal(saveBody.chart.birth.locationResolutionId, 'candidate-shanghai');
    assert.equal(saveBody.chart.birth.locationLabel, 'Shanghai, China');
    assert.equal(saveBody.chart.birth.latitude, 31.22222);
    assert.equal(saveBody.chart.birth.longitude, 121.45806);
    assert.equal(saveBody.chart.birth.ianaTimeZone, 'Asia/Shanghai');
    assert.equal(saveBody.chart.houseSystem, 'Placidus');
    assert.match(scope.text(), /Input saved to Vault/u);
  });
});

test('the current input replaces an earlier calculated snapshot before saving', async () => {
  const boundary = createFetchBoundary({
    search: ({ init }) => {
      const query = requestBody({ init }).query;
      return {
        state: 'CANDIDATES',
        candidates: query.includes('Beijing') ? [beijingCandidate] : [englishShanghai]
      };
    },
    resolve: ({ init }) => {
      const candidateId = requestBody({ init }).candidateId;
      const selected = candidateId === 'candidate-beijing'
        ? beijingCandidate
        : englishShanghai;
      return {
        state: 'RESOLVED',
        location: resolvedLocation(selected)
      };
    },
    chart: () => jsonResponse({ chart: completeChartResult }),
    vault: ({ init }) => {
      const body = requestBody({ init });
      return jsonResponse({ chart: savedInputOnlyRecord(body.chart) }, 201);
    }
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait();
    await scope.click(scope.candidateButtons()[0]);
    await scope.setValue('birth-date-day', '15');
    await scope.setValue('birth-date-month', '05');
    await scope.setValue('birth-date-year', '1990');
    await scope.setValue('birth-time', '07:05');
    await scope.setValue('house-system', 'Placidus');
    await scope.submit();

    assert.equal(scope.chartCalls().length, 1);
    assert.ok(scope.container.querySelector('.nn-chart-workspace'));

    await scope.change('Beijing China');
    assert.equal(scope.container.querySelector('.nn-chart-workspace'), null);
    await scope.wait();
    await scope.click(scope.candidateButtons()[0]);
    assert.equal(scope.savePanel().dataset.vaultSaveMode, 'INPUT_ONLY');

    await scope.setSaveValue('displayName', 'Beijing input');
    await scope.submitSave();

    assert.equal(scope.chartCalls().length, 1);
    assert.equal(scope.vaultCalls().length, 1);
    const saveBody = requestBody(scope.vaultCalls()[0]);
    assert.equal(saveBody.saveMode, 'INPUT_ONLY');
    assert.equal(Object.hasOwn(saveBody, 'chartResult'), false);
    assert.equal(saveBody.chart.birth.locationResolutionId, 'candidate-beijing');
    assert.equal(saveBody.chart.birth.locationLabel, 'Beijing, China');
    assert.equal(saveBody.chart.birth.latitude, 39.9042);
    assert.equal(saveBody.chart.birth.longitude, 116.4074);
    assert.equal(saveBody.chart.birth.ianaTimeZone, 'Asia/Shanghai');
  });
});

test('a non-authoritative calculation keeps one current-input save path and persists it', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [seoulCandidate] }),
    resolve: () => ({ state: 'RESOLVED', location: seoulLocation }),
    chart: () => jsonResponse({ chart: WEB_UI_FIXTURE_V1 }),
    vault: ({ init }) => {
      const body = requestBody({ init });
      return jsonResponse({ chart: savedInputOnlyRecord(body.chart) }, 201);
    }
  });

  await withChartExperience({ boundary, locale: 'en' }, async (scope) => {
    await scope.change('Seoul South Korea');
    await scope.wait();
    await scope.click(scope.candidateButtons()[0]);
    await scope.setValue('birth-date-day', '15');
    await scope.setValue('birth-date-month', '05');
    await scope.setValue('birth-date-year', '1990');
    await scope.setValue('birth-time', '07:05');
    await scope.submit();

    assert.equal(scope.chartCalls().length, 1);
    assert.ok(scope.container.querySelector('.nn-chart-workspace'));
    assert.equal(
      scope.container.querySelectorAll('[data-vault-save-mode="INPUT_ONLY"]').length,
      1
    );

    await scope.setSaveValue('displayName', 'R3-CASE-C');
    await scope.submitSave();

    assert.equal(scope.vaultCalls().length, 1);
    const saveBody = requestBody(scope.vaultCalls()[0]);
    assert.equal(saveBody.saveMode, 'INPUT_ONLY');
    assert.equal(Object.hasOwn(saveBody, 'chartResult'), false);
    assert.equal(saveBody.displayName, 'R3-CASE-C');
    assert.equal(saveBody.chart.birth.locationResolutionId, 'candidate-seoul');
    assert.equal(saveBody.chart.birth.locationLabel, 'Seoul, South Korea');
    assert.equal(saveBody.chart.birth.latitude, 37.5665);
    assert.equal(saveBody.chart.birth.longitude, 126.978);
    assert.equal(saveBody.chart.birth.ianaTimeZone, 'Asia/Seoul');
    assert.match(scope.text(), /Input saved to Vault/u);
  });
});

test('the actual calculate boundary carries the selected location authority id', async () => {
  const boundary = createFetchBoundary({
    search: () => ({ state: 'CANDIDATES', candidates: [englishShanghai] }),
    resolve: () => ({ state: 'RESOLVED', location: resolvedLocation(englishShanghai) }),
    chart: () => jsonResponse({ code: 'TEST_CALCULATION_STOPPED' }, 503)
  });

  await withChartExperience(
    { boundary, locale: 'en', requireResolvedLocation: true },
    async (scope) => {
      await scope.change('Shanghai China');
      await scope.wait();
      await scope.click(scope.candidateButtons()[0]);
      await scope.setValue('birth-date-day', '15');
      await scope.setValue('birth-date-month', '05');
      await scope.setValue('birth-date-year', '1990');
      await scope.setValue('birth-time', '07:05');
      await scope.setValue('house-system', 'Placidus');
      await scope.submit();

      assert.equal(scope.chartCalls().length, 1);
      const chartBody = requestBody(scope.chartCalls()[0]);
      assert.equal(chartBody.chart.birth.locationResolutionId, 'candidate-shanghai');
      assert.equal(chartBody.chart.birth.locationLabel, 'Shanghai China');
      assert.equal(chartBody.chart.birth.ianaTimeZone, 'America/New_York');
      assert.ok(scope.container.querySelector('[data-resolution-authority="development-fixture"]'));
    }
  );
});
