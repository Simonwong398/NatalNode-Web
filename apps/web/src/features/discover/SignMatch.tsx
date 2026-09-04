import { useEffect, useState } from 'react';
import { getAstrologyGlyph } from '@/core/astrology-taxonomy/AstrologyGlyph';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/core/astrology-taxonomy/astrology-glossary';
import {
  SIGN_CLASSIFICATIONS,
} from '@/core/astrology-taxonomy/chart-taxonomy';
import {
  getElementPairContent,
  getModalityPairContent
} from '@/content/discover/sign-match';
import {
  getZodiacElementContent,
  getZodiacModalityContent
} from '@/content/discover/zodiac';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { getShareMatchPath } from '@/lib/share-links';
import { formatUiMessage, getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';
import {
  getSignMatchPath,
  parseSignId,
  parseSignMatchSearch,
  type SignMatchPair
} from './sign-match';

type Props = {
  locale: SupportedLocale;
  initialPair: SignMatchPair;
  learnHref: string;
  calculateHref: string;
  zodiacHref: string;
  elementsModesHref: string;
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

export default function SignMatch({
  locale,
  initialPair,
  learnHref,
  calculateHref,
  zodiacHref,
  elementsModesHref
}: Props) {
  const [pair, setPair] = useState<SignMatchPair>(initialPair);
  const signA = SIGN_CLASSIFICATIONS.find((sign) => sign.id === pair.signA) ?? SIGN_CLASSIFICATIONS[0];
  const signB = SIGN_CLASSIFICATIONS.find((sign) => sign.id === pair.signB) ?? SIGN_CLASSIFICATIONS[1];
  const signAName = localizedTerm('sign', signA.label, locale);
  const signBName = localizedTerm('sign', signB.label, locale);
  const elementAName = getZodiacElementContent(signA.element, locale).label;
  const elementBName = getZodiacElementContent(signB.element, locale).label;
  const modalityAName = getZodiacModalityContent(signA.modality, locale).label;
  const modalityBName = getZodiacModalityContent(signB.modality, locale).label;
  const sameSign = signA.id === signB.id;
  const shareHref = getShareMatchPath(locale, { signA: signA.id, signB: signB.id });

  useEffect(() => {
    const handlePopState = () => {
      setPair(parseSignMatchSearch(window.location.search));
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function updatePair(next: SignMatchPair) {
    setPair(next);
    window.history.pushState(
      { signMatch: next },
      '',
      getSignMatchPath(window.location.pathname, next)
    );
  }

  function updateSign(which: 'signA' | 'signB', value: string) {
    const signId = parseSignId(value);
    if (signId === null) {
      return;
    }

    updatePair({
      signA: which === 'signA' ? signId : pair.signA,
      signB: which === 'signB' ? signId : pair.signB
    });
  }

  const signOptions = SIGN_CLASSIFICATIONS.map((sign) => ({
    id: sign.id,
    name: localizedTerm('sign', sign.label, locale)
  }));

  return (
    <div
      className="nn-discover-match min-w-0"
      data-sign-match
      data-sign-match-pair={`${signA.id}|${signB.id}`}
    >
      <section
        className="mt-8 nn-surface nn-surface--elevated p-4 sm:p-6"
        aria-labelledby="sign-match-selector-title"
      >
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.match.eyebrow')}</p>
          <h2 className="nn-type-section-title" id="sign-match-selector-title">
            {ui(locale, 'discover.match.selectorTitle')}
          </h2>
        </div>

        <div className="mt-6 grid min-w-0 items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <label className="min-w-0" htmlFor="sign-match-a">
            <span className="nn-type-label">{ui(locale, 'discover.match.signA')}</span>
            <select
              className="nn-field mt-2"
              id="sign-match-a"
              value={signA.id}
              aria-label={ui(locale, 'discover.match.selectSignA')}
              onChange={(event) => updateSign('signA', event.currentTarget.value)}
              data-sign-match-select="a"
            >
              {signOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatUiMessage(locale, 'discover.match.signOption', { sign: option.name })}
                </option>
              ))}
            </select>
          </label>

          <button
            className="nn-button nn-button--secondary w-full md:w-auto"
            type="button"
            aria-label={ui(locale, 'discover.match.swapLabel')}
            onClick={() => updatePair({ signA: pair.signB, signB: pair.signA })}
            data-sign-match-swap
          >
            × <span className="sr-only">{ui(locale, 'discover.match.swap')}</span>
          </button>

          <label className="min-w-0" htmlFor="sign-match-b">
            <span className="nn-type-label">{ui(locale, 'discover.match.signB')}</span>
            <select
              className="nn-field mt-2"
              id="sign-match-b"
              value={signB.id}
              aria-label={ui(locale, 'discover.match.selectSignB')}
              onChange={(event) => updateSign('signB', event.currentTarget.value)}
              data-sign-match-select="b"
            >
              {signOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatUiMessage(locale, 'discover.match.signOption', { sign: option.name })}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="sign-match-relationship-title" aria-live="polite">
        <div className="nn-section-header max-w-3xl">
          <p className="nn-eyebrow">{ui(locale, 'discover.match.relationshipTitle')}</p>
          <h2 className="nn-type-section-title mt-2" id="sign-match-relationship-title">
            {signAName} × {signBName}
          </h2>
        </div>

        <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
          {[signA, signB].map((sign, index) => {
            const name = index === 0 ? signAName : signBName;
            const elementName = index === 0 ? elementAName : elementBName;
            const modalityName = index === 0 ? modalityAName : modalityBName;
            return (
              <article key={`${sign.id}-${index}`} className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-6">
                <p className="nn-type-metadata">
                  {index === 0 ? ui(locale, 'discover.match.signA') : ui(locale, 'discover.match.signB')}
                </p>
                <div className="mt-3 flex min-w-0 items-center gap-4">
                  <span className="shrink-0 text-5xl leading-none text-nn-accent-supporting" aria-hidden="true">
                    {getAstrologyGlyph('sign', sign.label)}
                  </span>
                  <h3 className="nn-type-card-title min-w-0 break-words">{name}</h3>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-nn-border-subtle pt-4">
                  <div className="min-w-0">
                    <dt className="nn-type-metadata">{ui(locale, 'discover.zodiac.elementLabel')}</dt>
                    <dd className="mt-1 break-words font-semibold text-nn-text-primary">{elementName}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="nn-type-metadata">{ui(locale, 'discover.zodiac.modalityLabel')}</dt>
                    <dd className="mt-1 break-words font-semibold text-nn-text-primary">{modalityName}</dd>
                  </div>
                </dl>
                <a
                  className="nn-button nn-button--quiet -ml-3 mt-5"
                  href={getLocalizedPath(locale, `/discover/zodiac/${sign.id}/`)}
                >
                  {formatUiMessage(locale, 'discover.match.profileCta', { sign: name })}
                </a>
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
          <article className="nn-surface min-w-0 p-5 sm:p-6">
            <h3 className="nn-type-card-title">{ui(locale, 'discover.match.elementRelationship')}</h3>
            <p className="nn-type-body-small mt-3">
              {getElementPairContent(signA.element, signB.element, locale)}
            </p>
          </article>
          <article className="nn-surface min-w-0 p-5 sm:p-6">
            <h3 className="nn-type-card-title">{ui(locale, 'discover.match.modalityRelationship')}</h3>
            <p className="nn-type-body-small mt-3">
              {getModalityPairContent(signA.modality, signB.modality, locale)}
            </p>
          </article>
        </div>

        <section className="mt-6 nn-surface nn-surface--elevated min-w-0 p-5 sm:p-6" aria-labelledby="sign-match-synthesis-title">
          <p className="nn-eyebrow">{ui(locale, 'discover.match.synthesisTitle')}</p>
          <p className="nn-type-body mt-3" id="sign-match-synthesis-title">
            {formatUiMessage(locale, 'discover.match.synthesis', {
              signA: signAName,
              signB: signBName,
              elementA: elementAName,
              elementB: elementBName,
              modalityA: modalityAName,
              modalityB: modalityBName
            })}
          </p>
          {sameSign ? (
            <p className="nn-type-body-small mt-4 border-t border-nn-border-subtle pt-4">
              {ui(locale, 'discover.match.sameSignNote')}
            </p>
          ) : null}
        </section>
      </section>

      <p className="nn-notice nn-notice--trust mt-6" role="note">
        {ui(locale, 'discover.match.disclosure')}
      </p>
      <p className="nn-type-body-small mt-4 max-w-3xl">{ui(locale, 'discover.match.fullChartBoundary')}</p>

      <nav className="mt-6 flex min-w-0 flex-wrap gap-3" aria-label={ui(locale, 'discover.match.nextSteps')}>
        <a className="nn-button nn-button--primary" href={learnHref}>
          {ui(locale, 'discover.zodiac.learnCta')}
        </a>
        <a className="nn-button nn-button--secondary" href={calculateHref}>
          {ui(locale, 'discover.zodiac.calculateCta')}
        </a>
        <a className="nn-button nn-button--quiet" href={zodiacHref}>
          {ui(locale, 'discover.match.zodiacCta')}
        </a>
        <a className="nn-button nn-button--quiet" href={elementsModesHref}>
          {ui(locale, 'discover.match.elementsModesCta')}
        </a>
        <a className="nn-button nn-button--quiet" href={shareHref}>
          {ui(locale, 'share.match.shareAction')}
        </a>
      </nav>
    </div>
  );
}
