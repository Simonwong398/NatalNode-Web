import type { SupportedLocale } from './localization.js';

export const SITE_NAME = 'NatalNode';
export const SITE_ORIGIN = 'https://natalnode.com';

export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow';

export interface SeoMetadata {
  readonly title: string;
  readonly description: string;
  /** Accepts either a pathname such as `/learn/` or an absolute URL. */
  readonly canonical: string;
  readonly robots?: RobotsDirective;
  readonly alternates?: readonly SeoAlternate[];
  /** Optional Open Graph locale token for surfaces that expose it. */
  readonly ogLocale?: string;
}

export const DEFAULT_ROBOTS: RobotsDirective = 'index,follow';

export type SeoAlternateLocale = SupportedLocale | 'x-default';

export interface SeoAlternate {
  readonly locale: SeoAlternateLocale;
  readonly url: string;
}

const OPEN_GRAPH_LOCALES: Readonly<Record<SupportedLocale, string>> = Object.freeze({
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-Hant': 'zh_Hant'
});

export function getOpenGraphLocale(locale: SupportedLocale): string {
  return OPEN_GRAPH_LOCALES[locale];
}

export function resolveCanonicalUrl(canonical: string): string {
  if (/^https?:\/\//i.test(canonical)) {
    return canonical;
  }

  const pathname = canonical.startsWith('/') ? canonical : `/${canonical}`;
  return new URL(pathname, SITE_ORIGIN).toString();
}
