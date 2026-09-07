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
  synthesizeCompositionSignalResearchInputs,
  type CompositionSignalPolicyRuleRecord
} from '../interpretation/composition-signal-personal-synthesis-poc.js';
import {
  type PersonalSynthesisLearnReference,
  type PersonalSynthesisPersonalTheme,
  type PersonalSynthesisStructuredResult,
  type PersonalSynthesisStructuredSignalInput
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
  signalIds: readonly string[];
  compositionIds: readonly string[];
  placementEvidenceKeys: readonly string[];
  domain: string;
  direction: string;
  intensity: string;
  confidence: string;
  sourcePolicyRefs: readonly string[];
  birthTimeEligibility: readonly string[];
  suppressionState: readonly string[];
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
    label: 'DEVELOPMENT SIGNAL-BACKED PERSONAL READING';
    evidence: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY';
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
    sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL';
    sourceAuthority: 'INCOMPLETE_RESEARCH';
    synthesisAuthority: 'DEVELOPMENT_ONLY';
    coherenceStatus: 'COHERENT';
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED';
  }>;
}>;

const THEME_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'moon-aries-response-initiation': 'A response that can begin without rushing itself',
  'mercury-taurus-information-embodiment': 'Ideas that become clearer when they take shape',
  'moon-taurus-response-embodiment': 'Steadiness that still leaves room to respond',
  'mercury-aries-information-initiation': 'A first formulation that can stay open'
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
  'sign.taurus': 'Taurus',
  'element.fire': 'Fire conditions',
  'element.earth': 'Earth conditions',
  'modality.cardinal': 'Cardinal movement',
  'modality.fixed': 'Fixed emphasis',
  'rulership.basic': 'Chart ruler'
});

const FOUNDATIONS_LESSON_BY_OBJECT_ID: Readonly<
  Record<string, FoundationsLessonId>
> = Object.freeze({
  'body.moon': 'foundations.sun_moon',
  'body.mercury': 'foundations.mercury_venus_mars',
  'sign.aries': 'foundations.zodiac_structure',
  'sign.taurus': 'foundations.zodiac_structure',
  'element.fire': 'foundations.zodiac_structure',
  'element.earth': 'foundations.zodiac_structure',
  'modality.cardinal': 'foundations.zodiac_structure',
  'modality.fixed': 'foundations.zodiac_structure',
  'rulership.basic': 'foundations.chart_priorities'
});

const BODY_COMPOSITION_LANGUAGE: Readonly<Record<string, string>> = Object.freeze({
  'body.moon': 'emotional rhythms, instincts, and needs',
  'body.mercury': 'the way you take in, sort, and express information'
});

const SIGN_COMPOSITION_LANGUAGE: Readonly<Record<string, string>> = Object.freeze({
  'sign.aries': 'directness, initiative, and a willingness to begin',
  'sign.taurus': 'steadiness, embodiment, and attention to lasting value'
});

type SignalReaderCopy = Readonly<{
  recognition: string;
  strength: string;
  pattern: string;
  tension: string;
  lever: string;
  whySynthesis: string;
}>;

