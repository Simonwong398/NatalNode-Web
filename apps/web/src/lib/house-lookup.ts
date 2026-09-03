import { HOUSE_DOMAINS } from '@/features/interpretation/interpretation-content';
import {
  DEFAULT_LOCALE,
  parseSupportedLocale,
  type SupportedLocale
} from '@/lib/localization';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/core/astrology-taxonomy/astrology-glossary';
import {
  formatToolDetailMessage,
  getToolDetailCopy
} from '@/lib/tools-detail-copy';

type HouseOption = {
  id: string;
  number: number;
  label: string;
};

export const HOUSE_OPTIONS = [
  { id: '1', number: 1, label: '1st House' },
  { id: '2', number: 2, label: '2nd House' },
  { id: '3', number: 3, label: '3rd House' },
  { id: '4', number: 4, label: '4th House' },
  { id: '5', number: 5, label: '5th House' },
  { id: '6', number: 6, label: '6th House' },
  { id: '7', number: 7, label: '7th House' },
  { id: '8', number: 8, label: '8th House' },
  { id: '9', number: 9, label: '9th House' },
  { id: '10', number: 10, label: '10th House' },
  { id: '11', number: 11, label: '11th House' },
  { id: '12', number: 12, label: '12th House' }
] as const satisfies readonly HouseOption[];

export type HouseId = (typeof HOUSE_OPTIONS)[number]['id'];

export type HouseLookupInterpretation = {
  houseNumber: number;
  houseLabel: string;
  coreDomain: string;
  keyThemes: readonly string[];
  constructiveExpression: string;
  potentialTension: string;
};

function glossaryTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale
): string {
  return resolveAstrologyDomainTerm(kind, value, locale)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
}

export function composeHouseLookupInterpretation(houseId: string): HouseLookupInterpretation | null {
  const house = HOUSE_OPTIONS.find((option) => option.id === houseId);

  if (!house) {
    return null;
  }

  const domain = HOUSE_DOMAINS[house.number];

  if (!domain) {
    return null;
  }

  return {
    houseNumber: house.number,
    houseLabel: house.label,
    coreDomain: domain.focus,
    keyThemes: domain.themes,
    constructiveExpression: domain.expression,
    potentialTension: domain.tension
  };
}

export function initializeHouseLookup(): void {
  const form = document.querySelector<HTMLFormElement>('[data-house-lookup-form]');
  const select = document.querySelector<HTMLSelectElement>('[data-house-select]');
  const result = document.querySelector<HTMLElement>('[data-house-result]');
  const resultContent = document.querySelector<HTMLElement>('[data-house-result-content]');
  const emptyState = document.querySelector<HTMLElement>('[data-house-empty]');

  if (!form || !select || !result || !resultContent || !emptyState) {
    return;
  }

  const locale = parseSupportedLocale(form.dataset.glossaryLocale) ?? DEFAULT_LOCALE;
  const copy = getToolDetailCopy(locale);

  const render = (): void => {
    const interpretation = composeHouseLookupInterpretation(select.value);

    if (!interpretation) {
      resultContent.replaceChildren();
      result.hidden = true;
      emptyState.hidden = false;
      return;
    }

    const houseTerm = glossaryTerm('house', interpretation.houseNumber, locale);
    const heading = document.createElement('h2');
    heading.className = 'nn-type-section-title';
    heading.id = 'house-result-title';
    heading.textContent = formatToolDetailMessage(copy.house.resultTitle, { house: houseTerm });

    const summary = document.createElement('p');
    summary.className = 'nn-type-body mt-4 max-w-3xl';
    summary.textContent = formatToolDetailMessage(copy.house.resultSummary, { house: houseTerm });

    const details = document.createElement('dl');
    details.className = 'mt-8 grid gap-6 lg:grid-cols-3';

    const fields: Array<[string, string]> = [
      [
        copy.house.coreDomainLabel,
        locale === DEFAULT_LOCALE
          ? interpretation.coreDomain
          : formatToolDetailMessage(copy.house.resultCoreDomain, { house: houseTerm })
      ],
      [
        copy.house.keyThemesLabel,
        locale === DEFAULT_LOCALE
          ? interpretation.keyThemes.join(' · ')
          : formatToolDetailMessage(copy.house.resultKeyThemes, { house: houseTerm })
      ],
      [
        copy.house.constructiveLabel,
        locale === DEFAULT_LOCALE
          ? interpretation.constructiveExpression
          : formatToolDetailMessage(copy.house.resultConstructive, { house: houseTerm })
      ]
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

    const tension = document.createElement('p');
    tension.className = 'nn-type-body mt-8 max-w-3xl';
    tension.textContent = locale === DEFAULT_LOCALE
      ? `Potential tension / balancing consideration: ${interpretation.potentialTension}`
      : formatToolDetailMessage(copy.house.resultTension, { house: houseTerm });

    resultContent.replaceChildren(heading, summary, details, tension);
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
