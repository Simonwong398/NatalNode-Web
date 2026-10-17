import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  assertVerifiedUtcInstant,
  CIVIL_TIME_AUTHORITY_PROFILE as profile,
  createBirthTimeResolutionService
} from '../dist/time-resolution/index.js';
import {
  LOCATION_TRANSIENT_RECORD_TTL_MS,
  ProviderLocationResolutionService
} from '../dist/location-resolution/location-resolution-service.js';

const require = createRequire(import.meta.url);
const serviceUrl = new URL('../dist/time-resolution/index.js', import.meta.url).href;

function canonical(zone = 'Europe/London', id = 'london-greenwich', coordinates = {
  latitude: 51.4779, longitude: -0.0015
}) {
  return {
    resolutionId: id, canonicalDisplayName: 'London, United Kingdom', locality: 'London',
    region: 'England', country: 'United Kingdom', countryCode: 'GB', coordinates,
    ianaTimeZone: zone, status: 'RESOLVED',
    authority: { kind: 'GEOCODING', sourceId: 'provider-neutral-test', recordId: id },
    source: {
      sourceVersion: 'test-v1', datasetVersion: null,
      attribution: { label: 'Engineering test data', url: 'https://natalnode.test/location' }
    }
  };
}

function intent(location = canonical(), date = '2025-10-22', time = '10:52', patch = {}) {
  return {
    civilTime: { localDate: date, localTime: time, calendar: 'ISO_8601_GREGORIAN', precision: 'MINUTE' },
    location: {
      resolutionId: location.resolutionId, coordinates: { ...location.coordinates },
      ianaTimeZone: location.ianaTimeZone
    },
    disambiguation: 'REJECT', expectedTimezoneDatabaseVersion: null, ...patch
  };
}

async function setup(records = [canonical()]) {
  // Actual canonical owner, including its validation, immutable copies and TTL.
  const owner = new ProviderLocationResolutionService({
    async search(query) {
      return records.filter((record) => record.resolutionId === query).map((record) => ({
        ...record, candidateId: record.resolutionId
      }));
    },
    async resolve(id) { return records.find((record) => record.resolutionId === id) ?? null; }
  });
  for (const record of records) {
    await owner.search({ query: record.resolutionId, locale: 'en' });
    assert.equal((await owner.resolve({ candidateId: record.resolutionId, locale: 'en' })).state, 'RESOLVED');
  }
  let lookups = 0;
  const service = createBirthTimeResolutionService({ locationResolutionService: {
    getResolvedLocation(id) { lookups += 1; return owner.getResolvedLocation(id); }
  } });
  return { service, owner, lookups: () => lookups };
}

function verified(result, instant, offset) {
  assert.equal(result.outcome, 'VERIFIED', JSON.stringify(result));
  assert.equal(result.value.resolvedUtcInstant, instant);
  assert.equal(result.value.utcOffsetSeconds, offset);
  assert.doesNotThrow(() => assertVerifiedUtcInstant(result.value));
  return result.value;
}

function rejected(result, code) {
  assert.equal(result.outcome, 'REJECTED', JSON.stringify(result));
  assert.equal(result.error.code, code);
  assert.equal('value' in result, false);
  assert.equal('resolvedUtcInstant' in result.error, false);
  return result.error;
}

