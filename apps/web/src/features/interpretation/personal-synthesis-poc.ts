/**
 * Development-only proof of deterministic personal theme synthesis.
 *
 * This module deliberately stops at a research harness. It consumes the
 * existing InterpretationFactInput and Signal contracts, uses the immutable
 * Signal rule registry, and is not exported by the production interpretation
 * index or connected to a route.
 */

import type {
  InterpretationConfidence,
  InterpretationFactInput,
  InterpretationFactReference,
  InterpretationSignal,
  InterpretationSignalDirection,
  InterpretationSignalIntensity,
  InterpretationSignalRankingMetadata,
  InterpretationSignalSourceAuthority,
  InterpretationRuleIdentity,
  InterpretationSignalRule
} from './interpretation-signal-contracts.js';
import {
  createInterpretationSignalRuleRegistry,
  INTERPRETATION_RULES_VERSION
} from './interpretation-signal-engine.js';
import { composeInterpretationSignalGroup } from './interpretation-signal-composition.js';
import { rankInterpretationSignals } from './interpretation-signal-ranking.js';

export const PERSONAL_SYNTHESIS_POC_FIXTURE_VERSION = Object.freeze({
  id: 'NATALNODE_PERSONAL_SYNTHESIS_POC_V1',
  version: '1.0.0'
});

export const PERSONAL_SYNTHESIS_POC_SOURCE_AUTHORITY =
  'DEVELOPMENT_FIXTURE' as const;

/**
 * These are the five representative Human Knowledge R2 objects accepted as
 * bounded editorial inputs. The package remains RUNTIME_NOT_ADMITTED; this
 * allowlist is POC validation, not a production canon import.
 */
export const PERSONAL_SYNTHESIS_POC_SEMANTIC_BASIS_IDS = Object.freeze([
  'body.moon',
  'body.mercury',
  'sign.aries',
  'modality.fixed',
  'rulership.basic'
] as const);

export type PersonalSynthesisSemanticBasisId =
  (typeof PERSONAL_SYNTHESIS_POC_SEMANTIC_BASIS_IDS)[number];

export type PersonalSynthesisLifeQuestion =
  | 'SELF_DIRECTION'
  | 'EMOTIONAL_PATTERNS'
  | 'COMMUNICATION'
  | 'RELATIONSHIPS'
  | 'WORK_CREATION'
  | 'DECISIONS_ACTION';

export type PersonalSynthesisEditorialTemplateId =
  | 'communication-clarity'
  | 'deliberate-action'
  | 'relationship-boundary'
  | 'work-continuity'
  | 'self-direction'
  | 'emotional-pacing';

type StructuralCentrality = 'CORE' | 'SUPPORTING';
type DomainRelevance = 'DIRECT' | 'CONTEXTUAL';
type UserQuestionRelevance = 'DIRECT' | 'NOT_SPECIFIED';

export interface PersonalSynthesisChartFacts {
  readonly sourceAuthority: typeof PERSONAL_SYNTHESIS_POC_SOURCE_AUTHORITY;
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  /** Existing provider-neutral fact inputs; no Web astronomy is calculated. */
  readonly facts: readonly InterpretationFactInput[];
}

export interface PersonalSynthesisCandidateDefinition {
  readonly candidateKey: string;
  /** The semantic candidate grouping key; this is not prose. */
  readonly semanticThemeKey: string;
  readonly editorialTemplateId: string;
  readonly fact: InterpretationFactInput;
  readonly factLabel: string;
  readonly semanticBasisId: string;
  readonly compositionRuleId: string;
  /** Same key means candidates may converge into one theme. */
  readonly convergenceKey: string;
  /** Same key across different theme keys means redundant alternatives. */
  readonly redundancyKey: string;
  /** Same key does not count as independent convergence. */
  readonly independentEvidenceKey: string;
  readonly domain: InterpretationSignal['domain'];
  readonly direction: InterpretationSignalDirection;
  readonly internalStrength: number;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly priority: InterpretationSignal['priority'];
  readonly ranking: InterpretationSignalRankingMetadata;
  readonly structuralCentrality: StructuralCentrality;
  readonly domainRelevance: DomainRelevance;
  readonly userQuestionRelevance: UserQuestionRelevance;
  readonly requiresKnownBirthTime: boolean;
}

export interface PersonalSynthesisFixture {
  readonly scenarioId: string;
  readonly title: string;
  readonly purpose: string;
  readonly chartFacts: PersonalSynthesisChartFacts;
  readonly candidates: readonly PersonalSynthesisCandidateDefinition[];
}

export interface PersonalSynthesisLearnReference {
  readonly objectId: string;
  readonly label: string;
}

export interface PersonalSynthesisDeeperReference {
  readonly objectId: string;
  readonly label: string;
}

export interface PersonalSynthesisWhyTrace {
  readonly text: string;
  readonly sourceChartFacts: readonly InterpretationFactReference[];
  readonly semanticBasisIds: readonly string[];
  readonly compositionRuleRefs: readonly string[];
  readonly convergenceKey: string;
  readonly convergence: {
    readonly status: 'CONVERGENT' | 'SINGLE_EVIDENCE';
    readonly independentEvidenceKeys: readonly string[];
    readonly sourceSignalIds: readonly string[];
  };
  readonly tension: {
    readonly status: 'MIXED' | 'SINGLE_DIRECTION';
    readonly supportiveSignalIds: readonly string[];
    readonly challengingSignalIds: readonly string[];
  };
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  readonly requiresKnownBirthTime: boolean;
  readonly confidence: InterpretationConfidence;
  readonly learnReferences: readonly PersonalSynthesisLearnReference[];
}

export interface PersonalSynthesisEditorialProjection {
  readonly recognition: string;
  readonly strength: string;
  readonly pattern: string;
  readonly tension: string;
  readonly lever: string;
  readonly why: PersonalSynthesisWhyTrace;
  readonly learnReferences: readonly PersonalSynthesisLearnReference[];
  readonly deeperReferences: readonly PersonalSynthesisDeeperReference[];
}

export interface PersonalSynthesisRankingRationale {
  readonly structuralCentrality: StructuralCentrality;
  readonly domainRelevance: DomainRelevance;
  readonly userQuestionRelevance: 'DIRECT' | 'NOT_MATCHED';
  readonly convergence: 'CONVERGENT' | 'SINGLE_EVIDENCE';
  readonly tension: 'MIXED' | 'SINGLE_DIRECTION';
  readonly confidence: InterpretationConfidence;
  readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  /** Existing Signal rank used only as a deterministic internal tie-break. */
  readonly primarySignalRank: number;
  readonly rationale: readonly string[];
}

export interface PersonalSynthesisPersonalTheme {
  readonly themeId: string;
  readonly semanticThemeKey: string;
  readonly domain: InterpretationSignal['domain'];
  readonly contributingDomains: readonly InterpretationSignal['domain'][];
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly sourceSignalIds: readonly string[];
  readonly evidenceRefs: readonly InterpretationFactReference[];
  readonly semanticBasisIds: readonly string[];
  readonly compositionRuleRefs: readonly string[];
  readonly convergenceKey: string;
  readonly authorityRequirements: {
    readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  };
  readonly ranking: PersonalSynthesisRankingRationale & { readonly rank: number };
  readonly convergence: {
    readonly status: 'CONVERGENT' | 'SINGLE_EVIDENCE';
    readonly independentEvidenceKeys: readonly string[];
  };
  readonly redundancy: {
    readonly redundancyKey: string;
    readonly suppressedThemeKeys: readonly string[];
  };
  readonly lifeQuestions: readonly PersonalSynthesisLifeQuestion[];
  readonly editorial: PersonalSynthesisEditorialProjection;
}

export type PersonalSynthesisCandidateDecision =
  | 'SELECTED'
  | 'MERGED_CONVERGENCE'
  | 'MERGED_SAME_EVIDENCE'
  | 'SUPPRESSED_REDUNDANCY'
  | 'NOT_SELECTED_THEME_CAP'
  | 'SKIPPED_AUTHORITY';

