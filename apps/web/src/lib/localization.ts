/**
 * The Web presentation locale registry. Keep this list closed until a product
 * decision adds another supported locale.
 */
export const LOCALE_REGISTRY = [
  { id: 'en', displayName: 'English' },
  { id: 'es', displayName: 'Español' },
  { id: 'fr', displayName: 'Français' },
  { id: 'de', displayName: 'Deutsch' },
  { id: 'ja', displayName: '日本語' },
  { id: 'ko', displayName: '한국어' },
  { id: 'zh-Hant', displayName: '繁體中文' }
] as const;

export type SupportedLocale = (typeof LOCALE_REGISTRY)[number]['id'];

export const SUPPORTED_LOCALES = LOCALE_REGISTRY.map(
  ({ id }) => id
) as readonly SupportedLocale[];

export const LOCALE_ORDER = SUPPORTED_LOCALES;
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const CANONICAL_LOCALE: SupportedLocale = DEFAULT_LOCALE;

const LOCALE_SEGMENT_PATTERN = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u;
const BROWSER_LOCALE_PATTERN = LOCALE_SEGMENT_PATTERN;
const ACCEPT_LANGUAGE_QUALITY_PATTERN = /^(?:0(?:\.[0-9]{1,3})?|1(?:\.0{1,3})?)$/u;
const LOCALE_LIKE_SEGMENT_PATTERN = /^[A-Za-z]{2}(?:[-_][A-Za-z0-9]{1,8})*$/u;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** Parses only canonical registry IDs; browser language tags use a separate mapper. */
export function parseSupportedLocale(value: unknown): SupportedLocale | null {
  if (typeof value !== 'string' || !LOCALE_SEGMENT_PATTERN.test(value)) {
    return null;
  }

  return isSupportedLocale(value) ? value : null;
}

function supportedLocaleForBrowser(value: unknown): SupportedLocale | null {
  if (typeof value !== 'string' || value.trim() !== value || !BROWSER_LOCALE_PATTERN.test(value)) {
    return null;
  }

  const subtags = value.split('-');
  const language = subtags[0].toLowerCase();

  if (
    language === 'en' ||
    language === 'es' ||
    language === 'fr' ||
    language === 'de' ||
    language === 'ja' ||
    language === 'ko'
  ) {
    return language;
  }

  if (language !== 'zh') {
    return null;
  }

  const script = subtags.find((subtag) => /^[A-Za-z]{4}$/u.test(subtag))?.toLowerCase();

  if (script !== undefined) {
    return script === 'hant' ? 'zh-Hant' : null;
  }

  const region = subtags.slice(1).find(
    (subtag) => /^[A-Za-z]{2}$/u.test(subtag) || /^[0-9]{3}$/u.test(subtag)
  )?.toUpperCase();

  return region === 'TW' || region === 'HK' || region === 'MO' ? 'zh-Hant' : null;
}

/** Maps one browser language tag to the closed registry, falling back to English. */
export function normalizeBrowserLocale(value: unknown): SupportedLocale {
  return supportedLocaleForBrowser(value) ?? DEFAULT_LOCALE;
}

export interface AcceptLanguagePreference {
  readonly tag: string;
  readonly quality: number;
  readonly order: number;
}

/** Parses the small Accept-Language subset needed by the Web boundary. */
export function parseAcceptLanguage(
  header: string | null | undefined
): readonly AcceptLanguagePreference[] {
  if (typeof header !== 'string' || header.trim() === '') {
    return [];
  }

  const preferences: AcceptLanguagePreference[] = [];

  header.split(',').forEach((entry, order) => {
    const parts = entry.split(';');
    const tag = parts.shift()?.trim() ?? '';

    if (tag !== '*' && !BROWSER_LOCALE_PATTERN.test(tag)) {
      return;
    }

    let quality = 1;

    for (const parameter of parts) {
      const match = /^q\s*=\s*(.+)$/iu.exec(parameter.trim());

      if (match === null || !ACCEPT_LANGUAGE_QUALITY_PATTERN.test(match[1])) {
        return;
      }

      quality = Number(match[1]);
    }

    preferences.push({ tag, quality, order });
  });

  return preferences.sort(
    (first, second) => second.quality - first.quality || first.order - second.order
  );
}

