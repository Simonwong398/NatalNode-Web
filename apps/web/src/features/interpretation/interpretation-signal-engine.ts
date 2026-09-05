import type {
  InterpretationFactInput,
  InterpretationFactReference,
  InterpretationRuleContext,
  InterpretationRuleIdentity,
  InterpretationRulePrerequisites,
  InterpretationSignal,
  InterpretationSignalDraft,
  InterpretationSignalRule,
  InterpretationSignalSourceAuthority,
  InterpretationRulesVersion
} from './interpretation-signal-contracts.js';

export const INTERPRETATION_RULES_VERSION = Object.freeze({
  id: 'NATALNODE_INTERPRETATION_RULES_V1',
  version: '1.0.0'
} satisfies InterpretationRulesVersion);

export const INTERPRETATION_SIGNAL_SCHEMA_VERSION = '1.0.0';

export type InterpretationRuleSkipReason =
  | 'SOURCE_AUTHORITY_NOT_ALLOWED'
  | 'BIRTH_TIME_UNAVAILABLE'
  | 'REQUIRED_FACT_UNAVAILABLE'
  | 'FACT_MATCH_NOT_FOUND'
  | 'RULE_EVALUATION_FAILED';

export interface InterpretationRuleSkip {
  readonly ruleId: string;
  readonly reason: InterpretationRuleSkipReason;
}

