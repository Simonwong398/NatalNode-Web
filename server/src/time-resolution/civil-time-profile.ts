import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { CivilTimeAuthorityProfile } from '@natalnode/contracts';
import type * as Joda from '@js-joda/core';

export const CIVIL_TIME_AUTHORITY_PROFILE = Object.freeze({
  policyId: 'NATALNODE_WEB_CIVIL_TIME_V1',
  profileId: 'NN_WEB_CIVIL_TIME_JS_JODA_6.3.0_TZ_3.1.0_FULL_2026e_1970_2100_V1',
  implementation: 'JS_JODA_PACKAGED_TZDB',
  coreVersion: '6.3.0',
  timezonePackageVersion: '3.1.0',
  timezoneDatabaseVersion: '2026e',
  bundle: 'FULL',
  rulesArtifactSha256: '38e0555a127a04afa0e357bd95cd1a4e7271dd722a547f297aaffd071f90404d',
  coveragePolicyId: 'IANA_1970_2100_V1',
  minimumLocalDate: '1970-01-01',
  maximumLocalDate: '2100-12-31',
  minimumUtcInclusive: '1970-01-01T00:00:00.000Z',
  maximumUtcExclusive: '2101-01-01T00:00:00.000Z'
} as const satisfies CivilTimeAuthorityProfile);

export class CivilTimeAuthorityError extends Error {
  public constructor(
    public readonly code: 'TIME_AUTHORITY_DATA_INVALID' | 'UNVERIFIED_UTC_INSTANT'
  ) {
    super(code);
    this.name = 'CivilTimeAuthorityError';
  }
}

/** Kept internal to the server implementation; never re-export the provider/data. */
export interface PinnedCivilTimeRules {
  readonly core: typeof Joda;
  readonly zoneIds: ReadonlySet<string>;
}

function assertLondonSentinels(core: typeof Joda): void {
  const rules = core.ZoneId.of('Europe/London').rules();
  for (const [local, expected] of [
    ['2025-10-22T10:52:00', ['2025-10-22T09:52:00.000Z']],
    ['2025-03-30T01:30:00', []],
    ['2025-10-26T01:30:00', ['2025-10-26T00:30:00.000Z', '2025-10-26T01:30:00.000Z']]
  ] as const) {
    const civil = core.LocalDateTime.parse(local);
    const actual = rules.validOffsets(civil).map((offset) =>
      new Date(civil.toInstant(offset).toEpochMilli()).toISOString()
    ).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
    }
  }
}

/**
 * The root imports are literal and visible to the architecture guard. Node's
 * module cache loads one core/provider instance; no rule reload or fallback.
 */
export function loadPinnedCivilTimeRules(): PinnedCivilTimeRules {
  try {
    const require = createRequire(import.meta.url);
    const corePackage = JSON.parse(readFileSync(
      require.resolve('@js-joda/core/package.json'), 'utf8'
    ));
    const timezonePackagePath = require.resolve('@js-joda/timezone/package.json');
    const timezonePackage = JSON.parse(readFileSync(timezonePackagePath, 'utf8'));
    const entry = require.resolve('@js-joda/timezone');
    const profile = CIVIL_TIME_AUTHORITY_PROFILE;
    if (
      corePackage.name !== '@js-joda/core' || timezonePackage.name !== '@js-joda/timezone' ||
      corePackage.version !== profile.coreVersion ||
      timezonePackage.version !== profile.timezonePackageVersion ||
      timezonePackage.main !== 'dist/js-joda-timezone.js' ||
      entry !== join(dirname(timezonePackagePath), 'dist/js-joda-timezone.js') ||
      createRequire(entry).resolve('@js-joda/core') !== require.resolve('@js-joda/core') ||
      createHash('sha256').update(readFileSync(entry)).digest('hex') !== profile.rulesArtifactSha256
    ) {
      throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
    }

    const core: typeof Joda = require('@js-joda/core');
    require('@js-joda/timezone');
    // The plugin attaches this public hook, but its shipped typings omit it.
    const provider = core.ZoneRulesProvider as typeof Joda.ZoneRulesProvider & {
      getTzdbData?: () => unknown;
    };
    const data = provider.getTzdbData?.();
    if (
      data === null || typeof data !== 'object' ||
      !('version' in data) || data.version !== profile.timezoneDatabaseVersion
    ) {
      throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
    }
    const names = provider.getAvailableZoneIds();
    if (!Array.isArray(names) || !names.every((name) => typeof name === 'string')) {
      throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
    }
    assertLondonSentinels(core);
    return Object.freeze({ core, zoneIds: new Set(names) });
  } catch {
    // No dependency path, input, host environment or underlying exception leaks.
    throw new CivilTimeAuthorityError('TIME_AUTHORITY_DATA_INVALID');
  }
}
