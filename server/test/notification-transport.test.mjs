import assert from 'node:assert/strict';
import { createECDH } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';

import {
  createWebPushCapability,
  createWebPushTransport,
  createWebPushVapidReadiness,
  isValidWebPushVapidPrivateKey,
  isValidWebPushVapidSubject
} from '../dist/notification-platform/index.js';
import { parseServerEnvironment } from '../dist/runtime/index.js';

const webpush = createRequire(import.meta.url)('web-push');

function createVapidConfiguration(subject = 'mailto:notifications@natalnode.example') {
  const curve = createECDH('prime256v1');
  curve.generateKeys();

  return {
    publicKey: curve.getPublicKey(undefined, 'uncompressed').toString('base64url'),
    privateKey: curve.getPrivateKey().toString('base64url'),
    subject
  };
}

function createSubscriptionP256dh() {
  const curve = createECDH('prime256v1');
  curve.generateKeys();
  return curve.getPublicKey(undefined, 'uncompressed').toString('base64url');
}

function createNonCanonicalBase64Url(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const lastIndex = alphabet.indexOf(value.at(-1));
  const unusedBits = value.length % 4 === 2 ? 4 : value.length % 4 === 3 ? 2 : 0;
  const lowBitMask = (1 << unusedBits) - 1;
  const lowBits = lastIndex & lowBitMask;
  const alternateLowBits = lowBits === lowBitMask ? lowBits - 1 : lowBits + 1;
  const alternateIndex = (lastIndex & ~lowBitMask) | alternateLowBits;

  return `${value.slice(0, -1)}${alphabet[alternateIndex]}`;
}

function createTransportInput(overrides = {}) {
  return {
    subscription: {
      endpoint: 'https://push.example.test/send/subscription-1',
      p256dh: createSubscriptionP256dh(),
      auth: Buffer.alloc(16, 0x02).toString('base64url')
    },
    payload: {
      version: 1,
      title: 'A bounded notification',
      body: 'A server-owned payload.',
      path: '/learn/'
    },
    ...overrides
  };
}

function createProtocolClient(handler) {
  const calls = [];

  return {
    calls,
    protocolClient: {
      async send(request) {
        calls.push(request);
        return handler(request);
      }
    }
  };
}

function createTransport(protocolClient, vapidConfiguration = createVapidConfiguration(), options = {}) {
  return createWebPushTransport({
    vapidConfiguration,
    protocolClient,
    ...options
  });
}

function requiredEnvironment(overrides = {}) {
  return {
    DATABASE_URL: 'postgresql://db.example.test/natalnode',
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

test('VAPID readiness is fail-closed and distinguishes absent from invalid configuration', () => {
  const configuration = createVapidConfiguration();

  assert.deepEqual(createWebPushVapidReadiness({}), {
    status: 'UNCONFIGURED'
  });
  assert.deepEqual(createWebPushVapidReadiness({
    publicKey: configuration.publicKey
  }), {
    status: 'INVALID_CONFIGURATION'
  });
  assert.deepEqual(createWebPushVapidReadiness({
    privateKey: configuration.privateKey
  }), {
    status: 'INVALID_CONFIGURATION'
  });
  assert.deepEqual(createWebPushVapidReadiness({
    subject: configuration.subject
  }), {
    status: 'INVALID_CONFIGURATION'
  });
  for (const partialConfiguration of [
    {
      publicKey: configuration.publicKey,
      privateKey: configuration.privateKey
    },
    {
      publicKey: configuration.publicKey,
      subject: configuration.subject
    },
    {
      privateKey: configuration.privateKey,
      subject: configuration.subject
    }
  ]) {
    assert.deepEqual(
      createWebPushVapidReadiness(partialConfiguration),
      { status: 'INVALID_CONFIGURATION' }
    );
  }
  assert.deepEqual(createWebPushVapidReadiness(configuration), {
    status: 'READY'
  });
  assert.equal(
    'configuration' in createWebPushVapidReadiness(configuration),
    false
  );
});

test('VAPID public/private validation uses P-256 derivation and rejects malformed or mismatched keys', () => {
  const configuration = createVapidConfiguration();
  const differentConfiguration = createVapidConfiguration();
  const zeroPrivateKey = Buffer.alloc(32).toString('base64url');
  const outOfRangePrivateKey = Buffer.alloc(32, 0xff).toString('base64url');
  const shortPrivateKey = Buffer.alloc(31, 0x01).toString('base64url');
  const longPrivateKey = Buffer.alloc(33, 0x01).toString('base64url');
  const p256Order = Buffer.from(
    'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
    'hex'
  ).toString('base64url');
  const aboveP256Order = Buffer.from(
    'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632552',
    'hex'
  ).toString('base64url');

  assert.equal(isValidWebPushVapidPrivateKey(configuration.privateKey), true);
  assert.equal(isValidWebPushVapidPrivateKey(`${configuration.privateKey}=`), false);
  assert.equal(isValidWebPushVapidPrivateKey(` ${configuration.privateKey}`), false);
  assert.equal(isValidWebPushVapidPrivateKey('not-base64url!'), false);
  assert.equal(isValidWebPushVapidPrivateKey(shortPrivateKey), false);
  assert.equal(isValidWebPushVapidPrivateKey(longPrivateKey), false);
  assert.equal(isValidWebPushVapidPrivateKey(zeroPrivateKey), false);
  assert.equal(isValidWebPushVapidPrivateKey(outOfRangePrivateKey), false);
  assert.equal(isValidWebPushVapidPrivateKey(p256Order), false);
  assert.equal(isValidWebPushVapidPrivateKey(aboveP256Order), false);
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: `${configuration.privateKey}=`
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: zeroPrivateKey
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: outOfRangePrivateKey
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: p256Order
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: aboveP256Order
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    privateKey: differentConfiguration.privateKey
  }), { status: 'INVALID_CONFIGURATION' });
  assert.deepEqual(createWebPushVapidReadiness({
    ...configuration,
    publicKey: `${configuration.publicKey}=`
  }), { status: 'INVALID_CONFIGURATION' });
});

