import { getPublicSeoAlternates } from '../../lib/public-seo.js';
import { getOpenGraphLocale, type SeoMetadata } from '../../lib/seo.js';
import type { SupportedLocale } from '../../lib/localization.js';
import type { ShareCardBase } from './share-card-models.js';

export function createShareSeo(
  locale: SupportedLocale,
  model: ShareCardBase
): SeoMetadata {
  return {
    title: model.seoTitle,
    description: model.seoDescription,
    canonical: model.canonicalPath,
    alternates: getPublicSeoAlternates(model.routePath),
    ogLocale: getOpenGraphLocale(locale)
  };
}
