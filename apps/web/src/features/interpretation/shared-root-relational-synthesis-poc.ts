/**
 * Development-only proof for shared-root relational Personal Synthesis.
 *
 * This module consumes already-structured representative Signals. It does not
 * calculate astronomy, create ChartFacts, or enter the production
 * interpretation index. Placement synthesis and placement coherence remain
 * owned by personal-synthesis-poc.ts; this module only adds the bounded aspect
 * bridge and its explicit root/unit accounting.
 */

import type {
  InterpretationConfidence,
  InterpretationFactReference,
  InterpretationSignalDirection,
  InterpretationSignalDomain,
  InterpretationSignalIntensity
} from './interpretation-signal-contracts.js';
import {
  createCompositionSignalResearchInput,
  type CompositionSignalPolicyRuleRecord
} from './composition-signal-personal-synthesis-poc.js';
import {
  synthesizePersonalThemesFromStructuredSignals,
  type PersonalSynthesisLifeQuestion,
  type PersonalSynthesisPersonalTheme,
  type PersonalSynthesisStructuredResult,
  type PersonalSynthesisStructuredSignalInput,
  type PersonalSynthesisStructuredSuppression
} from './personal-synthesis-poc.js';
import { INTERPRETATION_RULES_VERSION } from './interpretation-signal-engine.js';

export const SHARED_ROOT_RELATIONAL_SYNTHESIS_POC_VERSION = Object.freeze({
  id: 'NATALNODE_SHARED_ROOT_RELATIONAL_SYNTHESIS_POC_V1',
  version: '1.0.0'
});

export const SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULE = Object.freeze({
  id: 'shared-root-relational.compatibility.moon-mercury-conjunction',
  version: '1.0.0'
});

export const SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES = Object.freeze({
  'body.moon|body.mercury|conjunction': SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULE,
  'body.moon|body.venus|conjunction': Object.freeze({
    id: 'shared-root-relational.compatibility.moon-venus-conjunction',
    version: '1.0.0'
  }),
  'body.mercury|body.mars|conjunction': Object.freeze({
    id: 'shared-root-relational.compatibility.mercury-mars-conjunction',
    version: '1.0.0'
  })
} as const);

const SUPPORTED_RELATIONAL_BODY_PAIRS = Object.freeze([
  'body.moon|body.mercury',
  'body.moon|body.venus',
  'body.mercury|body.mars'
] as const);

const ASPECT_DIMENSIONS = Object.freeze([
  'BODY_A_FUNCTION',
  'BODY_B_FUNCTION',
  'ASPECT_RELATIONAL_OPERATOR'
] as const);

const SUPPORTED_ASPECT_TYPES = Object.freeze([
  'conjunction',
  'trine',
  'square',
  'opposition'
] as const);

type SupportedAspectType = (typeof SUPPORTED_ASPECT_TYPES)[number];
type AspectSemanticDimension = (typeof ASPECT_DIMENSIONS)[number];

export interface AspectSignalPolicyRuleRecord {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly compositionId: string;
  readonly signalId: string;
  readonly signalThemeKey: string;
  readonly requiredFactType: 'NATAL_ASPECT';
  readonly relationalFactId: string;
  readonly bodyAId: string;
  readonly bodyBId: string;
  readonly aspectType: string;
  readonly eligibleDomain: InterpretationSignalDomain;
  readonly direction: InterpretationSignalDirection;
  readonly candidateIntensity: InterpretationSignalIntensity;
  readonly candidateConfidence: InterpretationConfidence;
  readonly semanticUnit: {
    readonly id: string;
    readonly type: 'BODY_ASPECT_BODY';
    readonly count: 1;
  };
  readonly semanticDimensions: {
    readonly count: 3;
    readonly values: readonly string[];
  };
  readonly relationalSemanticClaim: string;
  readonly constructiveCapacity: string;
  readonly possibleTension: string;
  readonly semanticBasis: Readonly<Record<string, unknown>>;
  readonly evidenceLineage: {
    readonly relationalFactId: string;
    readonly relationalSemanticUnit: 'BODY_ASPECT_BODY';
    readonly evidenceRootKeys: readonly string[];
    readonly independentRootCount: 2;
    readonly uniqueRootCount: 2;
    readonly semanticUnitCount: 1;
    readonly semanticDimensionCount: 3;
    readonly relationalFactIndependentEvidenceIncrement: 0;
    readonly relationalFactIsIndependentRoot?: false;
  };
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[];
  readonly birthTimeRequirement: {
    readonly status: 'UNKNOWN_TIME_FAIL_CLOSED';
    readonly requiresKnownBirthTime: false;
    readonly requiresAuthoritativeCertification: boolean;
    readonly forbiddenDependencies: readonly string[];
  };
  readonly suppressionConditions: readonly string[];
  readonly runtimeEligibility: 'RUNTIME_NOT_ADMITTED';
  readonly policyState: 'ADOPTED_WITH_CONDITIONS';
  readonly provenance: {
    readonly runtimeStatus: 'RUNTIME_NOT_ADMITTED';
    readonly researchFixtureAuthority?: 'DEVELOPMENT_ONLY_SUPPRESS';
  };
}