test('VAPID subject validation is bounded to credential-free https and address-like mailto values', () => {
  assert.equal(isValidWebPushVapidSubject('https://natalnode.example/contact'), true);
  assert.equal(isValidWebPushVapidSubject('mailto:notifications@natalnode.example'), true);

  for (const subject of [
    '',
    'http://natalnode.example/contact',
    'javascript:alert(1)',
    'data:text/plain,hello',
    '//natalnode.example/contact',
    'https://user:password@natalnode.example/contact',
    'https://natalnode.example/a b',
    'https://natalnode.example/a%20b',
    'https://natalnode.example/a%09b',
    'https://natalnode.example/a\u0001b',
    'https://natalnode.example/a%00b',
    'https://natalnode.example/%ZZ',
    'https://natalnode.example/contact?secret=value',
    'https://natalnode.example/contact#fragment',
    'mailto:',
    'mailto:not-an-address',
    'mailto://notifications@natalnode.example',
    'mailto:notifications@natalnode.example?subject=hello',
    'mailto:notifications@natalnode.example extra',
    `https://natalnode.example/${'a'.repeat(2048)}`
  ]) {
    assert.equal(isValidWebPushVapidSubject(subject), false, subject);
  }
});

test('public B3 capability remains public-key-only while complete readiness stays server-internal', () => {
  const configuration = createVapidConfiguration();
  const publicCapability = createWebPushCapability(configuration.publicKey);

  assert.deepEqual(publicCapability, {
    configured: true,
    applicationServerKey: configuration.publicKey
  });
  assert.deepEqual(createWebPushVapidReadiness({
    publicKey: configuration.publicKey
  }), { status: 'INVALID_CONFIGURATION' });

  const noVapidEnvironment = parseServerEnvironment(requiredEnvironment());
  assert.equal(
    noVapidEnvironment.serverRuntimeConfig.webPush.deliveryReadiness.status,
    'UNCONFIGURED'
  );
  assert.equal(
    noVapidEnvironment.serverRuntimeConfig.webPush.applicationServerKey,
    null
  );

  const publicOnlyEnvironment = parseServerEnvironment(requiredEnvironment({
    NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY: configuration.publicKey
  }));
  assert.equal(
    publicOnlyEnvironment.serverRuntimeConfig.webPush.deliveryReadiness.status,
    'INVALID_CONFIGURATION'
  );
  assert.equal(
    publicOnlyEnvironment.serverRuntimeConfig.webPush.applicationServerKey,
    configuration.publicKey
  );

  const completeEnvironment = parseServerEnvironment(requiredEnvironment({
    NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY: configuration.publicKey,
    NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY: configuration.privateKey,
    NATALNODE_WEB_PUSH_VAPID_SUBJECT: configuration.subject
  }));
  assert.equal(
    completeEnvironment.serverRuntimeConfig.webPush.deliveryReadiness.status,
    'READY'
  );
  assert.doesNotMatch(
    JSON.stringify(completeEnvironment.serverRuntimeConfig),
    /privateKey|NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY/u
  );
});

