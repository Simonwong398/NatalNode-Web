import { parseSupportedLocale, type SupportedLocale } from './localization.js';

export const LOCALE_PREFERENCE_COOKIE_NAME = 'natalnode_locale';
export const LOCALE_PREFERENCE_MAX_AGE_SECONDS = 31_536_000;

/** Reads one closed-set locale preference without trusting unrelated cookies. */
export function parseLocalePreferenceCookie(
  cookieHeader: string | null | undefined
): SupportedLocale | null {
  if (typeof cookieHeader !== 'string' || cookieHeader === '') {
    return null;
  }

  let matchedValue: string | undefined;

  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const name = pair.slice(0, separator).trim();
    if (name !== LOCALE_PREFERENCE_COOKIE_NAME) {
      continue;
    }

    if (matchedValue !== undefined) {
      return null;
    }

    const rawValue = pair.slice(separator + 1).trim();
    try {
      matchedValue = decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  }

  return matchedValue === undefined ? null : parseSupportedLocale(matchedValue);
}

export function readLocalePreference(
  cookieHeader?: string | null
): SupportedLocale | null {
  const value = cookieHeader !== undefined
    ? cookieHeader
    : typeof document === 'undefined'
      ? null
      : document.cookie;

  return parseLocalePreferenceCookie(value);
}

/** Serializes only canonical supported locales with a browser-readable cookie. */
export function serializeLocalePreferenceCookie(
  locale: unknown,
  secure: boolean
): string | null {
  const parsedLocale = parseSupportedLocale(locale);
  if (parsedLocale === null) {
    return null;
  }

  const attributes = [
    `${LOCALE_PREFERENCE_COOKIE_NAME}=${encodeURIComponent(parsedLocale)}`,
    `Max-Age=${LOCALE_PREFERENCE_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax'
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

/** Best-effort browser write; preference persistence must never block navigation. */
export function writeLocalePreference(locale: unknown): boolean {
  const cookie = serializeLocalePreferenceCookie(
    locale,
    typeof window !== 'undefined' && window.location.protocol === 'https:'
  );

  if (cookie === null || typeof document === 'undefined') {
    return false;
  }

  try {
    document.cookie = cookie;
    return true;
  } catch {
    return false;
  }
}