export interface SharedRootAspectSignalInput {
  readonly sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL';
  readonly signalId: string;
  readonly compositionId: string;
  readonly signalThemeKey: string;
  readonly rule: {
    readonly ruleId: string;
    readonly ruleVersion: string;
    readonly interpretationRulesVersion: typeof INTERPRETATION_RULES_VERSION;
  };
  readonly domain: InterpretationSignalDomain;
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly provenance: {
    readonly sourceAuthority: 'INCOMPLETE_RESEARCH';
    readonly engineResultReference: string;
    readonly sourceFactRefs: readonly InterpretationFactReference[];
    readonly scientificConfigurationIdentity: null;
    readonly provenanceEnvelopeId: null;
  };
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly aspectScope: 'SINGLE_NATAL_CHART';
  readonly aspectType: SupportedAspectType;
  readonly bodyAId: string;
  readonly bodyBId: string;
  readonly relationalFactId: string;
  readonly semanticUnit: {
    readonly id: string;
    readonly type: 'BODY_ASPECT_BODY';
    readonly count: 1;
  };
  readonly semanticDimensions: {
    readonly count: 3;
    readonly values: readonly AspectSemanticDimension[];
  };
  readonly evidenceLineage: {
    readonly evidenceRootKeys: readonly string[];
    readonly uniqueRootCount: 2;
    readonly semanticUnitCount: 1;
    readonly semanticDimensionCount: 3;
    readonly relationalFactIndependentEvidenceIncrement: 0;
  };
  readonly semanticClaim: string;
  readonly constructiveCapacity: string;
  readonly possibleTension: string;
  readonly semanticBasis: Readonly<Record<string, unknown>>;
  readonly semanticBasisIds: readonly string[];
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[];
  readonly birthTimeRequirement: {
    readonly status: 'UNKNOWN_TIME_FAIL_CLOSED';
    readonly requiresKnownBirthTime: false;
    readonly requiresAuthoritativeCertification: boolean;
    readonly forbiddenDependencies: readonly string[];
  };
  readonly suppressionConditions: readonly string[];
  readonly suppressionState: 'ELIGIBLE';
}

export type SharedRootSignalInput =
  | PersonalSynthesisStructuredSignalInput
  | SharedRootAspectSignalInput;

export type SharedRootSuppression =
  | PersonalSynthesisStructuredSuppression
  | Readonly<{
      readonly signalId: string;
      readonly reason:
        | 'DUPLICATE_RELATIONAL_FACT'
        | 'UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION';
    }>;

export type SharedRootClassification =
  | 'RELATIONAL_ENRICHMENT'
  | 'NO_RELATIONAL_ENRICHMENT'
  | 'CONFLICTING_BODY_SIGN_PLACEMENT';

export interface SharedRootCompatibilityDecision {
  readonly status: 'RELATIONAL_ENRICHMENT' | 'NO_RELATIONAL_ENRICHMENT';
  readonly ruleId: string | null;
  readonly ruleVersion: string | null;
  readonly reason: string;
  readonly integratedSemanticBasisIds: readonly string[];
  readonly sharedRootKeys: readonly string[];
}

export interface SharedRootEvidenceAccounting {
  readonly semanticUnitIds: readonly string[];
  readonly semanticUnitCount: number;
  readonly placementSemanticUnitCount: number;
  readonly relationalSemanticUnitCount: number;
  readonly relationalSemanticDimensionCount: number;
  readonly uniqueRootKeys: readonly string[];
  readonly uniqueRootCount: number;
  readonly independentEvidenceUnitCount: number;
  readonly relationalFactIndependentEvidenceIncrement: 0;
  readonly evidenceInflation: 0;
}

export interface SharedRootPlacementProvenanceChain {
  readonly signalId: string;
  readonly compositionId: string;
  readonly rule: PersonalSynthesisStructuredSignalInput['rule'];
  readonly placementEvidenceKey: string;
  readonly bodyId: string;
  readonly signId: string;
  readonly semanticUnitId: string;
  readonly evidenceRootKey: string;
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[];
}

export interface SharedRootAspectProvenanceChain {
  readonly signalId: string;
  readonly compositionId: string;
  readonly rule: SharedRootAspectSignalInput['rule'];
  readonly relationalFactId: string;
  readonly aspectType: SupportedAspectType;
  readonly semanticUnitId: string;
  readonly evidenceRootKeys: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath: string;
  }[];
}

export interface SharedRootWhyTrace {
  readonly summary: string;
  readonly text: string;
  readonly sourceSignalIds: readonly string[];
  readonly sourceSemanticUnitIds: readonly string[];
  readonly uniqueRootKeys: readonly string[];
  readonly compatibilityRule: {
    readonly id: string;
    readonly version: string;
  } | null;
  readonly references: Readonly<Record<string, unknown>>;
}

export interface SharedRootRelationalPersonalTheme {
  readonly themeId: string;
  readonly semanticThemeKey: string;
  readonly type: 'PERSONAL_THEME';
  readonly domain: InterpretationSignalDomain;
  readonly domainDerivation: {
    readonly method: 'INTEGRATED_THEME_SEMANTICS';
    readonly selectedDomain: InterpretationSignalDomain;
    readonly majorityVote: false;
    readonly compositionQuestion: string;
    readonly rationale: string;
  };
  readonly contributingDomains: readonly InterpretationSignalDomain[];
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly sourceSignalIds: readonly string[];
  readonly sourcePlacementSignalIds: readonly string[];
  readonly sourceAspectSignalId: string;
  readonly sourceSemanticUnitIds: readonly string[];
  readonly semanticUnitCount: 3;
  readonly semanticDepth: {
    readonly beforePlacementUnitCount: 2;
    readonly afterRelationalUnitCount: 3;
    readonly increased: true;
  };
  readonly uniqueRootKeys: readonly string[];
  readonly uniqueRootCount: 2;
  readonly semanticBasisIds: readonly string[];
  readonly compositionRuleRefs: readonly string[];
  readonly compatibilityRule: {
    readonly id: string;
    readonly version: string;
  };
  readonly convergence: {
    readonly status: 'RELATIONAL_ENRICHMENT';
    readonly independentEvidenceKeys: readonly string[];
  };
  readonly subsumedThemeIds: readonly string[];
  readonly subsumptionState: 'SUBSUMES_PLACEMENT_THEMES';
  readonly authorityRequirements: {
    readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  };
  readonly editorial: {
    readonly recognition: string;
    readonly strength: string;
    readonly pattern: string;
    readonly tension: string;
    readonly lever: string;
    readonly why: SharedRootWhyTrace;
    readonly learnReferences: readonly {
      readonly objectId: string;
      readonly label: string;
      readonly sourcePath: string;
    }[];
  };
  readonly provenance: {
    readonly sourceAuthority: 'INCOMPLETE_RESEARCH';
    readonly placementChains: readonly SharedRootPlacementProvenanceChain[];
    readonly aspectChain: SharedRootAspectProvenanceChain;
  };
}

