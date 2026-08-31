import { useId, useState } from 'react';
import type { AngleFact, AspectFact, BodyFact, ChartResult } from '@natalnode/contracts';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '../../lib/localization.js';
import {
  getAstrologyGlossaryNotation,
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '../../lib/astrology-glossary.js';
import { chartUi } from '../chart-experience/chart-ui.js';
import type { ChartPresentationPolicy } from './chart-presentation-policy';

function formatNumericValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function formatLongitude(longitude: number): string {
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  return `${formatNumericValue(normalizedLongitude)}°`;
}

function formatHouse(house: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][house - 1];
}

function glossaryTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale | undefined
): string {
  return resolveAstrologyDomainTerm(kind, value, locale ?? DEFAULT_LOCALE)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
}

function glossaryNotation(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  notation: 'glyph' | 'rendererAbbreviation' | 'romanNumeral'
): string | undefined {
  return getAstrologyGlossaryNotation(kind, value, notation);
}

function glossaryPhaseTerm(
  phaseState: string,
  locale: SupportedLocale | undefined
): string {
  return glossaryTerm('aspect_phase', phaseState, locale).toUpperCase();
}

function Glyph({ value }: { value: string | undefined }) {
  return value ? <span aria-hidden="true">{value}</span> : null;
}

function BodyOrientation({ body, locale }: { body: BodyFact; locale?: SupportedLocale }) {
  const bodyTerm = glossaryTerm('body', body.bodyId, locale);
  const signTerm = glossaryTerm('sign', body.sign, locale);
  const retrogradeTerm = glossaryTerm('motion', 'RETROGRADE', locale);

  return (
    <div className="min-w-0 border-l border-natal-border/50 pl-3">
      <dt className="nn-type-label break-words">
        <Glyph value={glossaryNotation('body', body.bodyId, 'glyph')} />{' '}
        {bodyTerm}
        {body.retrograde === true ? ` (${retrogradeTerm.toLowerCase()})` : null}
      </dt>
      <dd className="nn-type-body-small mt-1 break-words">
        <Glyph value={glossaryNotation('sign', body.sign, 'glyph')} />{' '}
        {signTerm} · {formatLongitude(body.longitude)}
      </dd>
    </div>
  );
}

function AngleOrientation({ angle, locale }: { angle: AngleFact; locale?: SupportedLocale }) {
  const angleResolution = resolveAstrologyDomainTerm('angle', angle.angleId, locale ?? DEFAULT_LOCALE);
  const angleShortForm = angleResolution?.shortForm ?? angle.angleId;

  return (
    <div className="min-w-0 border-l border-natal-border/50 pl-3">
      <dt
        aria-label={angleResolution?.displayTerm}
        className="nn-type-label break-words"
      >
        {angleShortForm}
      </dt>
      <dd className="nn-type-body-small mt-1 break-words">
        <Glyph value={glossaryNotation('sign', angle.sign, 'glyph')} />{' '}
        {glossaryTerm('sign', angle.sign, locale)} · {formatLongitude(angle.longitude)}
      </dd>
    </div>
  );
}

function BodyNotation({
  body,
  locale,
  showHouses
}: {
  body: BodyFact;
  locale?: SupportedLocale;
  showHouses: boolean;
}) {
  const house = body.house;
  const bodyTerm = glossaryTerm('body', body.bodyId, locale);
  const signTerm = glossaryTerm('sign', body.sign, locale);
  const retrogradeTerm = glossaryTerm('motion', 'RETROGRADE', locale);
  const houseNotation = showHouses && typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? `House ${glossaryNotation('house', house, 'romanNumeral') ?? formatHouse(house)}`
    : null;

  return (
    <div className="grid gap-1 border-b border-natal-border/40 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,1fr)_minmax(0,2fr)] sm:items-baseline sm:gap-4">
      <dt className="break-words font-medium text-nn-text-primary">
        <Glyph value={glossaryNotation('body', body.bodyId, 'glyph')} />{' '}
        {bodyTerm}
        {body.retrograde === true ? ` (${retrogradeTerm.toLowerCase()})` : null}
      </dt>
      <dd className="break-words text-sm text-nn-text-secondary">
        <Glyph value={glossaryNotation('sign', body.sign, 'glyph')} />{' '}
        {signTerm} · {formatLongitude(body.longitude)}
        {houseNotation ? ` · ${houseNotation}` : null}
      </dd>
    </div>
  );
}

