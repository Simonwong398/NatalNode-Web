export type BirthDatePart = 'day' | 'month' | 'year';

export interface BirthDateParts {
  day: string;
  month: string;
  year: string;
}

export const EMPTY_BIRTH_DATE_PARTS: BirthDateParts = {
  day: '',
  month: '',
  year: ''
};

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isValidYear(year: string): boolean {
  return /^\d{4}$/.test(year) && Number(year) >= 1 && Number(year) <= 9999;
}

export function sanitizeBirthDatePart(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

/** Composes only valid four-digit Gregorian dates; it never normalizes overflow. */
export function composeBirthDate(parts: BirthDateParts): string | null {
  if (!isValidYear(parts.year) || !/^\d{1,2}$/.test(parts.month) || !/^\d{1,2}$/.test(parts.day)) {
    return null;
  }

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return `${parts.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getBirthDateValidationError(parts: BirthDateParts): string | null {
  const hasAnyPart = Boolean(parts.day || parts.month || parts.year);

  if (!hasAnyPart) {
    return 'Enter a birth date.';
  }

  if (!parts.day || !parts.month || !parts.year) {
    return 'Enter a complete birth date.';
  }

  return composeBirthDate(parts) === null ? 'Enter a valid birth date.' : null;
}

export function toBirthDateParts(value: string): BirthDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const parts: BirthDateParts = {
    year: match[1],
    month: match[2],
    day: match[3]
  };

  return composeBirthDate(parts) === value ? parts : null;
}
