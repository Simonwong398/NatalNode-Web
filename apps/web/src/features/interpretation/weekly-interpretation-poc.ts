import type {
  InterpretationFactInput,
  InterpretationFactReference,
  InterpretationPeriodIdentity,
  InterpretationPriority,
  InterpretationRuleIdentity,
  InterpretationSignal,
  InterpretationSignalDirection,
  InterpretationSignalIntensity,
  InterpretationSignalRankingMetadata,
  InterpretationSignalRule,
  InterpretationTemporalWindow,
  InterpretationConfidence,
  InterpretationSignalSection,
  InterpretationTimelineSegment,
  WeeklySignalSet
} from './interpretation-signal-contracts.js';
import {
  createInterpretationSignalRuleRegistry,
  INTERPRETATION_RULES_VERSION
} from './interpretation-signal-engine.js';
import {
  composeInterpretationSignalGroup
} from './interpretation-signal-composition.js';
import {
  rankInterpretationSignals,
  type RankedInterpretationSignal
} from './interpretation-signal-ranking.js';

export const WEEKLY_POC_FIXTURE_VERSION = Object.freeze({
  id: 'NATALNODE_WEEKLY_SIGNAL_POC_V1',
  version: '1.0.0'
});

export const WEEKLY_POC_SOURCE_AUTHORITY = 'DEVELOPMENT_FIXTURE' as const;

export const WEEKLY_POC_PERIOD: InterpretationPeriodIdentity & { readonly kind: 'WEEKLY' } =
  Object.freeze({
    kind: 'WEEKLY',
    periodKey: '2026-W37',
    canonicalTimezone: 'America/Los_Angeles',
    startsAt: '2026-09-07T07:00:00.000Z',
    endsAt: '2026-09-14T07:00:00.000Z'
  });

export type WeeklyPocScenarioId =
  | 'SCENARIO_A_SUPPORTIVE_COMMUNICATION'
  | 'SCENARIO_B_MIXED_RELATIONSHIP'
  | 'SCENARIO_C_ACTION_EMOTIONAL_TENSION'
  | 'SCENARIO_D_BACKGROUND_MOMENTARY'
  | 'SCENARIO_E_UNKNOWN_TIME';

export interface WeeklyPocTechnicalFactLabel {
  readonly canonicalPath: string;
  readonly label: string;
}

export interface WeeklyPocScenario {
  readonly scenarioId: WeeklyPocScenarioId;
  readonly title: string;
  readonly purpose: string;
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  readonly sourceAuthority: typeof WEEKLY_POC_SOURCE_AUTHORITY;
  readonly signalSet: WeeklySignalSet;
  readonly technicalFacts: readonly WeeklyPocTechnicalFactLabel[];
}

export interface WeeklySignalThemeGroup {
  readonly theme: string;
  readonly signals: readonly InterpretationSignal[];
  readonly composition: NonNullable<ReturnType<typeof composeInterpretationSignalGroup>>;
  readonly primary: RankedInterpretationSignal;
}

interface WeeklyPocSignalDefinition {
  readonly key: string;
  readonly fact: InterpretationFactInput;
  readonly domain: InterpretationSignal['domain'];
  readonly direction: InterpretationSignalDirection;
  readonly internalStrength: number;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly priority: InterpretationPriority;
  readonly theme: string;
  readonly ranking: InterpretationSignalRankingMetadata;
  readonly temporalWindow?: InterpretationTemporalWindow;
  readonly requiresKnownBirthTime?: boolean;
}

interface WeeklyPocScenarioDefinition {
  readonly scenarioId: WeeklyPocScenarioId;
  readonly title: string;
  readonly purpose: string;
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  readonly facts: readonly InterpretationFactInput[];
  readonly signals: readonly WeeklyPocSignalDefinition[];
  readonly technicalFacts: readonly WeeklyPocTechnicalFactLabel[];
}

function freezeFact(
  canonicalPath: string,
  factKind: InterpretationFactReference['factKind'],
  attributes: Record<string, string | number | boolean | null>
): InterpretationFactInput {
  return Object.freeze({
    reference: Object.freeze({ factKind, canonicalPath }),
    available: true,
    attributes: Object.freeze({ ...attributes })
  });
}

