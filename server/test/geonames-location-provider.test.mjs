import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  GeoNamesWebProvider,
  GEONAMES_API_ORIGIN,
  GEONAMES_LOCALE_LANGUAGE,
  GEONAMES_SEARCH_MAX_ROWS,
  createGeoNamesLocationResolutionService,
  formatCanonicalDisplayName,
  isValidGeoNamesUsername
} from '../dist/location-resolution/geonames-web-provider.js';
import {
  InvalidLocationProviderDataError,
  LocationResolutionProviderUnavailableError,
  ProviderLocationResolutionService
} from '../dist/location-resolution/location-resolution-service.js';
import { parseServerEnvironment } from '../dist/runtime/environment/parse-server-environment.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function createFetch(handler) {
  const calls = [];
  const fetchImplementation = async (input, init) => {
    const url = new URL(input);
    calls.push({ url, init });
    return handler(url, init);
  };

  return { calls, fetchImplementation };
}

function populatedPlace(overrides = {}) {
  return {
    geonameId: 1_796_236,
    name: 'Shanghai',
    toponymName: 'Shanghai',
    adminName1: 'Shanghai',
    countryName: 'China',
    countryCode: 'CN',
    lat: '31.2304',
    lng: '121.4737',
    fcl: 'P',
    ...overrides
  };
}

function serverEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://location-test.invalid/natalnode',
    DATABASE_SSL_ENABLED: 'true',
    AUTH_MAGIC_LINK_TTL_SECONDS: '600',
    AUTH_SESSION_TTL_SECONDS: '3600',
    AUTH_SESSION_COOKIE_NAME: 'nn_session',
    AUTH_SESSION_COOKIE_SECURE: 'true',
    PUBLIC_WEB_ORIGIN: 'https://natalnode.example',
    HOST: '127.0.0.1',
    PORT: '4322',
    ...overrides
  };
}

test('GeoNames search requests the official bounded populated-place contract and maps provider fields', async () => {
  const { calls, fetchImplementation } = createFetch((url) => {
    assert.equal(url.origin, GEONAMES_API_ORIGIN);
    assert.equal(url.pathname, '/searchJSON');
    return jsonResponse({
      geonames: [
        populatedPlace(),
        populatedPlace({
          geonameId: 2,
          name: 'Los Angeles',
          adminName1: 'California',
          countryName: 'United States',
          countryCode: 'US',
          lat: '34.0522',
          lng: '-118.2437'
        }),
        populatedPlace({
          geonameId: 3,
          fcl: 'A',
          name: 'California'
        }),
        populatedPlace({ geonameId: 2 })
      ]
    });
  });
  const provider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation
  });

  const candidates = await provider.search('Shanghai China', 'zh-Hant');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.searchParams.get('q'), 'Shanghai China');
  assert.equal(calls[0].url.searchParams.get('lang'), 'zh-Hant');
  assert.equal(calls[0].url.searchParams.get('featureClass'), 'P');
  assert.equal(calls[0].url.searchParams.get('maxRows'), String(GEONAMES_SEARCH_MAX_ROWS));
  assert.equal(calls[0].url.searchParams.get('isNameRequired'), 'true');
  assert.equal(calls[0].url.searchParams.get('style'), 'FULL');
  assert.equal(calls[0].url.searchParams.get('username'), 'test_account');
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].canonicalDisplayName, 'Shanghai, China');
  assert.equal(candidates[1].canonicalDisplayName, 'Los Angeles, California, United States');
  assert.deepEqual(candidates[0].coordinates, {
    latitude: 31.2304,
    longitude: 121.4737
  });
  assert.equal(candidates[0].source.attribution.label, 'GeoNames');
  assert.equal('geonameId' in candidates[0], false);
  assert.equal('toponymName' in candidates[0], false);
  assert.equal(Object.isFrozen(candidates), true);
});

