/**
 * Development-only chart-level PersonalTheme selection proof.
 *
 * This module selects already-admitted research candidates for editorial
 * display roles. It does not calculate astronomy, create ChartFacts, promote
 * confidence or intensity, or enter the production interpretation runtime.
 * The order is ordinal and explicit; there is no numeric theme ranking.
 */

export const CHART_LEVEL_THEME_SELECTOR_POC_POLICY = Object.freeze({
  id: 'NATALNODE_CHART_LEVEL_PERSONAL_THEME_SELECTOR_POC_V1',
  version: '1.0.0',
  selectionMode: 'ORDINAL_RULES',
  preferredCoreRange: Object.freeze({ min: 3, max: 5 }),
  hardMinimum: false,
  maximumCoreThemes: 5,
  bodyAutomaticPriority: false,
  domainQuota: false,
  numericRanking: false,
  runtimeEligibility: 'RUNTIME_NOT_ADMITTED'
} as const);

export type SelectorDomain =
  | 'SELF'
  | 'EMOTIONAL'
  | 'RELATIONSHIP'
  | 'COMMUNICATION'
  | 'WORK_CREATION'
  | 'ACTION_DECISION';

export type SelectorDirection =
  | 'SUPPORTIVE'
  | 'CHALLENGING'
  | 'MIXED'
  | 'NEUTRAL';

export type SelectorIntensity =
  | 'SUBTLE'
  | 'NOTICEABLE'
  | 'STRONG'
  | 'DOMINANT';

export type SelectorConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type SelectorCandidateKind = 'PLACEMENT' | 'RELATIONAL' | 'PROJECTION';

export type SelectorSynthesisClassification =
  | 'INDEPENDENT_CONVERGENCE'
  | 'COUNTEREVIDENCE'
  | 'RELATIONAL_ENRICHMENT'
  | 'REDUNDANCY'
  | 'DUPLICATE'
  | 'DISTINCT'
  | 'CONFLICT';

export type SelectorIndependentSupportState = 'NONE' | 'INDEPENDENTLY_SUPPORTED';

export type SelectorClaimScopeState =
  | 'ORIGINAL'
  | 'QUALIFIED'
  | 'NARROWED'
  | 'INTERNAL_TENSION'
  | 'SUPPRESSED_OVERBROAD';

export type SelectorEditorialRole =
  | 'CORE'
  | 'SUPPORTING_THREAD'
  | 'SUBSUMED'
  | 'SUPPRESSED';

export type SelectorGate =
  | 'AUTHORITY_ELIGIBILITY'
  | 'COHERENCE_CONFLICT'
  | 'SEMANTIC_VALIDITY'
  | 'DUPLICATE_HANDLING'
  | 'REDUNDANCY_HANDLING'
  | 'SUBSUMPTION_HANDLING'
  | 'PERSONAL_RELEVANCE'
  | 'SEMANTIC_DISTINCTNESS'
  | 'RELATIONAL_ENRICHMENT'
  | 'DOMAIN_BREADTH'
  | 'PROVENANCE_COMPLETENESS'
  | 'STABLE_TIE_BREAK'
  | 'EDITORIAL_ROLE_ASSIGNMENT';

export type SelectorTraceOutcome =
  | 'PASS'
  | 'FAIL'
  | 'DUPLICATE'
  | 'REDUNDANT'
  | 'SUBSUMED'
  | 'CORE'
  | 'SUPPORTING'
  | 'SUPPRESSED';