function freezeTemporalWindow(
  startsAt: string,
  peaksAt: string | null,
  endsAt: string
): InterpretationTemporalWindow {
  return Object.freeze({
    startsAt,
    peaksAt,
    endsAt,
    canonicalTimezone: WEEKLY_POC_PERIOD.canonicalTimezone
  });
}

function ruleIdentity(ruleId: string): InterpretationRuleIdentity {
  return Object.freeze({
    ruleId,
    ruleVersion: '1.0.0',
    interpretationRulesVersion: INTERPRETATION_RULES_VERSION
  });
}

function makeRule(
  scenarioId: WeeklyPocScenarioId,
  definition: WeeklyPocSignalDefinition
): InterpretationSignalRule {
  const identity = ruleIdentity(`weekly-poc.${scenarioId}.${definition.key}`);

  return {
    identity,
    prerequisites: {
      requiredFactKinds: [definition.fact.reference.factKind],
      requiresKnownBirthTime: definition.requiresKnownBirthTime ?? true,
      allowedSourceAuthorities: ['DEVELOPMENT_FIXTURE', 'INCOMPLETE_RESEARCH']
    },
    matches: (context) => context.facts.some(
      (fact) => fact.available &&
        fact.reference.canonicalPath === definition.fact.reference.canonicalPath
    ),
    createSignal: () => ({
      signalId: `weekly-poc.${scenarioId}.${definition.key}`,
      domain: definition.domain,
      direction: definition.direction,
      internalStrength: definition.internalStrength,
      intensity: definition.intensity,
      confidence: definition.confidence,
      priority: definition.priority,
      theme: definition.theme,
      temporalWindow: definition.temporalWindow,
      rule: identity,
      ranking: definition.ranking,
      provenance: {
        engineResultReference: `fixture://${WEEKLY_POC_FIXTURE_VERSION.id}/${scenarioId}`,
        sourceFactRefs: [definition.fact.reference],
        scientificConfigurationIdentity: null,
        provenanceEnvelopeId: null
      }
    })
  };
}

function compareGroups(
  left: WeeklySignalThemeGroup,
  right: WeeklySignalThemeGroup
): number {
  if (right.primary.rankingScore !== left.primary.rankingScore) {
    return right.primary.rankingScore - left.primary.rankingScore;
  }

  if (right.primary.signal.internalStrength !== left.primary.signal.internalStrength) {
    return right.primary.signal.internalStrength - left.primary.signal.internalStrength;
  }

  return left.theme.localeCompare(right.theme);
}

export function groupWeeklySignalsByTheme(
  signals: readonly InterpretationSignal[]
): readonly WeeklySignalThemeGroup[] {
  const grouped = new Map<string, InterpretationSignal[]>();

  for (const signal of signals) {
    const themeSignals = grouped.get(signal.theme) ?? [];
    themeSignals.push(signal);
    grouped.set(signal.theme, themeSignals);
  }

  const groups = [...grouped.entries()].map(([theme, themeSignals]) => {
    const ranked = rankInterpretationSignals(themeSignals);
    const composition = composeInterpretationSignalGroup(themeSignals);

    if (composition === null) {
      throw new Error(`Theme ${theme} cannot be composed without Signals.`);
    }

    return Object.freeze({
      theme,
      signals: Object.freeze([...themeSignals]),
      composition,
      primary: ranked[0]
    });
  });

  return Object.freeze(groups.sort(compareGroups));
}

export function selectWeeklyHeroThemeGroup(
  signalSet: Pick<WeeklySignalSet, 'signals'>
): WeeklySignalThemeGroup | null {
  const groups = groupWeeklySignalsByTheme(signalSet.signals);

  if (groups.length === 0) {
    return null;
  }

  const nonMomentaryGroups = groups.filter((group) =>
    group.signals.some((signal) => signal.priority !== 'MOMENTARY')
  );

  return (nonMomentaryGroups.length > 0 ? nonMomentaryGroups : groups)[0] ?? null;
}

function signalSection(signalIds: readonly string[]): InterpretationSignalSection {
  return Object.freeze({ signalIds: Object.freeze([...signalIds]) });
}

function signalIdsForDomains(
  signals: readonly InterpretationSignal[],
  domains: readonly InterpretationSignal['domain'][]
): readonly string[] {
  return Object.freeze(
    signals
      .filter((signal) => domains.includes(signal.domain))
      .map((signal) => signal.signalId)
  );
}

