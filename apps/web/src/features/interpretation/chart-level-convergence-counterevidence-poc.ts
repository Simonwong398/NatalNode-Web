/**
 * Development-only proof of chart-level convergence and counterevidence.
 *
 * This module consumes already-admitted, structured theme candidates. It does
 * not calculate astronomy, infer semantic similarity, create ChartFacts, or
 * replace the ordinal chart selector. The only positive convergence and
 * counterevidence fixtures admitted by this POC are mechanism-only fixtures;
 * the current bounded astrology inventory has no honest positive case for
 * either classification.
 */

import {
  selectChartLevelPersonalThemes,
  type ChartLevelThemeCandidate,
  type ChartLevelThemeSelectorOptions,
  type ChartLevelThemeSelectorResult,
  type SelectorClaimScopeState,
  type SelectorDomain,
  type SelectorSynthesisClassification
} from './chart-level-personal-theme-selector-poc.js';

export const CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY = Object.freeze({
  id: 'NATALNODE_CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_V1',
  version: '1.0.0',
  runtimeEligibility: 'RUNTIME_NOT_ADMITTED',
  decisionMode: 'DETERMINISTIC_EXPLICIT_ADMISSION',
  numericScoring: false,
  embeddingSimilarity: false,
  llmSemanticAuthority: false,
  confidencePromotion: false,
  intensityPromotion: false,
  directionMutation: false,
  sourceThemeCardExpansion: false
} as const);

export const CHART_LEVEL_SEMANTIC_OVERLAP_POLICY = Object.freeze({
  id: 'NATALNODE_CHART_LEVEL_SEMANTIC_OVERLAP_POLICY_V1',
  version: '1.0.0',
  explicitAdmissionRequired: true,
  sharedLifeQuestionRequiresDisjointRoots: true,
  sameSignIsInsufficient: true,
  sameDomainIsInsufficient: true,
  sameBodyIsInsufficient: true,
  sameWordingIsInsufficient: true,
  sameAspectTypeIsInsufficient: true,
  sameElementIsInsufficient: true,
  sameModalityIsInsufficient: true,
  sharedRootsAreNotIndependent: true,
  noNumericSimilarity: true
} as const);

export type ChartLevelSemanticRelation =
  | 'SHARED_LIFE_QUESTION'
  | 'QUALIFYING_LIFE_QUESTION'
  | 'DISTINCT_LIFE_QUESTION'
  | 'REDUNDANT_MEANING';

export type ChartLevelSynthesisEffect =
  | 'CONVERGE'
  | 'QUALIFY'
  | 'NARROW'
  | 'SUPPRESS_OVERBROAD'
  | 'NONE';

export type ChartLevelRelationMode = 'NONE' | 'RELATIONAL_ENRICHMENT';

export type ChartLevelSynthesisEditorialRole =
  | 'CORE_CANDIDATE'
  | 'QUALIFIED_CORE_CANDIDATE'
  | 'RELATIONAL_CANDIDATE'
  | 'SOURCE_CANDIDATE'
  | 'SUPPRESSED';

export type ChartLevelSourceThemeState =
  | 'CONVERGED_SUPPORTING_SOURCE'
  | 'QUALIFIED_TARGET_SOURCE'
  | 'COUNTEREVIDENCE_SOURCE'
  | 'RELATIONAL_SOURCE'
  | 'DUPLICATE_SOURCE'
  | 'REDUNDANT_SOURCE'
  | 'CONFLICT_SOURCE';

export interface ChartLevelSynthesisThemeInput extends ChartLevelThemeCandidate {
  readonly semanticClaim: string;
  readonly semanticQuestion: string;
  readonly integratedSemanticBasis?: readonly string[];
  readonly relationKind?: 'NONE' | 'RELATIONAL';
  readonly whyReferences?: Readonly<Record<string, unknown>>;
  readonly learnReferences?: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath?: string;
  }[];
}

export interface ChartLevelSemanticOverlapAdmission {
  readonly policyId: typeof CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id;
  readonly policyVersion: typeof CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version;
  readonly semanticRelation: ChartLevelSemanticRelation;
  readonly admitted: boolean;
  readonly sharedLifeQuestion: string | null;
  readonly integratedSemanticBasis: readonly string[];
  readonly selectedDomain: SelectorDomain | null;
  readonly reason: string;
}

