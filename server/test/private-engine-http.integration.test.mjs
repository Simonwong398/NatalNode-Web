import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  createPrivateEngineBffHarness,
  createVerifiedPrivateEngineBffHarness,
  PrivateEngineHttpClient,
  startLoopbackHonoServer,
  startPrivateEngineHttpService
} from './support/private-engine-http-adapter.mjs';
import {
  renderAstrologicalNotationWithDisclosure,
  renderChartInstrumentWithDisclosure
} from '../../apps/web/test/support/render-chart-result-v2.mjs';
import { WEB_UI_FIXTURE_V1, SKY_SNAPSHOT_FIXTURE_V1 } from '@natalnode/test-fixtures';
import { createBirthTimeResolutionService, CIVIL_TIME_AUTHORITY_PROFILE } from '../dist/time-resolution/index.js';
import { ProviderLocationResolutionService } from '../dist/location-resolution/location-resolution-service.js';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ENGINE_HEAD = 'a6125470edda64fb297c0e848f212fe215137bb2';
const ENGINE_BODY_ID_TO_WEB = Object.freeze({
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
});
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
  assert.ok(existsSync(join(checkoutRoot, 'packages', 'engine', 'src', 'domain', 'chart.ts')),
    'The Engine public ChartInput and ChartOptions types are unavailable.');
  return { checkoutRoot, enginePackageRoot };
}

