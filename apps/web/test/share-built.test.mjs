import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST_ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
function collectHtml(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtml(entryPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }

  return files;
}

function builtPath(...segments) {
  return join(DIST_ROOT, ...segments, 'index.html');
}

test('built output contains all public Share V1 route families and locales', () => {
  assert.equal(statSync(DIST_ROOT).isDirectory(), true);
  const htmlFiles = collectHtml(DIST_ROOT);
  const shareFiles = htmlFiles.filter((file) => {
    const path = relative(DIST_ROOT, file).split(sep).join('/');
    return path.includes('/share/') || path.startsWith('share/');
  });

  const expectedSharePages = (12 + 78 + 7) * (LOCALES.length + 1);
  assert.equal(shareFiles.length, expectedSharePages);

  for (const locale of LOCALES) {
    assert.equal(
      readFileSync(builtPath(locale, 'share', 'sign', 'aries'), 'utf8').includes('og:locale'),
      true,
      `${locale} sign share page`
    );
  }

  assert.equal(
    readFileSync(builtPath('en', 'share', 'sign', 'aries'), 'utf8').includes('og:type'),
    true
  );
  assert.equal(
    readFileSync(builtPath('en', 'share', 'match', 'aries--pisces'), 'utf8').includes(
      '/en/share/match/aries--pisces/'
    ),
    true
  );
  assert.equal(
    readFileSync(builtPath('zh-Hant', 'share', 'elements-modes', 'element-fire'), 'utf8').includes(
      'og:locale'
    ),
    true
  );

  const sitemap = readFileSync(join(DIST_ROOT, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /\/en\/share\/sign\/aries\//u);
  assert.match(sitemap, /\/zh-Hant\/share\/elements-modes\/element-fire\//u);
  assert.doesNotMatch(sitemap, /[?&](?:a|b)=/u);
});

test('built Share output is public, static, and free of personal or development data', () => {
  const representativePages = [
    builtPath('en', 'share', 'sign', 'aries'),
    builtPath('en', 'share', 'match', 'aries--pisces'),
    builtPath('en', 'share', 'elements-modes', 'element-fire'),
    builtPath('zh-Hant', 'share', 'sign', 'aries')
  ];

  for (const path of representativePages) {
    const html = readFileSync(path, 'utf8');
    assert.match(html, /rel="canonical"/u);
    assert.match(html, /property="og:title"/u);
    assert.match(html, /property="og:description"/u);
    assert.match(html, /name="twitter:card"/u);
    assert.doesNotMatch(html, /og:image/u);
    assert.doesNotMatch(html, /(?:latitude|longitude|timezone|birthDate|userId|chartId|accessToken)/iu);
    assert.doesNotMatch(html, /MockEngineClient|UI DEVELOPMENT ONLY|DEVELOPMENT FIXTURE/iu);
  }
});
