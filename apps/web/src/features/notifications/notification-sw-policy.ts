export const NOTIFICATION_SERVICE_WORKER_PATH = '/notification-sw.js';
export const NOTIFICATION_SERVICE_WORKER_SCOPE = '/';
export const NOTIFICATION_TITLE_MAXIMUM_LENGTH = 80;
export const NOTIFICATION_BODY_MAXIMUM_LENGTH = 160;
export const NOTIFICATION_PATH_MAXIMUM_LENGTH = 256;

export const GENERIC_NOTIFICATION_TITLE = 'NatalNode';
export const GENERIC_NOTIFICATION_BODY = 'Open NatalNode to view the update.';
export const SAFE_NOTIFICATION_FALLBACK_PATH = '/';

const SAFE_NOTIFICATION_ROUTE_PREFIXES = [
  '/account',
  '/about',
  '/learn',
  '/methodology',
  '/tools',
  '/vault'
] as const;
const NOTIFICATION_URL_BASE = 'https://natalnode.invalid';

export interface ValidatedNotificationPayload {
  readonly version: 1;
  readonly title: string;
  readonly body: string;
  readonly path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[]
): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function hasSafeText(value: unknown, maximumLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Array.from(value).length <= maximumLength &&
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)
  );
}

export function isSafeNotificationPath(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    Array.from(value).length > NOTIFICATION_PATH_MAXIMUM_LENGTH ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('?') ||
    value.includes('#') ||
    value.includes('\\') ||
    /[\u0000-\u001F\u007F]/u.test(value) ||
    /(?:^|\/)\.{1,2}(?:\/|$)/u.test(value)
  ) {
    return false;
  }

  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch (_error) {
    return false;
  }

  if (
    decodedValue.startsWith('//') ||
    decodedValue.includes('?') ||
    decodedValue.includes('#') ||
    decodedValue.includes('\\') ||
    /(?:^|\/)\.{1,2}(?:\/|$)/u.test(decodedValue)
  ) {
    return false;
  }

  let url: URL;

  try {
    url = new URL(value, NOTIFICATION_URL_BASE);
  } catch (_error) {
    return false;
  }

  if (url.origin !== NOTIFICATION_URL_BASE || url.search || url.hash) {
    return false;
  }

  return (
    url.pathname === '/' ||
    SAFE_NOTIFICATION_ROUTE_PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    )
  );
}

export function normalizeNotificationPath(value: unknown): string {
  return isSafeNotificationPath(value)
    ? value
    : SAFE_NOTIFICATION_FALLBACK_PATH;
}

export function parseNotificationPayload(
  value: unknown
): ValidatedNotificationPayload | null {
  if (
    !isRecord(value) ||
    !hasOnlyAllowedKeys(value, ['version', 'title', 'body', 'path']) ||
    value.version !== 1 ||
    !hasSafeText(value.title, NOTIFICATION_TITLE_MAXIMUM_LENGTH) ||
    !hasSafeText(value.body, NOTIFICATION_BODY_MAXIMUM_LENGTH)
  ) {
    return null;
  }

  const path = value.path === undefined
    ? SAFE_NOTIFICATION_FALLBACK_PATH
    : normalizeNotificationPath(value.path);

  if (value.path !== undefined && !isSafeNotificationPath(value.path)) {
    return null;
  }

  return {
    version: 1,
    title: value.title,
    body: value.body,
    path
  };
}
