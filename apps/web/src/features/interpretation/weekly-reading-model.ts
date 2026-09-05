import type {
  InterpretationConfidence,
  InterpretationFactReference,
  InterpretationPriority,
  InterpretationSignal,
  InterpretationSignalDirection,
  InterpretationSignalIntensity,
  InterpretationTemporalWindow
} from './interpretation-signal-contracts.js';
import { rankInterpretationSignals } from './interpretation-signal-ranking.js';
import type {
  WeeklyEditorialContentBlock,
  WeeklyEditorialLocale,
  WeeklyEditorialStyle,
  WeeklyEditorialTimelineEntry,
  WeeklyInterpretationDraft
} from './weekly-editorial.js';

export const WEEKLY_READING_MODEL_VERSION = Object.freeze({
  id: 'NATALNODE_WEEKLY_READING_MODEL_V1',
  version: '1.0.0'
});

export const WEEKLY_READING_TRANSFORMATION_VERSION = Object.freeze({
  id: 'NATALNODE_WEEKLY_READING_TRANSFORMATION_V1',
  version: '1.0.0'
});

export const WEEKLY_READING_MODEL_AUTHORITY = 'DEVELOPMENT_ONLY' as const;

export const WEEKLY_READING_VISIBILITIES = Object.freeze([
  'VISIBLE_DEFAULT',
  'EXPANDABLE',
  'ADVANCED_ONLY',
  'INTERNAL_ONLY'
] as const);

export type WeeklyReadingVisibility = (typeof WEEKLY_READING_VISIBILITIES)[number];

export const WEEKLY_READING_DEDUPE_ACTIONS = Object.freeze([
  'KEEP',
  'MERGE',
  'DOWNGRADE',
  'OMIT',
  'ADVANCED_ONLY'
] as const);

export type WeeklyReadingDedupeAction = (typeof WEEKLY_READING_DEDUPE_ACTIONS)[number];

export type WeeklyReadingDomainId =
  | 'relationship'
  | 'work-creation'
  | 'inner-state'
  | 'decisions';

export type WeeklyReadingTimingCategory =
  | 'BACKGROUND'
  | 'CORE'
  | 'MOMENTARY';

export type WeeklyReadingScreenSection =
  | 'HERO'
  | 'AT_A_GLANCE'
  | 'DOMAINS'
  | 'TIMELINE'
  | 'WATCH_OUT'
  | 'WHY'
  | 'ASTROLOGER_VIEW'
  | 'ACTIONS'
  | 'SIGNATURE';

export type WeeklyReadingActionKind = 'SAVE' | 'SHARE' | 'PRINT' | 'COLLECT';
export type WeeklyReadingActionStatus = 'AVAILABLE' | 'FUTURE';

export type WeeklyReadingDecisionTarget =
  | 'HERO'
  | 'AT_A_GLANCE'
  | 'DOMAIN'
  | 'TIMELINE'
  | 'BEST_WINDOW'
  | 'WATCH_OUT'
  | 'WHY'
  | 'ASTROLOGER_VIEW'
  | 'SIGNATURE'
  | 'ACTIONS'
  | 'SHARE';

export type WeeklyReadingSemanticOwner =
  | 'HERO'
  | 'AT_A_GLANCE'
  | 'DOMAIN'
  | 'TIMELINE'
  | 'WATCH_OUT'
  | 'WHY'
  | 'ASTROLOGER_VIEW'
  | 'SIGNATURE'
  | 'ACTIONS'
  | 'SHARE'
  | 'OMITTED';

export interface WeeklyReadingSourceTrace {
  readonly sourceEditorialBlockIds: readonly string[];
  readonly sourceSignalIds: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
}

export interface WeeklyReadingTraceEntry extends WeeklyReadingSourceTrace {
  readonly owner: WeeklyReadingSemanticOwner;
}

export interface WeeklyReadingDedupeDecision extends WeeklyReadingSourceTrace {
  readonly target: WeeklyReadingDecisionTarget;
  readonly action: WeeklyReadingDedupeAction;
  readonly semanticKey: string;
  readonly owner: WeeklyReadingSemanticOwner;
  readonly reason: string;
  readonly visibility: 'INTERNAL_ONLY';
}

export interface WeeklyReadingTraceability {
  readonly visibility: 'INTERNAL_ONLY';
  readonly blocks: readonly WeeklyReadingTraceEntry[];
  readonly decisions: readonly WeeklyReadingDedupeDecision[];
}

export interface WeeklyReadingAuthority {
  readonly status: typeof WEEKLY_READING_MODEL_AUTHORITY;
  readonly productionEligible: false;
}