export interface PersonalSynthesisCandidateTrace {
  readonly candidateKey: string;
  readonly signalId: string;
  readonly semanticThemeKey: string;
  readonly convergenceKey: string;
  readonly factReference: InterpretationFactReference;
  readonly semanticBasisId: string;
  readonly compositionRuleId: string;
  readonly decision: PersonalSynthesisCandidateDecision;
  readonly decisionReason: string;
  readonly signalRank: number | null;
  readonly skippedReason: string | null;
}

export interface PersonalSynthesisResult {
  readonly scenarioId: string;
  readonly title: string;
  readonly purpose: string;
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  readonly fixtureVersion: typeof PERSONAL_SYNTHESIS_POC_FIXTURE_VERSION;
  readonly semanticBasisStatus: 'RUNTIME_NOT_ADMITTED';
  readonly evaluatedSignals: readonly InterpretationSignal[];
  readonly skippedRules: readonly { readonly ruleId: string; readonly reason: string }[];
  readonly candidateTrace: readonly PersonalSynthesisCandidateTrace[];
  readonly coreThemes: readonly PersonalSynthesisPersonalTheme[];
  /** Explicit comparison material for the review dossier, not a reading output. */
  readonly naiveFactDump: readonly string[];
}

interface PersonalEditorialTemplate {
  readonly templateId: PersonalSynthesisEditorialTemplateId;
  readonly domain: InterpretationSignal['domain'];
  readonly allowedSemanticBasisIds: readonly PersonalSynthesisSemanticBasisId[];
  readonly lifeQuestions: readonly PersonalSynthesisLifeQuestion[];
  readonly learnReferences: readonly PersonalSynthesisLearnReference[];
  readonly deeperReferences: readonly PersonalSynthesisDeeperReference[];
  readonly recognition: string;
  readonly strength: string;
  readonly pattern: string;
  readonly tension: string;
  readonly lever: string;
  readonly whyLead: string;
}

const PERSONAL_EDITORIAL_TEMPLATES: Readonly<
  Record<PersonalSynthesisEditorialTemplateId, PersonalEditorialTemplate>
> = Object.freeze({
  'communication-clarity': {
    templateId: 'communication-clarity',
    domain: 'COMMUNICATION',
    allowedSemanticBasisIds: ['body.mercury', 'body.moon'],
    lifeQuestions: ['COMMUNICATION'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'body.mercury', label: 'Learn Mercury' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} clear exchange a useful question in this chart.',
    strength: 'The structure supports naming the useful point before the explanation expands.',
    pattern: 'Attention may gather around making a message legible and answerable.',
    tension: 'Directness can become too much framing if room for another response disappears.',
    lever: 'Name the point in one sentence, then pause for the response before adding context.',
    whyLead: 'The communication theme uses an admitted body-level semantic basis to frame a question about exchange, not a guarantee about another person’s response.'
  },
  'deliberate-action': {
    templateId: 'deliberate-action',
    domain: 'ACTION_DECISION',
    allowedSemanticBasisIds: ['sign.aries', 'modality.fixed'],
    lifeQuestions: ['DECISIONS_ACTION'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'sign.aries', label: 'Learn Aries' }),
      Object.freeze({ objectId: 'modality.fixed', label: 'Learn Fixed modality' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} the first useful step a live question in this chart.',
    strength: 'The structure supports beginning or activating one defined move.',
    pattern: 'Decision attention may gather around momentum, pacing, and what is ready to move.',
    tension: 'Momentum can outrun pacing, while caution can keep a usable first step in draft form.',
    lever: 'Name the first reversible step and the information still missing before expanding the plan.',
    whyLead: 'The action theme keeps initiation and continuation together as a bounded trade-off; it does not turn either layer into a fixed personality claim.'
  },
  'relationship-boundary': {
    templateId: 'relationship-boundary',
    domain: 'RELATIONSHIP',
    allowedSemanticBasisIds: ['body.moon', 'rulership.basic'],
    lifeQuestions: ['RELATIONSHIPS'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'body.moon', label: 'Learn the Moon' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} closeness and boundaries a useful question in this chart.',
    strength: 'The structure supports noticing what helps connection remain responsive rather than automatic.',
    pattern: 'Relationship attention may gather around receptivity, distance, and the pace of response.',
    tension: 'Protecting steadiness can also reduce openness if a boundary is treated as a conclusion.',
    lever: 'Name the boundary and the connection it is meant to protect before deciding what distance means.',
    whyLead: 'The relationship theme uses a bounded response or relationship layer; it does not predict another person’s behavior or guarantee closeness.'
  },
  'work-continuity': {
    templateId: 'work-continuity',
    domain: 'WORK_CREATION',
    allowedSemanticBasisIds: ['modality.fixed', 'body.mercury'],
    lifeQuestions: ['WORK_CREATION'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'modality.fixed', label: 'Learn Fixed modality' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} continuity and output a useful question in this chart.',
    strength: 'The structure supports keeping a meaningful process in view long enough to develop it.',
    pattern: 'Work or creation attention may gather around maintenance, sequencing, and finishing conditions.',
    tension: 'Continuity can become inertia when the process is preserved after its purpose has changed.',
    lever: 'Choose one part of the process to maintain and one signal that would justify changing it.',
    whyLead: 'The work theme uses a bounded continuation or information layer to discuss process, not status, productivity worth, or guaranteed success.'
  },
  'self-direction': {
    templateId: 'self-direction',
    domain: 'SELF',
    allowedSemanticBasisIds: ['sign.aries', 'body.mercury'],
    lifeQuestions: ['SELF_DIRECTION'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'sign.aries', label: 'Learn Aries' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} self-direction and agency a useful question in this chart.',
    strength: 'The structure supports identifying a direction and giving it a first form.',
    pattern: 'Self-direction attention may gather around initiative, naming a priority, and choosing a starting point.',
    tension: 'A clear first direction can narrow the field too quickly if context is treated as irrelevant.',
    lever: 'State the direction, then name the piece of context that could revise the next step.',
    whyLead: 'The self-direction theme uses a bounded initiating or naming layer; it does not define the whole person or promise a life outcome.'
  },
  'emotional-pacing': {
    templateId: 'emotional-pacing',
    domain: 'EMOTIONAL',
    allowedSemanticBasisIds: ['body.moon'],
    lifeQuestions: ['EMOTIONAL_PATTERNS'],
    learnReferences: Object.freeze([
      Object.freeze({ objectId: 'body.moon', label: 'Learn the Moon' })
    ]),
    deeperReferences: Object.freeze([
      Object.freeze({ objectId: 'knowledge.counterevidence', label: 'Review limits and counterevidence' })
    ]),
    recognition: 'The supplied {{anchor}} {{verb}} response, rhythm, and steadiness a useful question in this chart.',
    strength: 'The structure supports noticing what helps a response settle before a deliberate choice.',
    pattern: 'Emotional attention may gather around familiar rhythms, receptivity, and the pace of inner response.',
    tension: 'A familiar response can feel safe while still narrowing the range of available choices.',
    lever: 'Name the first response, then allow one additional observation before treating it as a decision.',
    whyLead: 'The emotional theme uses a bounded Moon-related response layer; it does not diagnose emotional health or define a complete emotional life.'
  }
});

const CONFIDENCE_ORDER: Readonly<Record<InterpretationConfidence, number>> =
  Object.freeze({ HIGH: 3, MEDIUM: 2, LOW: 1 });

const CENTRALITY_ORDER: Readonly<Record<StructuralCentrality, number>> =
  Object.freeze({ CORE: 2, SUPPORTING: 1 });

const DOMAIN_RELEVANCE_ORDER: Readonly<Record<DomainRelevance, number>> =
  Object.freeze({ DIRECT: 2, CONTEXTUAL: 1 });

const TIME_SENSITIVE_FACT_KINDS = new Set([
  'NATAL_ANGLE_POSITION',
  'NATAL_HOUSE_PLACEMENT',
  'TRANSIT_BODY_POSITION',
  'TRANSIT_NATAL_ASPECT',
  'TRANSIT_NATAL_ANGLE',
  'TRANSIT_HOUSE_PLACEMENT',
  'MOON_PHASE',
  'MOTION_STATE',
  'TIME_AUTHORITY'
]);

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)]);
}

function factReferenceKey(reference: InterpretationFactReference): string {
  return `${reference.factKind}|${reference.canonicalFactIdentity ?? reference.canonicalPath}`;
}

function nonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function fact(
  canonicalPath: string,
  factKind: InterpretationFactReference['factKind'],
  attributes: Record<string, string | number | boolean | null>,
  available = true
): InterpretationFactInput {
  nonEmpty(canonicalPath, 'Personal synthesis fact canonicalPath');
  return Object.freeze({
    reference: Object.freeze({ factKind, canonicalPath }),
    available,
    attributes: Object.freeze({ ...attributes })
  });
}

function ranking(
  baseImportance: number,
  evidenceStrength: number,
  repetitionPenalty = 0
): InterpretationSignalRankingMetadata {
  return Object.freeze({
    baseImportance,
    evidenceStrength,
    temporalRelevance: 0,
    durationWeight: 0.5,
    repetitionPenalty
  });
}

function candidate(
  definition: Omit<PersonalSynthesisCandidateDefinition, 'fact'> & {
    readonly fact: InterpretationFactInput;
  }
): PersonalSynthesisCandidateDefinition {
  return Object.freeze({
    ...definition,
    fact: Object.freeze({
      ...definition.fact,
      reference: Object.freeze({ ...definition.fact.reference }),
      attributes: Object.freeze({ ...definition.fact.attributes })
    })
  });
}

function fixture(
  scenarioId: string,
  title: string,
  purpose: string,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN',
  facts: readonly InterpretationFactInput[],
  candidates: readonly PersonalSynthesisCandidateDefinition[]
): PersonalSynthesisFixture {
  return Object.freeze({
    scenarioId,
    title,
    purpose,
    chartFacts: Object.freeze({
      sourceAuthority: PERSONAL_SYNTHESIS_POC_SOURCE_AUTHORITY,
      birthTimeAuthority,
      facts: freezeArray(facts)
    }),
    candidates: freezeArray(candidates)
  });
}

function ruleIdentity(ruleId: string): InterpretationRuleIdentity {
  return Object.freeze({
    ruleId,
    ruleVersion: '1.0.0',
    interpretationRulesVersion: INTERPRETATION_RULES_VERSION
  });
}

function validateCandidateDefinition(
  definition: PersonalSynthesisCandidateDefinition
): PersonalEditorialTemplate {
  nonEmpty(definition.candidateKey, 'Candidate key');
  nonEmpty(definition.semanticThemeKey, 'Candidate semanticThemeKey');
  nonEmpty(definition.semanticBasisId, 'Candidate semanticBasisId');
  nonEmpty(definition.compositionRuleId, 'Candidate compositionRuleId');
  nonEmpty(definition.factLabel, 'Candidate factLabel');

  if (!PERSONAL_SYNTHESIS_POC_SEMANTIC_BASIS_IDS.includes(
    definition.semanticBasisId as PersonalSynthesisSemanticBasisId
  )) {
    throw new Error(
      `Candidate ${definition.candidateKey} uses unsupported semantic basis ${definition.semanticBasisId}.`
    );
  }

  const template = PERSONAL_EDITORIAL_TEMPLATES[
    definition.editorialTemplateId as PersonalSynthesisEditorialTemplateId
  ];
  if (template === undefined || template.templateId !== definition.editorialTemplateId) {
    throw new Error(
      `Candidate ${definition.candidateKey} uses unsupported editorial template ${definition.editorialTemplateId}.`
    );
  }

  if (template.domain !== definition.domain) {
    throw new Error(
      `Candidate ${definition.candidateKey} assigns ${definition.domain} to ${template.templateId}, expected ${template.domain}.`
    );
  }

  if (!template.allowedSemanticBasisIds.includes(
    definition.semanticBasisId as PersonalSynthesisSemanticBasisId
  )) {
    throw new Error(
      `Candidate ${definition.candidateKey} combines ${definition.semanticBasisId} with incompatible template ${template.templateId}.`
    );
  }

  if (
    TIME_SENSITIVE_FACT_KINDS.has(definition.fact.reference.factKind) &&
    !definition.requiresKnownBirthTime
  ) {
    throw new Error(
      `Candidate ${definition.candidateKey} must require known birth time for ${definition.fact.reference.factKind}.`
    );
  }

  return template;
}

function createCandidateRule(
  fixtureId: string,
  definition: PersonalSynthesisCandidateDefinition
): InterpretationSignalRule {
  const identity = ruleIdentity(`personal-synthesis.${fixtureId}.${definition.candidateKey}`);

  return {
    identity,
    prerequisites: {
      requiredFactKinds: [definition.fact.reference.factKind],
      requiresKnownBirthTime: definition.requiresKnownBirthTime,
      allowedSourceAuthorities: [PERSONAL_SYNTHESIS_POC_SOURCE_AUTHORITY]
    },
    matches: (context) => context.facts.some(
      (input) => input.available &&
        input.reference.canonicalPath === definition.fact.reference.canonicalPath
    ),
    createSignal: () => ({
      signalId: `personal-synthesis.${fixtureId}.${definition.candidateKey}`,
      domain: definition.domain,
      direction: definition.direction,
      internalStrength: definition.internalStrength,
      intensity: definition.intensity,
      confidence: definition.confidence,
      priority: definition.priority,
      theme: definition.semanticThemeKey,
      rule: identity,
      ranking: definition.ranking,
      provenance: {
        engineResultReference: `fixture://${PERSONAL_SYNTHESIS_POC_FIXTURE_VERSION.id}/${fixtureId}`,
        sourceFactRefs: [definition.fact.reference],
        scientificConfigurationIdentity: null,
        provenanceEnvelopeId: null
      }
    })
  };
}

interface PersonalThemeGroup {
  readonly semanticThemeKey: string;
  readonly convergenceKey: string;
  readonly redundancyKey: string;
  readonly signals: readonly InterpretationSignal[];
  readonly definitions: readonly PersonalSynthesisCandidateDefinition[];
  readonly composition: NonNullable<ReturnType<typeof composeInterpretationSignalGroup>>;
  readonly primarySignalId: string;
  readonly primarySignalRank: number;
  readonly template: PersonalEditorialTemplate;
  readonly convergence: 'CONVERGENT' | 'SINGLE_EVIDENCE';
  readonly independentEvidenceKeys: readonly string[];
  readonly confidence: InterpretationConfidence;
  readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  readonly ranking: PersonalSynthesisRankingRationale;
}

function combineConfidence(
  definitions: readonly PersonalSynthesisCandidateDefinition[]
): InterpretationConfidence {
  const weakest = Math.min(...definitions.map((definition) => CONFIDENCE_ORDER[definition.confidence]));
  return weakest >= CONFIDENCE_ORDER.HIGH
    ? 'HIGH'
    : weakest >= CONFIDENCE_ORDER.MEDIUM
      ? 'MEDIUM'
      : 'LOW';
}

