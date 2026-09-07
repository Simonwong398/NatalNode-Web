/**
 * Development-only reader projection for the relational My Chart POC.
 *
 * The projection consumes the bounded shared-root synthesis result and keeps
 * its research/authority boundary in the technical inspection. It does not
 * create ChartFacts, calculate astronomy, or change the accepted My Chart
 * contextual-learn POC.
 */

import {
  getFoundationsContentAvailability,
  getFoundationsContentVariant,
  getFoundationsLessonById,
  type FoundationsLessonId
} from '../learn/foundations/registry.js';
import {
  createAspectSignalResearchInput,
  createSharedRootPlacementSignal,
  synthesizeSharedRootRelationalSignals,
  type AspectSignalPolicyRuleRecord,
  type SharedRootAspectSignalInput,
  type SharedRootRelationalPersonalTheme,
  type SharedRootRelationalSynthesisResult
} from '../interpretation/shared-root-relational-synthesis-poc.js';
import type {
  CompositionSignalPolicyRuleRecord
} from '../interpretation/composition-signal-personal-synthesis-poc.js';
import type {
  PersonalSynthesisPersonalTheme,
  PersonalSynthesisStructuredSignalInput
} from '../interpretation/personal-synthesis-poc.js';

export const MY_CHART_RELATIONAL_SCENARIOS = Object.freeze([
  'relational-known-time',
  'placement-only',
  'unknown-time'
] as const);

export type MyChartRelationalScenario =
  (typeof MY_CHART_RELATIONAL_SCENARIOS)[number];

export type MyChartRelationalLearnBridge = Readonly<{
  objectId: string;
  label: string;
  lessonId: FoundationsLessonId | null;
  title: string | null;
  slug: string | null;
  description: string;
  contentAvailability: 'AVAILABLE' | 'UNAVAILABLE';
}>;

export type MyChartRelationalWhyFactor = Readonly<{
  label: string;
  contribution: string;
}>;

export type MyChartRelationalThemeTechnical = Readonly<{
  classification: string;
  sourcePlacementSignalIds: readonly string[];
  sourceAspectSignalId: string | null;
  sourceSemanticUnitIds: readonly string[];
  semanticUnitCount: number;
  uniqueRootKeys: readonly string[];
  uniqueRootCount: number;
  compatibilityRule: string | null;
  subsumedThemeIds: readonly string[];
  direction: string;
  intensity: string;
  confidence: string;
  authorityState: string;
  birthTimeState: string;
  orbBoundary: string;
  placementProvenance: readonly string[];
  aspectProvenance: readonly string[];
}>;

export type MyChartRelationalReaderTheme = Readonly<{
  themeId: string;
  title: string;
  domain: string;
  directionLabel: string;
  evidence: readonly string[];
  recognition: string;
  constructiveCapacity: string;
  pattern: string;
  tension: string;
  lever: string;
  why: Readonly<{
    summary: string;
    factors: readonly MyChartRelationalWhyFactor[];
    synthesis: string;
  }>;
  learn: readonly MyChartRelationalLearnBridge[];
  technical: MyChartRelationalThemeTechnical;
}>;

export type MyChartRelationalProjection = Readonly<{
  authority: 'DEVELOPMENT_ONLY';
  scenario: MyChartRelationalScenario;
  fixture: Readonly<{
    scenarioId: string;
    title: string;
    purpose: string;
    birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  }>;
  developmentDisclosure: Readonly<{
    label: 'DEVELOPMENT ONLY / RESEARCH PREVIEW';
    evidence: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY';
  }>;
  reading: Readonly<{
    hook: string;
    introduction: string;
    themes: readonly MyChartRelationalReaderTheme[];
  }>;
  unknownTime: Readonly<{
    presentationStatus: 'KNOWN_TIME_READING' | 'UNKNOWN_TIME_READING';
    message: string | null;
    omittedLayers: readonly string[];
  }>;
  technical: Readonly<{
    classification: string;
    evaluatedSignalCount: number;
    semanticUnitCount: number;
    uniqueRootCount: number;
    uniqueRootKeys: readonly string[];
    sourceSemanticUnitIds: readonly string[];
    sourcePlacementSignalIds: readonly string[];
    sourceAspectSignalId: string | null;
    compatibilityRule: string | null;
    subsumedThemeIds: readonly string[];
    sourceAuthority: 'INCOMPLETE_RESEARCH';
    synthesisAuthority: 'DEVELOPMENT_ONLY';
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED';
    birthTimeState: string;
  }>;
}>;

