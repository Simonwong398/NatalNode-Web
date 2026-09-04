import { randomUUID } from 'node:crypto';
import type {
  CanonicalResolvedLocation,
  LocationAttribution,
  LocationCandidate,
  LocationLocale
} from '@natalnode/contracts';
import {
  InvalidLocationProviderDataError,
  LocationResolutionProviderUnavailableError,
  LOCATION_PROVIDER_TIMEOUT_MS,
  LOCATION_TRANSIENT_RECORD_TTL_MS,
  ProviderLocationResolutionService,
  type GeocodingProvider
} from './location-resolution-service.js';

export const GEONAMES_SOURCE_ID = 'geonames-free-web-services';
export const GEONAMES_API_ORIGIN = 'https://secure.geonames.org';
export const GEONAMES_SEARCH_MAX_ROWS = 8;
export const GEONAMES_REQUEST_TIMEOUT_MS = 1_400;
export const GEONAMES_USERNAME_MAXIMUM_CHARACTERS = 64;

export const GEONAMES_ATTRIBUTION: LocationAttribution = Object.freeze({
  label: 'GeoNames',
  url: 'https://www.geonames.org/'
});

export const GEONAMES_LOCALE_LANGUAGE: Readonly<
  Record<LocationLocale, string>
> = Object.freeze({
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ja: 'ja',
  ko: 'ko',
  'zh-Hant': 'zh-Hant'
});

const GEO_NAMES_USERNAME_PATTERN = /^[A-Za-z0-9._-]{1,64}$/u;
const IANA_TIMEZONE_PATTERN = /^(?:UTC|GMT|[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)+)$/u;
const DISPLAY_MAXIMUM_CHARACTERS = 256;
const SOURCE_VERSION = 'geonames-free-web-services-v1';
const DATASET_VERSION = null;

export interface GeoNamesWebProviderOptions {
  readonly username: string;
  readonly fetchImplementation?: typeof globalThis.fetch;
  readonly requestTimeoutMs?: number;
}

export interface GeoNamesLocationResolutionServiceOptions {
  readonly fetchImplementation?: typeof globalThis.fetch;
  readonly requestTimeoutMs?: number;
  readonly providerTimeoutMs?: number;
}

interface GeoNamesRecord {
  readonly geonameId: number;
  readonly name: string;
  readonly toponymName?: string;
  readonly adminName1?: string;
  readonly countryName: string;
  readonly countryCode?: string;
  readonly lat: number;
  readonly lng: number;
}

interface GeoNamesCandidateRecord {
  readonly candidate: LocationCandidate;
  readonly locale: LocationLocale;
  readonly latitude: number;
  readonly longitude: number;
  readonly expiresAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedString(
  value: unknown,
  maximumCharacters = DISPLAY_MAXIMUM_CHARACTERS
): value is string {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Array.from(value).length <= maximumCharacters &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value)
  );
}

