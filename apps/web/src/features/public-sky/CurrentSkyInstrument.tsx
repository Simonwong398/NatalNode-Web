import { useEffect, useId, useState } from 'react';
import type { EngineClient } from '@natalnode/engine-client';
import type {
  SkyBodyPosition,
  SkyCurrentAspect,
  SkySnapshotResult
} from '@natalnode/contracts';
import { engineClient } from '@/lib/engine-client';

const ZODIAC_SIGNS = [
  ['Aries', '♈'], ['Taurus', '♉'], ['Gemini', '♊'], ['Cancer', '♋'],
  ['Leo', '♌'], ['Virgo', '♍'], ['Libra', '♎'], ['Scorpio', '♏'],
  ['Sagittarius', '♐'], ['Capricorn', '♑'], ['Aquarius', '♒'], ['Pisces', '♓']
] as const;
const BODY_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇'
};
const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '✶'
};
const ASPECT_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  conjunction: { stroke: 'var(--nn-chart-aspect-neutral)' },
  opposition: { stroke: 'var(--nn-chart-aspect-dynamic)', strokeDasharray: '8 4' },
  trine: { stroke: 'var(--nn-chart-aspect-harmonious)' },
  square: { stroke: 'var(--nn-chart-aspect-dynamic)', strokeDasharray: '6 3 1 3' },
  sextile: { stroke: 'var(--nn-chart-aspect-harmonious)', strokeDasharray: '2 4' }
};

const UNKNOWN_GLYPH = '·';

function getBodyGlyph(bodyId: string): string {
  return BODY_GLYPHS[bodyId] ?? UNKNOWN_GLYPH;
}

function getAspectGlyph(aspectType: string): string {
  return ASPECT_GLYPHS[aspectType] ?? UNKNOWN_GLYPH;
}

function point(longitude: number, radius: number) {
  const angle = (longitude * Math.PI) / 180 - Math.PI / 2;
  return { x: 320 + Math.cos(angle) * radius, y: 320 + Math.sin(angle) * radius };
}

function sectorPath(start: number, end: number, outer: number, inner: number) {
  const a = point(start, outer), b = point(end, outer), c = point(end, inner), d = point(start, inner);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
}

