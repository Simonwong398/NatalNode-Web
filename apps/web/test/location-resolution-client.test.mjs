import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  FetchLocationResolutionClient,
  LocationResolutionClientError
} from '../dist/location-resolution-client-characterization/features/chart-input/location-resolution-client.js';

const candidate = {
  candidateId: 'candidate-1',
  canonicalDisplayName: '上海, 中国',
  locality: '上海',
  region: '上海',
  country: '中国',
  countryCode: 'CN',
  coordinates: { latitude: 31.2304, longitude: 121.4737 },
  authority: {
    kind: 'GEOCODING',
    sourceId: 'geonames-free-web-services',
    recordId: 'candidate-1'
  },
  source: {
    sourceVersion: 'geonames-free-web-services-v1',
    datasetVersion: null,
    attribution: { label: 'GeoNames', url: 'https://www.geonames.org/' }
  }
};

const location = {
  resolutionId: 'resolution-1',
  canonicalDisplayName: candidate.canonicalDisplayName,
  locality: candidate.locality,
  region: candidate.region,
  country: candidate.country,
  countryCode: candidate.countryCode,
  coordinates: candidate.coordinates,
  ianaTimeZone: 'Asia/Shanghai',
  status: 'RESOLVED',
  authority: candidate.authority,
  source: candidate.source
};

function createFetch(payloadByPath, status = 200) {
  const calls = [];
  const fetchImplementation = async (input, init) => {
    calls.push({ input: String(input), init });
    const path = new URL(input, 'https://natalnode.test').pathname;
    return new Response(JSON.stringify(payloadByPath[path]), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return { calls, fetchImplementation };
}

test('browser client uses same-origin BFF routes and strips unknown response fields', async () => {
  const { calls, fetchImplementation } = createFetch({
    '/api/location/search': {
      state: 'CANDIDATES',
      candidates: [{ ...candidate, geonameId: 1_796_236 }]
    },
    '/api/location/resolve': {
      state: 'RESOLVED',
      location: { ...location, rawOffset: 8, gmtOffset: 8, dstOffset: 8 }
    }
  });
  const client = new FetchLocationResolutionClient(fetchImplementation);

  const search = await client.search({ query: '上海', locale: 'zh-Hant' });
  assert.equal(search.state, 'CANDIDATES');
  assert.deepEqual(search.candidates[0], candidate);
  assert.equal('geonameId' in search.candidates[0], false);
  assert.equal(calls[0].input, '/api/location/search');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    query: '上海',
    locale: 'zh-Hant'
  });

  const resolved = await client.resolve({
    candidateId: candidate.candidateId,
    locale: 'zh-Hant'
  });
  assert.deepEqual(resolved, location);
  assert.equal('rawOffset' in resolved, false);
  assert.equal(calls[1].input, '/api/location/resolve');
});

test('browser client handles an explicit unresolved response and generic failures', async () => {
  const unresolved = new FetchLocationResolutionClient(
    async () => new Response(JSON.stringify({ state: 'UNRESOLVED', candidates: [] }))
  );
  assert.equal(
    (await unresolved.search({ query: 'nowhere', locale: 'en' })).state,
    'UNRESOLVED'
  );
  assert.equal(
    await unresolved.resolve({ candidateId: 'missing', locale: 'en' }),
    null
  );

  const failing = new FetchLocationResolutionClient(
    async () => new Response(JSON.stringify({ message: 'provider secret' }), { status: 503 })
  );
  await assert.rejects(
    failing.search({ query: 'place', locale: 'en' }),
    (error) => {
      assert.equal(error instanceof LocationResolutionClientError, true);
      assert.equal(error.message, 'Location resolution is unavailable.');
      assert.equal(error.message.includes('provider secret'), false);
      return true;
    }
  );
});

test('client and hook stay provider-neutral and support stale-request cancellation', () => {
  const clientSource = readFileSync(
    new URL('../src/features/chart-input/location-resolution-client.ts', import.meta.url),
    'utf8'
  );
  const hookSource = readFileSync(
    new URL('../src/features/chart-input/useLocationResolution.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(clientSource, /geonames|rawOffset|gmtOffset|dstOffset/iu);
  assert.match(hookSource, /LOCATION_SEARCH_DEBOUNCE_MS/u);
  assert.match(hookSource, /AbortController/u);
  assert.match(hookSource, /requestSequenceRef/u);
  assert.match(hookSource, /setTimeout/u);
});
