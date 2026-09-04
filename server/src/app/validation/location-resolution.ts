import {
  LOCATION_SUPPORTED_LOCALES,
  type LocationLocale,
  type LocationResolveApiRequest,
  type LocationSearchApiRequest
} from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

export const LOCATION_QUERY_MAXIMUM_CHARACTERS = 160;
export const LOCATION_CANDIDATE_ID_MAXIMUM_CHARACTERS = 256;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

function isBoundedString(value: unknown, maximumCharacters: number): value is string {
  return (
    typeof value === 'string' &&
    Array.from(value).length <= maximumCharacters &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isLocationLocale(value: unknown): value is LocationLocale {
  return LOCATION_SUPPORTED_LOCALES.some((locale) => locale === value);
}

export function isLocationSearchApiRequest(
  value: unknown
): value is LocationSearchApiRequest {
  return (
    isRecord(value) &&
    isBoundedString(value.query, LOCATION_QUERY_MAXIMUM_CHARACTERS) &&
    value.query.trim() !== '' &&
    isLocationLocale(value.locale)
  );
}

export function isLocationResolveApiRequest(
  value: unknown
): value is LocationResolveApiRequest {
  return (
    isRecord(value) &&
    isBoundedString(value.candidateId, LOCATION_CANDIDATE_ID_MAXIMUM_CHARACTERS) &&
    value.candidateId.trim() !== '' &&
    isLocationLocale(value.locale)
  );
}
