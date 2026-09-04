import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

import { Window } from 'happy-dom';
import React from 'react';

const COMPILED_ROOT_URL = new URL(
  '../dist/location-resolution-browser-state-characterization/',
  import.meta.url
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
  'HTMLButtonElement',
  'Event',
  'MouseEvent',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'IS_REACT_ACT_ENVIRONMENT'
];

const ORIGINAL_GLOBAL_DESCRIPTORS = new Map(
  GLOBAL_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
);

let modulesPromise;

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
    HTMLButtonElement: window.HTMLButtonElement,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    IS_REACT_ACT_ENVIRONMENT: true
  };

  for (const name of GLOBAL_NAMES) {
    installGlobal(name, values[name]);
  }
}

async function loadModules() {
  modulesPromise ??= (async () => {
    const hook = registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('@/')) {
          return nextResolve(
            new URL(`${specifier.slice(2)}.js`, COMPILED_ROOT_URL).href,
            context
          );
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
      const [client, hookModule, panel] = await Promise.all([
        import(new URL('features/chart-input/location-resolution-client.js', COMPILED_ROOT_URL).href),
        import(new URL('features/chart-input/useLocationResolution.js', COMPILED_ROOT_URL).href),
        import(new URL('features/chart-input/LocationResolutionPanel.js', COMPILED_ROOT_URL).href)
      ]);

      return {
        FetchLocationResolutionClient: client.FetchLocationResolutionClient,
        LocationResolutionPanel: panel.default,
        useLocationResolution: hookModule.useLocationResolution
      };
    } finally {
      hook.deregister();
    }
  })();

  return modulesPromise;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function normalizedText(element) {
  return element.textContent.replace(/\s+/gu, ' ').trim();
}

const shanghaiCandidate = {
  candidateId: 'candidate-shanghai',
  canonicalDisplayName: '上海, 上海市, 中国',
  locality: '上海',
  region: '上海市',
  country: '中国',
  countryCode: 'CN',
  coordinates: { latitude: 31.22222, longitude: 121.45806 },
  authority: {
    kind: 'GEOCODING',
    sourceId: 'geonames-free-web-services',
    recordId: 'candidate-shanghai'
  },
  source: {
    sourceVersion: 'geonames-free-web-services-v1',
    datasetVersion: null,
    attribution: { label: 'GeoNames', url: 'https://www.geonames.org/' }
  }
};

const shanghaiLocation = {
  resolutionId: 'resolution-shanghai',
  canonicalDisplayName: shanghaiCandidate.canonicalDisplayName,
  locality: shanghaiCandidate.locality,
  region: shanghaiCandidate.region,
  country: shanghaiCandidate.country,
  countryCode: shanghaiCandidate.countryCode,
  coordinates: shanghaiCandidate.coordinates,
  ianaTimeZone: 'Asia/Shanghai',
  status: 'RESOLVED',
  authority: shanghaiCandidate.authority,
  source: shanghaiCandidate.source
};

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

