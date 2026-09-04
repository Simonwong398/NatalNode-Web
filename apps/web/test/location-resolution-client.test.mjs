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
  assert.deepEqual(Object.keys(calls[0].init.headers).sort(), [
    'Accept',
    'Content-Type'
  ]);
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

test('client emits safe lifecycle diagnostics for accepted search and resolve responses', async () => {
  const { fetchImplementation } = createFetch({
    '/api/location/search': {
      state: 'CANDIDATES',
      candidates: [candidate]
    },
    '/api/location/resolve': {
      state: 'RESOLVED',
      location
    }
  });
  const client = new FetchLocationResolutionClient(fetchImplementation);
  const searchEvents = [];

  await client.search(
    { query: '上海', locale: 'zh-Hant' },
    undefined,
    (event) => searchEvents.push(event)
  );

  assert.deepEqual(
    searchEvents.map(({ stage }) => stage),
    ['REQUEST_STARTED', 'RESPONSE_RECEIVED', 'RESPONSE_PARSED', 'CANDIDATES_ACCEPTED']
  );
  assert.deepEqual(searchEvents.at(-1), {
    stage: 'CANDIDATES_ACCEPTED',
    errorKind: 'NONE',
    httpStatus: 200,
    candidateCount: 1
  });

  const resolveEvents = [];
  await client.resolve(
    { candidateId: candidate.candidateId, locale: 'zh-Hant' },
    undefined,
    (event) => resolveEvents.push(event)
  );

  assert.deepEqual(
    resolveEvents.map(({ stage }) => stage),
    ['RESOLVE_STARTED', 'RESOLVE_RECEIVED', 'RESPONSE_PARSED', 'RESOLVED_ACCEPTED']
  );
  assert.deepEqual(resolveEvents.at(-1), {
    stage: 'RESOLVED_ACCEPTED',
    errorKind: 'NONE',
    httpStatus: 200
  });
  assert.deepEqual(
    Object.keys(searchEvents[0]).sort(),
    [
      'errorKind',
      'httpStatus',
      'requestOrigin',
      'requestTarget',
      'signalStateAtDispatch',
      'stage'
    ]
  );
  assert.doesNotMatch(
    JSON.stringify([...searchEvents, ...resolveEvents]),
    /上海|31\.2304|121\.4737|candidate-1|Asia\/Shanghai/iu
  );
});

test('client captures non-2xx HTTP status before rejecting without parsing the body', async () => {
  for (const status of [503, 403]) {
    const events = [];
    const client = new FetchLocationResolutionClient(
      async () =>
        new Response(JSON.stringify({ message: 'provider secret' }), {
          status,
          headers: { 'Content-Type': 'application/json' }
        })
    );

    await assert.rejects(
      client.search(
        { query: 'place', locale: 'en' },
        undefined,
        (event) => events.push(event)
      ),
      (error) => {
        assert.equal(error instanceof LocationResolutionClientError, true);
        assert.equal(error.kind, 'HTTP_ERROR');
        assert.equal(error.stage, 'HTTP_FAILED');
        assert.equal(error.httpStatus, status);
        assert.equal(error.message, 'Location resolution is unavailable.');
        return true;
      }
    );

    assert.deepEqual(
      events.map(({ stage }) => stage),
      ['REQUEST_STARTED', 'RESPONSE_RECEIVED', 'HTTP_FAILED']
    );
    assert.equal(events[1].httpStatus, status);
    assert.equal(events[2].httpStatus, status);
  }
});