test('exact package, license, lock integrity and full 2026e artifact identities are pinned', () => {
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const [name, version, integrity] of [
    ['@js-joda/core', '6.3.0', 'sha512-mdmjc6lJkTCORsHlMxBT9XM1yLqgtsNZmv/Hwme2v/HIb15D2XcmklZKTnynqBgsSizA9SkFvzpuksfIXhDV/w=='],
    ['@js-joda/timezone', '3.1.0', 'sha512-6bCJgw/LqUHoXrZ8xJ+CLdiqfiFJ4I+imjb69+6q6YHmSOxB2pZbsd0BctMMhi0qMmCohAyyZsh29fDKnHuEYA==']
  ]) {
    const path = require.resolve(`${name}/package.json`);
    const installed = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(installed.version, version);
    assert.equal(installed.license, 'BSD-3-Clause');
    assert.match(readFileSync(join(dirname(path), 'LICENSE'), 'utf8'), /Redistribution and use/);
    assert.equal(manifest.dependencies[name], version);
    assert.equal(lock.packages[`node_modules/${name}`].integrity, integrity);
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
  }
  const timezone = JSON.parse(readFileSync(require.resolve('@js-joda/timezone/package.json'), 'utf8'));
  assert.equal(timezone.peerDependencies['@js-joda/core'], '>=5.7.0');
  assert.equal(timezone.main, 'dist/js-joda-timezone.js');
  const bytes = readFileSync(require.resolve('@js-joda/timezone'));
  assert.equal(bytes.length, 742934);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), profile.rulesArtifactSha256);
  const core = require('@js-joda/core');
  require('@js-joda/timezone');
  assert.equal(core.ZoneRulesProvider.getTzdbData().version, '2026e');
});

test('London is resolved from live canonical state to 09:52 UTC, offset +3600', async () => {
  const { service, lookups } = await setup();
  const value = verified(service.resolve(intent()), '2025-10-22T09:52:00.000Z', 3600);
  assert.equal(value.location.ianaTimeZone, 'Europe/London');
  assert.equal(value.location.resolutionId, 'london-greenwich');
  assert.equal(value.authority.timezoneDatabaseVersion, '2026e');
  assert.deepEqual(value.selection, { kind: 'UNAMBIGUOUS' });
  assert.equal(lookups(), 1);
});

test('alternate canonical London coordinates agree, but cannot override the original ID', async () => {
  const other = canonical('Europe/London', 'london-centre', { latitude: 51.5074, longitude: -0.1278 });
  const { service } = await setup([canonical(), other]);
  const value = verified(service.resolve(intent(other)), '2025-10-22T09:52:00.000Z', 3600);
  assert.deepEqual(value.location.coordinates, other.coordinates);
  const stale = intent();
  stale.location.coordinates = other.coordinates;
  rejected(service.resolve(stale), 'LOCATION_BINDING_MISMATCH');
});

test('London spring gap never shifts to a valid time, including explicit choices', async () => {
  const { service } = await setup();
  for (const disambiguation of ['REJECT', 'EARLIER', 'LATER']) {
    rejected(service.resolve(intent(canonical(), '2025-03-30', '01:30', {
      disambiguation, expectedTimezoneDatabaseVersion: '2026e'
    })), 'NONEXISTENT_LOCAL_TIME');
  }
});

test('London overlap exposes two ordered candidates and needs an explicit version-bound choice', async () => {
  const { service } = await setup();
  const request = intent(canonical(), '2025-10-26', '01:30');
  const error = rejected(service.resolve(request), 'AMBIGUOUS_LOCAL_TIME');
  assert.deepEqual(error.candidates, [
    { resolvedUtcInstant: '2025-10-26T00:30:00.000Z', utcOffsetSeconds: 3600 },
    { resolvedUtcInstant: '2025-10-26T01:30:00.000Z', utcOffsetSeconds: 0 }
  ]);
  for (const [occurrence, utc, offset] of [
    ['EARLIER', '2025-10-26T00:30:00.000Z', 3600],
    ['LATER', '2025-10-26T01:30:00.000Z', 0]
  ]) {
    const value = verified(service.resolve({ ...request, disambiguation: occurrence,
      expectedTimezoneDatabaseVersion: '2026e' }), utc, offset);
    assert.equal(value.selection.kind, 'USER_DISAMBIGUATED_OVERLAP');
    assert.equal(value.selection.occurrence, occurrence);
    assert.deepEqual(value.selection.candidates, error.candidates);
  }
  rejected(service.resolve({ ...request, disambiguation: 'EARLIER' }), 'DISAMBIGUATION_VERSION_REQUIRED');
  rejected(service.resolve({ ...request, disambiguation: 'LATER',
    expectedTimezoneDatabaseVersion: '2026b' }), 'TZDB_VERSION_MISMATCH');
});

