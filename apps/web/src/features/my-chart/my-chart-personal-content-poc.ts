/**
 * Development-only presentation projection for the bounded My Chart content
 * POC. It adapts the accepted deterministic Personal Synthesis result into a
 * reader-first model without changing the production ChartResult, Engine, or
 * astronomy boundaries.
 */

import {
  getFoundationsContentAvailability,
  getFoundationsContentVariant,
  getFoundationsLessonById,
  type FoundationsLessonId
} from '../learn/foundations/registry.js';
import {
  getPersonalSynthesisPocFixture,
  synthesizePersonalThemes,
  type PersonalSynthesisFixture,
  type PersonalSynthesisLearnReference,
  type PersonalSynthesisPersonalTheme,
  type PersonalSynthesisResult
} from '../interpretation/personal-synthesis-poc.js';

export const MY_CHART_PERSONAL_CONTENT_SCENARIOS = Object.freeze([
  'known-time',
  'unknown-time'
] as const);

export type MyChartPersonalContentScenario =
  (typeof MY_CHART_PERSONAL_CONTENT_SCENARIOS)[number];

export type MyChartPersonalContentEvidence = Readonly<{
  label: string;
  semanticBasisLabel: string;
  factKind: string;
  canonicalPath: string;
}>;

export type MyChartPersonalContentLearnBridge = Readonly<{
  objectId: string;
  label: string;
  lessonId: FoundationsLessonId | null;
  title: string | null;
  slug: string | null;
  description: string;
  hookId: string | null;
  contentAvailability: 'AVAILABLE' | 'UNAVAILABLE';
}>;

export type MyChartPersonalContentWhyFactor = Readonly<{
  label: string;
  contribution: string;
}>;

export type MyChartPersonalContentThemeTechnical = Readonly<{
  convergence: string;
  tension: string;
  birthTime: string;
  selection: string;
  sourceFactRefs: readonly string[];
  compositionRuleRefs: readonly string[];
  semanticBasisIds: readonly string[];
  suppressedThemeKeys: readonly string[];
}>;

export type MyChartPersonalContentTheme = Readonly<{
  themeId: string;
  title: string;
  domain: string;
  directionLabel: string;
  recognition: string;
  strength: string;
  pattern: string;
  tension: string;
  lever: string;
  evidence: readonly MyChartPersonalContentEvidence[];
  why: Readonly<{
    summary: string;
    factors: readonly MyChartPersonalContentWhyFactor[];
    synthesis: string;
  }>;
  technical: MyChartPersonalContentThemeTechnical;
  learn: readonly MyChartPersonalContentLearnBridge[];
}>;

export type MyChartPersonalContentProjection = Readonly<{
  authority: 'DEVELOPMENT_ONLY';
  scenario: MyChartPersonalContentScenario;
  fixture: Readonly<{
    scenarioId: string;
    title: string;
    purpose: string;
    birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  }>;
  developmentDisclosure: Readonly<{
    label: 'DEVELOPMENT PERSONAL READING POC';
    evidence: 'FIXTURE-BACKED / DETERMINISTIC / NOT PRODUCTION AUTHORITY';
  }>;
  reading: Readonly<{
    hook: string;
    introduction: string;
    themes: readonly MyChartPersonalContentTheme[];
  }>;
  unknownTime: Readonly<{
    presentationStatus: 'KNOWN_TIME_READING' | 'UNKNOWN_TIME_READING';
    message: string | null;
    omittedLayers: readonly string[];
  }>;
  technical: Readonly<{
    evaluatedSignalCount: number;
    skippedRuleCount: number;
    mergedCandidateCount: number;
    suppressedCandidateCount: number;
    sourceAuthority: 'DEVELOPMENT_FIXTURE';
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED';
  }>;
}>;