export interface InterpretationSignalEvaluation {
  readonly signals: readonly InterpretationSignal[];
  readonly skippedRules: readonly InterpretationRuleSkip[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertNormalizedUnit(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a finite number between 0 and 1.`);
  }
}

function freezeFactReference(reference: InterpretationFactReference): InterpretationFactReference {
  assertNonEmptyString(reference.canonicalPath, 'Fact reference canonicalPath');

  return Object.freeze({
    ...reference
  });
}

function freezeRuleIdentity(identity: InterpretationRuleIdentity): InterpretationRuleIdentity {
  assertNonEmptyString(identity.ruleId, 'Rule identity ruleId');
  assertNonEmptyString(identity.ruleVersion, 'Rule identity ruleVersion');
  assertNonEmptyString(
    identity.interpretationRulesVersion.id,
    'Rule identity interpretationRulesVersion.id'
  );
  assertNonEmptyString(
    identity.interpretationRulesVersion.version,
    'Rule identity interpretationRulesVersion.version'
  );

  return Object.freeze({
    ...identity,
    interpretationRulesVersion: Object.freeze({
      ...identity.interpretationRulesVersion
    })
  });
}

function freezeRulePrerequisites(
  prerequisites: InterpretationRulePrerequisites
): InterpretationRulePrerequisites {
  return Object.freeze({
    ...prerequisites,
    requiredFactKinds: prerequisites.requiredFactKinds === undefined
      ? undefined
      : Object.freeze([...prerequisites.requiredFactKinds]),
    allowedSourceAuthorities: prerequisites.allowedSourceAuthorities === undefined
      ? undefined
      : Object.freeze([...prerequisites.allowedSourceAuthorities])
  });
}

function freezeRegisteredRule(
  rule: InterpretationSignalRule,
  identity: InterpretationRuleIdentity
): InterpretationSignalRule {
  return Object.freeze({
    ...rule,
    identity,
    prerequisites: freezeRulePrerequisites(rule.prerequisites)
  });
}

function freezeSignal(signal: InterpretationSignal): InterpretationSignal {
  assertNonEmptyString(signal.signalId, 'Signal signalId');
  assertNonEmptyString(signal.theme, 'Signal theme');
  assertNormalizedUnit(signal.internalStrength, 'Signal internalStrength');
  assertNormalizedUnit(signal.ranking.baseImportance, 'Signal baseImportance');
  assertNormalizedUnit(signal.ranking.evidenceStrength, 'Signal evidenceStrength');
  assertNormalizedUnit(signal.ranking.temporalRelevance, 'Signal temporalRelevance');
  assertNormalizedUnit(signal.ranking.durationWeight, 'Signal durationWeight');
  assertNormalizedUnit(signal.ranking.repetitionPenalty, 'Signal repetitionPenalty');
  assertNonEmptyString(
    signal.provenance.engineResultReference,
    'Signal provenance engineResultReference'
  );

  if (signal.provenance.sourceFactRefs.length === 0) {
    throw new Error('A signal must reference at least one supplied fact.');
  }

  const temporalWindow = signal.temporalWindow === undefined
    ? undefined
    : Object.freeze({ ...signal.temporalWindow });

  return Object.freeze({
    ...signal,
    rule: freezeRuleIdentity(signal.rule),
    ranking: Object.freeze({ ...signal.ranking }),
    temporalWindow,
    provenance: Object.freeze({
      ...signal.provenance,
      sourceFactRefs: Object.freeze(
        signal.provenance.sourceFactRefs.map(freezeFactReference)
      )
    })
  });
}

function materializeSignal(
  draft: InterpretationSignalDraft,
  context: InterpretationRuleContext,
  ruleIdentity: InterpretationRuleIdentity
): InterpretationSignal {
  if (
    draft.rule.ruleId !== ruleIdentity.ruleId ||
    draft.rule.ruleVersion !== ruleIdentity.ruleVersion ||
    draft.rule.interpretationRulesVersion.id !==
      ruleIdentity.interpretationRulesVersion.id ||
    draft.rule.interpretationRulesVersion.version !==
      ruleIdentity.interpretationRulesVersion.version
  ) {
    throw new Error(
      `Signal ${draft.signalId} does not preserve the identity of rule ${ruleIdentity.ruleId}.`
    );
  }

  const sourceIsAuthoritative = context.sourceAuthority === 'AUTHORITATIVE_ENGINE';
  const provenance = {
    ...draft.provenance,
    sourceAuthority: context.sourceAuthority,
    scientificConfigurationIdentity: sourceIsAuthoritative
      ? draft.provenance.scientificConfigurationIdentity ?? null
      : null,
    provenanceEnvelopeId: sourceIsAuthoritative
      ? draft.provenance.provenanceEnvelopeId ?? null
      : null
  };

  return freezeSignal({
    ...draft,
    rule: ruleIdentity,
    provenance,
    authority: sourceIsAuthoritative ? 'AUTHORITATIVE' : 'DEVELOPMENT_ONLY'
  });
}

function hasAvailableFactKind(
  facts: readonly InterpretationFactInput[],
  factKind: InterpretationFactInput['reference']['factKind']
): boolean {
  return facts.some((fact) => fact.available && fact.reference.factKind === factKind);
}

function prerequisiteFailure(
  rule: InterpretationSignalRule,
  context: InterpretationRuleContext
): InterpretationRuleSkipReason | null {
  const allowedAuthorities = rule.prerequisites.allowedSourceAuthorities ?? [
    'AUTHORITATIVE_ENGINE'
  ];

  if (!allowedAuthorities.includes(context.sourceAuthority)) {
    return 'SOURCE_AUTHORITY_NOT_ALLOWED';
  }

  if (
    rule.prerequisites.requiresKnownBirthTime === true &&
    context.birthTimeAuthority !== 'KNOWN'
  ) {
    return 'BIRTH_TIME_UNAVAILABLE';
  }

  const requiredFactKinds = rule.prerequisites.requiredFactKinds ?? [];
  if (requiredFactKinds.some((factKind) => !hasAvailableFactKind(context.facts, factKind))) {
    return 'REQUIRED_FACT_UNAVAILABLE';
  }

  return null;
}

function assertRuleMatchesVersion(
  identity: InterpretationRuleIdentity,
  version: InterpretationRulesVersion
): InterpretationRuleIdentity {
  const frozenIdentity = freezeRuleIdentity(identity);

  if (
    frozenIdentity.interpretationRulesVersion.id !== version.id ||
    frozenIdentity.interpretationRulesVersion.version !== version.version
  ) {
    throw new Error(
      `Rule ${frozenIdentity.ruleId} is registered against a different interpretation rules version.`
    );
  }

  return frozenIdentity;
}

/**
 * Immutable registry for deterministic rules. Registration returns a new
 * registry, so the caller's rule set and every evaluation remain stable.
 */
export class InterpretationSignalRuleRegistry {
  readonly interpretationRulesVersion: InterpretationRulesVersion;
  readonly rules: readonly InterpretationSignalRule[];

  constructor(
    rules: readonly InterpretationSignalRule[] = [],
    interpretationRulesVersion: InterpretationRulesVersion = INTERPRETATION_RULES_VERSION
  ) {
    this.interpretationRulesVersion = Object.freeze({
      ...interpretationRulesVersion
    });

    const registeredRules: InterpretationSignalRule[] = [];
    for (const rule of rules) {
      const identity = assertRuleMatchesVersion(
        rule.identity,
        this.interpretationRulesVersion
      );

      if (registeredRules.some((candidate) => candidate.identity.ruleId === identity.ruleId)) {
        throw new Error(`Rule ${identity.ruleId} is registered more than once.`);
      }

      registeredRules.push(freezeRegisteredRule(rule, identity));
    }

    this.rules = Object.freeze(registeredRules);
  }

  register(rule: InterpretationSignalRule): InterpretationSignalRuleRegistry {
    return new InterpretationSignalRuleRegistry(
      [...this.rules, rule],
      this.interpretationRulesVersion
    );
  }

  evaluate(context: InterpretationRuleContext): InterpretationSignalEvaluation {
    const signals: InterpretationSignal[] = [];
    const skippedRules: InterpretationRuleSkip[] = [];

    for (const rule of this.rules) {
      const prerequisiteReason = prerequisiteFailure(rule, context);
      if (prerequisiteReason !== null) {
        skippedRules.push({ ruleId: rule.identity.ruleId, reason: prerequisiteReason });
        continue;
      }

      let matches: boolean;
      try {
        matches = rule.matches(context);
      } catch (_error) {
        skippedRules.push({
          ruleId: rule.identity.ruleId,
          reason: 'RULE_EVALUATION_FAILED'
        });
        continue;
      }

      if (!matches) {
        skippedRules.push({
          ruleId: rule.identity.ruleId,
          reason: 'FACT_MATCH_NOT_FOUND'
        });
        continue;
      }

      const signal = materializeSignal(
        rule.createSignal(context),
        context,
        rule.identity
      );
      if (signals.some((candidate) => candidate.signalId === signal.signalId)) {
        throw new Error(`Signal ${signal.signalId} was emitted more than once.`);
      }

      signals.push(signal);
    }

    signals.sort((left, right) => left.signalId.localeCompare(right.signalId));
    skippedRules.sort((left, right) => left.ruleId.localeCompare(right.ruleId));

    return Object.freeze({
      signals: Object.freeze(signals),
      skippedRules: Object.freeze(skippedRules.map((skip) => Object.freeze(skip)))
    });
  }
}

export function createInterpretationSignalRuleRegistry(
  rules: readonly InterpretationSignalRule[] = [],
  interpretationRulesVersion: InterpretationRulesVersion = INTERPRETATION_RULES_VERSION
): InterpretationSignalRuleRegistry {
  return new InterpretationSignalRuleRegistry(rules, interpretationRulesVersion);
}

export function sourceAuthorityIsDevelopmentOnly(
  sourceAuthority: InterpretationSignalSourceAuthority
): boolean {
  return sourceAuthority !== 'AUTHORITATIVE_ENGINE';
}
