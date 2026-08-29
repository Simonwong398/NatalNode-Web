import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWebPushCapability,
  isValidWebPushApplicationServerKey
} from '../dist/notification-platform/index.js';
import { parseServerEnvironment } from '../dist/runtime/index.js';

function validApplicationServerKey() {
  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.alloc(64, 0x01)
  ]).toString('base64url');
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

test('validates and exposes only the public P-256 application server key shape', () => {
  const key = validApplicationServerKey();

  assert.equal(isValidWebPushApplicationServerKey(key), true);
  assert.deepEqual(createWebPushCapability(key), {
    configured: true,
    applicationServerKey: key
  });
});

test('missing and malformed public keys fail closed without startup errors', () => {
  const key = validApplicationServerKey();
  const malformed = [
    undefined,
    null,
    '',
    `${key}=`,
    key.slice(0, -1),
    Buffer.alloc(65, 0x01).toString('base64url'),
    Buffer.alloc(64, 0x04).toString('base64url'),
    'contains+padding'
  ];

  for (const value of malformed) {
    assert.equal(isValidWebPushApplicationServerKey(value), false);
    assert.deepEqual(createWebPushCapability(value), {
      configured: false,
      applicationServerKey: null
    });
  }
});

test('environment parsing keeps Web Push optional and fails closed for invalid configuration', () => {
  const key = validApplicationServerKey();

  assert.equal(
    parseServerEnvironment(requiredEnvironment()).serverRuntimeConfig.webPush.applicationServerKey,
    null
  );
  assert.equal(
    parseServerEnvironment(requiredEnvironment({
      NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY: key
    })).serverRuntimeConfig.webPush.applicationServerKey,
    key
  );
  assert.equal(
    parseServerEnvironment(requiredEnvironment({
      NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY: `${key}=`
    })).serverRuntimeConfig.webPush.applicationServerKey,
    null
  );
});
