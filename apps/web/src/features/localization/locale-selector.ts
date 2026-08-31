import {
  getLocalizedPath,
  parseSupportedLocale,
  type SupportedLocale
} from '../../lib/localization.js';
import { writeLocalePreference } from '../../lib/locale-preference.js';

export type LocalePreferenceWriter = (locale: SupportedLocale) => unknown;
export type LocaleNavigator = (destination: string) => void;

export function buildLocaleSwitchPath(
  targetLocale: unknown,
  currentPath: string
): string | null {
  const locale = parseSupportedLocale(targetLocale);
  if (locale === null) {
    return null;
  }

  try {
    return getLocalizedPath(locale, currentPath);
  } catch {
    return null;
  }
}

function navigateToLocale(destination: string): void {
  if (typeof window !== 'undefined') {
    window.location.assign(destination);
  }
}

export function selectLocale(
  targetLocale: unknown,
  currentPath: string,
  writePreference: LocalePreferenceWriter = writeLocalePreference,
  navigate: LocaleNavigator = navigateToLocale
): boolean {
  const locale = parseSupportedLocale(targetLocale);
  const destination = buildLocaleSwitchPath(locale, currentPath);

  if (locale === null || destination === null) {
    return false;
  }

  try {
    writePreference(locale);
  } catch {
    // A preference write failure must never block explicit locale navigation.
  }

  navigate(destination);
  return true;
}