function createGroup(
  signals: readonly InterpretationSignal[],
  definitionBySignalId: ReadonlyMap<string, PersonalSynthesisCandidateDefinition>,
  signalRankById: ReadonlyMap<string, number>,
  userQuestion: PersonalSynthesisLifeQuestion | undefined
): PersonalThemeGroup {
  const composition = composeInterpretationSignalGroup(signals);
  if (composition === null) {
    throw new Error('A Personal Synthesis theme cannot be composed without signals.');
  }

  const definitions = signals.map((signal) => {
    const definition = definitionBySignalId.get(signal.signalId);
    if (definition === undefined) {
      throw new Error(`Missing candidate definition for signal ${signal.signalId}.`);
    }
    return definition;
  });
  const template = validateCandidateDefinition(definitions[0]);
  const templateIds = new Set(definitions.map((definition) => definition.editorialTemplateId));
  const domains = new Set(definitions.map((definition) => definition.domain));
  const convergenceKeys = new Set(definitions.map((definition) => definition.convergenceKey));
  const redundancyKeys = new Set(definitions.map((definition) => definition.redundancyKey));

  if (
    templateIds.size !== 1 ||
    domains.size !== 1 ||
    convergenceKeys.size !== 1 ||
    redundancyKeys.size !== 1
  ) {
    throw new Error(
      `Theme ${signals[0].theme} combines incompatible editorial, domain, convergence, or redundancy metadata.`
    );
  }

  const independentEvidenceKeys = uniqueStrings(
    definitions.map((definition) => definition.independentEvidenceKey)
  );
  const convergence = independentEvidenceKeys.length > 1
    ? 'CONVERGENT'
    : 'SINGLE_EVIDENCE';
  const confidence = combineConfidence(definitions);
  const birthTimeDependency = definitions.some((definition) => definition.requiresKnownBirthTime)
    ? 'REQUIRES_KNOWN'
    : 'UNKNOWN_TIME_SAFE';
  const globalPrimaryRank = Math.min(
    ...signals.map((signal) => signalRankById.get(signal.signalId) ?? Number.MAX_SAFE_INTEGER)
  );
  const primarySignal = signals
    .slice()
    .sort((left, right) => {
      const leftRank = signalRankById.get(left.signalId) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = signalRankById.get(right.signalId) ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.signalId.localeCompare(right.signalId);
    })[0];
  if (primarySignal === undefined) {
    throw new Error(`Theme ${signals[0].theme} has no primary signal.`);
  }
  const userQuestionRelevance = userQuestion !== undefined &&
      template.lifeQuestions.includes(userQuestion)
    ? 'DIRECT'
    : 'NOT_MATCHED';
  const tension = composition.direction === 'MIXED'
    ? 'MIXED'
    : 'SINGLE_DIRECTION';
  const structuralCentrality = definitions.some(
    (definition) => definition.structuralCentrality === 'CORE'
  ) ? 'CORE' : 'SUPPORTING';
  const domainRelevance = definitions.some(
    (definition) => definition.domainRelevance === 'DIRECT'
  ) ? 'DIRECT' : 'CONTEXTUAL';

  const ranking: PersonalSynthesisRankingRationale = Object.freeze({
    structuralCentrality,
    domainRelevance,
    userQuestionRelevance,
    convergence,
    tension,
    confidence,
    birthTimeDependency,
    primarySignalRank: globalPrimaryRank,
    rationale: freezeArray([
      structuralCentrality === 'CORE'
        ? 'CORE structural centrality'
        : 'SUPPORTING structural centrality',
      domainRelevance === 'DIRECT'
        ? 'DIRECT life-question relevance'
        : 'CONTEXTUAL life-question relevance',
      userQuestionRelevance === 'DIRECT'
        ? 'explicit user-question match'
        : 'no explicit user-question match',
      convergence === 'CONVERGENT'
        ? `${independentEvidenceKeys.length} independent evidence paths converge`
        : 'one independent evidence path; no convergence bonus',
      tension === 'MIXED'
        ? 'supportive and challenging evidence retained together'
        : 'single direction',
      `${confidence} structured evidence confidence`,
      birthTimeDependency === 'UNKNOWN_TIME_SAFE'
        ? 'safe without known birth time'
        : 'requires known birth time',
      `existing Signal rank tie-break ${globalPrimaryRank}`
    ])
  });

  return Object.freeze({
    semanticThemeKey: signals[0].theme,
    convergenceKey: definitions[0].convergenceKey,
    redundancyKey: definitions[0].redundancyKey,
    signals: freezeArray(signals),
    definitions: freezeArray(definitions),
    composition,
    primarySignalId: primarySignal.signalId,
    primarySignalRank: globalPrimaryRank,
    template,
    convergence,
    independentEvidenceKeys,
    confidence,
    birthTimeDependency,
    ranking
  });
}

function compareGroups(left: PersonalThemeGroup, right: PersonalThemeGroup): number {
  const leftDefinitions = left.definitions;
  const rightDefinitions = right.definitions;
  const leftCentrality = Math.max(
    ...leftDefinitions.map((definition) => CENTRALITY_ORDER[definition.structuralCentrality])
  );
  const rightCentrality = Math.max(
    ...rightDefinitions.map((definition) => CENTRALITY_ORDER[definition.structuralCentrality])
  );
  if (rightCentrality !== leftCentrality) {
    return rightCentrality - leftCentrality;
  }

  const leftQuestion = left.ranking.userQuestionRelevance === 'DIRECT' ? 1 : 0;
  const rightQuestion = right.ranking.userQuestionRelevance === 'DIRECT' ? 1 : 0;
  if (rightQuestion !== leftQuestion) {
    return rightQuestion - leftQuestion;
  }

  const leftConvergence = left.convergence === 'CONVERGENT' ? 1 : 0;
  const rightConvergence = right.convergence === 'CONVERGENT' ? 1 : 0;
  if (rightConvergence !== leftConvergence) {
    return rightConvergence - leftConvergence;
  }

  const rightConfidence = CONFIDENCE_ORDER[right.confidence];
  const leftConfidence = CONFIDENCE_ORDER[left.confidence];
  if (rightConfidence !== leftConfidence) {
    return rightConfidence - leftConfidence;
  }

  const leftTension = left.composition.direction === 'MIXED' ? 1 : 0;
  const rightTension = right.composition.direction === 'MIXED' ? 1 : 0;
  if (rightTension !== leftTension) {
    return rightTension - leftTension;
  }

  const rightDomainRelevance = Math.max(
    ...rightDefinitions.map((definition) => DOMAIN_RELEVANCE_ORDER[definition.domainRelevance])
  );
  const leftDomainRelevance = Math.max(
    ...leftDefinitions.map((definition) => DOMAIN_RELEVANCE_ORDER[definition.domainRelevance])
  );
  if (rightDomainRelevance !== leftDomainRelevance) {
    return rightDomainRelevance - leftDomainRelevance;
  }

  if (left.birthTimeDependency !== right.birthTimeDependency) {
    return left.birthTimeDependency === 'UNKNOWN_TIME_SAFE' ? -1 : 1;
  }

  if (left.primarySignalRank !== right.primarySignalRank) {
    return left.primarySignalRank - right.primarySignalRank;
  }

  return left.semanticThemeKey.localeCompare(right.semanticThemeKey);
}

function groupByTheme(
  signals: readonly InterpretationSignal[],
  definitionBySignalId: ReadonlyMap<string, PersonalSynthesisCandidateDefinition>,
  signalRankById: ReadonlyMap<string, number>,
  userQuestion: PersonalSynthesisLifeQuestion | undefined
): readonly PersonalThemeGroup[] {
  const grouped = new Map<string, InterpretationSignal[]>();
  for (const signal of signals) {
    const group = grouped.get(signal.theme) ?? [];
    group.push(signal);
    grouped.set(signal.theme, group);
  }

  return freezeArray(
    [...grouped.values()]
      .map((group) => createGroup(group, definitionBySignalId, signalRankById, userQuestion))
      .sort(compareGroups)
  );
}

function combineFactReferences(
  signals: readonly InterpretationSignal[]
): readonly InterpretationFactReference[] {
  const references: InterpretationFactReference[] = [];
  const seen = new Set<string>();
  for (const signal of signals) {
    for (const reference of signal.provenance.sourceFactRefs) {
      const key = factReferenceKey(reference);
      if (!seen.has(key)) {
        seen.add(key);
        references.push(reference);
      }
    }
  }
  return freezeArray(references);
}

function combineLearnReferences(
  template: PersonalEditorialTemplate
): readonly PersonalSynthesisLearnReference[] {
  return freezeArray(template.learnReferences.map((reference) => Object.freeze({ ...reference })));
}

function renderWithAnchor(templateText: string, anchor: string): string {
  const verb = anchor.includes(' and ') ? 'make' : 'makes';
  return templateText
    .replaceAll('{{anchor}}', anchor)
    .replaceAll('{{verb}}', verb);
}

