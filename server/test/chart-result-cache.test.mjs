import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ChartResultCache,
  DEFAULT_CHART_RESULT_CACHE_MAX_ENTRIES
} from '../dist/app/cache/chart-result-cache.js';
import {
  CACHE_FORMAT_VERSION,
  createCanonicalChartInputJson,
  createChartResultCacheKey
} from '../dist/app/cache/chart-result-cache-key.js';

const BASE_REQUEST = {
  birth: {
    localDate: '1990-01-02',
    localTime: '12:34',
    locationLabel: 'Unique private place label',
    latitude: 12.345678901234567,
    longitude: -45.67890123456789,
    ianaTimeZone: 'America/New_York',
    resolvedUtcInstant: '1990-01-02T17:34:00.000Z',
    utcOffsetSeconds: -18_000,
    timezoneDatabaseVersion: 'tzdb-test-v1',
    timezoneResolutionMethod: 'fixture-exact',
    ambiguityStatus: 'EXACT'
  },
  houseSystem: 'Placidus'
};

const BASE_IDENTITY = {
  runtimeNamespace: 'development-mock',
  engineResultGeneration: 'UI_FIXTURE_V1',
  chartResultContractVersion: '1.0.0'
};

function createRequest(overrides = {}) {
  return {
    birth: {
      ...BASE_REQUEST.birth,
      ...(overrides.birth ?? {})
    },
    houseSystem: overrides.houseSystem ?? BASE_REQUEST.houseSystem
  };
}

function createUnknownTimeRequest() {
  return createRequest({
    birth: {
      localTime: null,
      resolvedUtcInstant: null,
      utcOffsetSeconds: null,
      ambiguityStatus: 'UNKNOWN_TIME'
    }
  });
}

function createChartResult(engineVersion = 'UI_FIXTURE_V1') {
  return {
    calculationStatus: 'INCOMPLETE_RESEARCH',
    schemaVersion: '1.0.0',
    engineVersion,
    bodies: [
      {
        bodyId: 'Sun',
        longitude: 45.25,
        sign: 'Taurus',
        house: 11,
        retrograde: false
      }
    ],
    angles: [],
    houses: null,
    aspects: [],
    warnings: [
      {
        code: 'UI_DEVELOPMENT_ONLY',
        message: 'UI DEVELOPMENT ONLY',
        severity: 'WARNING'
      }
    ],
    metadata: {
      configurationStatus: 'INCOMPLETE_RESEARCH',
      astronomyConfigurationId: null,
      provenanceEnvelopeId: null,
      reason: 'INCOMPLETE_RESEARCH'
    }
  };
}

function createFakeClock(initialTimestamp = '2026-01-01T00:00:00.000Z') {
  let nowMs = Date.parse(initialTimestamp);

  return {
    clock: {
      now() {
        return new Date(nowMs).toISOString();
      }
    },
    advance(milliseconds) {
      nowMs += milliseconds;
    }
  };
}

function createCache(clock, overrides = {}) {
  return new ChartResultCache({
    ...BASE_IDENTITY,
    clock,
    ...overrides
  });
}

function restoreGlobalProperty(name, descriptor) {
  Object.defineProperty(globalThis, name, descriptor);
}

test('canonical input is explicit, deterministic, and uses the frozen field order', () => {
  const request = createRequest();
  const canonicalJson = createCanonicalChartInputJson(request);
  const canonicalValue = JSON.parse(canonicalJson);

  assert.deepEqual(Object.keys(canonicalValue), [
    'localDate',
    'localTime',
    'latitude',
    'longitude',
    'ianaTimeZone',
    'resolvedUtcInstant',
    'utcOffsetSeconds',
    'timezoneDatabaseVersion',
    'timezoneResolutionMethod',
    'ambiguityStatus',
    'houseSystem'
  ]);
  assert.equal(
    canonicalJson,
    createCanonicalChartInputJson(createRequest())
  );

  const firstKey = createChartResultCacheKey(request, BASE_IDENTITY);
  const secondKey = createChartResultCacheKey(createRequest(), BASE_IDENTITY);

  assert.equal(firstKey, secondKey);
  assert.match(
    firstKey,
    /^v1:development-mock:UI_FIXTURE_V1:1\.0\.0:[0-9a-f]{64}$/u
  );
});

