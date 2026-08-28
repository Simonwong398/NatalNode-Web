import { SITE_ORIGIN } from '@/lib/seo';
import type { APIRoute } from 'astro';

const sitemapUrl = new URL('/sitemap.xml', SITE_ORIGIN).toString();

export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /auth',
    'Disallow: /vault',
    'Disallow: /feedback',
    'Disallow: /api',
    `Sitemap: ${sitemapUrl}`
  ].join('\n');

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
