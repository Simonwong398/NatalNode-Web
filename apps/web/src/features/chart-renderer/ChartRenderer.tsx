import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent
} from 'react';
import type {
  AngleFact,
  AspectFact,
  BodyFact,
  ChartResult,
  HouseCusp
} from '@natalnode/contracts';
import {
  getAstrologyGlyph,
  getAstrologyNotation
} from '@/components/astrology/AstrologyGlyph';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '@/lib/localization.js';
import {
  getAstrologyGlossaryNotation,
  resolveAstrologyDomainTerm
} from '@/lib/astrology-glossary.js';
import {
  ANGLE_OUTER_RADIUS,
  ASPECT_ENDPOINT_RADIUS,
  BODY_LABEL_RADIUS,
  BODY_MARKER_RADIUS,
  CHART_CENTER,
  CHART_VIEWBOX_SIZE,
  HOUSE_INNER_RADIUS,
  HOUSE_LABEL_RADIUS,
  ZODIAC_INNER_RADIUS,
  ZODIAC_OUTER_RADIUS,
  angularDistance,
  annularSectorPath,
  longitudeToPoint,
  radialLine
} from './geometry';
import type { ChartPresentationPolicy } from '@/features/chart-workspace/chart-presentation-policy';
import { chartUi, chartUiFormat } from '../chart-experience/chart-ui.js';

export type ChartRendererProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
};

type AspectCategory = 'tension' | 'harmony' | 'neutral';

type AspectStyle = {
  category: AspectCategory;
  stroke: string;
  strokeDasharray?: string;
  opacity: number;
  strokeWidth: number;
};

type ResolvedAspect = {
  aspect: AspectFact;
  firstBody: BodyFact;
  secondBody: BodyFact;
  style: AspectStyle;
};

type BodyDisplay = {
  body: BodyFact;
  index: number;
  marker: { x: number; y: number };
  label: { x: number; y: number };
};

const CHART_COLORS = {
  atmosphere: 'var(--nn-bg-observatory)',
  angle: 'var(--nn-chart-angle)',
  bodyPrimary: 'var(--nn-chart-body-primary)',
  bodySecondary: 'var(--nn-chart-body-secondary)',
  border: 'var(--nn-border-default)',
  borderStrong: 'var(--nn-border-strong)',
  focus: 'var(--nn-chart-focus)',
  house: 'var(--nn-chart-house)',
  surface: 'var(--nn-surface-base)',
  textSecondary: 'var(--nn-text-secondary)',
  zodiac: 'var(--nn-chart-zodiac)'
} as const;

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
] as const;

const ASPECT_STYLES: Record<string, AspectStyle> = {
  conjunction: {
    category: 'neutral',
    stroke: 'var(--nn-chart-aspect-neutral)',
    strokeDasharray: '2 4',
    opacity: 0.58,
    strokeWidth: 1.4
  },
  opposition: {
    category: 'tension',
    stroke: 'var(--nn-chart-aspect-dynamic)',
    strokeDasharray: '8 4',
    opacity: 0.68,
    strokeWidth: 1.3
  },
  trine: {
    category: 'harmony',
    stroke: 'var(--nn-chart-aspect-harmonious)',
    opacity: 0.62,
    strokeWidth: 1.25
  },
  square: {
    category: 'tension',
    stroke: 'var(--nn-chart-aspect-dynamic)',
    strokeDasharray: '6 3 1 3',
    opacity: 0.62,
    strokeWidth: 1.25
  },
  sextile: {
    category: 'harmony',
    stroke: 'var(--nn-chart-aspect-harmonious)',
    strokeDasharray: '2 4',
    opacity: 0.56,
    strokeWidth: 1.1
  }
};

const UNKNOWN_ASPECT_STYLE: AspectStyle = {
  category: 'neutral',
  stroke: 'var(--nn-chart-aspect-neutral)',
  strokeDasharray: '1 5',
  opacity: 0.48,
  strokeWidth: 1.1
};

const SVG_TEXT = 'ui-sans-serif, system-ui, sans-serif';
const PRECISION_TICK_COUNT = 72;
const BODY_COLLISION_THRESHOLD_DEGREES = 6;
const SECTOR_OPACITIES = [0.08, 0.14] as const;

function formatNumericValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function formatLongitude(longitude: number): string {
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  return `${formatNumericValue(normalizedLongitude)}°`;
}

function formatHouse(house: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][house - 1] ?? String(house);
}

function glossaryTerm(
  kind: Parameters<typeof resolveAstrologyDomainTerm>[0],
  value: unknown,
  locale: SupportedLocale | undefined
): string {
  return resolveAstrologyDomainTerm(kind, value, locale ?? DEFAULT_LOCALE)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
}

function houseNotation(house: number): string {
  return getAstrologyNotation('house', house, 'romanNumeral') ?? formatHouse(house);
}

function describeAspect(aspect: AspectFact, locale: SupportedLocale | undefined): string {
  const phaseState = aspect.phaseState === null
    ? ''
    : `, ${glossaryTerm('aspect_phase', aspect.phaseState, locale)}`;
  return `${glossaryTerm('body', aspect.firstBodyId, locale)} ${glossaryTerm('aspect', aspect.type, locale)} ${glossaryTerm('body', aspect.secondBodyId, locale)}, ${glossaryTerm('aspect', 'orb', locale).toLowerCase()} ${formatNumericValue(aspect.orb)}°${phaseState}`;
}

function resolveUniqueBody(bodyId: string, bodies: readonly BodyFact[]): BodyFact | null {
  const matches = bodies.filter((body) => body.bodyId === bodyId);
  return matches.length === 1 ? matches[0] : null;
}

function getAspectStyle(type: string): AspectStyle {
  return ASPECT_STYLES[type] ?? UNKNOWN_ASPECT_STYLE;
}

function getRenderableAspects(chart: ChartResult): ResolvedAspect[] {
  const renderableAspects: ResolvedAspect[] = [];

  for (const aspect of chart.aspects) {
    const firstBody = resolveUniqueBody(aspect.firstBodyId, chart.bodies);
    const secondBody = resolveUniqueBody(aspect.secondBodyId, chart.bodies);

    // An unknown aspect type remains a supplied neutral fact. A relation with
    // an ambiguous body identity cannot be placed safely, so it is omitted.
    if (!firstBody || !secondBody) continue;

    renderableAspects.push({
      aspect,
      firstBody,
      secondBody,
      style: getAspectStyle(aspect.type)
    });
  }

  return renderableAspects;
}

/**
 * Keep every marker at its supplied longitude. Only the leader endpoint and
 * label radius move when nearby labels would collide; this is presentation
 * geometry, never a replacement for a source fact.
 */
function resolveBodyDisplayPositions(bodies: readonly BodyFact[]): BodyDisplay[] {
  const sortedBodies = bodies
    .map((body, index) => ({ body, index }))
    .sort((first, second) => {
      const longitudeDifference = first.body.longitude - second.body.longitude;
      if (longitudeDifference !== 0) return longitudeDifference;
      return first.body.bodyId.localeCompare(second.body.bodyId) || first.index - second.index;
    });
  const displays = new Map<number, BodyDisplay>();
  let previousLongitude: number | null = null;
  let collisionLane = 0;

  for (const { body, index } of sortedBodies) {
    if (previousLongitude === null || angularDistance(body.longitude, previousLongitude) > BODY_COLLISION_THRESHOLD_DEGREES) {
      collisionLane = 0;
    } else {
      collisionLane += 1;
    }

    const lane = collisionLane % 3;
    const labelLongitude = body.longitude + (lane === 1 ? 2.8 : lane === 2 ? -2.8 : 0);
    const labelRadius = BODY_LABEL_RADIUS + lane * 18;
    displays.set(index, {
      body,
      index,
      marker: longitudeToPoint(body.longitude, BODY_MARKER_RADIUS),
      label: longitudeToPoint(labelLongitude, labelRadius)
    });
    previousLongitude = body.longitude;
  }

  return bodies.map((_, index) => displays.get(index) as BodyDisplay);
}

