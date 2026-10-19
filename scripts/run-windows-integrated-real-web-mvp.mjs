import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createBirthTimeResolutionService } from '../server/dist/time-resolution/index.js';
import { RealEnginePrivateServiceClient } from '../server/dist/development/real-engine-private-service-client.js';
import {
  createArchivedR5FixtureLocationResolutionService,
  createLocalBrowserChartBffApp
} from '../server/test/support/local-browser-chart-bff.mjs';
import { startLoopbackHonoServer } from '../server/test/support/private-engine-http-adapter.mjs';
import { createSingleUseJ2000Evidence } from './single-use-j2000-evidence.mjs';

const WEB_ROOT = fileURLToPath(new URL('../', import.meta.url));
const WEB_APP_ROOT = join(WEB_ROOT, 'apps/web');
const ENGINE_HEAD = '9cde9285d5ed74a1837d8be0dd5c807ca0134bc3';
const ENGINE_CHECKOUT = process.env.NATALNODE_ENGINE_CHECKOUT?.trim()
  ? resolve(process.env.NATALNODE_ENGINE_CHECKOUT)
  : null;
const RUNTIME_SERVICE_RELATIVE = 'packages/engine/research/nn-engine-private-service-runtime-unblock-001';
const CORRECTED_RUNTIME_BUILD_HEAD = '43a3f6a965b202cb24c6d0b48e0be8f56a501789';
const CORRECTED_RUNTIME_IDENTITY = 'a72e614ce632a5f94bb9864e45446781212fff740cd4a4d3f79987944535cfa4';
const CORRECTED_MANIFEST_RELATIVE = 'spike/dist/nn-engine-private-service-runtime-unblock-001/corrected-sidereal-43a3f6a/runtime-manifest.local.json';
const CORRECTED_MANIFEST_SHA256 = 'b5efee74acc01a702d429298afa8d6d3dd839de8b930328f21589f768e663d50';
const HISTORICAL_VALIDATED_002_RUNTIME_IDENTITY = '3a7e863f7174e5f421cfc8ea1830cce3f428921fde820bc23ddfa849d05c0dfc';
const ASTRO_CLI = join(WEB_ROOT, 'node_modules/astro/bin/astro.mjs');
const FIXTURE_ONLY = process.argv.includes('--fixture-only');
const REAL_RESEARCH = process.argv.includes('--real-research');
const CAPTURE_SINGLE_USE = process.argv.includes('--capture-single-use-j2000');
let singleUseEvidence;

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function requireEngineCheckout() {
  if (ENGINE_CHECKOUT === null) {
    throw new Error('ENGINE_CHECKOUT_REQUIRED: set NATALNODE_ENGINE_CHECKOUT to the verified Engine checkout.');
  }
  if (resolve(git(ENGINE_CHECKOUT, ['rev-parse', '--show-toplevel'])).toLowerCase() !== ENGINE_CHECKOUT.toLowerCase()) {
    throw new Error('ENGINE_CHECKOUT_INVALID: the configured path is not the Engine repository root.');
  }
  const head = git(ENGINE_CHECKOUT, ['rev-parse', 'HEAD']);
  if (head !== ENGINE_HEAD) throw new Error(`ENGINE_HEAD_MISMATCH: expected ${ENGINE_HEAD}.`);
  if (git(ENGINE_CHECKOUT, ['status', '--porcelain', '--untracked-files=no']) !== '') {
    throw new Error('ENGINE_TRACKED_WORKTREE_DIRTY: tracked and staged Engine files must be unchanged.');
  }
}

function runtimeConfiguration(engineCheckout) {
  const manifestPath = resolve(engineCheckout, CORRECTED_MANIFEST_RELATIVE);
  if (!existsSync(manifestPath)) throw new Error('CORRECTED_PRIVATE_ENGINE_MANIFEST_MISSING');

  return Object.freeze({
    manifestPath,
    manifestSha256: CORRECTED_MANIFEST_SHA256,
    runtimeIdentity: CORRECTED_RUNTIME_IDENTITY,
    bearerToken: randomBytes(32).toString('base64url')
  });
}

