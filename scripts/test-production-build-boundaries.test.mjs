import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  auditProductionBuildArtifacts,
  classifyRoutePath,
  createProductionBuildArtifactBoundary,
  isExcludedProductionRoutePath,
  PRODUCTION_BUILD_MODE,
  ROUTE_CLASSES
} from './architecture/production-route-boundaries.config.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const WEB_ROOT = join(REPOSITORY_ROOT, 'apps', 'web');
const DIST_ROOT = join(WEB_ROOT, 'dist');
const PAGES_ROOT = join(WEB_ROOT, 'src', 'pages');

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function sourceRouteFiles() {
  return collectFiles(PAGES_ROOT)
    .filter((filePath) => /\.(astro|ts)$/u.test(filePath))
    .map((filePath) => toPosix(relative(PAGES_ROOT, filePath)));
}

function toPosix(value) {
  return value.split(sep).join('/');
}

function createBuildDoneOptions(directory, pages = []) {
  return {
    pages,
    dir: pathToFileURL(`${directory}${sep}`),
    logger: { info() {} }
  };
}

test('route classification derives from the current page topology', () => {
  const routes = sourceRouteFiles();
  const developmentRoutes = routes.filter((route) => route.split('/').includes('dev'));

  assert.ok(developmentRoutes.length > 0);
  assert.ok(developmentRoutes.every((route) =>
    classifyRoutePath(`/${route.replace(/\.(astro|ts)$/u, '')}`) === ROUTE_CLASSES.DEVELOPMENT_ROUTE
  ));
  assert.equal(routes.some((route) => route.split('/').includes('research')), false);
  assert.equal(routes.some((route) => route.split('/').includes('preview')), false);
  assert.equal(routes.some((route) => route.split('/').includes('poc')), false);
  assert.equal(classifyRoutePath('/about/'), ROUTE_CLASSES.PRODUCTION_ROUTE);
  assert.equal(classifyRoutePath('/research/synthetic/'), ROUTE_CLASSES.RESEARCH_PREVIEW_ROUTE);
  assert.equal(isExcludedProductionRoutePath('/preview/synthetic/'), true);
});

test('development source routes remain available outside production build mode', async () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'natalnode-route-boundary-'));
  try {
    const routeDirectory = join(fixtureRoot, 'dev', 'synthetic');
    mkdirSync(routeDirectory, { recursive: true });
    writeFileSync(join(routeDirectory, 'index.html'), '<h1>development</h1>');

    for (const mode of ['development', 'local-integration']) {
      const integration = createProductionBuildArtifactBoundary({ mode });
      await integration.hooks['astro:build:done'](
        createBuildDoneOptions(fixtureRoot, [{ pathname: 'dev/synthetic/' }])
      );
      assert.equal(
        readdirSync(routeDirectory).includes('index.html'),
        true,
        `${mode} must retain development route output`
      );
    }
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test('production build artifact audit passes for the actual production output', () => {
  const audit = auditProductionBuildArtifacts({ distRoot: DIST_ROOT });
  const repeatedAudit = auditProductionBuildArtifacts({ distRoot: DIST_ROOT });

  assert.equal(audit.pass, true, JSON.stringify(audit, null, 2));
  assert.deepEqual(repeatedAudit, audit);
  assert.equal(audit.excludedRouteArtifacts.length, 0);
  assert.equal(audit.sitemapLeaks.length, 0);
  assert.equal(audit.linkLeaks.length, 0);
  assert.deepEqual(audit.missingProductionArtifacts, []);
});

test('all current development route variants are excluded from the built artifact', () => {
  const audit = auditProductionBuildArtifacts({ distRoot: DIST_ROOT });
  const sourceDevelopmentRouteCount = sourceRouteFiles()
    .filter((route) => route.split('/').includes('dev')).length;

  assert.ok(sourceDevelopmentRouteCount >= 7);
  assert.equal(audit.excludedRouteArtifacts.length, 0);
  assert.equal(
    isExcludedProductionRoutePath('/en/dev/current-sky/'),
    true
  );
});

test('audit rejects a synthetic forbidden route artifact', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'natalnode-route-audit-'));
  try {
    mkdirSync(join(fixtureRoot, 'dev', 'synthetic'), { recursive: true });
    mkdirSync(join(fixtureRoot, 'research', 'synthetic'), { recursive: true });
    mkdirSync(join(fixtureRoot, 'about'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'index.html'), '<a href="/about/">About</a>');
    writeFileSync(join(fixtureRoot, 'about', 'index.html'), '<h1>About</h1>');
    writeFileSync(join(fixtureRoot, 'dev', 'synthetic', 'index.html'), '<h1>dev</h1>');
    writeFileSync(join(fixtureRoot, 'research', 'synthetic', 'index.html'), '<h1>research</h1>');

    const audit = auditProductionBuildArtifacts({ distRoot: fixtureRoot });

    assert.equal(audit.pass, false);
    assert.deepEqual(
      audit.excludedRouteArtifacts.map((artifact) => artifact.relativePath),
      ['dev/synthetic/index.html', 'research/synthetic/index.html']
    );
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test('production build hook removes routes only in production mode', async () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'natalnode-route-hook-'));
  try {
    const routeDirectory = join(fixtureRoot, 'dev', 'synthetic');
    mkdirSync(routeDirectory, { recursive: true });
    writeFileSync(join(routeDirectory, 'index.html'), '<h1>dev</h1>');

    const integration = createProductionBuildArtifactBoundary({
      mode: PRODUCTION_BUILD_MODE
    });
    await integration.hooks['astro:build:done'](createBuildDoneOptions(
      fixtureRoot,
      [{ pathname: 'dev/synthetic/' }, { pathname: 'about/' }]
    ));

    assert.equal(existsSync(routeDirectory), false);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test('research/POC source remains available without becoming a route artifact', () => {
  const expectedSources = [
    'src/features/interpretation/weekly-reading-prototype.ts',
    'src/features/interpretation/composition-signal-personal-synthesis-poc.ts',
    'src/features/my-chart/MyChartRelationalPoc.tsx'
  ];

  for (const source of expectedSources) {
    assert.equal(existsSync(join(WEB_ROOT, source)), true, source);
  }
});