export type BrowserLocaleInput = string | readonly string[] | null | undefined;

interface BrowserLocaleResolution {
  readonly locale: SupportedLocale;
  readonly matched: boolean;
}

function resolveBrowserLocaleDetails(input: BrowserLocaleInput): BrowserLocaleResolution {
  if (Array.isArray(input)) {
    for (const value of input) {
      if (value === '*') {
        return { locale: DEFAULT_LOCALE, matched: true };
      }

      const locale = supportedLocaleForBrowser(value);
      if (locale !== null) {
        return { locale, matched: true };
      }
    }

    return { locale: DEFAULT_LOCALE, matched: false };
  }

  const header = typeof input === 'string' ? input : null;

  for (const preference of parseAcceptLanguage(header)) {
    if (preference.quality === 0) {
      continue;
    }

    if (preference.tag === '*') {
      return { locale: DEFAULT_LOCALE, matched: true };
    }

    const locale = supportedLocaleForBrowser(preference.tag);
    if (locale !== null) {
      return { locale, matched: true };
    }
  }

  return { locale: DEFAULT_LOCALE, matched: false };
}

export function resolveBrowserLocale(input: BrowserLocaleInput): SupportedLocale {
  return resolveBrowserLocaleDetails(input).locale;
}

export type LocaleResolutionSource = 'url' | 'preference' | 'browser' | 'default';

export interface LocaleResolution {
  readonly locale: SupportedLocale;
  readonly source: LocaleResolutionSource;
}

export interface ResolveLocaleInput {
  /** Explicit URL locale, when the current route has one. */
  readonly explicitLocale?: unknown;
  /** Future persisted preference input; persistence is intentionally not implemented here. */
  readonly preferredLocale?: unknown;
  readonly browserLocale?: BrowserLocaleInput;
}

export function resolveLocale(input: ResolveLocaleInput = {}): LocaleResolution {
  const explicitLocale = parseSupportedLocale(input.explicitLocale);
  if (explicitLocale !== null) {
    return { locale: explicitLocale, source: 'url' };
  }

  const preferredLocale = parseSupportedLocale(input.preferredLocale);
  if (preferredLocale !== null) {
    return { locale: preferredLocale, source: 'preference' };
  }

  const browserResolution = resolveBrowserLocaleDetails(input.browserLocale);
  if (browserResolution.matched) {
    return { locale: browserResolution.locale, source: 'browser' };
  }

  return { locale: DEFAULT_LOCALE, source: 'default' };
}

export type LocalePathKind = 'root' | 'localized' | 'unlocalized' | 'machine' | 'invalid';

export interface LocalePathInfo {
  readonly kind: LocalePathKind;
  readonly pathname: string;
  readonly remainder: string;
  readonly locale?: SupportedLocale;
  readonly localeSegment?: string;
}

