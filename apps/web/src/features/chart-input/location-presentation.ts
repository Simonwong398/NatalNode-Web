import { DEFAULT_LOCALE, type SupportedLocale } from '../../lib/localization.js';

export interface LocationPresentationInput {
  readonly locality: string | null;
  readonly region: string | null;
  readonly country: string;
  readonly countryCode: string | null;
}

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/u;
const ZH_HANT_COUNTRY_FALLBACKS: Readonly<Record<string, string>> = Object.freeze({
  CN: '中國'
});

function normalizePresentationText(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

function localizedCountryName(
  country: string,
  countryCode: string | null,
  locale: SupportedLocale
): string {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? '';

  if (!COUNTRY_CODE_PATTERN.test(normalizedCountryCode)) {
    return country;
  }

  let displayName: string | undefined;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      displayName = new Intl.DisplayNames(locale, { type: 'region' }).of(
        normalizedCountryCode
      );
    }
  } catch {
    displayName = undefined;
  }

  if (typeof displayName === 'string' && displayName.trim() !== '') {
    const trimmedDisplayName = displayName.trim();
    if (
      locale !== 'zh-Hant' ||
      normalizedCountryCode !== 'CN' ||
      trimmedDisplayName === '中國'
    ) {
      return trimmedDisplayName;
    }
  }

  return (
    (locale === 'zh-Hant'
      ? ZH_HANT_COUNTRY_FALLBACKS[normalizedCountryCode]
      : undefined) ?? country
  );
}

/**
 * Formats only presentation fields. Authority IDs, coordinates, timezone, and
 * provider canonical text remain outside this formatter and are not changed.
 */
export function formatLocationPresentation(
  location: LocationPresentationInput,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const country = localizedCountryName(location.country, location.countryCode, locale);
  const values = [location.locality, location.region, country];
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const value of values) {
    if (typeof value !== 'string' || value.trim() === '') {
      continue;
    }

    const trimmedValue = value.trim();
    const normalizedValue = normalizePresentationText(trimmedValue);
    if (seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    parts.push(trimmedValue);
  }

  return parts.join(locale === 'zh-Hant' ? '，' : ', ');
}
