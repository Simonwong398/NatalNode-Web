import {
  assertGoogleOAuthProtocolSecret,
  assertGoogleOAuthTimestamp
} from './google-oauth-transaction.js';
import {
  assertValidSessionCookiePolicy,
  type SessionCookiePolicy
} from './session-cookie.js';

export const GOOGLE_OAUTH_CORRELATION_COOKIE_NAME =
  'nn_google_oauth_binding' as const;

const CLEARED_COOKIE_EXPIRATION = 'Thu, 01 Jan 1970 00:00:00 GMT';
const INVALID_COOKIE_NAME_CHARACTERS = /[\u0000-\u001F\u007F\s;,=]/u;

function assertGoogleCorrelationCookiePolicy(
  policy: SessionCookiePolicy
): void {
  assertValidSessionCookiePolicy(policy);

  if (policy.name === GOOGLE_OAUTH_CORRELATION_COOKIE_NAME) {
    throw new Error('Google correlation cookie must differ from session cookie.');
  }
}

function toHttpDate(timestamp: string): string {
  assertGoogleOAuthTimestamp(timestamp, 'expiresAt');
  return new Date(timestamp).toUTCString();
}

function secureAttribute(policy: SessionCookiePolicy): string {
  return policy.secure ? '; Secure' : '';
}

/** Serializes the dedicated transient browser-binding cookie. */
export function serializeGoogleOAuthCorrelationCookie(
  browserBinding: string,
  expiresAt: string,
  sessionCookiePolicy: SessionCookiePolicy
): string {
  assertGoogleCorrelationCookiePolicy(sessionCookiePolicy);
  assertGoogleOAuthProtocolSecret(browserBinding, 'browserBinding');

  return [
    `${GOOGLE_OAUTH_CORRELATION_COOKIE_NAME}=${browserBinding}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${toHttpDate(expiresAt)}`
  ].join('; ') + secureAttribute(sessionCookiePolicy);
}

/** Serializes removal of the dedicated transient browser-binding cookie. */
export function serializeClearedGoogleOAuthCorrelationCookie(
  sessionCookiePolicy: SessionCookiePolicy
): string {
  assertGoogleCorrelationCookiePolicy(sessionCookiePolicy);

  return [
    `${GOOGLE_OAUTH_CORRELATION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${CLEARED_COOKIE_EXPIRATION}`,
    'Max-Age=0'
  ].join('; ') + secureAttribute(sessionCookiePolicy);
}

/** Extracts exactly one valid transient browser-binding cookie. */
export function extractGoogleOAuthCorrelationCookie(
  request: Request,
  sessionCookiePolicy: SessionCookiePolicy
): string | null {
  assertGoogleCorrelationCookiePolicy(sessionCookiePolicy);

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

    if (cookieName !== GOOGLE_OAUTH_CORRELATION_COOKIE_NAME) {
      continue;
    }

    matchCount += 1;
    matchingValue = cookiePair.slice(equalsIndex + 1);
  }

  if (
    matchCount !== 1 ||
    matchingValue === null ||
    matchingValue.length === 0 ||
    INVALID_COOKIE_NAME_CHARACTERS.test(GOOGLE_OAUTH_CORRELATION_COOKIE_NAME)
  ) {
    return null;
  }

  try {
    assertGoogleOAuthProtocolSecret(matchingValue, 'browserBinding');
    return matchingValue;
  } catch (_error) {
    return null;
  }
}
