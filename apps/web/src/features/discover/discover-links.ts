import { FOUNDATIONS_LESSONS } from '@/features/learn/foundations/registry';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';

/** Resolve the existing Foundations identity instead of guessing a lesson slug. */
export function getZodiacFoundationsHref(locale: SupportedLocale): string {
  const lesson = FOUNDATIONS_LESSONS.find(
    (candidate) => candidate.myChartHook.capability === 'ZODIAC_STRUCTURE'
  );

  if (lesson === undefined) {
    throw new Error('Foundations zodiac-structure lesson is missing.');
  }

  return getLocalizedPath(locale, `/learn/foundations/${lesson.slug}/`);
}

export function getCalculateHref(locale: SupportedLocale): string {
  return getLocalizedPath(locale, '/');
}
