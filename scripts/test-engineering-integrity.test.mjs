import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const WEB_SOURCE_ROOT = join(REPOSITORY_ROOT, 'apps', 'web', 'src');
const SERVER_SOURCE_ROOT = join(REPOSITORY_ROOT, 'server', 'src');
const DIST_ROOT = join(REPOSITORY_ROOT, 'apps', 'web', 'dist');

function readText(relativePath) {
  return readFileSync(join(REPOSITORY_ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function collectSourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (/\.(?:astro|ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function assertNoTestSemanticBranch(source, label) {
  const testBranchPatterns = [
    /\bVITEST\b/u,
    /\bJEST\b/u,
    /\bNODE_ENV\s*!==?\s*['"]test['"]/u,
    /\bNODE_ENV\s*===?\s*['"]test['"]/u,
    /\bMODE\s*!==?\s*['"]test['"]/u,
    /\bMODE\s*===?\s*['"]test['"]/u,
    /\b(?:isTest|testMode)\b/u
  ];

  for (const pattern of testBranchPatterns) {
    assert.doesNotMatch(source, pattern, `${label} contains ${pattern}`);
  }
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x26;', '&')
    .replaceAll('&amp;', '&');
}

function findChartExperienceBundle(indexHtml) {
  const islandMatch = indexHtml.match(
    /<astro-island\b[^>]*component-url="([^"]+)"[^>]*component-export="ChartExperience"/su
  );

  if (islandMatch?.[1] !== undefined) {
    const relativeAssetPath = decodeURIComponent(
      decodeHtmlAttribute(islandMatch[1]).split('?')[0]
    ).replace(/^\/+/, '').replaceAll('/', sep);
    const bundlePath = join(DIST_ROOT, relativeAssetPath);
    if (existsSync(bundlePath)) {
      return bundlePath;
    }
  }

  const astroDirectory = join(DIST_ROOT, '_astro');
  const candidates = readdirSync(astroDirectory)
    .filter((name) => name.endsWith('.js'))
    .map((name) => join(astroDirectory, name));

  const matchingBundle = candidates.find((candidate) => {
    const source = readFileSync(candidate, 'utf8');
    return source.includes('/api/location/search') &&
      source.includes('CANDIDATES_ACCEPTED');
  });

  assert.ok(matchingBundle, 'ChartExperience location bundle is unavailable.');
  return matchingBundle;
}

test('local integration build is explicit and serves the regular static output', () => {
  const rootPackage = readJson('package.json');
  const webPackage = readJson('apps/web/package.json');
  const localBuildScript = readText('scripts/build-local-development.mjs');
  const localComposition = readText(
    'server/src/executable/run-local-development-composition.ts'
  );
  const runtimeSource = readText('apps/web/src/lib/runtime.ts');

  assert.equal(rootPackage.scripts['build:local'], 'node scripts/build-local-development.mjs');
  assert.equal(rootPackage.scripts['predev:local'], 'npm run build:local');
  assert.equal(
    webPackage.scripts['build:local-integration'],
    'astro build --mode local-integration'
  );
  assert.match(localBuildScript, /build:local-integration/u);
  assert.match(localBuildScript, /packages\/contracts/u);
  assert.match(localBuildScript, /packages\/engine-client/u);
  assert.match(localBuildScript, /server/u);
  assert.match(
    runtimeSource,
    /viteEnvironment\?\.MODE\s*===\s*'local-integration'/u
  );
  assert.match(localComposition, /apps\/web\/dist/u);
  assert.match(localComposition, /startLocalPublicEdge/u);
});

test('browser and server production paths keep development doubles explicit', () => {
  const browserEngineClient = readText('apps/web/src/lib/engine-client.ts');
  const chartPage = readText('apps/web/src/pages/index.astro');
  const educationalChartSource = readText(
    'apps/web/src/features/learn/educational-chart-source.ts'
  );
  const developmentResolver = readText(
    'apps/web/src/features/chart-input/development-resolver.ts'
  );

  assert.match(browserEngineClient, /new HttpEngineClient\(\)/u);
  assert.match(chartPage, /requireResolvedLocation=\{true\}/u);
  assert.match(educationalChartSource, /MockEngineClient/u);
  assert.match(educationalChartSource, /EDUCATIONAL_CHART_FIXTURE/u);
  assert.match(developmentResolver, /UI DEVELOPMENT ONLY/u);
  assert.match(developmentResolver, /NOT PRODUCTION RESOLUTION/u);

  const allowedDevelopmentDoubleFiles = new Set([
    join(
      'apps',
      'web',
      'src',
      'features',
      'learn',
      'educational-chart-source.ts'
    ),
    join(
      'server',
      'src',
      'executable',
      'create-executable-server-bindings.ts'
    ),
    join(
      'server',
      'src',
      'executable',
      'public-development-dependencies.ts'
    ),
    join('packages', 'engine-client', 'src', 'index.ts'),
    join('packages', 'engine-client', 'src', 'mock-engine-client.ts')
  ]);

  for (const sourcePath of collectSourceFiles(WEB_SOURCE_ROOT)) {
    const source = readFileSync(sourcePath, 'utf8');
    const sourceLabel = relative(REPOSITORY_ROOT, sourcePath);

    assertNoTestSemanticBranch(source, sourceLabel);
    if (!allowedDevelopmentDoubleFiles.has(sourceLabel)) {
      assert.doesNotMatch(source, /MockEngineClient|@natalnode\/test-fixtures/u, sourceLabel);
    }
    assert.doesNotMatch(source, /https?:\/\/(?:api\.)?geonames\.org/u, sourceLabel);
  }

  const serverSourceFiles = collectSourceFiles(SERVER_SOURCE_ROOT);
  for (const sourcePath of serverSourceFiles) {
    const source = readFileSync(sourcePath, 'utf8');
    const sourceLabel = relative(REPOSITORY_ROOT, sourcePath);

    assertNoTestSemanticBranch(source, sourceLabel);
    if (!allowedDevelopmentDoubleFiles.has(sourceLabel)) {
      assert.doesNotMatch(source, /MockEngineClient|@natalnode\/test-fixtures/u, sourceLabel);
    }
    assert.doesNotMatch(source, /https?:\/\/api\.geonames\.org/u, sourceLabel);
  }

  for (const packageName of ['contracts', 'test-fixtures', 'engine-client']) {
    for (const sourcePath of collectSourceFiles(
      join(REPOSITORY_ROOT, 'packages', packageName, 'src')
    )) {
      const source = readFileSync(sourcePath, 'utf8');
      const sourceLabel = relative(REPOSITORY_ROOT, sourcePath);

      assertNoTestSemanticBranch(source, sourceLabel);
      assert.doesNotMatch(source, /https?:\/\/api\.geonames\.org/u, sourceLabel);
    }
  }

  const executableBindings = readText(
    'server/src/executable/create-executable-server-bindings.ts'
  );
  const executableConfig = readText(
    'server/src/executable/executable-server-config.ts'
  );
  assert.match(executableBindings, /mode !== DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE/u);
  assert.match(executableBindings, /new MockEngineClient\(\)/u);
  assert.match(executableConfig, /engineClientMode !== DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE/u);
  assert.match(executableConfig, /runtimeMode === 'production'/u);
});

test('location, cache, and diagnostics boundaries remain fail-closed', () => {
  const geoNamesProvider = readText(
    'server/src/location-resolution/geonames-web-provider.ts'
  );
  const browserLocationClient = readText(
    'apps/web/src/features/chart-input/location-resolution-client.ts'
  );
  const locationRoute = readText('server/src/app/routes/location.ts');
  const chartRoute = readText('server/src/app/routes/chart.ts');
  const locationService = readText(
    'server/src/location-resolution/location-resolution-service.ts'
  );
  const chartCache = readText('server/src/app/cache/chart-result-cache.ts');
  const cachedCalculator = readText(
    'server/src/app/cache/cached-chart-calculator.ts'
  );

  assert.match(geoNamesProvider, /https:\/\/secure\.geonames\.org/u);
  assert.doesNotMatch(geoNamesProvider, /https?:\/\/api\.geonames\.org/u);
  assert.doesNotMatch(geoNamesProvider, /http:\/\/secure\.geonames\.org/u);
  assert.match(geoNamesProvider, /searchJSON/u);
  assert.match(geoNamesProvider, /timezoneJSON/u);
  assert.match(browserLocationClient, /cache:\s*'no-store'/u);
  assert.doesNotMatch(browserLocationClient, /MockEngineClient|test-fixtures/u);
  assert.match(locationRoute, /LOCATION_RESOLUTION_UNAVAILABLE/u);
  assert.match(locationService, /candidateAuthorities/u);
  assert.match(locationService, /resolvedLocations/u);
  assert.match(chartRoute, /runtimeMode !== 'production'/u);
  assert.match(chartRoute, /LOCATION_RESOLUTION_REQUIRED/u);
  assert.match(chartCache, /structuredClone/u);
  assert.match(chartCache, /expiresAt/u);
  assert.match(chartCache, /engineResultGeneration/u);
  assert.match(chartCache, /chartResultContractVersion/u);
  assert.match(cachedCalculator, /calculateChart/u);
  assert.match(cachedCalculator, /cache/u);
  assert.doesNotMatch(cachedCalculator, /setTimeout\(|setInterval\(/u);
});

test('startup failures are reported with bounded, secret-safe diagnostics', async () => {
  const localMain = readText('server/src/executable/local-main.ts');
  const publicMain = readText('server/src/executable/public-development-main.ts');
  const safeErrorSource = readText('server/src/executable/safe-startup-error.ts');

  assert.match(localMain, /formatSafeStartupError/u);
  assert.doesNotMatch(localMain, /catch\(\(\)\s*=>/u);
  assert.match(publicMain, /formatSafeStartupError/u);
  assert.doesNotMatch(publicMain, /error\.message/u);
  assert.match(safeErrorSource, /details redacted/u);
  assert.ok(safeErrorSource.includes('database[\\s_-]?url'));

  const modulePath = join(
    REPOSITORY_ROOT,
    'server',
    'dist',
    'executable',
    'safe-startup-error.js'
  );
  assert.ok(existsSync(modulePath), 'Build server before running integrity guards.');
  const { formatSafeStartupError } = await import(pathToFileURL(modulePath).href);

  assert.equal(
    formatSafeStartupError(new Error('Local public edge failed to bind on port 4321.')),
    'Error: Local public edge failed to bind on port 4321.'
  );
  assert.equal(
    formatSafeStartupError(
      new Error('DATABASE_URL=postgres://user:password@example.invalid/db')
    ),
    'Error: details redacted.'
  );
});

test('the production Astro artifact contains the real location flow without development UI', () => {
  const indexPath = join(DIST_ROOT, 'en', 'index.html');
  assert.ok(existsSync(indexPath), 'Build the web application before running integrity guards.');

  const indexHtml = readFileSync(indexPath, 'utf8');
  const chartExperienceBundlePath = findChartExperienceBundle(indexHtml);
  const chartExperienceBundle = readFileSync(chartExperienceBundlePath, 'utf8');

  assert.match(indexHtml, /component-export="ChartExperience"/u);
  assert.match(indexHtml, /requireResolvedLocation[^<]*true/u);
  assert.doesNotMatch(indexHtml, /data-location-diagnostic-state|LOCATION DIAGNOSTICS/u);
  assert.match(chartExperienceBundle, /\/api\/location\/search/u);
  assert.match(chartExperienceBundle, /\/api\/location\/resolve/u);
  assert.match(chartExperienceBundle, /AbortController/u);
  assert.match(chartExperienceBundle, /CANDIDATES_ACCEPTED/u);
  assert.match(chartExperienceBundle, /RESOLVED_ACCEPTED/u);
  assert.match(chartExperienceBundle, /NETWORK_FAILED/u);
  assert.match(chartExperienceBundle, /data-location-candidates/u);
  assert.match(chartExperienceBundle, /data-location-canonical/u);
  assert.match(chartExperienceBundle, /LocationResolutionClientError/u);
  assert.match(chartExperienceBundle, /DEV:\s*!1|DEV:\s*false/u);
  assert.doesNotMatch(chartExperienceBundle, /MockEngineClient|WEB_UI_FIXTURE_V1/u);
  assert.doesNotMatch(chartExperienceBundle, /https?:\/\/api\.geonames\.org/u);
});

test('the built local public edge serves the exact static artifact with revalidation', async () => {
  const edgeModulePath = join(
    REPOSITORY_ROOT,
    'server',
    'dist',
    'executable',
    'local-public-edge.js'
  );
  const indexPath = join(DIST_ROOT, 'en', 'index.html');
  assert.ok(existsSync(edgeModulePath), 'Build server before running edge integrity guard.');
  assert.ok(existsSync(indexPath), 'Build web before running edge integrity guard.');

  const { startLocalPublicEdge } = await import(pathToFileURL(edgeModulePath).href);
  const runtime = await startLocalPublicEdge({
    publicPort: 0,
    apiHostname: '127.0.0.1',
    apiPort: 1,
    staticDirectory: DIST_ROOT
  });

  try {
    const indexResponse = await fetch(
      `http://localhost:${runtime.publicPort}/en/`
    );
    const servedIndex = await indexResponse.text();
    assert.equal(indexResponse.status, 200);
    assert.equal(indexResponse.headers.get('cache-control'), 'no-cache');
    assert.equal(servedIndex, readFileSync(indexPath, 'utf8'));

    const bundleMatch = servedIndex.match(
      /component-url="(\/_astro\/[^"?]+\.js)"[^>]*component-export="ChartExperience"/u
    );
    assert.ok(bundleMatch?.[1], 'Served page does not identify ChartExperience bundle.');
    const bundleResponse = await fetch(
      `http://localhost:${runtime.publicPort}${bundleMatch[1]}`
    );
    assert.equal(bundleResponse.status, 200);
    assert.match(
      bundleResponse.headers.get('content-type') ?? '',
      /javascript/u
    );
  } finally {
    await runtime.close();
  }
});
