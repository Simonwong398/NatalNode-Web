import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  assertNoResultTransitionHarnessLeak,
  chartResult,
  deferred,
  withResultTransition
} from './support/result-transition-harness.mjs';

afterEach(() => {
  assertNoResultTransitionHarnessLeak();
});

test('initial load and failed calculation do not transition to a result', async () => {
  await withResultTransition(async (scope) => {
    assert.equal(scope.resultTarget(), null);
    assert.equal(scope.resultFocusCalls().length, 0);
    assert.equal(scope.resultScrollCalls().length, 0);

    const calculate = scope.button('Calculate Chart');
    calculate.focus();
    const failedCalculation = deferred();
    scope.queueCalculation(failedCalculation.promise);
    await scope.click(calculate);
    assert.equal(scope.button('Calculating chart…').disabled, true);

    await scope.settle(failedCalculation, 'reject', new Error('fixture failure'));

    assert.equal(scope.resultTarget(), null);
    assert.strictEqual(scope.document.activeElement, calculate);
    assert.equal(scope.resultFocusCalls().length, 0);
    assert.equal(scope.resultScrollCalls().length, 0);
    assert.match(scope.container.querySelector('[role="alert"]').textContent, /could not be completed/);
  });
});

test('each successful user calculation focuses and reveals one semantic result target exactly once', async () => {
  await withResultTransition(async (scope) => {
    const firstCalculation = deferred();
    scope.queueCalculation(firstCalculation.promise);
    await scope.click(scope.button('Calculate Chart'));
    await scope.settle(firstCalculation, 'resolve', chartResult('first-result'));

    const firstTarget = scope.resultTarget();
    const headingId = firstTarget.getAttribute('aria-labelledby');
    assert.ok(headingId);
    assert.equal(scope.document.getElementById(headingId).textContent, 'Natal Chart');
    assert.equal(firstTarget.tagName, 'SECTION');
    assert.equal(firstTarget.tabIndex, -1);
    assert.strictEqual(scope.document.activeElement, firstTarget);
    assert.equal(scope.activeMode(), 'chart');
    assert.equal(scope.resultFocusCalls().length, 1);
    assert.equal(scope.resultScrollCalls().length, 1);
    assert.deepEqual(scope.resultFocusCalls()[0].options, { preventScroll: true });
    assert.deepEqual(scope.resultScrollCalls()[0].options, { block: 'start' });

    await scope.rerender();
    await scope.click(scope.button('Interpretation'));
    await scope.click(scope.button('Complete chart facts'));
    await scope.click(scope.button('Save chart'));
    assert.equal(scope.activeMode(), 'interpretation');
    assert.equal(scope.resultFocusCalls().length, 1);
    assert.equal(scope.resultScrollCalls().length, 1);

    const failedRecalculation = deferred();
    const calculateAfterReading = scope.button('Calculate Chart');
    calculateAfterReading.focus();
    scope.queueCalculation(failedRecalculation.promise);
    await scope.click(calculateAfterReading);
    await scope.settle(failedRecalculation, 'reject', new Error('fixture recalculation failure'));
    assert.strictEqual(scope.resultTarget(), firstTarget);
    assert.equal(scope.activeMode(), 'interpretation');
    assert.equal(scope.resultFocusCalls().length, 1);
    assert.equal(scope.resultScrollCalls().length, 1);

    const secondCalculation = deferred();
    const calculate = scope.button('Calculate Chart');
    calculate.focus();
    scope.queueCalculation(secondCalculation.promise);
    await scope.click(calculate);
    await scope.settle(secondCalculation, 'resolve', chartResult('second-result'));

    const secondTarget = scope.resultTarget();
    assert.notStrictEqual(secondTarget, firstTarget);
    assert.strictEqual(scope.document.activeElement, secondTarget);
    assert.equal(scope.activeMode(), 'chart');
    assert.equal(scope.button('Complete chart facts').getAttribute('aria-expanded'), 'false');
    assert.equal(scope.button('Save chart').getAttribute('aria-expanded'), 'false');
    assert.equal(scope.resultFocusCalls().length, 2);
    assert.equal(scope.resultScrollCalls().length, 2);
    assert.equal(scope.calculationCalls.length, 3);
  });
});

test('saved-chart mounting remains outside the calculation-success transition boundary', async () => {
  const [experienceSource, workspaceSource, savedChartSource] = await Promise.all([
    readFile(new URL('../src/features/chart-experience/ChartExperience.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/chart-workspace/ChartWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/vault/SavedVaultChartExperience.tsx', import.meta.url), 'utf8')
  ]);

  assert.match(experienceSource, /setSuccessfulCalculationSequence/);
  assert.match(experienceSource, /resultTargetRef=\{resultTargetRef\}/);
  assert.match(workspaceSource, /resultTargetRef=\{resultTargetRef\}/);
  assert.doesNotMatch(savedChartSource, /resultTargetRef/);
  assert.doesNotMatch(experienceSource, /pushState|replaceState|localStorage|sessionStorage/);
});