function renderPrecisionTicks() {
  return (
    <g aria-hidden="true">
      {Array.from({ length: PRECISION_TICK_COUNT }, (_, index) => {
        const longitude = (index * 360) / PRECISION_TICK_COUNT;
        const isMajor = index % 6 === 0;
        const isMedium = index % 2 === 0;
        const tick = radialLine(
          longitude,
          ZODIAC_OUTER_RADIUS + 7,
          ZODIAC_OUTER_RADIUS + (isMajor ? 17 : isMedium ? 14 : 11)
        );

        return (
          <line
            key={`precision-tick-${index}`}
            opacity={isMajor ? 0.58 : isMedium ? 0.34 : 0.22}
            stroke={CHART_COLORS.border}
            strokeLinecap="round"
            strokeWidth={isMajor ? 1.35 : isMedium ? 1 : 0.75}
            vectorEffect="non-scaling-stroke"
            x1={tick.start.x}
            x2={tick.end.x}
            y1={tick.start.y}
            y2={tick.end.y}
          />
        );
      })}
    </g>
  );
}

function renderDegreeLabels() {
  return (
    <g aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => {
        const longitude = index * 30;
        const label = longitudeToPoint(longitude, ZODIAC_OUTER_RADIUS + 27);
        return (
          <text
            key={`degree-label-${longitude}`}
            dominantBaseline="middle"
            fill={CHART_COLORS.textSecondary}
            fontFamily={SVG_TEXT}
            fontSize="8"
            letterSpacing="0.04em"
            opacity="0.74"
            textAnchor="middle"
            x={label.x}
            y={label.y}
          >
            {formatLongitude(longitude)}
          </text>
        );
      })}
    </g>
  );
}

function renderHouseCusp(cusp: HouseCusp, locale: SupportedLocale | undefined) {
  const line = radialLine(cusp.longitude, HOUSE_INNER_RADIUS, ZODIAC_INNER_RADIUS);
  const label = longitudeToPoint(cusp.longitude, HOUSE_LABEL_RADIUS);
  const houseTerm = glossaryTerm('house', cusp.house, locale);
  const houseLabel = houseNotation(cusp.house);

  return (
    <g
      aria-label={chartUiFormat(locale, 'chart.houseCusp', {
        house: houseTerm,
        degree: formatLongitude(cusp.longitude)
      })}
      key={`house-${cusp.house}`}
      role="group"
    >
      <line
        opacity={cusp.house === 1 ? 0.84 : 0.58}
        stroke={CHART_COLORS.house}
        strokeDasharray={cusp.house === 1 ? undefined : '3 4'}
        strokeWidth={cusp.house === 1 ? 1.8 : 1}
        vectorEffect="non-scaling-stroke"
        x1={line.start.x}
        x2={line.end.x}
        y1={line.start.y}
        y2={line.end.y}
      />
      <text
        dominantBaseline="middle"
        fill={CHART_COLORS.house}
        fontFamily={SVG_TEXT}
        fontSize="12"
        fontWeight="600"
        textAnchor="middle"
        x={label.x}
        y={label.y}
      >
        {houseLabel}
      </text>
    </g>
  );
}

type BodyRenderProps = {
  display: BodyDisplay;
  locale: SupportedLocale | undefined;
  showHouses: boolean;
  activePlanetId: string | null;
  selectedPlanetId: string | null;
  connectedBodyIds: ReadonlySet<string>;
  focusCardId: string;
  onHover: (bodyId: string) => void;
  onLeave: (bodyId: string) => void;
  onSelect: (bodyId: string) => void;
};

function describeBody(
  body: BodyFact,
  locale: SupportedLocale | undefined,
  showHouses: boolean
): string {
  const motion = body.retrograde === true
    ? `, ${glossaryTerm('motion', 'RETROGRADE', locale).toLowerCase()}`
    : '';
  const house = showHouses && typeof body.house === 'number' && Number.isInteger(body.house) && body.house >= 1 && body.house <= 12
    ? `, ${glossaryTerm('house', body.house, locale)}`
    : '';
  return `${chartUiFormat(locale, 'chart.bodyAt', {
    body: glossaryTerm('body', body.bodyId, locale),
    degree: formatLongitude(body.longitude),
    motion
  })}; ${glossaryTerm('sign', body.sign, locale)}${house}`;
}

