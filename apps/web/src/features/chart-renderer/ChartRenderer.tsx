import { useId } from 'react';
import type { AspectFact, BodyFact, ChartResult, HouseCusp } from '@natalnode/contracts';
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
  annularSectorPath,
  longitudeToPoint,
  radialLine
} from './geometry';
import type { ChartPresentationPolicy } from '@/features/chart-workspace/chart-presentation-policy';

export type ChartRendererProps = {
  chart: ChartResult;
  presentationPolicy: ChartPresentationPolicy;
};

type AspectStyle = {
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

const BODY_ABBREVIATIONS: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mercury: 'Me',
  Venus: 'Ve',
  Mars: 'Ma',
  Jupiter: 'Ju',
  Saturn: 'Sa',
  Uranus: 'Ur',
  Neptune: 'Ne',
  Pluto: 'Pl'
};

const ASPECT_STYLES: Record<string, AspectStyle> = {
  conjunction: {
    stroke: 'var(--nn-chart-aspect-neutral)',
    opacity: 0.58,
    strokeWidth: 1.4
  },
  opposition: {
    stroke: 'var(--nn-chart-aspect-dynamic)',
    strokeDasharray: '8 4',
    opacity: 0.68,
    strokeWidth: 1.3
  },
  trine: {
    stroke: 'var(--nn-chart-aspect-harmonious)',
    opacity: 0.62,
    strokeWidth: 1.25
  },
  square: {
    stroke: 'var(--nn-chart-aspect-dynamic)',
    strokeDasharray: '6 3 1 3',
    opacity: 0.62,
    strokeWidth: 1.25
  },
  sextile: {
    stroke: 'var(--nn-chart-aspect-harmonious)',
    strokeDasharray: '2 4',
    opacity: 0.56,
    strokeWidth: 1.1
  }
};

const SVG_TEXT = 'ui-sans-serif, system-ui, sans-serif';
const PRECISION_TICK_COUNT = 36;
const SECTOR_OPACITIES = [0.08, 0.14] as const;

function formatNumericValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function formatLongitude(longitude: number): string {
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  return `${formatNumericValue(normalizedLongitude)}°`;
}

function describeAspect(aspect: AspectFact): string {
  const phaseState = aspect.phaseState === null ? '' : `, ${aspect.phaseState}`;
  return `${aspect.firstBodyId} ${aspect.type} ${aspect.secondBodyId}, orb ${formatNumericValue(aspect.orb)}°${phaseState}`;
}

function resolveUniqueBody(bodyId: string, bodies: BodyFact[]): BodyFact | null {
  const matches = bodies.filter((body) => body.bodyId === bodyId);
  return matches.length === 1 ? matches[0] : null;
}

function getRenderableAspects(chart: ChartResult): ResolvedAspect[] {
  const renderableAspects: ResolvedAspect[] = [];

  for (const aspect of chart.aspects) {
    const style = ASPECT_STYLES[aspect.type];
    const firstBody = resolveUniqueBody(aspect.firstBodyId, chart.bodies);
    const secondBody = resolveUniqueBody(aspect.secondBodyId, chart.bodies);

    if (!style || !firstBody || !secondBody) {
      continue;
    }

    renderableAspects.push({ aspect, firstBody, secondBody, style });
  }

  return renderableAspects;
}

function getBodyLabel(bodyId: string): string {
  return BODY_ABBREVIATIONS[bodyId] ?? bodyId.slice(0, 3);
}

