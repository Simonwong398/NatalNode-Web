export const SITE_NAME = 'NatalNode';
export const SITE_ORIGIN = 'https://natalnode.com';

export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow';

export interface SeoMetadata {
  readonly title: string;
  readonly description: string;
  /** Accepts either a pathname such as `/learn/` or an absolute URL. */
  readonly canonical: string;
  readonly robots?: RobotsDirective;
}

export const DEFAULT_ROBOTS: RobotsDirective = 'index,follow';

export function resolveCanonicalUrl(canonical: string): string {
  if (/^https?:\/\//i.test(canonical)) {
    return canonical;
  }

  const pathname = canonical.startsWith('/') ? canonical : `/${canonical}`;
  return new URL(pathname, SITE_ORIGIN).toString();
}
