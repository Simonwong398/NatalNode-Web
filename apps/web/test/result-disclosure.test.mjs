import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  assertNoResultDisclosureHarnessLeak,
  AVAILABLE_POLICY,
  focusedChart,
  UNKNOWN_TIME_POLICY,
  withResultWorkspace
} from './support/result-disclosure-harness.mjs';

afterEach(assertNoResultDisclosureHarnessLeak);

function assertActiveMode(scope, activeName) {
  for (const name of ['Chart', 'Interpretation', 'Details']) {
    const isActive = name === activeName;
    const tab = scope.tab(name);
    const panel = scope.panel(name);

    assert.equal(tab.getAttribute('aria-selected'), String(isActive));
    assert.equal(tab.tabIndex, isActive ? 0 : -1);
    assert.equal(panel.hidden, !isActive);
    assert.equal(panel.getAttribute('tabindex'), isActive ? '0' : null);
    assert.equal(panel.getAttribute('aria-labelledby'), tab.id);
    assert.equal(tab.getAttribute('aria-controls'), panel.id);
  }
}

test('Chart is the default single active mode and the unchanged Save slot remains separate', async () => {
  await withResultWorkspace({}, async (scope) => {
    assert.equal(scope.container.querySelectorAll('[role="tab"]').length, 3);
    assert.equal(scope.container.querySelector('[role="tablist"]').getAttribute('aria-orientation'), 'horizontal');
    assert.doesNotMatch(scope.container.querySelector('nav').className, /lg:hidden/u);
    assertActiveMode(scope, 'Chart');
    assert.match(scope.text(scope.panel('Chart')), /Chart renderer/u);
    assert.match(scope.text(scope.panel('Chart')), /Astrological notation/u);
    assert.doesNotMatch(scope.text(scope.panel('Chart')), /Save this chart/u);
    assert.equal(scope.container.querySelectorAll('[data-testid="save-chart-panel"]').length, 1);

    for (const panel of scope.container.querySelectorAll('[role="tabpanel"]')) {
      assert.doesNotMatch(panel.className, /lg:block/u);
    }
  });
});

test('mouse and keyboard mode navigation expose exactly one panel with stable relationships', async () => {
  await withResultWorkspace({}, async (scope) => {
    await scope.click(scope.tab('Interpretation'));
    assertActiveMode(scope, 'Interpretation');
    assert.equal(scope.container.querySelectorAll('[data-testid="save-chart-panel"]').length, 1);

    await scope.key(scope.tab('Interpretation'), 'ArrowRight');
    assertActiveMode(scope, 'Details');
    assert.strictEqual(scope.document.activeElement, scope.tab('Details'));
    assert.match(scope.text(scope.panel('Details')), /Engine Version/u);
    assert.equal(scope.panel('Details').querySelector('details'), null);
    assert.equal(scope.panel('Details').querySelector('summary'), null);

    await scope.key(scope.tab('Details'), 'Home');
    assertActiveMode(scope, 'Chart');
    assert.strictEqual(scope.document.activeElement, scope.tab('Chart'));

    await scope.key(scope.tab('Chart'), 'ArrowLeft');
    assertActiveMode(scope, 'Details');
    assert.strictEqual(scope.document.activeElement, scope.tab('Details'));
  });
});

test('Interpretation opens with orientation and truthful collapsed counts from current arrays', async () => {
  await withResultWorkspace({ chart: focusedChart() }, async (scope) => {
    await scope.click(scope.tab('Interpretation'));
    const panel = scope.panel('Interpretation');

    assert.match(scope.text(panel), /Big Three/u);
    assert.match(scope.text(panel), /Sun in Taurus/u);
    assert.match(scope.text(panel), /Moon in Libra/u);
    assert.match(scope.text(panel), /Ascendant in Cancer/u);

    const signs = scope.disclosure('Planets in Signs');
    const houses = scope.disclosure('Planets in Houses');
    const aspects = scope.disclosure('Major Aspects');
    assert.equal(signs.getAttribute('aria-expanded'), 'false');
    assert.equal(houses.getAttribute('aria-expanded'), 'false');
    assert.equal(aspects.getAttribute('aria-expanded'), 'false');
    assert.match(scope.text(signs), /3 placements/u);
    assert.match(scope.text(houses), /3 placements/u);
    assert.match(scope.text(aspects), /1 major aspect/u);
    assert.equal(scope.disclosureContent('Planets in Signs').hidden, true);
    assert.equal(scope.disclosureContent('Planets in Houses').hidden, true);
    assert.equal(scope.disclosureContent('Major Aspects').hidden, true);
  });
});