function parseCoordinate(value: unknown, minimum: number, maximum: number): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  if (typeof value === 'string' && !/^[-+]?\d+(?:\.\d+)?$/u.test(value)) {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

function parseCountryCode(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (!isBoundedString(value, 16)) {
    return null;
  }

  return value.trim().toUpperCase();
}

function normalizedLabel(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

/** Builds a display label from authority fields without duplicating labels. */
export function formatCanonicalDisplayName(
  parts: readonly (string | null | undefined)[]
): string {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const part of parts) {
    if (!isBoundedString(part)) {
      continue;
    }

    const normalized = normalizedLabel(part);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    labels.push(part.trim());
  }

  return labels.join(', ');
}

function parseGeonameRecord(value: unknown): GeoNamesRecord | null {
  if (!isRecord(value) || value.fcl !== 'P') {
    return null;
  }

  if (
    typeof value.geonameId !== 'number' ||
    !Number.isSafeInteger(value.geonameId) ||
    value.geonameId <= 0 ||
    !isBoundedString(value.name) ||
    !isBoundedString(value.countryName) ||
    !('lat' in value) ||
    !('lng' in value)
  ) {
    throw new InvalidLocationProviderDataError();
  }

  const latitude = parseCoordinate(value.lat, -90, 90);
  const longitude = parseCoordinate(value.lng, -180, 180);

  if (latitude === null || longitude === null) {
    throw new InvalidLocationProviderDataError();
  }

  if (value.toponymName !== undefined && !isBoundedString(value.toponymName)) {
    throw new InvalidLocationProviderDataError();
  }

  if (value.adminName1 !== undefined && !isBoundedString(value.adminName1)) {
    throw new InvalidLocationProviderDataError();
  }

  const countryCode = parseCountryCode(value.countryCode);
  if (
    value.countryCode !== undefined &&
    value.countryCode !== null &&
    value.countryCode !== '' &&
    countryCode === null
  ) {
    throw new InvalidLocationProviderDataError();
  }

  return {
    geonameId: value.geonameId,
    name: value.name,
    ...(value.toponymName === undefined ? {} : { toponymName: value.toponymName }),
    ...(value.adminName1 === undefined ? {} : { adminName1: value.adminName1 }),
    countryName: value.countryName,
    ...(countryCode === null ? {} : { countryCode }),
    lat: latitude,
    lng: longitude
  };
}

function readProviderStatus(value: unknown): boolean {
  if (!isRecord(value) || value.status === undefined) {
    return false;
  }

  if (!isRecord(value.status)) {
    throw new InvalidLocationProviderDataError();
  }

  const numericValue =
    typeof value.status.value === 'number'
      ? value.status.value
      : typeof value.status.value === 'string' && /^\d+$/u.test(value.status.value)
        ? Number(value.status.value)
        : null;

  if (numericValue === null || !Number.isSafeInteger(numericValue)) {
    throw new InvalidLocationProviderDataError();
  }

  if (numericValue === 0) {
    return false;
  }

  return true;
}

function parseTimezoneId(value: unknown): string {
  if (
    !isBoundedString(value, 128) ||
    !IANA_TIMEZONE_PATTERN.test(value.trim())
  ) {
    throw new InvalidLocationProviderDataError();
  }

  return value.trim();
}

export function isValidGeoNamesUsername(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= GEONAMES_USERNAME_MAXIMUM_CHARACTERS &&
    GEO_NAMES_USERNAME_PATTERN.test(value)
  );
}

export class GeoNamesWebProvider implements GeocodingProvider {
  private readonly candidateRecords = new Map<string, GeoNamesCandidateRecord>();
  private readonly username: string;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly requestTimeoutMs: number;

  public constructor(options: GeoNamesWebProviderOptions) {
    if (!isValidGeoNamesUsername(options.username)) {
      throw new TypeError('GeoNames username configuration is invalid.');
    }

    const fetchImplementation = options.fetchImplementation ?? globalThis.fetch;
    if (typeof fetchImplementation !== 'function') {
      throw new TypeError('A native fetch implementation is required.');
    }

    const requestTimeoutMs = options.requestTimeoutMs ?? GEONAMES_REQUEST_TIMEOUT_MS;
    if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
      throw new RangeError('GeoNames request timeout must be positive.');
    }

    this.username = options.username;
    this.fetchImplementation = fetchImplementation;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  public async search(
    query: string,
    locale: LocationLocale
  ): Promise<readonly LocationCandidate[]> {
    if (!isBoundedString(query, 160) || GEONAMES_LOCALE_LANGUAGE[locale] === undefined) {
      throw new TypeError('GeoNames search input is invalid.');
    }

    const payload = await this.request('/searchJSON', {
      q: query.trim(),
      maxRows: GEONAMES_SEARCH_MAX_ROWS,
      featureClass: 'P',
      style: 'FULL',
      isNameRequired: 'true',
      lang: GEONAMES_LOCALE_LANGUAGE[locale]
    });

    if (readProviderStatus(payload)) {
      throw new LocationResolutionProviderUnavailableError();
    }

    if (!isRecord(payload) || !Array.isArray(payload.geonames)) {
      throw new InvalidLocationProviderDataError();
    }

    const seenGeonameIds = new Set<number>();
    const candidates: LocationCandidate[] = [];

    for (const item of payload.geonames) {
      if (!isRecord(item)) {
        throw new InvalidLocationProviderDataError();
      }

      const record = parseGeonameRecord(item);
      if (record === null || seenGeonameIds.has(record.geonameId)) {
        continue;
      }

      seenGeonameIds.add(record.geonameId);
      const candidate = this.createCandidate(record);
      this.rememberCandidate(candidate.candidateId, {
        candidate,
        locale,
        latitude: record.lat,
        longitude: record.lng,
        expiresAt: Date.now() + LOCATION_TRANSIENT_RECORD_TTL_MS
      });
      candidates.push(candidate);

      if (candidates.length >= GEONAMES_SEARCH_MAX_ROWS) {
        break;
      }
    }

    return Object.freeze(candidates);
  }

