import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createWeeklyReadingPrototypeScenarios
} from '../dist/weekly-ui-prototype-characterization/features/interpretation/weekly-reading-prototype.js';

const scenarios = createWeeklyReadingPrototypeScenarios();
const byId = (id) => scenarios.find((scenario) => scenario.id === id);
const clearModel = (id) => byId(id).models.CLEAR;
const astrologerModel = (id) => byId(id).models.ASTROLOGER;
const componentSource = await readFile(new URL('../src/features/interpretation/WeeklyReadingPrototype.tsx', import.meta.url), 'utf8');
const routeSource = await readFile(new URL('../src/pages/dev/weekly-reading.astro', import.meta.url), 'utf8');

const SCENARIO_A = 'SCENARIO_A_SUPPORTIVE_COMMUNICATION';
const SCENARIO_B = 'SCENARIO_B_MIXED_RELATIONSHIP';
const SCENARIO_C = 'SCENARIO_C_ACTION_EMOTIONAL_TENSION';
const SCENARIO_D = 'SCENARIO_D_BACKGROUND_MOMENTARY';
const SCENARIO_E = 'SCENARIO_E_UNKNOWN_TIME';

function allReaderCopy(model) {
  const screen = model.screen;
  return [
    screen.hero.text,
    ...screen.atAGlance.flatMap((theme) => [theme.label, theme.meaning]),
    ...screen.domains.flatMap((domain) => [domain.label, domain.meaning]),
    ...(screen.timeline?.entries.flatMap((entry) => [entry.label, entry.meaning]) ?? []),
    ...(screen.watchOut === null ? [] : [screen.watchOut.text]),
    screen.why.text,
    ...(screen.astrologerView.text === null ? [] : [screen.astrologerView.text]),
    ...model.disclosures.map((disclosure) => disclosure.text),
    screen.signature.text,
    model.share.identity,
    model.share.site
  ];
}

function windowsOverlap(left, right) {
  return Date.parse(left.period.startsAt) < Date.parse(right.period.endsAt) &&
    Date.parse(right.period.startsAt) < Date.parse(left.period.endsAt);
}

test('the prototype exposes all five existing scenarios through the accepted transformation chain', () => {
  assert.deepEqual(
    scenarios.map((scenario) => scenario.id),
    [SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D, SCENARIO_E]
  );

  for (const scenario of scenarios) {
    for (const model of Object.values(scenario.models)) {
      assert.equal(model.authority.status, 'DEVELOPMENT_ONLY');
      assert.equal(model.authority.productionEligible, false);
      assert.ok(model.screen);
    }
  }
});

test('the reader component consumes the screen projection and has no raw Signal renderer path', () => {
  assert.match(componentSource, /model\.screen/u);
  assert.match(componentSource, /screen\.readingOrder/u);
  assert.doesNotMatch(componentSource, /InterpretationSignal|sourceFactRefs|signalId|\.signals/u);
});

test('Scenario E intentionally closes without a Timeline or timing cue', () => {
  const model = clearModel(SCENARIO_E);
  assert.equal(model.timeline, null);
  assert.equal(model.hero.timingCue, null);
  assert.equal(model.screen.timeline, null);
  assert.equal(model.screen.readingOrder.includes('TIMELINE'), false);
  assert.equal(model.disclosures[0].kind, 'UNKNOWN_BIRTH_TIME');
});

test('Scenarios B and C preserve overlapping windows as separate readable entries', () => {
  for (const id of [SCENARIO_B, SCENARIO_C]) {
    const entries = clearModel(id).screen.timeline.entries;
    assert.equal(entries.length, 2, id);
    assert.equal(windowsOverlap(entries[0], entries[1]), true, id);
    assert.notEqual(entries[0].id, entries[1].id, id);
    assert.ok(entries.every((entry) => entry.label.length > 0), id);
    assert.ok(entries.every((entry) => entry.meaning.length > 0), id);
  }
});

test('Scenario D keeps the longer thematic window before the momentary window', () => {
  const model = clearModel(SCENARIO_D);
  const entries = model.screen.timeline.entries;
  assert.equal(entries[0].category, 'CORE');
  assert.equal(entries[0].priority, 'THEMATIC');
  assert.equal(entries[1].category, 'MOMENTARY');
  assert.match(model.atAGlance[0].label, /Steady progress/u);
  assert.equal(entries.some((entry) => entry.emphasis === 'BEST_WINDOW'), true);
});