test('GeoNames search and timezone requests share the secure HTTPS origin', async () => {
  const { calls, fetchImplementation } = createFetch((url) => {
    if (url.pathname === '/searchJSON') {
      return jsonResponse({ geonames: [populatedPlace()] });
    }

    assert.equal(url.pathname, '/timezoneJSON');
    return jsonResponse({ timezoneId: 'Asia/Shanghai' });
  });
  const provider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation
  });

  const candidate = (await provider.search('Shanghai', 'en'))[0];
  await provider.resolve(candidate.candidateId, 'en');

  assert.equal(GEONAMES_API_ORIGIN, 'https://secure.geonames.org');
  assert.deepEqual(
    calls.map(({ url }) => ({ origin: url.origin, pathname: url.pathname })),
    [
      { origin: 'https://secure.geonames.org', pathname: '/searchJSON' },
      { origin: 'https://secure.geonames.org', pathname: '/timezoneJSON' }
    ]
  );
  assert.equal(calls.every(({ url }) => url.protocol === 'https:'), true);
});

test('GeoNames locale mapping remains exactly the approved seven-locale set', async () => {
  const { calls, fetchImplementation } = createFetch(() => jsonResponse({ geonames: [] }));
  const provider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation
  });

  for (const [locale, language] of Object.entries(GEONAMES_LOCALE_LANGUAGE)) {
    await provider.search('place', locale);
    assert.equal(calls.at(-1).url.searchParams.get('lang'), language);
  }

  assert.deepEqual(Object.keys(GEONAMES_LOCALE_LANGUAGE), [
    'en',
    'es',
    'fr',
    'de',
    'ja',
    'ko',
    'zh-Hant'
  ]);
  assert.equal('zh-Hans' in GEONAMES_LOCALE_LANGUAGE, false);
});

test('canonical display formatting preserves diacritics and removes duplicate labels', () => {
  assert.equal(
    formatCanonicalDisplayName(['München', 'München', 'Deutschland']),
    'München, Deutschland'
  );
  assert.equal(
    formatCanonicalDisplayName(['Los Ángeles', 'California', 'United States']),
    'Los Ángeles, California, United States'
  );
});

test('timezone resolution uses timezoneId only and keeps Shanghai and Los Angeles coordinates authoritative', async () => {
  const { calls, fetchImplementation } = createFetch((url) => {
    if (url.pathname === '/searchJSON') {
      return url.searchParams.get('q') === 'Los Angeles'
        ? jsonResponse({
            geonames: [populatedPlace({
              geonameId: 2,
              name: 'Los Angeles',
              adminName1: 'California',
              countryName: 'United States',
              countryCode: 'US',
              lat: '34.0522',
              lng: '-118.2437'
            })]
          })
        : jsonResponse({ geonames: [populatedPlace()] });
    }

    assert.equal(url.pathname, '/timezoneJSON');
    const timezone = url.searchParams.get('lat') === '31.2304'
      ? 'Asia/Shanghai'
      : 'America/Los_Angeles';
    return jsonResponse({
      timezoneId: timezone,
      rawOffset: 8,
      gmtOffset: 8,
      dstOffset: 8
    });
  });
  const provider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation
  });

  const shanghai = (await provider.search('Shanghai', 'en'))[0];
  const resolvedShanghai = await provider.resolve(shanghai.candidateId, 'en');
  assert.equal(resolvedShanghai.ianaTimeZone, 'Asia/Shanghai');
  assert.deepEqual(resolvedShanghai.coordinates, shanghai.coordinates);
  assert.equal('rawOffset' in resolvedShanghai, false);
  assert.equal('gmtOffset' in resolvedShanghai, false);
  assert.equal('dstOffset' in resolvedShanghai, false);

  const losAngeles = (await provider.search('Los Angeles', 'en'))[0];
  const resolvedLosAngeles = await provider.resolve(losAngeles.candidateId, 'en');
  assert.equal(resolvedLosAngeles.ianaTimeZone, 'America/Los_Angeles');
  assert.equal(calls.length, 4);
});