export interface SharedRootRelationalSynthesisResult {
  readonly sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL';
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly birthTimeAuthority: 'KNOWN' | 'UNKNOWN';
  readonly inputSignals: readonly SharedRootSignalInput[];
  readonly placementSignals: readonly PersonalSynthesisStructuredSignalInput[];
  readonly aspectSignals: readonly SharedRootAspectSignalInput[];
  readonly eligibleSignals: readonly SharedRootSignalInput[];
  readonly suppressedSignals: readonly SharedRootSuppression[];
  readonly coherence: PersonalSynthesisStructuredResult['coherence'];
  readonly accounting: SharedRootEvidenceAccounting;
  readonly compatibility: SharedRootCompatibilityDecision;
  readonly classification: SharedRootClassification;
  readonly synthesis: {
    readonly placementThemesBefore: readonly PersonalSynthesisPersonalTheme[];
    readonly enrichedThemes: readonly SharedRootRelationalPersonalTheme[];
    readonly outputThemes: readonly (
      | PersonalSynthesisPersonalTheme
      | SharedRootRelationalPersonalTheme
    )[];
    readonly subsumedThemeIds: readonly string[];
    readonly standaloneAspectThemeCount: 0;
    readonly maxThemes: number;
  };
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)].sort());
}

function uniqueInOrder(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)]);
}

function nonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isSupportedAspectType(value: string): value is SupportedAspectType {
  return (SUPPORTED_ASPECT_TYPES as readonly string[]).includes(value);
}

function relationalBodyPairKey(bodyAId: string, bodyBId: string): string {
  return `${bodyAId}|${bodyBId}`;
}

function relationalCompatibilityKey(
  bodyAId: string,
  bodyBId: string,
  aspectType: string
): string {
  return `${relationalBodyPairKey(bodyAId, bodyBId)}|${aspectType}`;
}

type RelationalCompatibilityRule =
  (typeof SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES)[keyof typeof SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES];

function getRelationalCompatibilityRule(key: string): RelationalCompatibilityRule | undefined {
  if (!Object.prototype.hasOwnProperty.call(SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES, key)) {
    return undefined;
  }
  return SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES[
    key as keyof typeof SHARED_ROOT_RELATIONAL_COMPATIBILITY_RULES
  ];
}

function isSupportedRelationalBodyPair(bodyAId: string, bodyBId: string): boolean {
  return (SUPPORTED_RELATIONAL_BODY_PAIRS as readonly string[]).includes(
    relationalBodyPairKey(bodyAId, bodyBId)
  );
}

function expectedPositionRoots(bodyAId: string, bodyBId: string): readonly string[] {
  return uniqueSorted([`${bodyAId}.position`, `${bodyBId}.position`]);
}

function placementRootKey(signal: PersonalSynthesisStructuredSignalInput): string {
  if (![
    'body.sun',
    'body.moon',
    'body.mercury',
    'body.venus',
    'body.mars'
  ].includes(signal.bodyId)) {
    throw new Error(`Shared-root POC does not admit placement body ${signal.bodyId}.`);
  }
  return `${signal.bodyId}.position`;
}

function placementSemanticUnitId(signal: PersonalSynthesisStructuredSignalInput): string {
  return `semantic-unit.${signal.placementEvidenceKey}`;
}

function aspectRootKeys(signal: SharedRootAspectSignalInput): readonly string[] {
  const roots = uniqueSorted(signal.evidenceLineage.evidenceRootKeys);
  const expectedRoots = expectedPositionRoots(signal.bodyAId, signal.bodyBId);
  if (!sameStrings(roots, expectedRoots)) {
    throw new Error(`Aspect Signal ${signal.signalId} must preserve both admitted position roots.`);
  }
  return roots;
}

function rejectAspectRule(rule: AspectSignalPolicyRuleRecord, reason: string): never {
  throw new Error(`Aspect Signal ${rule.signalId} is not admitted by the shared-root POC: ${reason}`);
}

/**
 * Converts one admitted representative aspect rule into a downstream-only
 * research Signal. The source remains INCOMPLETE_RESEARCH and DEVELOPMENT_ONLY.
 */
