import type {
  BirthTimeAmbiguityStatus,
  ChartRequest,
  ChartResult
} from './chart.js';

/**
 * Web/BFF request-result authority policy. This is a contract policy id, not
 * an astronomy configuration or scientific provenance identifier.
 */
export const REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID =
  'REQUEST_RESULT_AUTHORITY_CERTIFICATION_V1' as const;

export type ChartAuthorityFailureCode =
  | 'INVALID_REQUEST_AUTHORITY'
  | 'RESULT_AUTHORITY_MISMATCH'
  | 'TIME_DEPENDENT_FACT_WITH_UNKNOWN_TIME'
  | 'UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION'
  | 'PERSISTED_AUTHORITY_MISMATCH';

export type ChartResultFactCategory =
  | 'BODY_POSITIONS'
  | 'BODY_HOUSE_ASSIGNMENTS'
  | 'ANGLES'
  | 'HOUSES'
  | 'ASPECTS'
  | 'ANGLE_RELATIONS';

export type ChartRequestAuthorityIssue = {
  readonly code: 'INVALID_REQUEST_AUTHORITY';
  readonly reason:
    | 'EMPTY_HOUSE_SYSTEM'
    | 'UNKNOWN_TIME_HAS_TIME_FIELDS'
    | 'NON_EXACT_TIME_HAS_RESOLVED_FIELDS'
    | 'NON_EXACT_TIME_MISSING_LOCAL_TIME'
    | 'EXACT_TIME_MISSING_REQUIRED_FIELDS';
};

export type ChartResultAuthorityCertification =
  | {
      readonly outcome: 'CERTIFIED';
      readonly policyId: typeof REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID;
      readonly requestAuthority: BirthTimeAmbiguityStatus;
      readonly authorityBasis:
        | 'REQUEST_COMPATIBLE_FACT_CATEGORIES'
        | 'NO_TIME_DEPENDENT_FACTS';
      readonly omittedFactCategories: readonly ChartResultFactCategory[];
    }
  | {
      readonly outcome: 'REJECTED';
      readonly policyId: typeof REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID;
      readonly requestAuthority: BirthTimeAmbiguityStatus;
      readonly failureCode: ChartAuthorityFailureCode;
      readonly rejectedFactCategories: readonly ChartResultFactCategory[];
    };

function hasValue(value: string | number | null): boolean {
  return value !== null;
}

function hasNonEmptyText(value: string | null): boolean {
  return value !== null && value.trim() !== '';
}

/**
 * Returns the only request-authority issue represented by the current
 * ChartRequest contract. The canonical authority source remains
 * `birth.ambiguityStatus`; this helper does not introduce a parallel flag.
 */
export function getChartRequestAuthorityIssue(
  request: ChartRequest
): ChartRequestAuthorityIssue | null {
  const birth = request.birth;

  if (request.houseSystem.trim() === '') {
    return {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'EMPTY_HOUSE_SYSTEM'
    };
  }

  if (
    birth.ambiguityStatus === 'UNKNOWN_TIME' &&
    (hasValue(birth.localTime) ||
      hasValue(birth.resolvedUtcInstant) ||
      hasValue(birth.utcOffsetSeconds))
  ) {
    return {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'UNKNOWN_TIME_HAS_TIME_FIELDS'
    };
  }

  if (
    (birth.ambiguityStatus === 'AMBIGUOUS' ||
      birth.ambiguityStatus === 'NONEXISTENT') &&
    (!hasNonEmptyText(birth.localTime) ||
      hasValue(birth.resolvedUtcInstant) ||
      hasValue(birth.utcOffsetSeconds))
  ) {
    return {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason:
        birth.localTime === null
          ? 'NON_EXACT_TIME_MISSING_LOCAL_TIME'
          : 'NON_EXACT_TIME_HAS_RESOLVED_FIELDS'
    };
  }

  if (
    birth.ambiguityStatus === 'EXACT' &&
    (!hasNonEmptyText(birth.localTime) ||
      !hasNonEmptyText(birth.resolvedUtcInstant) ||
      !hasValue(birth.utcOffsetSeconds))
  ) {
    return {
      code: 'INVALID_REQUEST_AUTHORITY',
      reason: 'EXACT_TIME_MISSING_REQUIRED_FIELDS'
    };
  }

  return null;
}

function uniqueCategories(
  categories: readonly ChartResultFactCategory[]
): readonly ChartResultFactCategory[] {
  return [...new Set(categories)];
}

function isAngleRelation(aspect: ChartResult['aspects'][number]): boolean {
  const angleIds = new Set(['ASC', 'MC']);

  return angleIds.has(aspect.firstBodyId) || angleIds.has(aspect.secondBodyId);
}

/**
 * Certifies only request/result category compatibility; it does not recalculate astronomy,
 * check longitude correctness, estimate motion, or mutate scientific provenance.
 */
export function certifyChartResultForRequest(
  request: ChartRequest,
  result: ChartResult
): ChartResultAuthorityCertification {
  const requestIssue = getChartRequestAuthorityIssue(request);

  if (requestIssue !== null) {
    return {
      outcome: 'REJECTED',
      policyId: REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID,
      requestAuthority: request.birth.ambiguityStatus,
      failureCode: requestIssue.code,
      rejectedFactCategories: []
    };
  }

  if (request.birth.ambiguityStatus === 'EXACT') {
    return {
      outcome: 'CERTIFIED',
      policyId: REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID,
      requestAuthority: request.birth.ambiguityStatus,
      authorityBasis: 'REQUEST_COMPATIBLE_FACT_CATEGORIES',
      omittedFactCategories: []
    };
  }

  const timeDependentCategories: ChartResultFactCategory[] = [];

  if (result.angles.length > 0) {
    timeDependentCategories.push('ANGLES');
  }

  if (result.houses !== null) {
    timeDependentCategories.push('HOUSES');
  }

  if (result.bodies.some((body) => body.house !== null)) {
    timeDependentCategories.push('BODY_HOUSE_ASSIGNMENTS');
  }

  if (result.aspects.length > 0) {
    timeDependentCategories.push('ASPECTS');
    if (result.aspects.some(isAngleRelation)) {
      timeDependentCategories.push('ANGLE_RELATIONS');
    }
  }

  if (timeDependentCategories.length > 0) {
    return {
      outcome: 'REJECTED',
      policyId: REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID,
      requestAuthority: request.birth.ambiguityStatus,
      failureCode: 'TIME_DEPENDENT_FACT_WITH_UNKNOWN_TIME',
      rejectedFactCategories: uniqueCategories(timeDependentCategories)
    };
  }

  if (result.bodies.length > 0) {
    return {
      outcome: 'REJECTED',
      policyId: REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID,
      requestAuthority: request.birth.ambiguityStatus,
      failureCode: 'UNSUPPORTED_UNKNOWN_TIME_FACT_CERTIFICATION',
      rejectedFactCategories: ['BODY_POSITIONS']
    };
  }

  return {
    outcome: 'CERTIFIED',
    policyId: REQUEST_RESULT_AUTHORITY_CERTIFICATION_POLICY_ID,
    requestAuthority: request.birth.ambiguityStatus,
    authorityBasis: 'NO_TIME_DEPENDENT_FACTS',
    omittedFactCategories: [
      'BODY_POSITIONS',
      'ANGLES',
      'HOUSES',
      'BODY_HOUSE_ASSIGNMENTS',
      'ASPECTS',
      'ANGLE_RELATIONS'
    ]
  };
}