test('each frozen calculation field changes the key while locationLabel does not', () => {
  const baseKey = createChartResultCacheKey(BASE_REQUEST, BASE_IDENTITY);
  const variants = [
    { birth: { localDate: '1990-01-03' } },
    { birth: { localTime: '12:35' } },
    { birth: { latitude: 12.3456789012345 } },
    { birth: { longitude: -45.67890123456788 } },
    { birth: { ianaTimeZone: 'Europe/London' } },
    { birth: { resolvedUtcInstant: '1990-01-02T17:35:00.000Z' } },
    { birth: { utcOffsetSeconds: -14_400 } },
    { birth: { timezoneDatabaseVersion: 'tzdb-test-v2' } },
    { birth: { timezoneResolutionMethod: 'fixture-other' } },
    { birth: { ambiguityStatus: 'AMBIGUOUS' } },
    { houseSystem: 'Whole Sign' }
  ];

  for (const variant of variants) {
    assert.notEqual(
      createChartResultCacheKey(createRequest(variant), BASE_IDENTITY),
      baseKey
    );
  }

  assert.equal(
    createChartResultCacheKey(
      createRequest({ birth: { locationLabel: 'A different label' } }),
      BASE_IDENTITY
    ),
    baseKey
  );
});

test('known and unknown birth time produce different keys', () => {
  assert.notEqual(
    createChartResultCacheKey(BASE_REQUEST, BASE_IDENTITY),
    createChartResultCacheKey(createUnknownTimeRequest(), BASE_IDENTITY)
  );
});

test('negative zero normalizes to numeric zero without other numeric transformation', () => {
  const request = createRequest({
    birth: {
      latitude: -0,
      longitude: -0,
      utcOffsetSeconds: -0
    }
  });
  const canonicalValue = JSON.parse(createCanonicalChartInputJson(request));

  assert.equal(canonicalValue.latitude, 0);
  assert.equal(canonicalValue.longitude, 0);
  assert.equal(canonicalValue.utcOffsetSeconds, 0);
  assert.equal(Object.is(canonicalValue.latitude, -0), false);
  assert.equal(Object.is(canonicalValue.longitude, -0), false);
  assert.equal(Object.is(canonicalValue.utcOffsetSeconds, -0), false);
  assert.equal(canonicalValue.localDate, BASE_REQUEST.birth.localDate);
  assert.equal(canonicalValue.ianaTimeZone, BASE_REQUEST.birth.ianaTimeZone);
});

test('finite numeric values retain exact ECMAScript representation', () => {
  const canonicalValue = JSON.parse(
    createCanonicalChartInputJson(BASE_REQUEST)
  );

  assert.equal(canonicalValue.latitude, BASE_REQUEST.birth.latitude);
  assert.equal(canonicalValue.longitude, BASE_REQUEST.birth.longitude);
  assert.equal(
    canonicalValue.utcOffsetSeconds,
    BASE_REQUEST.birth.utcOffsetSeconds
  );
});

test('non-finite canonical numbers fail closed before JSON serialization', () => {
  for (const field of ['latitude', 'longitude']) {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.throws(
        () =>
          createCanonicalChartInputJson(
            createRequest({ birth: { [field]: value } })
          ),
        /must be a finite number/u
      );
    }
  }

  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () =>
        createCanonicalChartInputJson(
          createRequest({ birth: { utcOffsetSeconds: value } })
        ),
      /must be a finite number/u
    );
  }
});

test('canonical serialization does not depend on locale formatting', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    Number.prototype,
    'toLocaleString'
  );
  assert.ok(descriptor);

  try {
    Object.defineProperty(Number.prototype, 'toLocaleString', {
      ...descriptor,
      value() {
        throw new Error('locale formatting must not be used');
      }
    });

    assert.equal(
      createCanonicalChartInputJson(BASE_REQUEST),
      createCanonicalChartInputJson(createRequest())
    );
  } finally {
    restoreGlobalProperty('toLocaleString', descriptor);
  }
});

test('final hashed key contains no raw birth data', () => {
  const key = createChartResultCacheKey(BASE_REQUEST, BASE_IDENTITY);

  for (const rawValue of [
    BASE_REQUEST.birth.localDate,
    BASE_REQUEST.birth.localTime,
    BASE_REQUEST.birth.latitude.toString(),
    BASE_REQUEST.birth.longitude.toString(),
    BASE_REQUEST.birth.ianaTimeZone,
    BASE_REQUEST.birth.resolvedUtcInstant,
    BASE_REQUEST.birth.timezoneDatabaseVersion,
    BASE_REQUEST.birth.timezoneResolutionMethod,
    BASE_REQUEST.birth.locationLabel
  ]) {
    assert.equal(key.includes(rawValue), false);
  }
});