export function createAspectSignalResearchInput(
  rule: AspectSignalPolicyRuleRecord
): SharedRootAspectSignalInput {
  nonEmpty(rule.ruleId, 'Aspect Signal ruleId');
  nonEmpty(rule.ruleVersion, 'Aspect Signal ruleVersion');
  nonEmpty(rule.compositionId, 'Aspect Signal compositionId');
  nonEmpty(rule.signalId, 'Aspect Signal signalId');
  nonEmpty(rule.signalThemeKey, 'Aspect Signal signalThemeKey');
  nonEmpty(rule.relationalFactId, 'Aspect Signal relationalFactId');
  nonEmpty(rule.relationalSemanticClaim, 'Aspect Signal relationalSemanticClaim');
  nonEmpty(rule.constructiveCapacity, 'Aspect Signal constructiveCapacity');
  nonEmpty(rule.possibleTension, 'Aspect Signal possibleTension');

  if (rule.requiredFactType !== 'NATAL_ASPECT') {
    return rejectAspectRule(rule, 'unsupported fact type');
  }
  if (!isSupportedRelationalBodyPair(rule.bodyAId, rule.bodyBId)) {
    return rejectAspectRule(rule, 'the body pair is outside the three admitted personal relational pairs');
  }
  if (!isSupportedAspectType(rule.aspectType)) {
    return rejectAspectRule(rule, 'unsupported aspect type');
  }
  if (rule.runtimeEligibility !== 'RUNTIME_NOT_ADMITTED' ||
      rule.policyState !== 'ADOPTED_WITH_CONDITIONS' ||
      rule.provenance.runtimeStatus !== 'RUNTIME_NOT_ADMITTED') {
    return rejectAspectRule(rule, 'runtime or policy status is not research-only');
  }
  if (rule.semanticUnit.type !== 'BODY_ASPECT_BODY' || rule.semanticUnit.count !== 1) {
    return rejectAspectRule(rule, 'relational semantic unit must count as one');
  }
  if (rule.semanticDimensions.count !== 3 ||
      !sameStrings(rule.semanticDimensions.values, ASPECT_DIMENSIONS)) {
    return rejectAspectRule(rule, 'semantic dimensions must remain three distinct dimensions');
  }
  if (rule.evidenceLineage.relationalSemanticUnit !== 'BODY_ASPECT_BODY' ||
      rule.evidenceLineage.independentRootCount !== 2 ||
      rule.evidenceLineage.uniqueRootCount !== 2 ||
      rule.evidenceLineage.semanticUnitCount !== 1 ||
      rule.evidenceLineage.semanticDimensionCount !== 3 ||
      rule.evidenceLineage.relationalFactIndependentEvidenceIncrement !== 0) {
    return rejectAspectRule(rule, 'root and semantic-unit accounting is not admitted');
  }
  if (rule.birthTimeRequirement.status !== 'UNKNOWN_TIME_FAIL_CLOSED' ||
      rule.birthTimeRequirement.requiresKnownBirthTime !== false) {
    return rejectAspectRule(rule, 'unknown-time policy is not fail-closed');
  }

  const roots = uniqueSorted(rule.evidenceLineage.evidenceRootKeys);
  if (!sameStrings(roots, expectedPositionRoots(rule.bodyAId, rule.bodyBId))) {
    return rejectAspectRule(rule, 'position root lineage is incomplete or inflated');
  }

  const sourceFactReference = Object.freeze({
    factKind: 'NATAL_ASPECT' as const,
    canonicalPath: `/research/aspect-signals/${rule.relationalFactId}`,
    canonicalFactIdentity: rule.relationalFactId
  });

  return Object.freeze({
    sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL',
    signalId: rule.signalId,
    compositionId: rule.compositionId,
    signalThemeKey: rule.signalThemeKey,
    rule: Object.freeze({
      ruleId: rule.ruleId,
      ruleVersion: rule.ruleVersion,
      interpretationRulesVersion: INTERPRETATION_RULES_VERSION
    }),
    domain: rule.eligibleDomain,
    direction: rule.direction,
    intensity: rule.candidateIntensity,
    confidence: rule.candidateConfidence,
    provenance: Object.freeze({
      sourceAuthority: 'INCOMPLETE_RESEARCH' as const,
      engineResultReference: 'research://aspect-signal-policy',
      sourceFactRefs: Object.freeze([sourceFactReference]),
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    }),
    authority: 'DEVELOPMENT_ONLY',
    aspectScope: 'SINGLE_NATAL_CHART',
    aspectType: rule.aspectType,
    bodyAId: rule.bodyAId,
    bodyBId: rule.bodyBId,
    relationalFactId: rule.relationalFactId,
    semanticUnit: Object.freeze({
      id: rule.semanticUnit.id,
      type: rule.semanticUnit.type,
      count: rule.semanticUnit.count
    }),
    semanticDimensions: Object.freeze({
      count: rule.semanticDimensions.count,
      values: Object.freeze([...ASPECT_DIMENSIONS])
    }),
    evidenceLineage: Object.freeze({
      evidenceRootKeys: roots,
      uniqueRootCount: rule.evidenceLineage.uniqueRootCount,
      semanticUnitCount: rule.evidenceLineage.semanticUnitCount,
      semanticDimensionCount: rule.evidenceLineage.semanticDimensionCount,
      relationalFactIndependentEvidenceIncrement:
        rule.evidenceLineage.relationalFactIndependentEvidenceIncrement
    }),
    semanticClaim: rule.relationalSemanticClaim,
    constructiveCapacity: rule.constructiveCapacity,
    possibleTension: rule.possibleTension,
    semanticBasis: Object.freeze({ ...rule.semanticBasis }),
    semanticBasisIds: Object.freeze([
      rule.bodyAId,
      rule.bodyBId,
      `aspect.relation.${rule.aspectType}`
    ]),
    whyReferences: Object.freeze({ ...rule.whyReferences }),
    learnReferences: Object.freeze(
      rule.learnReferences.map((reference) => Object.freeze({ ...reference }))
    ),
    birthTimeRequirement: Object.freeze({
      status: rule.birthTimeRequirement.status,
      requiresKnownBirthTime: rule.birthTimeRequirement.requiresKnownBirthTime,
      requiresAuthoritativeCertification: rule.birthTimeRequirement.requiresAuthoritativeCertification,
      forbiddenDependencies: Object.freeze([...rule.birthTimeRequirement.forbiddenDependencies])
    }),
    suppressionConditions: Object.freeze([...rule.suppressionConditions]),
    suppressionState: 'ELIGIBLE'
  });
}

export function createSharedRootPlacementSignal(
  rule: CompositionSignalPolicyRuleRecord
): PersonalSynthesisStructuredSignalInput {
  return createCompositionSignalResearchInput(rule);
}

function noRelationalCompatibility(
  reason: string,
  sharedRootKeys: readonly string[] = [],
  integratedSemanticBasisIds: readonly string[] = []
): SharedRootCompatibilityDecision {
  return Object.freeze({
    status: 'NO_RELATIONAL_ENRICHMENT',
    ruleId: null,
    ruleVersion: null,
    reason,
    integratedSemanticBasisIds: freezeArray(integratedSemanticBasisIds),
    sharedRootKeys: freezeArray(sharedRootKeys)
  });
}

/**
 * Deterministic compatibility policy for the bounded admitted relational
 * bridges. Shared roots are reported, but they never qualify as compatibility
 * by themselves.
 */
