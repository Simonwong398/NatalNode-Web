import type {
  FoundationsAssessmentAttemptApiRequest,
  FoundationsCompleteLessonApiRequest,
  FoundationsMergeProgressApiRequest
} from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

export const FOUNDATIONS_LEARNING_REQUEST_MAXIMUM_BYTES = 16 * 1_024;

export type BoundedFoundationsLearningJsonResult =
  | { readonly outcome: 'parsed'; readonly value: unknown }
  | { readonly outcome: 'unsupported-media-type' }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

function isApplicationJson(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  if (contentType === null) {
    return false;
  }
  const [mediaType] = contentType.split(';', 1);
  return mediaType?.trim().toLowerCase() === 'application/json';
}

function hasOversizedDeclaredLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength === null || !/^\d+$/u.test(contentLength)) {
    return false;
  }
  const byteLength = Number(contentLength);
  return (
    Number.isSafeInteger(byteLength) &&
    byteLength > FOUNDATIONS_LEARNING_REQUEST_MAXIMUM_BYTES
  );
}

export async function readBoundedFoundationsLearningJson(
  request: Request
): Promise<BoundedFoundationsLearningJsonResult> {
  if (!isApplicationJson(request)) {
    return { outcome: 'unsupported-media-type' };
  }
  if (hasOversizedDeclaredLength(request) || request.body === null) {
    return hasOversizedDeclaredLength(request)
      ? { outcome: 'too-large' }
      : { outcome: 'invalid' };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      byteLength += chunk.value.byteLength;
      if (byteLength > FOUNDATIONS_LEARNING_REQUEST_MAXIMUM_BYTES) {
        try {
          await reader.cancel();
        } catch (_error) {
          // The bounded response remains authoritative if cancellation fails.
        }
        return { outcome: 'too-large' };
      }
      chunks.push(chunk.value);
    }
  } catch (_error) {
    return { outcome: 'invalid' };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { outcome: 'parsed', value: JSON.parse(text) as unknown };
  } catch (_error) {
    return { outcome: 'invalid' };
  }
}

function hasExactlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

export function isFoundationsCompleteLessonApiRequest(
  value: unknown
): value is FoundationsCompleteLessonApiRequest {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['courseId', 'lessonId']) &&
    value.courseId === 'foundations.v1' &&
    typeof value.lessonId === 'string'
  );
}

export function isFoundationsMergeProgressApiRequest(
  value: unknown
): value is FoundationsMergeProgressApiRequest {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['courseId', 'completedLessonIds']) &&
    value.courseId === 'foundations.v1' &&
    Array.isArray(value.completedLessonIds) &&
    value.completedLessonIds.length <= 48
  );
}

export function isFoundationsAssessmentAttemptApiRequest(
  value: unknown
): value is FoundationsAssessmentAttemptApiRequest {
  if (
    !isRecord(value) ||
    !hasExactlyKeys(value, [
      'courseId',
      'assessmentId',
      'assessmentRevision',
      'answers'
    ]) ||
    value.courseId !== 'foundations.v1' ||
    value.assessmentId !== 'foundations.v1.final_check' ||
    value.assessmentRevision !== 1 ||
    !Array.isArray(value.answers) ||
    value.answers.length !== 10
  ) {
    return false;
  }

  return value.answers.every((answer) => {
    return (
      isRecord(answer) &&
      hasExactlyKeys(answer, ['questionId', 'answerId']) &&
      typeof answer.questionId === 'string' &&
      typeof answer.answerId === 'string'
    );
  });
}