function assertAdapterTypesMatchEngine(checkoutRoot, testRoot) {
  const sourcePath = join(testRoot, 'engine-request-adapter.typecheck.mts');
  const adapterTypePath = join(WEB_ROOT, 'server', 'src', 'engine-request-adapter', 'index.js');
  const engineChartTypePath = join(checkoutRoot, 'packages', 'engine', 'src', 'domain', 'chart.js');
  const source = [
    `import type { EngineCalculationRequest } from ${JSON.stringify(adapterTypePath)};`,
    `import type { ChartInput, ChartOptions } from ${JSON.stringify(engineChartTypePath)};`,
    'declare const request: EngineCalculationRequest;',
    'const engineInput: ChartInput = request.input;',
    'const engineOptions: ChartOptions = request.options;',
    'void [engineInput, engineOptions];'
  ].join('\n');
  writeFileSync(sourcePath, source, 'utf8');

  execFileSync(process.execPath, [
    join(WEB_ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022',
    '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    '--typeRoots', join(WEB_ROOT, 'node_modules', '@types'), '--types', 'node', sourcePath
  ], { cwd: testRoot, encoding: 'utf8', stdio: 'pipe' });
}

const LONDON_GREENWICH = Object.freeze({
  resolutionId: 'london-greenwich',
  canonicalDisplayName: 'London, United Kingdom',
  locality: 'London',
  region: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  coordinates: Object.freeze({ latitude: 51.4779, longitude: -0.0015 }),
  ianaTimeZone: 'Europe/London',
  status: 'RESOLVED',
  authority: Object.freeze({ kind: 'GEOCODING', sourceId: 'isolated-test-location', recordId: 'london-greenwich' }),
  source: Object.freeze({ sourceVersion: 'isolated-fixture-v1', datasetVersion: null,
    attribution: Object.freeze({ label: 'Isolated engineering fixture', url: 'https://natalnode.test/location' }) })
});

async function createIsolatedLocationOwner(locations) {
  const provider = {
    async search(query) {
      return locations.filter((location) => location.resolutionId === query).map((location) => ({
        candidateId: location.resolutionId,
        canonicalDisplayName: location.canonicalDisplayName,
        locality: location.locality,
        region: location.region,
        country: location.country,
        countryCode: location.countryCode,
        coordinates: location.coordinates,
        authority: location.authority,
        source: location.source
      }));
    },
    async resolve(candidateId) {
      return locations.find((location) => location.resolutionId === candidateId) ?? null;
    }
  };
  const owner = new ProviderLocationResolutionService(provider);
  for (const location of locations) {
    const candidates = await owner.search({ query: location.resolutionId, locale: 'en' });
    assert.equal(candidates.state, 'CANDIDATES');
    const selected = await owner.resolve({ candidateId: candidates.candidates[0].candidateId, locale: 'en' });
    assert.equal(selected.state, 'RESOLVED');
  }
  return owner;
}

function londonWebChartRequest(location = LONDON_GREENWICH, overrides = {}) {
  return {
    birth: {
      localDate: '2025-10-22',
      localTime: '10:52',
      locationLabel: location.canonicalDisplayName,
      locationResolutionId: location.resolutionId,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      ianaTimeZone: location.ianaTimeZone,
      resolvedUtcInstant: '2025-10-22T09:52:00.000Z',
      utcOffsetSeconds: 3_600,
      timezoneDatabaseVersion: CIVIL_TIME_AUTHORITY_PROFILE.timezoneDatabaseVersion,
      timezoneResolutionMethod: CIVIL_TIME_AUTHORITY_PROFILE.profileId,
      ambiguityStatus: 'EXACT',
      ...overrides.birth
    },
    houseSystem: overrides.houseSystem ?? 'Placidus'
  };
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
  const { checkoutRoot, enginePackageRoot } = readEngineCheckout();
  const testRoot = mkdtempSync(join(tmpdir(), 'natalnode-engine-http-'));
  let child;
  let bffServer;
  try {
    assertAdapterTypesMatchEngine(checkoutRoot, testRoot);
    const childRuntime = await startEngineChild(enginePackageRoot, testRoot);
    child = childRuntime.child;
    assert.equal(childRuntime.ready.host, '127.0.0.1');
    assert.ok(childRuntime.ready.port > 0 && childRuntime.ready.port <= 65_535);

    const privateEngineClient = new PrivateEngineHttpClient({
      baseUrl: `http://${childRuntime.ready.host}:${childRuntime.ready.port}`
    });
    const adaptedRequests = [];
    const engineClient = {
      async calculateChart(request) {
        adaptedRequests.push(request);
        return privateEngineClient.calculateChart(request);
      },
      async calculateChartWithPresentation(request) {
        adaptedRequests.push(request);
        return privateEngineClient.calculateChartWithPresentation(request);
      }
    };
    const locationOwner = await createIsolatedLocationOwner([LONDON_GREENWICH]);
    const timeAuthority = createBirthTimeResolutionService({ locationResolutionService: locationOwner });
    bffServer = await startLoopbackHonoServer(createVerifiedPrivateEngineBffHarness({
      engineClient,
      timeAuthority
    }));
    assert.equal(bffServer.host, '127.0.0.1');

    const endpoint = `${bffServer.origin}/_test/private-engine/chart`;
    const webRequest = { chart: londonWebChartRequest() };
    const firstResponse = await postJson(endpoint, JSON.stringify(webRequest));
    const secondResponse = await postJson(endpoint, JSON.stringify(webRequest));
    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    const first = await firstResponse.json();
    const second = await secondResponse.json();

    assert.equal(adaptedRequests.length, 2);
    assert.deepEqual(adaptedRequests[0], {
      input: {
        instant: '2025-10-22T09:52:00.000Z',
        latitude: 51.4779,
        longitude: -0.0015
      },
      options: { houseSystem: 'placidus' }
    });
    const expectedChartPromise = waitForChildMessage(child, 'expected-chart');
    child.send({ type: 'expected-chart', request: adaptedRequests[0] });
    const expectedChart = await expectedChartPromise;

    assert.deepEqual(first.receipt.source.engineResult, expectedChart.chart,
      'Receipt preserves the actual Engine HTTP result without changing its fields or arrays.');
    assert.deepEqual(second, first, 'Repeated synthetic calculations remain deterministic over HTTP.');
    const receipt = first.receipt;
    assert.equal(receipt.mappingPolicyId, 'ENGINE_WEB_RESULT_MAPPING_V2');
    assert.equal(receipt.chart.schemaVersion, '2.0.0');
    assert.equal(receipt.chart.engineVersion, expectedChart.chart.engineVersion);
    assert.equal(receipt.chart.bodies.length, 10);
    assert.deepEqual(receipt.chart.bodies[0], {
      bodyId: 'Sun',
      longitude: expectedChart.chart.bodies[0].longitude,
      sign: expectedChart.chart.bodies[0].sign,
      house: expectedChart.chart.bodies[0].house,
      motionState: ({ direct: 'DIRECT', station: 'STATIONARY', retrograde: 'RETROGRADE' })[
        expectedChart.chart.bodies[0].motion
      ]
    });
    assert.deepEqual(receipt.chart.angles.map(({ angleId, longitude }) => ({ angleId, longitude })), [
      { angleId: 'ASC', longitude: expectedChart.chart.angles.ascendant },
      { angleId: 'MC', longitude: expectedChart.chart.angles.midheaven }
    ]);
    const engineApi = await import(pathToFileURL(join(enginePackageRoot, 'dist/src/index.js')).href);
    assert.deepEqual(receipt.presentation.angles.map(({ angleId, longitude, sign }) => ({ angleId, longitude, sign })), [
      {
        angleId: 'ASC', longitude: expectedChart.chart.angles.ascendant,
        sign: engineApi.signForLongitude(expectedChart.chart.angles.ascendant)
      },
      {
        angleId: 'MC', longitude: expectedChart.chart.angles.midheaven,
        sign: engineApi.signForLongitude(expectedChart.chart.angles.midheaven)
      }
    ]);
    assert.deepEqual(receipt.chart.angles.map(({ sign }) => sign),
      receipt.presentation.angles.map(({ sign }) => sign));
    assert.equal(receipt.chart.houses.cusps.length, 12);
    assert.equal(receipt.chart.houses.system, 'Placidus');
    assert.equal(receipt.chart.aspects.length, expectedChart.chart.aspects.length);
    assert.deepEqual(receipt.chart.aspects[0], {
      firstBodyId: ENGINE_BODY_ID_TO_WEB[expectedChart.chart.aspects[0].bodyA],
      secondBodyId: ENGINE_BODY_ID_TO_WEB[expectedChart.chart.aspects[0].bodyB],
      type: expectedChart.chart.aspects[0].type,
      orb: expectedChart.chart.aspects[0].orb,
      phaseState: ({ applying: 'APPLYING', exact: 'EXACT', separating: 'SEPARATING' })[
        expectedChart.chart.aspects[0].phase
      ],
      exactAngle: expectedChart.chart.aspects[0].exactAngle,
      separation: expectedChart.chart.aspects[0].separation,
      orbLimit: expectedChart.chart.aspects[0].orbLimit
    });
    assert.deepEqual(receipt.chart.warnings, expectedChart.chart.warnings.map((warning) => ({
      owner: 'ENGINE', ...warning, severity: null
    })));
    assert.deepEqual(receipt.source.webCivilTime, {
      owner: 'NATALNODE_WEB_BFF',
      evidence: receipt.source.webCivilTime.evidence
    });
    assert.equal(receipt.source.webCivilTime.evidence.resolvedUtcInstant,
      '2025-10-22T09:52:00.000Z');
    assert.equal(receipt.source.webCivilTime.evidence.location.resolutionId, 'london-greenwich');
    assert.deepEqual(receipt.source.webCivilTime.evidence.location.coordinates, {
      latitude: 51.4779, longitude: -0.0015
    });
    assert.equal(receipt.assessment.engineResult, 'ENGINE_RESULT_VALID');
    assert.equal(receipt.assessment.webMapping, 'WEB_RESULT_SEMANTICALLY_MAPPABLE');
    assert.equal(receipt.assessment.providerScientificAdmission, 'NOT_ADMITTED');
    assert.equal(receipt.assessment.productionResultCertification, 'NOT_CERTIFIED');
    assert.equal('calculationStatus' in receipt.chart, false);
    assert.equal('metadata' in receipt.chart, false);
    assert.equal('verifiedTime' in receipt.source.webCivilTime, false);
    assert.deepEqual(first.transport, {
      dataClassification: 'ENGINEERING TEST DATA',
      astronomicalStatus: 'NOT REAL ASTRONOMICAL OUTPUT',
      scientificValidation: 'NOT_PERFORMED'
    });
    assert.equal(receipt.source.engineResult.provider.id, 'fake-astronomy-provider');
    assert.equal(receipt.source.engineResult.metadata.provenance[0].redistributionStatus, 'reference-only');
    assert.equal(receipt.source.engineResult.metadata.astronomyConfigurationStatus, 'COMPLETE');
    assert.equal(receipt.source.engineResult.metadata.provenanceEnvelopeStatus, 'COMPLETE');

    const renderedActualResult = await renderChartInstrumentWithDisclosure(receipt.chart);
    assert.match(renderedActualResult, /ENGINEERING TEST DATA · NOT REAL ASTRONOMICAL OUTPUT · NOT PRODUCTION ADMITTED/u);
    assert.match(renderedActualResult, /data-chart-layer="houses"/u);
    assert.match(renderedActualResult, /data-chart-layer="planets"/u);
    const firstMappedBody = receipt.chart.bodies[0];
    const houseOrdinals = [
      '1st House', '2nd House', '3rd House', '4th House', '5th House', '6th House',
      '7th House', '8th House', '9th House', '10th House', '11th House', '12th House'
    ];
    assert.match(renderedActualResult, new RegExp(
      `aria-label="${firstMappedBody.bodyId} at [^"]*${houseOrdinals[firstMappedBody.house - 1]}`
    ), 'V2 natal motionState does not hide the same body fact’s house.');
    const renderedActualNotation = await renderAstrologicalNotationWithDisclosure(receipt.chart);
    assert.match(renderedActualNotation, /ENGINEERING TEST DATA · NOT REAL ASTRONOMICAL OUTPUT · NOT PRODUCTION ADMITTED/u);
    const stationaryView = structuredClone(receipt.chart);
    stationaryView.bodies[0].motionState = 'STATIONARY';
    const renderedStationary = await renderChartInstrumentWithDisclosure(stationaryView);
    assert.match(renderedStationary, /stationary/iu,
      'V2 preserves a stationary state in the renderer rather than treating it as direct.');
    const renderedStationaryNotation = await renderAstrologicalNotationWithDisclosure(stationaryView);
    assert.match(renderedStationaryNotation, /stationary/iu,
      'The chart notation preserves the V2 stationary state.');
    const renderedV1 = await renderChartInstrumentWithDisclosure(WEB_UI_FIXTURE_V1);
    assert.match(renderedV1, /retrograde/iu, 'V1 retrograde notation remains intact.');
    const renderedV1Notation = await renderAstrologicalNotationWithDisclosure(WEB_UI_FIXTURE_V1);
    assert.match(renderedV1Notation, /retrograde/iu, 'V1 body notation remains intact.');
    const renderedSky = await renderChartInstrumentWithDisclosure(SKY_SNAPSHOT_FIXTURE_V1, { chartKind: 'sky' });
    assert.match(renderedSky, /data-chart-kind="sky"/u);
    assert.doesNotMatch(renderedSky, /House 1 cusp/u, 'Sky bodies remain house-free.');

    for (const [webHouseSystem, engineHouseSystem] of [
      ['Whole Sign', 'whole-sign'],
      ['Equal', 'equal']
    ]) {
      const response = await postJson(endpoint, JSON.stringify({
        chart: londonWebChartRequest(LONDON_GREENWICH, { houseSystem: webHouseSystem })
      }));
      assert.equal(response.status, 200);
      const payload = await response.json();
      const adapted = adaptedRequests.at(-1);
      assert.equal(adapted.options.houseSystem, engineHouseSystem);

      const expectedPromise = waitForChildMessage(child, 'expected-chart');
      child.send({ type: 'expected-chart', request: adapted });
      const expected = await expectedPromise;
      assert.deepEqual(payload.receipt.source.engineResult, expected.chart,
        `${webHouseSystem} preserves the raw Engine result over HTTP.`);
      assert.equal(payload.receipt.chart.houses.system,
        ({ placidus: 'Placidus', 'whole-sign': 'Whole Sign', equal: 'Equal' })[engineHouseSystem]);
      assert.equal(payload.receipt.assessment.providerScientificAdmission, 'NOT_ADMITTED');
    }
    assert.equal(adaptedRequests.length, 4);

    const statsPromise = waitForChildMessage(child, 'stats');
    child.send({ type: 'stats' });
    const stats = await statsPromise;
    assert.equal(stats.bodyStates, 70, 'The actual Engine API reached all ten provider bodies for seven calculations.');
    assert.equal(stats.fundamentalStates, 7);

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

test('verified BFF rejects forged time evidence and mismatched canonical claims before the Engine client', async () => {
  const locationOwner = await createIsolatedLocationOwner([LONDON_GREENWICH]);
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService: locationOwner });
  let engineCalls = 0;
  const bff = await startLoopbackHonoServer(createVerifiedPrivateEngineBffHarness({
    timeAuthority,
    engineClient: {
      async calculateChart() {
        engineCalls += 1;
        throw new Error('A rejected request must not reach the Engine client.');
      }
    }
  }));
  try {
    const forged = londonWebChartRequest(LONDON_GREENWICH, {
      birth: { resolvedUtcInstant: '2000-01-01T00:00:00.000Z' }
    });
    const response = await postJson(`${bff.origin}/_test/private-engine/chart`, JSON.stringify({ chart: forged }));
    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
      error: { code: 'CLIENT_TIME_CLAIM_MISMATCH', message: 'Birth input could not be verified.' }
    });

    const forgedEvidence = await postJson(`${bff.origin}/_test/private-engine/chart`, JSON.stringify({
      chart: { ...londonWebChartRequest(), webCivilTime: { owner: 'NATALNODE_WEB_BFF' } }
    }));
    assert.equal(forgedEvidence.status, 422);
    assert.deepEqual(await forgedEvidence.json(), {
      error: { code: 'INVALID_REQUEST', message: 'Birth input could not be verified.' }
    });

    const changedCoordinates = londonWebChartRequest(LONDON_GREENWICH, {
      birth: { latitude: 51.478 }
    });
    const mismatched = await postJson(`${bff.origin}/_test/private-engine/chart`, JSON.stringify({
      chart: changedCoordinates
    }));
    assert.equal(mismatched.status, 422);
    assert.deepEqual(await mismatched.json(), {
      error: { code: 'LOCATION_BINDING_MISMATCH', message: 'Birth input could not be verified.' }
    });
    assert.equal(engineCalls, 0);
  } finally {
    await bff.close();
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
  const requestAdapterSource = readFileSync(
    new URL('../src/engine-request-adapter/engine-request-adapter.ts', import.meta.url),
    'utf8'
  );
  const engineChildSource = readFileSync(
    new URL('./support/private-engine-http-engine-child.mjs', import.meta.url),
    'utf8'
  );
  const productionBindings = readFileSync(join(WEB_ROOT, 'server/src/executable/create-executable-server-bindings.ts'), 'utf8');
  const productionAdmission = readFileSync(join(WEB_ROOT, 'server/src/runtime/production-runtime-config.ts'), 'utf8');
  const productionChartRoute = readFileSync(join(WEB_ROOT, 'server/src/app/routes/chart.ts'), 'utf8');
  const resultAdapterSource = readFileSync(
    join(WEB_ROOT, 'server/src/development/engine-result-adapter/engine-result-adapter.ts'),
    'utf8'
  );

  assert.match(engineChildSource, /@natalnode\/engine-foundation/u);
  assert.match(engineChildSource, /FakeAstronomyProvider/u);
  assert.match(engineChildSource, /signForLongitude/u);
  assert.match(engineChildSource, /NATALNODE_POLICY/u);
  assert.match(adapterSource, /prepareEngineCalculationRequest/u);
  assert.match(requestAdapterSource, /assertVerifiedUtcInstant/u);
  assert.match(requestAdapterSource, /timeAuthority\.resolve/u);
  assert.doesNotMatch(productionBindings, /PrivateEngineHttp|FakeAstronomyProvider|@natalnode\/engine-foundation/u);
  assert.doesNotMatch(productionBindings, /engine-request-adapter|prepareEngineCalculationRequest/u);
  assert.doesNotMatch(productionChartRoute, /engine-request-adapter|prepareEngineCalculationRequest|birthTimeResolutionService/u);
  assert.doesNotMatch(productionBindings, /engine-result-adapter|createWebEngineResultReceiptV2|projectEngineResultToWebV2/u);
  assert.doesNotMatch(productionChartRoute, /engine-result-adapter|createWebEngineResultReceiptV2|projectEngineResultToWebV2/u);
  assert.doesNotMatch(resultAdapterSource, /FakeAstronomyProvider|@natalnode\/engine-foundation/u);
  assert.match(productionAdmission, /PRODUCTION_ENGINE_CLIENT_ADMISSION = 'NOT_ADMITTED'/u);
  assert.doesNotMatch(adapterSource, /console\.(?:log|warn|error)/u);
  assert.doesNotMatch(adapterSource, /FakeAstronomyProvider|@natalnode\/engine-foundation/u);
});