function renderBody({
  display,
  locale,
  showHouses,
  activePlanetId,
  selectedPlanetId,
  connectedBodyIds,
  focusCardId,
  onHover,
  onLeave,
  onSelect
}: BodyRenderProps) {
  const { body, index, marker, label } = display;
  const bodyGlyph = getAstrologyGlyph('body', body.bodyId);
  const bodyLabel = getAstrologyGlossaryNotation('body', body.bodyId, 'rendererAbbreviation') ?? body.bodyId.slice(0, 3);
  const signGlyph = getAstrologyGlyph('sign', body.sign);
  const degreeLabel = formatLongitude(body.longitude);
  const retrogradeGlyph = body.retrograde === true
    ? getAstrologyGlyph('motion', 'RETROGRADE')
    : undefined;
  const bodyDescription = describeBody(body, locale, showHouses);
  const isActive = activePlanetId === body.bodyId;
  const isSelected = selectedPlanetId === body.bodyId;
  const isRelated = activePlanetId !== null && connectedBodyIds.has(body.bodyId) && !isActive;
  const opacity = activePlanetId === null ? 1 : isActive ? 1 : isRelated ? 0.92 : 0.3;

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(body.bodyId);
  };
  const handleClick = (event: MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    onSelect(body.bodyId);
  };

  return (
    <g
      aria-describedby={isActive ? focusCardId : undefined}
      aria-label={bodyDescription}
      aria-pressed={isSelected}
      className={`nn-chart-planet${isActive ? ' nn-chart-planet--active' : ''}${isSelected ? ' nn-chart-planet--selected' : ''}${isRelated ? ' nn-chart-planet--related' : ''}`}
      data-planet-id={body.bodyId}
      key={`${body.bodyId}-${index}`}
      onBlur={() => onLeave(body.bodyId)}
      onClick={handleClick}
      onFocus={() => onHover(body.bodyId)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover(body.bodyId)}
      onMouseLeave={() => onLeave(body.bodyId)}
      onTouchStart={() => onHover(body.bodyId)}
      onTouchEnd={() => onSelect(body.bodyId)}
      opacity={opacity}
      role="button"
      tabIndex={0}
    >
      <title>{bodyDescription}</title>
      <rect
        aria-hidden="true"
        fill="transparent"
        pointerEvents="all"
        height={Math.abs(marker.y - label.y) + 28}
        rx="12"
        width={Math.abs(marker.x - label.x) + 28}
        x={Math.min(marker.x, label.x) - 14}
        y={Math.min(marker.y, label.y) - 14}
      />
      {isActive ? (
        <circle
          aria-hidden="true"
          className="nn-chart-focus-ring"
          cx={marker.x}
          cy={marker.y}
          r="15"
        />
      ) : null}
      {isRelated ? (
        <circle
          aria-hidden="true"
          className="nn-chart-target-ring"
          cx={marker.x}
          cy={marker.y}
          r="12"
        />
      ) : null}
      <line
        aria-hidden="true"
        className="nn-chart-planet__leader"
        opacity={isActive || isRelated ? 0.72 : 0.42}
        stroke={CHART_COLORS.bodySecondary}
        strokeDasharray="2 3"
        strokeWidth="0.8"
        vectorEffect="non-scaling-stroke"
        x1={marker.x}
        x2={label.x}
        y1={marker.y}
        y2={label.y}
      />
      <circle
        aria-hidden="true"
        className="nn-chart-planet__halo"
        cx={marker.x}
        cy={marker.y}
        fill={CHART_COLORS.bodySecondary}
        fillOpacity="0.16"
        r="8"
      />
      <circle
        aria-hidden="true"
        className="nn-chart-planet__marker"
        cx={marker.x}
        cy={marker.y}
        fill={CHART_COLORS.bodyPrimary}
        r="4.5"
        stroke={CHART_COLORS.surface}
        strokeWidth="1.5"
      />
      <text
        aria-hidden="true"
        className="nn-chart-planet__glyph"
        dominantBaseline="middle"
        fill={CHART_COLORS.bodyPrimary}
        fontFamily={SVG_TEXT}
        fontSize="17"
        fontWeight="700"
        textAnchor="middle"
        x={label.x}
        y={label.y - 9}
      >
        {bodyGlyph ?? bodyLabel}
      </text>
      <text
        aria-hidden="true"
        dominantBaseline="middle"
        fill={CHART_COLORS.bodyPrimary}
        fontFamily={SVG_TEXT}
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.08em"
        textAnchor="middle"
        x={label.x}
        y={label.y + 3}
      >
        {bodyLabel}
      </text>
      <text
        aria-hidden="true"
        dominantBaseline="middle"
        fill={CHART_COLORS.bodySecondary}
        fontFamily={SVG_TEXT}
        fontSize="8"
        textAnchor="middle"
        x={label.x}
        y={label.y + 15}
      >
        {signGlyph ? `${signGlyph} ` : ''}{degreeLabel}{retrogradeGlyph ? ` ${retrogradeGlyph}` : ''}
      </text>
    </g>
  );
}

