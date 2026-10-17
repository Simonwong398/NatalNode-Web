import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  createPrivateEngineBffHarness,
  PrivateEngineHttpClient,
  startLoopbackHonoServer,
  startPrivateEngineHttpService
} from './support/private-engine-http-adapter.mjs';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ENGINE_HEAD = 'a6125470edda64fb297c0e848f212fe215137bb2';
const ENGINE_REQUEST = Object.freeze({
  input: Object.freeze({
    instant: '2000-01-01T00:00:00Z',
    latitude: 27.95,
    longitude: -82.46
  }),
  options: Object.freeze({ houseSystem: 'placidus' })
});

function readEngineCheckout() {
  const configuredRoot = process.env.NATALNODE_ENGINE_CHECKOUT;
  assert.ok(
    typeof configuredRoot === 'string' && configuredRoot.length > 0,
    'Set NATALNODE_ENGINE_CHECKOUT to the verified Engine checkout for this development-only test.'
  );
  const checkoutRoot = resolve(configuredRoot);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: checkoutRoot,
    encoding: 'utf8'
  }).trim();
  assert.equal(head, ENGINE_HEAD, 'The Engine checkout must match the reviewed commit.');
  assert.equal(
    execFileSync('git', ['diff', '--name-only', 'HEAD', '--'], {
      cwd: checkoutRoot,
      encoding: 'utf8'
    }).trim(),
    '',
    'Tracked Engine files must remain unchanged.'
  );

  const enginePackageRoot = join(checkoutRoot, 'packages', 'engine');
  const packageJson = JSON.parse(readFileSync(join(enginePackageRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.name, '@natalnode/engine-foundation');
  assert.equal(packageJson.exports['.'].import, './dist/src/index.js');
  assert.ok(existsSync(join(enginePackageRoot, 'dist', 'src', 'index.js')),
    'Build the delivered Engine package before running this test.');
  assert.ok(existsSync(join(enginePackageRoot, 'dist', 'tests', 'fixtures', 'fake-astronomy-provider.js')),
    'The Engine synthetic test fixture is unavailable.');
  return { checkoutRoot, enginePackageRoot };
}

function waitForChildMessage(child, messageType, timeoutMs = 5_000) {
  return new Promise((resolveMessage, rejectMessage) => {
    const timeout = setTimeout(() => {
      cleanup();
      rejectMessage(new Error(`Engine child did not send ${messageType}.`));
    }, timeoutMs);
    const onMessage = (message) => {
      if (message?.type !== messageType) return;
      cleanup();
      resolveMessage(message);
    };
    const onExit = (code) => {
      cleanup();
      rejectMessage(new Error(`Engine child exited before ${messageType} (code ${code}).`));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.off('message', onMessage);
      child.off('exit', onExit);
    };
    child.on('message', onMessage);
    child.once('exit', onExit);
  });
}

async function stopEngineChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return child.exitCode;
  const closed = waitForChildMessage(child, 'closed');
  const exited = new Promise((resolveExit, rejectExit) => {
    child.once('exit', (code) => code === 0
      ? resolveExit(code)
      : rejectExit(new Error(`Engine child exited with code ${code}.`)));
  });
  child.send({ type: 'shutdown' });
  await closed;
  return exited;
}

async function startEngineChild(enginePackageRoot, testRoot) {
  const packageLinkDirectory = join(testRoot, 'node_modules', '@natalnode');
  mkdirSync(packageLinkDirectory, { recursive: true });
  symlinkSync(enginePackageRoot, join(packageLinkDirectory, 'engine-foundation'), 'dir');

  const childScript = join(testRoot, 'private-engine-child.mjs');
  copyFileSync(new URL('./support/private-engine-http-engine-child.mjs', import.meta.url), childScript);

  let stdout = '';
  let stderr = '';
  const child = spawn(process.execPath, [
    childScript,
    enginePackageRoot,
    pathToFileURL(join(WEB_ROOT, 'server/test/support/private-engine-http-adapter.mjs')).href
  ], {
    cwd: testRoot,
    env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout = `${stdout}${chunk}`.slice(-8_192); });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-8_192); });
  child.__capturedOutput = () => `${stdout}${stderr}`;

  try {
    const ready = await waitForChildMessage(child, 'ready');
    return { child, ready };
  } catch (error) {
    throw new Error(`${error.message}\n${child.__capturedOutput()}`, { cause: error });
  }
}

async function postJson(url, body, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body
  });
}

