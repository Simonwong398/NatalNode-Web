import assert from 'node:assert/strict';
import { createECDH } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  createWebPushCapability,
  createWebPushTransport,
  createWebPushVapidReadiness,
  isValidWebPushVapidPrivateKey,
  isValidWebPushVapidSubject
} from '../dist/notification-platform/index.js';
import { parseServerEnvironment } from '../dist/runtime/index.js';

function createVapidConfiguration(subject = 'mailto:notifications@natalnode.example') {
  const curve = createECDH('prime256v1');
  curve.generateKeys();

  return {
    publicKey: curve.getPublicKey(undefined, 'uncompressed').toString('base64url'),
    privateKey: curve.getPrivateKey().toString('base64url'),
    subject
  };
}

function createTransportInput(overrides = {}) {
  return {
    subscription: {
      endpoint: 'https://push.example.test/send/subscription-1',
      p256dh: Buffer.alloc(65, 0x01).toString('base64url'),
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
  assert.deepEqual(createWebPushVapidReadiness(configuration), {
    status: 'READY',
    configuration
  });
});

test('VAPID public/private validation uses P-256 derivation and rejects malformed or mismatched keys', () => {
  const configuration = createVapidConfiguration();
  const differentConfiguration = createVapidConfiguration();
  const zeroPrivateKey = Buffer.alloc(32).toString('base64url');
  const outOfRangePrivateKey = Buffer.alloc(32, 0xff).toString('base64url');

  assert.equal(isValidWebPushVapidPrivateKey(configuration.privateKey), true);
  assert.equal(isValidWebPushVapidPrivateKey(`${configuration.privateKey}=`), false);
  assert.equal(isValidWebPushVapidPrivateKey(zeroPrivateKey), false);
  assert.equal(isValidWebPushVapidPrivateKey(outOfRangePrivateKey), false);
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

  assert.deepEqual(
    await createTransport(withRetryAfter.protocolClient).send(createTransportInput()),
    { outcome: 'THROTTLED', retryAfterSeconds: 120 }
  );
  assert.deepEqual(
    await createTransport(withoutRetryAfter.protocolClient).send(createTransportInput()),
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

test('invalid persisted subscription material is bounded to a target invalid outcome', async () => {
  const { calls, protocolClient } = createProtocolClient(() => ({ statusCode: 201 }));
  const transport = createTransport(protocolClient);

  for (const subscription of [
    {
      endpoint: 'http://not-https.example.test/send/1',
      p256dh: 'not-base64!',
      auth: ''
    },
    {
      endpoint: 'https://@push.example.test/send/1',
      p256dh: Buffer.alloc(65, 0x01).toString('base64url'),
      auth: Buffer.alloc(16, 0x02).toString('base64url')
    },
    {
      endpoint: 'https://push.example.test/send/1#',
      p256dh: Buffer.alloc(65, 0x01).toString('base64url'),
      auth: Buffer.alloc(16, 0x02).toString('base64url')
    }
  ]) {
    const result = await transport.send(createTransportInput({ subscription }));

    assert.deepEqual(result, { outcome: 'SUBSCRIPTION_INVALID' });
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
  assert.doesNotMatch(source, /console\.(?:log|warn|error)/u);
});