type RelationalScenarioDefinition = Readonly<{
  scenarioId: string;
  title: string;
  purpose: string;
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  placementCompositionIds: readonly string[];
  aspectCompositionIds: readonly string[];
}>;

const SCENARIOS: Readonly<Record<MyChartRelationalScenario, RelationalScenarioDefinition>> = Object.freeze({
  'relational-known-time': Object.freeze({
    scenarioId: 'MY_CHART_RELATIONAL_KNOWN_TIME_RESEARCH_PREVIEW',
    title: 'Relational research preview: Moon in Aries, Mercury in Aries, and conjunction',
    purpose: 'One reader-facing PersonalTheme is derived from two placement Signals and one relational Signal.',
    birthTimeAuthority: 'KNOWN',
    placementCompositionIds: Object.freeze([
      'body.moon_x_sign.aries',
      'body.mercury_x_sign.aries'
    ]),
    aspectCompositionIds: Object.freeze([
      'body.moon_x_aspect.conjunction_x_body.mercury'
    ])
  }),
  'placement-only': Object.freeze({
    scenarioId: 'MY_CHART_RELATIONAL_PLACEMENT_ONLY_COMPARISON',
    title: 'Placement-only comparison: Moon in Aries and Mercury in Aries',
    purpose: 'The same two placement Signals are rendered without a relational Signal for owner comparison.',
    birthTimeAuthority: 'KNOWN',
    placementCompositionIds: Object.freeze([
      'body.moon_x_sign.aries',
      'body.mercury_x_sign.aries'
    ]),
    aspectCompositionIds: Object.freeze([])
  }),
  'unknown-time': Object.freeze({
    scenarioId: 'MY_CHART_RELATIONAL_UNKNOWN_TIME_RESEARCH_PREVIEW',
    title: 'Unknown-time reading: Moon in Taurus and Mercury in Aries',
    purpose: 'Coherent placement Signals remain useful without angles, houses, or a fabricated time.',
    birthTimeAuthority: 'UNKNOWN',
    placementCompositionIds: Object.freeze([
      'body.moon_x_sign.taurus',
      'body.mercury_x_sign.aries'
    ]),
    aspectCompositionIds: Object.freeze([])
  })
});

const DOMAIN_LABELS: Readonly<Record<PersonalSynthesisPersonalTheme['domain'], string>> = Object.freeze({
  SELF: 'Self direction',
  EMOTIONAL: 'Emotional patterns',
  RELATIONSHIP: 'Relationships',
  COMMUNICATION: 'Communication',
  WORK_CREATION: 'Work and creation',
  ACTION_DECISION: 'Action and decisions'
});

const DIRECTION_LABELS: Readonly<Record<PersonalSynthesisPersonalTheme['direction'], string>> = Object.freeze({
  SUPPORTIVE: 'A supportive pattern',
  CHALLENGING: 'A challenging edge',
  MIXED: 'A meaningful tension',
  NEUTRAL: 'An open question'
});

const THEME_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'moon-aries-response-initiation': 'A response that can begin without rushing itself',
  'mercury-aries-information-initiation': 'A first formulation that can stay open'
});

const BODY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'body.moon': 'Moon',
  'body.mercury': 'Mercury'
});

const SIGN_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'sign.aries': 'Aries',
  'sign.taurus': 'Taurus'
});

const BODY_READER_SEMANTICS: Readonly<Record<string, string>> = Object.freeze({
  'body.moon': 'recurring response, receptivity, and need',
  'body.mercury': 'naming, interpretation, and exchange'
});

const SIGN_READER_SEMANTICS: Readonly<Record<string, string>> = Object.freeze({
  'sign.aries': 'initiation, immediacy, and a first move',
  'sign.taurus': 'steadiness, embodiment, and lasting value'
});

const ASPECT_READER_SEMANTICS: Readonly<Record<string, string>> = Object.freeze({
  conjunction: 'close coupling and concentration',
  trine: 'easier circulation and compatibility',
  square: 'productive friction that asks for adjustment',
  opposition: 'a visible polarity that asks for balance'
});

