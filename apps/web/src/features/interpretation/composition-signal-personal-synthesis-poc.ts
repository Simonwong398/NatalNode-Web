/**
 * Development-only adapter from the admitted Composition → Signal policy
 * artifact into the existing Personal Synthesis POC.
 *
 * This adapter accepts already-structured research Signals. It never evaluates
 * ChartFacts, never claims AUTHORITATIVE_ENGINE, and is not exported by the
 * production interpretation index.
 */

import type {
  InterpretationConfidence,
  InterpretationSignalDirection,
  InterpretationSignalDomain,
  InterpretationSignalIntensity
} from './interpretation-signal-contracts.js';
import {
  synthesizePersonalThemesFromStructuredSignals,
  type PersonalSynthesisStructuredResult,
  type PersonalSynthesisStructuredSignalInput
} from './personal-synthesis-poc.js';
import { INTERPRETATION_RULES_VERSION } from './interpretation-signal-engine.js';

export interface CompositionSignalPolicyRuleRecord {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly compositionId: string;
  readonly signalId: string;
  readonly signalThemeKey: string;
  readonly requiredFactType: 'NATAL_BODY_POSITION';
  readonly placementEvidenceKey: string;
  readonly placementEvidence: {
    readonly evidenceType: 'BODY_SIGN_PLACEMENT';
    readonly independentEvidenceUnits: 1;
  };
  readonly eligibleDomain: InterpretationSignalDomain;
  readonly direction: InterpretationSignalDirection;
  readonly candidateIntensity: InterpretationSignalIntensity;
  readonly candidateConfidence: InterpretationConfidence;
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
  readonly runtimeEligibility: 'RUNTIME_NOT_ADMITTED';
  readonly provenance: {
    readonly runtimeStatus: 'RUNTIME_NOT_ADMITTED';
  };
}

function nonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

/**
 * Converts one policy rule into a downstream-only research Signal input.
 * `INCOMPLETE_RESEARCH` is intentional: it keeps the Personal Synthesis POC
 * usable without fabricating an Engine result or a real user's ChartFact.
 */
export function createCompositionSignalResearchInput(
  rule: CompositionSignalPolicyRuleRecord
): PersonalSynthesisStructuredSignalInput {
  nonEmpty(rule.ruleId, 'Composition Signal ruleId');
  nonEmpty(rule.ruleVersion, 'Composition Signal ruleVersion');
  nonEmpty(rule.compositionId, 'Composition Signal compositionId');
  nonEmpty(rule.signalId, 'Composition Signal signalId');
  nonEmpty(rule.signalThemeKey, 'Composition Signal signalThemeKey');
  nonEmpty(rule.placementEvidenceKey, 'Composition Signal placementEvidenceKey');
  nonEmpty(rule.semanticClaim, 'Composition Signal semanticClaim');
  nonEmpty(rule.constructiveCapacity, 'Composition Signal constructiveCapacity');
  nonEmpty(rule.possibleTension, 'Composition Signal possibleTension');

  if (rule.requiredFactType !== 'NATAL_BODY_POSITION') {
    throw new Error(`Composition Signal ${rule.signalId} has an unsupported fact type.`);
  }
  if (rule.placementEvidence.evidenceType !== 'BODY_SIGN_PLACEMENT') {
    throw new Error(`Composition Signal ${rule.signalId} has an unsupported evidence type.`);
  }
  if (rule.placementEvidence.independentEvidenceUnits !== 1) {
    throw new Error(`Composition Signal ${rule.signalId} must preserve one evidence unit.`);
  }
  if (rule.runtimeEligibility !== 'RUNTIME_NOT_ADMITTED' ||
      rule.provenance.runtimeStatus !== 'RUNTIME_NOT_ADMITTED') {
    throw new Error(`Composition Signal ${rule.signalId} is not eligible for this research adapter.`);
  }

  const placementReference = Object.freeze({
    factKind: 'OTHER' as const,
    canonicalPath: `/research/composition-signals/${rule.placementEvidenceKey}`,
    canonicalFactIdentity: rule.placementEvidenceKey
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
      engineResultReference: 'research://composition-signal-policy',
      sourceFactRefs: Object.freeze([placementReference]),
      scientificConfigurationIdentity: null,
      provenanceEnvelopeId: null
    }),
    authority: 'DEVELOPMENT_ONLY',
    placementEvidenceKey: rule.placementEvidenceKey,
    evidenceUnitCount: 1,
    semanticClaim: rule.semanticClaim,
    constructiveCapacity: rule.constructiveCapacity,
    possibleTension: rule.possibleTension,
    semanticBasis: Object.freeze({ ...rule.semanticBasis }),
    whyReferences: Object.freeze({ ...rule.whyReferences }),
    learnReferences: Object.freeze(
      rule.learnReferences.map((reference) => Object.freeze({ ...reference }))
    ),
    birthTimeRequirement: Object.freeze({
      status: rule.birthTimeRequirement.status,
      requiresKnownBirthTime: rule.birthTimeRequirement.requiresKnownBirthTime,
      forbiddenDependencies: Object.freeze([...rule.birthTimeRequirement.forbiddenDependencies])
    }),
    suppressionConditions: Object.freeze([...rule.suppressionConditions]),
    suppressionState: 'ELIGIBLE'
  });
}

export function createCompositionSignalResearchInputs(
  rules: readonly CompositionSignalPolicyRuleRecord[]
): readonly PersonalSynthesisStructuredSignalInput[] {
  return Object.freeze(rules.map(createCompositionSignalResearchInput));
}

export function synthesizeCompositionSignalResearchInputs(
  rules: readonly CompositionSignalPolicyRuleRecord[],
  options: {
    readonly maxThemes?: number;
  } = {}
): PersonalSynthesisStructuredResult {
  return synthesizePersonalThemesFromStructuredSignals(
    createCompositionSignalResearchInputs(rules),
    options
  );
}