test('Web BFF harness completes a loopback HTTP round trip through the Engine package root', async (context) => {
  const { enginePackageRoot } = readEngineCheckout();
  const testRoot = mkdtempSync(join(tmpdir(), 'natalnode-engine-http-'));
  let child;
  let bffServer;
  try {
    const childRuntime = await startEngineChild(enginePackageRoot, testRoot);
    child = childRuntime.child;
    assert.equal(childRuntime.ready.host, '127.0.0.1');
    assert.ok(childRuntime.ready.port > 0 && childRuntime.ready.port <= 65_535);

    const engineClient = new PrivateEngineHttpClient({
      baseUrl: `http://${childRuntime.ready.host}:${childRuntime.ready.port}`
    });
    bffServer = await startLoopbackHonoServer(createPrivateEngineBffHarness(engineClient));
    assert.equal(bffServer.host, '127.0.0.1');

    const expectedChartPromise = waitForChildMessage(child, 'expected-chart');
    child.send({ type: 'expected-chart' });
    const expectedChart = await expectedChartPromise;

    const endpoint = `${bffServer.origin}/_test/private-engine/chart`;
    const firstResponse = await postJson(endpoint, JSON.stringify(ENGINE_REQUEST));
    const secondResponse = await postJson(endpoint, JSON.stringify(ENGINE_REQUEST));
    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    const first = await firstResponse.json();
    const second = await secondResponse.json();

    assert.deepEqual(first.chart, expectedChart.chart, 'BFF returns the Engine result without scientific projection.');
    assert.deepEqual(second, first, 'Repeated synthetic calculations remain deterministic over HTTP.');
    assert.deepEqual(first.transport, {
      dataClassification: 'ENGINEERING TEST DATA',
      astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT',
      scientificValidation: 'NOT_PERFORMED'
    });
    assert.equal(first.chart.provider.id, 'fake-astronomy-provider');
    assert.equal(first.chart.metadata.provenance[0].redistributionStatus, 'reference-only');
    assert.equal(first.chart.metadata.astronomyConfigurationStatus, 'COMPLETE');
    assert.equal(first.chart.metadata.provenanceEnvelopeStatus, 'COMPLETE');

    const statsPromise = waitForChildMessage(child, 'stats');
    child.send({ type: 'stats' });
    const stats = await statsPromise;
    assert.equal(stats.bodyStates, 30, 'The actual Engine API reached all ten provider bodies for three calls.');
    assert.equal(stats.fundamentalStates, 3);

    await context.test('both listeners bind only to IPv4 loopback', async () => {
      assert.equal(childRuntime.ready.host, '127.0.0.1');
      assert.equal(bffServer.host, '127.0.0.1');
      assert.equal(child.__capturedOutput(), '', 'The Engine service emits no request or birth-data logs.');
    });

    const bffOrigin = bffServer.origin;
    const engineOrigin = `http://${childRuntime.ready.host}:${childRuntime.ready.port}`;
    await bffServer.close();
    bffServer = undefined;
    await assert.rejects(fetch(`${bffOrigin}/_test/private-engine/chart`, {
      signal: AbortSignal.timeout(1_000)
    }));

    await stopEngineChild(child);
    child = undefined;
    await assert.rejects(fetch(`${engineOrigin}/v1/chart/calculate`, {
      signal: AbortSignal.timeout(1_000)
    }));
  } finally {
    if (bffServer !== undefined) await bffServer.close();
    if (child !== undefined) await stopEngineChild(child);
    const output = child?.__capturedOutput?.() ?? '';
    assert.equal(output.includes('locationLabel'), false);
    assert.equal(output.includes('DATABASE_URL'), false);
    const { rmSync } = await import('node:fs');
    rmSync(testRoot, { recursive: true, force: true });
  }
});

test('private HTTP schema rejects unknown time, invalid DTOs, oversized payloads, and unsupported methods', async () => {
  let engineCalls = 0;
  const service = await startPrivateEngineHttpService({
    calculateChart() {
      engineCalls += 1;
      throw new Error('This invalid-request fixture must not execute.');
    }
  });
  try {
    const endpoint = `${service.origin}/v1/chart/calculate`;
    const get = await fetch(endpoint);
    assert.equal(get.status, 405);
    assert.equal(get.headers.get('allow'), 'POST');
    assert.deepEqual(await get.json(), {
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' }
    });

    const invalid = await postJson(endpoint, JSON.stringify({
      ...ENGINE_REQUEST,
      birth: { locationLabel: 'PII_SENTINEL' }
    }));
    assert.equal(invalid.status, 400);
    const invalidText = await invalid.text();
    assert.match(invalidText, /INVALID_REQUEST/u);
    assert.equal(invalidText.includes('PII_SENTINEL'), false);

    const webChartRequest = await postJson(endpoint, JSON.stringify({
      birth: {
        localDate: '2000-01-01',
        localTime: '00:00',
        locationLabel: 'Synthetic fixture',
        latitude: 27.95,
        longitude: -82.46,
        ianaTimeZone: 'Etc/UTC',
        resolvedUtcInstant: '2000-01-01T00:00:00Z',
        utcOffsetSeconds: 0,
        timezoneDatabaseVersion: 'test',
        timezoneResolutionMethod: 'test',
        ambiguityStatus: 'EXACT'
      },
      houseSystem: 'placidus'
    }));
    assert.equal(webChartRequest.status, 400, 'The incompatible Web DTO is not silently translated.');
    assert.match(await webChartRequest.text(), /INVALID_REQUEST/u);

    const malformed = await postJson(endpoint, '{"input":');
    assert.equal(malformed.status, 400);
    assert.match(await malformed.text(), /INVALID_REQUEST/u);

    const unknownTime = await postJson(endpoint, JSON.stringify({
      input: { ...ENGINE_REQUEST.input, instant: null },
      options: ENGINE_REQUEST.options
    }));
    assert.equal(unknownTime.status, 400);
    assert.match(await unknownTime.text(), /INVALID_REQUEST/u);

    const oversized = await postJson(endpoint, ' '.repeat(16 * 1024 + 1));
    assert.equal(oversized.status, 413);
    assert.match(await oversized.text(), /PAYLOAD_TOO_LARGE/u);

    const wrongMediaType = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(ENGINE_REQUEST)
    });
    assert.equal(wrongMediaType.status, 415);
    assert.equal(engineCalls, 0, 'Rejected input never reaches the Engine seam.');
  } finally {
    await service.close();
  }
});

