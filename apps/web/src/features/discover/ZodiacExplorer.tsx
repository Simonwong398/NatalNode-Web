import { useMemo, useState } from 'react';
import { getAstrologyGlyph } from '@/core/astrology-taxonomy/AstrologyGlyph';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/core/astrology-taxonomy/astrology-glossary';
import { SIGN_CLASSIFICATIONS, type SignId } from '@/core/astrology-taxonomy/chart-taxonomy';
import {
  getZodiacElementContent,
  getZodiacModalityContent,
  getZodiacSignContent,
  ZODIAC_ELEMENT_MEMBERS,
  ZODIAC_MODALITY_MEMBERS
} from '@/content/discover/zodiac';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { formatUiMessage, getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';

type Props = {
  locale: SupportedLocale;
  learnHref: string;
  calculateHref: string;
  initialSignId?: SignId;
  mode?: 'explorer' | 'detail';
};

const DEFAULT_SIGN_ID = SIGN_CLASSIFICATIONS[0].id;

function localizedTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale
): string {
  return resolveAstrologyDomainTerm(kind, value, locale)?.displayTerm ?? String(value);
}

function ui(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

export default function ZodiacExplorer({
  locale,
  learnHref,
  calculateHref,
  initialSignId = DEFAULT_SIGN_ID,
  mode = 'explorer'
}: Props) {
  const initialSign = SIGN_CLASSIFICATIONS.find((sign) => sign.id === initialSignId) ?? SIGN_CLASSIFICATIONS[0];
  const [selectedSignId, setSelectedSignId] = useState<SignId>(initialSign.id);
  const selectedSign = SIGN_CLASSIFICATIONS.find((sign) => sign.id === selectedSignId) ?? initialSign;
  const selectedContent = getZodiacSignContent(selectedSign.id, locale);
  const selectedName = localizedTerm('sign', selectedSign.label, locale);
  const elementContent = getZodiacElementContent(selectedSign.element, locale);
  const modalityContent = getZodiacModalityContent(selectedSign.modality, locale);
  const elementName = elementContent.label;
  const modalityName = modalityContent.label;
  const elementDescription = elementContent.description;
  const modalityDescription = modalityContent.description;

  const elementMembers = useMemo(
    () => ZODIAC_ELEMENT_MEMBERS[selectedSign.element].map((signId) => {
      const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === signId);
      return sign === undefined ? signId : localizedTerm('sign', sign.label, locale);
    }),
    [locale, selectedSign.element]
  );
  const modalityMembers = useMemo(
    () => ZODIAC_MODALITY_MEMBERS[selectedSign.modality].map((signId) => {
      const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === signId);
      return sign === undefined ? signId : localizedTerm('sign', sign.label, locale);
    }),
    [locale, selectedSign.modality]
  );

  const selectorLabel = ui(locale, 'discover.zodiac.selectorLabel');
  const explorerPath = getLocalizedPath(locale, '/discover/zodiac/');

  return (
    <div className="nn-discover-zodiac min-w-0">
      {mode === 'detail' ? (
        <a className="nn-button nn-button--quiet -ml-3" href={explorerPath}>
          {ui(locale, 'discover.zodiac.backToExplorer')}
        </a>
      ) : null}

      <section
        className="mt-8 nn-surface nn-surface--elevated p-4 sm:p-6"
        aria-labelledby="zodiac-selector-title"
      >
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.zodiac.eyebrow')}</p>
          <h2 className="nn-type-section-title" id="zodiac-selector-title">
            {selectorLabel}
          </h2>
        </div>

        <ul
          className="mt-6 grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          aria-label={selectorLabel}
          data-zodiac-selector
        >
          {SIGN_CLASSIFICATIONS.map((sign) => {
            const isSelected = sign.id === selectedSign.id;
            const signName = localizedTerm('sign', sign.label, locale);
            const glyph = getAstrologyGlyph('sign', sign.label);
            const className = [
              'group flex min-h-16 w-full min-w-0 items-center gap-3 rounded-nn-small border px-3 py-3 text-left transition-colors',
              isSelected
                ? 'border-nn-accent-primary bg-nn-surface-selected text-nn-text-primary shadow-nn-low'
                : 'border-nn-border-default bg-nn-surface-base text-nn-text-secondary hover:border-nn-accent-supporting hover:bg-nn-surface-interactive'
            ].join(' ');

            return (
              <li key={sign.id} className="min-w-0">
                {mode === 'detail' ? (
                  <a
                    className={className}
                    href={getLocalizedPath(locale, `/discover/zodiac/${sign.id}/`)}
                    aria-current={isSelected ? 'page' : undefined}
                    aria-label={formatUiMessage(locale, 'discover.zodiac.openProfile', { sign: signName })}
                    data-sign-id={sign.id}
                  >
                    <span className="shrink-0 text-2xl leading-none text-nn-accent-supporting" aria-hidden="true">
                      {glyph}
                    </span>
                    <span className="min-w-0 break-words font-semibold">{signName}</span>
                  </a>
                ) : (
                  <button
                    className={className}
                    type="button"
                    aria-pressed={isSelected}
                    aria-controls="zodiac-sign-profile"
                    aria-label={signName}
                    data-sign-id={sign.id}
                    onClick={() => setSelectedSignId(sign.id)}
                  >
                    <span className="shrink-0 text-2xl leading-none text-nn-accent-supporting" aria-hidden="true">
                      {glyph}
                    </span>
                    <span className="min-w-0 break-words font-semibold">{signName}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <article
        className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]"
        id="zodiac-sign-profile"
        aria-labelledby="selected-sign-title"
        data-selected-sign={selectedSign.id}
      >
        <section className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-8">
          <header className="border-b border-nn-border-subtle pb-6">
            <p className="nn-type-metadata">{ui(locale, 'discover.zodiac.selectedSign')}</p>
            <div className="mt-3 flex min-w-0 items-center gap-4">
              <span className="shrink-0 text-5xl leading-none text-nn-accent-supporting" aria-hidden="true">
                {getAstrologyGlyph('sign', selectedSign.label)}
              </span>
              <h2 className="nn-type-page-title min-w-0 break-words" id="selected-sign-title">
                {selectedName}
              </h2>
            </div>
          </header>

          <dl className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-nn-small border border-nn-border-subtle bg-nn-surface-base p-4">
              <dt className="nn-type-metadata">{ui(locale, 'discover.zodiac.elementLabel')}</dt>
              <dd className="mt-1 break-words text-lg font-semibold text-nn-text-primary">{elementName}</dd>
            </div>
            <div className="min-w-0 rounded-nn-small border border-nn-border-subtle bg-nn-surface-base p-4">
              <dt className="nn-type-metadata">{ui(locale, 'discover.zodiac.modalityLabel')}</dt>
              <dd className="mt-1 break-words text-lg font-semibold text-nn-text-primary">{modalityName}</dd>
            </div>
          </dl>

          <p className="nn-type-body mt-6">{selectedContent.summary}</p>

          <section className="mt-8 border-t border-nn-border-subtle pt-6" aria-labelledby="zodiac-structure-title">
            <p className="nn-eyebrow">{ui(locale, 'discover.zodiac.structureTitle')}</p>
            <h3 className="nn-type-section-title mt-2" id="zodiac-structure-title">
              {elementName} + {modalityName}
            </h3>
            <div className="mt-4 grid min-w-0 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <h4 className="nn-type-label">{elementName}</h4>
                <p className="nn-type-body-small mt-2">{elementDescription}</p>
              </div>
              <div className="min-w-0">
                <h4 className="nn-type-label">{modalityName}</h4>
                <p className="nn-type-body-small mt-2">{modalityDescription}</p>
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-nn-border-subtle pt-6" aria-labelledby="zodiac-chart-function-title">
            <p className="nn-eyebrow">{ui(locale, 'discover.zodiac.chartFunctionTitle')}</p>
            <p className="nn-type-body mt-3" id="zodiac-chart-function-title">
              {selectedContent.chartFunction}
            </p>
          </section>
        </section>

        <aside className="nn-surface min-w-0 p-5 sm:p-6" aria-label={selectorLabel}>
          <section>
            <h3 className="nn-type-card-title">{formatUiMessage(locale, 'discover.zodiac.elementFamily', { element: elementName })}</h3>
            <p className="nn-type-body-small mt-3">{elementMembers.join(' · ')}</p>
          </section>
          <section className="mt-8 border-t border-nn-border-subtle pt-6">
            <h3 className="nn-type-card-title">{formatUiMessage(locale, 'discover.zodiac.modalityFamily', { modality: modalityName })}</h3>
            <p className="nn-type-body-small mt-3">{modalityMembers.join(' · ')}</p>
          </section>
        </aside>
      </article>

      <p className="nn-notice nn-notice--trust mt-6" role="note">
        {ui(locale, 'discover.zodiac.disclosure')}
      </p>

      <nav className="mt-6 flex min-w-0 flex-wrap gap-3" aria-label={ui(locale, 'discover.zodiac.nextSteps')}>
        <a className="nn-button nn-button--primary" href={learnHref}>
          {ui(locale, 'discover.zodiac.learnCta')}
        </a>
        <a className="nn-button nn-button--secondary" href={calculateHref}>
          {ui(locale, 'discover.zodiac.calculateCta')}
        </a>
      </nav>
    </div>
  );
}
