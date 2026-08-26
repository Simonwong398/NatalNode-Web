import type { VaultChartCategory } from '@natalnode/contracts';

export const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

export const DISPLAY_NAME_MAXIMUM_CHARACTERS = 120;
export const CHART_NOTE_MAXIMUM_CHARACTERS = 5_000;

export function normalizeDisplayName(value: string): string {
  return value.trim();
}

export function normalizeNoteContent(value: string): string {
  return value.replace(/\r\n?/gu, '\n').trim();
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

const DISALLOWED_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u;

export function validateDisplayName(value: string): string | null {
  const normalizedValue = normalizeDisplayName(value);

  if (normalizedValue.length === 0) {
    return 'Enter a chart name.';
  }

  if (Array.from(normalizedValue).length > DISPLAY_NAME_MAXIMUM_CHARACTERS) {
    return `Use ${DISPLAY_NAME_MAXIMUM_CHARACTERS} characters or fewer.`;
  }

  return null;
}

export function validateNoteContent(value: string): string | null {
  const normalizedValue = normalizeNoteContent(value);

  if (normalizedValue.length === 0) {
    return 'Enter a note.';
  }

  if (Array.from(normalizedValue).length > CHART_NOTE_MAXIMUM_CHARACTERS) {
    return `Use ${CHART_NOTE_MAXIMUM_CHARACTERS.toLocaleString()} characters or fewer.`;
  }

  if (
    DISALLOWED_CONTROL_CHARACTER_PATTERN.test(normalizedValue) ||
    !containsOnlyUnicodeScalarValues(normalizedValue)
  ) {
    return 'Remove unsupported control characters from the note.';
  }

  return null;
}
