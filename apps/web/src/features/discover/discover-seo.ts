import { getLocalizedPath, SUPPORTED_LOCALES } from '@/lib/localization';
import type { SeoAlternate } from '@/lib/seo';

/** Creates the complete locale relationship for a public Discover route. */
export function getDiscoverSeoAlternates(path: string): readonly SeoAlternate[] {
  return [
    ...SUPPORTED_LOCALES.map((locale) => ({
      locale,
      url: getLocalizedPath(locale, path)
    })),
    {
      locale: 'x-default' as const,
      url: getLocalizedPath('en', path)
    }
  ];
}
