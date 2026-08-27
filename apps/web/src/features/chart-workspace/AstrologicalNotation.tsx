import { useId } from 'react';
import type { AspectFact, BodyFact, ChartResult } from '@natalnode/contracts';
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
  presentationPolicy: ChartPresentationPolicy;
};

export default function AstrologicalNotation({ chart, presentationPolicy }: AstrologicalNotationProps) {
  const titleId = `${useId()}-astrological-notation-title`;

  if (chart.bodies.length === 0 && chart.aspects.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={titleId} className="mt-6 border-t border-natal-border/70 pt-5">
      <div className="nn-section-header">
        <p className="nn-eyebrow">Astrological notation</p>
        <h4 className="nn-type-section-title" id={titleId}>
          Chart facts at a glance
        </h4>
      </div>

      {chart.bodies.length > 0 ? (
        <dl className="mt-3">
          {chart.bodies.map((body, index) => (
            <BodyNotation body={body} key={`${body.bodyId}-${index}`} showHouses={presentationPolicy.showHouses} />
          ))}
        </dl>
      ) : null}

      {chart.aspects.length > 0 ? (
        <div className={chart.bodies.length > 0 ? 'mt-5' : 'mt-3'}>
          <h5 className="text-sm font-semibold text-nn-text-primary">Major aspects</h5>
          <ul className="mt-1">
            {chart.aspects.map((aspect, index) => (
              <AspectNotation aspect={aspect} key={`${aspect.firstBodyId}-${aspect.type}-${aspect.secondBodyId}-${index}`} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