test('version and isolation dimensions change the key family', () => {
  const baseKey = createChartResultCacheKey(BASE_REQUEST, BASE_IDENTITY);

  assert.equal(CACHE_FORMAT_VERSION, 'v1');
  assert.notEqual(
    createChartResultCacheKey(BASE_REQUEST, {
      ...BASE_IDENTITY,
      runtimeNamespace: 'production'
    }),
    baseKey
  );
  assert.notEqual(
    createChartResultCacheKey(BASE_REQUEST, {
      ...BASE_IDENTITY,
      engineResultGeneration: 'engine-generation-2'
    }),
    baseKey
  );
  assert.notEqual(
    createChartResultCacheKey(BASE_REQUEST, {
      ...BASE_IDENTITY,
      chartResultContractVersion: '2.0.0'
    }),
    baseKey
  );
  assert.notEqual(
    createChartResultCacheKey(BASE_REQUEST, {
      ...BASE_IDENTITY,
      runtimeNamespace: 'production'
    }),
    createChartResultCacheKey(BASE_REQUEST, {
      ...BASE_IDENTITY,
      runtimeNamespace: 'development-mock'
    })
  );
});

test('identity components reject cache-key delimiter ambiguity', () => {
  for (const name of [
    'runtimeNamespace',
    'engineResultGeneration',
    'chartResultContractVersion'
  ]) {
    assert.throws(
      () =>
        createChartResultCacheKey(BASE_REQUEST, {
          ...BASE_IDENTITY,
          [name]: 'left:right'
        }),
      new RegExp(`${name}.*cache key delimiter`, 'u')
    );
  }
});

test('identity components reject control and line-separator characters', () => {
  for (const name of [
    'runtimeNamespace',
    'engineResultGeneration',
    'chartResultContractVersion'
  ]) {
    for (const value of ['generation\nnext', 'generation\u2028next']) {
      assert.throws(
        () =>
          createChartResultCacheKey(BASE_REQUEST, {
            ...BASE_IDENTITY,
            [name]: value
          }),
        new RegExp(`${name}.*control characters`, 'u')
      );
    }
  }
});

test('cache starts with a miss and returns cloned values after set', () => {
  const { clock } = createFakeClock();
  const cache = createCache(clock);
  const request = createRequest();
  const result = createChartResult();

  assert.deepEqual(cache.lookup(request), { status: 'miss' });
  assert.deepEqual(cache.store(request, result), { status: 'stored' });

  result.bodies[0].longitude = 999;
  const firstLookup = cache.lookup(request);
  assert.equal(firstLookup.status, 'hit');
  const firstHit = firstLookup.value;

  assert.equal(firstHit.bodies[0].longitude, 45.25);
  firstHit.bodies[0].longitude = 888;

  const secondLookup = cache.lookup(request);
  assert.equal(secondLookup.status, 'hit');
  const secondHit = secondLookup.value;
  assert.equal(secondHit.bodies[0].longitude, 45.25);
  assert.notStrictEqual(secondHit, firstHit);
});

test('a hit updates LRU recency without extending fixed TTL', () => {
  const fakeClock = createFakeClock();
  const cache = createCache(fakeClock.clock, {
    maxEntries: 2,
    ttlMs: 1_000
  });
  const firstRequest = createRequest();
  const secondRequest = createRequest({ birth: { localDate: '1990-01-03' } });
  const thirdRequest = createRequest({ birth: { localDate: '1990-01-04' } });

  cache.set(firstRequest, createChartResult());
  cache.set(secondRequest, createChartResult());
  fakeClock.advance(900);
  assert.ok(cache.get(firstRequest));
  fakeClock.advance(100);
  assert.equal(cache.get(firstRequest), undefined);

  const lruClock = createFakeClock();
  const lruCache = createCache(lruClock.clock, { maxEntries: 2 });
  lruCache.set(firstRequest, createChartResult());
  lruCache.set(secondRequest, createChartResult());
  assert.ok(lruCache.get(firstRequest));
  lruCache.set(thirdRequest, createChartResult());

  assert.equal(lruCache.get(secondRequest), undefined);
  assert.ok(lruCache.get(firstRequest));
  assert.ok(lruCache.get(thirdRequest));
});

test('expired requested entries are removed and set sweeps expired entries', () => {
  const fakeClock = createFakeClock();
  const cache = createCache(fakeClock.clock, {
    maxEntries: 2,
    ttlMs: 1_000
  });
  const firstRequest = createRequest();
  const secondRequest = createRequest({ birth: { localDate: '1990-01-03' } });
  const thirdRequest = createRequest({ birth: { localDate: '1990-01-04' } });
  const fourthRequest = createRequest({ birth: { localDate: '1990-01-05' } });

  cache.set(firstRequest, createChartResult());
  cache.set(secondRequest, createChartResult());
  fakeClock.advance(1_001);

  assert.equal(cache.get(firstRequest), undefined);
  cache.set(thirdRequest, createChartResult());
  cache.set(fourthRequest, createChartResult());

  assert.ok(cache.get(thirdRequest));
  assert.ok(cache.get(fourthRequest));
});