test('conditional domains are model-owned and omitted when they add no new meaning', () => {
  const communicationDomains = clearModel(SCENARIO_A).screen.domains.map((domain) => domain.id);
  const unknownTimeDomains = clearModel(SCENARIO_E).screen.domains.map((domain) => domain.id);

  assert.equal(communicationDomains.includes('relationship'), false);
  assert.equal(communicationDomains.includes('inner-state'), false);
  assert.deepEqual(unknownTimeDomains, []);
  assert.equal(clearModel(SCENARIO_E).screen.readingOrder.includes('DOMAINS'), false);
  assert.match(componentSource, /screen\.domains\.map\(/u);
  assert.match(componentSource, /hasSection\(screen, ['"]DOMAINS['"]\)/u);
});

test('Astrologer View is conditional and advanced-only', () => {
  assert.equal(clearModel(SCENARIO_A).screen.astrologerView.available, false);
  assert.equal(clearModel(SCENARIO_A).screen.readingOrder.includes('ASTROLOGER_VIEW'), false);

  const model = astrologerModel(SCENARIO_A);
  assert.equal(model.screen.astrologerView.available, true);
  assert.equal(model.screen.astrologerView.visibility, 'ADVANCED_ONLY');
  assert.equal(model.screen.readingOrder.includes('ASTROLOGER_VIEW'), true);
});

test('reader-visible model content contains no fixture, signal, rule, or provenance identifiers', () => {
  for (const scenario of scenarios) {
    for (const model of Object.values(scenario.models)) {
      for (const copy of allReaderCopy(model)) {
        assert.doesNotMatch(copy, /fixture:|fixture\/\/|weekly-poc\.|signal\.|rule\.|provenance|DEVELOPMENT_FIXTURE/u);
      }
    }
  }
});

test('Collect remains future-state and the prototype renders only available Save, Share, and Print affordances', () => {
  for (const scenario of scenarios) {
    const actions = scenario.models.CLEAR.actions;
    assert.equal(actions.find((action) => action.kind === 'COLLECT').status, 'FUTURE');
  }

  assert.match(componentSource, /action\.kind !== 'COLLECT'/u);
  assert.match(componentSource, /action\.status === 'AVAILABLE'/u);
  assert.doesNotMatch(componentSource, />Collect</u);
});

test('development route is gated, unindexed, and absent from normal product navigation', () => {
  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /NATALNODE_LOCAL_DEV_PREVIEW/u);
  assert.match(routeSource, /robots: 'noindex,nofollow'/u);
  assert.doesNotMatch(routeSource, /href=/u);
});

test('timeline presentation is stacked rather than dependent on horizontal scrolling', () => {
  assert.doesNotMatch(componentSource, /overflow-x-(?:auto|scroll)/u);
  assert.match(componentSource, /data-weekly-timeline/u);
  assert.match(componentSource, /data-timing-category/u);
  assert.match(componentSource, /Background context/u);
  assert.match(componentSource, /Shorter active window/u);
});

test('the composition keeps canonical NatalNode branding and accessible disclosure semantics', () => {
  assert.match(componentSource, /model\.share\.identity/u);
  assert.match(componentSource, /model\.share\.site/u);
  assert.match(componentSource, /<article/u);
  assert.match(componentSource, /<h1/u);
  assert.match(componentSource, /<details/u);
  assert.match(componentSource, /<summary/u);
  assert.match(componentSource, /aria-labelledby/u);
  assert.match(componentSource, /focus-visible/u);
});

test('the five default models retain the bounded human reading order', () => {
  for (const scenario of scenarios) {
    const sections = scenario.models.CLEAR.screen.readingOrder;
    assert.equal(sections[0], 'HERO');
    assert.ok(sections.indexOf('WHY') > sections.indexOf('HERO'));
    assert.ok(sections.indexOf('ACTIONS') > sections.indexOf('WHY'));
    assert.equal(sections.includes('SIGNATURE'), true);
  }
});
