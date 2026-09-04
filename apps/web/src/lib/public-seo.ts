import {
  DEFAULT_LOCALE,
  getLocalizedPath,
  SUPPORTED_LOCALES,
  type SupportedLocale
} from './localization.js';
import type { SeoAlternate, SeoMetadata } from './seo.js';

/**
 * Builds one complete hreflang set for a public route identity. Route files
 * supply localized copy; this helper only maps the stable route identity to
 * the closed locale registry.
 */
export function getPublicSeoAlternates(routePath: string): readonly SeoAlternate[] {
  return [
    ...SUPPORTED_LOCALES.map((locale) => ({
      locale,
      url: getLocalizedPath(locale, routePath)
    })),
    {
      locale: 'x-default',
      url: getLocalizedPath(DEFAULT_LOCALE, routePath)
    }
  ];
}

export function createPublicSeo(
  locale: SupportedLocale,
  routePath: string,
  title: string,
  description: string
): SeoMetadata {
  return {
    title,
    description,
    canonical: getLocalizedPath(locale, routePath),
    alternates: getPublicSeoAlternates(routePath)
  };
}