test('overwriting a key keeps one entry and begins a new fixed TTL', () => {
  const fakeClock = createFakeClock();
  const cache = createCache(fakeClock.clock, {
    maxEntries: 1,
    ttlMs: 1_000
  });
  const request = createRequest();

  cache.set(request, createChartResult());
  fakeClock.advance(900);
  cache.set(request, createChartResult('UI_FIXTURE_V1_REPLACED'));
  fakeClock.advance(900);

  assert.equal(cache.get(request).engineVersion, 'UI_FIXTURE_V1_REPLACED');
  fakeClock.advance(100);
  assert.equal(cache.get(request), undefined);
});

test('capacity is hard-bounded and deterministic LRU eviction is used', () => {
  const fakeClock = createFakeClock();
  const cache = createCache(fakeClock.clock, { maxEntries: 2 });
  const requests = [
    createRequest(),
    createRequest({ birth: { localDate: '1990-01-03' } }),
    createRequest({ birth: { localDate: '1990-01-04' } })
  ];

  cache.set(requests[0], createChartResult());
  cache.set(requests[1], createChartResult());
  cache.set(requests[2], createChartResult());

  assert.equal(cache.get(requests[0]), undefined);
  assert.ok(cache.get(requests[1]));
  assert.ok(cache.get(requests[2]));
});

test('a new cache instance starts empty', () => {
  const fakeClock = createFakeClock();
  const firstCache = createCache(fakeClock.clock);
  const secondCache = createCache(fakeClock.clock);
  const request = createRequest();

  firstCache.set(request, createChartResult());
  assert.ok(firstCache.get(request));
  assert.equal(secondCache.get(request), undefined);
});

test('constructor rejects invalid identity, TTL, capacity, and Clock configuration', () => {
  const invalidIdentityCases = [
    ['runtimeNamespace', { runtimeNamespace: '' }],
    ['engineResultGeneration', { engineResultGeneration: '   ' }],
    ['chartResultContractVersion', { chartResultContractVersion: '' }]
  ];

  for (const [name, override] of invalidIdentityCases) {
    assert.throws(
      () => createCache(createFakeClock().clock, override),
      new RegExp(`${name}.*non-empty bounded string`, 'u')
    );
  }

  for (const ttlMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
    assert.throws(
      () => createCache(createFakeClock().clock, { ttlMs }),
      /TTL.*positive safe integer/u
    );
  }

  for (const maxEntries of [0, -1, Number.NaN, 1.5]) {
    assert.throws(
      () => createCache(createFakeClock().clock, { maxEntries }),
      /capacity.*positive safe integer/u
    );
  }

  assert.throws(
    () =>
      createCache(createFakeClock().clock, {
        maxEntries: DEFAULT_CHART_RESULT_CACHE_MAX_ENTRIES + 1
      }),
    /capacity must not exceed 512/u
  );

  const invalidClockCache = createCache({ now: () => 'not-a-timestamp' });
  assert.throws(
    () => invalidClockCache.get(createRequest()),
    /Clock returned an invalid timestamp/u
  );
});

test('clone-on-store failure leaves existing cache state intact', () => {
  const { clock } = createFakeClock();
  const cache = createCache(clock);
  const request = createRequest();
  const original = createChartResult();

  cache.set(request, original);
  const unserializableResult = {
    ...createChartResult(),
    unsupported: () => undefined
  };

  assert.deepEqual(cache.store(request, unserializableResult), {
    status: 'error'
  });
  assert.equal(cache.get(request).bodies[0].longitude, 45.25);
});

test('clone-on-read failure evicts the entry and exposes no internal object', () => {
  const { clock } = createFakeClock();
  const cache = createCache(clock);
  const request = createRequest();

  cache.set(request, createChartResult());
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'structuredClone'
  );
  assert.ok(descriptor);

  try {
    Object.defineProperty(globalThis, 'structuredClone', {
      ...descriptor,
      value() {
        throw new Error('simulated clone failure');
      }
    });

    assert.deepEqual(cache.lookup(request), { status: 'error' });
  } finally {
    restoreGlobalProperty('structuredClone', descriptor);
  }

  assert.equal(cache.get(request), undefined);
});

test('constructing the cache does not create background timers', () => {
  const intervalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'setInterval'
  );
  const timeoutDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'setTimeout'
  );
  let timerCalls = 0;

  try {
    Object.defineProperty(globalThis, 'setInterval', {
      ...intervalDescriptor,
      value() {
        timerCalls += 1;
        throw new Error('background interval is prohibited');
      }
    });
    Object.defineProperty(globalThis, 'setTimeout', {
      ...timeoutDescriptor,
      value() {
        timerCalls += 1;
        throw new Error('background timeout is prohibited');
      }
    });

    createCache(createFakeClock().clock);
  } finally {
    restoreGlobalProperty('setInterval', intervalDescriptor);
    restoreGlobalProperty('setTimeout', timeoutDescriptor);
  }

  assert.equal(timerCalls, 0);
});
