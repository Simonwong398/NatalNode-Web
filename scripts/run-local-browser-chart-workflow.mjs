import { spawn, execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGeoNamesLocationResolutionService } from '../server/dist/location-resolution/geonames-web-provider.js';
import { createBirthTimeResolutionService } from '../server/dist/time-resolution/index.js';
import {
  createRealEnginePrivateServiceClientFromEnvironment
} from '../server/dist/development/real-engine-private-service-client.js';
import {
  PrivateEngineHttpClient,
  startLoopbackHonoServer
} from '../server/test/support/private-engine-http-adapter.mjs';
import { createLocalBrowserChartBffApp } from '../server/test/support/local-browser-chart-bff.mjs';

const WEB_ROOT = fileURLToPath(new URL('../', import.meta.url));
const WEB_APP_ROOT = join(WEB_ROOT, 'apps/web');
const EXPECTED_ENGINE_HEAD = 'a6125470edda64fb297c0e848f212fe215137bb2';
const ENGINE_CHECKOUT = resolve(
  process.env.NATALNODE_ENGINE_CHECKOUT ??
  join(homedir(), 'Downloads/natalnode-engine-handoff')
);
const ENGINE_PACKAGE_ROOT = join(ENGINE_CHECKOUT, 'packages/engine');
const ENGINE_CHILD_SOURCE = join(
  WEB_ROOT,
  'server/test/support/private-engine-http-engine-child.mjs'
);
const PRIVATE_HTTP_ADAPTER_URL = pathToFileURL(join(
  WEB_ROOT,
  'server/test/support/private-engine-http-adapter.mjs'
)).href;
const ASTRO_CLI = join(WEB_ROOT, 'node_modules/astro/bin/astro.mjs');
const REAL_RESEARCH_MODE = process.argv.includes('--real-research');

function runGit(checkout, args) {
  return execFileSync('git', args, {
    cwd: checkout,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function verifyEngineCheckout() {
  const head = runGit(ENGINE_CHECKOUT, ['rev-parse', 'HEAD']);
  if (head !== EXPECTED_ENGINE_HEAD) {
    throw new Error(`The local chart workflow requires Engine ${EXPECTED_ENGINE_HEAD}; found a different HEAD.`);
  }
  if (runGit(ENGINE_CHECKOUT, ['status', '--porcelain']).length > 0) {
    throw new Error('The Engine checkout must be clean before starting the local chart workflow.');
  }
  for (const path of [
    join(ENGINE_PACKAGE_ROOT, 'dist/src/index.js'),
    join(ENGINE_PACKAGE_ROOT, 'dist/tests/fixtures/fake-astronomy-provider.js')
  ]) {
    if (!existsSync(path)) {
      throw new Error('The pinned Engine build and its FakeAstronomyProvider fixture must be available.');
    }
  }
}

function waitForChildMessage(child, type, timeoutMs = 10_000) {
  return new Promise((resolveMessage, rejectMessage) => {
    const timer = setTimeout(() => finish(new Error(`The private Engine did not send ${type}.`)), timeoutMs);
    const onMessage = (message) => {
      if (message?.type === type) finish(null, message);
    };
    const onExit = (code) => finish(new Error(`The private Engine exited before ${type} (code ${code}).`));
    const finish = (error, message) => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
      if (error) rejectMessage(error);
      else resolveMessage(message);
    };
    child.on('message', onMessage);
    child.once('exit', onExit);
  });
}

async function startEngineChild() {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'natalnode-browser-chart-'));
  const packageLinkDirectory = join(temporaryRoot, 'node_modules/@natalnode');
  mkdirSync(packageLinkDirectory, { recursive: true });
  symlinkSync(ENGINE_PACKAGE_ROOT, join(packageLinkDirectory, 'engine-foundation'), 'dir');
  const childScript = join(temporaryRoot, 'private-engine-http-engine-child.mjs');
  copyFileSync(ENGINE_CHILD_SOURCE, childScript);

  const child = spawn(process.execPath, [
    childScript,
    ENGINE_PACKAGE_ROOT,
    PRIVATE_HTTP_ADAPTER_URL
  ], {
    cwd: temporaryRoot,
    env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => { output = `${output}${chunk}`.slice(-6_000); });
  }

  try {
    const ready = await waitForChildMessage(child, 'ready');
    if (ready.host !== '127.0.0.1' || !Number.isSafeInteger(ready.port)) {
      throw new Error('The private Engine did not bind to IPv4 loopback.');
    }
    return { child, temporaryRoot, ready };
  } catch (error) {
    child.kill('SIGTERM');
    rmSync(temporaryRoot, { recursive: true, force: true });
    throw new Error(`${error.message}${output ? `\n${output}` : ''}`, { cause: error });
  }
}

async function stopEngineChild(child, temporaryRoot) {
  if (child.exitCode === null && child.signalCode === null) {
    try {
      const closed = waitForChildMessage(child, 'closed', 3_000);
      child.send({ type: 'shutdown' });
      await closed;
      await new Promise((resolveExit) => child.once('exit', resolveExit));
    } catch {
      child.kill('SIGTERM');
      await Promise.race([
        new Promise((resolveExit) => child.once('exit', resolveExit)),
        delay(2_000)
      ]);
    }
  }
  rmSync(temporaryRoot, { recursive: true, force: true });
}

