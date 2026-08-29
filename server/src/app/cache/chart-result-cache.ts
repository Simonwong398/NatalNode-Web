import type { ChartRequest, ChartResult } from '@natalnode/contracts';
import type { Clock } from '../creation-boundaries.js';
import {
  assertChartResultCacheIdentity,
  CACHE_FORMAT_VERSION,
  createChartResultCacheKey,
  type ChartResultCacheIdentity
} from './chart-result-cache-key.js';

export const DEFAULT_CHART_RESULT_CACHE_TTL_MS = 15 * 60 * 1_000;
export const DEFAULT_CHART_RESULT_CACHE_MAX_ENTRIES = 512;

export interface ChartResultCacheConfig extends ChartResultCacheIdentity {
  readonly clock: Clock;
  readonly ttlMs?: number;
  readonly maxEntries?: number;
}

interface ChartResultCacheEntry {
  readonly cacheFormatVersion: typeof CACHE_FORMAT_VERSION;
  readonly runtimeNamespace: string;
  readonly engineResultGeneration: string;
  readonly chartResultContractVersion: string;
  readonly expiresAtMs: number;
  readonly chartResult: ChartResult;
}

export type ChartResultCacheLookup =
  | {
      readonly status: 'hit';
      readonly value: ChartResult;
    }
  | {
      readonly status: 'miss';
    }
  | {
      readonly status: 'error';
    };

export type ChartResultCacheStore =
  | {
      readonly status: 'stored';
    }
  | {
      readonly status: 'error';
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function assertPositiveSafeInteger(value: unknown, name: string): void {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${name} must be a positive safe integer.`);
  }
}

function assertClock(clock: unknown): asserts clock is Clock {
  if (
    (typeof clock !== 'object' && typeof clock !== 'function') ||
    clock === null ||
    typeof (clock as { now?: unknown }).now !== 'function'
  ) {
    throw new Error('Chart result cache Clock is invalid.');
  }
}

function isCompatibleEntry(
  value: unknown,
  identity: ChartResultCacheIdentity
): value is ChartResultCacheEntry {
  if (!isRecord(value) || !isRecord(value.chartResult)) {
    return false;
  }

  return (
    value.cacheFormatVersion === CACHE_FORMAT_VERSION &&
    value.runtimeNamespace === identity.runtimeNamespace &&
    value.engineResultGeneration === identity.engineResultGeneration &&
    value.chartResultContractVersion ===
      identity.chartResultContractVersion &&
    typeof value.expiresAtMs === 'number' &&
    Number.isFinite(value.expiresAtMs)
  );
}

export class ChartResultCache {
  private readonly entries = new Map<string, ChartResultCacheEntry>();
  private readonly identity: ChartResultCacheIdentity;
  private readonly clock: Clock;
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  public constructor(config: ChartResultCacheConfig) {
    assertChartResultCacheIdentity(config);
    assertClock(config.clock);

    const ttlMs =
      config.ttlMs === undefined
        ? DEFAULT_CHART_RESULT_CACHE_TTL_MS
        : config.ttlMs;
    const maxEntries =
      config.maxEntries === undefined
        ? DEFAULT_CHART_RESULT_CACHE_MAX_ENTRIES
        : config.maxEntries;

    assertPositiveSafeInteger(ttlMs, 'Chart result cache TTL');
    assertPositiveSafeInteger(maxEntries, 'Chart result cache capacity');

    if (maxEntries > DEFAULT_CHART_RESULT_CACHE_MAX_ENTRIES) {
      throw new Error('Chart result cache capacity must not exceed 512.');
    }

    this.identity = {
      runtimeNamespace: config.runtimeNamespace,
      engineResultGeneration: config.engineResultGeneration,
      chartResultContractVersion: config.chartResultContractVersion
    };
    this.clock = config.clock;
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  public lookup(request: ChartRequest): ChartResultCacheLookup {
    const key = createChartResultCacheKey(request, this.identity);
    const nowMs = this.currentTimeMs();
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return { status: 'miss' };
    }

    if (!isCompatibleEntry(entry, this.identity)) {
      this.entries.delete(key);
      return { status: 'miss' };
    }

    if (nowMs >= entry.expiresAtMs) {
      this.entries.delete(key);
      return { status: 'miss' };
    }

    let clonedResult: ChartResult;

    try {
      clonedResult = structuredClone(entry.chartResult);
    } catch (_error) {
      this.entries.delete(key);
      return { status: 'error' };
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    return { status: 'hit', value: clonedResult };
  }

  public get(request: ChartRequest): ChartResult | undefined {
    const lookup = this.lookup(request);
    return lookup.status === 'hit' ? lookup.value : undefined;
  }

  /**
   * Stores a result only after cloning it. The caller is responsible for
   * passing a structurally validated complete ChartResult at the B2 boundary.
   */
  public store(
    request: ChartRequest,
    chartResult: ChartResult
  ): ChartResultCacheStore {
    const key = createChartResultCacheKey(request, this.identity);
    let clonedResult: ChartResult;

    try {
      clonedResult = structuredClone(chartResult);
    } catch (_error) {
      return { status: 'error' };
    }

    const nowMs = this.currentTimeMs();

    this.pruneExpired(nowMs);
    this.entries.delete(key);

    while (this.entries.size >= this.maxEntries) {
      this.deleteLeastRecentlyUsed();
    }

    this.entries.set(key, {
      cacheFormatVersion: CACHE_FORMAT_VERSION,
      runtimeNamespace: this.identity.runtimeNamespace,
      engineResultGeneration: this.identity.engineResultGeneration,
      chartResultContractVersion: this.identity.chartResultContractVersion,
      expiresAtMs: nowMs + this.ttlMs,
      chartResult: clonedResult
    });

    return { status: 'stored' };
  }

  public set(request: ChartRequest, chartResult: ChartResult): boolean {
    return this.store(request, chartResult).status === 'stored';
  }

  private currentTimeMs(): number {
    const timestamp = this.clock.now();

    if (typeof timestamp !== 'string') {
      throw new Error('Chart result cache Clock returned an invalid timestamp.');
    }

    const nowMs = Date.parse(timestamp);

    if (!Number.isFinite(nowMs)) {
      throw new Error('Chart result cache Clock returned an invalid timestamp.');
    }

    return nowMs;
  }

  private pruneExpired(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (
        !isCompatibleEntry(entry, this.identity) ||
        nowMs >= entry.expiresAtMs
      ) {
        this.entries.delete(key);
      }
    }
  }

  private deleteLeastRecentlyUsed(): void {
    const oldestKey = this.entries.keys().next().value;

    if (typeof oldestKey !== 'string') {
      throw new Error('Chart result cache LRU state is invalid.');
    }

    this.entries.delete(oldestKey);
  }
}
