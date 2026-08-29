import { Buffer } from 'node:buffer';
import type { WebPushCapabilityApiResponse } from '@natalnode/contracts';

export const WEB_PUSH_APPLICATION_SERVER_KEY_ENVIRONMENT_VARIABLE =
  'NATALNODE_WEB_PUSH_VAPID_PUBLIC_KEY';

const UNCONFIGURED_WEB_PUSH_CAPABILITY: WebPushCapabilityApiResponse =
  Object.freeze({
    configured: false,
    applicationServerKey: null
  });

/**
 * Checks the transport-neutral shape advertised by the browser Push API. This
 * intentionally does not perform elliptic-curve point validation or expose a
 * private VAPID credential.
 */
export function isValidWebPushApplicationServerKey(
  value: unknown
): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim() !== value ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    return false;
  }

  let decoded: Buffer;

  try {
    decoded = Buffer.from(value, 'base64url');
  } catch (_error) {
    return false;
  }

  return (
    decoded.length === 65 &&
    decoded[0] === 0x04 &&
    decoded.toString('base64url') === value
  );
}

/**
 * Converts optional runtime configuration into a safe public capability. Any
 * missing or malformed value is unavailable without failing server startup.
 */
export function createWebPushCapability(
  applicationServerKey: unknown
): WebPushCapabilityApiResponse {
  if (!isValidWebPushApplicationServerKey(applicationServerKey)) {
    return UNCONFIGURED_WEB_PUSH_CAPABILITY;
  }

  return Object.freeze({
    configured: true,
    applicationServerKey
  });
}