function minimalEnvironment(extra = {}) {
  const allowed = ['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'PATHEXT', 'ComSpec'];
  const environment = Object.fromEntries(allowed
    .filter((key) => typeof process.env[key] === 'string')
    .map((key) => [key, process.env[key]]));
  return { ...environment, ...extra };
}

async function loadEngineAuthority({ serviceRoot, configuration }) {
  const identityModule = await import(pathToFileURL(join(serviceRoot, 'src/runtime-identity.mjs')).href);
  const manifest = await identityModule.loadVerifiedRuntimeManifest(
    configuration.manifestPath,
    configuration.manifestSha256
  );
  const engineApi = await import(pathToFileURL(manifest.executionRuntime.compiledEngineEntryPath).href);
  if (typeof engineApi.signForLongitude !== 'function' || !engineApi.NATALNODE_POLICY) {
    throw new Error('ENGINE_SIGN_POLICY_UNAVAILABLE: the bound Engine package does not expose its required presentation policy.');
  }
  return { manifest, engineApi };
}

function childOutputCode(output, fallback) {
  const match = output.match(/(?:Error: )([A-Z][A-Z0-9_]{5,})/u);
  return match?.[1] ?? fallback;
}

function startEngineService(serviceRoot, configuration) {
  const child = spawn(process.execPath, [join(serviceRoot, 'src/production-entry.mjs')], {
    cwd: serviceRoot,
    env: minimalEnvironment({
      NODE_ENV: 'development',
      NATALNODE_PRIVATE_SERVICE_MODE: 'research',
      NATALNODE_PRIVATE_SERVICE_BEARER_TOKEN: configuration.bearerToken,
      NATALNODE_PRIVATE_RUNTIME_MANIFEST_PATH: configuration.manifestPath,
      NATALNODE_PRIVATE_RUNTIME_MANIFEST_SHA256: configuration.manifestSha256,
      NATALNODE_PRIVATE_SERVICE_PORT: '0'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  let buffered = '';
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolveReady, rejectReady) => {
    readyResolve = resolveReady;
    readyReject = rejectReady;
  });
  const consume = (chunk) => {
    output = `${output}${chunk}`.slice(-4_000);
    buffered += chunk;
    const lines = buffered.split(/\r?\n/u);
    buffered = lines.pop() ?? '';
    for (const line of lines) {
      try {
        const message = JSON.parse(line);
        if (message.event === 'private-research-service-listening') readyResolve(message);
      } catch {
        // Non-JSON startup output is retained only for a sanitized failure code.
      }
    }
  };
  child.stdout.setEncoding('utf8').on('data', consume);
  child.stderr.setEncoding('utf8').on('data', consume);
  child.once('error', () => readyReject(new Error('ENGINE_SERVICE_SPAWN_FAILED')));
  child.once('exit', (code) => readyReject(new Error(`${childOutputCode(output, 'ENGINE_SERVICE_EXITED')} (exit ${code}).`)));
  return { child, ready, getOutput: () => output };
}

async function waitForPage(child, url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`ASTRO_EXITED_BEFORE_READY: ${child.exitCode ?? child.signalCode}.`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok && (await response.text()).includes('data-local-engine-chart-workflow="enabled"')) return;
    } catch {
      // The loopback dev server has not completed startup yet.
    }
    await delay(250);
  }
  throw new Error('ASTRO_READINESS_TIMEOUT: the local chart page did not become ready.');
}

async function availablePort() {
  const { createServer } = await import('node:net');
  for (let port = 4_321; port < 4_351; port += 1) {
    const server = createServer();
    const free = await new Promise((resolveFree) => {
      server.once('error', () => resolveFree(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolveFree(true)));
    });
    if (free) return port;
  }
  throw new Error('ASTRO_PORTS_BUSY: no loopback preview port is available in the configured range.');
}

async function stopOwnedChild(child, label) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return `${label}: already exited`;
  const exited = new Promise((resolveExit) => child.once('exit', resolveExit));
  child.kill('SIGINT');
  const graceful = await Promise.race([exited.then(() => true), delay(4_000).then(() => false)]);
  if (graceful) return `${label}: graceful shutdown`;
  child.kill('SIGTERM');
  const terminated = await Promise.race([exited.then(() => true), delay(2_000).then(() => false)]);
  return terminated ? `${label}: terminated after graceful timeout` : `${label}: shutdown unconfirmed`;
}

const owned = { engine: null, bff: null, astro: null };
let cleanupPromise;
async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    const results = [];
    results.push(await stopOwnedChild(owned.astro, 'Astro'));
    if (owned.bff) {
      await owned.bff.close();
      results.push('Website BFF: closed');
    }
    if (owned.engine) results.push(await stopOwnedChild(owned.engine.child, 'Private Engine'));
    return results;
  })();
  return cleanupPromise;
}