function renderAspect(
  resolvedAspect: ResolvedAspect,
  index: number,
  locale: SupportedLocale | undefined,
  activePlanetId: string | null
) {
  const firstPoint = longitudeToPoint(resolvedAspect.firstBody.longitude, ASPECT_ENDPOINT_RADIUS);
  const secondPoint = longitudeToPoint(resolvedAspect.secondBody.longitude, ASPECT_ENDPOINT_RADIUS);
  const description = describeAspect(resolvedAspect.aspect, locale);
  const isFocused = activePlanetId !== null && (
    resolvedAspect.aspect.firstBodyId === activePlanetId ||
    resolvedAspect.aspect.secondBodyId === activePlanetId
  );
  const hasFocus = activePlanetId !== null;

  return (
    <g
      aria-label={description}
      className={`nn-chart-aspect nn-chart-aspect--${resolvedAspect.style.category}${isFocused ? ' nn-chart-aspect--active' : ''}`}
      key={`${resolvedAspect.aspect.firstBodyId}-${resolvedAspect.aspect.type}-${resolvedAspect.aspect.secondBodyId}-${index}`}
      role="group"
    >
      <title>{description}</title>
      <line
        fill="none"
        opacity={hasFocus ? (isFocused ? 0.98 : 0.08) : resolvedAspect.style.opacity}
        stroke={resolvedAspect.style.stroke}
        strokeDasharray={resolvedAspect.style.strokeDasharray}
        strokeLinecap="round"
        strokeWidth={isFocused ? resolvedAspect.style.strokeWidth + 0.55 : resolvedAspect.style.strokeWidth}
        vectorEffect="non-scaling-stroke"
        x1={firstPoint.x}
        x2={secondPoint.x}
        y1={firstPoint.y}
        y2={secondPoint.y}
      />
    </g>
  );
}

function renderAngle(angle: AngleFact, locale: SupportedLocale | undefined) {
  const line = radialLine(angle.longitude, HOUSE_INNER_RADIUS, ANGLE_OUTER_RADIUS);
  const label = longitudeToPoint(angle.longitude, ANGLE_OUTER_RADIUS);
  const angleResolution = resolveAstrologyDomainTerm(
    'angle',
    angle.angleId,
    locale ?? DEFAULT_LOCALE
  );
  const angleLabel = angleResolution?.shortForm ?? angle.angleId.toUpperCase();
  const angleDescription = chartUiFormat(locale, 'chart.angleAt', {
    angle: angleResolution?.displayTerm ?? angle.angleId,
    degree: formatLongitude(angle.longitude)
  });

  return (
    <g aria-label={angleDescription} key={angle.angleId} role="group">
      <line
        opacity="0.9"
        stroke={CHART_COLORS.angle}
        strokeDasharray={angleLabel === 'ASC' ? undefined : '8 4'}
        strokeWidth="2.2"
        vectorEffect="non-scaling-stroke"
        x1={line.start.x}
        x2={line.end.x}
        y1={line.start.y}
        y2={line.end.y}
      />
      <text
        dominantBaseline="middle"
        fill={CHART_COLORS.angle}
        fontFamily={SVG_TEXT}
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        x={label.x}
        y={label.y - 7}
      >
        {angleLabel}
      </text>
      <text
        dominantBaseline="middle"
        fill={CHART_COLORS.textSecondary}
        fontFamily={SVG_TEXT}
        fontSize="9"
        textAnchor="middle"
        x={label.x}
        y={label.y + 7}
      >
        {formatLongitude(angle.longitude)}
      </text>
    </g>
  );
}