  public async resolve(
    candidateId: string,
    locale: LocationLocale
  ): Promise<CanonicalResolvedLocation | null> {
    const record = this.candidateRecords.get(candidateId);
    if (
      record === undefined ||
      record.locale !== locale ||
      record.expiresAt <= Date.now()
    ) {
      this.candidateRecords.delete(candidateId);
      return null;
    }

    const payload = await this.request('/timezoneJSON', {
      lat: record.latitude,
      lng: record.longitude
    });

    if (readProviderStatus(payload)) {
      throw new LocationResolutionProviderUnavailableError();
    }

    if (!isRecord(payload)) {
      throw new InvalidLocationProviderDataError();
    }

    const ianaTimeZone = parseTimezoneId(payload.timezoneId);
    const candidate = record.candidate;

    return Object.freeze({
      resolutionId: randomUUID(),
      canonicalDisplayName: candidate.canonicalDisplayName,
      locality: candidate.locality,
      region: candidate.region,
      country: candidate.country,
      countryCode: candidate.countryCode,
      coordinates: Object.freeze({
        latitude: record.latitude,
        longitude: record.longitude
      }),
      ianaTimeZone,
      status: 'RESOLVED' as const,
      authority: Object.freeze({
        kind: 'GEOCODING' as const,
        sourceId: GEONAMES_SOURCE_ID,
        recordId: candidate.candidateId
      }),
      source: Object.freeze({
        sourceVersion: SOURCE_VERSION,
        datasetVersion: DATASET_VERSION,
        attribution: GEONAMES_ATTRIBUTION
      })
    });
  }

  private createCandidate(record: GeoNamesRecord): LocationCandidate {
    const locality = record.name.trim();
    const region = record.adminName1?.trim() ?? null;
    const country = record.countryName.trim();
    const countryCode = record.countryCode ?? null;
    const candidateId = randomUUID();

    return Object.freeze({
      candidateId,
      canonicalDisplayName: formatCanonicalDisplayName([
        locality,
        region,
        country
      ]),
      locality,
      region,
      country,
      countryCode,
      coordinates: Object.freeze({
        latitude: record.lat,
        longitude: record.lng
      }),
      authority: Object.freeze({
        kind: 'GEOCODING' as const,
        sourceId: GEONAMES_SOURCE_ID,
        recordId: candidateId
      }),
      source: Object.freeze({
        sourceVersion: SOURCE_VERSION,
        datasetVersion: DATASET_VERSION,
        attribution: GEONAMES_ATTRIBUTION
      })
    });
  }

  private rememberCandidate(
    candidateId: string,
    record: GeoNamesCandidateRecord
  ): void {
    const limit = GEONAMES_SEARCH_MAX_ROWS * 256;
    if (this.candidateRecords.size >= limit) {
      const oldestCandidateId = this.candidateRecords.keys().next().value;
      if (typeof oldestCandidateId === 'string') {
        this.candidateRecords.delete(oldestCandidateId);
      }
    }

    this.candidateRecords.set(candidateId, record);
  }

  private async request(
    path: '/searchJSON' | '/timezoneJSON',
    parameters: Readonly<Record<string, string | number>>
  ): Promise<unknown> {
    const url = new URL(path, GEONAMES_API_ORIGIN);
    url.search = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(parameters).map(([key, value]) => [key, String(value)])
      ),
      username: this.username
    }).toString();
    const controller = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        controller.abort();
        reject(new LocationResolutionProviderUnavailableError());
      }, this.requestTimeoutMs);
    });

    try {
      const response = await Promise.race([
        this.fetchImplementation(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        }),
        deadline
      ]);

      if (!response.ok) {
        throw new LocationResolutionProviderUnavailableError();
      }

      try {
        return await response.json();
      } catch (_error) {
        throw new InvalidLocationProviderDataError();
      }
    } catch (error) {
      if (
        error instanceof InvalidLocationProviderDataError ||
        error instanceof LocationResolutionProviderUnavailableError
      ) {
        throw error;
      }

      throw new LocationResolutionProviderUnavailableError();
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

export function createGeoNamesLocationResolutionService(
  username: string,
  options: GeoNamesLocationResolutionServiceOptions = {}
): ProviderLocationResolutionService {
  const provider = new GeoNamesWebProvider({
    username,
    fetchImplementation: options.fetchImplementation,
    requestTimeoutMs: options.requestTimeoutMs
  });

  return new ProviderLocationResolutionService(
    provider,
    options.providerTimeoutMs ?? LOCATION_PROVIDER_TIMEOUT_MS
  );
}
