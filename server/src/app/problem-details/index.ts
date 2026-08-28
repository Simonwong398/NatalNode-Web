export const PROBLEM_DETAILS_TYPE = 'about:blank' as const;
export const PROBLEM_DETAILS_CONTENT_TYPE =
  'application/problem+json; charset=utf-8' as const;
export const PROBLEM_DETAIL_MAXIMUM_CHARACTERS = 256 as const;

export type ProblemStatus =
  | 400
  | 401
  | 403
  | 404
  | 413
  | 415
  | 429
  | 500
  | 503;

export type ProblemCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RECENT_AUTHENTICATION_REQUIRED'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'CALCULATION_UNAVAILABLE';

export type ProblemDetailKey =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_MAGIC_LINK'
  | 'ORIGIN_NOT_ALLOWED'
  | 'RECENT_AUTHENTICATION_REQUIRED'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'CALCULATION_UNAVAILABLE';

const PROBLEM_STATUS_BY_CODE_INTERNAL = {
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RECENT_AUTHENTICATION_REQUIRED: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  CALCULATION_UNAVAILABLE: 503
} as const satisfies Readonly<Record<ProblemCode, ProblemStatus>>;

export const PROBLEM_STATUS_BY_CODE = Object.freeze(
  PROBLEM_STATUS_BY_CODE_INTERNAL
);

const PROBLEM_TITLE_BY_STATUS_INTERNAL = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
} as const satisfies Readonly<Record<ProblemStatus, string>>;

export type ProblemTitle =
  (typeof PROBLEM_TITLE_BY_STATUS_INTERNAL)[ProblemStatus];

export const PROBLEM_TITLE_BY_STATUS = Object.freeze(
  PROBLEM_TITLE_BY_STATUS_INTERNAL
);

const PROBLEM_DETAIL_REGISTRY = {
  INVALID_REQUEST: 'The request is invalid.',
  AUTHENTICATION_REQUIRED: 'Authentication is required.',
  INVALID_MAGIC_LINK: 'The sign-in link is invalid or has expired.',
  ORIGIN_NOT_ALLOWED: 'Request origin is not allowed.',
  RECENT_AUTHENTICATION_REQUIRED: 'Recent authentication is required.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYLOAD_TOO_LARGE: 'The request is too large.',
  UNSUPPORTED_MEDIA_TYPE: 'The request media type is not supported.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  INTERNAL_ERROR: 'An unexpected server error occurred.',
  CALCULATION_UNAVAILABLE: 'Calculation is currently unavailable.'
} as const satisfies Readonly<Record<ProblemDetailKey, string>>;

export const PROBLEM_DETAIL_BY_KEY = Object.freeze(PROBLEM_DETAIL_REGISTRY);

const DETAIL_KEYS_BY_CODE = {
  INVALID_REQUEST: ['INVALID_REQUEST'],
  UNAUTHORIZED: ['AUTHENTICATION_REQUIRED', 'INVALID_MAGIC_LINK'],
  FORBIDDEN: ['ORIGIN_NOT_ALLOWED'],
  RECENT_AUTHENTICATION_REQUIRED: ['RECENT_AUTHENTICATION_REQUIRED'],
  NOT_FOUND: ['NOT_FOUND'],
  PAYLOAD_TOO_LARGE: ['PAYLOAD_TOO_LARGE'],
  UNSUPPORTED_MEDIA_TYPE: ['UNSUPPORTED_MEDIA_TYPE'],
  RATE_LIMITED: ['RATE_LIMITED'],
  INTERNAL_ERROR: ['INTERNAL_ERROR'],
  CALCULATION_UNAVAILABLE: ['CALCULATION_UNAVAILABLE']
} as const satisfies Readonly<Record<ProblemCode, readonly ProblemDetailKey[]>>;

type ProblemDetailKeyForCode<Code extends ProblemCode> =
  (typeof DETAIL_KEYS_BY_CODE)[Code][number];

export type CreateProblemDetailsInput = {
  [Code in ProblemCode]: {
    readonly code: Code;
    readonly detailKey?: ProblemDetailKeyForCode<Code>;
  };
}[ProblemCode];

export interface ProblemDetails {
  readonly type: typeof PROBLEM_DETAILS_TYPE;
  readonly title: ProblemTitle;
  readonly status: ProblemStatus;
  readonly code: ProblemCode;
  readonly detail?: string;
}

function detailCharacterLength(value: string): number {
  return Array.from(value).length;
}

function assertDetailRegistryIsSafe(
  registry: Readonly<Record<ProblemDetailKey, string>>
): void {
  for (const detail of Object.values(registry)) {
    if (detailCharacterLength(detail) > PROBLEM_DETAIL_MAXIMUM_CHARACTERS) {
      throw new Error('Problem detail registry is invalid.');
    }
  }
}

assertDetailRegistryIsSafe(PROBLEM_DETAIL_BY_KEY);

function isRegisteredDetailKey(value: string): value is ProblemDetailKey {
  return Object.prototype.hasOwnProperty.call(PROBLEM_DETAIL_BY_KEY, value);
}

function isProblemCode(value: unknown): value is ProblemCode {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(PROBLEM_STATUS_BY_CODE, value)
  );
}

function isAllowedDetailKey(
  code: ProblemCode,
  detailKey: string
): boolean {
  return (DETAIL_KEYS_BY_CODE[code] as readonly string[]).includes(detailKey);
}

function resolveDetail(
  code: ProblemCode,
  detailKey: unknown
): string | undefined {
  if (detailKey === undefined) {
    return undefined;
  }

  if (
    typeof detailKey !== 'string' ||
    !isRegisteredDetailKey(detailKey) ||
    !isAllowedDetailKey(code, detailKey)
  ) {
    throw new TypeError('Problem detail key is not allowed.');
  }

  const detail = PROBLEM_DETAIL_BY_KEY[detailKey];

  if (detailCharacterLength(detail) > PROBLEM_DETAIL_MAXIMUM_CHARACTERS) {
    throw new Error('Problem detail registry is invalid.');
  }

  return detail;
}

export function createProblemDetails(
  input: CreateProblemDetailsInput
): ProblemDetails {
  const inputValue: unknown = input;
  const inputRecord =
    typeof inputValue === 'object' && inputValue !== null
      ? (inputValue as { readonly code?: unknown; readonly detailKey?: unknown })
      : undefined;
  const code = inputRecord?.code;

  if (!isProblemCode(code)) {
    throw new TypeError('Problem code is not allowed.');
  }

  const status = PROBLEM_STATUS_BY_CODE[code];
  const detail = resolveDetail(code, inputRecord?.detailKey);
  const base: ProblemDetails = {
    type: PROBLEM_DETAILS_TYPE,
    title: PROBLEM_TITLE_BY_STATUS[status],
    status,
    code
  };

  return detail === undefined
    ? Object.freeze(base)
    : Object.freeze({ ...base, detail });
}

export function createProblemDetailsResponse(
  input: CreateProblemDetailsInput
): Response {
  const problem = createProblemDetails(input);

  return new Response(JSON.stringify(problem), {
    status: problem.status,
    headers: {
      'Content-Type': PROBLEM_DETAILS_CONTENT_TYPE
    }
  });
}

export function normalizeUnknownProblem(_error: unknown): ProblemDetails {
  return createProblemDetails({ code: 'INTERNAL_ERROR' });
}
