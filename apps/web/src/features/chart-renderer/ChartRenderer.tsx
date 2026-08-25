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

export type ChartRendererProps = {
  chart: ChartResult;
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
    stroke: '#f8fafc',
    opacity: 0.58,
    strokeWidth: 1.5
  },
  opposition: {
    stroke: '#fda4af',
    strokeDasharray: '8 4',
    opacity: 0.72,
    strokeWidth: 1.25
  },
  trine: {
    stroke: '#93c5fd',
    strokeDasharray: '2 4',
    opacity: 0.72,
    strokeWidth: 1.25
  },
  square: {
    stroke: '#fbbf24',
    strokeDasharray: '6 3 1 3',
    opacity: 0.72,
    strokeWidth: 1.25
  },
  sextile: {
    stroke: '#86efac',
    strokeDasharray: '1 5',
    opacity: 0.78,
    strokeWidth: 1.25
  }
};

const SECTOR_FILLS = ['#1b2438', '#202b45'];
const SVG_TEXT = 'ui-sans-serif, system-ui, sans-serif';

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
        stroke="#64748b"
        strokeDasharray={cusp.house === 1 ? undefined : '3 4'}
        strokeWidth={cusp.house === 1 ? 1.8 : 1}
        x1={line.start.x}
        x2={line.end.x}
        y1={line.start.y}
        y2={line.end.y}
      />
      <text
        dominantBaseline="middle"
        fill="#cbd5e1"
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
        stroke="#64748b"
        strokeDasharray="2 3"
        strokeWidth="0.8"
        x1={marker.x}
        x2={label.x}
        y1={marker.y}
        y2={label.y}
      />
      <circle cx={marker.x} cy={marker.y} fill="#a7b6e8" r="4" stroke="#10131a" strokeWidth="1.5" />
      <text
        dominantBaseline="middle"
        fill="#f8fafc"
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
          fill="#f8fafc"
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
        fill="#94a3b8"
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
        stroke={angleLabel === 'ASC' ? '#f8fafc' : '#a7b6e8'}
        strokeDasharray="8 4"
        strokeWidth="2"
        x1={line.start.x}
        x2={line.end.x}
        y1={line.start.y}
        y2={line.end.y}
      />
      <text
        dominantBaseline="middle"
        fill="#f8fafc"
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
        fill="#cbd5e1"
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

export default function ChartRenderer({ chart }: ChartRendererProps) {
  const rendererId = useId();
  const titleId = `${rendererId}-title`;
  const descriptionId = `${rendererId}-description`;
  const houseCusps = [...(chart.houses?.cusps ?? [])].sort((first, second) => first.house - second.house);
  const ascendant = chart.angles.find((angle) => angle.angleId === 'ASC');
  const midheaven = chart.angles.find((angle) => angle.angleId === 'MC');
  const renderableAspects = getRenderableAspects(chart);

  return (
    <svg
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${CHART_VIEWBOX_SIZE} ${CHART_VIEWBOX_SIZE}`}
    >
      <title id={titleId}>Natal chart wheel</title>
      <desc id={descriptionId}>
        SVG chart wheel showing twelve zodiac sectors, provided house cusps, chart bodies, and ASC and MC angles.
      </desc>

      <rect
        fill="#10131a"
        height={CHART_VIEWBOX_SIZE}
        rx="24"
        width={CHART_VIEWBOX_SIZE}
        x="0"
        y="0"
      />
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        fill="#141925"
        r={ZODIAC_OUTER_RADIUS}
        stroke="#35405c"
        strokeWidth="2"
      />

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
                fill={SECTOR_FILLS[index % SECTOR_FILLS.length]}
                stroke="#35405c"
                strokeWidth="1"
              />
              <text
                dominantBaseline="middle"
                fill="#e2e8f0"
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
        fill="#141925"
        r={ZODIAC_INNER_RADIUS}
        stroke="#35405c"
        strokeWidth="1.5"
      />
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        fill="none"
        r={HOUSE_INNER_RADIUS}
        stroke="#35405c"
        strokeWidth="1"
      />

      <g aria-label="House cusps" role="group">
        {houseCusps.map(renderHouseCusp)}
      </g>

      <g aria-label="Major aspects" role="group">
        {renderableAspects.map(renderAspect)}
      </g>

      <g aria-label="Chart bodies" role="group">
        {chart.bodies.map(renderBody)}
      </g>

      <g aria-label="Chart angles" role="group">
        {ascendant ? renderAngle(ascendant) : null}
        {midheaven ? renderAngle(midheaven) : null}
      </g>

      <circle cx={CHART_CENTER} cy={CHART_CENTER} fill="#a7b6e8" r="3" />
    </svg>
  );
}