test('transport sends only the validated V1 payload and subscription material to the injected protocol seam', async () => {
  const configuration = createVapidConfiguration();
  const { calls, protocolClient } = createProtocolClient(() => ({
    statusCode: 201,
    headers: {},
    body: 'provider response body must stay internal'
  }));
  const transport = createTransport(protocolClient, configuration, {
    attemptTimeoutMillis: 2_500
  });
  const input = createTransportInput();

  assert.deepEqual(await transport.send(input), { outcome: 'ACCEPTED' });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].subscription, {
    endpoint: input.subscription.endpoint,
    keys: {
      p256dh: input.subscription.p256dh,
      auth: input.subscription.auth
    }
  });
  assert.equal(calls[0].payload, JSON.stringify(input.payload));
  assert.equal(calls[0].timeoutMillis, 2_500);
  assert.deepEqual(calls[0].vapidDetails, configuration);
});

test('consumer transport freezes one-hour TTL and avoids the web-push default', async () => {
  const source = await readFile(
    new URL('../src/notification-platform/web-push-transport.ts', import.meta.url),
    'utf8'
  );
  const input = createTransportInput();
  const configuration = createVapidConfiguration();
  const subscription = {
    endpoint: input.subscription.endpoint,
    keys: {
      p256dh: input.subscription.p256dh,
      auth: input.subscription.auth
    }
  };
  const payload = JSON.stringify(input.payload);
  const implicitDefault = webpush.generateRequestDetails(
    subscription,
    payload,
    { vapidDetails: configuration }
  );
  const explicitOneHour = webpush.generateRequestDetails(
    subscription,
    payload,
    { vapidDetails: configuration, TTL: 3_600 }
  );

  assert.equal(implicitDefault.headers.TTL, 2419200);
  assert.equal(explicitOneHour.headers.TTL, 3600);
  assert.notEqual(explicitOneHour.headers.TTL, implicitDefault.headers.TTL);
  assert.match(source, /CONSUMER_WEB_PUSH_TTL_SECONDS\s*=\s*3_600/u);
  assert.match(source, /TTL:\s*CONSUMER_WEB_PUSH_TTL_SECONDS/u);
  assert.doesNotMatch(source, /2419200/u);

  const { calls, protocolClient } = createProtocolClient(() => ({
    statusCode: 201,
    headers: {}
  }));
  const transport = createTransport(protocolClient);
  const callerAttempt = createTransportInput({
    TTL: 1,
    ttl: 1
  });

  assert.deepEqual(await transport.send(callerAttempt), { outcome: 'ACCEPTED' });
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0], 'TTL'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0], 'ttl'), false);
});

test('transport instances keep per-call VAPID configuration isolated', async () => {
  const firstConfiguration = createVapidConfiguration();
  const secondConfiguration = createVapidConfiguration();
  const first = createProtocolClient(() => ({ statusCode: 201, headers: {} }));
  const second = createProtocolClient(() => ({ statusCode: 201, headers: {} }));
  const firstTransport = createTransport(first.protocolClient, firstConfiguration);
  const secondTransport = createTransport(second.protocolClient, secondConfiguration);

  await Promise.all([
    firstTransport.send(createTransportInput()),
    secondTransport.send(createTransportInput())
  ]);

  assert.equal(first.calls.length, 1);
  assert.equal(second.calls.length, 1);
  assert.equal(first.calls[0].vapidDetails.publicKey, firstConfiguration.publicKey);
  assert.equal(second.calls[0].vapidDetails.publicKey, secondConfiguration.publicKey);
  assert.notEqual(
    first.calls[0].vapidDetails.publicKey,
    second.calls[0].vapidDetails.publicKey
  );
});

