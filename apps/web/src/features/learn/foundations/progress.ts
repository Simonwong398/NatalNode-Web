import {
  FOUNDATIONS_COURSE_ID,
  FOUNDATIONS_COURSE_VERSION,
  FOUNDATIONS_LESSONS,
  getFoundationsLessonById,
  type FoundationsLessonId
} from './registry.js';

export const FOUNDATIONS_PROGRESS_STORAGE_KEY = 'natalnode.learn.foundations.progress.v1';
export const FOUNDATIONS_PROGRESS_SCHEMA_VERSION = 1 as const;

export type FoundationsProgressState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface FoundationsProgress {
  readonly schemaVersion: typeof FOUNDATIONS_PROGRESS_SCHEMA_VERSION;
  readonly courseId: typeof FOUNDATIONS_COURSE_ID;
  readonly courseVersion: typeof FOUNDATIONS_COURSE_VERSION;
  readonly lessons: Readonly<Record<FoundationsLessonId, FoundationsProgressState>>;
}

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

function createLessonStateMap(
  states: Partial<Record<FoundationsLessonId, FoundationsProgressState>> = {}
): Readonly<Record<FoundationsLessonId, FoundationsProgressState>> {
  const lessonStates = {} as Record<FoundationsLessonId, FoundationsProgressState>;

  for (const lesson of FOUNDATIONS_LESSONS) {
    lessonStates[lesson.lessonId] = states[lesson.lessonId] ?? 'NOT_STARTED';
  }

  return Object.freeze(lessonStates);
}

function createProgress(
  states: Partial<Record<FoundationsLessonId, FoundationsProgressState>> = {}
): FoundationsProgress {
  return Object.freeze({
    schemaVersion: FOUNDATIONS_PROGRESS_SCHEMA_VERSION,
    courseId: FOUNDATIONS_COURSE_ID,
    courseVersion: FOUNDATIONS_COURSE_VERSION,
    lessons: createLessonStateMap(states)
  });
}

export function createInitialFoundationsProgress(): FoundationsProgress {
  return createProgress();
}

function isProgressState(value: unknown): value is FoundationsProgressState {
  return value === 'NOT_STARTED' || value === 'IN_PROGRESS' || value === 'COMPLETED';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parses only the versioned, semantic-ID-only anonymous progress shape. */
export function parseFoundationsProgress(raw: string | null | undefined): FoundationsProgress {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return createInitialFoundationsProgress();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) ||
      parsed.schemaVersion !== FOUNDATIONS_PROGRESS_SCHEMA_VERSION ||
      parsed.courseId !== FOUNDATIONS_COURSE_ID ||
      parsed.courseVersion !== FOUNDATIONS_COURSE_VERSION ||
      !isRecord(parsed.lessons)) {
      return createInitialFoundationsProgress();
    }

    const states: Partial<Record<FoundationsLessonId, FoundationsProgressState>> = {};

    for (const lesson of FOUNDATIONS_LESSONS) {
      const value = parsed.lessons[lesson.lessonId];
      states[lesson.lessonId] = isProgressState(value) ? value : 'NOT_STARTED';
    }

    return createProgress(states);
  } catch {
    return createInitialFoundationsProgress();
  }
}

/** Serializes only the stable course/version/lesson progress contract. */
export function serializeFoundationsProgress(progress: FoundationsProgress): string {
  const normalized = createProgress(progress.lessons);

  return JSON.stringify({
    schemaVersion: normalized.schemaVersion,
    courseId: normalized.courseId,
    courseVersion: normalized.courseVersion,
    lessons: normalized.lessons
  });
}

function getBrowserStorage(): ProgressStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readFoundationsProgress(storage: ProgressStorage | null = getBrowserStorage()): FoundationsProgress {
  if (storage === null) {
    return createInitialFoundationsProgress();
  }

  try {
    return parseFoundationsProgress(storage.getItem(FOUNDATIONS_PROGRESS_STORAGE_KEY));
  } catch {
    return createInitialFoundationsProgress();
  }
}

export function writeFoundationsProgress(
  progress: FoundationsProgress,
  storage: ProgressStorage | null = getBrowserStorage()
): boolean {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(
      FOUNDATIONS_PROGRESS_STORAGE_KEY,
      serializeFoundationsProgress(progress)
    );
    return true;
  } catch {
    return false;
  }
}

function withLessonState(
  progress: FoundationsProgress,
  lessonId: unknown,
  state: FoundationsProgressState
): FoundationsProgress {
  const lesson = getFoundationsLessonById(lessonId);

  if (lesson === null || progress.lessons[lesson.lessonId] === state) {
    return progress;
  }

  return createProgress({ ...progress.lessons, [lesson.lessonId]: state });
}

/** Opening a lesson can only move an untouched lesson into the in-progress state. */
export function markFoundationsLessonInProgress(
  progress: FoundationsProgress,
  lessonId: unknown
): FoundationsProgress {
  const lesson = getFoundationsLessonById(lessonId);

  return lesson === null || progress.lessons[lesson.lessonId] !== 'NOT_STARTED'
    ? progress
    : withLessonState(progress, lesson.lessonId, 'IN_PROGRESS');
}

/** Completion is available only through this explicit caller-controlled transition. */
export function markFoundationsLessonComplete(
  progress: FoundationsProgress,
  lessonId: unknown
): FoundationsProgress {
  return withLessonState(progress, lessonId, 'COMPLETED');
}

/** Before any future reward claim, an explicit revisit can reopen a completed lesson. */
export function markFoundationsLessonIncomplete(
  progress: FoundationsProgress,
  lessonId: unknown
): FoundationsProgress {
  const lesson = getFoundationsLessonById(lessonId);

  return lesson === null || progress.lessons[lesson.lessonId] !== 'COMPLETED'
    ? progress
    : withLessonState(progress, lesson.lessonId, 'IN_PROGRESS');
}

export function getFoundationsLessonProgressState(
  progress: FoundationsProgress,
  lessonId: unknown
): FoundationsProgressState {
  const lesson = getFoundationsLessonById(lessonId);

  return lesson === null ? 'NOT_STARTED' : progress.lessons[lesson.lessonId];
}

export function getFoundationsCompletedLessonCount(progress: FoundationsProgress): number {
  return FOUNDATIONS_LESSONS.reduce(
    (count, lesson) => count + (progress.lessons[lesson.lessonId] === 'COMPLETED' ? 1 : 0),
    0
  );
}

/** Returns the first in-progress lesson, then the first untouched lesson, by frozen order. */
export function getFoundationsResumeLessonId(
  progress: FoundationsProgress
): FoundationsLessonId | null {
  const inProgress = FOUNDATIONS_LESSONS.find(
    (lesson) => progress.lessons[lesson.lessonId] === 'IN_PROGRESS'
  );

  if (inProgress !== undefined) {
    return inProgress.lessonId;
  }

  const notStarted = FOUNDATIONS_LESSONS.find(
    (lesson) => progress.lessons[lesson.lessonId] === 'NOT_STARTED'
  );

  return notStarted?.lessonId ?? null;
}