export interface ChartLevelCounterevidenceOptions {
  readonly targetThemeId: string;
  readonly qualifierThemeId: string;
  readonly effect: Exclude<ChartLevelSynthesisEffect, 'CONVERGE' | 'NONE'>;
}

export interface ChartLevelSynthesisDecisionOptions {
  readonly semanticOverlap?: ChartLevelSemanticOverlapAdmission;
  readonly relationMode?: ChartLevelRelationMode;
  readonly counterevidence?: ChartLevelCounterevidenceOptions;
}

export type ChartLevelSynthesisFailureCode =
  | 'INSUFFICIENT_SOURCES'
  | 'MISSING_ROOT_SUPPORT'
  | 'CONFLICTING_BODY_SIGN_PLACEMENT'
  | 'INDEPENDENT_ROOTS_REQUIRED'
  | 'COUNTEREVIDENCE_REQUIRES_INDEPENDENT_ROOT'
  | 'COUNTEREVIDENCE_TARGET_AMBIGUOUS'
  | 'AMBIGUOUS_DOMAIN'
  | 'EPISTEMIC_FIELDS_NOT_AGGREGATED';

export interface ChartLevelSynthesisFailure {
  readonly code: ChartLevelSynthesisFailureCode;
  readonly reason: string;
  readonly relatedThemeIds: readonly string[];
}

export interface ChartLevelSourceThemeProvenance {
  readonly themeId: string;
  readonly sourceRefs: readonly string[];
  readonly sourceFactRefs: readonly string[];
  readonly whyReady: boolean;
  readonly learnReady: boolean;
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly learnReferences: readonly {
    readonly objectId: string;
    readonly label: string;
    readonly sourcePath?: string;
  }[];
}

export interface ChartLevelSynthesisDecision {
  readonly decisionId: string;
  readonly policyId: typeof CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.id;
  readonly policyVersion: typeof CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.version;
  readonly classification: SelectorSynthesisClassification;
  readonly synthesizedThemeId: string;
  readonly sourceThemeIds: readonly string[];
  readonly sourceSemanticUnitIds: readonly string[];
  readonly sourceRootSets: readonly {
    readonly themeId: string;
    readonly rootKeys: readonly string[];
  }[];
  readonly uniqueRootKeys: readonly string[];
  readonly uniqueRootCount: number;
  readonly semanticRelation: ChartLevelSemanticRelation;
  readonly effect: ChartLevelSynthesisEffect;
  readonly overlapPolicyId: typeof CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id;
  readonly overlapPolicyVersion: typeof CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version;
  readonly overlapDecision: ChartLevelSemanticOverlapAdmission;
  readonly sharedLifeQuestion: string | null;
  readonly integratedSemanticBasis: readonly string[];
  readonly domainState: {
    readonly method:
      | 'INTEGRATED_THEME_SEMANTICS'
      | 'QUALIFIED_TARGET_SCOPE'
      | 'RELATIONAL_SEMANTICS'
      | 'TARGET_SCOPE_PRESERVED'
      | 'NO_ADMITTED_DOMAIN';
    readonly selectedDomain: SelectorDomain | null;
    readonly majorityVote: false;
    readonly rationale: string;
  };
  readonly editorialRole: ChartLevelSynthesisEditorialRole;
  readonly direction: ChartLevelThemeCandidate['direction'];
  readonly intensity: ChartLevelThemeCandidate['intensity'];
  readonly confidence: ChartLevelThemeCandidate['confidence'];
  readonly independentSupport: boolean;
  readonly claimScope: {
    readonly state: SelectorClaimScopeState;
    readonly summary: string;
  };
  readonly sourceThemeStates: readonly {
    readonly themeId: string;
    readonly state: ChartLevelSourceThemeState;
  }[];
  readonly authorityRequirements: {
    readonly birthTimeDependency: 'UNKNOWN_TIME_SAFE' | 'REQUIRES_KNOWN';
  };
  readonly provenance: {
    readonly sourceAuthority: 'INCOMPLETE_RESEARCH' | 'DEVELOPMENT_ONLY';
    readonly sourceThemes: readonly ChartLevelSourceThemeProvenance[];
    readonly sourceRefs: readonly string[];
    readonly sourceFactRefs: readonly string[];
    readonly runtimeStatus: 'RUNTIME_NOT_ADMITTED';
  };
  readonly whyReferences: Readonly<Record<string, unknown>>;
  readonly suppressionState:
    | 'NONE'
    | 'DUPLICATE'
    | 'REDUNDANCY'
    | 'CONFLICT'
    | 'SUPPRESS_OVERBROAD';
  readonly failureState: ChartLevelSynthesisFailure | null;
}