function createTheme(
  group: PersonalThemeGroup,
  fixture: PersonalSynthesisFixture,
  rank: number,
  suppressedThemeKeys: readonly string[]
): PersonalSynthesisPersonalTheme {
  const evidenceLabels: string[] = [];
  const seenEvidenceKeys = new Set<string>();
  for (const definition of group.definitions) {
    if (!seenEvidenceKeys.has(definition.independentEvidenceKey)) {
      seenEvidenceKeys.add(definition.independentEvidenceKey);
      evidenceLabels.push(definition.factLabel);
    }
  }
  const anchor = evidenceLabels.join(' and ');
  const sourceFactRefs = combineFactReferences(group.signals);
  const semanticBasisIds = uniqueStrings(
    group.definitions.map((definition) => definition.semanticBasisId)
  );
  const compositionRuleRefs = uniqueStrings(
    group.definitions.map((definition) => definition.compositionRuleId)
  );
  const supportiveSignalIds = group.composition.supportiveSignalIds;
  const challengingSignalIds = group.composition.challengingSignalIds;
  const tensionStatus = group.composition.direction === 'MIXED'
    ? 'MIXED'
    : 'SINGLE_DIRECTION';
  const convergenceText = group.convergence === 'CONVERGENT'
    ? `Independent evidence converges from ${evidenceLabels.join(' and ')}; repeated copies of one source are counted once.`
    : `The theme uses ${anchor} as one independent evidence path; no convergence bonus is claimed.`;
  const tensionText = tensionStatus === 'MIXED'
    ? 'Supportive and challenging evidence remain together, so the trade-off is not hidden.'
    : 'No mixed direction is claimed for this theme.';
  const why: PersonalSynthesisWhyTrace = Object.freeze({
    text: `${group.template.whyLead} ${convergenceText} ${tensionText}`,
    sourceChartFacts: sourceFactRefs,
    semanticBasisIds,
    compositionRuleRefs,
    convergenceKey: group.convergenceKey,
    convergence: Object.freeze({
      status: group.convergence,
      independentEvidenceKeys: group.independentEvidenceKeys,
      sourceSignalIds: group.signals.map((signal) => signal.signalId)
    }),
    tension: Object.freeze({
      status: tensionStatus,
      supportiveSignalIds,
      challengingSignalIds
    }),
    birthTimeAuthority: fixture.chartFacts.birthTimeAuthority,
    requiresKnownBirthTime: group.birthTimeDependency === 'REQUIRES_KNOWN',
    confidence: group.confidence,
    learnReferences: combineLearnReferences(group.template)
  });
  const primarySignal = group.signals.find((signal) => signal.signalId === group.primarySignalId);
  if (primarySignal === undefined) {
    throw new Error(`Theme ${group.semanticThemeKey} has no primary signal for editorial output.`);
  }
  const editorial = Object.freeze({
    recognition: renderWithAnchor(group.template.recognition, anchor),
    strength: group.template.strength,
    pattern: group.template.pattern,
    tension: group.template.tension,
    lever: group.template.lever,
    why,
    learnReferences: combineLearnReferences(group.template),
    deeperReferences: freezeArray(
      group.template.deeperReferences.map((reference) => Object.freeze({ ...reference }))
    )
  });

  return Object.freeze({
    themeId: `personal-theme.${group.semanticThemeKey}`,
    semanticThemeKey: group.semanticThemeKey,
    domain: group.template.domain,
    contributingDomains: freezeArray(
      [...new Set(group.definitions.map((definition) => definition.domain))]
    ),
    direction: group.composition.direction,
    intensity: primarySignal.intensity,
    confidence: group.confidence,
    authority: 'DEVELOPMENT_ONLY',
    sourceSignalIds: freezeArray(group.signals.map((signal) => signal.signalId)),
    evidenceRefs: sourceFactRefs,
    semanticBasisIds,
    compositionRuleRefs,
    authorityRequirements: Object.freeze({
      birthTimeDependency: group.birthTimeDependency
    }),
    ranking: Object.freeze({ ...group.ranking, rank }),
    convergence: Object.freeze({
      status: group.convergence,
      independentEvidenceKeys: group.independentEvidenceKeys
    }),
    redundancy: Object.freeze({
      redundancyKey: group.redundancyKey,
      suppressedThemeKeys: freezeArray(suppressedThemeKeys)
    }),
    lifeQuestions: group.template.lifeQuestions,
    editorial
  });
}

function assertFixture(fixtureDefinition: PersonalSynthesisFixture): void {
  if (fixtureDefinition.chartFacts.sourceAuthority !== PERSONAL_SYNTHESIS_POC_SOURCE_AUTHORITY) {
    throw new Error('Personal Synthesis POC refuses non-fixture source authority.');
  }

  if (fixtureDefinition.candidates.length === 0) {
    throw new Error(`Personal Synthesis fixture ${fixtureDefinition.scenarioId} has no candidates.`);
  }

  const candidateKeys = new Set<string>();
  for (const definition of fixtureDefinition.candidates) {
    validateCandidateDefinition(definition);
    if (candidateKeys.has(definition.candidateKey)) {
      throw new Error(`Personal Synthesis fixture repeats candidate ${definition.candidateKey}.`);
    }
    candidateKeys.add(definition.candidateKey);
  }
}

function selectGroups(
  groups: readonly PersonalThemeGroup[],
  maxThemes: number
): { readonly selected: readonly PersonalThemeGroup[]; readonly suppressed: ReadonlyMap<string, readonly string[]> } {
  const byRedundancy = new Map<string, PersonalThemeGroup[]>();
  for (const group of groups) {
    const sameRedundancy = byRedundancy.get(group.redundancyKey) ?? [];
    sameRedundancy.push(group);
    byRedundancy.set(group.redundancyKey, sameRedundancy);
  }

  const suppressed = new Map<string, readonly string[]>();
  const eligible: PersonalThemeGroup[] = [];
  for (const sameRedundancy of byRedundancy.values()) {
    sameRedundancy.sort(compareGroups);
    const winner = sameRedundancy[0];
    if (winner === undefined) {
      continue;
    }
    eligible.push(winner);
    suppressed.set(
      winner.semanticThemeKey,
      freezeArray(sameRedundancy.slice(1).map((group) => group.semanticThemeKey))
    );
  }
  eligible.sort(compareGroups);

  const materialDomainSeeds = new Map<InterpretationSignal['domain'], PersonalThemeGroup>();
  for (const group of eligible) {
    if (group.confidence === 'LOW') {
      continue;
    }
    if (!materialDomainSeeds.has(group.template.domain)) {
      materialDomainSeeds.set(group.template.domain, group);
    }
  }

  const selected: PersonalThemeGroup[] = [];
  for (const group of [...materialDomainSeeds.values()].sort(compareGroups)) {
    if (selected.length >= maxThemes) {
      break;
    }
    selected.push(group);
  }
  for (const group of eligible) {
    if (selected.length >= maxThemes) {
      break;
    }
    if (!selected.includes(group)) {
      selected.push(group);
    }
  }

  return Object.freeze({
    selected: freezeArray(selected),
    suppressed
  });
}

function decisionForSkippedRule(
  definition: PersonalSynthesisCandidateDefinition,
  fixtureId: string,
  skippedRules: ReadonlyMap<string, string>
): PersonalSynthesisCandidateTrace | null {
  const ruleId = `personal-synthesis.${fixtureId}.${definition.candidateKey}`;
  const reason = skippedRules.get(ruleId);
  if (reason === undefined) {
    return null;
  }
  return Object.freeze({
    candidateKey: definition.candidateKey,
    signalId: `personal-synthesis.${fixtureId}.${definition.candidateKey}`,
    semanticThemeKey: definition.semanticThemeKey,
    convergenceKey: definition.convergenceKey,
    factReference: definition.fact.reference,
    semanticBasisId: definition.semanticBasisId,
    compositionRuleId: definition.compositionRuleId,
    decision: 'SKIPPED_AUTHORITY',
    decisionReason: reason,
    signalRank: null,
    skippedReason: reason
  });
}