const THEME_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'communication-clarity': 'Clear exchange, with room for response',
  'deliberate-action': 'Initiation and pacing',
  'relationship-boundary': 'Connection with clear boundaries',
  'work-continuity': 'Continuity that can keep evolving',
  'self-direction': 'A direction you can begin',
  'emotional-pacing': 'A responsive emotional rhythm'
});

const DOMAIN_LABELS: Readonly<Record<PersonalSynthesisPersonalTheme['domain'], string>> =
  Object.freeze({
    SELF: 'Self direction',
    EMOTIONAL: 'Emotional patterns',
    RELATIONSHIP: 'Relationships',
    COMMUNICATION: 'Communication',
    WORK_CREATION: 'Work and creation',
    ACTION_DECISION: 'Action and decisions'
  });

const DIRECTION_LABELS: Readonly<Record<PersonalSynthesisPersonalTheme['direction'], string>> =
  Object.freeze({
    SUPPORTIVE: 'A supportive pattern',
    CHALLENGING: 'A challenging edge',
    MIXED: 'A meaningful tension',
    NEUTRAL: 'An open question'
  });

const SEMANTIC_BASIS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'body.moon': 'Moon',
  'body.mercury': 'Mercury',
  'sign.aries': 'Aries',
  'modality.fixed': 'Fixed emphasis',
  'rulership.basic': 'Chart ruler'
});

const FOUNDATIONS_LESSON_BY_OBJECT_ID: Readonly<
  Record<string, FoundationsLessonId>
> = Object.freeze({
  'body.moon': 'foundations.sun_moon',
  'body.mercury': 'foundations.mercury_venus_mars',
  'sign.aries': 'foundations.zodiac_structure',
  'modality.fixed': 'foundations.zodiac_structure',
  'rulership.basic': 'foundations.chart_priorities'
});

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function referenceKey(reference: {
  readonly factKind: string;
  readonly canonicalPath: string;
  readonly canonicalFactIdentity?: string;
}): string {
  return `${reference.factKind}|${reference.canonicalFactIdentity ?? reference.canonicalPath}`;
}

function findFactLabel(
  fixture: PersonalSynthesisFixture,
  reference: MyChartPersonalContentEvidence['canonicalPath'],
  factKind: string
): string {
  const candidate = fixture.candidates.find((definition) =>
    referenceKey(definition.fact.reference) === `${factKind}|${reference}`
  );

  return candidate === undefined
    ? 'Chart factor'
    : SEMANTIC_BASIS_LABELS[candidate.semanticBasisId] ?? candidate.factLabel;
}

function learnBridge(
  reference: PersonalSynthesisLearnReference
): MyChartPersonalContentLearnBridge {
  const lessonId = FOUNDATIONS_LESSON_BY_OBJECT_ID[reference.objectId] ?? null;
  const lesson = lessonId === null ? null : getFoundationsLessonById(lessonId);
  const content = lesson === null
    ? null
    : getFoundationsContentVariant(lesson.lessonId, 'en');

  return Object.freeze({
    objectId: reference.objectId,
    label: reference.label,
    lessonId,
    title: lesson?.title ?? null,
    slug: lesson?.slug ?? null,
    description: lesson?.shortDescription
      ?? 'No admitted Foundations lesson is available for this concept.',
    hookId: lesson?.myChartHook.hookId ?? null,
    contentAvailability: getFoundationsContentAvailability(content)
  });
}

function learnBridges(
  references: readonly PersonalSynthesisLearnReference[]
): readonly MyChartPersonalContentLearnBridge[] {
  const seenDestinations = new Set<string>();
  const bridges: MyChartPersonalContentLearnBridge[] = [];
  for (const reference of references) {
    const bridge = learnBridge(reference);
    const destinationKey = bridge.lessonId ?? `object:${bridge.objectId}`;
    if (seenDestinations.has(destinationKey)) {
      continue;
    }
    seenDestinations.add(destinationKey);
    bridges.push(bridge);
  }
  return freezeArray(bridges);
}

