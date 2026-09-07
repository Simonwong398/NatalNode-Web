import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  projectMyChartPersonalContent
} from '../dist/my-chart-contextual-learn-characterization/features/my-chart/my-chart-personal-content-poc.js';

const projectionSource = readFileSync(
  new URL('../src/features/my-chart/my-chart-personal-content-poc.ts', import.meta.url),
  'utf8'
);
const componentSource = readFileSync(
  new URL('../src/features/my-chart/MyChartContextualLearnStageA.tsx', import.meta.url),
  'utf8'
);
const routeSource = readFileSync(
  new URL('../src/pages/dev/my-chart-contextual-learn.astro', import.meta.url),
  'utf8'
);
const styleSource = readFileSync(
  new URL('../src/styles/my-chart-contextual-learn.css', import.meta.url),
  'utf8'
);

function themeById(projection, themeId) {
  return projection.reading.themes.find((theme) => theme.themeId === themeId);
}

test('known-time page model renders selected deterministic themes instead of a primitive dump', () => {
  const projection = projectMyChartPersonalContent('known-time');
  const evidenceCount = projection.reading.themes.reduce(
    (count, theme) => count + theme.evidence.length,
    0
  );

  assert.equal(projection.authority, 'DEVELOPMENT_ONLY');
  assert.equal(projection.fixture.scenarioId, 'CASE_B_MEANINGFUL_TENSION');
  assert.ok(projection.reading.themes.length >= 3);
  assert.ok(projection.reading.themes.length <= 5);
  assert.ok(evidenceCount > projection.reading.themes.length);
  assert.ok(themeById(projection, 'personal-theme.deliberate-action'));
  assert.ok(themeById(projection, 'personal-theme.relationship-boundary'));
  assert.ok(themeById(projection, 'personal-theme.emotional-pacing'));
  assert.match(projection.reading.hook, /pattern first/u);
  assert.doesNotMatch(JSON.stringify(projection.reading.themes), /\d+%/u);
});

test('known-time page preserves convergence, mixed tension, and constructive asymmetry', () => {
  const projection = projectMyChartPersonalContent('known-time');
  const actionTheme = themeById(projection, 'personal-theme.deliberate-action');

  assert.ok(actionTheme);
  assert.equal(actionTheme.directionLabel, 'A meaningful tension');
  assert.equal(actionTheme.evidence.length, 2);
  assert.match(actionTheme.why.convergence, /distinct paths/u);
  assert.match(actionTheme.why.tension, /challenging directions/u);
  assert.match(actionTheme.tension, /Momentum/u);
  assert.match(actionTheme.lever, /reversible step/u);
  assert.deepEqual(
    actionTheme.evidence.map((evidence) => evidence.label),
    ['Fixed modality layer', 'Aries sign layer']
  );
});

test('unknown-time page remains useful while excluding time-dependent layers from core content', () => {
  const projection = projectMyChartPersonalContent('unknown-time');
  const reading = JSON.stringify(projection.reading.themes.map((theme) => ({
    title: theme.title,
    domain: theme.domain,
    directionLabel: theme.directionLabel,
    recognition: theme.recognition,
    strength: theme.strength,
    pattern: theme.pattern,
    tension: theme.tension,
    lever: theme.lever,
    evidence: theme.evidence
  })));

  assert.equal(projection.fixture.scenarioId, 'CASE_D_UNKNOWN_BIRTH_TIME');
  assert.equal(projection.fixture.birthTimeAuthority, 'UNKNOWN');
  assert.equal(projection.reading.themes.length, 2);
  assert.equal(projection.unknownTime.presentationStatus, 'UNKNOWN_TIME_READING');
  assert.match(projection.unknownTime.message, /time-sensitive chart layers are unavailable/u);
  assert.ok(projection.unknownTime.omittedLayers.includes('houses'));
  assert.ok(projection.technical.skippedRuleCount > 0);
  assert.doesNotMatch(reading, /ASC|MC|house/iu);
  assert.match(JSON.stringify(projection.reading.themes), /placement-level evidence/u);
});

