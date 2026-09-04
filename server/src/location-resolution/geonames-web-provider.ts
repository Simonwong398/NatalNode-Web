import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
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
export const GEONAMES_REQUEST_TIMEOUT_MS = 4_000;
export const GEONAMES_USERNAME_MAXIMUM_CHARACTERS = 64;

export type GeoNamesProviderFailureCode =
  | 'REQUEST_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UPSTREAM_HTTP_ERROR'
  | 'GEONAMES_STATUS_ERROR'
  | 'INVALID_PROVIDER_RESPONSE'
  | 'INVALID_TIMEZONE_RESPONSE'
  | 'CONFIGURATION_UNAVAILABLE';

export type GeoNamesDiagnosticOperation = 'search' | 'timezone';

export type GeoNamesDiagnosticOutcome =
  | 'timeout'
  | 'network_error'
  | 'upstream_error'
  | 'provider_status_error'
  | 'invalid_response';

export interface GeoNamesDiagnosticRecord {
  readonly provider: 'geonames';
  readonly operation: GeoNamesDiagnosticOperation;
  readonly outcome: GeoNamesDiagnosticOutcome;
  readonly durationMs: number;
}

export interface GeoNamesDiagnosticSink {
  write(record: GeoNamesDiagnosticRecord): void;
}

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

type GeoNamesOperationalFailureCode = Exclude<
  GeoNamesProviderFailureCode,
  'CONFIGURATION_UNAVAILABLE'
>;

type GeoNamesUnavailableFailureCode = Exclude<
  GeoNamesOperationalFailureCode,
  'INVALID_PROVIDER_RESPONSE' | 'INVALID_TIMEZONE_RESPONSE'
>;

class GeoNamesProviderFailureError extends Error {
  public constructor(public readonly code: GeoNamesProviderFailureCode) {
    super('GeoNames provider request failed.');
    this.name = 'GeoNamesProviderFailureError';
  }
}

class GeoNamesUnavailableError extends LocationResolutionProviderUnavailableError {
  public constructor(public readonly code: GeoNamesUnavailableFailureCode) {
    super();
    this.name = 'GeoNamesUnavailableError';
  }
}

class GeoNamesInvalidResponseError extends InvalidLocationProviderDataError {
  public constructor(
    public readonly code:
      | 'INVALID_PROVIDER_RESPONSE'
      | 'INVALID_TIMEZONE_RESPONSE'
  ) {
    super();
    this.name = 'GeoNamesInvalidResponseError';
  }
}

class GeoNamesConfigurationError extends TypeError {
  public readonly code = 'CONFIGURATION_UNAVAILABLE' as const;

  public constructor(message: string) {
    super(message);
    this.name = 'GeoNamesConfigurationError';
  }
}

export interface GeoNamesWebProviderOptions {
  readonly username: string;
  readonly fetchImplementation?: typeof globalThis.fetch;
  readonly requestTimeoutMs?: number;
  readonly diagnosticSink?: GeoNamesDiagnosticSink;
}