test('transport maps bounded protocol statuses without exposing response bodies or headers', async () => {
  const cases = [
    [404, { outcome: 'SUBSCRIPTION_INVALID' }],
    [410, { outcome: 'SUBSCRIPTION_INVALID' }],
    [401, { outcome: 'CONFIGURATION_UNAVAILABLE' }],
    [403, { outcome: 'CONFIGURATION_UNAVAILABLE' }],
    [500, { outcome: 'TRANSIENT_UPSTREAM' }],
    [503, { outcome: 'TRANSIENT_UPSTREAM' }],
    [400, { outcome: 'PERMANENT_FAILURE' }]
  ];

  for (const [statusCode, expected] of cases) {
    const { protocolClient } = createProtocolClient(() => {
      throw Object.assign(new Error('raw protocol error body'), {
        statusCode,
        headers: {
          'retry-after': '120',
          'x-provider-secret': 'must not escape'
        },
        body: 'raw response body',
        endpoint: 'https://push.example.test/send/subscription-1'
      });
    });
    const result = await createTransport(protocolClient).send(createTransportInput());

    assert.deepEqual(result, expected);
    assert.doesNotMatch(JSON.stringify(result), /raw protocol|raw response|provider-secret|push\.example/u);
  }
});

test('unknown successful protocol results remain ambiguous', async () => {
  const { calls, protocolClient } = createProtocolClient(() => ({}));
  const result = await createTransport(protocolClient).send(createTransportInput());

  assert.deepEqual(result, { outcome: 'TIMEOUT_AMBIGUOUS' });
  assert.equal(calls.length, 1);
});

test('transport returns bounded Retry-After metadata only for valid throttling values', async () => {
  const withRetryAfter = createProtocolClient(() => {
    throw Object.assign(new Error('raw throttled response'), {
      statusCode: 429,
      headers: { 'retry-after': '120' },
      body: 'raw response body'
    });
  });
  const withoutRetryAfter = createProtocolClient(() => {
    throw Object.assign(new Error('raw oversized throttled response'), {
      statusCode: 429,
      headers: { 'retry-after': '3601' },
      body: 'raw response body'
    });
  });
  const duplicateRetryAfter = createProtocolClient(() => {
    throw Object.assign(new Error('raw duplicate throttled response'), {
      statusCode: 429,
      headers: { 'retry-after': '120', 'Retry-After': '121' },
      body: 'raw response body'
    });
  });
  const arrayRetryAfter = createProtocolClient(() => {
    throw Object.assign(new Error('raw array throttled response'), {
      statusCode: 429,
      headers: { 'retry-after': ['120', '121'] },
      body: 'raw response body'
    });
  });

  assert.deepEqual(
    await createTransport(withRetryAfter.protocolClient).send(createTransportInput()),
    { outcome: 'THROTTLED', retryAfterSeconds: 120 }
  );
  assert.deepEqual(
    await createTransport(withoutRetryAfter.protocolClient).send(createTransportInput()),
    { outcome: 'THROTTLED' }
  );
  assert.deepEqual(
    await createTransport(duplicateRetryAfter.protocolClient).send(createTransportInput()),
    { outcome: 'THROTTLED' }
  );
  assert.deepEqual(
    await createTransport(arrayRetryAfter.protocolClient).send(createTransportInput()),
    { outcome: 'THROTTLED' }
  );
});

test('transport classifies ambiguous and pre-send network failures conservatively', async () => {
  const timeout = createProtocolClient(() => {
    throw Object.assign(new Error('raw timeout details'), {
      code: 'ETIMEDOUT',
      endpoint: 'https://push.example.test/send/subscription-1',
      body: 'raw body'
    });
  });
  const unknown = createProtocolClient(() => {
    throw new Error('unclassified raw protocol error');
  });
  const dns = createProtocolClient(() => {
    throw Object.assign(new Error('raw DNS details'), { code: 'ENOTFOUND' });
  });

  assert.deepEqual(
    await createTransport(timeout.protocolClient).send(createTransportInput()),
    { outcome: 'TIMEOUT_AMBIGUOUS' }
  );
  assert.deepEqual(
    await createTransport(unknown.protocolClient).send(createTransportInput()),
    { outcome: 'TIMEOUT_AMBIGUOUS' }
  );
  assert.deepEqual(
    await createTransport(dns.protocolClient).send(createTransportInput()),
    { outcome: 'TRANSIENT_UPSTREAM' }
  );
});