test('every theme has inspectable WHY evidence and contextual Learn references', () => {
  const projection = projectMyChartPersonalContent('known-time');

  for (const theme of projection.reading.themes) {
    assert.ok(theme.title.length > 0);
    assert.ok(theme.recognition.length > 0);
    assert.ok(theme.strength.length > 0);
    assert.ok(theme.pattern.length > 0);
    assert.ok(theme.tension.length > 0);
    assert.ok(theme.lever.length > 0);
    assert.ok(theme.evidence.length > 0);
    assert.ok(theme.why.summary.length > 0);
    assert.ok(theme.why.sourceFactRefs.length > 0);
    assert.ok(theme.why.compositionRuleRefs.length > 0);
    assert.ok(theme.why.semanticBasisIds.length > 0);
    assert.ok(theme.learn.length > 0);

    for (const bridge of theme.learn) {
      assert.ok(bridge.lessonId);
      assert.ok(bridge.slug);
      assert.ok(bridge.title);
      assert.ok(bridge.hookId);
      assert.equal(bridge.contentAvailability, 'AVAILABLE');
    }
  }
});

test('projection output is stable across repeated runs and retains no internal scores in reader content', () => {
  const first = projectMyChartPersonalContent('known-time');
  const second = projectMyChartPersonalContent('known-time');

  assert.deepEqual(first, second);
  assert.doesNotMatch(JSON.stringify(first.reading), /internalStrength|baseImportance|ranking|confidence/iu);
  assert.doesNotMatch(JSON.stringify(first.reading), /\d+%/u);
});

test('the component renders the deterministic theme model with progressive WHY and Learn disclosure', () => {
  assert.match(componentSource, /projectMyChartPersonalContent/u);
  assert.match(componentSource, /projection\.reading\.themes\.map/u);
  assert.match(componentSource, /data-core-personal-themes/u);
  assert.match(componentSource, /data-personal-theme/u);
  assert.match(componentSource, /Recognition/u);
  assert.match(componentSource, /Strength/u);
  assert.match(componentSource, /Pattern/u);
  assert.match(componentSource, /Tension/u);
  assert.match(componentSource, /Lever/u);
  assert.match(componentSource, /data-theme-why/u);
  assert.match(componentSource, /data-theme-learn/u);
  assert.match(componentSource, /Astrologer \/ technical depth/u);
  assert.doesNotMatch(componentSource, /bodies\.map|facts\.map|one supplied placement/iu);
  assert.doesNotMatch(componentSource, /Math\.random|Date\.now|fetch\(|axios|openai|llm/iu);
  assert.doesNotMatch(componentSource, /\d+%/u);
});

test('dev route remains isolated and supports both known-time and unknown-time fixtures', () => {
  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /import\.meta\.env\.MODE\s*===\s*'local-integration'/u);
  assert.match(routeSource, /NATALNODE_LOCAL_DEV_PREVIEW/u);
  assert.match(routeSource, /robots: 'noindex,nofollow'/u);
  assert.match(routeSource, /scenario/u);
  assert.doesNotMatch(routeSource, /getEducationalChart|HttpEngineClient|fetch\(|axios|ENGINE_API_URL|Provider/iu);
  assert.doesNotMatch(projectionSource, /HttpEngineClient|fetch\(|axios|openai|llm/iu);
  assert.match(projectionSource, /DEVELOPMENT_ONLY/u);
  assert.match(projectionSource, /RUNTIME_NOT_ADMITTED/u);
});

test('visual baseline keeps accessible progressive disclosure and mobile-safe behavior', () => {
  assert.match(styleSource, /focus-visible/u);
  assert.match(styleSource, /prefers-reduced-motion/u);
  assert.match(styleSource, /theme-details/u);
  assert.match(styleSource, /theme-learn/u);
  assert.doesNotMatch(styleSource, /overflow-x\s*:\s*(?:auto|scroll)/u);
});