export interface WeeklyReadingPeriodModel {
  readonly kind: 'WEEKLY';
  readonly periodKey: string;
  readonly label: string;
  readonly canonicalTimezone: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface WeeklyReadingHeroModel {
  readonly text: string;
  readonly visibility: 'VISIBLE_DEFAULT';
  readonly timingCue: WeeklyReadingTimingCue | null;
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingTimingCue {
  readonly label: string;
  readonly meaning: string;
}

export interface WeeklyReadingThemeModel {
  readonly id: string;
  readonly label: string;
  readonly meaning: string;
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly visibility: 'VISIBLE_DEFAULT';
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingDomainModel {
  readonly id: WeeklyReadingDomainId;
  readonly label: string;
  readonly meaning: string;
  readonly visibility: 'EXPANDABLE';
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingTimingModel {
  readonly startsAt: string;
  readonly peaksAt: string | null;
  readonly endsAt: string;
  readonly canonicalTimezone: string;
}

export interface WeeklyReadingTimelineEntryModel {
  readonly id: string;
  readonly label: string;
  readonly period: WeeklyReadingTimingModel;
  readonly meaning: string;
  readonly priority: InterpretationPriority;
  readonly category: WeeklyReadingTimingCategory;
  readonly emphasis: 'BEST_WINDOW' | null;
  readonly visibility: 'VISIBLE_DEFAULT';
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingTimelineModel {
  readonly entries: readonly WeeklyReadingTimelineEntryModel[];
  readonly visibility: 'VISIBLE_DEFAULT';
}

export interface WeeklyReadingWatchOutModel {
  readonly text: string;
  readonly visibility: 'VISIBLE_DEFAULT';
  readonly traceability: WeeklyReadingSourceTrace;
}

export type WeeklyReadingDisclosureKind = 'UNKNOWN_BIRTH_TIME';

export interface WeeklyReadingDisclosureModel {
  readonly kind: WeeklyReadingDisclosureKind;
  readonly text: string;
  readonly visibility: 'EXPANDABLE';
}

export interface WeeklyReadingWhyModel {
  readonly text: string;
  readonly visibility: 'EXPANDABLE';
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingAstrologerViewModel {
  readonly available: boolean;
  readonly text: string | null;
  readonly visibility: 'ADVANCED_ONLY';
  readonly traceability: WeeklyReadingSourceTrace | null;
}

export interface WeeklyReadingActionModel {
  readonly kind: WeeklyReadingActionKind;
  readonly label: string;
  readonly status: WeeklyReadingActionStatus;
  readonly visibility: 'VISIBLE_DEFAULT';
}

export interface WeeklyReadingSignatureModel {
  readonly text: string;
  readonly visibility: 'EXPANDABLE';
  readonly traceability: WeeklyReadingSourceTrace;
}

export interface WeeklyReadingShareProjection {
  readonly identity: 'NatalNode';
  readonly site: 'natalnode.com';
  readonly hook: string;
  readonly insight: string;
  readonly optionalSecondLine: string | null;
  readonly cta: 'natalnode.com';
  readonly visibility: 'VISIBLE_DEFAULT';
}

export interface WeeklyReadingPrintSummaryModel {
  readonly source: 'HERO';
  readonly text: string;
}

export interface WeeklyReadingScreenProjection {
  readonly readingOrder: readonly WeeklyReadingScreenSection[];
  readonly hero: WeeklyReadingHeroModel;
  readonly atAGlance: readonly WeeklyReadingThemeModel[];
  readonly domains: readonly WeeklyReadingDomainModel[];
  readonly timeline: WeeklyReadingTimelineModel | null;
  readonly watchOut: WeeklyReadingWatchOutModel | null;
  readonly why: WeeklyReadingWhyModel;
  readonly astrologerView: WeeklyReadingAstrologerViewModel;
  readonly actions: readonly WeeklyReadingActionModel[];
  readonly signature: WeeklyReadingSignatureModel;
}

export interface WeeklyReadingPrintProjection {
  readonly period: WeeklyReadingPeriodModel;
  readonly hero: WeeklyReadingHeroModel;
  readonly summary: WeeklyReadingPrintSummaryModel;
  readonly themes: readonly WeeklyReadingThemeModel[];
  readonly domains: readonly WeeklyReadingDomainModel[];
  readonly timeline: WeeklyReadingTimelineModel | null;
  readonly watchOut: WeeklyReadingWatchOutModel | null;
  readonly why: WeeklyReadingWhyModel | null;
  readonly astrologerView: WeeklyReadingAstrologerViewModel | null;
  readonly signature: WeeklyReadingSignatureModel;
}

export interface WeeklyReadingModel {
  readonly schemaVersion: typeof WEEKLY_READING_MODEL_VERSION;
  readonly transformationVersion: typeof WEEKLY_READING_TRANSFORMATION_VERSION;
  readonly authority: WeeklyReadingAuthority;
  readonly locale: WeeklyEditorialLocale;
  readonly style: WeeklyEditorialStyle;
  readonly birthTimeAuthority: WeeklyInterpretationDraft['birthTimeAuthority'];
  readonly editorialVersion: WeeklyInterpretationDraft['editorialVersion'];
  readonly rulesVersion: WeeklyInterpretationDraft['rulesVersion'];
  readonly period: WeeklyReadingPeriodModel;
  readonly hero: WeeklyReadingHeroModel;
  readonly atAGlance: readonly WeeklyReadingThemeModel[];
  readonly domains: readonly WeeklyReadingDomainModel[];
  readonly timeline: WeeklyReadingTimelineModel | null;
  readonly watchOut: WeeklyReadingWatchOutModel | null;
  readonly why: WeeklyReadingWhyModel;
  readonly disclosures: readonly WeeklyReadingDisclosureModel[];
  readonly astrologerView: WeeklyReadingAstrologerViewModel;
  readonly actions: readonly WeeklyReadingActionModel[];
  readonly signature: WeeklyReadingSignatureModel;
  readonly share: WeeklyReadingShareProjection;
  readonly screen: WeeklyReadingScreenProjection;
  readonly print: WeeklyReadingPrintProjection;
  readonly traceability: WeeklyReadingTraceability;
}

type LocalizedText = Readonly<Record<WeeklyEditorialLocale, string>>;
type DomainSource =
  | 'relationship'
  | 'workCreation'
  | 'innerState'
  | 'actionDecision';

interface DomainDefinition {
  readonly id: WeeklyReadingDomainId;
  readonly source: DomainSource;
  readonly labels: LocalizedText;
}

interface ThemeBuildResult {
  readonly themes: readonly WeeklyReadingThemeModel[];
  readonly semanticKeys: ReadonlySet<string>;
  readonly decisions: readonly WeeklyReadingDedupeDecision[];
}

interface DomainBuildResult {
  readonly domains: readonly WeeklyReadingDomainModel[];
  readonly decisions: readonly WeeklyReadingDedupeDecision[];
}

interface TimelineCandidate {
  readonly signal: InterpretationSignal;
  readonly window: InterpretationTemporalWindow;
  readonly editorialEntry: WeeklyEditorialTimelineEntry;
  readonly sourceOrder: number;
}

interface TimelineBuildResult {
  readonly timeline: WeeklyReadingTimelineModel | null;
  readonly decisions: readonly WeeklyReadingDedupeDecision[];
  readonly hasExplicitTimingEvidence: boolean;
}

const THEME_LABELS: Readonly<Record<string, LocalizedText>> = Object.freeze({
  'clear-communication': { en: 'Clear communication', 'zh-Hant': '清晰溝通' },
  'deliberate-next-step': { en: 'Deliberate next step', 'zh-Hant': '下一步行動' },
  'relationship-pace': { en: 'Mixed relationship', 'zh-Hant': '關係節奏' },
  'forward-action': { en: 'Forward action', 'zh-Hant': '向前行動' },
  'reactive-emotion': { en: 'Reactive emotion', 'zh-Hant': '情緒反應' },
  'steady-progress': { en: 'Steady progress', 'zh-Hant': '穩定推進' },
  'decision-window': { en: 'Decision window', 'zh-Hant': '決策窗口' },
  'self-observation': { en: 'Self-observation', 'zh-Hant': '自我觀察' },
  'simple-language': { en: 'Simple language', 'zh-Hant': '簡明語言' }
});

const DOMAIN_DEFINITIONS: readonly DomainDefinition[] = Object.freeze([
  {
    id: 'relationship',
    source: 'relationship',
    labels: { en: 'Love & relationships', 'zh-Hant': '愛與關係' }
  },
  {
    id: 'work-creation',
    source: 'workCreation',
    labels: { en: 'Work & creation', 'zh-Hant': '工作與創作' }
  },
  {
    id: 'inner-state',
    source: 'innerState',
    labels: { en: 'Inner state', 'zh-Hant': '內在狀態' }
  },
  {
    id: 'decisions',
    source: 'actionDecision',
    labels: { en: 'Decisions', 'zh-Hant': '決策' }
  }
]);

const ACTION_LABELS: Readonly<Record<WeeklyReadingActionKind, LocalizedText>> = Object.freeze({
  SAVE: { en: 'Save', 'zh-Hant': '儲存' },
  SHARE: { en: 'Share', 'zh-Hant': '分享' },
  PRINT: { en: 'Print', 'zh-Hant': '列印' },
  COLLECT: { en: 'Collect', 'zh-Hant': '收藏' }
});

const UNSUPPORTED_UNKNOWN_TIME_FACT_KINDS = new Set([
  'NATAL_ANGLE_POSITION',
  'NATAL_HOUSE_PLACEMENT',
  'TRANSIT_NATAL_ANGLE',
  'TRANSIT_HOUSE_PLACEMENT'
]);

const TECHNICAL_ID_PATTERN =
  /(?:fixture:\/\/|weekly-poc\.[a-z0-9_.-]+|signal\.[a-z0-9_.-]+|rule\.[a-z0-9_.-]+|\/bodies\/|\/aspects\/|DEVELOPMENT_ONLY|DEVELOPMENT_FIXTURE|INCOMPLETE_RESEARCH)/iu;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)]);
}

function factReferenceKey(reference: InterpretationFactReference): string {
  return [
    reference.factKind,
    reference.canonicalPath,
    reference.canonicalFactIdentity ?? '',
    reference.scientificConfigurationIdentity ?? '',
    reference.provenanceEnvelopeId ?? ''
  ].join('|');
}

function uniqueFactReferences(
  references: readonly InterpretationFactReference[]
): readonly InterpretationFactReference[] {
  const seen = new Set<string>();
  const result: InterpretationFactReference[] = [];

  for (const reference of references) {
    const key = factReferenceKey(reference);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(reference);
    }
  }

  return freezeArray(result);
}

function sourceTrace(
  sourceEditorialBlockIds: readonly string[],
  sourceSignalIds: readonly string[],
  sourceFactRefs: readonly InterpretationFactReference[]
): WeeklyReadingSourceTrace {
  return Object.freeze({
    sourceEditorialBlockIds: uniqueStrings(sourceEditorialBlockIds),
    sourceSignalIds: uniqueStrings(sourceSignalIds),
    sourceFactRefs: uniqueFactReferences(sourceFactRefs)
  });
}

function traceForBlock(block: WeeklyEditorialContentBlock): WeeklyReadingSourceTrace {
  return sourceTrace(
    [block.contentBlockId],
    block.sourceSignalIds,
    block.sourceFactRefs
  );
}

function traceFromBlocks(
  blocks: readonly (WeeklyEditorialContentBlock | null | undefined)[]
): WeeklyReadingSourceTrace {
  const sourceEditorialBlockIds: string[] = [];
  const sourceSignalIds: string[] = [];
  const sourceFactRefs: InterpretationFactReference[] = [];

  for (const block of blocks) {
    if (block !== null && block !== undefined) {
      sourceEditorialBlockIds.push(block.contentBlockId);
      sourceSignalIds.push(...block.sourceSignalIds);
      sourceFactRefs.push(...block.sourceFactRefs);
    }
  }

  return sourceTrace(sourceEditorialBlockIds, sourceSignalIds, sourceFactRefs);
}

function semanticKey(block: WeeklyEditorialContentBlock): string {
  return 'theme=' + block.theme + '|signals=' + [...new Set(block.sourceSignalIds)].sort().join(',');
}

function localized(labels: LocalizedText, locale: WeeklyEditorialLocale): string {
  return labels[locale];
}

function themeLabel(theme: string, locale: WeeklyEditorialLocale): string {
  const labels = THEME_LABELS[theme];
  if (labels === undefined) {
    throw new Error('Weekly Reading Model has no human-facing label for theme ' + theme + '.');
  }

  return localized(labels, locale);
}

function decision(
  target: WeeklyReadingDecisionTarget,
  action: WeeklyReadingDedupeAction,
  owner: WeeklyReadingSemanticOwner,
  key: string,
  trace: WeeklyReadingSourceTrace,
  reason: string
): WeeklyReadingDedupeDecision {
  return Object.freeze({
    target,
    action,
    owner,
    semanticKey: key,
    sourceEditorialBlockIds: trace.sourceEditorialBlockIds,
    sourceSignalIds: trace.sourceSignalIds,
    sourceFactRefs: trace.sourceFactRefs,
    reason,
    visibility: 'INTERNAL_ONLY' as const
  });
}

function allDraftBlocks(
  draft: WeeklyInterpretationDraft
): readonly WeeklyEditorialContentBlock[] {
  return [
    draft.hero,
    ...draft.coreThemes.map((theme) => theme.content),
    ...draft.timeline.map((entry) => entry.content),
    draft.relationship,
    draft.workCreation,
    draft.innerState,
    draft.actionDecision,
    draft.watchOut,
    draft.bestWindow,
    draft.astrologerView,
    draft.signatureLine,
    draft.shareProjection.hook,
    draft.shareProjection.insight,
    draft.shareProjection.cta
  ].filter((block): block is WeeklyEditorialContentBlock => block !== null);
}

function assertDevelopmentOnlyDraft(draft: WeeklyInterpretationDraft): void {
  if (draft.authority !== 'DEVELOPMENT_ONLY' ||
      draft.birthTimeAuthority !== 'KNOWN' && draft.birthTimeAuthority !== 'UNKNOWN') {
    throw new Error('Weekly Reading Model requires a valid development-only draft.');
  }

  if (draft.signals.some((signal) =>
    signal.authority !== 'DEVELOPMENT_ONLY' ||
    signal.provenance.sourceAuthority !== 'DEVELOPMENT_FIXTURE'
  )) {
    throw new Error('Weekly Reading Model cannot promote non-development Signal authority.');
  }

  if (allDraftBlocks(draft).some((block) =>
    block.fixtureAuthority !== 'DEVELOPMENT_ONLY' ||
    block.sourceSignalIds.length === 0 ||
    block.sourceFactRefs.length === 0
  )) {
    throw new Error('Weekly Reading Model requires traceable development-only editorial blocks.');
  }
}

function signalMap(draft: WeeklyInterpretationDraft): ReadonlyMap<string, InterpretationSignal> {
  const result = new Map<string, InterpretationSignal>();

  for (const signal of draft.signals) {
    if (result.has(signal.signalId)) {
      throw new Error('Weekly Reading Model received a duplicate Signal ID.');
    }
    result.set(signal.signalId, signal);
  }

  return result;
}

function signalsForIds(
  ids: readonly string[],
  signals: ReadonlyMap<string, InterpretationSignal>
): readonly InterpretationSignal[] {
  return ids.map((id) => {
    const signal = signals.get(id);
    if (signal === undefined) {
      throw new Error('Weekly Reading Model received an unknown source Signal ID.');
    }
    return signal;
  });
}

function makePeriod(
  draft: WeeklyInterpretationDraft
): WeeklyReadingPeriodModel {
  if (draft.period.kind !== 'WEEKLY') {
    throw new Error('Weekly Reading Model requires a weekly period.');
  }

  return Object.freeze({
    kind: 'WEEKLY' as const,
    periodKey: draft.period.periodKey,
    label: draft.locale === 'zh-Hant' ? '本週' : 'This week',
    canonicalTimezone: draft.period.canonicalTimezone,
    startsAt: draft.period.startsAt,
    endsAt: draft.period.endsAt
  });
}

function buildHero(
  draft: WeeklyInterpretationDraft,
  timeline: WeeklyReadingTimelineModel | null
): WeeklyReadingHeroModel {
  if (draft.hero.text.trim().length === 0) {
    throw new Error('Weekly Reading Model cannot expose an empty Hero.');
  }

  const timingCueEntry = timeline?.entries.find((entry) =>
    entry.emphasis === 'BEST_WINDOW'
  ) ?? null;

  return Object.freeze({
    text: draft.hero.text,
    visibility: 'VISIBLE_DEFAULT' as const,
    timingCue: timingCueEntry === null
      ? null
      : Object.freeze({
        label: timingCueEntry.label,
        meaning: timingCueEntry.meaning
      }),
    traceability: traceForBlock(draft.hero)
  });
}

function buildAtAGlance(
  draft: WeeklyInterpretationDraft,
  heroKey: string,
  locale: WeeklyEditorialLocale
): ThemeBuildResult {
  const themes: WeeklyReadingThemeModel[] = [];
  const coreThemeKeys = new Set<string>();
  const decisions: WeeklyReadingDedupeDecision[] = [];
  const orderedProjections = [
    ...draft.coreThemes.filter((projection) => semanticKey(projection.content) === heroKey),
    ...draft.coreThemes.filter((projection) => semanticKey(projection.content) !== heroKey)
  ];

  for (const [index, projection] of orderedProjections.entries()) {
    const block = projection.content;
    const key = semanticKey(block);

    if (index >= 3) {
      decisions.push(decision(
        'AT_A_GLANCE',
        'OMIT',
        'OMITTED',
        key,
        traceForBlock(block),
        'The default At-a-Glance contract is limited to three themes.'
      ));
      continue;
    }

    if (block.text.trim().length === 0) {
      decisions.push(decision(
        'AT_A_GLANCE',
        'OMIT',
        'OMITTED',
        key,
        traceForBlock(block),
        'An empty theme cannot become visible reader content.'
      ));
      continue;
    }

    if (coreThemeKeys.has(key)) {
      decisions.push(decision(
        'AT_A_GLANCE',
        'MERGE',
        'AT_A_GLANCE',
        key,
        traceForBlock(block),
        'Repeated semantic source content is represented by one At-a-Glance theme.'
      ));
      continue;
    }

    const theme = Object.freeze({
      id: 'theme-' + String(themes.length + 1),
      label: themeLabel(block.theme, locale),
      meaning: block.text,
      direction: projection.direction,
      intensity: projection.intensity,
      confidence: projection.confidence,
      visibility: 'VISIBLE_DEFAULT' as const,
      traceability: traceForBlock(block)
    });

    themes.push(theme);
    coreThemeKeys.add(key);
    decisions.push(decision(
      'AT_A_GLANCE',
      'KEEP',
      'AT_A_GLANCE',
      key,
      theme.traceability,
      key === heroKey
        ? 'The concise supporting block has a distinct core-theme role and remains beside the primary Hero.'
        : 'The distinct theme is retained in the draft’s stable editorial order.'
    ));
  }

  return {
    themes: freezeArray(themes),
    semanticKeys: new Set<string>([heroKey, ...coreThemeKeys]),
    decisions: freezeArray(decisions)
  };
}

function buildDomains(
  draft: WeeklyInterpretationDraft,
  occupiedSemanticKeys: ReadonlySet<string>,
  locale: WeeklyEditorialLocale
): DomainBuildResult {
  const domains: WeeklyReadingDomainModel[] = [];
  const decisions: WeeklyReadingDedupeDecision[] = [];
  const domainKeys = new Set<string>();
  const exactTexts = new Set<string>();

  for (const definition of DOMAIN_DEFINITIONS) {
    const block = draft[definition.source];
    const key = block === null ? 'domain=' + definition.id : semanticKey(block);

    if (block === null) {
      decisions.push(decision(
        'DOMAIN',
        'OMIT',
        'OMITTED',
        key,
        sourceTrace([], [], []),
        'No editorial block was supplied for this conditional domain.'
      ));
      continue;
    }

    const trace = traceForBlock(block);
    if (block.text.trim().length === 0) {
      decisions.push(decision(
        'DOMAIN',
        'OMIT',
        'OMITTED',
        key,
        trace,
        'An empty domain cannot become visible reader content.'
      ));
      continue;
    }

    if (occupiedSemanticKeys.has(key) || domainKeys.has(key)) {
      decisions.push(decision(
        'DOMAIN',
        'MERGE',
        'AT_A_GLANCE',
        key,
        trace,
        'The domain repeats a Hero or At-a-Glance semantic identity and has no distinct editorial source.'
      ));
      continue;
    }

    const normalized = normalizeText(block.text);
    if (exactTexts.has(normalized)) {
      decisions.push(decision(
        'DOMAIN',
        'OMIT',
        'OMITTED',
        key,
        trace,
        'A defensive exact-text check removes a duplicate domain paragraph.'
      ));
      continue;
    }

    domains.push(Object.freeze({
      id: definition.id,
      label: localized(definition.labels, locale),
      meaning: block.text,
      visibility: 'EXPANDABLE' as const,
      traceability: trace
    }));
    domainKeys.add(key);
    exactTexts.add(normalized);
    decisions.push(decision(
      'DOMAIN',
      'KEEP',
      'DOMAIN',
      key,
      trace,
      'The domain has a distinct semantic source and adds context beyond the visible themes.'
    ));
  }

  return {
    domains: freezeArray(domains),
    decisions: freezeArray(decisions)
  };
}

function weekdayLabel(
  date: Date,
  locale: WeeklyEditorialLocale,
  canonicalTimezone: string
): string {
  const english = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const traditional = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  let weekday: string;

  try {
    weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: canonicalTimezone,
      weekday: 'short'
    }).format(date);
  } catch {
    throw new Error('Weekly Reading Model received an invalid canonical timezone.');
  }

  const weekdayIndex = english.indexOf(weekday);
  if (weekdayIndex === -1) {
    throw new Error('Weekly Reading Model could not resolve a weekday label.');
  }

  return locale === 'zh-Hant' ? traditional[weekdayIndex] : english[weekdayIndex];
}