function watchOutSignalIds(
  signals: readonly InterpretationSignal[]
): readonly string[] {
  const challengedThemes = new Set(
    signals
      .filter((signal) => signal.direction === 'CHALLENGING')
      .map((signal) => signal.theme)
  );

  return Object.freeze(
    signals
      .filter((signal) => challengedThemes.has(signal.theme))
      .map((signal) => signal.signalId)
  );
}

function timelineSegments(
  scenarioId: WeeklyPocScenarioId,
  signals: readonly InterpretationSignal[]
): readonly InterpretationTimelineSegment[] {
  return Object.freeze(
    signals
      .filter((signal) => signal.temporalWindow !== undefined)
      .map((signal) => Object.freeze({
        segmentKey: `weekly-poc.${scenarioId}.timeline.${signal.signalId}`,
        startsAt: signal.temporalWindow!.startsAt,
        endsAt: signal.temporalWindow!.endsAt,
        signalIds: Object.freeze([signal.signalId])
      }))
  );
}

function bestWindowSignalId(
  signals: readonly InterpretationSignal[]
): string | null {
  const temporalSignals = signals.filter((signal) => signal.temporalWindow !== undefined);

  if (temporalSignals.length === 0) {
    return null;
  }

  const momentarySignals = temporalSignals.filter((signal) => signal.priority === 'MOMENTARY');
  const ranked = rankInterpretationSignals(
    momentarySignals.length > 0 ? momentarySignals : temporalSignals
  );

  return ranked[0]?.signal.signalId ?? null;
}

function buildWeeklySignalSet(
  definition: WeeklyPocScenarioDefinition
): WeeklySignalSet {
  const registry = createInterpretationSignalRuleRegistry(
    definition.signals.map((signal) => makeRule(definition.scenarioId, signal))
  );
  const evaluation = registry.evaluate({
    sourceAuthority: WEEKLY_POC_SOURCE_AUTHORITY,
    birthTimeAuthority: definition.birthTimeAuthority,
    facts: definition.facts
  });

  if (evaluation.skippedRules.length > 0) {
    throw new Error(
      `Weekly POC fixture ${definition.scenarioId} has skipped rules: ${
        evaluation.skippedRules.map((skip) => `${skip.ruleId}:${skip.reason}`).join(', ')
      }`
    );
  }

  const signals = Object.freeze([...evaluation.signals]);
  const groups = groupWeeklySignalsByTheme(signals);
  const heroGroup = selectWeeklyHeroThemeGroup({ signals });
  const bestWindowId = bestWindowSignalId(signals);

  return Object.freeze({
    period: WEEKLY_POC_PERIOD,
    signals,
    heroTheme: heroGroup?.theme ?? null,
    coreThemes: Object.freeze(groups.slice(0, 3).map((group) => group.theme)),
    timelineSegments: timelineSegments(definition.scenarioId, signals),
    relationship: signalSection(signalIdsForDomains(signals, ['RELATIONSHIP'])),
    workCreation: signalSection(signalIdsForDomains(signals, ['WORK_CREATION'])),
    innerState: signalSection(signalIdsForDomains(signals, ['SELF', 'EMOTIONAL'])),
    actionDecision: signalSection(signalIdsForDomains(signals, ['ACTION_DECISION'])),
    watchOut: signalSection(watchOutSignalIds(signals)),
    bestWindow: bestWindowId === null ? null : signalSection([bestWindowId]),
    astrologerView: signalSection(signals.map((signal) => signal.signalId)),
    quoteSlot: heroGroup === null
      ? null
      : Object.freeze({
        signalIds: Object.freeze([heroGroup.composition.dominantSignalId]),
        maxCharacters: 320
      }),
    provenance: Object.freeze(signals.map((signal) => signal.provenance))
  });
}

const MONDAY = '2026-09-07T07:00:00.000Z';
const TUESDAY = '2026-09-08T07:00:00.000Z';
const WEDNESDAY = '2026-09-09T07:00:00.000Z';
const THURSDAY = '2026-09-10T07:00:00.000Z';
const FRIDAY = '2026-09-11T07:00:00.000Z';
const SATURDAY = '2026-09-12T07:00:00.000Z';
const SUNDAY_END = '2026-09-14T07:00:00.000Z';