export interface ChartLevelSynthesisSelectorResult {
  readonly candidate: ChartLevelThemeCandidate | null;
  readonly selector: ChartLevelThemeSelectorResult | null;
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function normalizedOverlap(
  overlap: ChartLevelSemanticOverlapAdmission | undefined
): ChartLevelSemanticOverlapAdmission {
  if (overlap === undefined) {
    return Object.freeze({
      policyId: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id,
      policyVersion: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version,
      semanticRelation: 'DISTINCT_LIFE_QUESTION',
      admitted: false,
      sharedLifeQuestion: null,
      integratedSemanticBasis: freezeArray([]),
      selectedDomain: null,
      reason: 'No explicit semantic-overlap admission was supplied.'
    });
  }
  if (overlap.policyId !== CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id ||
      overlap.policyVersion !== CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version) {
    return Object.freeze({
      ...overlap,
      admitted: false,
      reason: 'The semantic-overlap policy identity is not admitted by this POC.'
    });
  }
  if (overlap.admitted &&
      (overlap.sharedLifeQuestion === null ||
        overlap.integratedSemanticBasis.length === 0 ||
        overlap.selectedDomain === null)) {
    return Object.freeze({
      ...overlap,
      admitted: false,
      reason: 'An admitted overlap requires a shared question, integrated basis, and closed domain.'
    });
  }
  return Object.freeze({
    ...overlap,
    integratedSemanticBasis: freezeArray(overlap.integratedSemanticBasis)
  });
}

export function createSemanticOverlapAdmission(input: {
  readonly semanticRelation: ChartLevelSemanticRelation;
  readonly sharedLifeQuestion?: string | null;
  readonly integratedSemanticBasis?: readonly string[];
  readonly selectedDomain?: SelectorDomain | null;
  readonly reason: string;
  readonly admitted?: boolean;
}): ChartLevelSemanticOverlapAdmission {
  const semanticRelation = input.semanticRelation;
  const admitted = input.admitted ?? true;
  return normalizedOverlap({
    policyId: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id,
    policyVersion: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version,
    semanticRelation,
    admitted,
    sharedLifeQuestion: input.sharedLifeQuestion ?? null,
    integratedSemanticBasis: freezeArray(input.integratedSemanticBasis ?? []),
    selectedDomain: input.selectedDomain ?? null,
    reason: input.reason
  });
}

function sourceRootSets(
  sources: readonly ChartLevelSynthesisThemeInput[]
): readonly { readonly themeId: string; readonly rootKeys: readonly string[] }[] {
  return freezeArray(
    [...sources]
      .sort((left, right) => left.themeId.localeCompare(right.themeId))
      .map((source) => Object.freeze({
        themeId: source.themeId,
        rootKeys: uniqueSorted(source.rootKeys)
      }))
  );
}

function sourceThemeIds(sources: readonly ChartLevelSynthesisThemeInput[]): readonly string[] {
  return uniqueSorted(sources.map((source) => source.themeId));
}

function sourceSemanticUnitIds(
  sources: readonly ChartLevelSynthesisThemeInput[]
): readonly string[] {
  return uniqueSorted(sources.flatMap((source) => source.semanticUnitIds));
}

function uniqueRootKeys(sources: readonly ChartLevelSynthesisThemeInput[]): readonly string[] {
  return uniqueSorted(sources.flatMap((source) => source.rootKeys));
}

function sourceRefs(sources: readonly ChartLevelSynthesisThemeInput[]): readonly string[] {
  return uniqueSorted(sources.flatMap((source) => source.provenance.sourceRefs));
}

function sourceFactRefs(sources: readonly ChartLevelSynthesisThemeInput[]): readonly string[] {
  return uniqueSorted(sources.flatMap((source) => source.provenance.sourceFactRefs));
}

function sourceProvenance(
  sources: readonly ChartLevelSynthesisThemeInput[]
): readonly ChartLevelSourceThemeProvenance[] {
  return freezeArray(
    [...sources]
      .sort((left, right) => left.themeId.localeCompare(right.themeId))
      .map((source) => Object.freeze({
        themeId: source.themeId,
        sourceRefs: uniqueSorted(source.provenance.sourceRefs),
        sourceFactRefs: uniqueSorted(source.provenance.sourceFactRefs),
        whyReady: source.provenance.whyReady,
        learnReady: source.provenance.learnReady,
        whyReferences: source.whyReferences ?? Object.freeze({}),
        learnReferences: freezeArray(
          [...(source.learnReferences ?? [])]
            .sort((left, right) => `${left.objectId}|${left.label}|${left.sourcePath ?? ''}`
              .localeCompare(`${right.objectId}|${right.label}|${right.sourcePath ?? ''}`))
        )
      }))
  );
}

function rootsArePairwiseDisjoint(
  sources: readonly ChartLevelSynthesisThemeInput[]
): boolean {
  for (let leftIndex = 0; leftIndex < sources.length; leftIndex += 1) {
    const leftRoots = new Set(sources[leftIndex]?.rootKeys ?? []);
    for (let rightIndex = leftIndex + 1; rightIndex < sources.length; rightIndex += 1) {
      if ((sources[rightIndex]?.rootKeys ?? []).some((root) => leftRoots.has(root))) {
        return false;
      }
    }
  }
  return true;
}

function qualifierHasIndependentRoot(
  target: ChartLevelSynthesisThemeInput,
  qualifier: ChartLevelSynthesisThemeInput
): boolean {
  const targetRoots = new Set(target.rootKeys);
  return qualifier.rootKeys.some((root) => !targetRoots.has(root));
}

function conflictingPlacementThemes(
  sources: readonly ChartLevelSynthesisThemeInput[]
): readonly string[] {
  const groups = new Map<string, ChartLevelSynthesisThemeInput[]>();
  for (const source of sources) {
    if (source.placement === undefined) {
      continue;
    }
    const key = [
      source.placement.scope,
      source.placement.placementType,
      source.placement.bodyId
    ].join('|');
    const group = groups.get(key) ?? [];
    group.push(source);
    groups.set(key, group);
  }
  const conflicts: string[] = [];
  for (const group of groups.values()) {
    if (new Set(group.map((source) => source.placement?.signId)).size > 1) {
      conflicts.push(...group.map((source) => source.themeId));
    }
  }
  return uniqueSorted(conflicts);
}

function failure(
  code: ChartLevelSynthesisFailureCode,
  reason: string,
  relatedThemeIds: readonly string[]
): ChartLevelSynthesisFailure {
  return Object.freeze({
    code,
    reason,
    relatedThemeIds: uniqueSorted(relatedThemeIds)
  });
}

function decisionId(
  classification: SelectorSynthesisClassification,
  sources: readonly ChartLevelSynthesisThemeInput[]
): string {
  return `chart-decision.${classification.toLowerCase()}.${sourceThemeIds(sources).join('+')}`;
}

function synthesizedThemeId(
  classification: SelectorSynthesisClassification,
  sources: readonly ChartLevelSynthesisThemeInput[]
): string {
  return `chart-synthesis.${classification.toLowerCase()}.${sourceThemeIds(sources).join('+')}`;
}

function sourceStates(
  classification: SelectorSynthesisClassification,
  sources: readonly ChartLevelSynthesisThemeInput[],
  counterevidence: ChartLevelCounterevidenceOptions | undefined
): readonly { readonly themeId: string; readonly state: ChartLevelSourceThemeState }[] {
  const state = classification === 'INDEPENDENT_CONVERGENCE'
    ? 'CONVERGED_SUPPORTING_SOURCE'
    : classification === 'RELATIONAL_ENRICHMENT'
      ? 'RELATIONAL_SOURCE'
      : classification === 'DUPLICATE'
        ? 'DUPLICATE_SOURCE'
        : classification === 'REDUNDANCY'
          ? 'REDUNDANT_SOURCE'
          : classification === 'CONFLICT'
            ? 'CONFLICT_SOURCE'
            : null;
  return freezeArray(
    [...sources]
      .sort((left, right) => left.themeId.localeCompare(right.themeId))
      .map((source) => {
        if (classification === 'COUNTEREVIDENCE' && counterevidence !== undefined) {
          return Object.freeze({
            themeId: source.themeId,
            state: source.themeId === counterevidence.targetThemeId
              ? 'QUALIFIED_TARGET_SOURCE'
              : 'COUNTEREVIDENCE_SOURCE'
          });
        }
        return Object.freeze({
          themeId: source.themeId,
          state: state ?? 'RELATIONAL_SOURCE'
        });
      })
  );
}

function targetSource(
  sources: readonly ChartLevelSynthesisThemeInput[],
  counterevidence: ChartLevelCounterevidenceOptions | undefined
): ChartLevelSynthesisThemeInput {
  if (counterevidence !== undefined) {
    const target = sources.find((source) => source.themeId === counterevidence.targetThemeId);
    if (target !== undefined) {
      return target;
    }
  }
  const first = sources[0];
  if (first === undefined) {
    throw new Error('Chart-level synthesis requires at least one source theme.');
  }
  return first;
}

function epistemicFieldsAlign(sources: readonly ChartLevelSynthesisThemeInput[]): boolean {
  const first = sources[0];
  if (first === undefined) {
    return false;
  }
  return sources.every((source) =>
    source.direction === first.direction &&
    source.intensity === first.intensity &&
    source.confidence === first.confidence
  );
}

function makeDecision(
  sources: readonly ChartLevelSynthesisThemeInput[],
  classification: SelectorSynthesisClassification,
  overlap: ChartLevelSemanticOverlapAdmission,
  effect: ChartLevelSynthesisEffect,
  options: ChartLevelSynthesisDecisionOptions,
  failureState: ChartLevelSynthesisFailure | null,
  claimScopeState: SelectorClaimScopeState,
  claimScopeSummary: string,
  suppressionState: ChartLevelSynthesisDecision['suppressionState']
): ChartLevelSynthesisDecision {
  const normalizedSources = freezeArray([...sources]);
  const target = targetSource(normalizedSources, options.counterevidence);
  const ids = sourceThemeIds(normalizedSources);
  const roots = uniqueRootKeys(normalizedSources);
  const selectedDomain = classification === 'INDEPENDENT_CONVERGENCE'
    ? overlap.selectedDomain
    : classification === 'COUNTEREVIDENCE' || classification === 'RELATIONAL_ENRICHMENT'
      ? target.domain
      : target.domain;
  const domainMethod = classification === 'INDEPENDENT_CONVERGENCE'
    ? 'INTEGRATED_THEME_SEMANTICS'
    : classification === 'COUNTEREVIDENCE'
      ? 'QUALIFIED_TARGET_SCOPE'
      : classification === 'RELATIONAL_ENRICHMENT'
        ? 'RELATIONAL_SEMANTICS'
        : 'TARGET_SCOPE_PRESERVED';
  const sourceAuthority = normalizedSources.every((source) =>
    source.provenance.sourceAuthority === 'DEVELOPMENT_ONLY'
  ) ? 'DEVELOPMENT_ONLY' : 'INCOMPLETE_RESEARCH';

  return Object.freeze({
    decisionId: decisionId(classification, normalizedSources),
    policyId: CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.id,
    policyVersion: CHART_LEVEL_CONVERGENCE_COUNTEREVIDENCE_POC_POLICY.version,
    classification,
    synthesizedThemeId: synthesizedThemeId(classification, normalizedSources),
    sourceThemeIds: ids,
    sourceSemanticUnitIds: sourceSemanticUnitIds(normalizedSources),
    sourceRootSets: sourceRootSets(normalizedSources),
    uniqueRootKeys: roots,
    uniqueRootCount: roots.length,
    semanticRelation: overlap.semanticRelation,
    effect,
    overlapPolicyId: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id,
    overlapPolicyVersion: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version,
    overlapDecision: overlap,
    sharedLifeQuestion: overlap.sharedLifeQuestion,
    integratedSemanticBasis: uniqueSorted([
      ...normalizedSources.flatMap((source) => source.integratedSemanticBasis ?? source.semanticBasisIds),
      ...overlap.integratedSemanticBasis
    ]),
    domainState: Object.freeze({
      method: selectedDomain === null ? 'NO_ADMITTED_DOMAIN' : domainMethod,
      selectedDomain,
      majorityVote: false,
      rationale: overlap.reason
    }),
    editorialRole: classification === 'INDEPENDENT_CONVERGENCE'
      ? 'CORE_CANDIDATE'
      : classification === 'COUNTEREVIDENCE'
        ? effect === 'SUPPRESS_OVERBROAD' ? 'SUPPRESSED' : 'QUALIFIED_CORE_CANDIDATE'
        : classification === 'RELATIONAL_ENRICHMENT'
          ? 'RELATIONAL_CANDIDATE'
          : classification === 'DISTINCT'
            ? 'SOURCE_CANDIDATE'
            : 'SUPPRESSED',
    direction: target.direction,
    intensity: target.intensity,
    confidence: target.confidence,
    independentSupport: classification === 'INDEPENDENT_CONVERGENCE',
    claimScope: Object.freeze({
      state: claimScopeState,
      summary: claimScopeSummary
    }),
    sourceThemeStates: sourceStates(classification, normalizedSources, options.counterevidence),
    authorityRequirements: Object.freeze({
      birthTimeDependency: normalizedSources.some((source) =>
        source.unknownTimeEligibility === 'REQUIRES_KNOWN'
      ) ? 'REQUIRES_KNOWN' : 'UNKNOWN_TIME_SAFE'
    }),
    provenance: Object.freeze({
      sourceAuthority,
      sourceThemes: sourceProvenance(normalizedSources),
      sourceRefs: sourceRefs(normalizedSources),
      sourceFactRefs: sourceFactRefs(normalizedSources),
      runtimeStatus: 'RUNTIME_NOT_ADMITTED' as const
    }),
    whyReferences: Object.freeze({
      sourceThemeIds: ids,
      sourceSemanticUnitIds: sourceSemanticUnitIds(normalizedSources),
      sourceRootSets: sourceRootSets(normalizedSources),
      overlapPolicyId: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.id,
      overlapPolicyVersion: CHART_LEVEL_SEMANTIC_OVERLAP_POLICY.version,
      overlapDecision: overlap,
      effect,
      claimScope: claimScopeState,
      sourceWhyReferences: [...normalizedSources]
        .sort((left, right) => left.themeId.localeCompare(right.themeId))
        .map((source) => ({
          themeId: source.themeId,
          whyReferences: source.whyReferences ?? {}
        }))
    }),
    suppressionState,
    failureState
  });
}

/**
 * Classifies an already-structured chart-level bundle. Explicit admission is
 * the only semantic-overlap authority; shared vocabulary never qualifies.
 */
export function classifyChartLevelThemes(
  sources: readonly ChartLevelSynthesisThemeInput[],
  options: ChartLevelSynthesisDecisionOptions = {}
): ChartLevelSynthesisDecision {
  if (sources.length < 2) {
    const source = sources[0];
    const fallback = source === undefined
      ? createMechanismFallbackSource('mechanism.empty')
      : source;
    return makeDecision(
      [fallback, fallback],
      'DISTINCT',
      normalizedOverlap(options.semanticOverlap),
      'NONE',
      options,
      failure('INSUFFICIENT_SOURCES', 'At least two separate source themes are required.', [fallback.themeId]),
      'ORIGINAL',
      'No chart-level synthesis is admitted from fewer than two source themes.',
      'NONE'
    );
  }

  const overlap = normalizedOverlap(options.semanticOverlap);
  const ids = sourceThemeIds(sources);
  if (sources.some((source) => source.rootKeys.length === 0)) {
    return makeDecision(
      sources,
      'DISTINCT',
      overlap,
      'NONE',
      options,
      failure('MISSING_ROOT_SUPPORT', 'Every source theme must preserve at least one evidence root.', ids),
      'ORIGINAL',
      'The source bundle is retained for inspection but cannot synthesize without root support.',
      'NONE'
    );
  }

  const conflictIds = conflictingPlacementThemes(sources);
  if (conflictIds.length > 0) {
    return makeDecision(
      sources,
      'CONFLICT',
      overlap,
      'NONE',
      options,
      failure(
        'CONFLICTING_BODY_SIGN_PLACEMENT',
        'One natal body cannot occupy two different signs in the same placement scope.',
        conflictIds
      ),
      'ORIGINAL',
      'The source facts are incoherent; conflict is not counterevidence.',
      'CONFLICT'
    );
  }

  const factIdentityKeys = new Set(sources.map((source) => source.factIdentityKey));
  if (factIdentityKeys.size < sources.length) {
    return makeDecision(
      sources,
      'DUPLICATE',
      overlap,
      'NONE',
      options,
      null,
      'ORIGINAL',
      'Repeated fact identity adds no support and cannot create independent convergence.',
      'DUPLICATE'
    );
  }

  const readerMeaningKeys = new Set(sources.map((source) => source.readerMeaningKey));
  if (readerMeaningKeys.size < sources.length) {
    return makeDecision(
      sources,
      'REDUNDANCY',
      overlap,
      'NONE',
      options,
      null,
      'ORIGINAL',
      'Repeated reader meaning adds no support or qualifier.',
      'REDUNDANCY'
    );
  }

  if (options.counterevidence !== undefined &&
      overlap.semanticRelation === 'QUALIFYING_LIFE_QUESTION' &&
      overlap.admitted) {
    const target = sources.find((source) => source.themeId === options.counterevidence?.targetThemeId);
    const qualifier = sources.find((source) => source.themeId === options.counterevidence?.qualifierThemeId);
    if (target === undefined || qualifier === undefined || target === qualifier) {
      return makeDecision(
        sources,
        'DISTINCT',
        overlap,
        'NONE',
        options,
        failure(
          'COUNTEREVIDENCE_TARGET_AMBIGUOUS',
          'Counterevidence must name one target theme and one distinct qualifier theme.',
          ids
        ),
        'ORIGINAL',
        'The qualifier cannot be attached to an ambiguous target.',
        'NONE'
      );
    }
    if (!qualifierHasIndependentRoot(target, qualifier)) {
      return makeDecision(
        sources,
        'RELATIONAL_ENRICHMENT',
        overlap,
        'NONE',
        { ...options, relationMode: 'RELATIONAL_ENRICHMENT' },
        failure(
          'COUNTEREVIDENCE_REQUIRES_INDEPENDENT_ROOT',
          'A qualifier whose roots are already contained by the target remains internal relational tension, not chart-level counterevidence.',
          ids
        ),
        'INTERNAL_TENSION',
        'The same-root qualifier can add relational tension but cannot qualify the chart-level claim independently.',
        'NONE'
      );
    }
    return makeDecision(
      sources,
      'COUNTEREVIDENCE',
      overlap,
      options.counterevidence.effect,
      options,
      null,
      options.counterevidence.effect === 'QUALIFY'
        ? 'QUALIFIED'
        : options.counterevidence.effect === 'NARROW'
          ? 'NARROWED'
          : 'SUPPRESSED_OVERBROAD',
      options.counterevidence.effect === 'QUALIFY'
        ? 'The original claim remains visible with an explicit independently supported condition.'
        : options.counterevidence.effect === 'NARROW'
          ? 'The original claim is narrowed to the portion that remains supported after the independent qualifier.'
          : 'The overbroad claim is withheld because the independent qualifier makes it misleading.',
      options.counterevidence.effect === 'SUPPRESS_OVERBROAD' ? 'SUPPRESS_OVERBROAD' : 'NONE'
    );
  }

  if (options.relationMode === 'RELATIONAL_ENRICHMENT' &&
      !rootsArePairwiseDisjoint(sources)) {
    return makeDecision(
      sources,
      'RELATIONAL_ENRICHMENT',
      overlap,
      'NONE',
      options,
      null,
      'INTERNAL_TENSION',
      'The admitted relational unit adds meaning over roots already in the bundle; it is not independent convergence.',
      'NONE'
    );
  }

  if (overlap.semanticRelation === 'SHARED_LIFE_QUESTION' && overlap.admitted) {
    if (!rootsArePairwiseDisjoint(sources)) {
      return makeDecision(
        sources,
        'DISTINCT',
        overlap,
        'NONE',
        options,
        failure(
          'INDEPENDENT_ROOTS_REQUIRED',
          'Independent convergence requires pairwise-disjoint source root sets.',
          ids
        ),
        'ORIGINAL',
        'The explicit shared question cannot overcome shared astronomical roots.',
        'NONE'
      );
    }
    if (overlap.selectedDomain === null) {
      return makeDecision(
        sources,
        'DISTINCT',
        overlap,
        'NONE',
        options,
        failure(
          'AMBIGUOUS_DOMAIN',
          'Independent convergence requires one closed domain derived from the integrated question.',
          ids
        ),
        'ORIGINAL',
        'No domain is invented for an ambiguous integrated question.',
        'NONE'
      );
    }
    if (!epistemicFieldsAlign(sources)) {
      return makeDecision(
        sources,
        'DISTINCT',
        overlap,
        'NONE',
        options,
        failure(
          'EPISTEMIC_FIELDS_NOT_AGGREGATED',
          'Convergence cannot arithmeticly aggregate direction, intensity, or confidence.',
          ids
        ),
        'ORIGINAL',
        'Source epistemic fields remain separate when they do not align.',
        'NONE'
      );
    }
    return makeDecision(
      sources,
      'INDEPENDENT_CONVERGENCE',
      overlap,
      'CONVERGE',
      options,
      null,
      'ORIGINAL',
      'Separate roots answer one explicitly admitted shared personal question; editorial support increases without epistemic promotion.',
      'NONE'
    );
  }

  return makeDecision(
    sources,
    'DISTINCT',
    overlap,
    'NONE',
    options,
    null,
    'ORIGINAL',
    'No explicit admitted semantic relation joins these source themes.',
    'NONE'
  );
}

function createMechanismFallbackSource(themeId: string): ChartLevelSynthesisThemeInput {
  return {
    candidateId: themeId,
    themeId,
    candidateKind: 'PROJECTION',
    sourceSignalIds: [themeId],
    semanticUnitIds: [`semantic-unit.${themeId}`],
    rootKeys: [`mechanism.root.${themeId}`],
    domain: 'SELF',
    direction: 'NEUTRAL',
    intensity: 'SUBTLE',
    confidence: 'LOW',
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `mechanism:${themeId}`,
    readerMeaningKey: `mechanism:${themeId}`,
    factIdentityKey: `mechanism:${themeId}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: 'UNKNOWN_TIME_SAFE',
    semanticBasisIds: [`mechanism.${themeId}`],
    qualificationState: 'NONE',
    provenance: {
      sourceAuthority: 'DEVELOPMENT_ONLY',
      sourceRefs: ['MECHANISM_ONLY_SEMANTIC_TEST_FIXTURE'],
      sourceFactRefs: [themeId],
      whyReady: true,
      learnReady: true,
      runtimeStatus: 'RUNTIME_NOT_ADMITTED'
    },
    semanticClaim: 'Mechanism-only fallback.',
    semanticQuestion: 'Mechanism-only fallback.'
  };
}

/** Converts one non-suppressed synthesis result into the existing selector input. */
export function createSelectorCandidateFromSynthesisDecision(
  decision: ChartLevelSynthesisDecision
): ChartLevelThemeCandidate | null {
  if (decision.editorialRole === 'SUPPRESSED' || decision.failureState !== null) {
    return null;
  }
  const sourceAuthority = decision.provenance.sourceAuthority;
  return Object.freeze({
    candidateId: decision.synthesizedThemeId,
    themeId: decision.synthesizedThemeId,
    candidateKind: 'PROJECTION',
    sourceSignalIds: decision.sourceThemeIds,
    semanticUnitIds: decision.sourceSemanticUnitIds,
    rootKeys: decision.uniqueRootKeys,
    domain: decision.domainState.selectedDomain ?? 'SELF',
    direction: decision.direction,
    intensity: decision.intensity,
    confidence: decision.confidence,
    personalRelevance: 'DIRECT',
    semanticIdentityKey: `chart-synthesis:${decision.synthesizedThemeId}`,
    readerMeaningKey: `chart-synthesis:${decision.synthesizedThemeId}`,
    factIdentityKey: `chart-synthesis:${decision.synthesizedThemeId}`,
    relationalEnrichmentState: 'NONE',
    subsumptionState: 'NONE',
    subsumedCandidateIds: [],
    authorityEligibility: 'ELIGIBLE',
    unknownTimeEligibility: decision.authorityRequirements.birthTimeDependency,
    semanticBasisIds: decision.integratedSemanticBasis,
    qualificationState: decision.classification === 'COUNTEREVIDENCE'
      ? 'QUALIFICATION_REQUIRED'
      : 'NONE',
    synthesisClassification: decision.classification,
    independentSupportState: decision.independentSupport
      ? 'INDEPENDENTLY_SUPPORTED'
      : 'NONE',
    claimScopeState: decision.claimScope.state,
    sourceThemeStates: decision.sourceThemeStates,
    provenance: {
      sourceAuthority,
      sourceRefs: decision.provenance.sourceRefs,
      sourceFactRefs: decision.provenance.sourceFactRefs,
      whyReady: decision.provenance.sourceThemes.every((source) => source.whyReady),
      learnReady: decision.provenance.sourceThemes.every((source) => source.learnReady),
      runtimeStatus: 'RUNTIME_NOT_ADMITTED' as const
    }
  });
}

/** Uses the existing selector; this is an adapter, not a second selector. */
export function selectSynthesisDecision(
  decision: ChartLevelSynthesisDecision,
  options: ChartLevelThemeSelectorOptions = {}
): ChartLevelSynthesisSelectorResult {
  const candidate = createSelectorCandidateFromSynthesisDecision(decision);
  if (candidate === null) {
    return Object.freeze({ candidate: null, selector: null });
  }
  return Object.freeze({
    candidate,
    selector: selectChartLevelPersonalThemes([candidate], options)
  });
}