function temporalLabel(
  window: InterpretationTemporalWindow,
  locale: WeeklyEditorialLocale
): string {
  const start = new Date(window.startsAt);
  const end = new Date(window.endsAt);

  if (!Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start) {
    throw new Error('Weekly Reading Model requires a valid non-empty timing window.');
  }

  const inclusiveEnd = new Date(end.getTime() - 1);
  const startLabel = weekdayLabel(start, locale, window.canonicalTimezone);
  const endLabel = weekdayLabel(inclusiveEnd, locale, window.canonicalTimezone);

  return startLabel === endLabel
    ? startLabel
    : startLabel + (locale === 'zh-Hant' ? '至' : '–') + endLabel;
}

function stripTimelinePreamble(text: string): string {
  const withoutPreamble = text
    .trim()
    .replace(/^The timeline marks this explicit window:\s*/u, '')
    .replace(/^時間軸標示這段明確窗口：\s*/u, '')
    .trim();

  if (withoutPreamble.length === 0) {
    throw new Error('Weekly Reading Model cannot expose an empty Timeline meaning.');
  }

  return withoutPreamble;
}

function timingCategory(priority: InterpretationPriority): WeeklyReadingTimingCategory {
  if (priority === 'BACKGROUND') {
    return 'BACKGROUND';
  }
  if (priority === 'MOMENTARY') {
    return 'MOMENTARY';
  }
  return 'CORE';
}