export interface ChartLevelThemeCandidate {
  readonly candidateId: string;
  readonly themeId: string;
  readonly candidateKind: SelectorCandidateKind;
  readonly sourceSignalIds: readonly string[];
  readonly semanticUnitIds: readonly string[];
  readonly rootKeys: readonly string[];
  readonly domain: SelectorDomain;
  readonly direction: SelectorDirection;
  readonly intensity: SelectorIntensity;
  readonly confidence: SelectorConfidence;
  readonly personalRelevance: 'DIRECT' | 'CONTEXTUAL' | 'NOT_SPECIFIED';
  readonly semanticIdentityKey: string;
  readonly readerMeaningKey: string;
  readonly factIdentityKey: string;
  readonly relationalEnrichmentState: 'NONE' | 'ENRICHED';
  readonly subsumptionState: 'NONE' | 'SUBSUMES_PLACEMENTS' | 'SUBSUMED';
  readonly subsumedCandidateIds: readonly string[];
  readonly authorityEligibility: 'ELIGIBLE' | 'INELIGIBLE';
  readonly unknownTimeEligibility: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  readonly semanticBasisIds: readonly string[];
  readonly qualificationState:
    | 'NONE'
    | 'COUNTEREVIDENCE_PENDING'
    | 'QUALIFICATION_REQUIRED';
  /** Optional chart-wide synthesis metadata; omission preserves old candidates. */
  readonly synthesisClassification?: SelectorSynthesisClassification;
  readonly independentSupportState?: SelectorIndependentSupportState;
  readonly claimScopeState?: SelectorClaimScopeState;
  readonly sourceThemeStates?: readonly {
    readonly themeId: string;
    readonly state: string;
  }[];
  readonly placement?: {
    readonly scope: 'SINGLE_NATAL_CHART';
    readonly placementType: 'NATAL_BODY_POSITION';
    readonly bodyId: string;
    readonly signId: string;
    readonly evidenceKey: string;
  };
  readonly provenance: {
    readonly sourceAuthority: 'INCOMPLETE_RESEARCH' | 'DEVELOPMENT_ONLY';
    readonly sourceRefs: readonly string[];
    readonly sourceFactRefs: readonly string[];
    readonly whyReady: boolean;
    readonly learnReady: boolean;
    readonly runtimeStatus: 'RUNTIME_NOT_ADMITTED';
  };
}

export interface SelectorDecisionTrace {
  readonly candidateId: string;
  readonly gate: SelectorGate;
  readonly outcome: SelectorTraceOutcome;
  readonly reason: string;
  readonly relatedCandidateIds: readonly string[];
}

export interface SelectedChartLevelTheme extends ChartLevelThemeCandidate {
  readonly editorialRole: SelectorEditorialRole;
  readonly editorialReason: string;
  readonly relatedCandidateIds: readonly string[];
}

export interface ChartLevelThemeSelectorOptions {
  readonly birthTimeAuthority?: 'KNOWN' | 'UNKNOWN';
  readonly maxCoreThemes?: number;
}

export interface SelectorFailureState {
  readonly code: 'CONFLICTING_BODY_SIGN_PLACEMENT';
  readonly reason: string;
  readonly relatedCandidateIds: readonly string[];
}

export interface ChartLevelThemeSelectorResult {
  readonly selectorPolicyId: typeof CHART_LEVEL_THEME_SELECTOR_POC_POLICY.id;
  readonly selectorPolicyVersion: typeof CHART_LEVEL_THEME_SELECTOR_POC_POLICY.version;
  readonly inputCandidateIds: readonly string[];
  readonly eligibleCandidateIds: readonly string[];
  readonly coreThemeIds: readonly string[];
  readonly supportingThemeIds: readonly string[];
  readonly subsumedThemeIds: readonly string[];
  readonly suppressedThemeIds: readonly string[];
  readonly failureState: SelectorFailureState | null;
  readonly decisionTrace: readonly SelectorDecisionTrace[];
  readonly coreThemes: readonly SelectedChartLevelTheme[];
  readonly supportingThemes: readonly SelectedChartLevelTheme[];
  readonly subsumedThemes: readonly SelectedChartLevelTheme[];
  readonly suppressedThemes: readonly SelectedChartLevelTheme[];
  readonly preferredCoreRange: typeof CHART_LEVEL_THEME_SELECTOR_POC_POLICY.preferredCoreRange;
}

const DOMAINS = Object.freeze([
  'SELF',
  'EMOTIONAL',
  'RELATIONSHIP',
  'COMMUNICATION',
  'WORK_CREATION',
  'ACTION_DECISION'
] as const);

const DIRECTIONS = Object.freeze([
  'SUPPORTIVE',
  'CHALLENGING',
  'MIXED',
  'NEUTRAL'
] as const);

const INTENSITIES = Object.freeze([
  'SUBTLE',
  'NOTICEABLE',
  'STRONG',
  'DOMINANT'
] as const);

const CONFIDENCES = Object.freeze(['LOW', 'MEDIUM', 'HIGH'] as const);