export function evaluateRelationalCompatibility(
  placementSignals: readonly PersonalSynthesisStructuredSignalInput[],
  aspectSignal: SharedRootAspectSignalInput,
  options: {
    readonly integratedSemanticBasisIds?: readonly string[];
  } = {}
): SharedRootCompatibilityDecision {
  const expectedBasisIds = Object.freeze([
    aspectSignal.bodyAId,
    aspectSignal.bodyBId,
    `aspect.relation.${aspectSignal.aspectType}`
  ]);
  const integratedBasisIds = freezeArray(
    options.integratedSemanticBasisIds ?? expectedBasisIds
  );
  const roots = uniqueSorted([
    ...placementSignals.map(placementRootKey),
    ...aspectRootKeys(aspectSignal)
  ]);

  if (!sameStrings(integratedBasisIds, expectedBasisIds)) {
    return noRelationalCompatibility(
      'Shared roots are present, but the integrated semantic basis does not admit both body functions and the relational operator.',
      roots,
      integratedBasisIds
    );
  }
  if (placementSignals.length !== 2) {
    return noRelationalCompatibility(
      'The admitted compatibility rule requires exactly two distinct placement Signals.',
      roots,
      integratedBasisIds
    );
  }
  const bodyIds = uniqueSorted(placementSignals.map((signal) => signal.bodyId));
  if (!sameStrings(bodyIds, expectedPositionRoots(aspectSignal.bodyAId, aspectSignal.bodyBId)
    .map((root) => root.replace(/\.position$/u, '')))) {
    return noRelationalCompatibility(
      'The admitted compatibility rule requires one placement for each participating body.',
      roots,
      integratedBasisIds
    );
  }
  const compatibilityRule = getRelationalCompatibilityRule(
    relationalCompatibilityKey(aspectSignal.bodyAId, aspectSignal.bodyBId, aspectSignal.aspectType)
  );
  if (compatibilityRule === undefined) {
    return noRelationalCompatibility(
      'The current bounded relational rules admit conjunction only for the three reviewed personal body pairs.',
      roots,
      integratedBasisIds
    );
  }
  if (aspectSignal.semanticUnit.type !== 'BODY_ASPECT_BODY' ||
      aspectSignal.semanticUnit.count !== 1 ||
      aspectSignal.semanticDimensions.count !== 3 ||
      aspectSignal.evidenceLineage.relationalFactIndependentEvidenceIncrement !== 0) {
    return noRelationalCompatibility(
      'The relational Signal does not preserve one unit, three dimensions, and zero new evidence roots.',
      roots,
      integratedBasisIds
    );
  }
  if (!sameStrings(roots, expectedPositionRoots(aspectSignal.bodyAId, aspectSignal.bodyBId))) {
    return noRelationalCompatibility(
      'The relational Signal does not share exactly the two participating position roots.',
      roots,
      integratedBasisIds
    );
  }

  return Object.freeze({
    status: 'RELATIONAL_ENRICHMENT',
    ruleId: compatibilityRule.id,
    ruleVersion: compatibilityRule.version,
    reason: `${aspectSignal.bodyAId} and ${aspectSignal.bodyBId} are admitted as one integrated ${aspectSignal.aspectType} relational question; shared roots alone are insufficient.`,
    integratedSemanticBasisIds: integratedBasisIds,
    sharedRootKeys: roots
  });
}

function validateMaxThemes(maxThemes: number): void {
  if (!Number.isInteger(maxThemes) || maxThemes < 1 || maxThemes > 5) {
    throw new Error('Shared-root relational synthesis maxThemes must be an integer from 1 through 5.');
  }
}

function sourceSignalIds(
  placementSignals: readonly PersonalSynthesisStructuredSignalInput[],
  aspectSignal: SharedRootAspectSignalInput
): readonly string[] {
  return freezeArray([
    ...placementSignals.map((signal) => signal.signalId),
    aspectSignal.signalId
  ].sort());
}