function buildTimeline(
  draft: WeeklyInterpretationDraft,
  signals: ReadonlyMap<string, InterpretationSignal>,
  locale: WeeklyEditorialLocale
): TimelineBuildResult {
  const decisions: WeeklyReadingDedupeDecision[] = [];
  const candidates: TimelineCandidate[] = [];
  const seenWindows = new Set<string>();
  const hasExplicitTimingEvidence = draft.signals.some(
    (signal) => signal.temporalWindow !== undefined
  );

  for (const [sourceOrder, editorialEntry] of draft.timeline.entries()) {
    if (editorialEntry.sourceSignalIds.length === 0) {
      throw new Error('Weekly Reading Model received a Timeline entry without source Signals.');
    }

    for (const signalId of editorialEntry.sourceSignalIds) {
      const signal = signalsForIds([signalId], signals)[0];
      const window = signal.temporalWindow;
      if (window === undefined) {
        throw new Error('Weekly Reading Model received a Timeline Signal without timing evidence.');
      }

      const windowKey = signal.signalId + '|' + window.startsAt + '|' + window.endsAt;
      const trace = sourceTrace(
        [editorialEntry.content.contentBlockId],
        [signal.signalId],
        editorialEntry.content.sourceFactRefs
      );

      if (seenWindows.has(windowKey)) {
        decisions.push(decision(
          'TIMELINE',
          'MERGE',
          'TIMELINE',
          windowKey,
          trace,
          'The same source Signal and explicit window are represented by one Timeline entry.'
        ));
        continue;
      }

      seenWindows.add(windowKey);
      candidates.push({
        signal,
        window,
        editorialEntry,
        sourceOrder
      });
    }
  }

  if (candidates.length === 0) {
    decisions.push(decision(
      'TIMELINE',
      'OMIT',
      'OMITTED',
      'timeline=none',
      sourceTrace([], [], []),
      hasExplicitTimingEvidence
        ? draft.style === 'SHARE'
          ? 'The compact SHARE draft intentionally omits the full Timeline projection.'
          : 'No editorial Timeline owner was supplied.'
        : 'No explicit timing evidence exists, so the Timeline is omitted.'
    ));
    return {
      timeline: null,
      decisions: freezeArray(decisions),
      hasExplicitTimingEvidence
    };
  }

  const signalOrder = new Map(draft.signals.map((signal, index) => [signal.signalId, index]));
  const sorted = [...candidates].sort((left, right) => {
    const startDifference = Date.parse(left.window.startsAt) - Date.parse(right.window.startsAt);
    if (startDifference !== 0) {
      return startDifference;
    }

    const endDifference = Date.parse(left.window.endsAt) - Date.parse(right.window.endsAt);
    if (endDifference !== 0) {
      return endDifference;
    }

    const leftOrder = signalOrder.get(left.signal.signalId) ?? left.sourceOrder;
    const rightOrder = signalOrder.get(right.signal.signalId) ?? right.sourceOrder;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.signal.signalId.localeCompare(right.signal.signalId);
  });

  const entries = sorted.map((candidate, index) => {
    const trace = sourceTrace(
      [candidate.editorialEntry.content.contentBlockId],
      [candidate.signal.signalId],
      candidate.editorialEntry.content.sourceFactRefs
    );
    const entryKey = semanticKey(candidate.editorialEntry.content) +
      '|signal=' + candidate.signal.signalId +
      '|window=' + candidate.window.startsAt + '|' + candidate.window.endsAt;

    const entry = Object.freeze({
      id: 'timeline-' + String(index + 1),
      label: temporalLabel(candidate.window, locale),
      period: Object.freeze({
        startsAt: candidate.window.startsAt,
        peaksAt: candidate.window.peaksAt,
        endsAt: candidate.window.endsAt,
        canonicalTimezone: candidate.window.canonicalTimezone
      }),
      meaning: stripTimelinePreamble(candidate.editorialEntry.content.text),
      priority: candidate.signal.priority,
      category: timingCategory(candidate.signal.priority),
      emphasis: null,
      visibility: 'VISIBLE_DEFAULT' as const,
      traceability: trace
    });

    decisions.push(decision(
      'TIMELINE',
      'KEEP',
      'TIMELINE',
      entryKey,
      trace,
      'Explicit timing remains in the single Timeline owner with stable chronological ordering.'
    ));

    return entry;
  });

  return {
    timeline: Object.freeze({
      entries: freezeArray(entries),
      visibility: 'VISIBLE_DEFAULT' as const
    }),
    decisions: freezeArray(decisions),
    hasExplicitTimingEvidence
  };
}

