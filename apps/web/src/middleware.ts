import { defineMiddleware } from 'astro:middleware';
import {
  getLocalizedPath,
  resolveRequestLocale
} from '@/lib/localization';

const ERROR_PAGE_PATHS = new Set(['/404', '/500']);
const PRESENTATION_PAGE_ROUTE_PATTERNS = new Set([
  '/',
  '/about',
  '/account',
  '/auth/complete',
  '/auth/sign-in',
  '/dev/current-sky',
  '/feedback',
  '/learn',
  '/learn/[slug]',
  '/methodology',
  '/tools',
  '/tools/aspect-lookup',
  '/tools/house-lookup',
  '/tools/sign-lookup',
  '/vault',
  '/vault/chart'
]);

/**
 * Resolves locale before presentation rendering and keeps legacy page URLs as
 * redirects. Endpoint, asset, and reserved error routes are not localized.
 */
export const onRequest = defineMiddleware((context, next) => {
  const resolution = resolveRequestLocale({
    pathname: context.url.pathname,
    // Static prerendering has no request headers. Runtime/dev requests retain
    // the header-driven negotiation path; static output deterministically uses
    // the English fallback.
    acceptLanguage: context.isPrerendered
      ? null
      : context.request.headers.get('accept-language')
  });

  context.locals.locale = resolution.locale;
  context.locals.localeSource = resolution.source;
  context.locals.localePath = resolution.path;

  if (
    PRESENTATION_PAGE_ROUTE_PATTERNS.has(context.routePattern) &&
    !ERROR_PAGE_PATHS.has(context.url.pathname) &&
    (resolution.path.kind === 'root' || resolution.path.kind === 'unlocalized')
  ) {
    const destination = getLocalizedPath(
      resolution.locale,
      `${context.url.pathname}${context.url.search}`
    );

    return context.redirect(destination, 302);
  }

  return next();
});
