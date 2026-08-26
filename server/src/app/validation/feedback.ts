import type {
  CreateFeedbackApiRequest,
  FeedbackCategory
} from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

export const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = [
  'BUG',
  'SUGGESTION',
  'CALCULATION_CONCERN',
  'OTHER'
];

export const FEEDBACK_MESSAGE_MINIMUM_CHARACTERS = 10;
export const FEEDBACK_MESSAGE_MAXIMUM_CHARACTERS = 5_000;

const CREATE_FEEDBACK_KEYS = ['category', 'message'] as const;
const DISALLOWED_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyRequiredKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);

  return (
    keys.length === CREATE_FEEDBACK_KEYS.length &&
    CREATE_FEEDBACK_KEYS.every((key) => hasOwn(value, key))
  );
}

function containsOnlyUnicodeScalarValues(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF) {
      const nextCodeUnit = value.charCodeAt(index + 1);

      if (
        index + 1 >= value.length ||
        nextCodeUnit < 0xDC00 ||
        nextCodeUnit > 0xDFFF
      ) {
        return false;
      }

      index += 1;
      continue;
    }

    if (codeUnit >= 0xDC00 && codeUnit <= 0xDFFF) {
      return false;
    }
  }

  return true;
}

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return FEEDBACK_CATEGORIES.some((category) => category === value);
}

export function normalizeFeedbackMessage(message: string): string {
  return message.replace(/\r\n?/gu, '\n').trim();
}

export function normalizeCreateFeedbackApiRequest(
  value: unknown
): CreateFeedbackApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyRequiredKeys(value) ||
    !isFeedbackCategory(value.category) ||
    typeof value.message !== 'string'
  ) {
    return null;
  }

  const message = normalizeFeedbackMessage(value.message);
  const characterCount = Array.from(message).length;

  if (
    characterCount < FEEDBACK_MESSAGE_MINIMUM_CHARACTERS ||
    characterCount > FEEDBACK_MESSAGE_MAXIMUM_CHARACTERS ||
    DISALLOWED_CONTROL_CHARACTER_PATTERN.test(message) ||
    !containsOnlyUnicodeScalarValues(message)
  ) {
    return null;
  }

  return {
    category: value.category,
    message
  };
}