function bestWindowSignalId(
  draft: WeeklyInterpretationDraft,
  signals: ReadonlyMap<string, InterpretationSignal>
): string | null {
  if (draft.bestWindow === null) {
    return null;
  }

  const candidates = signalsForIds(draft.bestWindow.sourceSignalIds, signals)
    .filter((signal) => signal.temporalWindow !== undefined);
  if (candidates.length === 0) {
    return null;
  }

  const momentary = candidates.filter((signal) => signal.priority === 'MOMENTARY');
  const ranked = rankInterpretationSignals(momentary.length > 0 ? momentary : candidates);
  return ranked[0]?.signal.signalId ?? null;
}

function applyBestWindowEmphasis(
  timeline: WeeklyReadingTimelineModel | null,
  bestSignalId: string | null
): WeeklyReadingTimelineModel | null {
  if (timeline === null || bestSignalId === null) {
    return timeline;
  }

  return Object.freeze({
    ...timeline,
    entries: freezeArray(timeline.entries.map((entry) =>
      entry.traceability.sourceSignalIds.includes(bestSignalId)
        ? Object.freeze({ ...entry, emphasis: 'BEST_WINDOW' as const })
        : entry
    ))
  });
}

function buildWatchOut(
  draft: WeeklyInterpretationDraft,
  signals: ReadonlyMap<string, InterpretationSignal>
): WeeklyReadingWatchOutModel | null {
  const block = draft.watchOut;
  if (block === null) {
    return null;
  }

  const supported = signalsForIds(block.sourceSignalIds, signals).some((signal) =>
    signal.direction === 'CHALLENGING' || signal.direction === 'MIXED'
  );
  return supported
    ? Object.freeze({
      text: block.text,
      visibility: 'VISIBLE_DEFAULT' as const,
      traceability: traceForBlock(block)
    })
    : null;
}

function unknownTimeDisclosure(
  locale: WeeklyEditorialLocale
): WeeklyReadingDisclosureModel {
  return Object.freeze({
    kind: 'UNKNOWN_BIRTH_TIME' as const,
    text: locale === 'zh-Hant'
      ? '出生時間未提供，因此本次閱讀保留可用的落點模式，不加入依賴時間的星盤細節。'
      : 'Birth time is unknown, so this reading stays with placement-level patterns and leaves time-dependent chart details out.',
    visibility: 'EXPANDABLE' as const
  });
}