function traceSelectedGroup(
  group: PersonalThemeGroup,
  fixtureId: string,
  selected: boolean,
  suppressedByRedundancy: boolean,
  retainedThemeKey: string | null,
  signalRankById: ReadonlyMap<string, number>,
  maxThemes: number
): readonly PersonalSynthesisCandidateTrace[] {
  if (suppressedByRedundancy) {
    return freezeArray(group.definitions.map((definition) => Object.freeze({
      candidateKey: definition.candidateKey,
      signalId: `personal-synthesis.${fixtureId}.${definition.candidateKey}`,
      semanticThemeKey: group.semanticThemeKey,
      convergenceKey: group.convergenceKey,
      factReference: definition.fact.reference,
      semanticBasisId: definition.semanticBasisId,
      compositionRuleId: definition.compositionRuleId,
      decision: 'SUPPRESSED_REDUNDANCY' as const,
      decisionReason: `Redundant with retained theme ${retainedThemeKey ?? 'another theme'}.`,
      signalRank: null,
      skippedReason: null
    })));
  }

  if (!selected) {
    return freezeArray(group.definitions.map((definition) => Object.freeze({
      candidateKey: definition.candidateKey,
      signalId: `personal-synthesis.${fixtureId}.${definition.candidateKey}`,
      semanticThemeKey: group.semanticThemeKey,
      convergenceKey: group.convergenceKey,
      factReference: definition.fact.reference,
      semanticBasisId: definition.semanticBasisId,
      compositionRuleId: definition.compositionRuleId,
      decision: 'NOT_SELECTED_THEME_CAP' as const,
      decisionReason: `A deterministic maximum of ${maxThemes} core themes was reached.`,
      signalRank: null,
      skippedReason: null
    })));
  }

  const signalByCandidateKey = new Map(
    group.definitions.map((definition, index) => [definition.candidateKey, group.signals[index]] as const)
  );
  const rankedDefinitions = group.definitions.slice().sort((left, right) => {
    const leftSignal = signalByCandidateKey.get(left.candidateKey);
    const rightSignal = signalByCandidateKey.get(right.candidateKey);
    const leftRank = leftSignal === undefined
      ? Number.MAX_SAFE_INTEGER
      : signalRankById.get(leftSignal.signalId) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rightSignal === undefined
      ? Number.MAX_SAFE_INTEGER
      : signalRankById.get(rightSignal.signalId) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.candidateKey.localeCompare(right.candidateKey);
  });
  const seenEvidence = new Set<string>();
  const decisionByCandidateKey = new Map<string, PersonalSynthesisCandidateDecision>();
  for (const definition of rankedDefinitions) {
    const signal = signalByCandidateKey.get(definition.candidateKey);
    if (signal === undefined) {
      throw new Error(`Signal missing for candidate ${definition.candidateKey}.`);
    }
    const isNewEvidence = !seenEvidence.has(definition.independentEvidenceKey);
    seenEvidence.add(definition.independentEvidenceKey);
    const decision = signal.signalId === group.primarySignalId
      ? 'SELECTED'
      : isNewEvidence
        ? 'MERGED_CONVERGENCE'
        : 'MERGED_SAME_EVIDENCE';
    decisionByCandidateKey.set(definition.candidateKey, decision);
  }
  return freezeArray(group.definitions.map((definition) => {
    const signal = signalByCandidateKey.get(definition.candidateKey);
    if (signal === undefined) {
      throw new Error(`Signal missing for candidate ${definition.candidateKey}.`);
    }
    const decision = decisionByCandidateKey.get(definition.candidateKey);
    if (decision === undefined) {
      throw new Error(`Decision missing for candidate ${definition.candidateKey}.`);
    }
    return Object.freeze({
      candidateKey: definition.candidateKey,
      signalId: signal.signalId,
      semanticThemeKey: group.semanticThemeKey,
      convergenceKey: group.convergenceKey,
      factReference: definition.fact.reference,
      semanticBasisId: definition.semanticBasisId,
      compositionRuleId: definition.compositionRuleId,
      decision,
      decisionReason: decision === 'SELECTED'
        ? 'Retained as the deterministic representative of this theme.'
        : decision === 'MERGED_CONVERGENCE'
          ? 'Merged into the retained theme as independent supporting evidence.'
          : 'Merged without increasing convergence because the underlying evidence repeats.',
      signalRank: signalRankById.get(signal.signalId) ?? null,
      skippedReason: null
    });
  }));
}

export function synthesizePersonalThemes(
  fixtureDefinition: PersonalSynthesisFixture,
  options: {
    readonly maxThemes?: number;
    readonly userQuestion?: PersonalSynthesisLifeQuestion;
  } = {}
): PersonalSynthesisResult {
  assertFixture(fixtureDefinition);
  const maxThemes = options.maxThemes ?? 5;
  if (!Number.isInteger(maxThemes) || maxThemes < 1 || maxThemes > 5) {
    throw new Error('Personal Synthesis POC maxThemes must be an integer from 1 through 5.');
  }

  const definitionBySignalId = new Map<string, PersonalSynthesisCandidateDefinition>();
  const registry = createInterpretationSignalRuleRegistry(
    fixtureDefinition.candidates.map((definition) => {
      const rule = createCandidateRule(fixtureDefinition.scenarioId, definition);
      definitionBySignalId.set(
        `personal-synthesis.${fixtureDefinition.scenarioId}.${definition.candidateKey}`,
        definition
      );
      return rule;
    })
  );
  const evaluation = registry.evaluate({
    sourceAuthority: fixtureDefinition.chartFacts.sourceAuthority,
    birthTimeAuthority: fixtureDefinition.chartFacts.birthTimeAuthority,
    facts: fixtureDefinition.chartFacts.facts
  });
  const globallyRanked = rankInterpretationSignals(evaluation.signals);
  const signalRankById = new Map(
    globallyRanked.map((entry) => [entry.signal.signalId, entry.rank] as const)
  );
  const groups = groupByTheme(
    evaluation.signals,
    definitionBySignalId,
    signalRankById,
    options.userQuestion
  );
  const selection = selectGroups(groups, maxThemes);
  const selectedThemes = selection.selected.map((group, index) => createTheme(
    group,
    fixtureDefinition,
    index + 1,
    selection.suppressed.get(group.semanticThemeKey) ?? []
  ));
  const selectedThemeKeys = new Set(selection.selected.map((group) => group.semanticThemeKey));
  const suppressedThemeKeys = new Set<string>();
  for (const suppressed of selection.suppressed.values()) {
    for (const key of suppressed) {
      suppressedThemeKeys.add(key);
    }
  }
  const skippedByRule = new Map(
    evaluation.skippedRules.map((skip) => [skip.ruleId, skip.reason] as const)
  );
  const candidateTrace: PersonalSynthesisCandidateTrace[] = [];
  for (const definition of fixtureDefinition.candidates) {
    const skipped = decisionForSkippedRule(definition, fixtureDefinition.scenarioId, skippedByRule);
    if (skipped !== null) {
      candidateTrace.push(skipped);
      continue;
    }
    const group = groups.find((candidateGroup) =>
      candidateGroup.definitions.some((candidate) => candidate.candidateKey === definition.candidateKey)
    );
    if (group === undefined) {
      throw new Error(`Candidate ${definition.candidateKey} was neither selected nor skipped.`);
    }
    const groupTrace = traceSelectedGroup(
      group,
      fixtureDefinition.scenarioId,
      selectedThemeKeys.has(group.semanticThemeKey),
      suppressedThemeKeys.has(group.semanticThemeKey),
      [...selection.suppressed.entries()].find(([, suppressed]) =>
        suppressed.includes(group.semanticThemeKey)
      )?.[0] ?? null,
      signalRankById,
      maxThemes
    );
    const trace = groupTrace.find((entry) => entry.candidateKey === definition.candidateKey);
    if (trace === undefined) {
      throw new Error(`Candidate trace missing for ${definition.candidateKey}.`);
    }
    candidateTrace.push(trace);
  }

  const factLabelsByPath = new Map(
    fixtureDefinition.candidates.map((definition) => [definition.fact.reference.canonicalPath, definition.factLabel] as const)
  );
  const naiveFactDump = fixtureDefinition.chartFacts.facts
    .filter((input) => input.available)
    .map((input) => factLabelsByPath.get(input.reference.canonicalPath) ?? input.reference.canonicalPath);

  return Object.freeze({
    scenarioId: fixtureDefinition.scenarioId,
    title: fixtureDefinition.title,
    purpose: fixtureDefinition.purpose,
    authority: 'DEVELOPMENT_ONLY',
    birthTimeAuthority: fixtureDefinition.chartFacts.birthTimeAuthority,
    fixtureVersion: PERSONAL_SYNTHESIS_POC_FIXTURE_VERSION,
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED',
    evaluatedSignals: freezeArray(evaluation.signals),
    skippedRules: freezeArray(evaluation.skippedRules.map((skip) => Object.freeze({ ...skip }))),
    candidateTrace: freezeArray(candidateTrace),
    coreThemes: freezeArray(selectedThemes),
    naiveFactDump: freezeArray(naiveFactDump)
  });
}

