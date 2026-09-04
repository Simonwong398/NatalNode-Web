import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { Window } from 'happy-dom';
import React from 'react';

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

function createFetchBoundary({ search, resolve, chart } = {}) {
  const calls = [];
  let searchIndex = 0;
  let resolveIndex = 0;
  let chartIndex = 0;

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
