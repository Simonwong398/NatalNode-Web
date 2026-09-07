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
  InterpretationSignalComposition,
  InterpretationSignalDirection,
  InterpretationSignalIntensity,
  InterpretationSignalRankingMetadata,
  InterpretationSignalProvenance,
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

/**
 * Common candidate metadata used after a Signal has already been admitted.
 * The existing fixture path adds ranking metadata before the Signal exists;
 * the representative Signal path deliberately does not.
 */
export type PersonalSynthesisCandidateMetadata = Omit<
  PersonalSynthesisCandidateDefinition,
  'internalStrength' | 'priority' | 'ranking'
>;

/**
 * A structured research Signal accepted by the downstream synthesis POC.
 * This is intentionally not an InterpretationSignal: the representative
 * policy does not provide internalStrength, priority, or ranking metadata, and
 * the adapter must not invent those values to satisfy the older fixture path.
 */
export interface PersonalSynthesisStructuredSignalInput {
  readonly sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL';
  readonly signalId: string;
  readonly compositionId: string;
  readonly signalThemeKey: string;
  readonly rule: InterpretationRuleIdentity;
  readonly domain: InterpretationSignal['domain'];
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly provenance: InterpretationSignalProvenance;
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly placementEvidenceKey: string;
  readonly evidenceUnitCount: 1;
  readonly semanticClaim: string;
  readonly constructiveCapacity: string;
  readonly possibleTension: string;
  readonly semanticBasis: Readonly<Record<string, unknown>>;
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[];
  readonly birthTimeRequirement: {
    readonly status: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
    readonly requiresKnownBirthTime: boolean;
    readonly forbiddenDependencies: readonly string[];
  };
  readonly suppressionConditions: readonly string[];
  readonly suppressionState: 'ELIGIBLE';
}

export type PersonalSynthesisSignalForTheme = {
  readonly signalId: string;
  readonly domain: InterpretationSignal['domain'];
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly theme: string;
  readonly rule: InterpretationRuleIdentity;
  readonly provenance: InterpretationSignalProvenance;
  readonly authority: 'AUTHORITATIVE' | 'DEVELOPMENT_ONLY';
} | PersonalSynthesisStructuredSignalInput;

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

export interface PersonalSynthesisWhyReaderFactor {
  readonly label: string;
  readonly contribution: string;
}

export interface PersonalSynthesisWhyReader {
  readonly summary: string;
  readonly factors: readonly PersonalSynthesisWhyReaderFactor[];
  readonly synthesis: string;
}

export interface PersonalSynthesisDeeperReference {
  readonly objectId: string;
  readonly label: string;
}

export interface PersonalSynthesisWhyTrace {
  readonly text: string;
  readonly reader: PersonalSynthesisWhyReader;
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
  /** Preserved only when the input was a structured representative Signal. */
  readonly representativeSignalTraces?: readonly PersonalSynthesisStructuredSignalInput[];
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
  /** Full upstream Signal-policy trace for research-input synthesis. */
  readonly representativeSignalTraces?: readonly PersonalSynthesisStructuredSignalInput[];
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
  readonly evaluatedSignals: readonly PersonalSynthesisSignalForTheme[];
  readonly skippedRules: readonly { readonly ruleId: string; readonly reason: string }[];
  readonly candidateTrace: readonly PersonalSynthesisCandidateTrace[];
  readonly coreThemes: readonly PersonalSynthesisPersonalTheme[];
  /** Explicit comparison material for the review dossier, not a reading output. */
  readonly naiveFactDump: readonly string[];
}

export interface PersonalSynthesisStructuredSuppression {
  readonly signalId: string;
  readonly placementEvidenceKey: string;
  readonly reason: 'DUPLICATE_SAME_PLACEMENT';
}