function renderPrecisionTicks() {
  return (
    <g aria-hidden="true">
      {Array.from({ length: PRECISION_TICK_COUNT }, (_, index) => {
        const longitude = (index * 360) / PRECISION_TICK_COUNT;
        const isMajor = index % 3 === 0;
        const tick = radialLine(
          longitude,
          ZODIAC_OUTER_RADIUS + 7,
          ZODIAC_OUTER_RADIUS + (isMajor ? 16 : 12)
        );

        return (
          <line
            key={`precision-tick-${index}`}
            opacity={isMajor ? 0.5 : 0.24}
            stroke={CHART_COLORS.border}
            strokeLinecap="round"
            strokeWidth={isMajor ? 1.2 : 0.8}
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

function renderHouseCusp(cusp: HouseCusp) {
  const line = radialLine(cusp.longitude, HOUSE_INNER_RADIUS, ZODIAC_INNER_RADIUS);
  const label = longitudeToPoint(cusp.longitude, HOUSE_LABEL_RADIUS);

  return (
    <g
      aria-label={`House ${cusp.house} cusp at ${formatLongitude(cusp.longitude)}`}
      key={`house-${cusp.house}`}
      role="group"
    >
      <line
        opacity={cusp.house === 1 ? 0.82 : 0.58}
        stroke={CHART_COLORS.house}
        strokeDasharray={cusp.house === 1 ? undefined : '3 4'}
        strokeWidth={cusp.house === 1 ? 1.8 : 1}
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
        {cusp.house}
      </text>
    </g>
  );
}

function renderBody(body: BodyFact, index: number) {
  const markerRadius = BODY_MARKER_RADIUS + (index % 2) * 8;
  const labelRadius = BODY_LABEL_RADIUS + (index % 3) * 14;
  const marker = longitudeToPoint(body.longitude, markerRadius);
  const label = longitudeToPoint(body.longitude, labelRadius);
  const bodyLabel = getBodyLabel(body.bodyId);
  const degreeLabel = formatLongitude(body.longitude);
  const bodyDescription = `${body.bodyId} at ${degreeLabel}${body.retrograde === true ? ', retrograde' : ''}`;

  return (
    <g
      aria-label={bodyDescription}
      key={`${body.bodyId}-${index}`}
      role="group"
    >
      <line
        opacity={0.48}
        stroke={CHART_COLORS.bodySecondary}
        strokeDasharray="2 3"
        strokeWidth="0.8"
        x1={marker.x}
        x2={label.x}
        y1={marker.y}
        y2={label.y}
      />
      <circle
        aria-hidden="true"
        cx={marker.x}
        cy={marker.y}
        fill={CHART_COLORS.bodySecondary}
        fillOpacity="0.16"
        r="7"
      />
      <circle
        cx={marker.x}
        cy={marker.y}
        fill={CHART_COLORS.bodyPrimary}
        r="4"
        stroke={CHART_COLORS.surface}
        strokeWidth="1.5"
      />
      <text
        dominantBaseline="middle"
        fill={CHART_COLORS.bodyPrimary}
        fontFamily={SVG_TEXT}
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        x={label.x}
        y={label.y - 6}
      >
        {bodyLabel}
      </text>
      {body.retrograde === true ? (
        <text
          dominantBaseline="middle"
          fill={CHART_COLORS.bodyPrimary}
          fontFamily={SVG_TEXT}
          fontSize="9"
          fontWeight="700"
          textAnchor="middle"
          x={label.x}
          y={label.y - 18}
        >
          R
        </text>
      ) : null}
      <text
        dominantBaseline="middle"
        fill={CHART_COLORS.bodySecondary}
        fontFamily={SVG_TEXT}
        fontSize="9"
        textAnchor="middle"
        x={label.x}
        y={label.y + 8}
      >
        {degreeLabel}
      </text>
    </g>
  );
}

function renderAspect(resolvedAspect: ResolvedAspect, index: number) {
  const firstPoint = longitudeToPoint(resolvedAspect.firstBody.longitude, ASPECT_ENDPOINT_RADIUS);
  const secondPoint = longitudeToPoint(resolvedAspect.secondBody.longitude, ASPECT_ENDPOINT_RADIUS);
  const description = describeAspect(resolvedAspect.aspect);

  return (
    <g aria-label={description} key={`${resolvedAspect.aspect.type}-${index}`} role="group">
      <title>{description}</title>
      <line
        fill="none"
        opacity={resolvedAspect.style.opacity}
        stroke={resolvedAspect.style.stroke}
        strokeDasharray={resolvedAspect.style.strokeDasharray}
        strokeLinecap="round"
        strokeWidth={resolvedAspect.style.strokeWidth}
        vectorEffect="non-scaling-stroke"
        x1={firstPoint.x}
        x2={secondPoint.x}
        y1={firstPoint.y}
        y2={secondPoint.y}
      />
    </g>
  );
}

function renderAngle(angle: { angleId: string; longitude: number }) {
  const line = radialLine(angle.longitude, HOUSE_INNER_RADIUS, ANGLE_OUTER_RADIUS);
  const label = longitudeToPoint(angle.longitude, ANGLE_OUTER_RADIUS);
  const angleLabel = angle.angleId.toUpperCase();

  return (
    <g aria-label={`${angleLabel} at ${formatLongitude(angle.longitude)}`} key={angle.angleId} role="group">
      <line
        opacity="0.9"
        stroke={CHART_COLORS.angle}
        strokeDasharray={angleLabel === 'ASC' ? undefined : '8 4'}
        strokeWidth="2.2"
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

export default function ChartRenderer({ chart, presentationPolicy }: ChartRendererProps) {
  const rendererId = useId();
  const titleId = `${rendererId}-title`;
  const descriptionId = `${rendererId}-description`;
  const houseCusps = presentationPolicy.showHouses
    ? [...(chart.houses?.cusps ?? [])].sort((first, second) => first.house - second.house)
    : [];
  const ascendant = presentationPolicy.showAngles
    ? chart.angles.find((angle) => angle.angleId === 'ASC')
    : undefined;
  const midheaven = presentationPolicy.showAngles
    ? chart.angles.find((angle) => angle.angleId === 'MC')
    : undefined;
  const renderableAspects = getRenderableAspects(chart);
  const atmosphereId = `${rendererId.replace(/:/g, '')}-atmosphere`;
  const description =
    presentationPolicy.showHouses && presentationPolicy.showAngles
      ? 'SVG chart wheel showing twelve zodiac sectors, provided house cusps, chart bodies, and ASC and MC angles.'
      : 'SVG chart wheel showing twelve zodiac sectors, chart bodies, and major aspects. Exact-time-dependent angle and house geometry is not shown.';

  return (
    <svg
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${CHART_VIEWBOX_SIZE} ${CHART_VIEWBOX_SIZE}`}
    >
      <title id={titleId}>Natal chart wheel</title>
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

      {/* Atmosphere: static depth remains behind every scientific layer. */}
      <g aria-hidden="true">
        <circle
          cx={CHART_CENTER}
          cy={CHART_CENTER}
          fill={`url(#${atmosphereId})`}
          r={ZODIAC_OUTER_RADIUS}
        />
      </g>

      {/* Instrument frame: rings and calibration marks are orientation aids only. */}
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
      </g>

      {/* Zodiac: the canonical twelve sectors remain the primary structural ring. */}
      <g aria-label="Zodiac sectors" role="group">
        {ZODIAC_SIGNS.map((sign, index) => {
          const startLongitude = index * 30;
          const label = longitudeToPoint(startLongitude + 15, (ZODIAC_OUTER_RADIUS + ZODIAC_INNER_RADIUS) / 2);

          return (
            <g aria-label={`${sign} sector`} key={sign} role="group">
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
              <text
                dominantBaseline="middle"
                fill={CHART_COLORS.textSecondary}
                fontFamily={SVG_TEXT}
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                x={label.x}
                y={label.y}
              >
                {sign}
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
      {/* Houses: distinct structural geometry is rendered only when policy permits it. */}
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

          <g aria-label="House cusps" role="group">
            {houseCusps.map(renderHouseCusp)}
          </g>
        </>
      ) : null}

      {/* Aspects: valid Engine facts remain complete but subordinate to bodies. */}
      <g aria-label="Major aspects" role="group">
        {renderableAspects.map(renderAspect)}
      </g>

      {/* Bodies: the existing canonical marker and label positions are unchanged. */}
      <g aria-label="Chart bodies" role="group">
        {chart.bodies.map(renderBody)}
      </g>

      {/* Angles: ASC and MC remain policy-gated and distinct from ordinary bodies. */}
      {presentationPolicy.showAngles ? (
        <g aria-label="Chart angles" role="group">
          {ascendant ? renderAngle(ascendant) : null}
          {midheaven ? renderAngle(midheaven) : null}
        </g>
      ) : null}

      {/* Center reference: quiet, static, and excluded from scientific narration. */}
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
  );
}