function evidenceForTheme(
  fixture: PersonalSynthesisFixture,
  theme: PersonalSynthesisPersonalTheme
): readonly MyChartPersonalContentEvidence[] {
  const evidence = theme.evidenceRefs.map((reference) => Object.freeze({
    label: findFactLabel(fixture, reference.canonicalPath, reference.factKind),
    semanticBasisLabel: (() => {
      const candidate = fixture.candidates.find((definition) =>
        referenceKey(definition.fact.reference) === referenceKey(reference)
      );
      return candidate === undefined
        ? theme.semanticBasisIds
          .map((basisId) => SEMANTIC_BASIS_LABELS[basisId] ?? basisId)
          .join(' + ')
        : SEMANTIC_BASIS_LABELS[candidate.semanticBasisId] ?? candidate.semanticBasisId;
    })(),
    factKind: reference.factKind,
    canonicalPath: reference.canonicalPath
  }));

  return freezeArray(evidence);
}

function evidenceSummary(theme: PersonalSynthesisPersonalTheme): string {
  const count = theme.convergence.independentEvidenceKeys.length;
  if (theme.convergence.status === 'CONVERGENT' && count > 1) {
    return `Independent chart evidence converges here through ${count} distinct paths; repeated copies of one source are not counted again.`;
  }

  return 'This theme is grounded in one supplied evidence path; no convergence bonus is claimed.';
}

function tensionSummary(theme: PersonalSynthesisPersonalTheme): string {
  if (theme.direction === 'MIXED' || theme.editorial.why.tension.status === 'MIXED') {
    return 'Supportive and challenging directions stay together here, so the trade-off remains visible.';
  }

  return 'No mixed direction is claimed for this theme.';
}

function selectionSummary(
  theme: PersonalSynthesisPersonalTheme,
  result: PersonalSynthesisResult
): string {
  const suppressed = theme.redundancy.suppressedThemeKeys.length;
  if (suppressed > 0) {
    return 'This theme is shown once; overlapping alternatives were folded into the retained theme.';
  }

  const merged = result.candidateTrace.filter((trace) =>
    trace.semanticThemeKey === theme.semanticThemeKey &&
    (trace.decision === 'MERGED_CONVERGENCE' || trace.decision === 'MERGED_SAME_EVIDENCE')
  ).length;
  if (merged > 0) {
    return 'This theme is shown once; supporting candidates were merged into the same personal pattern.';
  }

  return 'This theme was selected as a distinct supported pattern within the five-theme limit.';
}

function birthTimeSummary(
  fixture: PersonalSynthesisFixture,
  theme: PersonalSynthesisPersonalTheme
): string {
  if (fixture.chartFacts.birthTimeAuthority === 'UNKNOWN') {
    return theme.authorityRequirements.birthTimeDependency === 'UNKNOWN_TIME_SAFE'
      ? 'This theme uses remaining placement-level evidence and does not require a known birth time.'
      : 'This theme would require a known birth time and is not shown.';
  }

  return theme.authorityRequirements.birthTimeDependency === 'REQUIRES_KNOWN'
    ? 'This theme depends on known-time evidence.'
    : 'This theme uses placement-level evidence in this known-time fixture.';
}

