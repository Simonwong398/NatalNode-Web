import { getAstrologyGlyph } from '@/core/astrology-taxonomy/AstrologyGlyph';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/core/astrology-taxonomy/astrology-glossary';
import {
  SIGN_CLASSIFICATIONS,
  type SignId
} from '@/core/astrology-taxonomy/chart-taxonomy';
import {
  ELEMENT_ORDER,
  getCrossClassificationCell,
  MODALITY_ORDER
} from '@/content/discover/elements-modes';
import {
  getZodiacElementContent,
  getZodiacModalityContent,
  ZODIAC_ELEMENT_MEMBERS,
  ZODIAC_MODALITY_MEMBERS
} from '@/content/discover/zodiac';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { formatUiMessage, getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';

type Props = {
  locale: SupportedLocale;
  zodiacHref: string;
  matchHref: string;
  learnHref: string;
  calculateHref: string;
};

function localizedTerm(
  kind: AstrologyGlossaryDomainKind,
  value: string,
  locale: SupportedLocale
): string {
  return resolveAstrologyDomainTerm(kind, value, locale)?.displayTerm ?? value;
}

function ui(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function getSign(signId: SignId) {
  const sign = SIGN_CLASSIFICATIONS.find((candidate) => candidate.id === signId);
  if (sign === undefined) {
    throw new Error(`Missing Core sign for ${signId}`);
  }
  return sign;
}

function SignLink({
  locale,
  signId,
  compact = false
}: {
  locale: SupportedLocale;
  signId: SignId;
  compact?: boolean;
}) {
  const sign = getSign(signId);
  const signName = localizedTerm('sign', sign.label, locale);

  return (
    <a
      className={[
        'inline-flex min-h-11 min-w-0 items-center gap-2 rounded-nn-small border border-nn-border-default bg-nn-surface-base px-3 py-2 font-semibold text-nn-text-primary underline decoration-nn-accent-supporting/50 underline-offset-4 transition-colors hover:border-nn-accent-supporting hover:text-nn-accent-supporting',
        compact ? 'w-full justify-between' : ''
      ].join(' ')}
      href={getLocalizedPath(locale, `/discover/zodiac/${sign.id}/`)}
      aria-label={formatUiMessage(locale, 'discover.elementsModes.signLink', { sign: signName })}
      data-sign-id={sign.id}
    >
      <span className="shrink-0 text-xl leading-none text-nn-accent-supporting" aria-hidden="true">
        {getAstrologyGlyph('sign', sign.label)}
      </span>
      <span className="min-w-0 break-words">{signName}</span>
    </a>
  );
}

export default function ElementsModesExplorer({
  locale,
  zodiacHref,
  matchHref,
  learnHref,
  calculateHref
}: Props) {
  return (
    <div className="nn-discover-elements-modes min-w-0" data-elements-modes>
      <section className="mt-8" aria-labelledby="discover-elements-title">
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.elementsModes.elementSection')}</p>
          <h2 className="nn-type-section-title mt-2" id="discover-elements-title">
            {ui(locale, 'discover.elementsModes.elementIntro')}
          </h2>
        </div>
        <ul className="mt-6 grid min-w-0 gap-5 md:grid-cols-2" data-element-groups>
          {ELEMENT_ORDER.map((element) => {
            const content = getZodiacElementContent(element, locale);
            const elementName = content.label;
            return (
              <li key={element} className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-6">
                <h3 className="nn-type-card-title">
                  {formatUiMessage(locale, 'discover.elementsModes.familyTitle', { family: elementName })}
                </h3>
                <p className="nn-type-body-small mt-3">{content.description}</p>
                <p className="nn-type-metadata mt-5">{ui(locale, 'discover.elementsModes.memberSigns')}</p>
                <ul className="mt-3 flex min-w-0 flex-wrap gap-2" aria-label={elementName}>
                  {ZODIAC_ELEMENT_MEMBERS[element].map((signId) => (
                    <li key={signId} className="min-w-0 flex-1 basis-32">
                      <SignLink locale={locale} signId={signId} compact />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="discover-modalities-title">
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.elementsModes.modalitySection')}</p>
          <h2 className="nn-type-section-title mt-2" id="discover-modalities-title">
            {ui(locale, 'discover.elementsModes.modalityIntro')}
          </h2>
        </div>
        <ul className="mt-6 grid min-w-0 gap-5 md:grid-cols-3" data-modality-groups>
          {MODALITY_ORDER.map((modality) => {
            const content = getZodiacModalityContent(modality, locale);
            const modalityName = content.label;
            return (
              <li key={modality} className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-6">
                <h3 className="nn-type-card-title">
                  {formatUiMessage(locale, 'discover.elementsModes.familyTitle', { family: modalityName })}
                </h3>
                <p className="nn-type-body-small mt-3">{content.description}</p>
                <p className="nn-type-metadata mt-5">{ui(locale, 'discover.elementsModes.memberSigns')}</p>
                <ul className="mt-3 flex min-w-0 flex-wrap gap-2" aria-label={modalityName}>
                  {ZODIAC_MODALITY_MEMBERS[modality].map((signId) => (
                    <li key={signId} className="min-w-0 flex-1 basis-32">
                      <SignLink locale={locale} signId={signId} compact />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="discover-matrix-title" data-cross-classification>
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.elementsModes.matrixTitle')}</p>
          <h2 className="nn-type-section-title mt-2" id="discover-matrix-title">
            {ui(locale, 'discover.elementsModes.matrixCaption')}
          </h2>
        </div>

        <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[42rem] table-fixed border-collapse text-left">
            <caption className="sr-only">{ui(locale, 'discover.elementsModes.matrixCaption')}</caption>
            <thead>
              <tr className="border-b border-nn-border-default">
                <th className="w-1/4 px-3 py-3 text-sm font-semibold text-nn-text-primary" scope="col">
                  {ui(locale, 'discover.elementsModes.matrixElementHeader')}
                </th>
                {MODALITY_ORDER.map((modality) => (
                  <th key={modality} className="px-3 py-3 text-sm font-semibold text-nn-text-primary" scope="col">
                    {getZodiacModalityContent(modality, locale).label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ELEMENT_ORDER.map((element) => (
                <tr key={element} className="border-b border-nn-border-subtle last:border-b-0">
                  <th className="px-3 py-4 align-top text-sm font-semibold text-nn-text-primary" scope="row">
                    {getZodiacElementContent(element, locale).label}
                  </th>
                  {MODALITY_ORDER.map((modality) => {
                    const cell = getCrossClassificationCell(element, modality);
                    return (
                      <td key={modality} className="px-3 py-4 align-top">
                        <SignLink locale={locale} signId={cell.signId} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid min-w-0 gap-3 md:hidden" aria-label={ui(locale, 'discover.elementsModes.matrixCaption')}>
          {ELEMENT_ORDER.map((element) => (
            <section key={element} className="nn-surface min-w-0 p-4">
              <h3 className="nn-type-card-title">{getZodiacElementContent(element, locale).label}</h3>
              <dl className="mt-4 grid min-w-0 gap-3">
                {MODALITY_ORDER.map((modality) => {
                  const cell = getCrossClassificationCell(element, modality);
                  return (
                    <div key={modality} className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-3 border-t border-nn-border-subtle pt-3 first:border-t-0 first:pt-0">
                      <dt className="nn-type-metadata break-words">
                        {getZodiacModalityContent(modality, locale).label}
                      </dt>
                      <dd className="min-w-0">
                        <SignLink locale={locale} signId={cell.signId} compact />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      </section>

      <p className="nn-notice nn-notice--trust mt-6" role="note">
        {ui(locale, 'discover.elementsModes.disclosure')}
      </p>

      <nav className="mt-6 flex min-w-0 flex-wrap gap-3" aria-label={ui(locale, 'discover.elementsModes.nextSteps')}>
        <a className="nn-button nn-button--primary" href={learnHref}>
          {ui(locale, 'discover.zodiac.learnCta')}
        </a>
        <a className="nn-button nn-button--secondary" href={calculateHref}>
          {ui(locale, 'discover.zodiac.calculateCta')}
        </a>
        <a className="nn-button nn-button--quiet" href={zodiacHref}>
          {ui(locale, 'discover.elementsModes.zodiacCta')}
        </a>
        <a className="nn-button nn-button--quiet" href={matchHref}>
          {ui(locale, 'discover.elementsModes.matchCta')}
        </a>
      </nav>
    </div>
  );
}