test('Engine failures and deadline expiry map to safe structured HTTP errors', async () => {
  let behavior = 'failure';
  const service = await startPrivateEngineHttpService({
    calculateChart() {
      if (behavior === 'timeout') return new Promise(() => {});
      const error = new Error('SYNTHETIC_PROVIDER_SECRET_SENTINEL birth-data stack sentinel');
      error.code = 'PROVIDER_FAILURE';
      error.stack = 'Error: SYNTHETIC_PROVIDER_SECRET_SENTINEL\n at /private/path/with/birth-data';
      throw error;
    }
  }, { calculationTimeoutMs: 20 });
  const bff = await startLoopbackHonoServer(createPrivateEngineBffHarness(
    new PrivateEngineHttpClient({ baseUrl: service.origin })
  ));
  try {
    const endpoint = `${bff.origin}/_test/private-engine/chart`;
    const failed = await postJson(endpoint, JSON.stringify(ENGINE_REQUEST));
    assert.equal(failed.status, 502);
    const failedText = await failed.text();
    assert.deepEqual(JSON.parse(failedText), {
      error: { code: 'ENGINE_CALCULATION_FAILED', message: 'Engine calculation is unavailable.' }
    });
    assert.doesNotMatch(failedText, /SYNTHETIC_PROVIDER_SECRET_SENTINEL|birth-data|private\/path|stack/u);

    behavior = 'timeout';
    const timedOut = await postJson(endpoint, JSON.stringify(ENGINE_REQUEST));
    assert.equal(timedOut.status, 504);
    assert.deepEqual(await timedOut.json(), {
      error: { code: 'ENGINE_TIMEOUT', message: 'Engine calculation timed out.' }
    });
  } finally {
    await bff.close();
    await service.close();
  }
});

test('private Engine client enforces loopback and converts an expired deadline safely', async () => {
  assert.throws(
    () => new PrivateEngineHttpClient({ baseUrl: 'http://0.0.0.0:4321' }),
    /127\.0\.0\.1/u
  );
  assert.throws(
    () => new PrivateEngineHttpClient({ baseUrl: 'https://127.0.0.1:4321' }),
    /127\.0\.0\.1/u
  );

  const client = new PrivateEngineHttpClient({
    baseUrl: 'http://127.0.0.1:4321',
    timeoutMs: 10,
    fetchImplementation: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })
  });
  await assert.rejects(
    client.calculateChart(ENGINE_REQUEST),
    (error) => error.code === 'ENGINE_TIMEOUT' && !/aborted/u.test(error.message)
  );
});

test('development adapter remains test-only and production admission stays closed', () => {
  const adapterSource = readFileSync(
    new URL('./support/private-engine-http-adapter.mjs', import.meta.url),
    'utf8'
  );
  const engineChildSource = readFileSync(
    new URL('./support/private-engine-http-engine-child.mjs', import.meta.url),
    'utf8'
  );
  const productionBindings = readFileSync(join(WEB_ROOT, 'server/src/executable/create-executable-server-bindings.ts'), 'utf8');
  const productionAdmission = readFileSync(join(WEB_ROOT, 'server/src/runtime/production-runtime-config.ts'), 'utf8');

  assert.match(engineChildSource, /@natalnode\/engine-foundation/u);
  assert.match(engineChildSource, /FakeAstronomyProvider/u);
  assert.doesNotMatch(productionBindings, /PrivateEngineHttp|FakeAstronomyProvider|@natalnode\/engine-foundation/u);
  assert.match(productionAdmission, /PRODUCTION_ENGINE_CLIENT_ADMISSION = 'NOT_ADMITTED'/u);
  assert.doesNotMatch(adapterSource, /console\.(?:log|warn|error)/u);
  assert.doesNotMatch(adapterSource, /FakeAstronomyProvider|@natalnode\/engine-foundation/u);
});
