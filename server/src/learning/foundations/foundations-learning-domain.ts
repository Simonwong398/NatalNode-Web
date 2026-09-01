import {
  assertCommercialIdentifier,
  assertCommercialRevision
} from '../../commercial-persistence/commercial-domain.js';

/** Server-side authority for the admitted Foundations course version. */
export const FOUNDATIONS_COURSE_ID = 'foundations.v1' as const;
export const FOUNDATIONS_COURSE_VERSION = 'v1' as const;
export const FOUNDATIONS_LESSON_IDS = Object.freeze([
  'foundations.natal_chart',
  'foundations.zodiac_structure',
  'foundations.chart_calculation',
  'foundations.sun_moon',
  'foundations.mercury_venus_mars',
  'foundations.jupiter_saturn_outer_planets',
  'foundations.houses_angles',
  'foundations.planet_sign_house',
  'foundations.aspects',
  'foundations.chart_priorities',
  'foundations.whole_chart',
  'foundations.responsible_astrology'
] as const);
export type FoundationsLessonId = (typeof FOUNDATIONS_LESSON_IDS)[number];

export const FOUNDATIONS_FINAL_ASSESSMENT_ID =
  'foundations.v1.final_check' as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_REVISION = 1 as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT = 10 as const;
export const FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD = 8 as const;
export const FOUNDATIONS_REWARD_SOURCE = 'LEARNING_FOUNDATIONS_V1' as const;
export const FOUNDATIONS_REWARD_DURATION_US = '604800000000' as const;
export const FOUNDATIONS_REWARD_DURATION_HOURS = 168 as const;

const FOUNDATIONS_ANSWER_KEY = Object.freeze({
  'foundations.final_check.q01.chart_fact_interpretation': 'C',
  'foundations.final_check.q02.sign_constellation_distinction': 'B',
  'foundations.final_check.q03.unknown_birth_time': 'A',
  'foundations.final_check.q04.local_time_and_timezone': 'D',
  'foundations.final_check.q05.planet_sign_house_synthesis': 'B',
  'foundations.final_check.q06.major_aspect_geometry': 'C',
  'foundations.final_check.q07.houses_angles_cusps': 'A',
  'foundations.final_check.q08.prioritization_and_synthesis': 'D',
  'foundations.final_check.q09.precision_is_not_validation': 'C',
  'foundations.final_check.q10.responsible_use': 'B'
} as const);

type FoundationsAnswerId = 'A' | 'B' | 'C' | 'D';

export interface FoundationsAssessmentAnswerInput {
  readonly questionId: string;
  readonly answerId: string;
}

export interface FoundationsAssessmentScore {
  readonly score: number;
  readonly correctCount: number;
  readonly passed: boolean;
}

export class FoundationsLearningValidationError extends Error {
  public constructor(message = 'Foundations learning input is invalid.') {
    super(message);
    this.name = 'FoundationsLearningValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnswerId(value: unknown): value is FoundationsAnswerId {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

function invalid(message: string): never {
  throw new FoundationsLearningValidationError(message);
}

export function isFoundationsLessonId(value: unknown): value is FoundationsLessonId {
  return (
    typeof value === 'string' &&
    (FOUNDATIONS_LESSON_IDS as readonly string[]).includes(value)
  );
}

export function assertFoundationsLessonId(value: unknown): FoundationsLessonId {
  if (!isFoundationsLessonId(value)) {
    return invalid('Foundations lesson is invalid.');
  }
  return value;
}

export function normalizeFoundationsCompletedLessonIds(
  values: readonly unknown[]
): readonly FoundationsLessonId[] {
  if (!Array.isArray(values) || values.length > FOUNDATIONS_LESSON_IDS.length * 4) {
    return invalid('Foundations completion list is invalid.');
  }

  const normalized = new Set<FoundationsLessonId>();
  for (const value of values) {
    // Local browser state is explicitly best-effort. Unknown/future IDs and
    // malformed entries are ignored rather than becoming server authority.
    if (isFoundationsLessonId(value)) {
      normalized.add(value);
    }
  }

  return Object.freeze(
    FOUNDATIONS_LESSON_IDS.filter((lessonId) => normalized.has(lessonId))
  );
}

export function scoreFoundationsAssessmentAnswers(
  values: readonly FoundationsAssessmentAnswerInput[]
): FoundationsAssessmentScore {
  if (!Array.isArray(values) || values.length !== FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT) {
    return invalid('Foundations assessment must contain the exact question set.');
  }

  const answers = new Map<string, FoundationsAnswerId>();
  for (const value of values) {
    if (
      !isRecord(value) ||
      typeof value.questionId !== 'string' ||
      typeof value.answerId !== 'string' ||
      !isAnswerId(value.answerId) ||
      Object.keys(value).length !== 2
    ) {
      return invalid('Foundations assessment answer is invalid.');
    }

    if (!Object.prototype.hasOwnProperty.call(FOUNDATIONS_ANSWER_KEY, value.questionId)) {
      return invalid('Foundations assessment question is invalid.');
    }
    if (answers.has(value.questionId)) {
      return invalid('Foundations assessment question is duplicated.');
    }
    answers.set(value.questionId, value.answerId);
  }

  const questionIds = Object.keys(FOUNDATIONS_ANSWER_KEY);
  if (answers.size !== questionIds.length || questionIds.some((id) => !answers.has(id))) {
    return invalid('Foundations assessment question set is incomplete.');
  }

  let correctCount = 0;
  for (const questionId of questionIds) {
    if (answers.get(questionId) === FOUNDATIONS_ANSWER_KEY[questionId as keyof typeof FOUNDATIONS_ANSWER_KEY]) {
      correctCount += 1;
    }
  }

  return Object.freeze({
    score: correctCount,
    correctCount,
    passed: correctCount >= FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD
  });
}

export function assertFoundationsRevision(value: unknown): 1 {
  if (value !== FOUNDATIONS_FINAL_ASSESSMENT_REVISION) {
    return invalid('Foundations assessment revision is unsupported.');
  }
  return FOUNDATIONS_FINAL_ASSESSMENT_REVISION;
}

export function assertFoundationsUserId(value: unknown): string {
  return assertCommercialIdentifier(value, 'userId');
}

export function assertFoundationsServerRevision(value: unknown): string {
  return assertCommercialRevision(value);
}
