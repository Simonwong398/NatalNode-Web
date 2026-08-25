export interface SessionCookiePolicy {
  readonly name: string;
  readonly secure: boolean;
}

const CLEARED_SESSION_COOKIE_EXPIRATION = 'Thu, 01 Jan 1970 00:00:00 GMT';
const INVALID_COOKIE_NAME_CHARACTERS = /[\u0000-\u001F\u007F\s;,=]/u;
const INVALID_COOKIE_VALUE_CHARACTERS = /[\u0000-\u0020\u007F"(),;\\]/u;

export function assertValidSessionCookiePolicy(policy: SessionCookiePolicy): void {
  if (policy.name.length === 0 || INVALID_COOKIE_NAME_CHARACTERS.test(policy.name)) {
    throw new Error('Invalid session cookie name.');
  }
}

function assertValidSessionToken(token: string): void {
  if (token.length === 0 || INVALID_COOKIE_VALUE_CHARACTERS.test(token)) {
    throw new Error('Invalid session cookie token.');
  }
}

function toHttpDate(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Session expiration is not a valid HTTP date.');
  }

  return date.toUTCString();
}

function serializeSecureAttribute(policy: SessionCookiePolicy): string {
  return policy.secure ? '; Secure' : '';
}

/** Serializes the one configured session credential for a Set-Cookie header. */
export function serializeSessionCookie(
  sessionToken: string,
  sessionExpiresAt: string,
  policy: SessionCookiePolicy
): string {
  assertValidSessionCookiePolicy(policy);
  assertValidSessionToken(sessionToken);

  return [
    `${policy.name}=${sessionToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${toHttpDate(sessionExpiresAt)}`
  ].join('; ') + serializeSecureAttribute(policy);
}

/** Serializes removal of the configured session credential. */
export function serializeClearedSessionCookie(policy: SessionCookiePolicy): string {
  assertValidSessionCookiePolicy(policy);

  return [
    `${policy.name}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${CLEARED_SESSION_COOKIE_EXPIRATION}`,
    'Max-Age=0'
  ].join('; ') + serializeSecureAttribute(policy);
}

/** Extracts exactly one raw, non-empty configured session cookie value. */
export function extractSessionCookie(
  request: Request,
  policy: SessionCookiePolicy
): string | null {
  assertValidSessionCookiePolicy(policy);

  const cookieHeader = request.headers.get('Cookie');

  if (cookieHeader === null) {
    return null;
  }

  let matchCount = 0;
  let matchingValue: string | null = null;

  for (const cookiePair of cookieHeader.split(';')) {
    const equalsIndex = cookiePair.indexOf('=');

    if (equalsIndex < 0) {
      continue;
    }

    const cookieName = cookiePair.slice(0, equalsIndex).trim();

    if (cookieName !== policy.name) {
      continue;
    }

    matchCount += 1;
    matchingValue = cookiePair.slice(equalsIndex + 1);
  }

  if (matchCount !== 1 || matchingValue === null || matchingValue.length === 0) {
    return null;
  }

  return matchingValue;
}
