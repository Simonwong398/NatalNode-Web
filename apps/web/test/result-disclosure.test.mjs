import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  assertNoResultDisclosureHarnessLeak,
  AVAILABLE_POLICY,
  focusedChart,
  TEST_CHART_REQUEST,
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

test('Chart is the default single active mode with contextual Save and compact chart facts', async () => {
  const resultTargetRef = { current: null };

  await withResultWorkspace({ resultTargetRef }, async (scope) => {
    assert.equal(scope.container.querySelectorAll('[role="tab"]').length, 3);
    assert.equal(scope.container.querySelector('[role="tablist"]').getAttribute('aria-orientation'), 'horizontal');
    assert.doesNotMatch(scope.container.querySelector('nav').className, /lg:hidden/u);
    assertActiveMode(scope, 'Chart');
    assert.strictEqual(resultTargetRef.current, scope.container.querySelector('.nn-chart-workspace'));
    assert.equal(resultTargetRef.current.tabIndex, -1);
    assert.equal(
      scope.document.getElementById(resultTargetRef.current.getAttribute('aria-labelledby')).textContent,
      'Natal Chart'
    );
    assert.match(scope.text(scope.panel('Chart')), /Chart renderer/u);
    assert.doesNotMatch(scope.text(scope.panel('Chart')), /Save this chart/u);

    const saveAction = scope.button('Save chart');
    const saveRegion = scope.document.getElementById(saveAction.getAttribute('aria-controls'));
    assert.equal(saveAction.getAttribute('aria-expanded'), 'false');
    assert.ok(saveRegion);
    assert.equal(saveRegion.hidden, true);
    assert.equal(saveRegion.querySelectorAll('form').length, 1);
    assert.equal(scope.container.querySelectorAll('button[role="tab"]').length, 3);

    const chartPanel = scope.panel('Chart');
    const orientationHeading = [...chartPanel.querySelectorAll('h4')].find(
      (heading) => scope.text(heading) === 'Chart facts at a glance'
    );
    assert.ok(orientationHeading);
    const orientation = orientationHeading.closest('section');
    const compactFacts = orientation.querySelector(':scope > dl');
    assert.deepEqual(
      [...compactFacts.querySelectorAll(':scope > div > dt')].map((item) => scope.text(item)),
      ['☉ Sun', '☽ Moon', 'ASC']
    );
    assert.match(scope.text(compactFacts), /Taurus · 45\.25°/u);
    assert.match(scope.text(compactFacts), /Libra · 183\.75°/u);
    assert.match(scope.text(compactFacts), /Cancer · 109\.8°/u);
    assert.match(scope.text(orientation), /3 body placements · 1 major aspect/u);

    const completeFacts = scope.disclosure('Complete chart facts');
    const completeFactsContent = scope.disclosureContent('Complete chart facts');
    assert.equal(completeFacts.getAttribute('aria-expanded'), 'false');
    assert.equal(completeFactsContent.hidden, true);

    for (const panel of scope.container.querySelectorAll('[role="tabpanel"]')) {
      assert.doesNotMatch(panel.className, /lg:block/u);
    }
  });
});

test('localizes workspace controls while preserving professional and provenance copy', async () => {
  await withResultWorkspace(
    { chart: { ...focusedChart(), warnings: [] }, locale: 'zh-Hant' },
    async (scope) => {
      assert.equal(scope.container.querySelector('nav').getAttribute('aria-label'), '星盤工作區區段');
      assert.equal(scope.tab('星盤').getAttribute('aria-selected'), 'true');
      assert.equal(scope.tab('解讀').getAttribute('aria-selected'), 'false');
      assert.equal(scope.tab('詳細資料').getAttribute('aria-selected'), 'false');

      const saveAction = scope.button('儲存星盤');
      assert.ok(saveAction);

      const completeFacts = scope.disclosure('完整星盤資料');
      assert.ok(completeFacts);

      await scope.click(scope.tab('詳細資料'));
      const detailsPanel = scope.panel('詳細資料');
      assert.match(scope.text(detailsPanel), /開發來源/u);
      assert.match(scope.text(detailsPanel), /測試資料識別碼/u);
      assert.match(scope.text(detailsPanel), /研究設定/u);
      assert.doesNotMatch(scope.text(detailsPanel), /Engine Version/u);
      assert.doesNotMatch(scope.text(detailsPanel), /Research configuration/u);
      assert.equal(scope.text(detailsPanel.querySelector('h3')), '計算詳細資料');
      assert.equal(
        [...detailsPanel.querySelectorAll('h4')].find((heading) => scope.text(heading) === '警告') !== undefined,
        true
      );
      assert.match(scope.text(detailsPanel), /無/u);
    }
  );
});

