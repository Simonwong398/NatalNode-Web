import { Buffer } from 'node:buffer';
import { createECDH } from 'node:crypto';
import { decodeWebPushApplicationServerKey } from './web-push-capability.js';

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const SUBJECT_FORBIDDEN_CHARACTER_PATTERN = /[\s\u0000-\u001F\u007F]/u;
const MAILTO_ADDRESS_PATTERN = /^[^@\s/]+@[^@\s/]+$/u;

export const WEB_PUSH_VAPID_PRIVATE_KEY_ENVIRONMENT_VARIABLE =
  'NATALNODE_WEB_PUSH_VAPID_PRIVATE_KEY';
export const WEB_PUSH_VAPID_SUBJECT_ENVIRONMENT_VARIABLE =
  'NATALNODE_WEB_PUSH_VAPID_SUBJECT';

export const WEB_PUSH_VAPID_READINESS_STATES = [
  'UNCONFIGURED',
  'READY',
  'INVALID_CONFIGURATION'
] as const;

export type WebPushVapidReadinessState =
  (typeof WEB_PUSH_VAPID_READINESS_STATES)[number];

export const MAX_WEB_PUSH_VAPID_SUBJECT_LENGTH = 2048;

export interface WebPushVapidConfigurationInput {
  readonly publicKey?: unknown;
  readonly privateKey?: unknown;
  readonly subject?: unknown;
}

/** @internal A validated, immutable configuration used only at the server transport boundary. */
export interface WebPushVapidConfiguration {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly subject: string;
}

export type WebPushVapidReadiness =
  | {
      readonly status: 'UNCONFIGURED';
    }
  | {
      readonly status: 'INVALID_CONFIGURATION';
    }
  | { readonly status: 'READY' };

const UNCONFIGURED_READINESS: WebPushVapidReadiness = Object.freeze({
  status: 'UNCONFIGURED'
});

const INVALID_CONFIGURATION_READINESS: WebPushVapidReadiness = Object.freeze({
  status: 'INVALID_CONFIGURATION'
});

const READY_READINESS: WebPushVapidReadiness = Object.freeze({
  status: 'READY'
});

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function decodeCanonicalBase64Url(
  value: unknown,
  expectedLength: number
): Buffer | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim() !== value ||
    !BASE64URL_PATTERN.test(value)
  ) {
    return null;
  }

  let decoded: Buffer;

  try {
    decoded = Buffer.from(value, 'base64url');
  } catch (_error) {
    return null;
  }

  if (
    decoded.length !== expectedLength ||
    decoded.toString('base64url') !== value
  ) {
    return null;
  }

  return decoded;
}

function deriveP256PublicKey(privateKey: Buffer): Buffer | null {
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(privateKey);
    const publicKey = ecdh.getPublicKey(undefined, 'uncompressed');

    return publicKey.length === 65 && publicKey[0] === 0x04
      ? publicKey
      : null;
  } catch (_error) {
    return null;
  }
}

/** Validates a canonical non-zero P-256 private scalar without exposing it. */
export function isValidWebPushVapidPrivateKey(value: unknown): value is string {
  const privateKey = decodeCanonicalBase64Url(value, 32);

  return privateKey !== null && deriveP256PublicKey(privateKey) !== null;
}

/** Validates the bounded VAPID subject accepted by this server boundary. */
export function isValidWebPushVapidSubject(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_WEB_PUSH_VAPID_SUBJECT_LENGTH ||
    value.trim() !== value ||
    SUBJECT_FORBIDDEN_CHARACTER_PATTERN.test(value) ||
    value.startsWith('//')
  ) {
    return false;
  }

  if (value.includes('?') || value.includes('#')) {
    return false;
  }

  let parsedSubject: URL;

  try {
    parsedSubject = new URL(value);
  } catch (_error) {
    return false;
  }

  let decodedSubject: string;

  try {
    decodedSubject = decodeURIComponent(value);
  } catch (_error) {
    return false;
  }

  if (SUBJECT_FORBIDDEN_CHARACTER_PATTERN.test(decodedSubject)) {
    return false;
  }

  if (
    parsedSubject.username.length > 0 ||
    parsedSubject.password.length > 0 ||
    parsedSubject.search.length > 0 ||
    parsedSubject.hash.length > 0
  ) {
    return false;
  }

  if (value.startsWith('https://') && parsedSubject.protocol === 'https:') {
    return parsedSubject.hostname.length > 0 && !value.includes('@');
  }

  if (!value.startsWith('mailto:') || parsedSubject.protocol !== 'mailto:') {
    return false;
  }

  const address = value.slice('mailto:'.length);

  return (
    address.length > 0 &&
    !address.startsWith('//') &&
    MAILTO_ADDRESS_PATTERN.test(address)
  );
}

function readValidatedWebPushVapidConfiguration(
  source: WebPushVapidConfigurationInput
): WebPushVapidConfiguration | null {
  if (
    typeof source.publicKey !== 'string' ||
    typeof source.privateKey !== 'string' ||
    typeof source.subject !== 'string'
  ) {
    return null;
  }

  const publicKey = decodeWebPushApplicationServerKey(source.publicKey);
  const privateKey = decodeCanonicalBase64Url(source.privateKey, 32);

  if (publicKey === null || privateKey === null) {
    return null;
  }

  const derivedPublicKey = deriveP256PublicKey(privateKey);

  if (
    derivedPublicKey === null ||
    !derivedPublicKey.equals(publicKey) ||
    !isValidWebPushVapidSubject(source.subject)
  ) {
    return null;
  }

  return Object.freeze({
    publicKey: source.publicKey,
    privateKey: source.privateKey,
    subject: source.subject
  });
}

/** @internal Creates the validated secret-bearing config only at transport construction. */
export function createWebPushVapidConfiguration(
  input: WebPushVapidConfigurationInput | null | undefined
): WebPushVapidConfiguration | null {
  try {
    return readValidatedWebPushVapidConfiguration(input ?? {});
  } catch (_error) {
    return null;
  }
}

/**
 * Builds the server-only VAPID readiness result. It deliberately returns no
 * parse detail for invalid input and never places secret material in errors.
 */
export function createWebPushVapidReadiness(
  input: WebPushVapidConfigurationInput | null | undefined
): WebPushVapidReadiness {
  const source = input ?? {};

  try {
    if (
      isAbsent(source.publicKey) &&
      isAbsent(source.privateKey) &&
      isAbsent(source.subject)
    ) {
      return UNCONFIGURED_READINESS;
    }

    return createWebPushVapidConfiguration(source) === null
      ? INVALID_CONFIGURATION_READINESS
      : READY_READINESS;
  } catch (_error) {
    return INVALID_CONFIGURATION_READINESS;
  }
}