function buildWhy(
  draft: WeeklyInterpretationDraft,
  atAGlance: readonly WeeklyReadingThemeModel[],
  domains: readonly WeeklyReadingDomainModel[],
  timeline: WeeklyReadingTimelineModel | null,
  hasExplicitTimingEvidence: boolean,
  trace: WeeklyReadingSourceTrace
): WeeklyReadingWhyModel {
  const sentences: string[] = [];
  const locale = draft.locale;
  const hasMixedTheme = draft.coreThemes.some((theme) => theme.direction === 'MIXED');

  if (hasMixedTheme) {
    sentences.push(locale === 'zh-Hant'
      ? '當同一主題同時有支持與拉力時，閱讀會把兩者放在同一個脈絡中。'
      : 'Supportive and challenging cues stay together when they describe one theme.');
  }

  if (timeline !== null) {
    sentences.push(locale === 'zh-Hant'
      ? '時間資訊集中在時間軸，讓每個窗口都有清楚的主要歸屬。'
      : 'Timing stays in one Timeline so each window has a single clear owner.');
  } else if (draft.style === 'SHARE' && hasExplicitTimingEvidence) {
    sentences.push(locale === 'zh-Hant'
      ? '這個精簡版本省略時間軸，讓分享內容保持聚焦。'
      : 'This compact version keeps timing out so the shared reading stays focused.');
  } else {
    sentences.push(locale === 'zh-Hant'
      ? '目前沒有明確的時間窗口，因此閱讀省略時間軸，不以佔位內容填補。'
      : 'No explicit timing window is supplied, so the reading leaves the Timeline out rather than filling it with a placeholder.');
  }

  if (domains.length === 0) {
    sentences.push(locale === 'zh-Hant'
      ? '當生活面向只重複既有主題時，不另立區段。'
      : 'No separate life-area section is added when its copy repeats a theme already in view.');
  } else if (atAGlance.length > 0) {
    sentences.push(locale === 'zh-Hant'
      ? '只有增加新脈絡的生活面向才會獨立呈現。'
      : 'Only life-area context that adds something beyond the visible themes receives its own section.');
  }

  if (draft.birthTimeAuthority === 'UNKNOWN') {
    sentences.push(unknownTimeDisclosure(locale).text);
  }

  if (sentences.length === 0) {
    throw new Error('Weekly Reading Model could not construct a Why explanation.');
  }

  return Object.freeze({
    text: sentences.join(' '),
    visibility: 'EXPANDABLE' as const,
    traceability: trace
  });
}

function buildAstrologerView(
  draft: WeeklyInterpretationDraft,
  signals: ReadonlyMap<string, InterpretationSignal>
): WeeklyReadingAstrologerViewModel {
  const block = draft.astrologerView;
  if (block === null) {
    return Object.freeze({
      available: false,
      text: null,
      visibility: 'ADVANCED_ONLY' as const,
      traceability: null
    });
  }

  const trace = traceForBlock(block);
  const sourceSignals = signalsForIds(block.sourceSignalIds, signals);
  const sourceFactRefs = sourceSignals.flatMap((signal) => signal.provenance.sourceFactRefs);
  const factKinds = new Set(sourceFactRefs.map((reference) => reference.factKind));

  if (draft.birthTimeAuthority === 'UNKNOWN' &&
      [...factKinds].some((factKind) => UNSUPPORTED_UNKNOWN_TIME_FACT_KINDS.has(factKind))) {
    throw new Error('Unknown birth time cannot expose house, angle, or time-dependent technical facts.');
  }

  return Object.freeze({
    available: true,
    text: block.text,
    visibility: 'ADVANCED_ONLY' as const,
    traceability: trace
  });
}

function buildActions(
  locale: WeeklyEditorialLocale
): readonly WeeklyReadingActionModel[] {
  return freezeArray((['SAVE', 'SHARE', 'PRINT', 'COLLECT'] as const).map((kind) =>
    Object.freeze({
      kind,
      label: localized(ACTION_LABELS[kind], locale),
      status: kind === 'COLLECT' ? 'FUTURE' as const : 'AVAILABLE' as const,
      visibility: 'VISIBLE_DEFAULT' as const
    })
  ));
}

function buildShare(
  draft: WeeklyInterpretationDraft
): WeeklyReadingShareProjection {
  const site = draft.shareProjection.cta.text.trim();
  if (site !== 'natalnode.com') {
    throw new Error('Weekly Reading Model requires the canonical NatalNode share site.');
  }

  return Object.freeze({
    identity: 'NatalNode' as const,
    site: 'natalnode.com' as const,
    hook: draft.shareProjection.hook.text,
    insight: draft.shareProjection.insight.text,
    optionalSecondLine: null,
    cta: 'natalnode.com' as const,
    visibility: 'VISIBLE_DEFAULT' as const
  });
}

function buildScreenProjection(
  hero: WeeklyReadingHeroModel,
  atAGlance: readonly WeeklyReadingThemeModel[],
  domains: readonly WeeklyReadingDomainModel[],
  timeline: WeeklyReadingTimelineModel | null,
  watchOut: WeeklyReadingWatchOutModel | null,
  why: WeeklyReadingWhyModel,
  astrologerView: WeeklyReadingAstrologerViewModel,
  actions: readonly WeeklyReadingActionModel[],
  signature: WeeklyReadingSignatureModel
): WeeklyReadingScreenProjection {
  const readingOrder: WeeklyReadingScreenSection[] = ['HERO'];

  if (atAGlance.length > 0) {
    readingOrder.push('AT_A_GLANCE');
  }
  if (domains.length > 0) {
    readingOrder.push('DOMAINS');
  }
  if (timeline !== null) {
    readingOrder.push('TIMELINE');
  }
  if (watchOut !== null) {
    readingOrder.push('WATCH_OUT');
  }
  readingOrder.push('WHY');
  if (astrologerView.available) {
    readingOrder.push('ASTROLOGER_VIEW');
  }
  readingOrder.push('ACTIONS', 'SIGNATURE');

  return Object.freeze({
    readingOrder: freezeArray(readingOrder),
    hero,
    atAGlance,
    domains,
    timeline,
    watchOut,
    why,
    astrologerView,
    actions,
    signature
  });
}

