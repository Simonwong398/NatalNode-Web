import {
  ASPECT_DYNAMICS,
  PLANET_MEANINGS,
  SUPPORTED_PLANETS,
  type SupportedAspectType,
  type SupportedPlanet
} from '@/features/interpretation/interpretation-content';
import {
  DEFAULT_LOCALE,
  parseSupportedLocale,
  type SupportedLocale
} from '@/lib/localization';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/lib/astrology-glossary';
import {
  formatToolDetailMessage,
  getToolDetailCopy
} from '@/lib/tools-detail-copy';

export { SUPPORTED_PLANETS } from '@/features/interpretation/interpretation-content';
export type {
  SupportedAspectType,
  SupportedPlanet
} from '@/features/interpretation/interpretation-content';

export const ASPECT_OPTIONS = [
  { value: 'conjunction', label: 'Conjunction' },
  { value: 'opposition', label: 'Opposition' },
  { value: 'trine', label: 'Trine' },
  { value: 'square', label: 'Square' },
  { value: 'sextile', label: 'Sextile' }
] as const satisfies readonly { value: SupportedAspectType; label: string }[];

export interface AspectLookupInterpretation {
  readonly title: string;
  readonly paragraphs: readonly [string, string, string];
}

function isSupportedPlanet(value: string): value is SupportedPlanet {
  return SUPPORTED_PLANETS.some((planet) => planet === value);
}

function isSupportedAspect(value: string): value is SupportedAspectType {
  return ASPECT_OPTIONS.some((aspect) => aspect.value === value);
}

function glossaryTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale
): string {
  return resolveAstrologyDomainTerm(kind, value, locale)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
}

function getCanonicalAspectLabel(aspectType: SupportedAspectType): string {
  return resolveAstrologyDomainTerm('aspect', aspectType, DEFAULT_LOCALE)?.displayTerm ??
    ASPECT_OPTIONS.find((aspect) => aspect.value === aspectType)?.label ??
    aspectType;
}

function normalizePlanetOrder(
  planetA: SupportedPlanet,
  planetB: SupportedPlanet
): readonly [SupportedPlanet, SupportedPlanet] {
  const firstIndex = SUPPORTED_PLANETS.indexOf(planetA);
  const secondIndex = SUPPORTED_PLANETS.indexOf(planetB);

  return firstIndex <= secondIndex ? [planetA, planetB] : [planetB, planetA];
}

export function composeAspectLookupInterpretation(
  planetA: SupportedPlanet,
  aspectType: SupportedAspectType,
  planetB: SupportedPlanet,
  locale: SupportedLocale = DEFAULT_LOCALE
): AspectLookupInterpretation {
  const [firstPlanet, secondPlanet] = normalizePlanetOrder(planetA, planetB);
  const firstMeaning = PLANET_MEANINGS[firstPlanet];
  const secondMeaning = PLANET_MEANINGS[secondPlanet];
  const dynamic = ASPECT_DYNAMICS[aspectType];
  const firstPlanetTerm = glossaryTerm('body', firstPlanet, locale);
  const secondPlanetTerm = glossaryTerm('body', secondPlanet, locale);
  const aspectTerm = glossaryTerm('aspect', aspectType, locale);
  const canonicalAspectLabel = getCanonicalAspectLabel(aspectType);

  return {
    title: `${firstPlanetTerm} ${aspectTerm} ${secondPlanetTerm}`,
    paragraphs: [
      `${firstPlanet} can be associated with ${firstMeaning.focus.toLowerCase()}, often expressed through ${firstMeaning.expression}. ${secondPlanet} can be associated with ${secondMeaning.focus.toLowerCase()}, often expressed through ${secondMeaning.expression}.`,
      `A ${canonicalAspectLabel.toLowerCase()} is a ${dynamic.quality} way to read the connection between those themes. The combination may emphasize ${dynamic.expression}, so each theme can make the other more noticeable in the same area of reflection.`,
      `A constructive expression may involve ${dynamic.guidance}. This is an interpretive starting point rather than a fixed verdict: the value is in noticing how the two themes can be held in a more conscious conversation.`
    ]
  };
}

function createParagraph(text: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.className = 'nn-type-body mt-4 max-w-3xl';
  paragraph.textContent = text;
  return paragraph;
}

export function initializeAspectLookup(): void {
  const form = document.querySelector<HTMLFormElement>('[data-aspect-lookup-form]');
  const planetA = form?.querySelector<HTMLSelectElement>('[data-planet-a]');
  const aspect = form?.querySelector<HTMLSelectElement>('[data-aspect]');
  const planetB = form?.querySelector<HTMLSelectElement>('[data-planet-b]');
  const emptyState = document.querySelector<HTMLElement>('[data-aspect-empty]');
  const result = document.querySelector<HTMLElement>('[data-aspect-result]');
  const resultContent = result?.querySelector<HTMLElement>('[data-aspect-result-content]');

  if (!form || !planetA || !aspect || !planetB || !emptyState || !result || !resultContent) {
    return;
  }

  const locale = parseSupportedLocale(form.dataset.glossaryLocale) ?? DEFAULT_LOCALE;
  const copy = getToolDetailCopy(locale);

  const updateResult = () => {
    if (!isSupportedPlanet(planetA.value) || !isSupportedAspect(aspect.value) || !isSupportedPlanet(planetB.value)) {
      emptyState.hidden = false;
      result.hidden = true;
      resultContent.replaceChildren();
      return;
    }

    const interpretation = composeAspectLookupInterpretation(
      planetA.value,
      aspect.value,
      planetB.value,
      locale
    );
    const firstPlanetTerm = glossaryTerm('body', planetA.value, locale);
    const secondPlanetTerm = glossaryTerm('body', planetB.value, locale);
    const aspectTerm = glossaryTerm('aspect', aspect.value, locale);
    const heading = document.createElement('h2');
    heading.className = 'nn-type-section-title';
    heading.id = 'aspect-result-title';
    heading.textContent = locale === DEFAULT_LOCALE
      ? interpretation.title
      : `${firstPlanetTerm} ${aspectTerm} ${secondPlanetTerm}`;

    const paragraphs = locale === DEFAULT_LOCALE
      ? interpretation.paragraphs
      : [
          formatToolDetailMessage(copy.aspect.resultParagraphOne, {
            first: firstPlanetTerm,
            second: secondPlanetTerm,
            aspect: aspectTerm
          }),
          formatToolDetailMessage(copy.aspect.resultParagraphTwo, { aspect: aspectTerm }),
          formatToolDetailMessage(copy.aspect.resultParagraphThree, {})
        ];

    resultContent.replaceChildren(
      heading,
      ...paragraphs.map((paragraph) => createParagraph(paragraph))
    );
    emptyState.hidden = true;
    result.hidden = false;
  };

  for (const control of [planetA, aspect, planetB]) {
    control.addEventListener('change', updateResult);
  }

  form.addEventListener('reset', () => {
    window.setTimeout(updateResult, 0);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  updateResult();
}
