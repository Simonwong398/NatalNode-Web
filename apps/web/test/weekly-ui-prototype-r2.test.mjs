import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createWeeklyReadingR2Scenarios
} from '../dist/weekly-ui-prototype-r2-characterization/features/interpretation/weekly-reading-prototype-r2.js';

const scenarios = createWeeklyReadingR2Scenarios();
const byId = (id) => scenarios.find((scenario) => scenario.id === id);
const r2ComponentSource = await readFile(
  new URL('../src/features/interpretation/WeeklyReadingPrototypeR2.tsx', import.meta.url),
  'utf8'
);
const r2DataSource = await readFile(
  new URL('../src/features/interpretation/weekly-reading-prototype-r2.ts', import.meta.url),
  'utf8'
);
const r2RouteSource = await readFile(
  new URL('../src/pages/dev/weekly-reading-r2.astro', import.meta.url),
  'utf8'
);
const r2StyleSource = await readFile(
  new URL('../src/styles/weekly-reading-r2.css', import.meta.url),
  'utf8'
);
const v1ComponentSource = await readFile(
  new URL('../src/features/interpretation/WeeklyReadingPrototype.tsx', import.meta.url),
  'utf8'
);
const v1RouteSource = await readFile(
  new URL('../src/pages/dev/weekly-reading.astro', import.meta.url),
  'utf8'
);

const SCENARIO_A = 'SCENARIO_A_SUPPORTIVE_COMMUNICATION';
const SCENARIO_B = 'SCENARIO_B_MIXED_RELATIONSHIP';
const SCENARIO_C = 'SCENARIO_C_ACTION_EMOTIONAL_TENSION';
const SCENARIO_D = 'SCENARIO_D_BACKGROUND_MOMENTARY';
const SCENARIO_E = 'SCENARIO_E_UNKNOWN_TIME';