test('client distinguishes invalid JSON from a valid JSON contract failure', async () => {
  const jsonEvents = [];
  const invalidJsonClient = new FetchLocationResolutionClient(
    async () => new Response('{not-json', { status: 200 })
  );

  await assert.rejects(
    invalidJsonClient.search(
      { query: 'place', locale: 'en' },
      undefined,
      (event) => jsonEvents.push(event)
    ),
    (error) => {
      assert.equal(error.kind, 'RESPONSE_JSON_ERROR');
      assert.equal(error.stage, 'JSON_PARSE_FAILED');
      assert.equal(error.httpStatus, 200);
      return true;
    }
  );
  assert.deepEqual(
    jsonEvents.map(({ stage }) => stage),
    ['REQUEST_STARTED', 'RESPONSE_RECEIVED', 'JSON_PARSE_FAILED']
  );

  const contractEvents = [];
  const invalidContractClient = new FetchLocationResolutionClient(
    async () =>
      new Response(
        JSON.stringify({ state: 'CANDIDATES', candidates: [{ candidateId: 'invalid' }] }),
        { status: 200 }
      )
  );

  await assert.rejects(
    invalidContractClient.search(
      { query: 'place', locale: 'en' },
      undefined,
      (event) => contractEvents.push(event)
    ),
    (error) => {
      assert.equal(error.kind, 'CLIENT_CONTRACT_ERROR');
      assert.equal(error.stage, 'CONTRACT_PARSE_FAILED');
      assert.equal(error.httpStatus, 200);
      return true;
    }
  );
  assert.deepEqual(
    contractEvents.map(({ stage }) => stage),
    ['REQUEST_STARTED', 'RESPONSE_RECEIVED', 'RESPONSE_PARSED', 'CONTRACT_PARSE_FAILED']
  );
});

test('client distinguishes network rejection and abort without exposing rejection details', async () => {
  const networkEvents = [];
  const networkClient = new FetchLocationResolutionClient(async () => {
    throw new Error('private network detail');
  });

  await assert.rejects(
    networkClient.search(
      { query: 'place', locale: 'en' },
      undefined,
      (event) => networkEvents.push(event)
    ),
    (error) => {
      assert.equal(error.kind, 'NETWORK_ERROR');
      assert.equal(error.stage, 'NETWORK_FAILED');
      assert.equal(error.httpStatus, null);
      assert.equal(error.message, 'Location resolution is unavailable.');
      assert.equal(error.message.includes('private network detail'), false);
      return true;
    }
  );
  assert.deepEqual(
    networkEvents.map(({ stage }) => stage),
    ['REQUEST_STARTED', 'NETWORK_FAILED']
  );

  const abortEvents = [];
  const abortClient = new FetchLocationResolutionClient(async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  });

  await assert.rejects(
    abortClient.search(
      { query: 'place', locale: 'en' },
      undefined,
      (event) => abortEvents.push(event)
    ),
    (error) => {
      assert.equal(error.name, 'AbortError');
      return true;
    }
  );
  assert.deepEqual(
    abortEvents.map(({ stage }) => stage),
    ['REQUEST_STARTED', 'ABORTED']
  );
});

test('client binds the browser fetch receiver before dispatch', async () => {
  let receiver;
  const client = new FetchLocationResolutionClient(function nativeLikeFetch() {
    receiver = this;
    return Promise.resolve(
      new Response(JSON.stringify({ state: 'UNRESOLVED', candidates: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  await client.search({ query: 'place', locale: 'en' });

  assert.equal(receiver, globalThis);
});

test('client reports safe browser exception, signal, origin, and target metadata', async () => {
  const networkEvents = [];
  const networkClient = new FetchLocationResolutionClient(async () => {
    throw new TypeError('private browser transport detail');
  });

  await assert.rejects(
    networkClient.search(
      { query: 'place', locale: 'en' },
      undefined,
      (event) => networkEvents.push(event)
    ),
    /Location resolution is unavailable/u
  );

  assert.deepEqual(networkEvents.at(-1), {
    stage: 'NETWORK_FAILED',
    errorKind: 'NETWORK_ERROR',
    httpStatus: null,
    fetchExceptionName: 'TypeError',
    signalStateAtDispatch: 'ACTIVE',
    requestOrigin: 'NO_ORIGIN',
    requestTarget: 'SEARCH'
  });
  assert.doesNotMatch(JSON.stringify(networkEvents), /private browser transport detail/u);

  const abortController = new AbortController();
  abortController.abort();
  const abortEvents = [];
  const abortClient = new FetchLocationResolutionClient(async () => {
    throw new DOMException('aborted', 'AbortError');
  });

  await assert.rejects(
    abortClient.resolve(
      { candidateId: 'candidate-1', locale: 'en' },
      abortController.signal,
      (event) => abortEvents.push(event)
    ),
    (error) => error.name === 'AbortError'
  );

  assert.deepEqual(abortEvents.at(-1), {
    stage: 'ABORTED',
    errorKind: 'ABORTED',
    httpStatus: null,
    fetchExceptionName: 'AbortError',
    signalStateAtDispatch: 'ABORTED',
    requestOrigin: 'NO_ORIGIN',
    requestTarget: 'RESOLVE'
  });
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