const SIGNAL_READER_COPY: Readonly<Record<string, SignalReaderCopy>> = Object.freeze({
  'body.moon_x_sign.aries': Object.freeze({
    recognition: 'You may notice a first emotional response asking to move before you have fully named what you need.',
    strength: 'You can give a recurring need an initial form without treating that first movement as the whole answer.',
    pattern: 'When something matters, feeling may arrive with a wish to begin; the useful work is staying in contact with the need while the first step takes shape.',
    tension: 'A need for receptivity or rhythm may meet pressure to initiate, so beginning can feel like leaving the response behind.',
    lever: 'Name the first response, then choose one small, reversible action that lets the need stay in the conversation.',
    whySynthesis: 'Together, this can describe a response that wants to become a first move: feeling may ask for action before every detail is settled. That can help a need find form, while the tension is beginning without leaving the need behind.'
  }),
  'body.mercury_x_sign.taurus': Object.freeze({
    recognition: 'An idea may become easier to trust when you can give it a tangible form and return to it.',
    strength: 'You can make information usable by giving it continuity without pretending the first formulation is final.',
    pattern: 'When meaning is still forming, you may return to comparison, wording, and the practical shape that lets an idea be revisited.',
    tension: 'A useful formulation can become a fixed reference point, making later information harder to admit.',
    lever: 'Give the idea a working form, then mark what new information would make you revise it.',
    whySynthesis: 'Together, this can describe thinking that becomes clearer through tangible form: an idea can grow through careful wording, comparison, and something you can return to. The tension is keeping a settled formulation open to new information.'
  }),
  'body.moon_x_sign.taurus': Object.freeze({
    recognition: 'You may notice familiar rhythms or tangible steadiness helping you identify what you need.',
    strength: 'You can give a response a repeatable container while leaving room for the situation to change.',
    pattern: 'When something matters, feeling may return to what is familiar, valued, or physically grounding before it is ready to move.',
    tension: 'A steady rhythm can become something to preserve even after the context asks for revision.',
    lever: 'Create a steady container for the response, then check whether it still fits what is happening now.',
    whySynthesis: 'Together, this can describe emotional steadiness built through familiar rhythms and tangible care. That can give a response a reliable container, while the tension is checking whether what feels safe still fits the moment.'
  }),
  'body.mercury_x_sign.aries': Object.freeze({
    recognition: 'An idea may become easier to work with once you give it a first, direct formulation.',
    strength: 'You can start a line of thought clearly while leaving its next version open to comparison.',
    pattern: 'When information is active, you may name the first distinction or question and use it to get the exchange moving.',
    tension: 'A first formulation can arrive before comparison is complete, making an opening sound more final than it is.',
    lever: 'State the first formulation, then leave a deliberate pause for comparison or correction.',
    whySynthesis: 'Together, this can describe thinking that gets moving through a direct first question or formulation. That can open a line of thought, while the tension is leaving room for comparison before the first answer hardens.'
  })
});

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
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

function bodyLabel(bodyId: string): string {
  return SEMANTIC_BASIS_LABELS[bodyId] ?? bodyId;
}

function signLabel(signId: string): string {
  return SEMANTIC_BASIS_LABELS[signId] ?? signId;
}

function signalCopy(signal: PersonalSynthesisStructuredSignalInput): SignalReaderCopy {
  const copy = SIGNAL_READER_COPY[signal.compositionId];
  if (copy === undefined) {
    throw new Error(`No bounded reader copy is admitted for ${signal.compositionId}.`);
  }
  return copy;
}

export type MyChartPlacementReaderCopy = Readonly<{
  title: string;
  recognition: string;
  strength: string;
  pattern: string;
  tension: string;
  lever: string;
  whySynthesis: string;
}>;

/**
 * Exposes the accepted placement reader copy to another development-only
 * presentation POC without creating a second source of placement prose.
 */
export function getMyChartPlacementReaderCopy(
  compositionId: string,
  semanticThemeKey: string
): MyChartPlacementReaderCopy {
  const copy = SIGNAL_READER_COPY[compositionId];
  const title = THEME_TITLES[semanticThemeKey];
  if (copy === undefined || title === undefined) {
    throw new Error(`No bounded placement reader copy is admitted for ${compositionId} / ${semanticThemeKey}.`);
  }
  return Object.freeze({ title, ...copy });
}

function signalsForTheme(
  theme: PersonalSynthesisPersonalTheme
): readonly PersonalSynthesisStructuredSignalInput[] {
  const signals = theme.representativeSignalTraces;
  if (signals === undefined || signals.length === 0) {
    throw new Error(`Signal-backed theme ${theme.themeId} has no representative Signal trace.`);
  }
  return signals;
}

function evidenceForSignals(
  signals: readonly PersonalSynthesisStructuredSignalInput[]
): readonly MyChartPersonalContentEvidence[] {
  return freezeArray(signals.map((signal) => {
    const sourceReference = signal.provenance.sourceFactRefs[0];
    if (sourceReference === undefined) {
      throw new Error(`Signal ${signal.signalId} has no research provenance reference.`);
    }
    return Object.freeze({
      label: `${bodyLabel(signal.bodyId)} in ${signLabel(signal.signId)}`,
      semanticBasisLabel: `${bodyLabel(signal.bodyId)} × ${signLabel(signal.signId)} composition`,
      factKind: sourceReference.factKind,
      canonicalPath: sourceReference.canonicalPath
    });
  }));
}