function AspectLegend({
  entries,
  locale
}: {
  entries: readonly ResolvedAspect[];
  locale: SupportedLocale | undefined;
}) {
  const uniqueEntries = Array.from(
    new Map(entries.map((entry) => [entry.aspect.type, entry])).values()
  );
  if (uniqueEntries.length === 0) return null;

  return (
    <div aria-label={chartUi(locale, 'chart.majorAspects')} className="nn-chart-legend">
      {uniqueEntries.map(({ aspect, style }) => (
        <span className="nn-chart-legend__item" key={aspect.type}>
          <span
            aria-hidden="true"
            className={`nn-chart-legend__sample nn-chart-legend__sample--${style.category}`}
          />
          <span aria-hidden="true" className="nn-astrology-glyph">
            {getAstrologyGlyph('aspect', aspect.type) ?? '·'}
          </span>
          <span>{glossaryTerm('aspect', aspect.type, locale)}</span>
        </span>
      ))}
    </div>
  );
}

function FocusedBodyCard({
  body,
  aspects,
  locale,
  showHouses,
  selected,
  focusCardId
}: {
  body: BodyFact;
  aspects: readonly ResolvedAspect[];
  locale: SupportedLocale | undefined;
  showHouses: boolean;
  selected: boolean;
  focusCardId: string;
}) {
  const titleId = `chart-focus-${body.bodyId.toLowerCase()}-title`;
  const bodyGlyph = getAstrologyGlyph('body', body.bodyId);
  const signGlyph = getAstrologyGlyph('sign', body.sign);
  const retrogradeGlyph = body.retrograde === true
    ? getAstrologyGlyph('motion', 'RETROGRADE')
    : undefined;
  const house = showHouses && typeof body.house === 'number' && Number.isInteger(body.house) && body.house >= 1 && body.house <= 12
    ? chartUiFormat(locale, 'chart.houseLabel', { house: houseNotation(body.house) })
    : null;

  return (
    <section
      aria-label={glossaryTerm('body', body.bodyId, locale)}
      aria-live={selected ? 'polite' : undefined}
      className="nn-chart-focus-card"
      id={focusCardId}
    >
      <p className="nn-eyebrow">{chartUi(locale, 'chart.focusedPlacement')}</p>
      <h4 className="nn-type-card-title" id={titleId}>
        {bodyGlyph ? <span aria-hidden="true" className="nn-astrology-glyph mr-2">{bodyGlyph}</span> : null}
        {glossaryTerm('body', body.bodyId, locale)}
      </h4>
      <p className="nn-type-body-small mt-2">
        {signGlyph ? <span aria-hidden="true" className="nn-astrology-glyph mr-1">{signGlyph}</span> : null}
        {glossaryTerm('sign', body.sign, locale)} · {formatLongitude(body.longitude)}
        {retrogradeGlyph ? <span aria-hidden="true" className="nn-astrology-glyph ml-1">{retrogradeGlyph}</span> : null}
        {house ? ` · ${house}` : null}
      </p>
      {aspects.length > 0 ? (
        <div className="mt-4">
          <h5 className="nn-type-label">{chartUi(locale, 'chart.connectedAspects')}</h5>
          <ul className="mt-2 space-y-2 nn-type-body-small">
            {aspects.map(({ aspect }) => (
              <li className="flex items-start gap-2" key={`${aspect.firstBodyId}-${aspect.type}-${aspect.secondBodyId}`}>
                <span aria-hidden="true" className="nn-astrology-glyph shrink-0">
                  {getAstrologyGlyph('aspect', aspect.type) ?? '·'}
                </span>
                <span>{describeAspect(aspect, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="nn-type-body-small mt-4">{chartUi(locale, 'chart.noConnectedAspects')}</p>
      )}
    </section>
  );
}

export default function ChartRenderer({ chart, locale, presentationPolicy }: ChartRendererProps) {
  const rendererId = useId().replace(/:/g, '');
  const titleId = `${rendererId}-title`;
  const descriptionId = `${rendererId}-description`;
  const focusCardId = `${rendererId}-focus-card`;
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const activePlanetId = selectedPlanetId ?? hoveredPlanetId;
  const bodyDisplays = useMemo(() => resolveBodyDisplayPositions(chart.bodies), [chart.bodies]);
  const renderableAspects = useMemo(() => getRenderableAspects(chart), [chart]);
  const houseCusps = presentationPolicy.showHouses
    ? [...(chart.houses?.cusps ?? [])].sort((first, second) => first.house - second.house)
    : [];
  const angles = presentationPolicy.showAngles ? chart.angles : [];
  const activeBody = activePlanetId === null
    ? undefined
    : chart.bodies.find((body) => body.bodyId === activePlanetId);
  const connectedAspects = activePlanetId === null
    ? []
    : renderableAspects.filter(({ aspect }) => (
        aspect.firstBodyId === activePlanetId || aspect.secondBodyId === activePlanetId
      ));
  const connectedBodyIds = useMemo(() => {
    const ids = new Set<string>();
    if (activePlanetId === null) return ids;
    ids.add(activePlanetId);
    for (const { aspect } of connectedAspects) {
      ids.add(aspect.firstBodyId);
      ids.add(aspect.secondBodyId);
    }
    return ids;
  }, [activePlanetId, connectedAspects]);
  const atmosphereId = `${rendererId}-atmosphere`;
  const natalChartLabel = glossaryTerm('chart_type', 'natal', locale);
  const description = presentationPolicy.showHouses && presentationPolicy.showAngles
    ? chartUiFormat(locale, 'chart.wheelDescriptionWithHouses', {
        chart: natalChartLabel.toLowerCase()
      })
    : chartUiFormat(locale, 'chart.wheelDescriptionWithoutHouses', {
        chart: natalChartLabel.toLowerCase()
      });

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedPlanetId(null);
      setHoveredPlanetId(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (selectedPlanetId && !chart.bodies.some((body) => body.bodyId === selectedPlanetId)) {
      setSelectedPlanetId(null);
    }
    if (hoveredPlanetId && !chart.bodies.some((body) => body.bodyId === hoveredPlanetId)) {
      setHoveredPlanetId(null);
    }
  }, [chart.bodies, hoveredPlanetId, selectedPlanetId]);

  const clearFocus = () => {
    setSelectedPlanetId(null);
    setHoveredPlanetId(null);
  };
  const clearHover = (bodyId: string) => {
    setHoveredPlanetId((current) => current === bodyId ? null : current);
  };

  return (
    <div className="nn-chart-renderer" data-chart-instrument="true">
      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="nn-chart-renderer__svg h-auto w-full"
        onClick={clearFocus}
        role="img"
        viewBox={`0 0 ${CHART_VIEWBOX_SIZE} ${CHART_VIEWBOX_SIZE}`}
      >
        <title id={titleId}>
          {chartUiFormat(locale, 'chart.wheelTitle', { chart: natalChartLabel })}
        </title>
        <desc id={descriptionId}>{description}</desc>

        <defs aria-hidden="true">
          <radialGradient
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            id={atmosphereId}
            r={ZODIAC_OUTER_RADIUS}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={CHART_COLORS.focus} stopOpacity="0.11" />
            <stop offset="66%" stopColor={CHART_COLORS.atmosphere} stopOpacity="0.08" />
            <stop offset="100%" stopColor={CHART_COLORS.atmosphere} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Atmosphere: static depth remains behind every supplied fact layer. */}
        <g aria-hidden="true">
          <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            fill={`url(#${atmosphereId})`}
            r={ZODIAC_OUTER_RADIUS}
          />
        </g>

        {/* Instrument frame: calibration marks are orientation aids only. */}
        <g aria-hidden="true">
          <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            fill={CHART_COLORS.surface}
            fillOpacity="0.68"
            r={ZODIAC_OUTER_RADIUS}
            stroke={CHART_COLORS.borderStrong}
            strokeOpacity="0.88"
            strokeWidth="2"
          />
          <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            fill="none"
            r={ZODIAC_OUTER_RADIUS + 7}
            stroke={CHART_COLORS.border}
            strokeOpacity="0.62"
            strokeWidth="1"
          />
          {renderPrecisionTicks()}
          {renderDegreeLabels()}
        </g>

        {/* Zodiac: the canonical twelve sectors remain the primary ring. */}
        <g aria-label={chartUi(locale, 'chart.zodiacSectors')} role="group">
          {ZODIAC_SIGNS.map((sign, index) => {
            const startLongitude = index * 30;
            const label = longitudeToPoint(startLongitude + 15, (ZODIAC_OUTER_RADIUS + ZODIAC_INNER_RADIUS) / 2);
            const glyph = getAstrologyGlyph('sign', sign);

            return (
              <g aria-label={`${glossaryTerm('sign', sign, locale)} sector`} key={sign} role="group">
                <path
                  d={annularSectorPath(
                    startLongitude,
                    startLongitude + 30,
                    ZODIAC_OUTER_RADIUS,
                    ZODIAC_INNER_RADIUS
                  )}
                  fill={CHART_COLORS.zodiac}
                  fillOpacity={SECTOR_OPACITIES[index % SECTOR_OPACITIES.length]}
                  stroke={CHART_COLORS.zodiac}
                  strokeOpacity="0.58"
                  strokeWidth="0.9"
                />
                {glyph ? (
                  <text
                    aria-hidden="true"
                    dominantBaseline="middle"
                    fill={CHART_COLORS.textSecondary}
                    fontFamily={SVG_TEXT}
                    fontSize="18"
                    fontWeight="600"
                    textAnchor="middle"
                    x={label.x}
                    y={label.y - 7}
                  >
                    {glyph}
                  </text>
                ) : null}
                <text
                  aria-hidden="true"
                  dominantBaseline="middle"
                  fill={CHART_COLORS.textSecondary}
                  fontFamily={SVG_TEXT}
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                  x={label.x}
                  y={label.y + 11}
                >
                  {glossaryTerm('sign', sign, locale)}
                </text>
              </g>
            );
          })}
        </g>

        <circle
          cx={CHART_CENTER}
          cy={CHART_CENTER}
          fill={CHART_COLORS.surface}
          fillOpacity="0.86"
          r={ZODIAC_INNER_RADIUS}
          stroke={CHART_COLORS.borderStrong}
          strokeOpacity="0.72"
          strokeWidth="1.5"
        />

        {/* Houses and angles are rendered only from supplied facts and policy. */}
        {presentationPolicy.showHouses ? (
          <>
            <circle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              fill="none"
              r={HOUSE_INNER_RADIUS}
              stroke={CHART_COLORS.house}
              strokeOpacity="0.42"
              strokeWidth="1.1"
            />
            <g aria-label={chartUi(locale, 'chart.houseCusps')} role="group">
              {houseCusps.map((cusp) => renderHouseCusp(cusp, locale))}
            </g>
          </>
        ) : null}

        {angles.length > 0 ? (
          <g aria-label={chartUi(locale, 'chart.chartAngles')} role="group">
            {angles.map((angle) => renderAngle(angle, locale))}
          </g>
        ) : null}

        {/* Aspects are subordinate, and focus state is presentation-only. */}
        <g aria-label={chartUi(locale, 'chart.majorAspects')} role="group">
          {renderableAspects.map((aspect, index) => renderAspect(aspect, index, locale, activePlanetId))}
        </g>

        {/* Bodies stay at their supplied longitudes; only labels are separated. */}
        <g aria-label={chartUi(locale, 'chart.chartBodies')} role="group">
          {bodyDisplays.map((display) => renderBody({
            connectedBodyIds,
            display,
            focusCardId,
            locale,
            onHover: setHoveredPlanetId,
            onLeave: clearHover,
            onSelect: setSelectedPlanetId,
            selectedPlanetId,
            showHouses: presentationPolicy.showHouses,
            activePlanetId
          }))}
        </g>

        {/* Center reference is static and excluded from scientific narration. */}
        <g aria-hidden="true">
          <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            fill="none"
            r="18"
            stroke={CHART_COLORS.focus}
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            fill={CHART_COLORS.focus}
            fillOpacity="0.72"
            r="3"
          />
        </g>
      </svg>

      <p className="nn-chart-focus-hint">{chartUi(locale, 'chart.focusHint')}</p>
      {activeBody ? (
        <FocusedBodyCard
          aspects={connectedAspects}
          body={activeBody}
          locale={locale}
          selected={selectedPlanetId !== null}
          focusCardId={focusCardId}
          showHouses={presentationPolicy.showHouses}
        />
      ) : null}
      <AspectLegend entries={renderableAspects} locale={locale} />
    </div>
  );
}