export interface GeoNamesLocationResolutionServiceOptions {
  readonly fetchImplementation?: typeof globalThis.fetch;
  readonly requestTimeoutMs?: number;
  readonly providerTimeoutMs?: number;
  readonly diagnosticSink?: GeoNamesDiagnosticSink;
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
    throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
  }

  const numericValue =
    typeof value.status.value === 'number'
      ? value.status.value
      : typeof value.status.value === 'string' && /^\d+$/u.test(value.status.value)
        ? Number(value.status.value)
        : null;

  if (numericValue === null || !Number.isSafeInteger(numericValue)) {
    throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
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

function diagnosticOutcome(
  code: GeoNamesOperationalFailureCode
): GeoNamesDiagnosticOutcome {
  switch (code) {
    case 'REQUEST_TIMEOUT':
      return 'timeout';
    case 'NETWORK_ERROR':
      return 'network_error';
    case 'UPSTREAM_HTTP_ERROR':
      return 'upstream_error';
    case 'GEONAMES_STATUS_ERROR':
      return 'provider_status_error';
    case 'INVALID_PROVIDER_RESPONSE':
    case 'INVALID_TIMEZONE_RESPONSE':
      return 'invalid_response';
  }
}

function operationalFailureCode(
  error: unknown,
  fallback: 'INVALID_PROVIDER_RESPONSE' | 'INVALID_TIMEZONE_RESPONSE'
): GeoNamesOperationalFailureCode {
  if (error instanceof GeoNamesProviderFailureError) {
    if (error.code === 'CONFIGURATION_UNAVAILABLE') {
      return 'NETWORK_ERROR';
    }

    return error.code;
  }

  if (error instanceof InvalidLocationProviderDataError) {
    return fallback;
  }

  return 'NETWORK_ERROR';
}

function toPublicFailure(
  code: GeoNamesOperationalFailureCode
): LocationResolutionProviderUnavailableError | InvalidLocationProviderDataError {
  if (
    code === 'INVALID_PROVIDER_RESPONSE' ||
    code === 'INVALID_TIMEZONE_RESPONSE'
  ) {
    return new GeoNamesInvalidResponseError(code);
  }

  return new GeoNamesUnavailableError(code);
}

function createDefaultGeoNamesDiagnosticSink(): GeoNamesDiagnosticSink {
  return {
    write(record) {
      process.stderr.write(`${JSON.stringify(record)}\n`);
    }
  };
}

export class GeoNamesWebProvider implements GeocodingProvider {
  private readonly candidateRecords = new Map<string, GeoNamesCandidateRecord>();
  private readonly username: string;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly requestTimeoutMs: number;
  private readonly diagnosticSink: GeoNamesDiagnosticSink;

  public constructor(options: GeoNamesWebProviderOptions) {
    if (!isValidGeoNamesUsername(options.username)) {
      throw new GeoNamesConfigurationError(
        'GeoNames username configuration is invalid.'
      );
    }

    const fetchImplementation = options.fetchImplementation ?? globalThis.fetch;
    if (typeof fetchImplementation !== 'function') {
      throw new GeoNamesConfigurationError(
        'A native fetch implementation is required.'
      );
    }

    const requestTimeoutMs = options.requestTimeoutMs ?? GEONAMES_REQUEST_TIMEOUT_MS;
    if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
      throw new RangeError('GeoNames request timeout must be positive.');
    }

    this.username = options.username;
    this.fetchImplementation = fetchImplementation;
    this.requestTimeoutMs = requestTimeoutMs;
    this.diagnosticSink = options.diagnosticSink ?? createDefaultGeoNamesDiagnosticSink();
  }

  public async search(
    query: string,
    locale: LocationLocale
  ): Promise<readonly LocationCandidate[]> {
    if (!isBoundedString(query, 160) || GEONAMES_LOCALE_LANGUAGE[locale] === undefined) {
      throw new TypeError('GeoNames search input is invalid.');
    }

    const startedAt = performance.now();

    try {
      const payload = await this.request('/searchJSON', {
        q: query.trim(),
        maxRows: GEONAMES_SEARCH_MAX_ROWS,
        featureClass: 'P',
        style: 'FULL',
        isNameRequired: 'true',
        lang: GEONAMES_LOCALE_LANGUAGE[locale]
      });

      if (readProviderStatus(payload)) {
        throw new GeoNamesProviderFailureError('GEONAMES_STATUS_ERROR');
      }

      if (!isRecord(payload) || !Array.isArray(payload.geonames)) {
        throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
      }

      const seenGeonameIds = new Set<number>();
      const candidates: LocationCandidate[] = [];

      for (const item of payload.geonames) {
        if (!isRecord(item)) {
          throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
        }

        let record: GeoNamesRecord | null;
        try {
          record = parseGeonameRecord(item);
        } catch (error) {
          if (error instanceof InvalidLocationProviderDataError) {
            throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
          }

          throw error;
        }

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
    } catch (error) {
      const code = operationalFailureCode(error, 'INVALID_PROVIDER_RESPONSE');
      this.reportFailure('search', code, startedAt);
      throw toPublicFailure(code);
    }
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

    const startedAt = performance.now();

    try {
      const payload = await this.request('/timezoneJSON', {
        lat: record.latitude,
        lng: record.longitude
      });

      if (readProviderStatus(payload)) {
        throw new GeoNamesProviderFailureError('GEONAMES_STATUS_ERROR');
      }

      if (!isRecord(payload)) {
        throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
      }

      let ianaTimeZone: string;
      try {
        ianaTimeZone = parseTimezoneId(payload.timezoneId);
      } catch (error) {
        if (error instanceof InvalidLocationProviderDataError) {
          throw new GeoNamesProviderFailureError('INVALID_TIMEZONE_RESPONSE');
        }

        throw error;
      }

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
    } catch (error) {
      const code = operationalFailureCode(error, 'INVALID_TIMEZONE_RESPONSE');
      this.reportFailure('timezone', code, startedAt);
      throw toPublicFailure(code);
    }
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

  private reportFailure(
    operation: GeoNamesDiagnosticOperation,
    code: GeoNamesOperationalFailureCode,
    startedAt: number
  ): void {
    const record = Object.freeze({
      provider: 'geonames' as const,
      operation,
      outcome: diagnosticOutcome(code),
      durationMs: Math.max(0, Math.round(performance.now() - startedAt))
    });

    try {
      this.diagnosticSink.write(record);
    } catch (_error) {
      // Diagnostics must never change the provider's fail-closed behavior.
    }
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
        reject(new GeoNamesProviderFailureError('REQUEST_TIMEOUT'));
      }, this.requestTimeoutMs);
    });

    try {
      let response: unknown;
      try {
        response = await Promise.race([
          this.fetchImplementation(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }),
          deadline
        ]);
      } catch (error) {
        if (error instanceof GeoNamesProviderFailureError) {
          throw error;
        }

        throw new GeoNamesProviderFailureError('NETWORK_ERROR');
      }

      if (
        !isRecord(response) ||
        typeof response.ok !== 'boolean' ||
        typeof response.json !== 'function'
      ) {
        throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
      }

      if (!response.ok) {
        throw new GeoNamesProviderFailureError('UPSTREAM_HTTP_ERROR');
      }

      try {
        return await Promise.race([response.json(), deadline]);
      } catch (_error) {
        if (_error instanceof GeoNamesProviderFailureError) {
          throw _error;
        }

        throw new GeoNamesProviderFailureError('INVALID_PROVIDER_RESPONSE');
      }
    } catch (error) {
      if (error instanceof GeoNamesProviderFailureError) {
        throw error;
      }

      throw new GeoNamesProviderFailureError('NETWORK_ERROR');
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
    requestTimeoutMs: options.requestTimeoutMs,
    diagnosticSink: options.diagnosticSink
  });

  return new ProviderLocationResolutionService(
    provider,
    options.providerTimeoutMs ?? LOCATION_PROVIDER_TIMEOUT_MS
  );
}