test('no results, unknown candidates, locale mismatch, invalid timezone, and malformed records fail closed', async () => {
  const emptyProvider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation: async () => jsonResponse({ geonames: [] })
  });
  assert.deepEqual(await emptyProvider.search('nowhere', 'en'), []);
  assert.equal(await emptyProvider.resolve('not-issued', 'en'), null);

  let resolveCalls = 0;
  const serviceCandidate = {
    candidateId: 'candidate-1',
    canonicalDisplayName: 'Shanghai, China',
    locality: 'Shanghai',
    region: 'Shanghai',
    country: 'China',
    countryCode: 'CN',
    coordinates: { latitude: 31.2304, longitude: 121.4737 },
    authority: {
      kind: 'GEOCODING',
      sourceId: 'test-provider',
      recordId: 'candidate-1'
    },
    source: { sourceVersion: 'test-v1', datasetVersion: null }
  };
  const service = new ProviderLocationResolutionService({
    async search() {
      return [serviceCandidate];
    },
    async resolve() {
      resolveCalls += 1;
      return null;
    }
  });
  const serviceSearch = await service.search({ query: 'place', locale: 'en' });
  assert.equal(serviceSearch.state, 'CANDIDATES');
  assert.deepEqual(
    await service.resolve({ candidateId: 'candidate-1', locale: 'zh-Hant' }),
    { state: 'UNRESOLVED' }
  );
  assert.equal(resolveCalls, 0);
  assert.deepEqual(
    await service.resolve({ candidateId: 'browser-invented', locale: 'en' }),
    { state: 'UNRESOLVED' }
  );

  const malformedProvider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation: async () => jsonResponse({
      geonames: [populatedPlace({ lat: 'not-a-coordinate' })]
    })
  });
  await assert.rejects(
    malformedProvider.search('broken', 'en'),
    InvalidLocationProviderDataError
  );

  const invalidTimezoneProvider = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation: async (input) => input.pathname === '/searchJSON'
      ? jsonResponse({ geonames: [populatedPlace()] })
      : jsonResponse({ timezoneId: 'UTC+8' })
  });
  const invalidCandidate = (await invalidTimezoneProvider.search('Shanghai', 'en'))[0];
  await assert.rejects(
    invalidTimezoneProvider.resolve(invalidCandidate.candidateId, 'en'),
    InvalidLocationProviderDataError
  );
});

test('provider HTTP and GeoNames status errors are generic unavailable failures', async () => {
  const httpFailure = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation: async () => jsonResponse({}, 503)
  });
  await assert.rejects(
    httpFailure.search('place', 'en'),
    LocationResolutionProviderUnavailableError
  );

  const apiFailure = new GeoNamesWebProvider({
    username: 'test_account',
    fetchImplementation: async () => jsonResponse({
      status: { message: 'account details must not escape', value: 10 }
    })
  });
  await assert.rejects(
    apiFailure.search('place', 'en'),
    LocationResolutionProviderUnavailableError
  );
});

test('provider request timeout aborts without retries', async () => {
  let calls = 0;
  const provider = new GeoNamesWebProvider({
    username: 'test_account',
    requestTimeoutMs: 5,
    fetchImplementation: async (_input, init) => {
      calls += 1;
      await new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      });
    }
  });

  await assert.rejects(
    provider.search('place', 'en'),
    LocationResolutionProviderUnavailableError
  );
  assert.equal(calls, 1);
});

test('GeoNames configuration is optional, validated, and server-only', () => {
  assert.equal(isValidGeoNamesUsername('test_account'), true);
  assert.equal(isValidGeoNamesUsername('test account'), false);
  assert.equal(isValidGeoNamesUsername(''), false);
  assert.equal(
    parseServerEnvironment(serverEnvironment()).serverRuntimeConfig.locationResolution
      .geonamesUsername,
    null
  );
  assert.equal(
    parseServerEnvironment(serverEnvironment({ GEONAMES_USERNAME: 'test_account' }))
      .serverRuntimeConfig.locationResolution.geonamesUsername,
    'test_account'
  );
  assert.throws(
    () => parseServerEnvironment(serverEnvironment({ GEONAMES_USERNAME: 'test account' })),
    /Invalid GeoNames username environment variable: GEONAMES_USERNAME/u
  );
});

test('runtime service factory remains provider-neutral and source contains no raw logging sink or offset promotion', () => {
  const source = readFileSync(
    new URL('../src/location-resolution/geonames-web-provider.ts', import.meta.url),
    'utf8'
  );
  assert.equal(typeof createGeoNamesLocationResolutionService, 'function');
  assert.doesNotMatch(source, /console\.(log|warn|error)\s*\(/u);
  assert.doesNotMatch(source, /rawOffset|gmtOffset|dstOffset/u);
});
