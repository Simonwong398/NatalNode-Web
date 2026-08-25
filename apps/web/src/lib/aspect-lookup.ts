import {
  ASPECT_DYNAMICS,
  PLANET_MEANINGS,
  SUPPORTED_PLANETS,
  type SupportedAspectType,
  type SupportedPlanet
} from '@/features/interpretation/interpretation-content';

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

function getAspectLabel(aspectType: SupportedAspectType): string {
  return ASPECT_OPTIONS.find((aspect) => aspect.value === aspectType)?.label ?? aspectType;
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
  planetB: SupportedPlanet
): AspectLookupInterpretation {
  const [firstPlanet, secondPlanet] = normalizePlanetOrder(planetA, planetB);
  const firstMeaning = PLANET_MEANINGS[firstPlanet];
  const secondMeaning = PLANET_MEANINGS[secondPlanet];
  const dynamic = ASPECT_DYNAMICS[aspectType];
  const aspectLabel = getAspectLabel(aspectType);

  return {
    title: `${firstPlanet} ${aspectLabel} ${secondPlanet}`,
    paragraphs: [
      `${firstPlanet} can be associated with ${firstMeaning.focus.toLowerCase()}, often expressed through ${firstMeaning.expression}. ${secondPlanet} can be associated with ${secondMeaning.focus.toLowerCase()}, often expressed through ${secondMeaning.expression}.`,
      `A ${aspectLabel.toLowerCase()} is a ${dynamic.quality} way to read the connection between those themes. The combination may emphasize ${dynamic.expression}, so each theme can make the other more noticeable in the same area of reflection.`,
      `A constructive expression may involve ${dynamic.guidance}. This is an interpretive starting point rather than a fixed verdict: the value is in noticing how the two themes can be held in a more conscious conversation.`
    ]
  };
}

function createParagraph(text: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.className = 'mt-4 text-sm leading-7 text-natal-muted';
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
      planetB.value
    );
    const heading = document.createElement('h2');
    heading.className = 'text-2xl font-semibold tracking-[-0.03em] text-white';
    heading.id = 'aspect-result-title';
    heading.textContent = interpretation.title;

    resultContent.replaceChildren(
      heading,
      ...interpretation.paragraphs.map((paragraph) => createParagraph(paragraph))
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