function readerCopy(model) {
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

test('R2 exposes all five scenarios through one fixed model projection', () => {
  assert.deepEqual(
    scenarios.map((scenario) => scenario.id),
    [SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D, SCENARIO_E]
  );

  assert.ok(scenarios.every((scenario) => scenario.model.style === 'ASTROLOGER'));
  assert.ok(scenarios.every((scenario) => scenario.model.authority.status === 'DEVELOPMENT_ONLY'));
  assert.ok(scenarios.every((scenario) => scenario.model.authority.productionEligible === false));
});

test('R2 adapter reuses the accepted V1 transformation chain without raw Signal access', () => {
  assert.match(r2DataSource, /createWeeklyReadingPrototypeScenarios/u);
  assert.match(r2DataSource, /models\[R2_DEFAULT_MODEL_STYLE\]/u);
  assert.doesNotMatch(r2DataSource, /\.signalSet|\.signals|InterpretationSignal|sourceFactRefs/u);
});

test('R2 component consumes WeeklyReadingModel projections rather than raw Signals', () => {
  assert.match(r2ComponentSource, /WeeklyReadingModel/u);
  assert.match(r2ComponentSource, /model\.screen/u);
  assert.match(r2ComponentSource, /screen\.hero\.timingCue/u);
  assert.match(r2ComponentSource, /screen\.timeline\.entries\.map/u);
  assert.doesNotMatch(
    r2ComponentSource,
    /InterpretationSignal|sourceFactRefs|signalId|\.signals|firstTimelineEntry|timeline\.entries\[0\]/u
  );
});

test('the accepted V1 route and component remain present as the structural research baseline', () => {
  assert.match(v1ComponentSource, /data-weekly-prototype-root/u);
  assert.match(v1ComponentSource, /data-weekly-reading/u);
  assert.match(v1RouteSource, /canonical: '\/dev\/weekly-reading'/u);
  assert.doesNotMatch(v1ComponentSource, /weekly-r2/u);
});

test('Scenario D keeps broad background and shorter momentary timing explicit', () => {
  const model = byId(SCENARIO_D).model;
  const entries = model.screen.timeline.entries;

  assert.deepEqual(entries.map((entry) => entry.category), ['CORE', 'MOMENTARY']);
  assert.deepEqual(entries.map((entry) => entry.label), ['Mon–Sun', 'Fri–Sun']);
  assert.match(r2ComponentSource, /data-timing-category=\{entry\.category\}/u);
  assert.match(r2ComponentSource, /Background sets the tone/u);
  assert.match(r2ComponentSource, /Short active window/u);
});

test('Scenario E remains complete without fabricated timing or time-dependent chart detail', () => {
  const model = byId(SCENARIO_E).model;

  assert.equal(model.birthTimeAuthority, 'UNKNOWN');
  assert.equal(model.timeline, null);
  assert.equal(model.hero.timingCue, null);
  assert.equal(model.screen.timeline, null);
  assert.equal(model.screen.readingOrder.includes('TIMELINE'), false);
  assert.ok(model.disclosures.length > 0);
  assert.match(r2ComponentSource, /data-weekly-r2-unknown-time/u);
});

test('At-a-Glance remains model-bounded and conditional domains remain model-owned', () => {
  for (const scenario of scenarios) {
    assert.ok(scenario.model.screen.atAGlance.length <= 3, scenario.id);
    assert.match(r2ComponentSource, /screen\.atAGlance\.map\(/u);
    assert.match(r2ComponentSource, /screen\.domains\.map\(/u);
  }

  assert.deepEqual(byId(SCENARIO_E).model.screen.domains, []);
  assert.equal(byId(SCENARIO_A).model.screen.domains.some((domain) => domain.id === 'relationship'), false);
});

test('Astrologer’s View is rendered only when the model exposes it as advanced depth', () => {
  for (const scenario of scenarios) {
    assert.equal(scenario.model.screen.astrologerView.available, true, scenario.id);
    assert.ok(scenario.model.screen.astrologerView.text, scenario.id);
  }

  assert.match(r2ComponentSource, /screen\.astrologerView\.available/u);
  assert.match(r2ComponentSource, /data-weekly-r2-disclosure="astrologer"/u);
});

test('R2 reader copy does not expose fixture, Signal, rule, or provenance identifiers', () => {
  for (const scenario of scenarios) {
    for (const copy of readerCopy(scenario.model)) {
      assert.doesNotMatch(
        copy,
        /fixture:|fixture\/\/|weekly-poc\.|signal\.|rule\.|provenance|DEVELOPMENT_FIXTURE|SCENARIO_[A-Z_]+/u
      );
    }
  }
});

test('R2 has no Type C pseudo-data or presentation-mode switch', () => {
  assert.match(r2ComponentSource, /data-celestial-layer="B1"/u);
  assert.doesNotMatch(
    r2ComponentSource,
    /\b(?:fake|pseudo-data|random zodiac|random planet|fake Moon|fake transit|fake aspect)\b/iu
  );
  assert.doesNotMatch(r2ComponentSource, /AVAILABLE_STYLES|data-weekly-style|experiencePreference|Observatory|Starlight/u);
  assert.doesNotMatch(r2RouteSource, /style=|experiencePreference|Observatory|Starlight/u);
});

test('R2 route is development-only, unindexed, and not exposed through normal navigation', () => {
  assert.match(r2RouteSource, /import\.meta\.env\.DEV/u);
  assert.match(r2RouteSource, /NATALNODE_LOCAL_DEV_PREVIEW/u);
  assert.match(r2RouteSource, /robots: 'noindex,nofollow'/u);
  assert.doesNotMatch(r2RouteSource, /href=/u);
});

test('R2 is deterministic for the same model inputs and keeps the V1 scenario order', () => {
  assert.deepEqual(createWeeklyReadingR2Scenarios(), createWeeklyReadingR2Scenarios());
  assert.equal(byId(SCENARIO_B).model.screen.readingOrder[0], 'HERO');
  assert.equal(byId(SCENARIO_C).model.screen.readingOrder.includes('WATCH_OUT'), true);
});

test('R2 preserves accessible structure, stacked Timeline semantics, and reduced-motion support', () => {
  assert.match(r2ComponentSource, /<article/u);
  assert.match(r2ComponentSource, /<h1/u);
  assert.match(r2ComponentSource, /<details/u);
  assert.match(r2ComponentSource, /<summary/u);
  assert.match(r2ComponentSource, /aria-hidden="true"/u);
  assert.match(r2StyleSource, /focus-visible/u);
  assert.doesNotMatch(r2StyleSource, /overflow-x-(?:auto|scroll)/u);
  assert.match(r2StyleSource, /prefers-reduced-motion/u);
  assert.match(r2StyleSource, /data-timing-category/u);
});
