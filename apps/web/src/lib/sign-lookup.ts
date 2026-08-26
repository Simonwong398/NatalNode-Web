import { SIGN_STYLES } from '@/features/interpretation/interpretation-content';

export const ELEMENT_MEANINGS = {
  Fire: 'A symbolic lens for initiative, warmth, visibility, and active expression.',
  Earth: 'A symbolic lens for steadiness, embodiment, practical attention, and tangible values.',
  Air: 'A symbolic lens for thought, language, exchange, and perspective.',
  Water: 'A symbolic lens for feeling, imagination, memory, and connection.'
} as const;

export type SignElement = keyof typeof ELEMENT_MEANINGS;

export const MODALITY_MEANINGS = {
  Cardinal: 'A way of describing energy that initiates, begins, and responds to a starting point.',
  Fixed: 'A way of describing energy that sustains, concentrates, and develops consistency.',
  Mutable: 'A way of describing energy that adapts, integrates, and makes room for change.'
} as const;

export type SignModality = keyof typeof MODALITY_MEANINGS;

type SignOption = {
  id: string;
  label: string;
  element: SignElement;
  modality: SignModality;
};

export const SIGN_OPTIONS = [
  { id: 'aries', label: 'Aries', element: 'Fire', modality: 'Cardinal' },
  { id: 'taurus', label: 'Taurus', element: 'Earth', modality: 'Fixed' },
  { id: 'gemini', label: 'Gemini', element: 'Air', modality: 'Mutable' },
  { id: 'cancer', label: 'Cancer', element: 'Water', modality: 'Cardinal' },
  { id: 'leo', label: 'Leo', element: 'Fire', modality: 'Fixed' },
  { id: 'virgo', label: 'Virgo', element: 'Earth', modality: 'Mutable' },
  { id: 'libra', label: 'Libra', element: 'Air', modality: 'Cardinal' },
  { id: 'scorpio', label: 'Scorpio', element: 'Water', modality: 'Fixed' },
  { id: 'sagittarius', label: 'Sagittarius', element: 'Fire', modality: 'Mutable' },
  { id: 'capricorn', label: 'Capricorn', element: 'Earth', modality: 'Cardinal' },
  { id: 'aquarius', label: 'Aquarius', element: 'Air', modality: 'Fixed' },
  { id: 'pisces', label: 'Pisces', element: 'Water', modality: 'Mutable' }
] as const satisfies readonly SignOption[];

export type SignId = (typeof SIGN_OPTIONS)[number]['id'];

const SIGN_TENSIONS: Record<SignId, string> = {
  aries: 'Impatience can make it harder to pause, listen, or account for a slower pace.',
  taurus: 'A preference for stability can become resistance to change or attachment to familiar comfort.',
  gemini: 'Curiosity can become scattered attention or a tendency to stay with possibilities rather than depth.',
  cancer: 'Care can become overprotection or taking changes in closeness too personally.',
  leo: 'Confidence can become a need for recognition or overlooking quieter contributions.',
  virgo: 'Discernment can become over-editing or measuring worth through constant improvement.',
  libra: 'A wish for balance can become indecision or smoothing over meaningful differences.',
  scorpio: 'Depth can become guardedness or a habit of holding too tightly to control.',
  sagittarius: 'A love of expansion can become restlessness or treating certainty as freedom.',
  capricorn: 'Responsibility can become rigidity or measuring self-worth mainly through outcomes.',
  aquarius: 'Independence can become detachment or favoring a theory over lived context.',
  pisces: 'Sensitivity can become porous boundaries or retreat into idealized possibilities.'
};

export type SignLookupInterpretation = {
  sign: string;
  element: SignElement;
  elementLens: string;
  modality: SignModality;
  modalityLens: string;
  coreStyle: string;
  constructiveExpression: string;
  potentialTension: string;
};

export function composeSignLookupInterpretation(signId: string): SignLookupInterpretation | null {
  const sign = SIGN_OPTIONS.find((option) => option.id === signId);

  if (!sign) {
    return null;
  }

  const style = SIGN_STYLES[sign.label];

  return {
    sign: sign.label,
    element: sign.element,
    elementLens: ELEMENT_MEANINGS[sign.element],
    modality: sign.modality,
    modalityLens: MODALITY_MEANINGS[sign.modality],
    coreStyle: style.style,
    constructiveExpression: style.expression,
    potentialTension: SIGN_TENSIONS[sign.id]
  };
}

export function initializeSignLookup(): void {
  const form = document.querySelector<HTMLFormElement>('[data-sign-lookup-form]');
  const select = document.querySelector<HTMLSelectElement>('[data-sign-select]');
  const result = document.querySelector<HTMLElement>('[data-sign-result]');
  const resultContent = document.querySelector<HTMLElement>('[data-sign-result-content]');
  const emptyState = document.querySelector<HTMLElement>('[data-sign-empty]');

  if (!form || !select || !result || !resultContent || !emptyState) {
    return;
  }

  const render = (): void => {
    const interpretation = composeSignLookupInterpretation(select.value);

    if (!interpretation) {
      resultContent.replaceChildren();
      result.hidden = true;
      emptyState.hidden = false;
      return;
    }

    const heading = document.createElement('h2');
    heading.className = 'nn-type-section-title';
    heading.id = 'sign-result-title';
    heading.textContent = `${interpretation.sign}: an interpretive snapshot`;

    const summary = document.createElement('p');
    summary.className = 'nn-type-body mt-4 max-w-3xl';
    summary.textContent = `${interpretation.sign} is described here as ${interpretation.coreStyle}.`;

    const details = document.createElement('dl');
    details.className = 'mt-8 grid gap-6 sm:grid-cols-3';

    const fields: Array<[string, string]> = [
      ['Element', `${interpretation.element} — ${interpretation.elementLens}`],
      ['Modality', `${interpretation.modality} — ${interpretation.modalityLens}`],
      ['Core style', interpretation.coreStyle]
    ];

    for (const [label, value] of fields) {
      const item = document.createElement('div');
      item.className = 'border-t border-natal-border/70 pt-3';

      const term = document.createElement('dt');
      term.className = 'nn-type-metadata';
      term.textContent = label;

      const description = document.createElement('dd');
      description.className = 'nn-type-body-small mt-2';
      description.textContent = value;

      item.append(term, description);
      details.append(item);
    }

    const constructive = document.createElement('p');
    constructive.className = 'nn-type-body mt-8 max-w-3xl';
    constructive.textContent = `Constructive expression: ${interpretation.constructiveExpression}.`;

    const tension = document.createElement('p');
    tension.className = 'nn-type-body mt-4 max-w-3xl';
    tension.textContent = `Potential tension: ${interpretation.potentialTension}`;

    resultContent.replaceChildren(heading, summary, details, constructive, tension);
    result.hidden = false;
    emptyState.hidden = true;
  };

  select.addEventListener('change', render);
  form.addEventListener('reset', () => {
    window.setTimeout(render, 0);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  render();
}