function basisIdsForSignal(
  signal: PersonalSynthesisStructuredSignalInput
): readonly string[] {
  return freezeArray([
    signal.semanticBasis.bodyId,
    signal.semanticBasis.signId,
    signal.semanticBasis.elementId,
    signal.semanticBasis.modalityId,
    signal.semanticBasis.rulershipId
  ].filter((value): value is string => typeof value === 'string'));
}

function stringArrayReference(
  signal: PersonalSynthesisStructuredSignalInput,
  key: string
): readonly string[] {
  const value = signal.whyReferences[key];
  return Array.isArray(value) && value.every((entry): entry is string => typeof entry === 'string')
    ? freezeArray(value)
    : freezeArray([]);
}

function whyForSignals(
  signals: readonly PersonalSynthesisStructuredSignalInput[]
): MyChartPersonalContentTheme['why'] {
  const factors: MyChartPersonalContentWhyFactor[] = [];
  const seenFactors = new Set<string>();
  const compositionExplanations = signals.map((signal) => {
    const body = bodyLabel(signal.bodyId);
    const sign = signLabel(signal.signId);
    const bodyLanguage = BODY_COMPOSITION_LANGUAGE[signal.bodyId] ?? 'a chart function';
    const signLanguage = SIGN_COMPOSITION_LANGUAGE[signal.signId] ?? 'operating conditions';
    const bodyFactorKey = `body:${signal.bodyId}`;
    const signFactorKey = `sign:${signal.signId}`;
    if (!seenFactors.has(bodyFactorKey)) {
      seenFactors.add(bodyFactorKey);
      factors.push(Object.freeze({
        label: body,
        contribution: `${body} describes ${bodyLanguage}.`
      }));
    }
    if (!seenFactors.has(signFactorKey)) {
      seenFactors.add(signFactorKey);
      factors.push(Object.freeze({
        label: sign,
        contribution: `${sign} adds ${signLanguage}.`
      }));
    }
    return signalCopy(signal).whySynthesis;
  });

  const firstSignal = signals[0];
  if (firstSignal === undefined) {
    throw new Error('A reader-facing WHY explanation requires at least one Signal.');
  }

  return Object.freeze({
    summary: `A placement shows how ${bodyLabel(firstSignal.bodyId)} themes take shape through ${signLabel(firstSignal.signId)}. It is one thread in the chart, not a complete description of who you are.`,
    factors: freezeArray(factors),
    synthesis: compositionExplanations.join(' ')
  });
}

function learnBridgesForSignals(
  signals: readonly PersonalSynthesisStructuredSignalInput[]
): readonly MyChartPersonalContentLearnBridge[] {
  const references = signals.flatMap((signal) => signal.learnReferences.filter((reference) =>
    reference.objectId.startsWith('body.') ||
    reference.objectId.startsWith('sign.') ||
    reference.objectId.startsWith('element.') ||
    reference.objectId.startsWith('modality.')
  ));
  return learnBridges(references);
}

function evidenceSummary(theme: PersonalSynthesisPersonalTheme): string {
  const count = theme.convergence.independentEvidenceKeys.length;
  if (theme.convergence.status === 'CONVERGENT' && count > 1) {
    return `Independent chart evidence converges here through ${count} distinct paths; repeated copies of one source are not counted again.`;
  }

  return 'This theme uses one admitted Body × Sign placement; no convergence bonus is claimed.';
}

function tensionSummary(theme: PersonalSynthesisPersonalTheme): string {
  if (theme.direction === 'MIXED' || theme.editorial.why.tension.status === 'MIXED') {
    return 'Supportive and challenging directions stay together here, so the trade-off remains visible.';
  }

  return 'No mixed direction is claimed for this theme.';
}