test('an overlap choice cannot silently apply to a unique civil time', async () => {
  const { service } = await setup();
  rejected(service.resolve(intent(canonical(), '2025-10-22', '10:52', {
    disambiguation: 'EARLIER', expectedTimezoneDatabaseVersion: '2026e'
  })), 'DISAMBIGUATION_NOT_APPLICABLE');
});

test('named IANA membership is strict; a valid zone must also match the canonical record', async () => {
  const { service } = await setup();
  for (const name of ['Europe London', 'Europe/NoSuchCity', '+01:00', '', 'europe/london', ' Europe/London']) {
    const request = intent(); request.location.ianaTimeZone = name;
    assert.equal(rejected(service.resolve(request), 'INVALID_TIME_ZONE').field, 'ianaTimeZone');
  }
  const mismatch = intent(); mismatch.location.ianaTimeZone = 'America/New_York';
  rejected(service.resolve(mismatch), 'LOCATION_BINDING_MISMATCH');
});

test('missing or expired canonical records cannot be replaced by browser snapshots', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const { service } = await setup();
  const absent = intent(); absent.location.resolutionId = 'not-selected';
  rejected(service.resolve(absent), 'LOCATION_RESOLUTION_UNAVAILABLE');
  verified(service.resolve(intent()), '2025-10-22T09:52:00.000Z', 3600);
  t.mock.timers.tick(LOCATION_TRANSIENT_RECORD_TTL_MS);
  rejected(service.resolve(intent()), 'LOCATION_RESOLUTION_UNAVAILABLE');
});

test('canonical record integrity and provider unavailability are not caller timezone errors', () => {
  for (const location of [
    { ...canonical(), coordinates: { latitude: 91, longitude: 0 } },
    { ...canonical(), ianaTimeZone: 'Europe London' },
    { ...canonical(), status: 'UNRESOLVED' }
  ]) {
    const service = createBirthTimeResolutionService({ locationResolutionService: {
      getResolvedLocation() { return location; }
    } });
    rejected(service.resolve(intent()), 'TIME_AUTHORITY_DATA_INVALID');
  }
  const unavailable = createBirthTimeResolutionService({ locationResolutionService: {
    getResolvedLocation() { throw new Error('not exposed'); }
  } });
  rejected(unavailable.resolve(intent()), 'LOCATION_RESOLUTION_UNAVAILABLE');
});

test('browser UTC, offsets, metadata, evidence and tokens are all rejected as authority', async () => {
  const { service } = await setup();
  for (const key of ['resolvedUtcInstant', 'utcOffsetSeconds', 'timezoneResolutionMethod',
    'timezoneDatabaseVersion', 'verified', 'verifiedUtcInstant', 'evidence', 'token']) {
    rejected(service.resolve({ ...intent(), [key]: 'forged' }), 'CLIENT_TIME_AUTHORITY_FORBIDDEN');
  }
  const nested = intent(); nested.civilTime.resolvedUtcInstant = '2025-10-22T09:52:00.000Z';
  rejected(service.resolve(nested), 'CLIENT_TIME_AUTHORITY_FORBIDDEN');
  rejected(service.resolve({ ...intent(), locationLabel: 'Europe/London' }), 'INVALID_REQUEST');
  rejected(service.resolve('2025-10-22T09:52:00.000Z'), 'INVALID_REQUEST');
});

test('an actual DevelopmentBirthInputResolver result never confers authority', async () => {
  const { DevelopmentBirthInputResolver } = await import(
    '../../apps/web/src/features/chart-input/development-resolver.ts'
  );
  const fixture = await new DevelopmentBirthInputResolver().resolve({
    localDate: '2025-10-22', localTime: '10:52', locationLabel: 'London', ambiguityStatus: 'UNRESOLVED'
  });
  const { service } = await setup();
  rejected(service.resolve({ ...intent(), ...fixture }), 'CLIENT_TIME_AUTHORITY_FORBIDDEN');
  const record = canonical(); record.source.sourceVersion = 'UI_DEVELOPMENT_ONLY';
  const fixtureSource = await setup([record]);
  rejected(fixtureSource.service.resolve(intent(record)), 'DEVELOPMENT_FIXTURE_REJECTED');
});