function formatDegrees(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}°`;
}

function formatAspect(aspect: SkyCurrentAspect) {
  const orb = aspect.orb === null ? '' : `, ${formatDegrees(aspect.orb)} orb`;
  const phase = aspect.phaseState === null ? '' : `, ${aspect.phaseState.toLowerCase()}`;
  return `${aspect.firstBodyId} ${aspect.aspectType} ${aspect.secondBodyId}${orb}${phase}`;
}

function formatSnapshotTimestamp(atUtc: string): string {
  const timestamp = new Date(atUtc).toISOString();
  return `Sky at ${timestamp.slice(0, 10)} · ${timestamp.slice(11, 16)} UTC`;
}

function SkyWheel({ snapshot }: { snapshot: SkySnapshotResult }) {
  const titleId = `${useId()}-title`;
  const descriptionId = `${useId()}-description`;
  const positions = new Map(snapshot.bodyPositions.map((body) => [body.bodyId, body]));

  return (
    <svg className="h-auto w-full" viewBox="0 0 640 640" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>Current Sky zodiac wheel</title>
      <desc id={descriptionId}>Twelve zodiac sectors with supplied body positions and supplied current aspects.</desc>
      <circle cx="320" cy="320" r="292" fill="var(--nn-surface-base)" stroke="var(--nn-border-strong)" strokeWidth="2" />
      <g aria-label="Zodiac sectors" role="group">
        {ZODIAC_SIGNS.map(([sign, glyph], index) => {
          const label = point(index * 30 + 15, 262);
          return (
            <g key={sign} aria-label={`${sign} sector`} role="group">
              <path d={sectorPath(index * 30, index * 30 + 30, 292, 232)} fill="var(--nn-chart-zodiac)" fillOpacity={index % 2 ? '0.14' : '0.08'} stroke="var(--nn-chart-zodiac)" strokeOpacity="0.55" />
              <text aria-hidden="true" x={label.x} y={label.y - 5} textAnchor="middle" fill="var(--nn-text-primary)" fontSize="22">{glyph}</text>
              <text aria-hidden="true" x={label.x} y={label.y + 15} textAnchor="middle" fill="var(--nn-text-secondary)" fontSize="10">{sign}</text>
            </g>
          );
        })}
      </g>
      <circle cx="320" cy="320" r="232" fill="var(--nn-surface-elevated)" fillOpacity="0.88" stroke="var(--nn-border-strong)" />
      <g aria-label="Supplied current aspects" role="group">
        {snapshot.currentAspects.map((aspect, index) => {
          const first = positions.get(aspect.firstBodyId), second = positions.get(aspect.secondBodyId);
          if (!first || !second) return null;
          const a = point(first.longitude, 138), b = point(second.longitude, 138);
          const style = ASPECT_STYLES[aspect.aspectType] ?? {
            stroke: 'var(--nn-chart-aspect-neutral)'
          };

          return <line key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={style.stroke} strokeOpacity="0.68" strokeWidth="1.5" strokeDasharray={style.strokeDasharray} vectorEffect="non-scaling-stroke" aria-label={formatAspect(aspect)} />;
        })}
      </g>
      <g aria-label="Supplied body positions" role="group">
        {snapshot.bodyPositions.map((body, index) => {
          const marker = point(body.longitude, 174 + (index % 2) * 13);
          const label = point(body.longitude, 204 + (index % 3) * 10);
          const motion = body.motionState === 'RETROGRADE' ? ' retrograde' : body.motionState === 'STATIONARY' ? ' stationary' : '';
          return (
            <g key={body.bodyId} role="group" aria-label={`${body.bodyId} at ${formatDegrees(body.longitude)}, ${body.sign}${motion}`}>
              <line aria-hidden="true" x1={marker.x} y1={marker.y} x2={label.x} y2={label.y} stroke="var(--nn-chart-body-secondary)" strokeOpacity="0.45" strokeDasharray="2 3" />
              <circle aria-hidden="true" cx={marker.x} cy={marker.y} r="5" fill="var(--nn-chart-body-primary)" stroke="var(--nn-surface-elevated)" strokeWidth="2" />
              <text aria-hidden="true" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="var(--nn-chart-body-primary)" fontSize="17" fontWeight="700">{getBodyGlyph(body.bodyId)}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function PositionFact({ body }: { body: SkyBodyPosition }) {
  const motion = body.motionState ? ` · ${body.motionState.toLowerCase()}` : '';
  return <li><strong><span aria-hidden="true">{getBodyGlyph(body.bodyId)}</span>{' '}{body.bodyId}</strong><span> {formatDegrees(body.longitude)} in {body.sign}{motion}</span></li>;
}

function AspectFact({ aspect }: { aspect: SkyCurrentAspect }) {
  return (
    <li>
      <span aria-hidden="true">
        {getBodyGlyph(aspect.firstBodyId)} {getAspectGlyph(aspect.aspectType)} {getBodyGlyph(aspect.secondBodyId)}{' '}
      </span>
      {formatAspect(aspect)}
    </li>
  );
}

function DevelopmentDisclosure({ snapshot }: { snapshot: SkySnapshotResult }) {
  return (
    <section aria-labelledby="current-sky-disclosure" className="nn-notice nn-notice--research flex-col">
      <div>
        <p className="nn-eyebrow nn-status--research" id="current-sky-disclosure">Development / research status</p>
        <p className="nn-type-metadata mt-2">{snapshot.calculationStatus}</p>
      </div>
      {snapshot.warnings.length > 0 ? (
        <ul className="grid gap-1 nn-type-metadata">
          {snapshot.warnings.map((warning, index) => (
            <li key={`${warning.code}-${index}`}>{warning.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export interface CurrentSkyInstrumentProps {
  atUtc: string;
  client?: EngineClient;
}

export default function CurrentSkyInstrument({ atUtc, client = engineClient }: CurrentSkyInstrumentProps) {
  const [snapshot, setSnapshot] = useState<SkySnapshotResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setSnapshot(null);
    setError(false);

    client.getSkySnapshot({ atUtc }).then((result) => {
      if (active) setSnapshot(result);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, [atUtc, client]);

  if (error) return <p className="nn-notice nn-notice--error" role="alert">The development Sky fixture is unavailable right now.</p>;
  if (!snapshot) return <p className="nn-async-state nn-async-state--loading" role="status" aria-live="polite">Loading the development Sky fixture…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div className="min-w-0 rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/30 p-3 sm:p-6"><SkyWheel snapshot={snapshot} /></div>
      <div className="space-y-6">
        <div>
          <p className="nn-eyebrow">Instrument readout</p>
          <time className="nn-type-metadata mt-2 block" dateTime={snapshot.atUtc}>{formatSnapshotTimestamp(snapshot.atUtc)}</time>
          <p className="nn-type-metadata mt-1">{snapshot.referenceFrame} · {snapshot.zodiacModel} · UTC</p>
        </div>
        <section aria-labelledby="current-sky-positions"><h3 className="nn-type-card-title" id="current-sky-positions">Body positions</h3><ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.bodyPositions.map((body) => <PositionFact key={body.bodyId} body={body} />)}</ul></section>
        <section aria-labelledby="current-sky-aspects"><h3 className="nn-type-card-title" id="current-sky-aspects">Current aspects</h3>{snapshot.currentAspects.length ? <ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.currentAspects.map((aspect, index) => <AspectFact aspect={aspect} key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`} />)}</ul> : <p className="nn-type-body-small mt-3">No supplied current aspects.</p>}</section>
        <p className="nn-notice nn-notice--trust">Development-only instrument. Supplied Engine facts are shown without interpretation.</p>
        <DevelopmentDisclosure snapshot={snapshot} />
      </div>
    </div>
  );
}