const PERSONAL_RELEVANCE_ORDER = Object.freeze([
  'DIRECT',
  'CONTEXTUAL',
  'NOT_SPECIFIED'
] as const);

const RELATIONAL_ORDER = Object.freeze(['ENRICHED', 'NONE'] as const);

const INDEPENDENT_SUPPORT_ORDER = Object.freeze([
  'INDEPENDENTLY_SUPPORTED',
  'NONE'
] as const);

const SYNTHESIS_CLASSIFICATIONS = Object.freeze([
  'INDEPENDENT_CONVERGENCE',
  'COUNTEREVIDENCE',
  'RELATIONAL_ENRICHMENT',
  'REDUNDANCY',
  'DUPLICATE',
  'DISTINCT',
  'CONFLICT'
] as const);

const CLAIM_SCOPE_STATES = Object.freeze([
  'ORIGINAL',
  'QUALIFIED',
  'NARROWED',
  'INTERNAL_TENSION',
  'SUPPRESSED_OVERBROAD'
] as const);

const GATE_ORDER = Object.freeze([
  'AUTHORITY_ELIGIBILITY',
  'COHERENCE_CONFLICT',
  'SEMANTIC_VALIDITY',
  'DUPLICATE_HANDLING',
  'REDUNDANCY_HANDLING',
  'SUBSUMPTION_HANDLING',
  'PERSONAL_RELEVANCE',
  'SEMANTIC_DISTINCTNESS',
  'RELATIONAL_ENRICHMENT',
  'DOMAIN_BREADTH',
  'PROVENANCE_COMPLETENESS',
  'STABLE_TIE_BREAK',
  'EDITORIAL_ROLE_ASSIGNMENT'
] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number]);
}

function orderOf<T extends readonly string[]>(values: T, value: T[number]): number {
  return values.indexOf(value);
}

function compareStableIdentity(
  left: ChartLevelThemeCandidate,
  right: ChartLevelThemeCandidate
): number {
  return left.candidateId.localeCompare(right.candidateId);
}

function compareForRetention(
  left: ChartLevelThemeCandidate,
  right: ChartLevelThemeCandidate
): number {
  const leftRelational = orderOf(RELATIONAL_ORDER, left.relationalEnrichmentState);
  const rightRelational = orderOf(RELATIONAL_ORDER, right.relationalEnrichmentState);
  if (leftRelational !== rightRelational) {
    return leftRelational - rightRelational;
  }

  const leftIndependent = orderOf(
    INDEPENDENT_SUPPORT_ORDER,
    left.independentSupportState ?? 'NONE'
  );
  const rightIndependent = orderOf(
    INDEPENDENT_SUPPORT_ORDER,
    right.independentSupportState ?? 'NONE'
  );
  if (leftIndependent !== rightIndependent) {
    return leftIndependent - rightIndependent;
  }

  const leftRelevance = orderOf(PERSONAL_RELEVANCE_ORDER, left.personalRelevance);
  const rightRelevance = orderOf(PERSONAL_RELEVANCE_ORDER, right.personalRelevance);
  if (leftRelevance !== rightRelevance) {
    return leftRelevance - rightRelevance;
  }

  return compareStableIdentity(left, right);
}

function hasCompleteProvenance(candidate: ChartLevelThemeCandidate): boolean {
  return candidate.provenance.sourceAuthority.length > 0 &&
    isNonEmptyStringArray(candidate.provenance.sourceRefs) &&
    isNonEmptyStringArray(candidate.provenance.sourceFactRefs) &&
    candidate.provenance.whyReady &&
    candidate.provenance.learnReady &&
    candidate.provenance.runtimeStatus === 'RUNTIME_NOT_ADMITTED';
}

function hasValidPlacement(candidate: ChartLevelThemeCandidate): boolean {
  if (candidate.candidateKind !== 'PLACEMENT') {
    return true;
  }
  return candidate.placement !== undefined &&
    candidate.placement.scope === 'SINGLE_NATAL_CHART' &&
    candidate.placement.placementType === 'NATAL_BODY_POSITION' &&
    isNonEmptyString(candidate.placement.bodyId) &&
    isNonEmptyString(candidate.placement.signId) &&
    isNonEmptyString(candidate.placement.evidenceKey);
}

