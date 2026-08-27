import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { resolveCanonicalUrl } from '@/lib/seo';

const publicPaths = [
  '/',
  '/learn/',
  '/methodology',
  '/about',
  '/tools/',
  '/tools/sign-lookup',
  '/tools/house-lookup',
  '/tools/aspect-lookup'
];

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const articles = await getCollection('learn', ({ data }) => !data.draft);
  const urls = [...new Set([
    ...publicPaths.map((path) => resolveCanonicalUrl(path)),
    ...articles.map((entry) => resolveCanonicalUrl(`/learn/${entry.data.slug}`))
  ])].sort();

  const urlEntries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>'
  ].join('\n');

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