const SCENARIO_DEFINITIONS: readonly WeeklyPocScenarioDefinition[] = [
  {
    scenarioId: 'SCENARIO_A_SUPPORTIVE_COMMUNICATION',
    title: 'Supportive communication week',
    purpose: 'Test useful positive communication content without generic praise.',
    birthTimeAuthority: 'KNOWN',
    facts: [
      freezeFact('/bodies/Mercury', 'NATAL_BODY_POSITION', {
        body: 'Mercury',
        factRole: 'communication'
      }),
      freezeFact('/aspects/0', 'NATAL_ASPECT', {
        firstBody: 'Mercury',
        secondBody: 'Mars',
        aspectType: 'TRINE'
      })
    ],
    signals: [
      {
        key: 'communication',
        fact: freezeFact('/bodies/Mercury', 'NATAL_BODY_POSITION', {
          body: 'Mercury',
          factRole: 'communication'
        }),
        domain: 'COMMUNICATION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.84,
        intensity: 'STRONG',
        confidence: 'HIGH',
        priority: 'ACTIVE',
        theme: 'clear-communication',
        ranking: {
          baseImportance: 0.9,
          evidenceStrength: 0.86,
          temporalRelevance: 0.72,
          durationWeight: 0.66,
          repetitionPenalty: 0.04
        },
        temporalWindow: freezeTemporalWindow(MONDAY, WEDNESDAY, FRIDAY)
      },
      {
        key: 'next-step',
        fact: freezeFact('/aspects/0', 'NATAL_ASPECT', {
          firstBody: 'Mercury',
          secondBody: 'Mars',
          aspectType: 'TRINE'
        }),
        domain: 'ACTION_DECISION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.66,
        intensity: 'NOTICEABLE',
        confidence: 'MEDIUM',
        priority: 'THEMATIC',
        theme: 'deliberate-next-step',
        ranking: {
          baseImportance: 0.68,
          evidenceStrength: 0.78,
          temporalRelevance: 0.64,
          durationWeight: 0.42,
          repetitionPenalty: 0.02
        },
        temporalWindow: freezeTemporalWindow(FRIDAY, SATURDAY, SUNDAY_END)
      }
    ],
    technicalFacts: [
      { canonicalPath: '/bodies/Mercury', label: 'Mercury position' },
      { canonicalPath: '/aspects/0', label: 'Mercury–Mars trine' }
    ]
  },
  {
    scenarioId: 'SCENARIO_B_MIXED_RELATIONSHIP',
    title: 'Mixed relationship week',
    purpose: 'Test nuanced relationship content when support and friction coexist.',
    birthTimeAuthority: 'KNOWN',
    facts: [
      freezeFact('/bodies/Venus', 'NATAL_BODY_POSITION', {
        body: 'Venus',
        factRole: 'relationship'
      }),
      freezeFact('/aspects/1', 'NATAL_ASPECT', {
        firstBody: 'Venus',
        secondBody: 'Saturn',
        aspectType: 'SQUARE'
      })
    ],
    signals: [
      {
        key: 'relationship-support',
        fact: freezeFact('/bodies/Venus', 'NATAL_BODY_POSITION', {
          body: 'Venus',
          factRole: 'relationship'
        }),
        domain: 'RELATIONSHIP',
        direction: 'SUPPORTIVE',
        internalStrength: 0.78,
        intensity: 'STRONG',
        confidence: 'HIGH',
        priority: 'ACTIVE',
        theme: 'relationship-pace',
        ranking: {
          baseImportance: 0.82,
          evidenceStrength: 0.84,
          temporalRelevance: 0.7,
          durationWeight: 0.58,
          repetitionPenalty: 0.03
        },
        temporalWindow: freezeTemporalWindow(MONDAY, TUESDAY, THURSDAY)
      },
      {
        key: 'relationship-challenge',
        fact: freezeFact('/aspects/1', 'NATAL_ASPECT', {
          firstBody: 'Venus',
          secondBody: 'Saturn',
          aspectType: 'SQUARE'
        }),
        domain: 'RELATIONSHIP',
        direction: 'CHALLENGING',
        internalStrength: 0.72,
        intensity: 'STRONG',
        confidence: 'MEDIUM',
        priority: 'THEMATIC',
        theme: 'relationship-pace',
        ranking: {
          baseImportance: 0.78,
          evidenceStrength: 0.72,
          temporalRelevance: 0.74,
          durationWeight: 0.52,
          repetitionPenalty: 0.05
        },
        temporalWindow: freezeTemporalWindow(WEDNESDAY, FRIDAY, SUNDAY_END)
      }
    ],
    technicalFacts: [
      { canonicalPath: '/bodies/Venus', label: 'Venus position' },
      { canonicalPath: '/aspects/1', label: 'Venus–Saturn square' }
    ]
  },
  {
    scenarioId: 'SCENARIO_C_ACTION_EMOTIONAL_TENSION',
    title: 'Action versus emotional tension',
    purpose: 'Test apparently contradictory action and emotional themes.',
    birthTimeAuthority: 'KNOWN',
    facts: [
      freezeFact('/aspects/2', 'NATAL_ASPECT', {
        firstBody: 'Mars',
        secondBody: 'Jupiter',
        aspectType: 'TRINE'
      }),
      freezeFact('/bodies/Moon', 'NATAL_BODY_POSITION', {
        body: 'Moon',
        factRole: 'emotional'
      })
    ],
    signals: [
      {
        key: 'forward-action',
        fact: freezeFact('/aspects/2', 'NATAL_ASPECT', {
          firstBody: 'Mars',
          secondBody: 'Jupiter',
          aspectType: 'TRINE'
        }),
        domain: 'ACTION_DECISION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.83,
        intensity: 'STRONG',
        confidence: 'HIGH',
        priority: 'ACTIVE',
        theme: 'forward-action',
        ranking: {
          baseImportance: 0.88,
          evidenceStrength: 0.86,
          temporalRelevance: 0.78,
          durationWeight: 0.54,
          repetitionPenalty: 0.03
        },
        temporalWindow: freezeTemporalWindow(MONDAY, TUESDAY, THURSDAY)
      },
      {
        key: 'reactive-emotion',
        fact: freezeFact('/bodies/Moon', 'NATAL_BODY_POSITION', {
          body: 'Moon',
          factRole: 'emotional'
        }),
        domain: 'EMOTIONAL',
        direction: 'CHALLENGING',
        internalStrength: 0.81,
        intensity: 'STRONG',
        confidence: 'MEDIUM',
        priority: 'ACTIVE',
        theme: 'reactive-emotion',
        ranking: {
          baseImportance: 0.8,
          evidenceStrength: 0.7,
          temporalRelevance: 0.76,
          durationWeight: 0.38,
          repetitionPenalty: 0.04
        },
        temporalWindow: freezeTemporalWindow(WEDNESDAY, FRIDAY, SUNDAY_END)
      }
    ],
    technicalFacts: [
      { canonicalPath: '/aspects/2', label: 'Mars–Jupiter trine' },
      { canonicalPath: '/bodies/Moon', label: 'Moon position' }
    ]
  },
  {
    scenarioId: 'SCENARIO_D_BACKGROUND_MOMENTARY',
    title: 'Background theme and momentary window',
    purpose: 'Distinguish a longer weekly theme from a short timing window.',
    birthTimeAuthority: 'KNOWN',
    facts: [
      freezeFact('/bodies/Saturn', 'NATAL_BODY_POSITION', {
        body: 'Saturn',
        factRole: 'work-creation'
      }),
      freezeFact('/aspects/3', 'NATAL_ASPECT', {
        firstBody: 'Mercury',
        secondBody: 'Saturn',
        aspectType: 'SEXTILE',
        timing: 'explicit'
      })
    ],
    signals: [
      {
        key: 'steady-progress',
        fact: freezeFact('/bodies/Saturn', 'NATAL_BODY_POSITION', {
          body: 'Saturn',
          factRole: 'work-creation'
        }),
        domain: 'WORK_CREATION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.59,
        intensity: 'NOTICEABLE',
        confidence: 'MEDIUM',
        priority: 'THEMATIC',
        theme: 'steady-progress',
        ranking: {
          baseImportance: 0.74,
          evidenceStrength: 0.76,
          temporalRelevance: 0.42,
          durationWeight: 0.94,
          repetitionPenalty: 0.02
        },
        temporalWindow: freezeTemporalWindow(MONDAY, null, SUNDAY_END)
      },
      {
        key: 'decision-window',
        fact: freezeFact('/aspects/3', 'NATAL_ASPECT', {
          firstBody: 'Mercury',
          secondBody: 'Saturn',
          aspectType: 'SEXTILE',
          timing: 'explicit'
        }),
        domain: 'ACTION_DECISION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.8,
        intensity: 'STRONG',
        confidence: 'HIGH',
        priority: 'MOMENTARY',
        theme: 'decision-window',
        ranking: {
          baseImportance: 0.78,
          evidenceStrength: 0.88,
          temporalRelevance: 0.96,
          durationWeight: 0.18,
          repetitionPenalty: 0
        },
        temporalWindow: freezeTemporalWindow(FRIDAY, SATURDAY, SUNDAY_END)
      }
    ],
    technicalFacts: [
      { canonicalPath: '/bodies/Saturn', label: 'Saturn position' },
      { canonicalPath: '/aspects/3', label: 'supplied aspect timing' }
    ]
  },
  {
    scenarioId: 'SCENARIO_E_UNKNOWN_TIME',
    title: 'Useful reading with unknown birth time',
    purpose: 'Prove useful content without inventing houses, ASC, or MC authority.',
    birthTimeAuthority: 'UNKNOWN',
    facts: [
      freezeFact('/bodies/Sun', 'NATAL_BODY_POSITION', {
        body: 'Sun',
        factRole: 'self-observation'
      }),
      freezeFact('/bodies/Mercury', 'NATAL_BODY_POSITION', {
        body: 'Mercury',
        factRole: 'communication'
      })
    ],
    signals: [
      {
        key: 'self-observation',
        fact: freezeFact('/bodies/Sun', 'NATAL_BODY_POSITION', {
          body: 'Sun',
          factRole: 'self-observation'
        }),
        domain: 'SELF',
        direction: 'SUPPORTIVE',
        internalStrength: 0.62,
        intensity: 'NOTICEABLE',
        confidence: 'MEDIUM',
        priority: 'THEMATIC',
        theme: 'self-observation',
        ranking: {
          baseImportance: 0.72,
          evidenceStrength: 0.74,
          temporalRelevance: 0.34,
          durationWeight: 0.8,
          repetitionPenalty: 0.01
        },
        requiresKnownBirthTime: false
      },
      {
        key: 'simple-language',
        fact: freezeFact('/bodies/Mercury', 'NATAL_BODY_POSITION', {
          body: 'Mercury',
          factRole: 'communication'
        }),
        domain: 'COMMUNICATION',
        direction: 'SUPPORTIVE',
        internalStrength: 0.58,
        intensity: 'NOTICEABLE',
        confidence: 'MEDIUM',
        priority: 'THEMATIC',
        theme: 'simple-language',
        ranking: {
          baseImportance: 0.68,
          evidenceStrength: 0.72,
          temporalRelevance: 0.3,
          durationWeight: 0.78,
          repetitionPenalty: 0.01
        },
        requiresKnownBirthTime: false
      }
    ],
    technicalFacts: [
      { canonicalPath: '/bodies/Sun', label: 'Sun position' },
      { canonicalPath: '/bodies/Mercury', label: 'Mercury position' }
    ]
  }
];

function buildScenario(definition: WeeklyPocScenarioDefinition): WeeklyPocScenario {
  const signalSet = buildWeeklySignalSet(definition);

  return Object.freeze({
    scenarioId: definition.scenarioId,
    title: definition.title,
    purpose: definition.purpose,
    birthTimeAuthority: definition.birthTimeAuthority,
    sourceAuthority: WEEKLY_POC_SOURCE_AUTHORITY,
    signalSet,
    technicalFacts: Object.freeze(
      definition.technicalFacts.map((fact) => Object.freeze({ ...fact }))
    )
  });
}

export const WEEKLY_POC_SCENARIOS: readonly WeeklyPocScenario[] = Object.freeze(
  SCENARIO_DEFINITIONS.map(buildScenario)
);

export function createWeeklyPocScenarios(): readonly WeeklyPocScenario[] {
  return WEEKLY_POC_SCENARIOS;
}

export function getWeeklyPocScenario(
  scenarioId: WeeklyPocScenarioId
): WeeklyPocScenario {
  const scenario = WEEKLY_POC_SCENARIOS.find((candidate) => candidate.scenarioId === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown Weekly POC scenario ${scenarioId}.`);
  }

  return scenario;
}