function hasValidSemantics(candidate: ChartLevelThemeCandidate): boolean {
  return isNonEmptyString(candidate.candidateId) &&
    isNonEmptyString(candidate.themeId) &&
    isNonEmptyStringArray(candidate.sourceSignalIds) &&
    isNonEmptyStringArray(candidate.semanticUnitIds) &&
    isNonEmptyStringArray(candidate.rootKeys) &&
    isOneOf(DOMAINS, candidate.domain) &&
    isOneOf(DIRECTIONS, candidate.direction) &&
    isOneOf(INTENSITIES, candidate.intensity) &&
    isOneOf(CONFIDENCES, candidate.confidence) &&
    isOneOf(PERSONAL_RELEVANCE_ORDER, candidate.personalRelevance) &&
    isNonEmptyString(candidate.semanticIdentityKey) &&
    isNonEmptyString(candidate.readerMeaningKey) &&
    isNonEmptyString(candidate.factIdentityKey) &&
    isOneOf(RELATIONAL_ORDER, candidate.relationalEnrichmentState) &&
    (candidate.synthesisClassification === undefined ||
      isOneOf(SYNTHESIS_CLASSIFICATIONS, candidate.synthesisClassification)) &&
    (candidate.claimScopeState === undefined ||
      isOneOf(CLAIM_SCOPE_STATES, candidate.claimScopeState)) &&
    (candidate.sourceThemeStates === undefined || candidate.sourceThemeStates.every((state) =>
      isNonEmptyString(state.themeId) && isNonEmptyString(state.state)
    )) &&
    isNonEmptyStringArray(candidate.semanticBasisIds) &&
    Array.isArray(candidate.subsumedCandidateIds) &&
    candidate.subsumedCandidateIds.every(isNonEmptyString) &&
    hasValidPlacement(candidate);
}

function placementGroupKey(candidate: ChartLevelThemeCandidate): string | null {
  if (!candidate.placement) {
    return null;
  }
  return [
    candidate.placement.scope,
    candidate.placement.placementType,
    candidate.placement.bodyId
  ].join('|');
}