export interface PersonalSynthesisStructuredResult {
  readonly sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL';
  readonly inputSignals: readonly PersonalSynthesisStructuredSignalInput[];
  readonly eligibleSignals: readonly PersonalSynthesisStructuredSignalInput[];
  readonly suppressedSignals: readonly PersonalSynthesisStructuredSuppression[];
  readonly synthesis: PersonalSynthesisResult;
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
  readonly whyReaderSummary: string;
  readonly whyReaderSynthesis: string;
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
    recognition: 'You may find yourself looking for the clearest way to say what matters, while still leaving room for another person to answer.',
    strength: 'You can make an important point easier to hear by giving it a clean shape.',
    pattern: 'When something matters, you may keep refining the message until the meaning and the response can meet.',
    tension: 'Clarity can turn into too much framing if the other person has no room to respond in their own way.',
    lever: 'Say the point in one sentence, then pause long enough to hear what comes back before adding the rest.',
    whyReaderSummary: 'This theme speaks to the way a thought becomes a message, and to the space that message leaves for a response.',
    whyReaderSynthesis: 'Together, these factors make clear exchange a practice: say what matters, then let the answer have its own shape.',
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
    recognition: 'You may feel a strong urge to get something moving, alongside a steady instinct to make sure it can last.',
    strength: 'You can give an idea a beginning without losing sight of what will keep it going.',
    pattern: 'You may move between the courage to start and the patience to stay with something until it becomes real.',
    tension: 'Starting quickly can outrun your pacing, while waiting for certainty can keep a good first step in draft.',
    lever: 'Choose one reversible first step, and name what you still need to learn before you build the larger plan.',
    whyReaderSummary: 'This theme speaks to the moment when an impulse wants to begin and another part of you asks whether the choice can hold its shape.',
    whyReaderSynthesis: 'Together, these factors connect the courage to begin with the patience to continue, so the timing of a first step matters as much as the step itself.',
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
    recognition: 'Closeness may feel best when it has enough room to stay honest and responsive.',
    strength: 'You can notice what helps connection remain warm without making it automatic.',
    pattern: 'You may pay close attention to receptivity, distance, and the pace at which trust answers back.',
    tension: 'Protecting steadiness can also reduce openness if a boundary is treated as a conclusion.',
    lever: 'Name the boundary and the connection it is meant to protect before deciding what distance means.',
    whyReaderSummary: 'This theme speaks to how you receive closeness and how you keep enough space for the relationship to stay honest.',
    whyReaderSynthesis: 'That emphasis makes connection a balance between receptivity and a boundary that keeps contact responsive.',
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
    recognition: 'You may do your best work when a meaningful process has time to gather shape.',
    strength: 'You can keep a worthwhile process in view long enough for it to develop.',
    pattern: 'Your attention may return to maintenance, sequencing, and the conditions that let good work reach completion.',
    tension: 'Continuity can become inertia when the process is preserved after its purpose has changed.',
    lever: 'Choose one part of the process to maintain and one signal that would justify changing it.',
    whyReaderSummary: 'This theme speaks to the part of your work that grows through continuity rather than quick results.',
    whyReaderSynthesis: 'Together, these factors point to a process that can be maintained without becoming fixed.',
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
    recognition: 'You may find direction by giving an impulse a first, concrete form.',
    strength: 'You can turn a beginning into a direction without needing the whole path at once.',
    pattern: 'You may return to initiative, naming a priority, and choosing the next honest starting point.',
    tension: 'A clear first direction can narrow the field too quickly if context is treated as irrelevant.',
    lever: 'State the direction, then name the piece of context that could revise the next step.',
    whyReaderSummary: 'This theme speaks to how an inner direction becomes a choice you can begin to live.',
    whyReaderSynthesis: 'Together, these factors turn a first impulse into a direction while leaving room for context to refine it.',
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
    recognition: 'Your first response may arrive as a rhythm or feeling that needs time before it becomes a decision.',
    strength: 'You can notice what helps a response settle before asking it to choose for you.',
    pattern: 'You may return to familiar rhythms of receptivity, feeling, and recovery when something matters.',
    tension: 'A familiar response can feel safe while still narrowing the range of available choices.',
    lever: 'Name the first response, then allow one additional observation before treating it as a decision.',
    whyReaderSummary: 'This theme speaks to the space between your first response and the choice that follows it.',
    whyReaderSynthesis: 'That rhythm is why a pause between feeling and choice can make more room for what you really want.',
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
  definition: PersonalSynthesisCandidateMetadata
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
  readonly signals: readonly PersonalSynthesisSignalForTheme[];
  readonly definitions: readonly PersonalSynthesisCandidateMetadata[];
  readonly composition: InterpretationSignalComposition;
  readonly primarySignalId: string;
  readonly primarySignalRank: number;
  readonly template: PersonalEditorialTemplate;
  readonly convergence: 'CONVERGENT' | 'SINGLE_EVIDENCE';
  readonly independentEvidenceKeys: readonly string[];
  readonly confidence: InterpretationConfidence;
  readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  readonly ranking: PersonalSynthesisRankingRationale;
}

