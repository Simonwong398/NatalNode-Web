import { readdirSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

import { PRODUCTION_BOUNDARY_CONFIG } from './production-boundaries.config.mjs';

export const PRODUCTION_BUILD_MODE = 'production';

const EXCLUDED_ROUTE_SEGMENTS = new Set([
  ...PRODUCTION_BOUNDARY_CONFIG.developmentRouteSegments,
  'research',
  'preview',
  'poc'
]);

export const ROUTE_CLASSES = Object.freeze({
  PRODUCTION_ROUTE: 'PRODUCTION_ROUTE',
  DEVELOPMENT_ROUTE: 'DEVELOPMENT_ROUTE',
  RESEARCH_PREVIEW_ROUTE: 'RESEARCH_PREVIEW_ROUTE',
  TEST_FIXTURE_ROUTE: 'TEST_FIXTURE_ROUTE',
  FUTURE_DISABLED_ROUTE: 'FUTURE_DISABLED_ROUTE'
});

function toPosix(value) {
  return value.split(sep).join('/');
}

function normalizePathname(pathname) {
  const value = String(pathname ?? '').replaceAll('\\', '/');
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function routeSegments(pathname) {
  return normalizePathname(pathname)
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
}

export function isExcludedProductionRoutePath(pathname) {
  return routeSegments(pathname).some((segment) => EXCLUDED_ROUTE_SEGMENTS.has(segment));
}

export function classifyRoutePath(pathname) {
  const segments = routeSegments(pathname);
  if (segments.includes('dev')) {
    return ROUTE_CLASSES.DEVELOPMENT_ROUTE;
  }
  if (segments.some((segment) => ['research', 'preview', 'poc'].includes(segment))) {
    return ROUTE_CLASSES.RESEARCH_PREVIEW_ROUTE;
  }
  return ROUTE_CLASSES.PRODUCTION_ROUTE;
}

function routeDirectory(dir, pathname) {
  const relativePath = normalizePathname(pathname)
    .replace(/^\//, '')
    .replace(/\/index\.html$|\.html$/u, '')
    .replace(/\/+$/u, '');
  return new URL(relativePath ? `${relativePath}/` : './', dir);
}

function isProductionMode(mode) {
  return mode === PRODUCTION_BUILD_MODE;
}

export function createProductionBuildArtifactBoundary({ mode } = {}) {
  let resolvedMode = mode;

  return {
    name: 'natalnode-production-build-artifact-boundary',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        if (mode !== undefined) {
          return;
        }
        updateConfig({
          vite: {
            plugins: [{
              name: 'natalnode-production-build-mode',
              configResolved(config) {
                resolvedMode = config.mode;
              }
            }]
          }
        });
      },
      'astro:build:done': async ({ pages, dir, logger }) => {
        if (!isProductionMode(resolvedMode)) {
          return;
        }

        const excludedPages = pages.filter(({ pathname }) =>
          isExcludedProductionRoutePath(pathname)
        );
        await Promise.all(excludedPages.map(({ pathname }) =>
          rm(routeDirectory(dir, pathname), { force: true, recursive: true })
        ));

        logger.info(
          'build',
          `Excluded ${excludedPages.length} development/research route artifact(s).`
        );
      }
    }
  };
}

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

function artifactPathname(relativePath) {
  const normalized = toPosix(relativePath);
  if (normalized === 'index.html') {
    return '/';
  }
  if (normalized.endsWith('/index.html')) {
    return `/${normalized.slice(0, -'/index.html'.length)}/`;
  }
  if (normalized.endsWith('.html')) {
    return `/${normalized}`;
  }
  return null;
}

function htmlLinks(source) {
  const links = [];
  for (const match of source.matchAll(/(?:href|action)\s*=\s*["']([^"']+)["']/giu)) {
    const value = match[1];
    if (value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) {
      continue;
    }
    try {
      links.push(new URL(value, 'https://natalnode.test').pathname);
    } catch {
      // Malformed non-route attributes are outside this artifact audit.
    }
  }
  return links;
}

export function auditProductionBuildArtifacts({ distRoot }) {
  const files = collectFiles(distRoot);
  const htmlFiles = files.filter((filePath) => filePath.endsWith('.html'));
  const htmlArtifacts = htmlFiles.map((filePath) => {
    const relativePath = toPosix(relative(distRoot, filePath));
    return {
      filePath,
      relativePath,
      pathname: artifactPathname(relativePath)
    };
  });
  const excludedRouteArtifacts = htmlArtifacts.filter(({ pathname }) =>
    pathname !== null && isExcludedProductionRoutePath(pathname)
  );
  const productionHtmlArtifacts = htmlArtifacts.filter(({ pathname }) =>
    pathname === null || !isExcludedProductionRoutePath(pathname)
  );
  const linkLeaks = [];

  for (const artifact of productionHtmlArtifacts) {
    const source = readFileSync(artifact.filePath, 'utf8');
    for (const link of htmlLinks(source)) {
      if (isExcludedProductionRoutePath(link)) {
        linkLeaks.push({ artifact: artifact.relativePath, link });
      }
    }
  }

  const sitemapFiles = files.filter((filePath) => filePath.endsWith('/sitemap.xml') ||
    filePath.endsWith('sitemap.xml'));
  const sitemapLeaks = sitemapFiles.flatMap((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const links = htmlLinks(source.replaceAll('<loc>', '<a href="').replaceAll('</loc>', '">'));
    return links.filter((link) => isExcludedProductionRoutePath(link)).map((link) => ({
      sitemap: toPosix(relative(distRoot, filePath)),
      link
    }));
  });

  const requiredProductionArtifacts = [
    'index.html',
    'about/index.html',
    'learn/index.html',
    'methodology/index.html',
    'privacy/index.html',
    'terms/index.html',
    'tools/index.html',
    'vault/chart/index.html'
  ];
  const existingArtifacts = new Set(files.map((filePath) =>
    toPosix(relative(distRoot, filePath))
  ));
  const missingProductionArtifacts = requiredProductionArtifacts.filter((filePath) =>
    !existingArtifacts.has(filePath)
  );

  return {
    htmlArtifactCount: htmlArtifacts.length,
    productionHtmlArtifactCount: productionHtmlArtifacts.length,
    excludedRouteArtifacts: excludedRouteArtifacts.map(({ relativePath, pathname }) => ({
      relativePath,
      pathname
    })),
    sitemapFiles: sitemapFiles.map((filePath) => toPosix(relative(distRoot, filePath))),
    sitemapLeaks,
    linkLeaks,
    missingProductionArtifacts,
    pass: excludedRouteArtifacts.length === 0 &&
      sitemapLeaks.length === 0 &&
      linkLeaks.length === 0 &&
      missingProductionArtifacts.length === 0
  };
}