function selectionSummary(
  theme: PersonalSynthesisPersonalTheme,
  result: PersonalSynthesisStructuredResult
): string {
  const suppressed = theme.redundancy.suppressedThemeKeys.length;
  if (suppressed > 0) {
    return 'This theme is shown once; overlapping alternatives were folded into the retained theme.';
  }

  const merged = result.synthesis.candidateTrace.filter((trace) =>
    trace.semanticThemeKey === theme.semanticThemeKey &&
    (trace.decision === 'MERGED_CONVERGENCE' || trace.decision === 'MERGED_SAME_EVIDENCE')
  ).length;
  if (merged > 0) {
    return 'This theme is shown once; supporting candidates were merged into the same personal pattern.';
  }

  return 'This theme was selected as a distinct supported pattern within the five-theme limit.';
}

function birthTimeSummary(
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN',
  theme: PersonalSynthesisPersonalTheme
): string {
  if (birthTimeAuthority === 'UNKNOWN') {
    return theme.authorityRequirements.birthTimeDependency === 'UNKNOWN_TIME_SAFE'
      ? 'This theme uses remaining placement-level evidence and does not require a known birth time.'
      : 'This theme would require a known birth time and is not shown.';
  }

  return theme.authorityRequirements.birthTimeDependency === 'REQUIRES_KNOWN'
    ? 'This theme depends on known-time evidence.'
    : 'This theme uses placement-level evidence in this known-time fixture.';
}

function projectTheme(
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN',
  result: PersonalSynthesisStructuredResult,
  theme: PersonalSynthesisPersonalTheme
): MyChartPersonalContentTheme {
  const signals = signalsForTheme(theme);
  const primarySignal = signals[0];
  if (primarySignal === undefined) {
    throw new Error(`Signal-backed theme ${theme.themeId} has no primary Signal.`);
  }
  const copy = signalCopy(primarySignal);
  const why = whyForSignals(signals);

  return Object.freeze({
    themeId: theme.themeId,
    title: THEME_TITLES[theme.semanticThemeKey] ?? 'A supported personal theme',
    domain: DOMAIN_LABELS[theme.domain],
    directionLabel: DIRECTION_LABELS[theme.direction],
    recognition: copy.recognition,
    strength: copy.strength,
    pattern: copy.pattern,
    tension: copy.tension,
    lever: copy.lever,
    evidence: evidenceForSignals(signals),
    why,
    technical: Object.freeze({
      convergence: evidenceSummary(theme),
      tension: tensionSummary(theme),
      birthTime: birthTimeSummary(birthTimeAuthority, theme),
      selection: selectionSummary(theme, result),
      signalIds: freezeArray(signals.map((signal) => signal.signalId)),
      compositionIds: freezeArray(signals.map((signal) => signal.compositionId)),
      placementEvidenceKeys: freezeArray(signals.map((signal) => signal.placementEvidenceKey)),
      domain: theme.domain,
      direction: primarySignal.direction,
      intensity: primarySignal.intensity,
      confidence: primarySignal.confidence,
      sourcePolicyRefs: freezeArray(signals.flatMap((signal) => stringArrayReference(signal, 'sourcePolicyRefs'))),
      birthTimeEligibility: freezeArray(signals.map((signal) => signal.birthTimeRequirement.status)),
      suppressionState: freezeArray(signals.map((signal) => signal.suppressionState)),
      sourceFactRefs: freezeArray(theme.editorial.why.sourceChartFacts.map((reference) =>
        reference.canonicalPath
      )),
      compositionRuleRefs: freezeArray(theme.editorial.why.compositionRuleRefs),
      semanticBasisIds: freezeArray(signals.flatMap((signal) => basisIdsForSignal(signal))),
      suppressedThemeKeys: freezeArray(theme.redundancy.suppressedThemeKeys)
    }),
    learn: learnBridgesForSignals(signals)
  });
}

type MyChartSignalScenario = Readonly<{
  scenarioId: string;
  title: string;
  purpose: string;
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  compositionIds: readonly string[];
}>;

const MY_CHART_SIGNAL_SCENARIOS: Readonly<
  Record<MyChartPersonalContentScenario, MyChartSignalScenario>
