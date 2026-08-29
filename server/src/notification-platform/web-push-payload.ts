const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const NOTIFICATION_URL_BASE = 'https://natalnode.invalid';

export const NOTIFICATION_TITLE_MAXIMUM_LENGTH = 80;
export const NOTIFICATION_BODY_MAXIMUM_LENGTH = 160;
export const NOTIFICATION_PATH_MAXIMUM_LENGTH = 256;

const SAFE_NOTIFICATION_ROUTE_PREFIXES = [
  '/account',
  '/about',
  '/learn',
  '/methodology',
  '/tools',
  '/vault'
] as const;

export interface WebPushPayloadV1 {
  readonly version: 1;
  readonly title: string;
  readonly body: string;
  readonly path?: string;
}

export class NotificationPayloadValidationError extends Error {
  public constructor(message = 'Web Push notification payload is invalid.') {
    super(message);
    this.name = 'NotificationPayloadValidationError';
  }
}

function invalidPayload(): never {
  throw new NotificationPayloadValidationError();
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
    !CONTROL_CHARACTER_PATTERN.test(value)
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
    CONTROL_CHARACTER_PATTERN.test(value) ||
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

/** Validates and copies the exact safe payload persisted by the enqueue boundary. */
export function assertWebPushPayloadV1(
  value: unknown
): WebPushPayloadV1 {
  if (
    !isRecord(value) ||
    !hasOnlyAllowedKeys(value, ['version', 'title', 'body', 'path']) ||
    value.version !== 1 ||
    !hasSafeText(value.title, NOTIFICATION_TITLE_MAXIMUM_LENGTH) ||
    !hasSafeText(value.body, NOTIFICATION_BODY_MAXIMUM_LENGTH) ||
    (value.path !== undefined && !isSafeNotificationPath(value.path))
  ) {
    return invalidPayload();
  }

  return Object.freeze({
    version: 1,
    title: value.title,
    body: value.body,
    ...(value.path === undefined ? {} : { path: value.path })
  });
}