const FOUNDATIONS_LESSON_BY_OBJECT_ID: Readonly<Record<string, FoundationsLessonId>> = Object.freeze({
  'body.moon': 'foundations.sun_moon',
  'body.mercury': 'foundations.mercury_venus_mars',
  'sign.aries': 'foundations.zodiac_structure',
  'sign.taurus': 'foundations.zodiac_structure',
  'aspect.conjunction': 'foundations.aspects'
});

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function labelForBody(bodyId: string): string {
  return BODY_LABELS[bodyId] ?? bodyId;
}

function labelForSign(signId: string): string {
  return SIGN_LABELS[signId] ?? signId;
}

function bodySemantics(bodyId: string): string {
  return BODY_READER_SEMANTICS[bodyId] ?? 'a chart function';
}

function signSemantics(signId: string): string {
  return SIGN_READER_SEMANTICS[signId] ?? 'operating conditions';
}

function learnBridge(reference: {
  readonly objectId: string;
  readonly label: string;
  readonly sourcePath: string;
}): MyChartRelationalLearnBridge {
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
    contentAvailability: getFoundationsContentAvailability(content)
  });
}

function learnBridges(
  references: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[]
): readonly MyChartRelationalLearnBridge[] {
  const seenDestinations = new Set<string>();
  const bridges: MyChartRelationalLearnBridge[] = [];
  for (const reference of references) {
    if (FOUNDATIONS_LESSON_BY_OBJECT_ID[reference.objectId] === undefined) {
      continue;
    }
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

function placementSignalsFromResult(
  result: SharedRootRelationalSynthesisResult
): readonly PersonalSynthesisStructuredSignalInput[] {
  return freezeArray(result.eligibleSignals.filter(
    (signal): signal is PersonalSynthesisStructuredSignalInput => !('aspectScope' in signal)
  ));
}

function aspectSignalFromResult(
  result: SharedRootRelationalSynthesisResult
): SharedRootAspectSignalInput | null {
  return result.eligibleSignals.find(
    (signal): signal is SharedRootAspectSignalInput => 'aspectScope' in signal
  ) ?? null;
}

function sourceEvidenceLabels(
  placements: readonly PersonalSynthesisStructuredSignalInput[],
  aspect: SharedRootAspectSignalInput | null
): readonly string[] {
  const labels = placements.map((signal) =>
    `${labelForBody(signal.bodyId)} in ${labelForSign(signal.signId)}`
  );
  if (aspect !== null) {
    labels.push(`${labelForBody(aspect.bodyAId)} conjunct ${labelForBody(aspect.bodyBId)}`);
  }
  return freezeArray(labels);
}

function placementLearnReferences(
  placements: readonly PersonalSynthesisStructuredSignalInput[]
): readonly {
  readonly objectId: string;
  readonly label: string;
  readonly sourcePath: string;
}[] {
  return placements.flatMap((signal) => signal.learnReferences);
}

function allLearnReferences(
  placements: readonly PersonalSynthesisStructuredSignalInput[],
  aspect: SharedRootAspectSignalInput | null
): readonly {
  readonly objectId: string;
  readonly label: string;
  readonly sourcePath: string;
}[] {
  return [
    ...placementLearnReferences(placements),
    ...(aspect?.learnReferences ?? [])
  ];
}

function whyForPlacementTheme(
  theme: PersonalSynthesisPersonalTheme
): MyChartRelationalReaderTheme['why'] {
  return Object.freeze({
    summary: theme.editorial.why.reader.summary,
    factors: freezeArray(theme.editorial.why.reader.factors.map((factor) => Object.freeze({ ...factor }))),
    synthesis: theme.editorial.why.reader.synthesis
  });
}

function whyForRelationalTheme(
  placements: readonly PersonalSynthesisStructuredSignalInput[],
  aspect: SharedRootAspectSignalInput
): MyChartRelationalReaderTheme['why'] {
  const moon = placements.find((signal) => signal.bodyId === 'body.moon');
  const mercury = placements.find((signal) => signal.bodyId === 'body.mercury');
  if (moon === undefined || mercury === undefined) {
    throw new Error('Relational reader WHY requires Moon and Mercury placement Signals.');
  }
  const moonLabel = `${labelForBody(moon.bodyId)} in ${labelForSign(moon.signId)}`;
  const mercuryLabel = `${labelForBody(mercury.bodyId)} in ${labelForSign(mercury.signId)}`;
  const aspectLabel = `${labelForBody(aspect.bodyAId)} conjunct ${labelForBody(aspect.bodyBId)}`;
  const aspectSemantics = ASPECT_READER_SEMANTICS[aspect.aspectType] ?? 'a relationship between the two functions';

  return Object.freeze({
    summary: `${moonLabel}, ${mercuryLabel}, and ${aspectLabel} are read together here.`,
    factors: freezeArray([
      Object.freeze({
        label: moonLabel,
        contribution: `${labelForBody(moon.bodyId)} brings ${bodySemantics(moon.bodyId)}; ${labelForSign(moon.signId)} gives that experience conditions of ${signSemantics(moon.signId)}.`
      }),
      Object.freeze({
        label: mercuryLabel,
        contribution: `${labelForBody(mercury.bodyId)} brings ${bodySemantics(mercury.bodyId)}; ${labelForSign(mercury.signId)} gives that work conditions of ${signSemantics(mercury.signId)}.`
      }),
      Object.freeze({
        label: aspectLabel,
        contribution: `${aspectLabel} brings ${aspectSemantics}, so response and naming can arrive close together.`
      })
    ]),
    synthesis: `${moonLabel} brings a response into ${signSemantics(moon.signId)}. ${mercuryLabel} brings naming and interpretation into that same immediate field. ${aspectLabel} adds ${aspectSemantics}. Together, the pattern describes how an experience can become words quickly, and why the first explanation may deserve one more pass before it becomes final.`
  });
}

function placementTechnical(
  theme: PersonalSynthesisPersonalTheme,
  signal: PersonalSynthesisStructuredSignalInput,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): MyChartRelationalThemeTechnical {
  return Object.freeze({
    classification: 'NO_RELATIONAL_ENRICHMENT',
    sourcePlacementSignalIds: freezeArray([signal.signalId]),
    sourceAspectSignalId: null,
    sourceSemanticUnitIds: freezeArray([`semantic-unit.${signal.placementEvidenceKey}`]),
    semanticUnitCount: 1,
    uniqueRootKeys: freezeArray([`${signal.bodyId}.position`]),
    uniqueRootCount: 1,
    compatibilityRule: null,
    subsumedThemeIds: freezeArray([]),
    direction: signal.direction,
    intensity: signal.intensity,
    confidence: signal.confidence,
    authorityState: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY',
    birthTimeState: birthTimeAuthority === 'UNKNOWN'
      ? 'UNKNOWN_TIME_SAFE placement; no angle, house, or fabricated-time dependency.'
      : theme.authorityRequirements.birthTimeDependency,
    orbBoundary: 'No Aspect relation is present in this comparison.',
    placementProvenance: freezeArray(theme.editorial.why.sourceChartFacts.map((reference) => reference.canonicalPath)),
    aspectProvenance: freezeArray([])
  });
}

function projectPlacementTheme(
  theme: PersonalSynthesisPersonalTheme,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): MyChartRelationalReaderTheme {
  const signal = theme.representativeSignalTraces?.[0];
  if (signal === undefined) {
    throw new Error(`Placement theme ${theme.themeId} has no representative Signal.`);
  }
  return Object.freeze({
    themeId: theme.themeId,
    title: THEME_TITLES[theme.semanticThemeKey] ?? 'A supported personal theme',
    domain: DOMAIN_LABELS[theme.domain],
    directionLabel: DIRECTION_LABELS[theme.direction],
    evidence: sourceEvidenceLabels([signal], null),
    recognition: theme.editorial.recognition,
    constructiveCapacity: theme.editorial.strength,
    pattern: theme.editorial.pattern,
    tension: theme.editorial.tension,
    lever: theme.editorial.lever,
    why: whyForPlacementTheme(theme),
    learn: learnBridges(signal.learnReferences),
    technical: placementTechnical(theme, signal, birthTimeAuthority)
  });
}

function relationalTechnical(
  theme: SharedRootRelationalPersonalTheme,
  aspect: SharedRootAspectSignalInput,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): MyChartRelationalThemeTechnical {
  return Object.freeze({
    classification: 'RELATIONAL_ENRICHMENT',
    sourcePlacementSignalIds: theme.sourcePlacementSignalIds,
    sourceAspectSignalId: theme.sourceAspectSignalId,
    sourceSemanticUnitIds: theme.sourceSemanticUnitIds,
    semanticUnitCount: theme.semanticUnitCount,
    uniqueRootKeys: theme.uniqueRootKeys,
    uniqueRootCount: theme.uniqueRootCount,
    compatibilityRule: `${theme.compatibilityRule.id}@${theme.compatibilityRule.version}`,
    subsumedThemeIds: theme.subsumedThemeIds,
    direction: theme.direction,
    intensity: theme.intensity,
    confidence: theme.confidence,
    authorityState: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY',
    birthTimeState: birthTimeAuthority === 'KNOWN'
      ? 'Known-time synthesis scope; no timestamp or astronomy was calculated.'
      : 'Aspect relation is suppressed without authoritative unknown-time certification.',
    orbBoundary: `No numeric orb is supplied or used. ${aspect.aspectType} remains subject to an admitted upstream orb policy.`,
    placementProvenance: freezeArray(theme.provenance.placementChains.map((chain) =>
      `${chain.signalId} → ${chain.placementEvidenceKey} → ${chain.evidenceRootKey}`
    )),
    aspectProvenance: freezeArray([
      `${theme.provenance.aspectChain.signalId} → ${theme.provenance.aspectChain.relationalFactId}`,
      ...theme.provenance.aspectChain.evidenceRootKeys
    ])
  });
}

function projectRelationalTheme(
  result: SharedRootRelationalSynthesisResult,
  theme: SharedRootRelationalPersonalTheme,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): MyChartRelationalReaderTheme {
  const placements = placementSignalsFromResult(result);
  const aspect = aspectSignalFromResult(result);
  if (aspect === null) {
    throw new Error('Relational theme projection requires an eligible Aspect Signal.');
  }
  return Object.freeze({
    themeId: theme.themeId,
    title: 'When response and naming arrive together',
    domain: DOMAIN_LABELS[theme.domain],
    directionLabel: DIRECTION_LABELS[theme.direction],
    evidence: sourceEvidenceLabels(placements, aspect),
    recognition: theme.editorial.recognition,
    constructiveCapacity: theme.editorial.strength,
    pattern: theme.editorial.pattern,
    tension: theme.editorial.tension,
    lever: theme.editorial.lever,
    why: whyForRelationalTheme(placements, aspect),
    learn: learnBridges(allLearnReferences(placements, aspect)),
    technical: relationalTechnical(theme, aspect, birthTimeAuthority)
  });
}

function rulesForScenario<T extends { readonly compositionId: string }>(
  compositionIds: readonly string[],
  rules: readonly T[],
  label: string
): readonly T[] {
  const rulesByCompositionId = new Map(
    rules.map((rule) => [rule.compositionId, rule] as const)
  );
  return freezeArray(compositionIds.map((compositionId) => {
    const rule = rulesByCompositionId.get(compositionId);
    if (rule === undefined) {
      throw new Error(`Missing ${label} rule ${compositionId}.`);
    }
    return rule;
  }));
}

function resultTechnical(
  result: SharedRootRelationalSynthesisResult,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): MyChartRelationalProjection['technical'] {
  const aspect = aspectSignalFromResult(result);
  const enriched = result.synthesis.enrichedThemes[0];
  return Object.freeze({
    classification: result.classification,
    evaluatedSignalCount: result.eligibleSignals.length,
    semanticUnitCount: result.accounting.semanticUnitCount,
    uniqueRootCount: result.accounting.uniqueRootCount,
    uniqueRootKeys: result.accounting.uniqueRootKeys,
    sourceSemanticUnitIds: result.accounting.semanticUnitIds,
    sourcePlacementSignalIds: result.placementSignals
      .filter((signal) => result.eligibleSignals.some((eligible) => eligible.signalId === signal.signalId))
      .map((signal) => signal.signalId),
    sourceAspectSignalId: aspect?.signalId ?? null,
    compatibilityRule: enriched === undefined
      ? null
      : `${enriched.compatibilityRule.id}@${enriched.compatibilityRule.version}`,
    subsumedThemeIds: enriched?.subsumedThemeIds ?? freezeArray([]),
    sourceAuthority: 'INCOMPLETE_RESEARCH',
    synthesisAuthority: 'DEVELOPMENT_ONLY',
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED',
    birthTimeState: birthTimeAuthority === 'UNKNOWN'
      ? 'Unknown-time placement-only reading; no Aspect, ASC, MC, houses, or fabricated time.'
      : 'Known-time research scope flag only; no astronomy calculation was performed.'
  });
}

export function projectMyChartRelationalContent(
  scenario: MyChartRelationalScenario,
  placementRules: readonly CompositionSignalPolicyRuleRecord[],
  aspectRules: readonly AspectSignalPolicyRuleRecord[]
): MyChartRelationalProjection {
  const definition = SCENARIOS[scenario];
  if (definition === undefined) {
    throw new Error(`Unknown relational My Chart scenario ${scenario}.`);
  }
  const selectedPlacementRules = rulesForScenario(
    definition.placementCompositionIds,
    placementRules,
    'placement Signal'
  );
  const selectedAspectRules = rulesForScenario(
    definition.aspectCompositionIds,
    aspectRules,
    'Aspect Signal'
  );
  const placementSignals = selectedPlacementRules.map(createSharedRootPlacementSignal);
  const aspectSignals = selectedAspectRules.map(createAspectSignalResearchInput);
  const result = synthesizeSharedRootRelationalSignals(
    [...placementSignals, ...aspectSignals],
    { birthTimeAuthority: definition.birthTimeAuthority }
  );
  if (result.coherence.status !== 'COHERENT') {
    throw new Error(`Relational My Chart research preview is not coherent: ${result.coherence.failures[0]?.code ?? 'UNKNOWN'}.`);
  }

  const themes = result.classification === 'RELATIONAL_ENRICHMENT'
    ? result.synthesis.enrichedThemes.map((theme) => projectRelationalTheme(
        result,
        theme,
        definition.birthTimeAuthority
      ))
    : result.synthesis.outputThemes.map((theme) => projectPlacementTheme(
        theme as PersonalSynthesisPersonalTheme,
        definition.birthTimeAuthority
      ));

  return Object.freeze({
    authority: 'DEVELOPMENT_ONLY',
    scenario,
    fixture: Object.freeze({
      scenarioId: definition.scenarioId,
      title: definition.title,
      purpose: definition.purpose,
      birthTimeAuthority: definition.birthTimeAuthority
    }),
    developmentDisclosure: Object.freeze({
      label: 'DEVELOPMENT ONLY / RESEARCH PREVIEW',
      evidence: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY'
    }),
    reading: Object.freeze({
      hook: scenario === 'relational-known-time'
        ? 'When response becomes language.'
        : scenario === 'unknown-time'
          ? 'What remains in view.'
          : 'Two patterns worth noticing.',
      introduction: scenario === 'relational-known-time'
        ? 'A response and the words that explain it may arrive close together. This reading follows what that creates in practice.'
        : scenario === 'unknown-time'
          ? 'Without a precise birth time, Moon and Mercury placements still offer useful patterns to notice without adding time-sensitive layers.'
          : 'Read these two placement-level patterns side by side, then compare what changes when their relationship is included.',
      themes: freezeArray(themes)
    }),
    unknownTime: Object.freeze({
      presentationStatus: definition.birthTimeAuthority === 'UNKNOWN'
        ? 'UNKNOWN_TIME_READING'
        : 'KNOWN_TIME_READING',
      message: definition.birthTimeAuthority === 'UNKNOWN'
        ? 'Some time-sensitive chart layers are unavailable. The reading below stays with placements that remain useful without a precise birth time.'
        : null,
      omittedLayers: definition.birthTimeAuthority === 'UNKNOWN'
        ? freezeArray(['ASC', 'MC', 'houses', 'fabricated time', 'Aspect enrichment'])
        : freezeArray([])
    }),
    technical: resultTechnical(result, definition.birthTimeAuthority)
  });
}
