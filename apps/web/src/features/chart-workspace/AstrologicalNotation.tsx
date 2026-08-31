import { useId, useState } from 'react';
import type { AngleFact, AspectFact, BodyFact, ChartResult } from '@natalnode/contracts';
import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '../chart-experience/chart-ui.js';
import type { ChartPresentationPolicy } from './chart-presentation-policy';

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇'
};

const ZODIAC_GLYPHS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓'
};

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '✶'
};

const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'Conjunction',
  opposition: 'Opposition',
  square: 'Square',
  trine: 'Trine',
  sextile: 'Sextile'
};

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

function Glyph({ value }: { value: string | undefined }) {
  return value ? <span aria-hidden="true">{value}</span> : null;
}

function BodyOrientation({ body }: { body: BodyFact }) {
  return (
    <div className="min-w-0 border-l border-natal-border/50 pl-3">
      <dt className="nn-type-label break-words">
        <Glyph value={PLANET_GLYPHS[body.bodyId]} />{' '}
        {body.bodyId}
        {body.retrograde === true ? ' (retrograde)' : null}
      </dt>
      <dd className="nn-type-body-small mt-1 break-words">
        <Glyph value={ZODIAC_GLYPHS[body.sign]} />{' '}
        {body.sign} · {formatLongitude(body.longitude)}
      </dd>
    </div>
  );
}

function AngleOrientation({ angle }: { angle: AngleFact }) {
  return (
    <div className="min-w-0 border-l border-natal-border/50 pl-3">
      <dt className="nn-type-label break-words">{angle.angleId}</dt>
      <dd className="nn-type-body-small mt-1 break-words">
        <Glyph value={ZODIAC_GLYPHS[angle.sign]} />{' '}
        {angle.sign} · {formatLongitude(angle.longitude)}
      </dd>
    </div>
  );
}

function BodyNotation({ body, showHouses }: { body: BodyFact; showHouses: boolean }) {
  const house = body.house;
  const houseNotation = showHouses && typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? `House ${formatHouse(house)}`
    : null;

  return (
    <div className="grid gap-1 border-b border-natal-border/40 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,1fr)_minmax(0,2fr)] sm:items-baseline sm:gap-4">
      <dt className="break-words font-medium text-nn-text-primary">
        <Glyph value={PLANET_GLYPHS[body.bodyId]} />{' '}
        {body.bodyId}
        {body.retrograde === true ? ' (retrograde)' : null}
      </dt>
      <dd className="break-words text-sm text-nn-text-secondary">
        <Glyph value={ZODIAC_GLYPHS[body.sign]} />{' '}
        {body.sign} · {formatLongitude(body.longitude)}
        {houseNotation ? ` · ${houseNotation}` : null}
      </dd>
    </div>
  );
}

function AspectNotation({ aspect }: { aspect: AspectFact }) {
  return (
    <li className="break-words border-b border-natal-border/40 py-3 last:border-b-0">
      <span className="font-medium text-nn-text-primary">
        <Glyph value={PLANET_GLYPHS[aspect.firstBodyId]} />{' '}
        {aspect.firstBodyId} {''}
        <Glyph value={ASPECT_GLYPHS[aspect.type]} />{' '}
        {ASPECT_LABELS[aspect.type] ?? aspect.type} {''}
        <Glyph value={PLANET_GLYPHS[aspect.secondBodyId]} />{' '}
        {aspect.secondBodyId}
      </span>
      <span className="ml-2 text-sm text-nn-text-secondary">
        orb {formatNumericValue(aspect.orb)}°
        {aspect.phaseState ? ` · ${aspect.phaseState}` : null}
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
            <BodyOrientation body={body} key={body.bodyId} />
          ))}
          {ascendant ? <AngleOrientation angle={ascendant} /> : null}
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