test('unknown time returns no UTC/offset or calculated facts', async () => {
  const { service } = await setup();
  const result = service.resolve(intent(canonical(), '2025-10-22', null));
  assert.deepEqual(result, { outcome: 'REJECTED', error: { code: 'UNKNOWN_BIRTH_TIME', field: 'localTime' } });
});

test('strict Gregorian and minute-precision parsing rejects normalization or guessed time', async () => {
  const utc = canonical('Etc/UTC', 'utc');
  const { service } = await setup([utc]);
  verified(service.resolve(intent(utc, '2024-02-29', '00:00')), '2024-02-29T00:00:00.000Z', 0);
  for (const date of ['2025-02-29', '2025-04-31', '2025-13-01', '0000-01-01', '25-10-22', '2025-1-01']) {
    rejected(service.resolve(intent(utc, date)), 'INVALID_LOCAL_DATE');
  }
  for (const time of ['', '24:00', '10:60', '10:52:00', '10:52Z', '10:52+01:00', ' 10:52']) {
    rejected(service.resolve(intent(utc, '2025-10-22', time)), 'INVALID_LOCAL_TIME');
  }
});

test('coordinate assertions are finite degrees, with no tolerance-based identity merge', async () => {
  const { service } = await setup();
  for (const coordinates of [
    { latitude: 91, longitude: 0 }, { latitude: -91, longitude: 0 },
    { latitude: 0, longitude: 181 }, { latitude: 0, longitude: -181 },
    { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }
  ]) {
    const request = intent(); request.location.coordinates = coordinates;
    rejected(service.resolve(request), 'INVALID_COORDINATES');
  }
  const request = intent(); request.location.coordinates.latitude += 0.0000001;
  rejected(service.resolve(request), 'LOCATION_BINDING_MISMATCH');
  for (const coordinates of [{ latitude: -90, longitude: -180 }, { latitude: 90, longitude: 180 }]) {
    const record = canonical('Etc/UTC', 'bounds', coordinates);
    const bounded = await setup([record]);
    verified(bounded.service.resolve(intent(record)), '2025-10-22T10:52:00.000Z', 0);
  }
});

test('1970 and 2100 boundaries apply to both civil date and every UTC candidate', async () => {
  const utc = canonical('Etc/UTC', 'utc');
  const tokyo = canonical('Asia/Tokyo', 'tokyo');
  const honolulu = canonical('Pacific/Honolulu', 'honolulu');
  const { service } = await setup([utc, tokyo, honolulu]);
  verified(service.resolve(intent(utc, '1970-01-01', '00:00')), '1970-01-01T00:00:00.000Z', 0);
  verified(service.resolve(intent(utc, '2100-12-31', '23:59')), '2100-12-31T23:59:00.000Z', 0);
  for (const date of ['1799-01-01', '1969-12-31', '2101-01-01', '9999-12-31']) {
    rejected(service.resolve(intent(utc, date)), 'UNSUPPORTED_TIME_RANGE');
  }
  for (const request of [intent(tokyo, '1970-01-01', '00:00'), intent(honolulu, '2100-12-31', '23:59')]) {
    assert.equal(rejected(service.resolve(request), 'UNSUPPORTED_TIME_RANGE').reason, 'UTC_OUTSIDE_ADMITTED_RANGE');
  }
});