function splitPathSuffix(value: string): { pathname: string; suffix: string } {
  const suffixIndex = value.search(/[?#]/u);

  return suffixIndex === -1
    ? { pathname: value, suffix: '' }
    : { pathname: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function isMachinePath(pathname: string): boolean {
  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/health' ||
    pathname.startsWith('/health/') ||
    pathname === '/healthz' ||
    pathname === '/readyz' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/notification-sw.js' ||
    pathname.startsWith('/.well-known/') ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/_server-islands/') ||
    pathname.startsWith('/favicon.')
  );
}

/** Parses only the first URL segment; zh-Hant remains one segment. */
export function parseLocalePath(pathname: unknown): LocalePathInfo {
  if (typeof pathname !== 'string') {
    return { kind: 'invalid', pathname: '', remainder: '/' };
  }

  const { pathname: pathOnly } = splitPathSuffix(pathname);

  if (!pathOnly.startsWith('/')) {
    return { kind: 'invalid', pathname: pathOnly, remainder: '/' };
  }

  if (pathOnly === '/' || pathOnly === '') {
    return { kind: 'root', pathname: '/', remainder: '/' };
  }

  if (isMachinePath(pathOnly)) {
    return { kind: 'machine', pathname: pathOnly, remainder: pathOnly };
  }

  const firstSegment = pathOnly.slice(1).split('/')[0] ?? '';
  const locale = parseSupportedLocale(firstSegment);

  if (locale !== null) {
    const remainder = pathOnly.slice(firstSegment.length + 1) || '/';
    return {
      kind: 'localized',
      pathname: pathOnly,
      remainder: remainder.startsWith('/') ? remainder : `/${remainder}`,
      locale,
      localeSegment: firstSegment
    };
  }

  if (LOCALE_LIKE_SEGMENT_PATTERN.test(firstSegment)) {
    return {
      kind: 'invalid',
      pathname: pathOnly,
      remainder: pathOnly,
      localeSegment: firstSegment
    };
  }

  return { kind: 'unlocalized', pathname: pathOnly, remainder: pathOnly };
}

export function getLocaleFromPath(pathname: unknown): SupportedLocale | null {
  const parsed = parseLocalePath(pathname);
  return parsed.kind === 'localized' ? parsed.locale ?? null : null;
}

/** Returns the route identity without its presentation locale prefix. */
export function getLocaleIndependentPath(path: string): string {
  const { pathname, suffix } = splitPathSuffix(path);
  const parsed = parseLocalePath(pathname);

  return parsed.kind === 'localized' ? `${parsed.remainder}${suffix}` : path;
}

/** Adds or replaces a validated locale prefix while preserving path suffixes. */
export function getLocalizedPath(locale: unknown, path: string): string {
  const parsedLocale = parseSupportedLocale(locale);
  if (parsedLocale === null) {
    throw new TypeError('Unsupported locale');
  }

  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError('Localized paths must be rooted URL paths');
  }

  const { pathname, suffix } = splitPathSuffix(path);
  const parsedPath = parseLocalePath(pathname);

  if (parsedPath.kind === 'machine') {
    return `${pathname}${suffix}`;
  }

  if (parsedPath.kind === 'invalid') {
    throw new TypeError('Cannot localize an invalid URL path');
  }

  const remainder = parsedPath.kind === 'localized' ? parsedPath.remainder : pathname || '/';
  return `/${parsedLocale}${remainder === '/' ? '/' : remainder}${suffix}`;
}

export function getLocalizedCurrentPath(currentPath: string, targetPath: string): string {
  return getLocalizedPath(getLocaleFromPath(currentPath) ?? DEFAULT_LOCALE, targetPath);
}

export interface RequestLocaleResolution extends LocaleResolution {
  readonly path: LocalePathInfo;
}

export interface ResolveRequestLocaleInput {
  readonly pathname: unknown;
  readonly preferredLocale?: unknown;
  readonly acceptLanguage?: BrowserLocaleInput;
}

export function resolveRequestLocale(
  input: ResolveRequestLocaleInput
): RequestLocaleResolution {
  const path = parseLocalePath(input.pathname);

  if (path.kind === 'localized' && path.locale !== undefined) {
    return { locale: path.locale, source: 'url', path };
  }

  if (path.kind === 'invalid' || path.kind === 'machine') {
    return { locale: DEFAULT_LOCALE, source: 'default', path };
  }

  return { ...resolveLocale({
    preferredLocale: input.preferredLocale,
    browserLocale: input.acceptLanguage
  }), path };
}

export function resolveRootLocale(input: Omit<ResolveLocaleInput, 'explicitLocale'> = {}): SupportedLocale {
  return resolveLocale(input).locale;
}

export function getPresentationLocale(
  pathname: unknown,
  requestLocale?: unknown
): SupportedLocale {
  return getLocaleFromPath(pathname) ?? parseSupportedLocale(requestLocale) ?? DEFAULT_LOCALE;
}

export function getLocaleStaticPaths() {
  return SUPPORTED_LOCALES.map((locale) => ({ params: { locale } }));
}