function collectConflicts(
  candidates: readonly ChartLevelThemeCandidate[]
): readonly (readonly [string, readonly ChartLevelThemeCandidate[]])[] {
  const groups = new Map<string, ChartLevelThemeCandidate[]>();
  for (const candidate of candidates) {
    const key = placementGroupKey(candidate);
    if (!key) {
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  return freezeArray(
    [...groups.entries()]
      .map(([key, group]) => {
        return [key, group] as const;
      })
      .filter(([, group]) => new Set(group.map((candidate) => candidate.placement?.signId)).size > 1)
  );
}

function traceEntry(
  candidateId: string,
  gate: SelectorGate,
  outcome: SelectorTraceOutcome,
  reason: string,
  relatedCandidateIds: readonly string[] = []
): SelectorDecisionTrace {
  return Object.freeze({
    candidateId,
    gate,
    outcome,
    reason,
    relatedCandidateIds: uniqueSorted(relatedCandidateIds)
  });
}

function selectedTheme(
  candidate: ChartLevelThemeCandidate,
  editorialRole: SelectorEditorialRole,
  editorialReason: string,
  relatedCandidateIds: readonly string[] = []
): SelectedChartLevelTheme {
  return Object.freeze({
    ...candidate,
    editorialRole,
    editorialReason,
    relatedCandidateIds: uniqueSorted(relatedCandidateIds)
  });
}

function emptyFailureResult(
  candidates: readonly ChartLevelThemeCandidate[],
  traces: readonly SelectorDecisionTrace[],
  failureState: SelectorFailureState
): ChartLevelThemeSelectorResult {
  return Object.freeze({
    selectorPolicyId: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.id,
    selectorPolicyVersion: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.version,
    inputCandidateIds: freezeArray(candidates.map((candidate) => candidate.candidateId)),
    eligibleCandidateIds: freezeArray([]),
    coreThemeIds: freezeArray([]),
    supportingThemeIds: freezeArray([]),
    subsumedThemeIds: freezeArray([]),
    suppressedThemeIds: freezeArray([]),
    failureState: Object.freeze({
      ...failureState,
      relatedCandidateIds: uniqueSorted(failureState.relatedCandidateIds)
    }),
    decisionTrace: freezeArray(sortTraces(traces)),
    coreThemes: freezeArray([]),
    supportingThemes: freezeArray([]),
    subsumedThemes: freezeArray([]),
    suppressedThemes: freezeArray([]),
    preferredCoreRange: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.preferredCoreRange
  });
}

function sortTraces(traces: readonly SelectorDecisionTrace[]): readonly SelectorDecisionTrace[] {
  return [...traces].sort((left, right) => {
    const candidateOrder = left.candidateId.localeCompare(right.candidateId);
    if (candidateOrder !== 0) {
      return candidateOrder;
    }
    return orderOf(GATE_ORDER, left.gate) - orderOf(GATE_ORDER, right.gate);
  });
}

function ensureValidOptions(options: ChartLevelThemeSelectorOptions): number {
  const maxCoreThemes = options.maxCoreThemes ?? CHART_LEVEL_THEME_SELECTOR_POC_POLICY.maximumCoreThemes;
  if (!Number.isInteger(maxCoreThemes) || maxCoreThemes < 0 || maxCoreThemes > CHART_LEVEL_THEME_SELECTOR_POC_POLICY.maximumCoreThemes) {
    throw new Error('maxCoreThemes must be an integer from 0 through 5.');
  }
  return maxCoreThemes;
}

function chooseNextCandidate(
  candidates: readonly ChartLevelThemeCandidate[],
  selectedDomains: ReadonlySet<SelectorDomain>
): ChartLevelThemeCandidate {
  const ordered = [...candidates].sort((left, right) => {
    const retainedOrder = compareForRetention(left, right);
    if (retainedOrder !== 0) {
      return retainedOrder;
    }

    const leftHasNewDomain = selectedDomains.has(left.domain);
    const rightHasNewDomain = selectedDomains.has(right.domain);
    if (leftHasNewDomain !== rightHasNewDomain) {
      return leftHasNewDomain ? 1 : -1;
    }

    return compareStableIdentity(left, right);
  });
  const chosen = ordered[0];
  if (!chosen) {
    throw new Error('Selector cannot choose from an empty candidate set.');
  }
  return chosen;
}

/**
 * Selects chart-level editorial roles from already-admitted development
 * candidates. `eligibleCandidateIds` includes candidates that survive the
 * structural gates and may later be CORE, SUPPORTING, or SUBSUMED. Exact
 * duplicates and redundant projections are excluded from that list because
 * they do not represent additional selectable meaning.
 */
export function selectChartLevelPersonalThemes(
  candidates: readonly ChartLevelThemeCandidate[],
  options: ChartLevelThemeSelectorOptions = {}
): ChartLevelThemeSelectorResult {
  const maxCoreThemes = ensureValidOptions(options);
  const traces: SelectorDecisionTrace[] = [];

  for (const candidate of candidates) {
    if (!isNonEmptyString(candidate.candidateId)) {
      throw new Error('Every selector candidate must have a stable candidateId.');
    }
  }

  const conflicts = collectConflicts(candidates);
  if (conflicts.length > 0) {
    const relatedCandidateIds = uniqueSorted(
      conflicts.flatMap(([, group]) => group.map((candidate) => candidate.candidateId))
    );
    for (const candidate of candidates) {
      if (relatedCandidateIds.includes(candidate.candidateId)) {
        traces.push(traceEntry(
          candidate.candidateId,
          'COHERENCE_CONFLICT',
          'FAIL',
          'FAIL_CLOSED_CONFLICTING_BODY_SIGN_PLACEMENT',
          relatedCandidateIds.filter((candidateId) => candidateId !== candidate.candidateId)
        ));
      }
    }
    return emptyFailureResult(candidates, traces, {
      code: 'CONFLICTING_BODY_SIGN_PLACEMENT',
      reason: 'One natal body cannot occupy two different signs in the same placement scope.',
      relatedCandidateIds
    });
  }

  const authorityEligible: ChartLevelThemeCandidate[] = [];
  const suppressed: SelectedChartLevelTheme[] = [];
  for (const candidate of candidates) {
    const authorityPass = candidate.authorityEligibility === 'ELIGIBLE' &&
      (options.birthTimeAuthority !== 'UNKNOWN' || candidate.unknownTimeEligibility === 'UNKNOWN_TIME_SAFE');
    if (!authorityPass) {
      traces.push(traceEntry(
        candidate.candidateId,
        'AUTHORITY_ELIGIBILITY',
        'FAIL',
        candidate.authorityEligibility !== 'ELIGIBLE'
          ? 'AUTHORITY_NOT_ELIGIBLE'
          : 'UNKNOWN_TIME_REQUIRES_KNOWN_AUTHORITY'
      ));
      suppressed.push(selectedTheme(
        candidate,
        'SUPPRESSED',
        candidate.authorityEligibility !== 'ELIGIBLE'
          ? 'AUTHORITY_NOT_ELIGIBLE'
          : 'UNKNOWN_TIME_REQUIRES_KNOWN_AUTHORITY'
      ));
      continue;
    }
    traces.push(traceEntry(
      candidate.candidateId,
      'AUTHORITY_ELIGIBILITY',
      'PASS',
      'AUTHORITY_ELIGIBLE_AND_TIME_SAFE'
    ));
    authorityEligible.push(candidate);
  }

  for (const candidate of authorityEligible) {
    traces.push(traceEntry(
      candidate.candidateId,
      'COHERENCE_CONFLICT',
      'PASS',
      'NO_CONFLICTING_BODY_SIGN_PLACEMENT'
    ));
  }

  const semanticallyValid: ChartLevelThemeCandidate[] = [];
  for (const candidate of authorityEligible) {
    if (!hasValidSemantics(candidate)) {
      traces.push(traceEntry(
        candidate.candidateId,
        'SEMANTIC_VALIDITY',
        'FAIL',
        'REQUIRED_SEMANTIC_OR_PROVENANCE_IDENTITY_MISSING'
      ));
      suppressed.push(selectedTheme(
        candidate,
        'SUPPRESSED',
        'REQUIRED_SEMANTIC_OR_PROVENANCE_IDENTITY_MISSING'
      ));
      continue;
    }
    traces.push(traceEntry(
      candidate.candidateId,
      'SEMANTIC_VALIDITY',
      'PASS',
      'SEMANTIC_IDENTITY_IS_COMPLETE'
    ));
    semanticallyValid.push(candidate);
  }

  const duplicateGroups = new Map<string, ChartLevelThemeCandidate[]>();
  for (const candidate of semanticallyValid) {
    const group = duplicateGroups.get(candidate.factIdentityKey) ?? [];
    group.push(candidate);
    duplicateGroups.set(candidate.factIdentityKey, group);
  }

  const duplicateSurvivors: ChartLevelThemeCandidate[] = [];
  for (const group of duplicateGroups.values()) {
    const ordered = [...group].sort(compareForRetention);
    const survivor = ordered[0];
    if (!survivor) {
      continue;
    }
    duplicateSurvivors.push(survivor);
    for (const duplicate of ordered.slice(1)) {
      traces.push(traceEntry(
        duplicate.candidateId,
        'DUPLICATE_HANDLING',
        'DUPLICATE',
        'SUPPRESSED_DUPLICATE_FACT_IDENTITY',
        [survivor.candidateId]
      ));
      suppressed.push(selectedTheme(
        duplicate,
        'SUPPRESSED',
        'SUPPRESSED_DUPLICATE_FACT_IDENTITY',
        [survivor.candidateId]
      ));
    }
    traces.push(traceEntry(
      survivor.candidateId,
      'DUPLICATE_HANDLING',
      'PASS',
      'FACT_IDENTITY_SURVIVES_DUPLICATE_CONTROL'
    ));
  }

  const redundancyGroups = new Map<string, ChartLevelThemeCandidate[]>();
  for (const candidate of duplicateSurvivors) {
    const group = redundancyGroups.get(candidate.readerMeaningKey) ?? [];
    group.push(candidate);
    redundancyGroups.set(candidate.readerMeaningKey, group);
  }

  const redundancySurvivors: ChartLevelThemeCandidate[] = [];
  for (const group of redundancyGroups.values()) {
    const ordered = [...group].sort(compareForRetention);
    const survivor = ordered[0];
    if (!survivor) {
      continue;
    }
    redundancySurvivors.push(survivor);
    traces.push(traceEntry(
      survivor.candidateId,
      'REDUNDANCY_HANDLING',
      'PASS',
      'READER_MEANING_SURVIVES_REDUNDANCY_CONTROL'
    ));
    for (const redundant of ordered.slice(1)) {
      traces.push(traceEntry(
        redundant.candidateId,
        'REDUNDANCY_HANDLING',
        'REDUNDANT',
        'SUPPRESSED_REDUNDANT_READER_MEANING',
        [survivor.candidateId]
      ));
      suppressed.push(selectedTheme(
        redundant,
        'SUPPRESSED',
        'SUPPRESSED_REDUNDANT_READER_MEANING',
        [survivor.candidateId]
      ));
    }
  }

  const byCandidateId = new Map(
    redundancySurvivors.map((candidate) => [candidate.candidateId, candidate])
  );
  const subsumedBy = new Map<string, string[]>();
  for (const candidate of redundancySurvivors) {
    const validTargets = candidate.subsumedCandidateIds.filter(
      (candidateId) => byCandidateId.has(candidateId) && candidateId !== candidate.candidateId
    );
    for (const targetId of validTargets) {
      const owners = subsumedBy.get(targetId) ?? [];
      owners.push(candidate.candidateId);
      subsumedBy.set(targetId, owners);
    }
    if (validTargets.length > 0) {
      traces.push(traceEntry(
        candidate.candidateId,
        'SUBSUMPTION_HANDLING',
        'PASS',
        'RELATIONAL_THEME_DECLARES_EXPLICIT_SUBSUMPTION',
        validTargets
      ));
    } else {
      traces.push(traceEntry(
        candidate.candidateId,
        'SUBSUMPTION_HANDLING',
        'PASS',
        'NO_EXPLICIT_SUBSUMPTION'
      ));
    }
  }

  const subsumedIds = new Set(subsumedBy.keys());
  const subsumedThemes: SelectedChartLevelTheme[] = [];
  for (const targetId of subsumedIds) {
    const target = byCandidateId.get(targetId);
    if (!target) {
      continue;
    }
    const owners = subsumedBy.get(targetId) ?? [];
    traces.push(traceEntry(
      target.candidateId,
      'SUBSUMPTION_HANDLING',
      'SUBSUMED',
      'SUBSUMED_BY_RELATIONAL_THEME',
      owners
    ));
    subsumedThemes.push(selectedTheme(
      target,
      'SUBSUMED',
      'SUBSUMED_BY_RELATIONAL_THEME',
      owners
    ));
  }

  const selectable = redundancySurvivors.filter((candidate) => !subsumedIds.has(candidate.candidateId));
  for (const candidate of selectable) {
    traces.push(traceEntry(
      candidate.candidateId,
      'PERSONAL_RELEVANCE',
      'PASS',
      `PERSONAL_RELEVANCE_${candidate.personalRelevance}`
    ));
    traces.push(traceEntry(
      candidate.candidateId,
      'SEMANTIC_DISTINCTNESS',
      'PASS',
      'READER_MEANING_IS_DISTINCT_AFTER_DUPLICATE_AND_REDUNDANCY_CONTROL'
    ));
    traces.push(traceEntry(
      candidate.candidateId,
      'RELATIONAL_ENRICHMENT',
      'PASS',
      candidate.relationalEnrichmentState === 'ENRICHED'
        ? 'RELATIONAL_ENRICHMENT_VALUE_RETAINED'
        : 'NO_RELATIONAL_ENRICHMENT_VALUE_DECLARED'
    ));
    traces.push(traceEntry(
      candidate.candidateId,
      'DOMAIN_BREADTH',
      'PASS',
      'DOMAIN_BREADTH_IS_A_TIE_BREAK_ONLY_WITHOUT_DOMAIN_QUOTA'
    ));
  }

  const provenanceReady: ChartLevelThemeCandidate[] = [];
  for (const candidate of selectable) {
    if (!hasCompleteProvenance(candidate)) {
      traces.push(traceEntry(
        candidate.candidateId,
        'PROVENANCE_COMPLETENESS',
        'FAIL',
        'WHY_LEARN_OR_SOURCE_PROVENANCE_INCOMPLETE'
      ));
      suppressed.push(selectedTheme(
        candidate,
        'SUPPRESSED',
        'WHY_LEARN_OR_SOURCE_PROVENANCE_INCOMPLETE'
      ));
      continue;
    }
    traces.push(traceEntry(
      candidate.candidateId,
      'PROVENANCE_COMPLETENESS',
      'PASS',
      'WHY_LEARN_AND_SOURCE_PROVENANCE_COMPLETE'
    ));
    provenanceReady.push(candidate);
  }

  const ordered: ChartLevelThemeCandidate[] = [];
  const remaining = [...provenanceReady];
  const selectedDomains = new Set<SelectorDomain>();
  while (remaining.length > 0) {
    const next = chooseNextCandidate(remaining, selectedDomains);
    ordered.push(next);
    selectedDomains.add(next.domain);
    remaining.splice(remaining.findIndex((candidate) => candidate.candidateId === next.candidateId), 1);
  }

  for (const candidate of ordered) {
    traces.push(traceEntry(
      candidate.candidateId,
      'STABLE_TIE_BREAK',
      'PASS',
      'ORDINAL_RULES_RESOLVE_BEFORE_STABLE_IDENTITY_ORDER'
    ));
  }

  const coreCandidates = ordered.slice(0, maxCoreThemes);
  const supportingCandidates = ordered.slice(maxCoreThemes);
  const coreThemes = coreCandidates.map((candidate) => {
    const reason = candidate.relationalEnrichmentState === 'ENRICHED'
      ? 'CORE_RELATIONALLY_ENRICHED'
      : 'CORE_SEMANTICALLY_DISTINCT';
    traces.push(traceEntry(candidate.candidateId, 'EDITORIAL_ROLE_ASSIGNMENT', 'CORE', reason));
    return selectedTheme(candidate, 'CORE', reason);
  });
  const supportingThemes = supportingCandidates.map((candidate) => {
    const reason = 'SUPPORTING_CONTEXT_CORE_BUDGET_REACHED';
    traces.push(traceEntry(candidate.candidateId, 'EDITORIAL_ROLE_ASSIGNMENT', 'SUPPORTING', reason));
    return selectedTheme(candidate, 'SUPPORTING_THREAD', reason);
  });
  for (const theme of subsumedThemes) {
    traces.push(traceEntry(theme.candidateId, 'EDITORIAL_ROLE_ASSIGNMENT', 'SUBSUMED', theme.editorialReason, theme.relatedCandidateIds));
  }
  for (const theme of suppressed) {
    traces.push(traceEntry(theme.candidateId, 'EDITORIAL_ROLE_ASSIGNMENT', 'SUPPRESSED', theme.editorialReason, theme.relatedCandidateIds));
  }

  const eligibleCandidateIds = uniqueSorted(
    [...provenanceReady, ...subsumedThemes].map((candidate) => candidate.candidateId)
  );
  const suppressedThemes = [...suppressed].sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  const subsumedThemesSorted = [...subsumedThemes].sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  const coreThemeIds = freezeArray(coreThemes.map((theme) => theme.themeId));
  const supportingThemeIds = freezeArray(supportingThemes.map((theme) => theme.themeId));
  const subsumedThemeIds = uniqueSorted(subsumedThemesSorted.map((theme) => theme.themeId));
  const suppressedThemeIds = uniqueSorted(suppressedThemes.map((theme) => theme.themeId));

  return Object.freeze({
    selectorPolicyId: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.id,
    selectorPolicyVersion: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.version,
    inputCandidateIds: freezeArray(candidates.map((candidate) => candidate.candidateId)),
    eligibleCandidateIds,
    coreThemeIds,
    supportingThemeIds,
    subsumedThemeIds,
    suppressedThemeIds,
    failureState: null,
    decisionTrace: freezeArray(sortTraces(traces)),
    coreThemes: freezeArray(coreThemes),
    supportingThemes: freezeArray(supportingThemes),
    subsumedThemes: freezeArray(subsumedThemesSorted),
    suppressedThemes,
    preferredCoreRange: CHART_LEVEL_THEME_SELECTOR_POC_POLICY.preferredCoreRange
  });
}