function AspectNotation({ aspect, locale }: { aspect: AspectFact; locale?: SupportedLocale }) {
  const firstBodyTerm = glossaryTerm('body', aspect.firstBodyId, locale);
  const secondBodyTerm = glossaryTerm('body', aspect.secondBodyId, locale);
  const aspectTerm = glossaryTerm('aspect', aspect.type, locale);
  const orbTerm = glossaryTerm('aspect', 'orb', locale).toLowerCase();
  const phaseTerm = aspect.phaseState === null
    ? null
    : glossaryPhaseTerm(aspect.phaseState, locale);

  return (
    <li className="break-words border-b border-natal-border/40 py-3 last:border-b-0">
      <span className="font-medium text-nn-text-primary">
        <Glyph value={glossaryNotation('body', aspect.firstBodyId, 'glyph')} />{' '}
        {firstBodyTerm} {''}
        <Glyph value={glossaryNotation('aspect', aspect.type, 'glyph')} />{' '}
        {aspectTerm} {''}
        <Glyph value={glossaryNotation('body', aspect.secondBodyId, 'glyph')} />{' '}
        {secondBodyTerm}
      </span>
      <span className="ml-2 text-sm text-nn-text-secondary">
        {orbTerm} {formatNumericValue(aspect.orb)}°
        {phaseTerm ? ` · ${phaseTerm}` : null}
      </span>
    </li>
  );
}

export type AstrologicalNotationProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
};

function bodyCount(count: number) {
  return `${count} ${count === 1 ? 'body placement' : 'body placements'}`;
}

function aspectCount(count: number) {
  return `${count} ${count === 1 ? 'major aspect' : 'major aspects'}`;
}

export default function AstrologicalNotation({ chart, locale, presentationPolicy }: AstrologicalNotationProps) {
  const notationId = useId();
  const titleId = `${notationId}-astrological-notation-title`;
  const disclosureTitleId = `${notationId}-complete-chart-facts-title`;
  const disclosureControlId = `${notationId}-complete-chart-facts-control`;
  const disclosureContentId = `${notationId}-complete-chart-facts-content`;
  const [isCompleteFactsOpen, setIsCompleteFactsOpen] = useState(false);
  const orientationBodies = ['Sun', 'Moon'].flatMap((bodyId) => {
    const body = chart.bodies.find((candidate) => candidate.bodyId === bodyId);
    return body ? [body] : [];
  });
  const ascendant = presentationPolicy.showAngles
    ? chart.angles.find((angle) => angle.angleId === 'ASC')
    : undefined;
  const hasCompleteFacts = chart.bodies.length > 0 || chart.aspects.length > 0;
  const countSummary = `${bodyCount(chart.bodies.length)} · ${aspectCount(chart.aspects.length)}`;

  if (orientationBodies.length === 0 && !ascendant && !hasCompleteFacts) {
    return null;
  }

  return (
    <section aria-labelledby={titleId} className="mt-6 border-t border-natal-border/70 pt-5">
      <div className="nn-section-header">
        <p className="nn-eyebrow">Chart orientation</p>
        <h4 className="nn-type-section-title" id={titleId}>
          Chart facts at a glance
        </h4>
      </div>

      {orientationBodies.length > 0 || ascendant ? (
        <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
          {orientationBodies.map((body) => (
            <BodyOrientation body={body} key={body.bodyId} locale={locale} />
          ))}
          {ascendant ? <AngleOrientation angle={ascendant} locale={locale} /> : null}
        </dl>
      ) : null}

      <p className="nn-type-metadata mt-4">{countSummary}</p>

      {!presentationPolicy.showAngles || !presentationPolicy.showHouses ? (
        <p className="nn-type-body-small mt-3">
          Time-dependent angles and houses unavailable.
        </p>
      ) : null}

      {hasCompleteFacts ? (
        <section aria-labelledby={disclosureTitleId} className="mt-4">
          <h5>
            <button
              aria-controls={disclosureContentId}
              aria-expanded={isCompleteFactsOpen}
              className="nn-button nn-button--quiet w-full justify-between px-4 text-left"
              id={disclosureControlId}
              onClick={() => setIsCompleteFactsOpen((current) => !current)}
              type="button"
            >
              <span>
                <span className="nn-type-label block" id={disclosureTitleId}>
                  {chartUi(locale, 'workspace.completeFacts')}
                </span>
                <span className="nn-type-metadata mt-1 block font-normal">
                  {countSummary}
                </span>
              </span>
              <span aria-hidden="true" className="text-lg">
                {isCompleteFactsOpen ? '−' : '+'}
              </span>
            </button>
          </h5>

          <div
            aria-labelledby={disclosureControlId}
            hidden={!isCompleteFactsOpen}
            id={disclosureContentId}
          >
            {chart.bodies.length > 0 ? (
              <dl className="mt-3">
                {chart.bodies.map((body, index) => (
                  <BodyNotation
                    body={body}
                    key={`${body.bodyId}-${index}`}
                    locale={locale}
                    showHouses={presentationPolicy.showHouses}
                  />
                ))}
              </dl>
            ) : null}

            {chart.aspects.length > 0 ? (
              <div className={chart.bodies.length > 0 ? 'mt-5' : 'mt-3'}>
                <h6 className="text-sm font-semibold text-nn-text-primary">Major aspects</h6>
                <ul className="mt-1">
                  {chart.aspects.map((aspect, index) => (
                    <AspectNotation
                      aspect={aspect}
                      key={`${aspect.firstBodyId}-${aspect.type}-${aspect.secondBodyId}-${index}`}
                      locale={locale}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </section>
  );
}