function projectTheme(
  fixture: PersonalSynthesisFixture,
  result: PersonalSynthesisResult,
  theme: PersonalSynthesisPersonalTheme
): MyChartPersonalContentTheme {
  const evidence = evidenceForTheme(fixture, theme);

  return Object.freeze({
    themeId: theme.themeId,
    title: THEME_TITLES[theme.semanticThemeKey] ?? 'A supported personal theme',
    domain: DOMAIN_LABELS[theme.domain],
    directionLabel: DIRECTION_LABELS[theme.direction],
    recognition: theme.editorial.recognition,
    strength: theme.editorial.strength,
    pattern: theme.editorial.pattern,
    tension: theme.editorial.tension,
    lever: theme.editorial.lever,
    evidence,
    why: Object.freeze({
      summary: theme.editorial.why.reader.summary,
      factors: freezeArray(theme.editorial.why.reader.factors),
      synthesis: theme.editorial.why.reader.synthesis
    }),
    technical: Object.freeze({
      convergence: evidenceSummary(theme),
      tension: tensionSummary(theme),
      birthTime: birthTimeSummary(fixture, theme),
      selection: selectionSummary(theme, result),
      sourceFactRefs: freezeArray(theme.editorial.why.sourceChartFacts.map((reference) =>
        reference.canonicalPath
      )),
      compositionRuleRefs: freezeArray(theme.editorial.why.compositionRuleRefs),
      semanticBasisIds: freezeArray(theme.editorial.why.semanticBasisIds),
      suppressedThemeKeys: freezeArray(theme.redundancy.suppressedThemeKeys)
    }),
    learn: learnBridges(theme.editorial.learnReferences)
  });
}

function fixtureForScenario(
  scenario: MyChartPersonalContentScenario
): PersonalSynthesisFixture {
  return getPersonalSynthesisPocFixture(
    scenario === 'unknown-time'
      ? 'CASE_D_UNKNOWN_BIRTH_TIME'
      : 'CASE_B_MEANINGFUL_TENSION'
  );
}

export function projectMyChartPersonalContent(
  scenario: MyChartPersonalContentScenario = 'known-time'
): MyChartPersonalContentProjection {
  const fixture = fixtureForScenario(scenario);
  const result = synthesizePersonalThemes(fixture);
  const themes = result.coreThemes.map((theme) => projectTheme(fixture, result, theme));
  const mergedCandidateCount = result.candidateTrace.filter((trace) =>
    trace.decision === 'MERGED_CONVERGENCE' || trace.decision === 'MERGED_SAME_EVIDENCE'
  ).length;
  const suppressedCandidateCount = result.candidateTrace.filter((trace) =>
    trace.decision === 'SUPPRESSED_REDUNDANCY'
  ).length;

  return Object.freeze({
    authority: 'DEVELOPMENT_ONLY',
    scenario,
    fixture: Object.freeze({
      scenarioId: fixture.scenarioId,
      title: fixture.title,
      purpose: fixture.purpose,
      birthTimeAuthority: fixture.chartFacts.birthTimeAuthority
    }),
    developmentDisclosure: Object.freeze({
      label: 'DEVELOPMENT PERSONAL READING POC',
      evidence: 'FIXTURE-BACKED / DETERMINISTIC / NOT PRODUCTION AUTHORITY'
    }),
    reading: Object.freeze({
      hook: 'A closer look at the patterns you bring to life.',
      introduction: scenario === 'unknown-time'
        ? 'With birth time unknown, this reading stays with the placements that remain clear: how you communicate and how your inner responses move.'
        : 'Your chart brings two themes into focus: the courage to begin, and the kind of connection that stays honest.',
      themes: freezeArray(themes)
    }),
    unknownTime: Object.freeze({
      presentationStatus: scenario === 'unknown-time'
        ? 'UNKNOWN_TIME_READING'
        : 'KNOWN_TIME_READING',
      message: scenario === 'unknown-time'
        ? 'Some time-sensitive chart layers are unavailable. The reading below stays with placements that remain usable without a known birth time.'
        : null,
      omittedLayers: scenario === 'unknown-time'
        ? freezeArray(['time-sensitive angles', 'houses', 'house-derived themes'])
        : freezeArray([])
    }),
    technical: Object.freeze({
      evaluatedSignalCount: result.evaluatedSignals.length,
      skippedRuleCount: result.skippedRules.length,
      mergedCandidateCount,
      suppressedCandidateCount,
      sourceAuthority: 'DEVELOPMENT_FIXTURE',
      semanticBasisStatus: 'RUNTIME_NOT_ADMITTED'
    })
  });
}