async function withLocationProbe(
  {
    client,
    debounceMs = 15,
    locale = 'zh-Hant',
    showDevelopmentDiagnostics = true
  },
  exercise
) {
  const window = new Window({ url: 'https://example.test/calculate' });
  installWindowGlobals(window);
  const container = window.document.createElement('div');
  window.document.body.append(container);
  let root;

  try {
    const {
      LocationResolutionPanel,
      useLocationResolution
    } = await loadModules();

    function LocationProbe() {
      const controller = useLocationResolution({ client, debounceMs, locale });

      return React.createElement(
        'div',
        null,
        React.createElement('input', {
          'aria-label': 'Birth location',
          'data-testid': 'location-input',
          onChange: (event) => controller.setRawQuery(event.currentTarget.value),
          type: 'text'
        }),
        React.createElement(LocationResolutionPanel, {
          diagnostics: controller.diagnostics,
          locale,
          onPanelMounted: controller.setPanelMounted,
          onSelectCandidate: controller.selectCandidate,
          resolution: controller.resolution,
          showDevelopmentDiagnostics
        })
      );
    }

    const { createRoot } = await import('react-dom/client');
    root = createRoot(container);
    await React.act(async () => {
      root.render(React.createElement(LocationProbe));
      await drainMicrotasks();
    });

    const scope = {
      container,
      input() {
        const input = container.querySelector('[data-testid="location-input"]');
        assert.ok(input, 'expected location input');
        return input;
      },
      state() {
        return container.querySelector('[data-location-resolution-state]')?.dataset
          .locationResolutionState ?? null;
      },
      diagnostics() {
        const diagnostics = container.querySelector('[data-location-diagnostic-state]');
        if (!diagnostics) {
          return null;
        }

        return {
          state: diagnostics.dataset.locationDiagnosticState,
          generation: diagnostics.dataset.locationGeneration,
          httpStatus: diagnostics.dataset.locationHttpStatus,
          stage: diagnostics.dataset.locationClientStage,
          errorKind: diagnostics.dataset.locationErrorKind,
          candidateCount: diagnostics.dataset.locationCandidateCount,
          panelMounted: diagnostics.dataset.locationPanelMounted,
          fetchExceptionName: diagnostics.dataset.locationFetchExceptionName,
          signalStateAtDispatch: diagnostics.dataset.locationSignalStateAtDispatch,
          requestOrigin: diagnostics.dataset.locationRequestOrigin,
          requestTarget: diagnostics.dataset.locationRequestTarget
        };
      },
      candidateButtons() {
        return [...container.querySelectorAll('[data-location-candidate-id]')];
      },
      async change(value) {
        await React.act(async () => {
          const input = scope.input();
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(
            input,
            value
          );
          input.dispatchEvent(new window.Event('input', { bubbles: true }));
          input.dispatchEvent(new window.Event('change', { bubbles: true }));
          await drainMicrotasks();
        });
      },
      async wait(milliseconds) {
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

    container.remove();
    window.close();
    for (const [name, descriptor] of ORIGINAL_GLOBAL_DESCRIPTORS) {
      restoreDescriptor(globalThis, name, descriptor);
    }
  }
}

test('real CANDIDATES response moves Shanghai from SEARCHING to selectable and then RESOLVED', async () => {
  const { FetchLocationResolutionClient } = await loadModules();
  const calls = [];
  const client = new FetchLocationResolutionClient(async (input, init) => {
    const endpoint = String(input);
    calls.push({ endpoint, init });

    if (endpoint === '/api/location/search') {
      return jsonResponse({ state: 'CANDIDATES', candidates: [shanghaiCandidate] });
    }

    assert.equal(endpoint, '/api/location/resolve');
    return jsonResponse({ state: 'RESOLVED', location: shanghaiLocation });
  });

  await withLocationProbe({ client }, async (scope) => {
    await scope.change('Shanghai China');
    assert.equal(scope.state(), 'SEARCHING');
    assert.equal(scope.candidateButtons().length, 0);
    assert.equal(calls.length, 0);

    await scope.wait(35);
    assert.equal(scope.state(), 'CANDIDATES');
    assert.equal(scope.candidateButtons().length, 1);
    assert.deepEqual(scope.diagnostics(), {
      state: 'CANDIDATES',
      generation: '1',
      httpStatus: '200',
      stage: 'CANDIDATES_ACCEPTED',
      errorKind: 'NONE',
      candidateCount: '1',
      panelMounted: 'true',
      fetchExceptionName: '—',
      signalStateAtDispatch: 'ACTIVE',
      requestOrigin: 'SAME_ORIGIN',
      requestTarget: 'SEARCH'
    });
    assert.equal(scope.candidateButtons()[0].dataset.locationCandidateId, 'candidate-shanghai');
    assert.equal(scope.container.querySelector('[data-location-canonical]'), null);
    assert.match(scope.text(), /上海, 上海市, 中国/u);
    assert.deepEqual(JSON.parse(calls[0].init.body), {
      query: 'Shanghai China',
      locale: 'zh-Hant'
    });

    await scope.click(scope.candidateButtons()[0]);
    assert.equal(scope.state(), 'RESOLVED');
    assert.deepEqual(scope.diagnostics(), {
      state: 'RESOLVED',
      generation: '2',
      httpStatus: '200',
      stage: 'RESOLVED_ACCEPTED',
      errorKind: 'NONE',
      candidateCount: '1',
      panelMounted: 'true',
      fetchExceptionName: '—',
      signalStateAtDispatch: 'ACTIVE',
      requestOrigin: 'SAME_ORIGIN',
      requestTarget: 'RESOLVE'
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(JSON.parse(calls[1].init.body), {
      candidateId: 'candidate-shanghai',
      locale: 'zh-Hant'
    });
    assert.match(scope.text(), /31\.22222, 121\.45806/u);
    assert.match(scope.text(), /Asia\/Shanghai/u);
  });
});

test('a queued stale debounce callback cannot start a superseded search', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const scheduled = [];
  const searches = [];
  const client = {
    search(input) {
      searches.push(input);
      return Promise.resolve({ state: 'CANDIDATES', candidates: [shanghaiCandidate] });
    },
    resolve() {
      return Promise.resolve(null);
    }
  };

  globalThis.setTimeout = (callback, delay) => {
    const job = { callback, delay, cleared: false };
    scheduled.push(job);
    return job;
  };
  globalThis.clearTimeout = (job) => {
    job.cleared = true;
  };

  try {
    await withLocationProbe({ client, debounceMs: 15 }, async (scope) => {
      await scope.change('Sha');
      await scope.change('Shang');

      assert.equal(scheduled.length, 2);
      assert.equal(scheduled[0].cleared, true);
      assert.equal(scheduled[1].cleared, false);

      await React.act(async () => {
        await scheduled[0].callback();
        await drainMicrotasks();
      });
      assert.equal(searches.length, 0);

      await React.act(async () => {
        await scheduled[1].callback();
        await drainMicrotasks();
      });
      assert.equal(searches.length, 1);
      assert.equal(searches[0].query, 'Shang');
      assert.equal(scope.state(), 'CANDIDATES');
    });
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test('stale and aborted rapid-typing requests cannot overwrite the active CANDIDATES state', async () => {
  const requests = [];
  const client = {
    search(input, signal) {
      const operation = deferred();
      requests.push({ ...operation, input, signal });
      return operation.promise;
    },
    resolve() {
      return Promise.resolve(null);
    }
  };

  await withLocationProbe({ client, debounceMs: 15 }, async (scope) => {
    await scope.change('Sha');
    await scope.wait(35);
    await scope.change('Shang');
    await scope.wait(35);
    await scope.change('Shanghai China');
    await scope.wait(35);

    assert.equal(requests.length, 3);
    assert.equal(requests[0].signal.aborted, true);
    assert.equal(requests[1].signal.aborted, true);
    assert.equal(requests[2].signal.aborted, false);

    requests[2].resolve({ state: 'CANDIDATES', candidates: [shanghaiCandidate] });
    await scope.flush();
    assert.equal(scope.state(), 'CANDIDATES');

    requests[0].resolve({
      state: 'CANDIDATES',
      candidates: [{ ...shanghaiCandidate, candidateId: 'stale-candidate' }]
    });
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    requests[1].reject(abortError);
    await scope.flush();

    assert.equal(scope.state(), 'CANDIDATES');
    assert.equal(scope.candidateButtons().length, 1);
    assert.equal(scope.candidateButtons()[0].dataset.locationCandidateId, 'candidate-shanghai');
    assert.equal(scope.diagnostics().generation, '3');
    assert.equal(scope.diagnostics().candidateCount, '1');
    assert.equal(scope.diagnostics().stage, 'CANDIDATES_ACCEPTED');
  });
});

test('a successful search after ERROR clears the error and renders candidates', async () => {
  let attempts = 0;
  const client = {
    search() {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error('transient request failure'))
        : Promise.resolve({ state: 'CANDIDATES', candidates: [shanghaiCandidate] });
    },
    resolve() {
      return Promise.resolve(null);
    }
  };

  await withLocationProbe({ client }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait(35);
    assert.equal(scope.state(), 'ERROR');
    assert.ok(scope.container.querySelector('[role="alert"]'));

    await scope.change('Shanghai China updated');
    await scope.wait(35);
    assert.equal(scope.state(), 'CANDIDATES');
    assert.equal(scope.candidateButtons().length, 1);
    assert.equal(scope.container.querySelector('[role="alert"]'), null);
    assert.equal(scope.diagnostics().state, 'CANDIDATES');
    assert.equal(scope.diagnostics().stage, 'CANDIDATES_ACCEPTED');
    assert.equal(scope.diagnostics().errorKind, 'NONE');
  });
});

test('development diagnostics expose safe failure and candidate fields only', async () => {
  const client = new (await loadModules()).FetchLocationResolutionClient(
    async () =>
      new Response(
        JSON.stringify({ state: 'CANDIDATES', candidates: [{ candidateId: 'invalid' }] }),
        { status: 200 }
      )
  );

  await withLocationProbe({ client }, async (scope) => {
    await scope.change('Shanghai China');
    await scope.wait(35);

    assert.equal(scope.state(), 'ERROR');
    assert.deepEqual(scope.diagnostics(), {
      state: 'ERROR',
      generation: '1',
      httpStatus: '200',
      stage: 'CONTRACT_PARSE_FAILED',
      errorKind: 'CLIENT_CONTRACT_ERROR',
      candidateCount: '0',
      panelMounted: 'true',
      fetchExceptionName: '—',
      signalStateAtDispatch: 'ACTIVE',
      requestOrigin: 'SAME_ORIGIN',
      requestTarget: 'SEARCH'
    });

    const diagnostics = scope.container.querySelector('[data-location-diagnostic-state]');
    assert.ok(diagnostics);
    assert.doesNotMatch(
      diagnostics.outerHTML,
      /Shanghai China|31\.22222|121\.45806|candidate-shanghai|Asia\/Shanghai/iu
    );
  });
});

test('development diagnostics panel is excluded when the runtime flag is disabled', async () => {
  const client = {
    search() {
      return Promise.resolve({ state: 'CANDIDATES', candidates: [shanghaiCandidate] });
    },
    resolve() {
      return Promise.resolve(null);
    }
  };

  await withLocationProbe(
    { client, showDevelopmentDiagnostics: false },
    async (scope) => {
      await scope.change('Shanghai China');
      await scope.wait(35);
      assert.equal(scope.diagnostics(), null);
    }
  );
});