test('non-hour, skipped-date and historical second offsets retain independent known expectations', async () => {
  const kathmandu = canonical('Asia/Kathmandu', 'kathmandu');
  const lordHowe = canonical('Australia/Lord_Howe', 'lord-howe');
  const apia = canonical('Pacific/Apia', 'apia');
  const monrovia = canonical('Africa/Monrovia', 'monrovia');
  const { service } = await setup([kathmandu, lordHowe, apia, monrovia]);
  verified(service.resolve(intent(kathmandu)), '2025-10-22T05:07:00.000Z', 20700);
  const overlap = rejected(service.resolve(intent(lordHowe, '2025-04-06', '01:45')), 'AMBIGUOUS_LOCAL_TIME');
  assert.deepEqual(overlap.candidates, [
    { resolvedUtcInstant: '2025-04-05T14:45:00.000Z', utcOffsetSeconds: 39600 },
    { resolvedUtcInstant: '2025-04-05T15:15:00.000Z', utcOffsetSeconds: 37800 }
  ]);
  rejected(service.resolve(intent(lordHowe, '2025-10-05', '02:15')), 'NONEXISTENT_LOCAL_TIME');
  rejected(service.resolve(intent(apia, '2011-12-30', '12:00')), 'NONEXISTENT_LOCAL_TIME');
  verified(service.resolve(intent(monrovia, '1971-01-01', '12:00')), '1971-01-01T12:44:30.000Z', -2670);
});

test('evidence is immutable, deterministic, freshly issued and cannot be restored from JSON', async () => {
  const { service, lookups } = await setup();
  const first = service.resolve(intent()).value;
  const second = service.resolve(intent()).value;
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.equal(lookups(), 2);
  for (const object of [first, first.authority, first.civilTime, first.location,
    first.location.coordinates, first.location.authority, first.location.source,
    first.location.source.attribution, first.selection]) assert.ok(Object.isFrozen(object));
  assert.throws(() => { first.resolvedUtcInstant = 'forged'; }, TypeError);
  for (const forged of [{ ...first }, JSON.parse(JSON.stringify(first)), structuredClone(first), { verified: true }]) {
    assert.throws(() => assertVerifiedUtcInstant(forged), { code: 'UNVERIFIED_UTC_INSTANT' });
  }
});

function runIsolated(code, tz) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8', env: tz === undefined ? {} : { TZ: tz }, timeout: 15_000
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test('resolution does not depend on the process timezone or host civil-time default', () => {
  const code = `
    import { createBirthTimeResolutionService } from ${JSON.stringify(serviceUrl)};
    const record = ${JSON.stringify(canonical())};
    const service = createBirthTimeResolutionService({locationResolutionService:{getResolvedLocation(){return record;}}});
    console.log(JSON.stringify(service.resolve(${JSON.stringify(intent())})));
  `;
  const utc = runIsolated(code, 'UTC');
  assert.equal(runIsolated(code, 'Pacific/Honolulu'), utc);
  assert.equal(JSON.parse(utc).value.resolvedUtcInstant, '2025-10-22T09:52:00.000Z');
});

test('a loaded wrong tzdb version fails closed instead of using ICU or a fixture', () => {
  const code = `
    import {createRequire} from 'node:module';
    const require = createRequire(${JSON.stringify(serviceUrl)});
    const core = require('@js-joda/core'); require('@js-joda/timezone');
    const data = core.ZoneRulesProvider.getTzdbData();
    core.ZoneRulesProvider.getTzdbData = () => ({...data,version:'2026b'});
    const {createBirthTimeResolutionService} = await import(${JSON.stringify(serviceUrl)});
    try { createBirthTimeResolutionService({locationResolutionService:{getResolvedLocation(){return null;}}});
      process.exitCode=1;
    } catch(error) { console.log(error.code); }
  `;
  assert.equal(runIsolated(code), 'TIME_AUTHORITY_DATA_INVALID');
});

test('wrong artifact bytes fail the frozen checksum before a provider is admitted', () => {
  const code = `
    import fs from 'node:fs';
    import {syncBuiltinESMExports} from 'node:module';
    const read = fs.readFileSync;
    fs.readFileSync = function(path,...args) {
      return String(path).endsWith('/dist/js-joda-timezone.js') ? Buffer.from('bad artifact') : read(path,...args);
    };
    syncBuiltinESMExports();
    const {createBirthTimeResolutionService} = await import(${JSON.stringify(serviceUrl)});
    try { createBirthTimeResolutionService({locationResolutionService:{getResolvedLocation(){return null;}}});
      process.exitCode=1;
    } catch(error) { console.log(error.code); }
  `;
  assert.equal(runIsolated(code), 'TIME_AUTHORITY_DATA_INVALID');
});