function makeCandidate(
  values: Omit<PersonalSynthesisCandidateDefinition, 'fact'> & {
    readonly path: string;
    readonly factKind?: InterpretationFactReference['factKind'];
    readonly attributes?: Record<string, string | number | boolean | null>;
    readonly available?: boolean;
  }
): PersonalSynthesisCandidateDefinition {
  const {
    path,
    factKind = 'NATAL_BODY_POSITION',
    attributes = {},
    available = true,
    ...definition
  } = values;
  return candidate({
    ...definition,
    fact: fact(path, factKind, attributes, available)
  });
}

const SCENARIO_A = fixture(
  'CASE_A_CONVERGENT_SUPPORT',
  'Convergent support for clear exchange',
  'Merge independent evidence and repeated copies into one communication theme.',
  'KNOWN',
  [
    fact('/bodies/Mercury', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/aspects/Mercury-Venus', 'NATAL_ASPECT', { firstBody: 'Mercury', secondBody: 'Venus', type: 'CONJUNCTION' }),
    fact('/bodies/Aries', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/bodies/Saturn', 'NATAL_BODY_POSITION', { body: 'Saturn', sign: 'Taurus' })
  ],
  [
    makeCandidate({
      candidateKey: 'mercury-placement-clarity',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.communication.from-body',
      convergenceKey: 'communication-clarity',
      redundancyKey: 'communication-clarity',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.82,
      intensity: 'STRONG',
      confidence: 'HIGH',
      priority: 'THEMATIC',
      ranking: ranking(0.82, 0.86),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'mercury-aspect-clarity',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/aspects/Mercury-Venus',
      factKind: 'NATAL_ASPECT',
      factLabel: 'Mercury–Venus aspect',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.communication.from-aspect',
      convergenceKey: 'communication-clarity',
      redundancyKey: 'communication-clarity',
      independentEvidenceKey: 'mercury-aspect',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.74,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.75, 0.78),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'mercury-placement-repeat',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement (repeated)',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.communication.restatement',
      convergenceKey: 'communication-clarity',
      redundancyKey: 'communication-clarity',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.61,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'BACKGROUND',
      ranking: ranking(0.5, 0.55, 0.4),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'CONTEXTUAL',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'aries-self-direction',
      semanticThemeKey: 'self-direction',
      editorialTemplateId: 'self-direction',
      path: '/bodies/Aries',
      factLabel: 'Aries sign layer',
      semanticBasisId: 'sign.aries',
      compositionRuleId: 'personal-synthesis.self.from-sign',
      convergenceKey: 'self-direction',
      redundancyKey: 'self-direction',
      independentEvidenceKey: 'aries-sign',
      domain: 'SELF',
      direction: 'SUPPORTIVE',
      internalStrength: 0.7,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.67, 0.72),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'fixed-work-continuity',
      semanticThemeKey: 'work-continuity',
      editorialTemplateId: 'work-continuity',
      path: '/bodies/Saturn',
      factLabel: 'Fixed-sign layer',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.work.from-modality',
      convergenceKey: 'work-continuity',
      redundancyKey: 'work-continuity',
      independentEvidenceKey: 'fixed-modality',
      domain: 'WORK_CREATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.66,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.64, 0.7),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    })
  ]
);

const SCENARIO_B = fixture(
  'CASE_B_MEANINGFUL_TENSION',
  'Initiation and pacing in tension',
  'Keep supportive and challenging evidence together as one mixed theme.',
  'KNOWN',
  [
    fact('/signs/Aries', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/modalities/Fixed', 'NATAL_BODY_POSITION', { body: 'Saturn', sign: 'Taurus' }),
    fact('/bodies/Moon', 'NATAL_BODY_POSITION', { body: 'Moon', sign: 'Libra' })
  ],
  [
    makeCandidate({
      candidateKey: 'initiation-support',
      semanticThemeKey: 'deliberate-action',
      editorialTemplateId: 'deliberate-action',
      path: '/signs/Aries',
      factLabel: 'Aries sign layer',
      semanticBasisId: 'sign.aries',
      compositionRuleId: 'personal-synthesis.action.initiation',
      convergenceKey: 'action-pacing-tradeoff',
      redundancyKey: 'action-pacing-tradeoff',
      independentEvidenceKey: 'aries-initiation',
      domain: 'ACTION_DECISION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.86,
      intensity: 'STRONG',
      confidence: 'HIGH',
      priority: 'ACTIVE',
      ranking: ranking(0.86, 0.9),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'continuation-challenge',
      semanticThemeKey: 'deliberate-action',
      editorialTemplateId: 'deliberate-action',
      path: '/modalities/Fixed',
      factLabel: 'Fixed modality layer',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.action.pacing',
      convergenceKey: 'action-pacing-tradeoff',
      redundancyKey: 'action-pacing-tradeoff',
      independentEvidenceKey: 'fixed-continuation',
      domain: 'ACTION_DECISION',
      direction: 'CHALLENGING',
      internalStrength: 0.78,
      intensity: 'STRONG',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.78, 0.76),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'relationship-boundary',
      semanticThemeKey: 'relationship-boundary',
      editorialTemplateId: 'relationship-boundary',
      path: '/bodies/Moon',
      factLabel: 'Moon placement',
      semanticBasisId: 'body.moon',
      compositionRuleId: 'personal-synthesis.relationship.response',
      convergenceKey: 'relationship-boundary',
      redundancyKey: 'relationship-boundary',
      independentEvidenceKey: 'moon-response',
      domain: 'RELATIONSHIP',
      direction: 'SUPPORTIVE',
      internalStrength: 0.7,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.68, 0.7),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'emotional-pacing',
      semanticThemeKey: 'emotional-pacing',
      editorialTemplateId: 'emotional-pacing',
      path: '/bodies/Moon',
      factLabel: 'Moon placement',
      semanticBasisId: 'body.moon',
      compositionRuleId: 'personal-synthesis.emotional.response',
      convergenceKey: 'emotional-pacing',
      redundancyKey: 'emotional-pacing',
      independentEvidenceKey: 'moon-response',
      domain: 'EMOTIONAL',
      direction: 'NEUTRAL',
      internalStrength: 0.58,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'BACKGROUND',
      ranking: ranking(0.56, 0.62),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'CONTEXTUAL',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    })
  ]
);

const SCENARIO_C = fixture(
  'CASE_C_REDUNDANCY',
  'Redundant communication candidates',
  'Suppress overlapping candidates while retaining distinct self and work themes.',
  'KNOWN',
  [
    fact('/bodies/Mercury', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/bodies/Aries', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/modalities/Fixed', 'NATAL_BODY_POSITION', { body: 'Saturn', sign: 'Taurus' })
  ],
  [
    makeCandidate({
      candidateKey: 'clarity-primary',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.communication.primary',
      convergenceKey: 'communication-claim',
      redundancyKey: 'communication-claim',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.85,
      intensity: 'STRONG',
      confidence: 'HIGH',
      priority: 'THEMATIC',
      ranking: ranking(0.86, 0.9),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'directness-restatement',
      semanticThemeKey: 'communication-directness',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement (restated)',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.communication.reworded',
      convergenceKey: 'communication-claim',
      redundancyKey: 'communication-claim',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.66,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'BACKGROUND',
      ranking: ranking(0.5, 0.54, 0.5),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'CONTEXTUAL',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'aries-self',
      semanticThemeKey: 'self-direction',
      editorialTemplateId: 'self-direction',
      path: '/bodies/Aries',
      factLabel: 'Aries sign layer',
      semanticBasisId: 'sign.aries',
      compositionRuleId: 'personal-synthesis.self.direction',
      convergenceKey: 'self-direction',
      redundancyKey: 'self-direction',
      independentEvidenceKey: 'aries-sign',
      domain: 'SELF',
      direction: 'SUPPORTIVE',
      internalStrength: 0.72,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.7, 0.74),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'fixed-work',
      semanticThemeKey: 'work-continuity',
      editorialTemplateId: 'work-continuity',
      path: '/modalities/Fixed',
      factLabel: 'Fixed modality layer',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.work.continuity',
      convergenceKey: 'work-continuity',
      redundancyKey: 'work-continuity',
      independentEvidenceKey: 'fixed-modality',
      domain: 'WORK_CREATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.69,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.66, 0.7),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    })
  ]
);

const SCENARIO_D = fixture(
  'CASE_D_UNKNOWN_BIRTH_TIME',
  'Useful themes with unknown birth time',
  'Retain safe placement-level evidence while suppressing angles and houses.',
  'UNKNOWN',
  [
    fact('/bodies/Mercury', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/bodies/Moon', 'NATAL_BODY_POSITION', { body: 'Moon', sign: 'Libra' }),
    fact('/angles/ASC', 'NATAL_ANGLE_POSITION', { angle: 'ASC' }, false),
    fact('/angles/MC', 'NATAL_ANGLE_POSITION', { angle: 'MC' }, false),
    fact('/bodies/Sun/house', 'NATAL_HOUSE_PLACEMENT', { body: 'Sun', house: 1 }, false)
  ],
  [
    makeCandidate({
      candidateKey: 'unknown-safe-communication',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.unknown-safe.communication',
      convergenceKey: 'communication-clarity',
      redundancyKey: 'communication-clarity',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.7,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.7, 0.72),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'unknown-safe-emotional',
      semanticThemeKey: 'emotional-pacing',
      editorialTemplateId: 'emotional-pacing',
      path: '/bodies/Moon',
      factLabel: 'Moon placement',
      semanticBasisId: 'body.moon',
      compositionRuleId: 'personal-synthesis.unknown-safe.emotional',
      convergenceKey: 'emotional-pacing',
      redundancyKey: 'emotional-pacing',
      independentEvidenceKey: 'moon-placement',
      domain: 'EMOTIONAL',
      direction: 'SUPPORTIVE',
      internalStrength: 0.64,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.64, 0.68),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'blocked-ascendant',
      semanticThemeKey: 'self-direction',
      editorialTemplateId: 'self-direction',
      path: '/angles/ASC',
      factKind: 'NATAL_ANGLE_POSITION',
      factLabel: 'Ascendant angle',
      semanticBasisId: 'sign.aries',
      compositionRuleId: 'personal-synthesis.blocked.ascendant',
      convergenceKey: 'self-direction',
      redundancyKey: 'self-direction',
      independentEvidenceKey: 'ascendant',
      domain: 'SELF',
      direction: 'SUPPORTIVE',
      internalStrength: 0.9,
      intensity: 'DOMINANT',
      confidence: 'HIGH',
      priority: 'ACTIVE',
      ranking: ranking(0.95, 0.95),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: true,
      available: false
    }),
    makeCandidate({
      candidateKey: 'blocked-house',
      semanticThemeKey: 'work-continuity',
      editorialTemplateId: 'work-continuity',
      path: '/bodies/Sun/house',
      factKind: 'NATAL_HOUSE_PLACEMENT',
      factLabel: 'Sun house placement',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.blocked.house',
      convergenceKey: 'work-continuity',
      redundancyKey: 'work-continuity',
      independentEvidenceKey: 'sun-house',
      domain: 'WORK_CREATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.9,
      intensity: 'DOMINANT',
      confidence: 'HIGH',
      priority: 'ACTIVE',
      ranking: ranking(0.95, 0.95),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: true,
      available: false
    })
  ]
);

const SCENARIO_E = fixture(
  'CASE_E_DOMAIN_PRIORITIES',
  'Supported themes across domains',
  'Represent distinct materially supported domains without forcing artificial diversity.',
  'KNOWN',
  [
    fact('/bodies/Aries', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/bodies/Moon', 'NATAL_BODY_POSITION', { body: 'Moon', sign: 'Libra' }),
    fact('/bodies/Mercury', 'NATAL_BODY_POSITION', { body: 'Mercury', sign: 'Aries' }),
    fact('/modalities/Fixed', 'NATAL_BODY_POSITION', { body: 'Saturn', sign: 'Taurus' }),
    fact('/aspects/Moon-Mercury', 'NATAL_ASPECT', { firstBody: 'Moon', secondBody: 'Mercury', type: 'SEXTILE' })
  ],
  [
    makeCandidate({
      candidateKey: 'domain-self',
      semanticThemeKey: 'self-direction',
      editorialTemplateId: 'self-direction',
      path: '/bodies/Aries',
      factLabel: 'Aries sign layer',
      semanticBasisId: 'sign.aries',
      compositionRuleId: 'personal-synthesis.domain.self',
      convergenceKey: 'self-direction',
      redundancyKey: 'self-direction',
      independentEvidenceKey: 'aries-sign',
      domain: 'SELF',
      direction: 'SUPPORTIVE',
      internalStrength: 0.74,
      intensity: 'NOTICEABLE',
      confidence: 'HIGH',
      priority: 'THEMATIC',
      ranking: ranking(0.76, 0.82),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'domain-emotional',
      semanticThemeKey: 'emotional-pacing',
      editorialTemplateId: 'emotional-pacing',
      path: '/bodies/Moon',
      factLabel: 'Moon placement',
      semanticBasisId: 'body.moon',
      compositionRuleId: 'personal-synthesis.domain.emotional',
      convergenceKey: 'emotional-pacing',
      redundancyKey: 'emotional-pacing',
      independentEvidenceKey: 'moon-placement',
      domain: 'EMOTIONAL',
      direction: 'SUPPORTIVE',
      internalStrength: 0.72,
      intensity: 'NOTICEABLE',
      confidence: 'HIGH',
      priority: 'THEMATIC',
      ranking: ranking(0.74, 0.8),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'domain-communication',
      semanticThemeKey: 'communication-clarity',
      editorialTemplateId: 'communication-clarity',
      path: '/bodies/Mercury',
      factLabel: 'Mercury placement',
      semanticBasisId: 'body.mercury',
      compositionRuleId: 'personal-synthesis.domain.communication',
      convergenceKey: 'communication-clarity',
      redundancyKey: 'communication-clarity',
      independentEvidenceKey: 'mercury-placement',
      domain: 'COMMUNICATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.71,
      intensity: 'NOTICEABLE',
      confidence: 'HIGH',
      priority: 'THEMATIC',
      ranking: ranking(0.73, 0.79),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'domain-work',
      semanticThemeKey: 'work-continuity',
      editorialTemplateId: 'work-continuity',
      path: '/modalities/Fixed',
      factLabel: 'Fixed modality layer',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.domain.work',
      convergenceKey: 'work-continuity',
      redundancyKey: 'work-continuity',
      independentEvidenceKey: 'fixed-modality',
      domain: 'WORK_CREATION',
      direction: 'SUPPORTIVE',
      internalStrength: 0.7,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.69, 0.72),
      structuralCentrality: 'CORE',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    }),
    makeCandidate({
      candidateKey: 'domain-action',
      semanticThemeKey: 'deliberate-action',
      editorialTemplateId: 'deliberate-action',
      path: '/aspects/Moon-Mercury',
      factKind: 'NATAL_ASPECT',
      factLabel: 'Moon–Mercury aspect',
      semanticBasisId: 'modality.fixed',
      compositionRuleId: 'personal-synthesis.domain.action',
      convergenceKey: 'deliberate-action',
      redundancyKey: 'deliberate-action',
      independentEvidenceKey: 'moon-mercury-aspect',
      domain: 'ACTION_DECISION',
      direction: 'NEUTRAL',
      internalStrength: 0.62,
      intensity: 'NOTICEABLE',
      confidence: 'MEDIUM',
      priority: 'THEMATIC',
      ranking: ranking(0.62, 0.68),
      structuralCentrality: 'SUPPORTING',
      domainRelevance: 'DIRECT',
      userQuestionRelevance: 'NOT_SPECIFIED',
      requiresKnownBirthTime: false
    })
  ]
);

export const PERSONAL_SYNTHESIS_POC_FIXTURES: readonly PersonalSynthesisFixture[] =
  Object.freeze([SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D, SCENARIO_E]);

export function createPersonalSynthesisPocFixtures(): readonly PersonalSynthesisFixture[] {
  return PERSONAL_SYNTHESIS_POC_FIXTURES;
}

export function getPersonalSynthesisPocFixture(
  scenarioId: string
): PersonalSynthesisFixture {
  const fixtureDefinition = PERSONAL_SYNTHESIS_POC_FIXTURES.find(
    (candidateDefinition) => candidateDefinition.scenarioId === scenarioId
  );
  if (fixtureDefinition === undefined) {
    throw new Error(`Unknown Personal Synthesis POC fixture ${scenarioId}.`);
  }
  return fixtureDefinition;
}
