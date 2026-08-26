import type { CreateChartNoteApiRequest } from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

export const CHART_NOTE_MAXIMUM_CHARACTERS = 5_000;

const DISALLOWED_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function containsOnlyUnicodeScalarValues(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);

      if (
        index + 1 >= value.length ||
        nextCodeUnit < 0xdc00 ||
        nextCodeUnit > 0xdfff
      ) {
        return false;
      }

      index += 1;
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

export function normalizeChartNoteContent(content: string): string {
  return content.replace(/\r\n?/gu, '\n').trim();
}

export function isValidChartNoteContent(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedContent = normalizeChartNoteContent(value);

  return (
    normalizedContent.length > 0 &&
    Array.from(normalizedContent).length <= CHART_NOTE_MAXIMUM_CHARACTERS &&
    !DISALLOWED_CONTROL_CHARACTER_PATTERN.test(normalizedContent) &&
    containsOnlyUnicodeScalarValues(normalizedContent)
  );
}

export function isChartNoteContentRequest(
  value: unknown
): value is CreateChartNoteApiRequest {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    hasOwn(value, 'content') &&
    isValidChartNoteContent(value.content)
  );
}
