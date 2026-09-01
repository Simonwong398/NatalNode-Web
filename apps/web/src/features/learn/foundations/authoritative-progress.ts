import type {
  FoundationsAssessmentAnswerSubmission,
  FoundationsAssessmentAttemptApiResponse,
  FoundationsAssessmentAttemptApiRequest,
  FoundationsCompleteLessonApiRequest,
  FoundationsProgressApiResponse
} from '@natalnode/contracts';
import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_COURSE_VERSION,
  FOUNDATIONS_LESSONS
} from './registry.js';
import {
  FOUNDATIONS_FINAL_ASSESSMENT_ID,
  FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION,
  FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD,
  FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT
} from './assessment/assessment-contract.js';
import {
  markFoundationsLessonComplete,
  readFoundationsProgress,
  writeFoundationsProgress,
  type FoundationsProgress
} from './progress.js';

const SESSION_ENDPOINT = '/api/auth/session';
const COMPLETE_LESSON_ENDPOINT = '/api/learn/foundations/progress/complete';
const MERGE_PROGRESS_ENDPOINT = '/api/learn/foundations/progress/merge';
const ASSESSMENT_ATTEMPT_ENDPOINT =
  '/api/learn/foundations/assessment/attempts';

export type FoundationsAuthoritySyncStatus =
  | 'anonymous'
  | 'authenticated'
  | 'unavailable';

export interface FoundationsProgressSyncResult {
  readonly status: FoundationsAuthoritySyncStatus;
  readonly localProgress: FoundationsProgress;
  readonly authoritativeProgress: FoundationsProgressApiResponse | null;
}

class FoundationsAuthorityRequestError extends Error {
  public constructor() {
    super('Foundations authoritative request failed.');
    this.name = 'FoundationsAuthorityRequestError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRewardState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (value.status === 'NOT_ELIGIBLE') {
    return (
      value.source === null &&
      value.durationHours === null &&
      value.grantedAt === null &&
      value.startsAt === null &&
      value.expiresAt === null
    );
  }

  return (
    value.status === 'GRANTED' &&
    value.source === 'LEARNING_FOUNDATIONS_V1' &&
    value.durationHours === 168 &&
    typeof value.grantedAt === 'string' &&
    typeof value.startsAt === 'string' &&
    typeof value.expiresAt === 'string'
  );
}

function isFoundationsProgressResponse(
  value: unknown
): value is FoundationsProgressApiResponse {
  return (
    isRecord(value) &&
    value.authoritative === true &&
    value.courseId === FOUNDATIONS_COURSE_ID &&
    value.courseVersion === FOUNDATIONS_COURSE_VERSION &&
    value.lessonCount === FOUNDATIONS_LESSONS.length &&
    Array.isArray(value.completedLessonIds) &&
    value.completedLessonIds.length <= FOUNDATIONS_LESSONS.length &&
    new Set(value.completedLessonIds).size === value.completedLessonIds.length &&
    value.completedLessonIds.every((lessonId) =>
      FOUNDATIONS_LESSONS.some((lesson) => lesson.lessonId === lessonId)
    ) &&
    typeof value.completedLessonCount === 'number' &&
    Number.isInteger(value.completedLessonCount) &&
    value.completedLessonCount >= 0 &&
    value.completedLessonCount <= value.lessonCount &&
    value.completedLessonCount === value.completedLessonIds.length &&
    typeof value.courseCompleted === 'boolean' &&
    value.courseCompleted ===
      (value.completedLessonCount === value.lessonCount) &&
    typeof value.passEver === 'boolean' &&
    isRewardState(value.reward)
  );
}

function isFoundationsAttemptResponse(
  value: unknown
): value is FoundationsAssessmentAttemptApiResponse {
  return (
    isRecord(value) &&
    typeof value.attemptId === 'string' &&
    value.attemptId.length > 0 &&
    value.courseId === FOUNDATIONS_COURSE_ID &&
    value.assessmentId === FOUNDATIONS_FINAL_ASSESSMENT_ID &&
    value.assessmentRevision === FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION &&
    typeof value.score === 'number' &&
    Number.isInteger(value.score) &&
    value.score >= 0 &&
    value.score <= FOUNDATIONS_FINAL_ASSESSMENT_QUESTION_COUNT &&
    value.correctCount === value.score &&
    typeof value.passed === 'boolean' &&
    value.passed === value.score >= FOUNDATIONS_FINAL_ASSESSMENT_PASS_THRESHOLD &&
    typeof value.passEver === 'boolean' &&
    (value.passEver || !value.passed) &&
    isRewardState(value.reward)
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new FoundationsAuthorityRequestError();
  }
}