async function findWebPort() {
  const { createServer } = await import('node:net');
  for (let port = 4_321; port < 4_351; port += 1) {
    const server = createServer();
    const available = await new Promise((resolveAvailable) => {
      server.once('error', () => resolveAvailable(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolveAvailable(true)));
    });
    if (available) return port;
  }
  throw new Error('No available local chart preview port was found.');
}

async function waitForWebPage(child, url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Astro exited before the local chart page was ready (code ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        const html = await response.text();
        if (html.includes('data-local-engine-chart-workflow="enabled"')) return;
      }
    } catch {
      // Astro has not opened its loopback listener yet.
    }
    await delay(250);
  }
  throw new Error('Astro did not serve the development chart workflow within 60 seconds.');
}

async function stopWebChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolveExit) => child.once('exit', resolveExit));
  child.kill('SIGINT');
  await Promise.race([exited, delay(4_000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await Promise.race([exited, delay(2_000)]);
  }
}

if (!existsSync(ASTRO_CLI)) throw new Error('The Web workspace Astro CLI is unavailable.');
if (!REAL_RESEARCH_MODE) verifyEngineCheckout();

let engineRuntime;
let engineClient;
let realResearchClient;
let bffServer;
let astroServer;
let cleanupPromise;

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    if (astroServer) await stopWebChild(astroServer);
    if (bffServer) await bffServer.close();
    if (engineRuntime) await stopEngineChild(engineRuntime.child, engineRuntime.temporaryRoot);
  })();
  return cleanupPromise;
}

try {
  if (REAL_RESEARCH_MODE) {
    realResearchClient = createRealEnginePrivateServiceClientFromEnvironment();
  } else {
    engineRuntime = await startEngineChild();
    engineClient = new PrivateEngineHttpClient({
      baseUrl: `http://${engineRuntime.ready.host}:${engineRuntime.ready.port}`
    });
  }
  const webPort = await findWebPort();
  const webOrigin = `http://127.0.0.1:${webPort}`;
  const geonamesUsername = process.env.GEONAMES_USERNAME;
  let locationResolutionService;
  if (typeof geonamesUsername === 'string' && geonamesUsername.trim() !== '') {
    locationResolutionService = createGeoNamesLocationResolutionService(geonamesUsername);
  }
  const canonicalLocationOwner = locationResolutionService ?? {
    getResolvedLocation() { return null; }
  };
  const timeAuthority = createBirthTimeResolutionService({
    locationResolutionService: canonicalLocationOwner
  });
  const app = createLocalBrowserChartBffApp({
    allowedOrigin: webOrigin,
    engineClient,
    realResearchClient,
    workflowMode: REAL_RESEARCH_MODE ? 'real-research' : 'synthetic',
    locationResolutionService,
    timeAuthority
  });
  bffServer = await startLoopbackHonoServer(app);

  const webEnvironment = {
    PATH: process.env.PATH ?? '',
    NODE_ENV: 'development',
    NATALNODE_LOCAL_CHART_BFF_URL: bffServer.origin,
    NATALNODE_LOCAL_CHART_WORKFLOW: 'true',
    NATALNODE_LOCAL_CHART_WORKFLOW_MODE: REAL_RESEARCH_MODE ? 'REAL_RESEARCH' : 'SYNTHETIC',
    ...(process.env.TMPDIR ? { TMPDIR: process.env.TMPDIR } : {}),
    ...(process.env.TERM ? { TERM: process.env.TERM } : {})
  };
  astroServer = spawn(process.execPath, [
    ASTRO_CLI,
    'dev',
    '--host',
    '127.0.0.1',
    '--port',
    String(webPort),
    '--strictPort'
  ], {
    cwd: WEB_APP_ROOT,
    env: webEnvironment,
    stdio: 'inherit'
  });

  const browserRoute = `${webOrigin}/dev/chart`;
  await waitForWebPage(astroServer, browserRoute);
  process.stdout.write(`\nNatalNode local browser chart workflow is ready.\n`);
  process.stdout.write(`Browser route: ${browserRoute}\n`);
  process.stdout.write(REAL_RESEARCH_MODE
    ? 'Engine: configured private research service, loopback only.\n'
    : `Engine: pinned ${EXPECTED_ENGINE_HEAD}, FakeAstronomyProvider, loopback only.\n`);
  process.stdout.write(`Canonical location lookup: ${locationResolutionService ? 'configured; uses GeoNames' : 'unavailable; GEONAMES_USERNAME is not configured'}\n`);
  process.stdout.write(REAL_RESEARCH_MODE
    ? 'Disclosure is shown in the page: REAL ASTRONOMICAL RESEARCH OUTPUT · NOT SCIENTIFICALLY OR PRODUCTION APPROVED.\n'
    : 'Disclosure is shown in the page: ENGINEERING TEST DATA · NOT REAL ASTRONOMICAL OUTPUT.\n');
  process.stdout.write('Press Ctrl-C to stop; this command will close only the processes it started.\n\n');

  await new Promise((resolveExit) => {
    const onSignal = () => resolveExit('signal');
    const onChildExit = (code, signal) => resolveExit({ code, signal });
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
    astroServer.once('exit', onChildExit);
  });
} finally {
  await cleanup();
}