function isStructuredSignal(
  signal: PersonalSynthesisSignalForTheme
): signal is PersonalSynthesisStructuredSignalInput {
  return 'sourceType' in signal && signal.sourceType === 'RESEARCH_REPRESENTATIVE_SIGNAL';
}

function synthesisThemeKey(signal: PersonalSynthesisSignalForTheme): string {
  return isStructuredSignal(signal) ? signal.signalThemeKey : signal.theme;
}

type SynthesisSignalComposer = (
  signals: readonly PersonalSynthesisSignalForTheme[]
) => InterpretationSignalComposition | null;

function composeFixtureSignalGroup(
  signals: readonly PersonalSynthesisSignalForTheme[]
): InterpretationSignalComposition | null {
  return composeInterpretationSignalGroup(signals as readonly InterpretationSignal[]);
}

function composeStructuredSignalGroup(
  signals: readonly PersonalSynthesisSignalForTheme[]
): InterpretationSignalComposition | null {
  if (signals.length === 0) {
    return null;
  }

  const directionSet = new Set(signals.map((signal) => signal.direction));
  const direction = directionSet.has('MIXED') ||
      (directionSet.has('SUPPORTIVE') && directionSet.has('CHALLENGING'))
    ? 'MIXED'
    : directionSet.has('SUPPORTIVE')
      ? 'SUPPORTIVE'
      : directionSet.has('CHALLENGING')
        ? 'CHALLENGING'
        : 'NEUTRAL';
  const sourceFactRefs: InterpretationFactReference[] = [];
  const seenFactRefs = new Set<string>();
  for (const signal of signals) {
    for (const reference of signal.provenance.sourceFactRefs) {
      const key = factReferenceKey(reference);
      if (!seenFactRefs.has(key)) {
        seenFactRefs.add(key);
        sourceFactRefs.push(reference);
      }
    }
  }

  return Object.freeze({
    direction,
    dominantSignalId: signals[0].signalId,
    supportingSignalIds: freezeArray(signals.slice(1).map((signal) => signal.signalId)),
    sourceSignalIds: freezeArray(signals.map((signal) => signal.signalId)),
    supportiveSignalIds: freezeArray(
      signals.filter((signal) => signal.direction === 'SUPPORTIVE').map((signal) => signal.signalId)
    ),
    challengingSignalIds: freezeArray(
      signals.filter((signal) => signal.direction === 'CHALLENGING').map((signal) => signal.signalId)
    ),
    sourceFactRefs: freezeArray(sourceFactRefs)
  });
}

function combineConfidence(
  definitions: readonly PersonalSynthesisCandidateMetadata[]
): InterpretationConfidence {
  const weakest = Math.min(...definitions.map((definition) => CONFIDENCE_ORDER[definition.confidence]));
  return weakest >= CONFIDENCE_ORDER.HIGH
    ? 'HIGH'
    : weakest >= CONFIDENCE_ORDER.MEDIUM
      ? 'MEDIUM'
      : 'LOW';
}