test('deeper Interpretation sections open independently, retain source facts, and survive mode changes', async () => {
  await withResultWorkspace({ chart: focusedChart() }, async (scope) => {
    await scope.click(scope.tab('Interpretation'));
    await scope.click(scope.disclosure('Planets in Signs'));
    await scope.click(scope.disclosure('Major Aspects'));

    assert.equal(scope.disclosure('Planets in Signs').getAttribute('aria-expanded'), 'true');
    assert.equal(scope.disclosure('Major Aspects').getAttribute('aria-expanded'), 'true');
    assert.equal(scope.disclosure('Planets in Houses').getAttribute('aria-expanded'), 'false');
    assert.equal(scope.disclosureContent('Planets in Signs').hidden, false);
    assert.equal(scope.disclosureContent('Major Aspects').hidden, false);
    assert.equal(scope.disclosureContent('Planets in Houses').hidden, true);
    assert.equal(scope.disclosureContent('Planets in Signs').querySelectorAll('article').length, 3);
    assert.equal(scope.disclosureContent('Major Aspects').querySelectorAll('article').length, 1);
    assert.match(scope.text(scope.disclosureContent('Planets in Signs')), /Source fact Sun/u);
    assert.match(
      scope.text(scope.disclosureContent('Major Aspects')),
      /Source fact Sun opposition Moon — orb 1\.5° — APPLYING/u
    );

    await scope.click(scope.tab('Chart'));
    assertActiveMode(scope, 'Chart');
    await scope.click(scope.tab('Interpretation'));
    assertActiveMode(scope, 'Interpretation');
    assert.equal(scope.disclosure('Planets in Signs').getAttribute('aria-expanded'), 'true');
    assert.equal(scope.disclosure('Major Aspects').getAttribute('aria-expanded'), 'true');
  });
});

test('unknown time keeps Core placements and a non-expandable house limitation globally qualified', async () => {
  await withResultWorkspace(
    { chart: focusedChart(), presentationPolicy: UNKNOWN_TIME_POLICY },
    async (scope) => {
      assert.match(scope.text(), /Birth time is unknown/u);
      await scope.click(scope.tab('Interpretation'));
      const panel = scope.panel('Interpretation');

      assert.match(scope.text(panel), /Core placements/u);
      assert.doesNotMatch(scope.text(panel), /Big Three/u);
      assert.doesNotMatch(scope.text(panel), /Ascendant in/u);
      const housesAvailability = scope.availability('Planets in Houses');
      assert.equal(scope.text(housesAvailability.querySelector('h4')), 'Planets in Houses');
      assert.equal(
        scope.text(housesAvailability.querySelector('p')),
        'Unavailable without an exact birth time.'
      );
      assert.doesNotMatch(scope.text(panel), /Planets in Houses 0 placements/u);
      assert.throws(() => scope.disclosure('Planets in Houses'));

      await scope.click(scope.tab('Details'));
      assertActiveMode(scope, 'Details');
      assert.match(scope.text(), /Birth time is unknown/u);
      const requestedHouseSystemRow = [...scope.panel('Details').querySelectorAll('dl > div')].find(
        (row) => scope.text(row.querySelector('dt')) === 'Requested House System'
      );
      assert.ok(requestedHouseSystemRow);
      assert.equal(scope.text(requestedHouseSystemRow.querySelector('dd')), 'PLACIDUS');
    }
  );
});

test('an available result with no supported major aspects shows a non-error empty state', async () => {
  await withResultWorkspace(
    { chart: { ...focusedChart(), aspects: [] }, presentationPolicy: AVAILABLE_POLICY },
    async (scope) => {
      await scope.click(scope.tab('Interpretation'));
      const aspectsAvailability = scope.availability('Major Aspects');
      assert.equal(scope.text(aspectsAvailability.querySelector('h4')), 'Major Aspects');
      assert.equal(
        scope.text(aspectsAvailability.querySelector('p')),
        'No supported major-aspect interpretations are available for this chart.'
      );
      assert.throws(() => scope.disclosure('Major Aspects'));
    }
  );
});

test('development disclosures and the production SaveChartPanel integration remain present in source', async () => {
  const [experienceSource, workspaceSource] = await Promise.all([
    readFile(new URL('../src/features/chart-experience/ChartExperience.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/chart-workspace/ChartWorkspace.tsx', import.meta.url), 'utf8')
  ]);

  for (const disclosure of [
    'UI DEVELOPMENT ONLY',
    'NOT SCIENTIFIC EVIDENCE',
    'NOT PRODUCTION ASTRONOMY'
  ]) {
    assert.match(experienceSource, new RegExp(disclosure, 'u'));
  }

  assert.match(workspaceSource, /import SaveChartPanel from '@\/features\/vault\/SaveChartPanel';/u);
  assert.match(workspaceSource, /<SaveChartPanel chartRequest=\{snapshot\.request\} \/>/u);
});