function learnReferencesForTheme(
  placements: readonly PersonalSynthesisStructuredSignalInput[],
  aspect: SharedRootAspectSignalInput
): SharedRootRelationalPersonalTheme['editorial']['learnReferences'] {
  const references = [
    ...placements.flatMap((signal) => signal.learnReferences),
    ...aspect.learnReferences
  ];
  const seen = new Set<string>();
  return freezeArray(references.filter((reference) => {
    const key = `${reference.objectId}|${reference.sourcePath}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).map((reference) => Object.freeze({ ...reference })));
}

function createPlacementProvenanceChain(
  signal: PersonalSynthesisStructuredSignalInput
): SharedRootPlacementProvenanceChain {
  return Object.freeze({
    signalId: signal.signalId,
    compositionId: signal.compositionId,
    rule: signal.rule,
    placementEvidenceKey: signal.placementEvidenceKey,
    bodyId: signal.bodyId,
    signId: signal.signId,
    semanticUnitId: placementSemanticUnitId(signal),
    evidenceRootKey: placementRootKey(signal),
    sourceFactRefs: freezeArray(signal.provenance.sourceFactRefs),
    whyReferences: signal.whyReferences,
    learnReferences: freezeArray(signal.learnReferences)
  });
}

function createAspectProvenanceChain(
  signal: SharedRootAspectSignalInput
): SharedRootAspectProvenanceChain {
  return Object.freeze({
    signalId: signal.signalId,
    compositionId: signal.compositionId,
    rule: signal.rule,
    relationalFactId: signal.relationalFactId,
    aspectType: signal.aspectType,
    semanticUnitId: signal.semanticUnit.id,
    evidenceRootKeys: aspectRootKeys(signal),
    sourceFactRefs: freezeArray(signal.provenance.sourceFactRefs),
    whyReferences: signal.whyReferences,
    learnReferences: freezeArray(signal.learnReferences)
  });
}

function createAccounting(
  placementSignals: readonly PersonalSynthesisStructuredSignalInput[],
  aspectSignals: readonly SharedRootAspectSignalInput[]
): SharedRootEvidenceAccounting {
  const placementUnitIds = placementSignals.map(placementSemanticUnitId);
  const relationalUnitIds = aspectSignals.map((signal) => signal.semanticUnit.id);
  const semanticUnitIds = uniqueInOrder([...placementUnitIds, ...relationalUnitIds]);
  const rootKeys = uniqueSorted([
    ...placementSignals.map(placementRootKey),
    ...aspectSignals.flatMap(aspectRootKeys)
  ]);
  return Object.freeze({
    semanticUnitIds,
    semanticUnitCount: semanticUnitIds.length,
    placementSemanticUnitCount: uniqueInOrder(placementUnitIds).length,
    relationalSemanticUnitCount: uniqueInOrder(relationalUnitIds).length,
    relationalSemanticDimensionCount: aspectSignals.length > 0 ? 3 : 0,
    uniqueRootKeys: rootKeys,
    uniqueRootCount: rootKeys.length,
    independentEvidenceUnitCount: placementSignals.length,
    relationalFactIndependentEvidenceIncrement: 0,
    evidenceInflation: 0
  });
}

function emptyAccounting(): SharedRootEvidenceAccounting {
  return Object.freeze({
    semanticUnitIds: freezeArray([]),
    semanticUnitCount: 0,
    placementSemanticUnitCount: 0,
    relationalSemanticUnitCount: 0,
    relationalSemanticDimensionCount: 0,
    uniqueRootKeys: freezeArray([]),
    uniqueRootCount: 0,
    independentEvidenceUnitCount: 0,
    relationalFactIndependentEvidenceIncrement: 0,
    evidenceInflation: 0
  });
}

interface RelationalEditorialProfile {
  readonly themeId: string;
  readonly semanticThemeKey: string;
  readonly domain: InterpretationSignalDomain;
  readonly compositionQuestion: string;
  readonly domainRationale: string;
  readonly whySummary: string;
  readonly whyText: string;
  readonly recognition: string;
  readonly strength: string;
  readonly pattern: string;
  readonly tension: string;
  readonly lever: string;
}

function relationalEditorialProfile(
  aspectSignal: SharedRootAspectSignalInput
): RelationalEditorialProfile {
  const key = relationalCompatibilityKey(
    aspectSignal.bodyAId,
    aspectSignal.bodyBId,
    aspectSignal.aspectType
  );
  if (key === 'body.moon|body.mercury|conjunction') {
    return {
      themeId: 'shared-root-relational.moon-mercury-conjunction',
      semanticThemeKey: 'communication-moon-mercury-relational',
      domain: 'COMMUNICATION',
      compositionQuestion: 'How may recurring response and naming meet in close exchange without either becoming the whole meaning?',
      domainRationale: 'The integrated Moon response × Mercury naming × conjunction composition describes a life-question about exchange and formulation, so COMMUNICATION is selected from the closed domain set; no body-only mapping or domain majority vote is used.',
      whySummary: 'This PersonalTheme is one relationally enriched communication theme, not a count increase in evidence strength.',
      whyText: 'Moon response and Mercury naming are explored together through conjunction close coupling: the useful new meaning is how a response becomes language and how language gives a response a form, while the two position roots remain the same two astronomical roots.',
      recognition: 'You may notice that a felt response and the words used to name it arrive close together, so each can change how the other is understood.',
      strength: 'You can give an immediate response enough language to be examined without treating the first formulation as final.',
      pattern: 'When something matters, response and naming may move as one exchange: feeling shapes the words, and the words give the feeling a form that can be answered.',
      tension: 'Close coupling can let an immediate response become a settled interpretation, or let interpretation move ahead of receptivity.',
      lever: 'Name the response in one sentence, then leave room for the next observation or answer to revise the wording.'
    };
  }
  if (key === 'body.moon|body.venus|conjunction') {
    return {
      themeId: 'shared-root-relational.moon-venus-conjunction',
      semanticThemeKey: 'relationship-moon-venus-relational',
      domain: 'RELATIONSHIP',
      compositionQuestion: 'How may recurring need and valuation meet in close relating without turning either into a fixed verdict about connection?',
      domainRationale: 'The integrated Moon response × Venus valuation × conjunction composition describes a life-question about how receptivity and preference shape relating; RELATIONSHIP is selected from the closed domain set, not inherited from Venus alone.',
      whySummary: 'This PersonalTheme is one relationally enriched connection theme, not a promotion of relationship certainty or evidence strength.',
      whyText: 'Moon response and Venus valuation are explored together through conjunction close coupling: a need can shape what is valued, while a preference can give a response a form for attention, without collapsing either function into a connection verdict.',
      recognition: 'You may notice that a recurring need and a clear preference arrive together when deciding how to stay responsive in a connection.',
      strength: 'You can name what feels sustaining while leaving enough room for the relationship to answer with new information.',
      pattern: 'When connection matters, response and valuation may move as one exchange: a need shapes preference, and preference gives the need a form that can be considered.',
      tension: 'Close coupling can let a need borrow certainty from a preference, or let a preference stand in for listening to the response underneath it.',
      lever: 'Name the need and the preference separately, then ask what would keep the exchange responsive rather than settled too soon.'
    };
  }
  if (key === 'body.mercury|body.mars|conjunction') {
    return {
      themeId: 'shared-root-relational.mercury-mars-conjunction',
      semanticThemeKey: 'action-decision-mercury-mars-relational',
      domain: 'ACTION_DECISION',
      compositionQuestion: 'How may interpretation and assertion occupy one field while an idea becomes a revisable next action?',
      domainRationale: 'The integrated Mercury naming × Mars directed effort × conjunction composition describes a life-question about moving from interpretation into action; ACTION_DECISION is selected from the closed domain set, not inherited from Mars alone.',
      whySummary: 'This PersonalTheme is one relationally enriched action-and-interpretation theme, not a promotion of certainty or force.',
      whyText: 'Mercury naming and Mars directed effort are explored together through conjunction close coupling: an interpretation can shape the next action while an action tests the interpretation, and the two position roots remain the same two astronomical roots.',
      recognition: 'You may notice that naming a choice and moving toward it happen close together, so each can revise how the other is understood.',
      strength: 'You can turn an interpretation into a deliberate next step while keeping the wording and the action open to revision.',
      pattern: 'When something needs movement, interpretation and assertion may form one exchange: the words organize the effort, and the effort tests the words.',
      tension: 'Close coupling can let a first interpretation rush into action, or let the momentum of action make an untested explanation feel settled.',
      lever: 'State the interpretation, choose one reversible action, and name the observation that would make you revise either one.'
    };
  }
  throw new Error(`No relational editorial profile is admitted for ${key}.`);
}

function createEnrichedTheme(
  placementThemes: readonly PersonalSynthesisPersonalTheme[],
  placementSignals: readonly PersonalSynthesisStructuredSignalInput[],
  aspectSignal: SharedRootAspectSignalInput,
  compatibility: SharedRootCompatibilityDecision,
  accounting: SharedRootEvidenceAccounting,
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): SharedRootRelationalPersonalTheme {
  if (compatibility.status !== 'RELATIONAL_ENRICHMENT' ||
      compatibility.ruleId === null || compatibility.ruleVersion === null) {
    throw new Error('An enriched theme requires an admitted compatibility rule.');
  }
  const sourcePlacementSignalIds = freezeArray(
    placementSignals.map((signal) => signal.signalId).sort()
  );
  const sourceSignals = sourceSignalIds(placementSignals, aspectSignal);
  const semanticBasisIds = compatibility.integratedSemanticBasisIds;
  const subsumedThemeIds = freezeArray(placementThemes.map((theme) => theme.themeId).sort());
  const profile = relationalEditorialProfile(aspectSignal);
  if (accounting.semanticUnitCount !== 3 || accounting.uniqueRootCount !== 2) {
    throw new Error('Relational enrichment requires three semantic units and two unique roots.');
  }
  const compositionRuleRefs = freezeArray([
    ...placementSignals.map((signal) => `${signal.rule.ruleId}@${signal.rule.ruleVersion}`),
    `${aspectSignal.rule.ruleId}@${aspectSignal.rule.ruleVersion}`,
    `${compatibility.ruleId}@${compatibility.ruleVersion}`
  ]);
  const why = Object.freeze({
    summary: profile.whySummary,
    text: profile.whyText,
    sourceSignalIds: sourceSignals,
    sourceSemanticUnitIds: accounting.semanticUnitIds,
    uniqueRootKeys: accounting.uniqueRootKeys,
    compatibilityRule: Object.freeze({
      id: compatibility.ruleId,
      version: compatibility.ruleVersion
    }),
    references: Object.freeze({
      placementSignals: sourcePlacementSignalIds,
      aspectSignal: aspectSignal.signalId,
      relationalFactId: aspectSignal.relationalFactId,
      semanticBasisIds,
      evidenceInflation: accounting.evidenceInflation,
      confidence: 'LOW',
      intensity: 'SUBTLE'
    })
  });

  return Object.freeze({
    themeId: profile.themeId,
    semanticThemeKey: profile.semanticThemeKey,
    type: 'PERSONAL_THEME',
    domain: profile.domain,
    domainDerivation: Object.freeze({
      method: 'INTEGRATED_THEME_SEMANTICS',
      selectedDomain: profile.domain,
      majorityVote: false,
      compositionQuestion: profile.compositionQuestion,
      rationale: profile.domainRationale
    }),
    contributingDomains: uniqueSorted([
      ...placementSignals.map((signal) => signal.domain),
      aspectSignal.domain
    ]) as readonly InterpretationSignalDomain[],
    direction: 'NEUTRAL',
    intensity: 'SUBTLE',
    confidence: 'LOW',
    authority: 'DEVELOPMENT_ONLY',
    sourceSignalIds: sourceSignals,
    sourcePlacementSignalIds,
    sourceAspectSignalId: aspectSignal.signalId,
    sourceSemanticUnitIds: accounting.semanticUnitIds,
    semanticUnitCount: 3,
    semanticDepth: Object.freeze({
      beforePlacementUnitCount: 2,
      afterRelationalUnitCount: 3,
      increased: true
    }),
    uniqueRootKeys: accounting.uniqueRootKeys,
    uniqueRootCount: 2,
    semanticBasisIds,
    compositionRuleRefs,
    compatibilityRule: Object.freeze({
      id: compatibility.ruleId,
      version: compatibility.ruleVersion
    }),
    convergence: Object.freeze({
      status: 'RELATIONAL_ENRICHMENT',
      independentEvidenceKeys: freezeArray([])
    }),
    subsumedThemeIds,
    subsumptionState: 'SUBSUMES_PLACEMENT_THEMES',
    authorityRequirements: Object.freeze({
      birthTimeDependency: birthTimeAuthority === 'UNKNOWN'
        ? 'UNKNOWN_TIME_SAFE'
        : 'REQUIRES_KNOWN'
    }),
    editorial: Object.freeze({
      recognition: profile.recognition,
      strength: profile.strength,
      pattern: profile.pattern,
      tension: profile.tension,
      lever: profile.lever,
      why,
      learnReferences: learnReferencesForTheme(placementSignals, aspectSignal)
    }),
    provenance: Object.freeze({
      sourceAuthority: 'INCOMPLETE_RESEARCH',
      placementChains: freezeArray(placementSignals.map(createPlacementProvenanceChain)),
      aspectChain: createAspectProvenanceChain(aspectSignal)
    })
  });
}

function orderedSignals(signals: readonly SharedRootSignalInput[]): readonly SharedRootSignalInput[] {
  return freezeArray(signals.slice().sort((left, right) => left.signalId.localeCompare(right.signalId)));
}

function isAspectSignal(signal: SharedRootSignalInput): signal is SharedRootAspectSignalInput {
  return 'aspectScope' in signal;
}

function isPlacementSignal(
  signal: SharedRootSignalInput
): signal is PersonalSynthesisStructuredSignalInput {
  return !isAspectSignal(signal);
}

function duplicateAspectKey(signal: SharedRootAspectSignalInput): string {
  return `${signal.aspectScope}|${signal.relationalFactId}|${signal.semanticUnit.id}`;
}

function rejectedResult(
  inputSignals: readonly SharedRootSignalInput[],
  placementSignals: readonly PersonalSynthesisStructuredSignalInput[],
  aspectSignals: readonly SharedRootAspectSignalInput[],
  placementResult: PersonalSynthesisStructuredResult,
  maxThemes: number,
  classification: 'CONFLICTING_BODY_SIGN_PLACEMENT',
  birthTimeAuthority: 'KNOWN' | 'UNKNOWN'
): SharedRootRelationalSynthesisResult {
  return Object.freeze({
    sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL',
    authority: 'DEVELOPMENT_ONLY',
    birthTimeAuthority,
    inputSignals: orderedSignals(inputSignals),
    placementSignals: freezeArray(placementSignals),
    aspectSignals: freezeArray(aspectSignals),
    eligibleSignals: freezeArray([]),
    suppressedSignals: freezeArray([]),
    coherence: placementResult.coherence,
    accounting: emptyAccounting(),
    compatibility: noRelationalCompatibility('Coherence failed before relational synthesis.'),
    classification,
    synthesis: Object.freeze({
      placementThemesBefore: freezeArray([]),
      enrichedThemes: freezeArray([]),
      outputThemes: freezeArray([]),
      subsumedThemeIds: freezeArray([]),
      standaloneAspectThemeCount: 0,
      maxThemes
    })
  });
}

/**
 * Synthesizes the bounded shared-root bundle. It preserves the existing
 * placement result, keeps the aspect unit separate, and emits one enriched
 * PersonalTheme only after the explicit compatibility rule passes.
 */
export function synthesizeSharedRootRelationalSignals(
  inputSignals: readonly SharedRootSignalInput[],
  options: {
    readonly birthTimeAuthority?: 'KNOWN' | 'UNKNOWN';
    readonly maxThemes?: number;
    readonly userQuestion?: PersonalSynthesisLifeQuestion;
  } = {}
): SharedRootRelationalSynthesisResult {
  if (inputSignals.length === 0) {
    throw new Error('Shared-root relational synthesis requires at least one input Signal.');
  }
  const maxThemes = options.maxThemes ?? 5;
  validateMaxThemes(maxThemes);

  const orderedInputSignals = orderedSignals(inputSignals);
  const placementSignals = orderedInputSignals.filter(isPlacementSignal);
  const aspectSignals = orderedInputSignals.filter(isAspectSignal);
  const placementResult = synthesizePersonalThemesFromStructuredSignals(
    placementSignals,
    { maxThemes: 5, userQuestion: options.userQuestion }
  );
  const birthTimeAuthority = options.birthTimeAuthority ?? 'UNKNOWN';

  if (placementResult.coherence.status === 'INVALID') {
    return rejectedResult(
      orderedInputSignals,
      placementSignals,
      aspectSignals,
      placementResult,
      maxThemes,
      'CONFLICTING_BODY_SIGN_PLACEMENT',
      birthTimeAuthority
    );
  }

  const eligibleAspectSignals: SharedRootAspectSignalInput[] = [];
  const suppressedSignals: SharedRootSuppression[] = [...placementResult.suppressedSignals];
  const seenAspectFacts = new Set<string>();
  for (const signal of aspectSignals) {
    const duplicateKey = duplicateAspectKey(signal);
    if (seenAspectFacts.has(duplicateKey)) {
      suppressedSignals.push(Object.freeze({
        signalId: signal.signalId,
        reason: 'DUPLICATE_RELATIONAL_FACT'
      }));
      continue;
    }
    seenAspectFacts.add(duplicateKey);
    if (birthTimeAuthority === 'UNKNOWN') {
      suppressedSignals.push(Object.freeze({
        signalId: signal.signalId,
        reason: 'UNKNOWN_TIME_WITHOUT_ENGINE_CERTIFICATION'
      }));
      continue;
    }
    eligibleAspectSignals.push(signal);
  }

  const eligiblePlacementSignals = placementResult.eligibleSignals;
  const eligibleSignals: readonly SharedRootSignalInput[] = freezeArray([
    ...eligiblePlacementSignals,
    ...eligibleAspectSignals
  ]);
  const accounting = createAccounting(eligiblePlacementSignals, eligibleAspectSignals);
  const aspectSignal = eligibleAspectSignals[0];
  const compatibility = aspectSignal === undefined
    ? noRelationalCompatibility(
        'No eligible aspect Signal survived; placement themes remain separate.',
        accounting.uniqueRootKeys
      )
    : evaluateRelationalCompatibility(eligiblePlacementSignals, aspectSignal);

  if (compatibility.status !== 'RELATIONAL_ENRICHMENT') {
    return Object.freeze({
      sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL',
      authority: 'DEVELOPMENT_ONLY',
      birthTimeAuthority,
      inputSignals: orderedInputSignals,
      placementSignals: freezeArray(placementSignals),
      aspectSignals: freezeArray(aspectSignals),
      eligibleSignals,
      suppressedSignals: freezeArray(suppressedSignals),
      coherence: placementResult.coherence,
      accounting,
      compatibility,
      classification: 'NO_RELATIONAL_ENRICHMENT',
      synthesis: Object.freeze({
        placementThemesBefore: placementResult.synthesis.coreThemes,
        enrichedThemes: freezeArray([]),
        outputThemes: placementResult.synthesis.coreThemes,
        subsumedThemeIds: freezeArray([]),
        standaloneAspectThemeCount: 0,
        maxThemes
      })
    });
  }

  const enrichedTheme = createEnrichedTheme(
    placementResult.synthesis.coreThemes,
    eligiblePlacementSignals,
    aspectSignal,
    compatibility,
    accounting,
    birthTimeAuthority
  );
  const outputThemes = freezeArray([enrichedTheme]);
  return Object.freeze({
    sourceType: 'RESEARCH_REPRESENTATIVE_SIGNAL',
    authority: 'DEVELOPMENT_ONLY',
    birthTimeAuthority,
    inputSignals: orderedInputSignals,
    placementSignals: freezeArray(placementSignals),
    aspectSignals: freezeArray(aspectSignals),
    eligibleSignals,
    suppressedSignals: freezeArray(suppressedSignals),
    coherence: placementResult.coherence,
    accounting,
    compatibility,
    classification: 'RELATIONAL_ENRICHMENT',
    synthesis: Object.freeze({
      placementThemesBefore: placementResult.synthesis.coreThemes,
      enrichedThemes: Object.freeze([enrichedTheme]),
      outputThemes,
      subsumedThemeIds: enrichedTheme.subsumedThemeIds,
      standaloneAspectThemeCount: 0,
      maxThemes
    })
  });
}
