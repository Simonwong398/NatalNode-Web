import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalStyles = await readFile(
  new URL('../src/styles/global.css', import.meta.url),
  'utf8'
);

function panelRules() {
  return [...globalStyles.matchAll(/\.nn-chart-focus-dialog__panel\s*\{([\s\S]*?)\n  \}/gu)]
    .map((match) => match[1]);
}

test('expanded chart panel keeps hover detail outside viewport geometry changes', () => {
  const rules = panelRules();
  const expandedRule = rules.find((rule) => /height:\s*calc\(100vh - 2rem\)/u.test(rule));
  const mobileRule = rules.find((rule) => /height:\s*100%/u.test(rule));

  assert.ok(expandedRule, 'expanded panel height must remain stable');
  assert.match(expandedRule, /max-height:\s*calc\(100vh - 2rem\)/u);
  assert.match(expandedRule, /overflow:\s*auto/u);
  assert.match(expandedRule, /scrollbar-gutter:\s*stable/u);

  assert.ok(mobileRule, 'mobile panel must remain a stable full-height scroll surface');
  assert.match(mobileRule, /max-height:\s*none/u);
  assert.match(mobileRule, /min-height:\s*100%/u);
});