> = Object.freeze({
  'known-time': Object.freeze({
    scenarioId: 'MY_CHART_SIGNAL_BACKED_KNOWN_TIME_RESEARCH_PREVIEW',
    title: 'Known-time research preview: Moon in Aries and Mercury in Taurus',
    purpose: 'Two coherent placement-level representative Signals enter Personal Synthesis for a bounded reader-facing preview.',
    birthTimeAuthority: 'KNOWN',
    compositionIds: Object.freeze([
      'body.moon_x_sign.aries',
      'body.mercury_x_sign.taurus'
    ])
  }),
  'unknown-time': Object.freeze({
    scenarioId: 'MY_CHART_SIGNAL_BACKED_UNKNOWN_TIME_RESEARCH_PREVIEW',
    title: 'Unknown-time research preview: Moon in Taurus and Mercury in Aries',
    purpose: 'Two coherent placement-level representative Signals remain usable without angles, houses, or fabricated time.',
    birthTimeAuthority: 'UNKNOWN',
    compositionIds: Object.freeze([
      'body.moon_x_sign.taurus',
      'body.mercury_x_sign.aries'
    ])
  })
});

function rulesForScenario(
  scenario: MyChartPersonalContentScenario,
  representativeRules: readonly CompositionSignalPolicyRuleRecord[]
): readonly CompositionSignalPolicyRuleRecord[] {
  const availableRules = new Map(
    representativeRules.map((rule) => [rule.compositionId, rule] as const)
  );
  const definition = MY_CHART_SIGNAL_SCENARIOS[scenario];
  const selectedRules = definition.compositionIds.map((compositionId) => {
    const rule = availableRules.get(compositionId);
    if (rule === undefined) {
      throw new Error(`Missing admitted representative Signal rule ${compositionId}.`);
    }
    return rule;
  });
  return freezeArray(selectedRules);
}

export function projectMyChartPersonalContent(
  scenario: MyChartPersonalContentScenario,
  representativeRules: readonly CompositionSignalPolicyRuleRecord[]
): MyChartPersonalContentProjection {
  const scenarioDefinition = MY_CHART_SIGNAL_SCENARIOS[scenario];
  const result = synthesizeCompositionSignalResearchInputs(
    rulesForScenario(scenario, representativeRules)
  );
  if (result.coherence.status !== 'COHERENT') {
    throw new Error(`My Chart research preview is not coherent: ${result.coherence.failures[0]?.code ?? 'UNKNOWN'}.`);
  }
  const themes = result.synthesis.coreThemes.map((theme) => projectTheme(
    scenarioDefinition.birthTimeAuthority,
    result,
    theme
  ));
  const mergedCandidateCount = result.synthesis.candidateTrace.filter((trace) =>
    trace.decision === 'MERGED_CONVERGENCE' || trace.decision === 'MERGED_SAME_EVIDENCE'
  ).length;
  const suppressedCandidateCount = result.synthesis.candidateTrace.filter((trace) =>
    trace.decision === 'SUPPRESSED_REDUNDANCY'
  ).length;

  return Object.freeze({
    authority: 'DEVELOPMENT_ONLY',
    scenario,
    fixture: Object.freeze({
      scenarioId: scenarioDefinition.scenarioId,
      title: scenarioDefinition.title,
      purpose: scenarioDefinition.purpose,
      birthTimeAuthority: scenarioDefinition.birthTimeAuthority
    }),
    developmentDisclosure: Object.freeze({
      label: 'DEVELOPMENT SIGNAL-BACKED PERSONAL READING',
      evidence: 'RESEARCH_REPRESENTATIVE_SIGNAL / INCOMPLETE_RESEARCH / DEVELOPMENT_ONLY'
    }),
    reading: Object.freeze({
      hook: scenario === 'unknown-time'
        ? 'Two patterns still in view.'
        : 'Two patterns worth noticing.',
      introduction: scenario === 'unknown-time'
        ? 'With birth time unknown, this reading stays with Moon and Mercury placements that can be read without time-sensitive chart layers.'
        : 'Notice how a response meets initiation, and how an idea becomes more tangible.',
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
      evaluatedSignalCount: result.synthesis.evaluatedSignals.length,
      skippedRuleCount: result.synthesis.skippedRules.length,
      mergedCandidateCount,
      suppressedCandidateCount,
      sourceType: result.sourceType,
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      synthesisAuthority: result.synthesis.authority,
      coherenceStatus: result.coherence.status,
      semanticBasisStatus: result.synthesis.semanticBasisStatus
    })
  });
}