async function currentSessionStatus(): Promise<
  'anonymous' | 'authenticated' | 'unavailable'
> {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) {
      return 'unavailable';
    }
    const payload = await readJson(response);
    return isRecord(payload) && payload.authenticated === true
      ? 'authenticated'
      : isRecord(payload) && payload.authenticated === false
        ? 'anonymous'
        : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

function completedLessonIds(progress: FoundationsProgress): readonly string[] {
  return FOUNDATIONS_LESSONS.filter(
    (lesson) => progress.lessons[lesson.lessonId] === 'COMPLETED'
  ).map((lesson) => lesson.lessonId);
}

/** Applies a successful server union response without discarding local in-progress state. */
export function applyAuthoritativeFoundationsProgress(
  current: FoundationsProgress,
  authoritative: FoundationsProgressApiResponse
): FoundationsProgress {
  let next = current;
  for (const lessonId of authoritative.completedLessonIds) {
    next = markFoundationsLessonComplete(next, lessonId);
  }
  return next;
}

async function requestProgressMerge(
  progress: FoundationsProgress
): Promise<FoundationsProgressApiResponse> {
  const response = await fetch(MERGE_PROGRESS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({
      courseId: FOUNDATIONS_COURSE_ID,
      completedLessonIds: completedLessonIds(progress)
    })
  });
  if (!response.ok) {
    throw new FoundationsAuthorityRequestError();
  }
  const payload = await readJson(response);
  if (!isFoundationsProgressResponse(payload)) {
    throw new FoundationsAuthorityRequestError();
  }
  return payload;
}

/** Resolves auth, then performs the monotonic local-to-server SET UNION merge. */
export async function syncFoundationsProgress(): Promise<FoundationsProgressSyncResult> {
  const localProgress = readFoundationsProgress();
  const status = await currentSessionStatus();
  if (status !== 'authenticated') {
    return Object.freeze({
      status,
      localProgress,
      authoritativeProgress: null
    });
  }

  try {
    const authoritativeProgress = await requestProgressMerge(localProgress);
    const mergedLocalProgress = applyAuthoritativeFoundationsProgress(
      localProgress,
      authoritativeProgress
    );
    // The browser copy is updated only after the server confirms the union.
    writeFoundationsProgress(mergedLocalProgress);
    return Object.freeze({
      status: 'authenticated' as const,
      localProgress: mergedLocalProgress,
      authoritativeProgress
    });
  } catch {
    return Object.freeze({
      status: 'unavailable' as const,
      localProgress,
      authoritativeProgress: null
    });
  }
}

export async function completeFoundationsLesson(
  lessonId: string
): Promise<FoundationsProgressApiResponse> {
  const request: FoundationsCompleteLessonApiRequest = {
    courseId: FOUNDATIONS_COURSE_ID,
    lessonId
  };
  const response = await fetch(COMPLETE_LESSON_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new FoundationsAuthorityRequestError();
  }
  const payload = await readJson(response);
  if (!isFoundationsProgressResponse(payload)) {
    throw new FoundationsAuthorityRequestError();
  }
  const local = readFoundationsProgress();
  writeFoundationsProgress(applyAuthoritativeFoundationsProgress(local, payload));
  return payload;
}

export async function submitFoundationsAssessment(
  answers: readonly FoundationsAssessmentAnswerSubmission[]
): Promise<FoundationsAssessmentAttemptApiResponse> {
  const request: FoundationsAssessmentAttemptApiRequest = {
    courseId: FOUNDATIONS_COURSE_ID,
    assessmentId: FOUNDATIONS_FINAL_ASSESSMENT_ID,
    assessmentRevision: FOUNDATIONS_FINAL_ASSESSMENT_CONTENT_REVISION,
    answers
  };
  const response = await fetch(ASSESSMENT_ATTEMPT_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new FoundationsAuthorityRequestError();
  }
  const payload = await readJson(response);
  if (!isFoundationsAttemptResponse(payload)) {
    throw new FoundationsAuthorityRequestError();
  }
  return payload;
}

export async function getFoundationsAuthorityStatus(): Promise<
  'anonymous' | 'authenticated' | 'unavailable'
> {
  return currentSessionStatus();
}