async function main() {
  if (process.platform !== 'win32') throw new Error('WINDOWS_REQUIRED: this runtime path is Windows-specific.');
  if (FIXTURE_ONLY && REAL_RESEARCH) throw new Error('MODE_CONFLICT: fixture-only and real-research modes cannot be combined.');
  if (REAL_RESEARCH && process.env.NATALNODE_LOCAL_CHART_REAL_CALL_ENABLED !== 'true') {
    throw new Error('REAL_CALL_GATE_CLOSED: real calculation requires a separate explicit owner authorization and NATALNODE_LOCAL_CHART_REAL_CALL_ENABLED=true.');
  }
  if (CAPTURE_SINGLE_USE && !REAL_RESEARCH) throw new Error('SINGLE_USE_CAPTURE_REQUIRES_REAL_MODE');
  // The opt-in is process-scoped, never inherited by the browser or persisted.
  delete process.env.NATALNODE_LOCAL_CHART_REAL_CALL_ENABLED;
  if (!existsSync(ASTRO_CLI)) throw new Error('ASTRO_DEPENDENCY_MISSING: run npm ci from the Web repository first.');
  requireEngineCheckout();
  if (CAPTURE_SINGLE_USE) {
    singleUseEvidence = createSingleUseJ2000Evidence(
      join(WEB_ROOT, 'dist/nn-windows-single-real-browser-j2000-e2e-001-resume'),
      { engineHead: ENGINE_HEAD, webHead: git(WEB_ROOT, ['rev-parse', 'HEAD']), taskId: 'NN-WINDOWS-SINGLE-REAL-BROWSER-J2000-E2E-001-RESUME' }
    );
  }

  let configuration = null;
  let engineAuthority;
  let engineOrigin = null;
  let privateServiceClient;
  if (!FIXTURE_ONLY) {
    configuration = runtimeConfiguration(ENGINE_CHECKOUT);
    const serviceRoot = join(ENGINE_CHECKOUT, RUNTIME_SERVICE_RELATIVE);
    engineAuthority = await loadEngineAuthority({ serviceRoot, configuration });
    if (engineAuthority.manifest.runtimeIdentity === HISTORICAL_VALIDATED_002_RUNTIME_IDENTITY) {
      throw new Error('STALE_VALIDATED_002_ENGINE_RUNTIME_REJECTED');
    }
    if (engineAuthority.manifest.observedGitHead !== CORRECTED_RUNTIME_BUILD_HEAD) {
      throw new Error('CORRECTED_ENGINE_RUNTIME_SOURCE_HEAD_MISMATCH');
    }
    if (engineAuthority.manifest.runtimeIdentity !== configuration.runtimeIdentity) {
      throw new Error('ENGINE_RUNTIME_IDENTITY_BINDING_MISMATCH');
    }
    owned.engine = startEngineService(serviceRoot, configuration);
    const startup = await Promise.race([
      owned.engine.ready,
      delay(45_000).then(() => { throw new Error('ENGINE_SERVICE_STARTUP_TIMEOUT'); })
    ]);
    const parsedOrigin = new URL(startup.url);
    if (parsedOrigin.protocol !== 'http:' || parsedOrigin.hostname !== '127.0.0.1' ||
        startup.runtimeIdentity !== engineAuthority.manifest.runtimeIdentity) {
      throw new Error('ENGINE_SERVICE_IDENTITY_OR_BINDING_MISMATCH');
    }
    engineOrigin = parsedOrigin.origin;
    privateServiceClient = new RealEnginePrivateServiceClient({
      baseUrl: engineOrigin,
      bearerToken: configuration.bearerToken,
      expectedRuntimeIdentity: engineAuthority.manifest.runtimeIdentity,
      ...(singleUseEvidence ? { fetchImplementation: singleUseEvidence.fetchOperation } : {})
    });
    const boundary = await privateServiceClient.verifyNonCalculatingBoundary();
    singleUseEvidence?.record('runtime-admission', {
      runtimeIdentity: engineAuthority.manifest.runtimeIdentity,
      manifestSha256: configuration.manifestSha256,
      sources: engineAuthority.manifest.sources.map(({ filename, sha256, byteLength }) => ({ filename, sha256, byteLength })),
      boundFiles: engineAuthority.manifest.files.length,
      boundary
    });
    process.stdout.write(`Verified accepted runtime identity ${engineAuthority.manifest.runtimeIdentity} (${engineAuthority.manifest.sources.length} sources, ${engineAuthority.manifest.files.length} bound files).\n`);
    process.stdout.write('Generated a fresh ephemeral Engine bearer in memory; it is not passed to the browser or logged.\n');
    process.stdout.write(`Private Engine ready on IPv4 loopback; runtime ${startup.runtimeIdentity}.\n`);
    process.stdout.write(`BFF client boundary: unauthenticated POST returned ${boundary.unauthenticated.status} ${boundary.unauthenticated.error}; authenticated malformed-only POST returned ${boundary.malformedAuthenticated.status} ${boundary.malformedAuthenticated.error}.\n`);
    process.stdout.write('The authenticated request failed schema validation before the calculation runner; no calculation was admitted.\n');
  } else {
    const packageRoot = join(ENGINE_CHECKOUT, 'packages/engine/dist/src/index.js');
    if (!existsSync(packageRoot)) throw new Error('ENGINE_PACKAGE_BUILD_MISSING: the bound Engine package output is unavailable.');
    const engineApi = await import(pathToFileURL(packageRoot).href);
    if (typeof engineApi.signForLongitude !== 'function' || !engineApi.NATALNODE_POLICY) {
      throw new Error('ENGINE_SIGN_POLICY_UNAVAILABLE');
    }
    engineAuthority = { engineApi };
    process.stdout.write('Fixture-only mode: the private Engine HTTP service was not started; no provider calls are possible.\n');
  }

  const locationResolutionService = createArchivedR5FixtureLocationResolutionService();
  const timeAuthority = createBirthTimeResolutionService({ locationResolutionService });
  const webPort = await availablePort();
  const webOrigin = `http://127.0.0.1:${webPort}`;
  const fixtureMode = !REAL_RESEARCH;
  const realResearchClient = REAL_RESEARCH
    ? (singleUseEvidence ? singleUseEvidence.wrapClient(privateServiceClient) : privateServiceClient)
    : undefined;
  const bffApp = createLocalBrowserChartBffApp({
    allowedOrigin: webOrigin,
    workflowMode: fixtureMode ? 'archived-r5-fixture' : 'real-research',
    fixtureEngineApi: engineAuthority.engineApi,
    realResearchClient,
    ...(REAL_RESEARCH ? {
      requiredChartContext: {
        instant: '2000-01-01T12:00:00.000Z',
        latitude: 51.4779,
        longitude: -0.0015,
        houseSystem: 'placidus'
      }
    } : {}),
    locationResolutionService,
    timeAuthority,
    ...(singleUseEvidence ? { observeRequest: singleUseEvidence.observeBff } : {})
  });
  owned.bff = await startLoopbackHonoServer(bffApp);

  owned.astro = spawn(process.execPath, [
    ASTRO_CLI, 'dev', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'
  ], {
    cwd: WEB_APP_ROOT,
    env: minimalEnvironment({
      NODE_ENV: 'development',
      NATALNODE_LOCAL_CHART_BFF_URL: owned.bff.origin,
      NATALNODE_LOCAL_CHART_WORKFLOW: 'true',
      NATALNODE_LOCAL_CHART_WORKFLOW_MODE: fixtureMode ? 'ARCHIVED_R5_FIXTURE' : 'REAL_RESEARCH'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let astroOutput = '';
  for (const stream of [owned.astro.stdout, owned.astro.stderr]) {
    stream.setEncoding('utf8').on('data', (chunk) => { astroOutput = `${astroOutput}${chunk}`.slice(-4_000); });
  }
  const browserUrl = `${webOrigin}/dev/chart`;
  await waitForPage(owned.astro, browserUrl);
  singleUseEvidence?.record('services-ready', {
    browserUrl, engineOrigin, bffOrigin: owned.bff.origin,
    launcherPid: process.pid, enginePid: owned.engine?.child.pid, astroPid: owned.astro.pid,
    realRequestsAtStartup: 0
  });
  process.stdout.write('\nNatalNode Windows integrated fixture workflow is ready.\n');
  process.stdout.write(`Browser URL: ${browserUrl}\n`);
  process.stdout.write('Location resolution: fixed Greenwich fixture; no GeoNames request.\n');
  process.stdout.write(fixtureMode
    ? 'Chart result: archived R5 fixture only; no Engine calculation or real JPL call.\n'
    : 'Real-call mode: explicitly enabled, J2000-only, single valid request; no request is sent automatically.\n');
  process.stdout.write(`REAL_CALL_GATE=${REAL_RESEARCH ? 'OPEN_BY_EXPLICIT_MODE' : 'CLOSED'}; no valid chart request was sent by startup.\n`);
  process.stdout.write(`Private Engine boundary: ${engineOrigin ? 'started; negative authentication check passed' : 'not started (fixture-only mode)'}.\n`);
  process.stdout.write('Press Ctrl-C to stop only the Astro and Engine child processes started by this command.\n\n');

  await new Promise((resolveExit) => {
    process.once('SIGINT', resolveExit);
    process.once('SIGTERM', resolveExit);
    process.stdin.on('data', (input) => { if (input.toString().trim() === 'STOP') resolveExit(); });
    process.stdin.resume();
    owned.astro.once('exit', resolveExit);
  });
  process.stdout.write('Stopping owned local processes…\n');
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'INTEGRATED_STARTUP_FAILED';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
} finally {
  const results = await cleanup();
  singleUseEvidence?.close(results);
  process.stdin.pause();
  if (results.length > 0) process.stdout.write(`Shutdown: ${results.join('; ')}.\n`);
}