function createGroup(
  signals: readonly PersonalSynthesisSignalForTheme[],
  definitionBySignalId: ReadonlyMap<string, PersonalSynthesisCandidateMetadata>,
  signalRankById: ReadonlyMap<string, number>,
  userQuestion: PersonalSynthesisLifeQuestion | undefined,
  composeSignals: SynthesisSignalComposer = composeFixtureSignalGroup,
  rankingTieBreakLabel = 'existing Signal rank tie-break'
): PersonalThemeGroup {
  const composition = composeSignals(signals);
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
      `Theme ${synthesisThemeKey(signals[0])} combines incompatible editorial, domain, convergence, or redundancy metadata.`
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
    throw new Error(`Theme ${synthesisThemeKey(signals[0])} has no primary signal.`);
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
      `${rankingTieBreakLabel} ${globalPrimaryRank}`
    ])
  });

  return Object.freeze({
    semanticThemeKey: synthesisThemeKey(signals[0]),
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
  signals: readonly PersonalSynthesisSignalForTheme[],
  definitionBySignalId: ReadonlyMap<string, PersonalSynthesisCandidateMetadata>,
  signalRankById: ReadonlyMap<string, number>,
  userQuestion: PersonalSynthesisLifeQuestion | undefined,
  composeSignals: SynthesisSignalComposer = composeFixtureSignalGroup,
  rankingTieBreakLabel = 'existing Signal rank tie-break'
): readonly PersonalThemeGroup[] {
  const grouped = new Map<string, PersonalSynthesisSignalForTheme[]>();
  for (const signal of signals) {
    const themeKey = synthesisThemeKey(signal);
    const group = grouped.get(themeKey) ?? [];
    group.push(signal);
    grouped.set(themeKey, group);
  }

  return freezeArray(
    [...grouped.values()]
      .map((group) => createGroup(
        group,
        definitionBySignalId,
        signalRankById,
        userQuestion,
        composeSignals,
        rankingTieBreakLabel
      ))
      .sort(compareGroups)
  );
}

function combineFactReferences(
  signals: readonly PersonalSynthesisSignalForTheme[]
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

const WHY_READER_FACTORS: Readonly<
  Record<PersonalSynthesisSemanticBasisId, PersonalSynthesisWhyReaderFactor>
> = Object.freeze({
  'body.moon': Object.freeze({
    label: 'Moon',
    contribution: 'The Moon speaks to feeling, receptivity, and the rhythm of response.'
  }),
  'body.mercury': Object.freeze({
    label: 'Mercury',
    contribution: 'Mercury speaks to how a thought becomes words and how meaning travels between people.'
  }),
  'sign.aries': Object.freeze({
    label: 'Aries',
    contribution: 'Aries brings a direct impulse to begin and give an idea its first movement.'
  }),
  'modality.fixed': Object.freeze({
    label: 'Fixed emphasis',
    contribution: 'Fixed emphasis adds continuity, patience, and a wish to stay with what matters.'
  }),
  'rulership.basic': Object.freeze({
    label: 'Chart ruler',
    contribution: 'The chart ruler helps show where the chart gathers its organizing emphasis.'
  })
});

function readerWhyFactors(
  definitions: readonly PersonalSynthesisCandidateMetadata[]
): readonly PersonalSynthesisWhyReaderFactor[] {
  const seen = new Set<PersonalSynthesisSemanticBasisId>();
  const factors: PersonalSynthesisWhyReaderFactor[] = [];
  for (const definition of definitions) {
    const semanticBasisId = definition.semanticBasisId as PersonalSynthesisSemanticBasisId;
    if (seen.has(semanticBasisId)) {
      continue;
    }
    const factor = WHY_READER_FACTORS[semanticBasisId];
    if (factor === undefined) {
      throw new Error(`Missing reader astrology factor for ${definition.semanticBasisId}.`);
    }
    seen.add(semanticBasisId);
    factors.push(factor);
  }
  return freezeArray(factors);
}

function createTheme(
  group: PersonalThemeGroup,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN',
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
  const representativeSignalTraces = group.signals.filter(isStructuredSignal);
  const why: PersonalSynthesisWhyTrace = Object.freeze({
    text: `${group.template.whyLead} ${convergenceText} ${tensionText}`,
    reader: Object.freeze({
      summary: group.template.whyReaderSummary,
      factors: readerWhyFactors(group.definitions),
      synthesis: group.template.whyReaderSynthesis
    }),
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
    birthTimeAuthority,
    requiresKnownBirthTime: group.birthTimeDependency === 'REQUIRES_KNOWN',
    confidence: group.confidence,
    learnReferences: combineLearnReferences(group.template),
    ...(representativeSignalTraces.length > 0
      ? { representativeSignalTraces: freezeArray(representativeSignalTraces) }
      : {})
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
    convergenceKey: group.convergenceKey,
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
    editorial,
    ...(representativeSignalTraces.length > 0
      ? { representativeSignalTraces: freezeArray(representativeSignalTraces) }
      : {})
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
  selected: boolean,
  suppressedByRedundancy: boolean,
  retainedThemeKey: string | null,
  signalRankById: ReadonlyMap<string, number>,
  maxThemes: number,
  signalIdForDefinition: (definition: PersonalSynthesisCandidateMetadata) => string
): readonly PersonalSynthesisCandidateTrace[] {
  if (suppressedByRedundancy) {
    return freezeArray(group.definitions.map((definition) => Object.freeze({
      candidateKey: definition.candidateKey,
      signalId: signalIdForDefinition(definition),
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
      signalId: signalIdForDefinition(definition),
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
    fixtureDefinition.chartFacts.birthTimeAuthority,
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
      selectedThemeKeys.has(group.semanticThemeKey),
      suppressedThemeKeys.has(group.semanticThemeKey),
      [...selection.suppressed.entries()].find(([, suppressed]) =>
        suppressed.includes(group.semanticThemeKey)
      )?.[0] ?? null,
      signalRankById,
      maxThemes,
      (definition) => `personal-synthesis.${fixtureDefinition.scenarioId}.${definition.candidateKey}`
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

function structuredTemplateForSignal(
  signal: PersonalSynthesisStructuredSignalInput
): { readonly editorialTemplateId: PersonalSynthesisEditorialTemplateId; readonly semanticBasisId: string } {
  const bodyId = signal.semanticBasis.bodyId;
  if (signal.domain === 'EMOTIONAL' && bodyId === 'body.moon') {
    return { editorialTemplateId: 'emotional-pacing', semanticBasisId: 'body.moon' };
  }
  if (signal.domain === 'COMMUNICATION' && bodyId === 'body.mercury') {
    return { editorialTemplateId: 'communication-clarity', semanticBasisId: 'body.mercury' };
  }
  throw new Error(
    `Research Signal ${signal.signalId} has no bounded Personal Synthesis template for ${signal.domain} and ${String(bodyId)}.`
  );
}

function validateStructuredSignalInput(
  signal: PersonalSynthesisStructuredSignalInput
): void {
  nonEmpty(signal.signalId, 'Structured Signal signalId');
  nonEmpty(signal.compositionId, 'Structured Signal compositionId');
  nonEmpty(signal.signalThemeKey, 'Structured Signal signalThemeKey');
  nonEmpty(signal.placementEvidenceKey, 'Structured Signal placementEvidenceKey');
  nonEmpty(signal.semanticClaim, 'Structured Signal semanticClaim');
  nonEmpty(signal.constructiveCapacity, 'Structured Signal constructiveCapacity');
  nonEmpty(signal.possibleTension, 'Structured Signal possibleTension');

  if (signal.sourceType !== 'RESEARCH_REPRESENTATIVE_SIGNAL') {
    throw new Error(`Structured Signal ${signal.signalId} has an unsupported source type.`);
  }
  if (signal.authority !== 'DEVELOPMENT_ONLY') {
    throw new Error(`Structured Signal ${signal.signalId} cannot claim authoritative output.`);
  }
  if (signal.provenance.sourceAuthority !== 'INCOMPLETE_RESEARCH') {
    throw new Error(
      `Structured Signal ${signal.signalId} must remain INCOMPLETE_RESEARCH; AUTHORITATIVE_ENGINE is not accepted by this adapter.`
    );
  }
  if (signal.evidenceUnitCount !== 1) {
    throw new Error(`Structured Signal ${signal.signalId} must preserve one evidence unit.`);
  }
  if (signal.suppressionState !== 'ELIGIBLE') {
    throw new Error(`Structured Signal ${signal.signalId} is already suppressed.`);
  }
  if (signal.provenance.sourceFactRefs.length === 0) {
    throw new Error(`Structured Signal ${signal.signalId} must preserve a research provenance reference.`);
  }
  if (
    signal.birthTimeRequirement.status === 'UNKNOWN_TIME_SAFE' &&
    signal.birthTimeRequirement.requiresKnownBirthTime
  ) {
    throw new Error(`Structured Signal ${signal.signalId} has inconsistent birth-time requirements.`);
  }
  if (
    Object.prototype.hasOwnProperty.call(signal, 'internalStrength') ||
    Object.prototype.hasOwnProperty.call(signal, 'priority') ||
    Object.prototype.hasOwnProperty.call(signal, 'ranking')
  ) {
    throw new Error(
      `Structured Signal ${signal.signalId} must not invent Personal Synthesis ranking metadata.`
    );
  }
  structuredTemplateForSignal(signal);
}

function structuredCandidate(
  signal: PersonalSynthesisStructuredSignalInput
): PersonalSynthesisCandidateMetadata {
  const template = structuredTemplateForSignal(signal);
  const factReference: InterpretationFactReference = Object.freeze({
    factKind: 'OTHER',
    canonicalPath: `/research/composition-signals/${signal.placementEvidenceKey}`,
    canonicalFactIdentity: signal.placementEvidenceKey
  });
  const factInput: InterpretationFactInput = Object.freeze({
    reference: factReference,
    available: true,
    attributes: Object.freeze({
      sourceType: signal.sourceType,
      compositionId: signal.compositionId,
      placementEvidenceKey: signal.placementEvidenceKey
    })
  });

  return Object.freeze({
    candidateKey: signal.signalId,
    semanticThemeKey: signal.signalThemeKey,
    editorialTemplateId: template.editorialTemplateId,
    fact: factInput,
    factLabel: signal.placementEvidenceKey,
    semanticBasisId: template.semanticBasisId,
    compositionRuleId: `${signal.rule.ruleId}@${signal.rule.ruleVersion}`,
    convergenceKey: `composition-signal:${signal.signalThemeKey}`,
    redundancyKey: `composition-signal:${signal.signalThemeKey}`,
    independentEvidenceKey: signal.placementEvidenceKey,
    domain: signal.domain,
    direction: signal.direction,
    intensity: signal.intensity,
    confidence: signal.confidence,
    structuralCentrality: 'SUPPORTING',
    domainRelevance: 'CONTEXTUAL',
    userQuestionRelevance: 'NOT_SPECIFIED',
    requiresKnownBirthTime: signal.birthTimeRequirement.requiresKnownBirthTime
  });
}

/**
 * Downstream-only bridge for already-structured research Signals. It bypasses
 * the ChartFact → Signal registry because no authoritative Engine fact exists
 * in this POC, then reuses the same Personal Synthesis grouping, selection,
 * ranking, and editorial projection path as the fixture POC.
 */
export function synthesizePersonalThemesFromStructuredSignals(
  inputSignals: readonly PersonalSynthesisStructuredSignalInput[],
  options: {
    readonly maxThemes?: number;
    readonly userQuestion?: PersonalSynthesisLifeQuestion;
  } = {}
): PersonalSynthesisStructuredResult {
  if (inputSignals.length === 0) {
    throw new Error('Structured Signal synthesis requires at least one input Signal.');
  }
  inputSignals.forEach(validateStructuredSignalInput);

  const maxThemes = options.maxThemes ?? 5;
  if (!Number.isInteger(maxThemes) || maxThemes < 1 || maxThemes > 5) {
    throw new Error('Personal Synthesis POC maxThemes must be an integer from 1 through 5.');
  }

  const orderedSignals = inputSignals
    .slice()
    .sort((left, right) => left.signalId.localeCompare(right.signalId));
  const eligibleSignals: PersonalSynthesisStructuredSignalInput[] = [];
  const suppressedSignals: PersonalSynthesisStructuredSuppression[] = [];
  const seenPlacementEvidence = new Set<string>();
  for (const signal of orderedSignals) {
    if (seenPlacementEvidence.has(signal.placementEvidenceKey)) {
      suppressedSignals.push(Object.freeze({
        signalId: signal.signalId,
        placementEvidenceKey: signal.placementEvidenceKey,
        reason: 'DUPLICATE_SAME_PLACEMENT'
      }));
      continue;
    }
    seenPlacementEvidence.add(signal.placementEvidenceKey);
    eligibleSignals.push(signal);
  }

  const definitionBySignalId = new Map<string, PersonalSynthesisCandidateMetadata>();
  const signalRankById = new Map<string, number>();
  const definitions = eligibleSignals.map((signal, index) => {
    const definition = structuredCandidate(signal);
    definitionBySignalId.set(signal.signalId, definition);
    signalRankById.set(signal.signalId, index + 1);
    return definition;
  });
  const groups = groupByTheme(
    eligibleSignals,
    definitionBySignalId,
    signalRankById,
    options.userQuestion,
    composeStructuredSignalGroup,
    'stable research Signal identity order; no priority inferred'
  );
  const selection = selectGroups(groups, maxThemes);
  const selectedThemes = selection.selected.map((group, index) => createTheme(
    group,
    'UNKNOWN',
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

  const candidateTrace: PersonalSynthesisCandidateTrace[] = [];
  for (const definition of definitions) {
    const group = groups.find((candidateGroup) =>
      candidateGroup.definitions.some((candidate) => candidate.candidateKey === definition.candidateKey)
    );
    if (group === undefined) {
      throw new Error(`Structured Signal ${definition.candidateKey} was neither selected nor suppressed.`);
    }
    const groupTrace = traceSelectedGroup(
      group,
      selectedThemeKeys.has(group.semanticThemeKey),
      suppressedThemeKeys.has(group.semanticThemeKey),
      [...selection.suppressed.entries()].find(([, suppressed]) =>
        suppressed.includes(group.semanticThemeKey)
      )?.[0] ?? null,
      signalRankById,
      maxThemes,
      (candidate) => candidate.candidateKey
    );
    const trace = groupTrace.find((entry) => entry.candidateKey === definition.candidateKey);
    if (trace === undefined) {
      throw new Error(`Structured Signal trace missing for ${definition.candidateKey}.`);
    }
    candidateTrace.push(trace);
  }

  const synthesis: PersonalSynthesisResult = Object.freeze({
    scenarioId: 'COMPOSITION_SIGNAL_REPRESENTATIVE_SYNTHESIS',
    title: 'Representative Composition Signal synthesis',
    purpose: 'Downstream compatibility proof from admitted research Signals to bounded PersonalTheme candidates.',
    authority: 'DEVELOPMENT_ONLY',
    birthTimeAuthority: 'UNKNOWN',
    fixtureVersion: PERSONAL_SYNTHESIS_POC_FIXTURE_VERSION,
    semanticBasisStatus: 'RUNTIME_NOT_ADMITTED',
    evaluatedSignals: freezeArray(eligibleSignals),
    skippedRules: freezeArray([]),
    candidateTrace: freezeArray(candidateTrace),
    coreThemes: freezeArray(selectedThemes),
    naiveFactDump: freezeArray(inputSignals.map((signal) => signal.placementEvidenceKey))
  });

  return Object.freeze({
    sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL',
    inputSignals: freezeArray(inputSignals),
    eligibleSignals: freezeArray(eligibleSignals),
    suppressedSignals: freezeArray(suppressedSignals),
    synthesis
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
      redundancyKey: 'moon-response',
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
      redundancyKey: 'moon-response',
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
