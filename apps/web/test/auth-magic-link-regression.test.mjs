import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const middlewareSource = readFileSync(
  new URL('../src/middleware.ts', import.meta.url),
  'utf8'
);
const builtCompletionPage = readFileSync(
  new URL('../dist/auth/complete/index.html', import.meta.url),
  'utf8'
);

test('Email Magic Link completion remains at the fragment-bearing unlocalized route', () => {
  const presentationRoutes = /const PRESENTATION_PAGE_ROUTE_PATTERNS = new Set\(\[([\s\S]*?)\]\);/u.exec(
    middlewareSource
  );

  assert.ok(presentationRoutes, 'presentation route registry is missing');
  assert.doesNotMatch(presentationRoutes[1], /['"]\/auth\/complete['"]/u);
  assert.doesNotMatch(builtCompletionPage, /http-equiv=["']refresh["']/iu);
  assert.match(builtCompletionPage, /id=["']auth-completion-status["']/u);
});