function buildPrintProjection(
  period: WeeklyReadingPeriodModel,
  hero: WeeklyReadingHeroModel,
  atAGlance: readonly WeeklyReadingThemeModel[],
  domains: readonly WeeklyReadingDomainModel[],
  timeline: WeeklyReadingTimelineModel | null,
  watchOut: WeeklyReadingWatchOutModel | null,
  why: WeeklyReadingWhyModel,
  astrologerView: WeeklyReadingAstrologerViewModel,
  signature: WeeklyReadingSignatureModel
): WeeklyReadingPrintProjection {
  return Object.freeze({
    period,
    hero,
    summary: Object.freeze({
      source: 'HERO' as const,
      text: hero.text
    }),
    themes: atAGlance,
    domains,
    timeline,
    watchOut,
    why,
    astrologerView: astrologerView.available ? astrologerView : null,
    signature
  });
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

function consumerCopy(model: WeeklyReadingModel): readonly string[] {
  return [
    model.hero.text,
    ...model.atAGlance.flatMap((theme) => [theme.label, theme.meaning]),
    ...model.domains.flatMap((domain) => [domain.label, domain.meaning]),
    ...(model.timeline?.entries.flatMap((entry) => [entry.label, entry.meaning]) ?? []),
    ...(model.watchOut === null ? [] : [model.watchOut.text]),
    model.why.text,
    ...(model.astrologerView.text === null ? [] : [model.astrologerView.text]),
    ...model.disclosures.map((disclosure) => disclosure.text),
    model.signature.text,
    model.share.hook,
    model.share.insight,
    model.share.site
  ];
}

function assertNoInternalLeakage(model: WeeklyReadingModel): void {
  if (consumerCopy(model).some((text) => TECHNICAL_ID_PATTERN.test(text))) {
    throw new Error('Weekly Reading Model exposed an internal identifier in consumer copy.');
  }
}

function assertVisibleSemanticOwnership(model: WeeklyReadingModel): void {
  const visibleTextOwners = new Map<string, string>();
  const addVisibleText = (text: string, owner: string): void => {
    const normalized = normalizeText(text);
    if (normalized.length === 0) {
      throw new Error('Weekly Reading Model exposed empty visible copy.');
    }
    const previousOwner = visibleTextOwners.get(normalized);
    if (previousOwner !== undefined && previousOwner !== owner) {
      throw new Error('Weekly Reading Model exposed duplicate visible semantic copy.');
    }
    visibleTextOwners.set(normalized, owner);
  };

  addVisibleText(model.hero.text, 'HERO');
  for (const theme of model.atAGlance) {
    addVisibleText(theme.meaning, 'AT_A_GLANCE:' + theme.id);
  }
  for (const domain of model.domains) {
    addVisibleText(domain.meaning, 'DOMAIN:' + domain.id);
  }
  for (const entry of model.timeline?.entries ?? []) {
    addVisibleText(entry.label + '|' + entry.meaning, 'TIMELINE:' + entry.id);
  }
  if (model.watchOut !== null) {
    addVisibleText(model.watchOut.text, 'WATCH_OUT');
  }
}

function assertTimelineInvariants(model: WeeklyReadingModel): void {
  if (model.timeline === null) {
    if (model.birthTimeAuthority === 'UNKNOWN') {
      const timelineDecisions = model.traceability.decisions.filter(
        (item) => item.target === 'TIMELINE'
      );
      if (timelineDecisions.some((item) => item.action === 'KEEP')) {
        throw new Error('Unknown birth time cannot keep a Timeline.');
      }
    }
    return;
  }

  if (model.timeline.entries.length === 0) {
    throw new Error('A visible Timeline cannot be empty.');
  }

  let previousStart = Number.NEGATIVE_INFINITY;
  let emphasisCount = 0;
  for (const entry of model.timeline.entries) {
    const start = Date.parse(entry.period.startsAt);
    const end = Date.parse(entry.period.endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error('Timeline entries must contain valid explicit windows.');
    }
    if (start < previousStart) {
      throw new Error('Timeline entries must remain in stable chronological order.');
    }
    previousStart = start;
    if (entry.emphasis === 'BEST_WINDOW') {
      emphasisCount += 1;
    }
  }

  if (emphasisCount > 1) {
    throw new Error('At most one Best Window emphasis may be projected onto Timeline.');
  }

  if (model.birthTimeAuthority === 'UNKNOWN') {
    throw new Error('Unknown birth time cannot expose a Timeline.');
  }
}

function assertModelInvariants(model: WeeklyReadingModel): WeeklyReadingModel {
  if (model.hero.visibility !== 'VISIBLE_DEFAULT') {
    throw new Error('Weekly Reading Model must have one default-visible Hero.');
  }
  if (model.atAGlance.length > 3) {
    throw new Error('Weekly Reading Model cannot expose more than three default themes.');
  }
  if (model.domains.some((domain) => domain.meaning.trim().length === 0)) {
    throw new Error('Weekly Reading Model cannot expose an empty domain.');
  }
  if (model.watchOut !== null) {
    const watchDecision = model.traceability.decisions.find(
      (item) => item.target === 'WATCH_OUT' && item.action === 'KEEP'
    );
    if (watchDecision === undefined) {
      throw new Error('Watch Out must have an explicit retained decision.');
    }
  }

  const bestWindowDecisions = model.traceability.decisions.filter(
    (item) => item.target === 'BEST_WINDOW'
  );
  if (bestWindowDecisions.some((item) => item.action === 'KEEP' || item.action === 'MERGE')) {
    throw new Error('Best Window cannot compete with the Timeline owner.');
  }

  if (model.authority.status !== 'DEVELOPMENT_ONLY' ||
      model.authority.productionEligible !== false) {
    throw new Error('Weekly Reading Model authority must remain development-only.');
  }
  if (model.schemaVersion.id !== 'NATALNODE_WEEKLY_READING_MODEL_V1') {
    throw new Error('Unexpected Weekly Reading Model schema identity.');
  }
  if (model.astrologerView.available &&
      model.astrologerView.visibility !== 'ADVANCED_ONLY') {
    throw new Error('Astrologer View must remain advanced-only.');
  }
  if (model.share.optionalSecondLine !== null &&
      model.share.optionalSecondLine.trim().length === 0) {
    throw new Error('Share projection cannot expose an empty optional line.');
  }

  assertVisibleSemanticOwnership(model);
  assertNoInternalLeakage(model);
  assertTimelineInvariants(model);
  return model;
}

export function createWeeklyReadingModel(
  draft: WeeklyInterpretationDraft
): WeeklyReadingModel {
  assertDevelopmentOnlyDraft(draft);

  const signals = signalMap(draft);
  const period = makePeriod(draft);
  const heroKey = semanticKey(draft.hero);
  const atAGlanceResult = buildAtAGlance(draft, heroKey, draft.locale);
  const domainsResult = buildDomains(
    draft,
    atAGlanceResult.semanticKeys,
    draft.locale
  );
  const timelineResult = buildTimeline(draft, signals, draft.locale);
  const bestSignalId = bestWindowSignalId(draft, signals);
  const timeline = applyBestWindowEmphasis(
    timelineResult.timeline,
    bestSignalId
  );
  const hero = buildHero(draft, timeline);
  const timelineDecisions = [...timelineResult.decisions];

  if (draft.bestWindow === null) {
    timelineDecisions.push(decision(
      'BEST_WINDOW',
      'OMIT',
      'OMITTED',
      'best-window=none',
      sourceTrace([], [], []),
      'No Best Window editorial block was supplied.'
    ));
  } else if (timeline === null || bestSignalId === null) {
    timelineDecisions.push(decision(
      'BEST_WINDOW',
      'OMIT',
      'OMITTED',
      semanticKey(draft.bestWindow),
      traceForBlock(draft.bestWindow),
      'Best Window cannot be shown without a matching Timeline owner.'
    ));
  } else {
    const bestTrace = traceForBlock(draft.bestWindow);
    const emphasizedEntries = timeline.entries.filter((entry) =>
      entry.emphasis === 'BEST_WINDOW'
    );
    timelineDecisions.push(decision(
      'BEST_WINDOW',
      'DOWNGRADE',
      'TIMELINE',
      semanticKey(draft.bestWindow),
      bestTrace,
      'Best Window is represented as one Timeline emphasis rather than a competing block; entries=' +
        emphasizedEntries.map((entry) => entry.id).join(',')
    ));
  }

  const watchOut = buildWatchOut(draft, signals);
  const watchOutBlock = draft.watchOut;
  const watchOutTrace = watchOutBlock === null
    ? sourceTrace([], [], [])
    : traceForBlock(watchOutBlock);
  timelineDecisions.push(decision(
    'WATCH_OUT',
    watchOut === null ? 'OMIT' : 'KEEP',
    watchOut === null ? 'OMITTED' : 'WATCH_OUT',
    watchOutBlock === null ? 'watch-out=none' : semanticKey(watchOutBlock),
    watchOutTrace,
    watchOut === null
      ? 'No supported challenging or mixed caution is available.'
      : 'One supported caution is retained as the sole primary Watch Out.'
  ));

  const astrologerView = buildAstrologerView(draft, signals);
  const astrologerTrace = draft.astrologerView === null
    ? sourceTrace([], [], [])
    : traceForBlock(draft.astrologerView);
  timelineDecisions.push(decision(
    'ASTROLOGER_VIEW',
    astrologerView.available ? 'ADVANCED_ONLY' : 'OMIT',
    astrologerView.available ? 'ASTROLOGER_VIEW' : 'OMITTED',
    draft.astrologerView === null ? 'astrologer-view=none' : semanticKey(draft.astrologerView),
    astrologerTrace,
    astrologerView.available
      ? 'Technical editorial content remains available only in the advanced layer.'
      : 'This draft style does not include Astrologer’s View content.'
  ));

  const signature = Object.freeze({
    text: draft.signatureLine.text,
    visibility: 'EXPANDABLE' as const,
    traceability: traceForBlock(draft.signatureLine)
  });
  timelineDecisions.push(decision(
    'SIGNATURE',
    'DOWNGRADE',
    'SIGNATURE',
    semanticKey(draft.signatureLine),
    signature.traceability,
    'Signature remains a close/share identity and is not a second Hero.'
  ));

  const whyTrace = traceFromBlocks([
    draft.hero,
    ...draft.coreThemes.map((theme) => theme.content),
    ...domainsResult.domains.map((domain) =>
      draft.traceability.find((block) => block.contentBlockId === domain.traceability.sourceEditorialBlockIds[0])
    ),
    ...(draft.timeline.length > 0 ? draft.timeline.map((entry) => entry.content) : []),
    draft.watchOut
  ]);
  const why = buildWhy(
    draft,
    atAGlanceResult.themes,
    domainsResult.domains,
    timeline,
    timelineResult.hasExplicitTimingEvidence,
    whyTrace
  );
  timelineDecisions.push(decision(
    'WHY',
    'KEEP',
    'WHY',
    'why=selection-policy',
    why.traceability,
    'Why this week explains selection and omission without exposing internal identifiers.'
  ));

  const actions = buildActions(draft.locale);
  timelineDecisions.push(decision(
    'ACTIONS',
    'KEEP',
    'ACTIONS',
    'actions=post-value',
    sourceTrace([], [], []),
    'Actions are metadata for future renderers and do not create runtime controls here.'
  ));

  const share = buildShare(draft);
  const shareTrace = traceFromBlocks([
    draft.shareProjection.hook,
    draft.shareProjection.insight,
    draft.shareProjection.cta
  ]);
  timelineDecisions.push(decision(
    'SHARE',
    'KEEP',
    'SHARE',
    'share=compact',
    shareTrace,
    'Share selects one hook, one insight, the NatalNode identity, and the canonical site only.'
  ));

  const disclosures = draft.birthTimeAuthority === 'UNKNOWN'
    ? freezeArray([unknownTimeDisclosure(draft.locale)])
    : freezeArray([]);
  const screen = buildScreenProjection(
    hero,
    atAGlanceResult.themes,
    domainsResult.domains,
    timeline,
    watchOut,
    why,
    astrologerView,
    actions,
    signature
  );
  const print = buildPrintProjection(
    period,
    hero,
    atAGlanceResult.themes,
    domainsResult.domains,
    timeline,
    watchOut,
    why,
    astrologerView,
    signature
  );

  const traceEntries: WeeklyReadingTraceEntry[] = [
    Object.freeze({ owner: 'HERO' as const, ...hero.traceability }),
    ...atAGlanceResult.themes.map((theme) => Object.freeze({
      owner: 'AT_A_GLANCE' as const,
      ...theme.traceability
    })),
    ...domainsResult.domains.map((domain) => Object.freeze({
      owner: 'DOMAIN' as const,
      ...domain.traceability
    })),
    ...(timeline?.entries.map((entry) => Object.freeze({
      owner: 'TIMELINE' as const,
      ...entry.traceability
    })) ?? []),
    ...(watchOut === null ? [] : [Object.freeze({
      owner: 'WATCH_OUT' as const,
      ...watchOut.traceability
    })]),
    Object.freeze({ owner: 'WHY' as const, ...why.traceability }),
    ...(astrologerView.traceability === null ? [] : [Object.freeze({
      owner: 'ASTROLOGER_VIEW' as const,
      ...astrologerView.traceability
    })]),
    Object.freeze({ owner: 'SIGNATURE' as const, ...signature.traceability }),
    Object.freeze({ owner: 'SHARE' as const, ...shareTrace })
  ];

  const model = Object.freeze({
    schemaVersion: WEEKLY_READING_MODEL_VERSION,
    transformationVersion: WEEKLY_READING_TRANSFORMATION_VERSION,
    authority: Object.freeze({
      status: WEEKLY_READING_MODEL_AUTHORITY,
      productionEligible: false as const
    }),
    locale: draft.locale,
    style: draft.style,
    birthTimeAuthority: draft.birthTimeAuthority,
    editorialVersion: draft.editorialVersion,
    rulesVersion: draft.rulesVersion,
    period,
    hero,
    atAGlance: atAGlanceResult.themes,
    domains: domainsResult.domains,
    timeline,
    watchOut,
    why,
    disclosures,
    astrologerView,
    actions,
    signature,
    share,
    screen,
    print,
    traceability: Object.freeze({
      visibility: 'INTERNAL_ONLY' as const,
      blocks: freezeArray(traceEntries),
      decisions: freezeArray([
        decision(
          'HERO',
          'KEEP',
          'HERO',
          heroKey,
          hero.traceability,
          'The primary weekly meaning has one dominant Hero owner.'
        ),
        ...atAGlanceResult.decisions,
        ...domainsResult.decisions,
        ...timelineDecisions
      ])
    })
  });

  return assertModelInvariants(model);
}

export function assertWeeklyReadingModelInvariants(
  model: WeeklyReadingModel
): WeeklyReadingModel {
  return assertModelInvariants(model);
}
