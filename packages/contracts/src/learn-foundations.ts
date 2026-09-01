/** Stable identity of the admitted Foundations course. */
export const FOUNDATIONS_COURSE_ID = 'foundations.v1' as const;
export const FOUNDATIONS_COURSE_VERSION = 'v1' as const;
export const FOUNDATIONS_LESSON_COUNT = 12 as const;

/** The twelve semantic lesson IDs admitted by Foundations Core. */
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

export type FoundationsAssessmentAnswerId = 'A' | 'B' | 'C' | 'D';

/** Canonical answer authority. Localized assessment text is presentation only. */
export const FOUNDATIONS_FINAL_ASSESSMENT_ANSWER_KEY = Object.freeze([
  Object.freeze({
    questionId: 'foundations.final_check.q01.chart_fact_interpretation',
    correctAnswerId: 'C' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q02.sign_constellation_distinction',
    correctAnswerId: 'B' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q03.unknown_birth_time',
    correctAnswerId: 'A' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q04.local_time_and_timezone',
    correctAnswerId: 'D' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q05.planet_sign_house_synthesis',
    correctAnswerId: 'B' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q06.major_aspect_geometry',
    correctAnswerId: 'C' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q07.houses_angles_cusps',
    correctAnswerId: 'A' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q08.prioritization_and_synthesis',
    correctAnswerId: 'D' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q09.precision_is_not_validation',
    correctAnswerId: 'C' as const
  }),
  Object.freeze({
    questionId: 'foundations.final_check.q10.responsible_use',
    correctAnswerId: 'B' as const
  })
] as const);

export const FOUNDATIONS_REWARD_SOURCE = 'LEARNING_FOUNDATIONS_V1' as const;
export const FOUNDATIONS_REWARD_DURATION_DAYS = 7 as const;
export const FOUNDATIONS_REWARD_DURATION_HOURS = 168 as const;
export const FOUNDATIONS_REWARD_DURATION_US = '604800000000' as const;

export type FoundationsRewardStatus = 'NOT_ELIGIBLE' | 'GRANTED';

export interface FoundationsRewardApiState {
  readonly status: FoundationsRewardStatus;
  readonly source: typeof FOUNDATIONS_REWARD_SOURCE | null;
  readonly durationHours: typeof FOUNDATIONS_REWARD_DURATION_HOURS | null;
  readonly grantedAt: string | null;
  readonly startsAt: string | null;
  readonly expiresAt: string | null;
}

export interface FoundationsCompleteLessonApiRequest {
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly lessonId: string;
}

export interface FoundationsMergeProgressApiRequest {
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly completedLessonIds: readonly string[];
}

export interface FoundationsProgressApiResponse {
  readonly authoritative: true;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly courseVersion: typeof FOUNDATIONS_COURSE_VERSION;
  readonly lessonCount: typeof FOUNDATIONS_LESSON_COUNT;
  readonly completedLessonIds: readonly FoundationsLessonId[];
  readonly completedLessonCount: number;
  readonly courseCompleted: boolean;
  readonly passEver: boolean;
  readonly reward: FoundationsRewardApiState;
}

export interface FoundationsAssessmentAnswerSubmission {
  readonly questionId: string;
  readonly answerId: FoundationsAssessmentAnswerId;
}

export interface FoundationsAssessmentAttemptApiRequest {
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly assessmentId: typeof FOUNDATIONS_FINAL_ASSESSMENT_ID;
  readonly assessmentRevision: typeof FOUNDATIONS_FINAL_ASSESSMENT_REVISION;
  readonly answers: readonly FoundationsAssessmentAnswerSubmission[];
}

export interface FoundationsAssessmentAttemptApiResponse {
  readonly attemptId: string;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly assessmentId: typeof FOUNDATIONS_FINAL_ASSESSMENT_ID;
  readonly assessmentRevision: typeof FOUNDATIONS_FINAL_ASSESSMENT_REVISION;
  readonly score: number;
  readonly correctCount: number;
  readonly passed: boolean;
  readonly passEver: boolean;
  readonly reward: FoundationsRewardApiState;
}