test('Save intent reveals one unchanged form and submits the same chart request with explicit state', async () => {
  await withResultWorkspace({}, async (scope) => {
    const saveAction = scope.button('Save chart');
    const saveRegion = scope.document.getElementById(saveAction.getAttribute('aria-controls'));
    assertActiveMode(scope, 'Chart');

    await scope.click(saveAction);
    assert.equal(saveAction.getAttribute('aria-expanded'), 'true');
    assert.equal(saveRegion.hidden, false);
    assert.equal(saveRegion.querySelectorAll('form').length, 1);
    assert.match(scope.text(saveRegion), /authoritative chart calculation is not available/u);
    assert.doesNotMatch(scope.text(saveRegion), /recalculate/u);
    assert.equal(scope.control('Chart name').closest('[id]') !== null, true);
    assert.equal(scope.control('Category').value, 'SELF');
    assertActiveMode(scope, 'Chart');

    await scope.click(scope.tab('Interpretation'));
    assertActiveMode(scope, 'Interpretation');
    assert.equal(saveAction.getAttribute('aria-expanded'), 'true');
    assert.equal(saveRegion.hidden, false);
    assert.equal(saveRegion.querySelectorAll('form').length, 1);

    await scope.change(scope.control('Chart name'), 'Focused fixture chart');
    await scope.submit(scope.control('Chart name').form);
    await scope.flush();
    assert.equal(scope.fetchCalls.length, 1);
    const requestBody = JSON.parse(scope.fetchCalls[0].init.body);
    assert.deepEqual(requestBody.chart, TEST_CHART_REQUEST);
    assert.equal(requestBody.displayName, 'Focused fixture chart');
    assert.equal(requestBody.category, 'SELF');
    assert.equal(requestBody.saveMode, 'INPUT_ONLY');
  });
});

test('complete Chart facts open once and preserve the full existing notation after the wheel', async () => {
  await withResultWorkspace({ chart: focusedChart() }, async (scope) => {
    const chartPanel = scope.panel('Chart');
    const renderer = chartPanel.querySelector('[data-testid="chart-renderer"]');
    const completeFacts = scope.disclosure('Complete chart facts');
    const completeFactsContent = scope.disclosureContent('Complete chart facts');
    assert.ok(renderer.compareDocumentPosition(completeFacts) & scope.window.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(completeFactsContent.hidden, true);

    await scope.click(completeFacts);
    assert.equal(completeFacts.getAttribute('aria-expanded'), 'true');
    assert.equal(completeFactsContent.hidden, false);
    assert.equal(completeFactsContent.querySelectorAll('dl > div').length, 3);
    assert.equal(completeFactsContent.querySelectorAll('li').length, 1);
    assert.equal(completeFactsContent.querySelectorAll('button').length, 0);
    assert.match(scope.text(completeFactsContent), /Mercury/u);
    assert.match(scope.text(completeFactsContent), /House XI/u);
    assert.match(scope.text(completeFactsContent), /orb 1\.5° · APPLYING/u);
  });
});

test('mouse and keyboard mode navigation expose exactly one panel with stable relationships', async () => {
  await withResultWorkspace({}, async (scope) => {
    await scope.click(scope.tab('Interpretation'));
    assertActiveMode(scope, 'Interpretation');
    assert.equal(scope.button('Save chart').getAttribute('aria-expanded'), 'false');

    await scope.key(scope.tab('Interpretation'), 'ArrowRight');
    assertActiveMode(scope, 'Details');
    assert.strictEqual(scope.document.activeElement, scope.tab('Details'));
    assert.match(scope.text(scope.panel('Details')), /Development source/u);
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
      const chartPanel = scope.panel('Chart');
      const orientationHeading = [...chartPanel.querySelectorAll('h4')].find(
        (heading) => scope.text(heading) === 'Chart facts at a glance'
      );
      const compactFacts = orientationHeading.closest('section').querySelector(':scope > dl');
      assert.deepEqual(
        [...compactFacts.querySelectorAll(':scope > div > dt')].map((item) => scope.text(item)),
        ['☉ Sun', '☽ Moon']
      );
      assert.doesNotMatch(scope.text(compactFacts), /ASC/u);
      assert.match(scope.text(chartPanel), /Time-dependent angles and houses unavailable\./u);
      assert.equal(scope.disclosureContent('Complete chart facts').hidden, true);

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
      assert.equal(scope.text(requestedHouseSystemRow.querySelector('dd')), 'Placidus');
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
  assert.match(
    workspaceSource,
    /<SaveChartPanel[\s\S]*chartRequest=\{snapshot\.request\}[\s\S]*chartResult=\{snapshot\.result\}[\s\S]*locale=\{locale\}[\s\S]*\/>/u
  );
});