test('invalid payload and unavailable VAPID configuration stop before the protocol seam', async () => {
  const invalidPayloadProtocol = createProtocolClient(() => ({ statusCode: 201 }));
  const invalidPayloadTransport = createTransport(invalidPayloadProtocol.protocolClient);
  const invalidPayload = createTransportInput({
    payload: {
      version: 1,
      title: '',
      body: 'This must never reach the protocol.'
    }
  });

  assert.deepEqual(await invalidPayloadTransport.send(invalidPayload), {
    outcome: 'PAYLOAD_INVALID'
  });
  assert.equal(invalidPayloadProtocol.calls.length, 0);
  assert.doesNotMatch(
    JSON.stringify(await invalidPayloadTransport.send(invalidPayload)),
    /never reach/u
  );

  const unavailableProtocol = createProtocolClient(() => ({ statusCode: 201 }));
  const unavailableTransport = createTransport(
    unavailableProtocol.protocolClient,
    null
  );

  assert.deepEqual(
    await unavailableTransport.send(createTransportInput()),
    { outcome: 'CONFIGURATION_UNAVAILABLE' }
  );
  assert.equal(unavailableProtocol.calls.length, 0);

  const invalidConfiguration = createVapidConfiguration('http://invalid.example');
  const invalidConfigurationProtocol = createProtocolClient(() => ({ statusCode: 201 }));
  const invalidConfigurationTransport = createTransport(
    invalidConfigurationProtocol.protocolClient,
    invalidConfiguration
  );
  assert.deepEqual(
    await invalidConfigurationTransport.send(createTransportInput()),
    { outcome: 'CONFIGURATION_UNAVAILABLE' }
  );
  assert.equal(invalidConfigurationProtocol.calls.length, 0);
});

test('hostile input accessors stay within bounded outcomes', async () => {
  const protocol = createProtocolClient(() => ({ statusCode: 201, headers: {} }));
  const transport = createTransport(protocol.protocolClient);
  const validSubscription = createTransportInput().subscription;
  const payloadGetterInput = { subscription: validSubscription };
  Object.defineProperty(payloadGetterInput, 'payload', {
    get() {
      throw new Error('payload must stay internal');
    }
  });
  const subscriptionGetterInput = { payload: { version: 1, title: 'Title', body: 'Body' } };
  Object.defineProperty(subscriptionGetterInput, 'subscription', {
    get() {
      throw new Error('subscription must stay internal');
    }
  });

  assert.deepEqual(await transport.send(payloadGetterInput), {
    outcome: 'PAYLOAD_INVALID'
  });
  assert.deepEqual(await transport.send(subscriptionGetterInput), {
    outcome: 'PERMANENT_FAILURE'
  });
  assert.equal(protocol.calls.length, 0);
});

test('invalid persisted subscription material is terminal without remote invalidation evidence', async () => {
  const { calls, protocolClient } = createProtocolClient(() => ({ statusCode: 201 }));
  const transport = createTransport(protocolClient);
  const validSubscription = createTransportInput().subscription;

  for (const subscription of [
    {
      endpoint: 'http://not-https.example.test/send/1',
      p256dh: 'not-base64!',
      auth: ''
    },
    {
      endpoint: 'https://@push.example.test/send/1',
      p256dh: validSubscription.p256dh,
      auth: validSubscription.auth
    },
    {
      endpoint: 'https://push.example.test/send/1#',
      p256dh: validSubscription.p256dh,
      auth: validSubscription.auth
    },
    {
      ...validSubscription,
      p256dh: 'A'
    },
    {
      ...validSubscription,
      p256dh: createNonCanonicalBase64Url(validSubscription.p256dh)
    },
    {
      ...validSubscription,
      auth: createNonCanonicalBase64Url(validSubscription.auth)
    },
    {
      ...validSubscription,
      p256dh: Buffer.concat([Buffer.from([0x04]), Buffer.alloc(64, 0x01)]).toString('base64url')
    }
  ]) {
    const result = await transport.send(createTransportInput({ subscription }));

    assert.deepEqual(result, { outcome: 'PERMANENT_FAILURE' });
    assert.doesNotMatch(JSON.stringify(result), /not-https|not-base64|push\.example/u);
  }

  assert.equal(calls.length, 0);
});

test('transport source uses per-call VAPID details and contains no global setter or logging path', async () => {
  const source = await readFile(
    new URL('../src/notification-platform/web-push-transport.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /webpush\.setVapidDetails/u);
  assert.doesNotMatch(source, /webpush\.sendNotification/u);
  assert.match(source, /webpush\.generateRequestDetails/u);
  assert.match(source, /abortController\.signal/u);
  assert.doesNotMatch(source, /Promise\.race/u);
  assert.doesNotMatch(source, /console\.(?:log|warn|error)/u);
});
