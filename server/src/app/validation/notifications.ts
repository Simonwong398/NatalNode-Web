import type {
  NotificationCategoryPreferenceApiRequest,
  NotificationChannelPreferenceApiRequest,
  RegisterPushSubscriptionApiRequest
} from '@natalnode/contracts';
import {
  isNotificationCategory,
  isNotificationChannel
} from '../../notification-platform/notification-domain.js';
import { isRecord } from './chart-request.js';

export const NOTIFICATION_REQUEST_MAXIMUM_BYTES = 8 * 1_024;

export type BoundedNotificationJsonResult =
  | { readonly outcome: 'parsed'; readonly value: unknown }
  | { readonly outcome: 'unsupported-media-type' }
  | { readonly outcome: 'too-large' }
  | { readonly outcome: 'invalid' };

function isApplicationJson(request: Request): boolean {
  const contentType = request.headers.get('content-type');

  if (contentType === null) {
    return false;
  }

  const [mediaType] = contentType.split(';', 1);
  return mediaType?.trim().toLowerCase() === 'application/json';
}

function hasOversizedDeclaredLength(request: Request): boolean {
  const contentLength = request.headers.get('content-length');

  if (contentLength === null || !/^\d+$/u.test(contentLength)) {
    return false;
  }

  const byteLength = Number(contentLength);
  return (
    Number.isSafeInteger(byteLength) &&
    byteLength > NOTIFICATION_REQUEST_MAXIMUM_BYTES
  );
}

export async function readBoundedNotificationJson(
  request: Request
): Promise<BoundedNotificationJsonResult> {
  if (!isApplicationJson(request)) {
    return { outcome: 'unsupported-media-type' };
  }

  if (hasOversizedDeclaredLength(request)) {
    return { outcome: 'too-large' };
  }

  if (request.body === null) {
    return { outcome: 'invalid' };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }

      byteLength += chunk.value.byteLength;

      if (byteLength > NOTIFICATION_REQUEST_MAXIMUM_BYTES) {
        try {
          await reader.cancel();
        } catch (_error) {
          // The bounded response remains authoritative if cancellation fails.
        }

        return { outcome: 'too-large' };
      }

      chunks.push(chunk.value);
    }
  } catch (_error) {
    return { outcome: 'invalid' };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { outcome: 'parsed', value: JSON.parse(text) as unknown };
  } catch (_error) {
    return { outcome: 'invalid' };
  }
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasExactlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => hasOwn(value, key))
  );
}

export function isNotificationChannelPreferenceApiRequest(
  value: unknown
): value is NotificationChannelPreferenceApiRequest {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['channel', 'enabled']) &&
    isNotificationChannel(value.channel) &&
    typeof value.enabled === 'boolean'
  );
}

export function isNotificationCategoryPreferenceApiRequest(
  value: unknown
): value is NotificationCategoryPreferenceApiRequest {
  return (
    isRecord(value) &&
    hasExactlyKeys(value, ['category', 'enabled']) &&
    isNotificationCategory(value.category) &&
    typeof value.enabled === 'boolean'
  );
}

export function isRegisterPushSubscriptionApiRequest(
  value: unknown
): value is RegisterPushSubscriptionApiRequest {
  if (
    !isRecord(value) ||
    !hasExactlyKeys(value, ['endpoint', 'keys']) ||
    typeof value.endpoint !== 'string' ||
    !isRecord(value.keys) ||
    !hasExactlyKeys(value.keys, ['p256dh', 'auth'])
  ) {
    return false;
  }

  return (
    typeof value.keys.p256dh === 'string' &&
    typeof value.keys.auth === 'string'
  );
}
