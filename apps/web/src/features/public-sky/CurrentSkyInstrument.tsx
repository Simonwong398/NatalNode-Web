import { useEffect, useId, useState } from 'react';
import type { EngineClient } from '@natalnode/engine-client';
import type {
  SkyBodyPosition,
  SkyCurrentAspect,
  SkySnapshotResult
} from '@natalnode/contracts';
import { getAstrologyGlyph } from '@/components/astrology/AstrologyGlyph';
import { engineClient } from '@/lib/engine-client';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '@/lib/localization';
import {
  getAstrologyGlossaryNotation,
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/lib/astrology-glossary';
import {
  chartCalculationStatus,
  chartUi,
  chartUiFormat,
  chartWarningMessage
} from '../chart-experience/chart-ui.js';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;
const ASPECT_STYLES: Record<string, { stroke: string; strokeDasharray?: string; opacity: number; strokeWidth: number }> = {
  conjunction: { stroke: 'var(--nn-chart-aspect-neutral)', opacity: 0.88, strokeWidth: 1.8 },
  opposition: { stroke: 'var(--nn-chart-aspect-dynamic)', strokeDasharray: '8 4', opacity: 0.9, strokeWidth: 1.8 },
  trine: { stroke: 'var(--nn-chart-aspect-harmonious)', opacity: 0.84, strokeWidth: 1.7 },
  square: { stroke: 'var(--nn-chart-aspect-dynamic)', strokeDasharray: '6 3 1 3', opacity: 0.9, strokeWidth: 1.8 },
  sextile: { stroke: 'var(--nn-chart-aspect-harmonious)', strokeDasharray: '2 4', opacity: 0.76, strokeWidth: 1.5 }
};

const UNKNOWN_GLYPH = '·';

function getBodyGlyph(bodyId: string): string {
  return getAstrologyGlyph('body', bodyId) ?? UNKNOWN_GLYPH;
}

function getBodyAbbreviation(bodyId: string): string {
  return getAstrologyGlossaryNotation('body', bodyId, 'rendererAbbreviation') ?? bodyId.slice(0, 2);
}

function getAspectGlyph(aspectType: string): string {
  return getAstrologyGlyph('aspect', aspectType) ?? UNKNOWN_GLYPH;
}

const RETROGRADE_GLYPH = getAstrologyGlyph('motion', 'RETROGRADE') ?? '℞';

function glossaryTerm(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  locale: SupportedLocale | undefined
): string {
  return resolveAstrologyDomainTerm(kind, value, locale ?? DEFAULT_LOCALE)?.displayTerm ??
    (typeof value === 'string' ? value : String(value));
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

function formatAspect(aspect: SkyCurrentAspect, locale: SupportedLocale | undefined) {
  const orb = aspect.orb === null
    ? ''
    : `, ${formatDegrees(aspect.orb)} ${glossaryTerm('aspect', 'orb', locale).toLowerCase()}`;
  const phase = aspect.phaseState === null
    ? ''
    : `, ${glossaryTerm('aspect_phase', aspect.phaseState, locale).toLowerCase()}`;
  return `${glossaryTerm('body', aspect.firstBodyId, locale)} ${glossaryTerm('aspect', aspect.aspectType, locale)} ${glossaryTerm('body', aspect.secondBodyId, locale)}${orb}${phase}`;
}

function formatSnapshotTimestamp(atUtc: string, locale: SupportedLocale | undefined): string {
  const timestamp = new Date(atUtc).toISOString();
  const date = locale && locale !== 'en'
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }).format(new Date(atUtc))
    : timestamp.slice(0, 10);

  return chartUiFormat(locale, 'sky.snapshotAt', {
    date,
    time: timestamp.slice(11, 16)
  });
}

function SkyWheel({ snapshot, locale }: { snapshot: SkySnapshotResult; locale?: SupportedLocale }) {
  const titleId = `${useId()}-title`;
  const descriptionId = `${useId()}-description`;
  const positions = new Map(snapshot.bodyPositions.map((body) => [body.bodyId, body]));

  return (
    <svg className="h-auto w-full" viewBox="0 0 640 640" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{chartUi(locale, 'sky.wheelTitle')}</title>
      <desc id={descriptionId}>{chartUi(locale, 'sky.wheelDescription')}</desc>
      <circle cx="320" cy="320" r="292" fill="var(--nn-surface-base)" stroke="var(--nn-border-strong)" strokeWidth="2" />
      <g aria-label={chartUi(locale, 'sky.zodiacSectors')} role="group">
        {ZODIAC_SIGNS.map((sign, index) => {
          const label = point(index * 30 + 15, 262);
          const glyph = getAstrologyGlyph('sign', sign) ?? UNKNOWN_GLYPH;
          return (
            <g key={sign} aria-label={`${glossaryTerm('sign', sign, locale)} sector`} role="group">
              <path d={sectorPath(index * 30, index * 30 + 30, 292, 232)} fill="var(--nn-chart-zodiac)" fillOpacity={index % 2 ? '0.14' : '0.08'} stroke="var(--nn-chart-zodiac)" strokeOpacity="0.55" />
              <text aria-hidden="true" x={label.x} y={label.y - 5} textAnchor="middle" fill="var(--nn-text-primary)" fontFamily="var(--nn-font-sans)" fontSize="22">{glyph}</text>
              <text aria-hidden="true" x={label.x} y={label.y + 15} textAnchor="middle" fill="var(--nn-text-secondary)" fontFamily="var(--nn-font-sans)" fontSize="10">{glossaryTerm('sign', sign, locale)}</text>
            </g>
          );
        })}
      </g>
      <circle cx="320" cy="320" r="232" fill="var(--nn-surface-elevated)" fillOpacity="0.88" stroke="var(--nn-border-strong)" />
      <g aria-label={chartUi(locale, 'sky.suppliedAspects')} role="group">
        {snapshot.currentAspects.map((aspect, index) => {
          const first = positions.get(aspect.firstBodyId), second = positions.get(aspect.secondBodyId);
          if (!first || !second) return null;
          const a = point(first.longitude, 138), b = point(second.longitude, 138);
          const style = ASPECT_STYLES[aspect.aspectType] ?? {
            stroke: 'var(--nn-chart-aspect-neutral)', opacity: 0.82, strokeWidth: 1.5
          };

          return (
            <g key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`} aria-label={formatAspect(aspect, locale)} role="group">
              <title>{formatAspect(aspect, locale)}</title>
              <line aria-hidden="true" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--nn-bg-observatory)" strokeOpacity="0.82" strokeWidth={style.strokeWidth + 2.4} strokeDasharray={style.strokeDasharray} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <line aria-hidden="true" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={style.stroke} strokeOpacity={style.opacity} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </g>
      <g aria-label={chartUi(locale, 'sky.suppliedBodies')} role="group">
        {snapshot.bodyPositions.map((body, index) => {
          const marker = point(body.longitude, 174 + (index % 2) * 13);
          const label = point(body.longitude, 204 + (index % 3) * 10);
          const motion = body.motionState
            ? `, ${glossaryTerm('motion', body.motionState, locale).toLowerCase()}`
            : '';
          return (
            <g key={body.bodyId} role="group" aria-label={`${glossaryTerm('body', body.bodyId, locale)} at ${formatDegrees(body.longitude)}, ${glossaryTerm('sign', body.sign, locale)}${motion}`}>
              <line aria-hidden="true" x1={marker.x} y1={marker.y} x2={label.x} y2={label.y} stroke="var(--nn-chart-body-secondary)" strokeOpacity="0.45" strokeDasharray="2 3" />
              <circle aria-hidden="true" cx={marker.x} cy={marker.y} r="10" fill="var(--nn-chart-body-secondary)" fillOpacity="0.12" stroke="var(--nn-chart-body-secondary)" strokeOpacity="0.36" strokeWidth="1" />
              <circle aria-hidden="true" cx={marker.x} cy={marker.y} r="5.5" fill="var(--nn-chart-body-primary)" stroke="var(--nn-surface-elevated)" strokeWidth="2" />
              <text aria-hidden="true" x={label.x} y={label.y - 6} textAnchor="middle" dominantBaseline="middle" fill="var(--nn-chart-body-primary)" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="18" fontWeight="700">{getBodyGlyph(body.bodyId)}</text>
              <text aria-hidden="true" x={label.x} y={label.y + 10} textAnchor="middle" dominantBaseline="middle" fill="var(--nn-chart-body-secondary)" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.08em">{getBodyAbbreviation(body.bodyId)}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function PositionFact({ body, locale }: { body: SkyBodyPosition; locale?: SupportedLocale }) {
  const motion = body.motionState ? ` · ${glossaryTerm('motion', body.motionState, locale).toLowerCase()}` : '';
  return (
    <li>
      <span aria-hidden="true">{getBodyGlyph(body.bodyId)}</span>{' '}
      {chartUiFormat(locale, 'sky.positionFact', {
        body: glossaryTerm('body', body.bodyId, locale),
        degree: formatDegrees(body.longitude),
        sign: glossaryTerm('sign', body.sign, locale),
        motion
      })}
    </li>
  );
}

function AspectFact({ aspect, locale }: { aspect: SkyCurrentAspect; locale?: SupportedLocale }) {
  return (
    <li>
      <span aria-hidden="true">
        {getBodyGlyph(aspect.firstBodyId)} {getAspectGlyph(aspect.aspectType)} {getBodyGlyph(aspect.secondBodyId)}{' '}
      </span>
      {formatAspect(aspect, locale)}
    </li>
  );
}

function SkyHighlights({ snapshot, compact = false, locale }: { snapshot: SkySnapshotResult; compact?: boolean; locale?: SupportedLocale }) {
  const highlightedAspects = snapshot.currentAspects.slice(0, 2);
  const retrogradeBodies = snapshot.bodyPositions.filter((body) => body.motionState === 'RETROGRADE');
  const retrogradeTerm = glossaryTerm('motion', 'RETROGRADE', locale).toLowerCase();

  return (
    <section aria-labelledby="current-sky-highlights" className={`rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/25 ${compact ? 'p-2 sm:p-3' : 'p-4'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="nn-type-card-title" id="current-sky-highlights">
          {chartUi(locale, 'sky.highlights')}
        </h3>
        <span className="nn-type-metadata">{chartUi(locale, 'sky.suppliedFacts')}</span>
      </div>
      <ul className={`${compact ? 'mt-1.5 space-y-1 sm:mt-2 sm:space-y-1.5' : 'mt-3 space-y-2'} nn-type-body-small`}>
        {highlightedAspects.map((aspect, index) => (
          <li className={`${compact && index > 0 ? 'hidden sm:flex' : 'flex'} items-start gap-2`} key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`}>
            <span aria-hidden="true" className="shrink-0 text-natal-accent">{getBodyGlyph(aspect.firstBodyId)} {getAspectGlyph(aspect.aspectType)} {getBodyGlyph(aspect.secondBodyId)}</span>
            <span>{formatAspect(aspect, locale)}</span>
          </li>
        ))}
        {retrogradeBodies.length > 0 ? (
          <li className={`${compact && highlightedAspects.length > 0 ? 'hidden sm:flex' : 'flex'} items-start gap-2`}>
            <span aria-hidden="true" className="nn-astrology-glyph shrink-0 text-natal-accent">{RETROGRADE_GLYPH}</span>
            <span>
              {chartUiFormat(
                locale,
                retrogradeBodies.length === 1
                  ? 'sky.retrogradeCount.one'
                  : 'sky.retrogradeCount.many',
                { count: retrogradeBodies.length, motion: retrogradeTerm }
              )}
            </span>
          </li>
        ) : null}
        {highlightedAspects.length === 0 && retrogradeBodies.length === 0
          ? <li>{chartUi(locale, 'sky.noHighlights')}</li>
          : null}
      </ul>
    </section>
  );
}

function DevelopmentDisclosure({
  locale,
  snapshot,
  compact = false
}: {
  locale?: SupportedLocale;
  snapshot: SkySnapshotResult;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="nn-type-metadata text-[0.6875rem] leading-4 sm:text-xs sm:leading-5" data-development-fixture="true">
        {chartUi(locale, 'sky.developmentFixtureCompact')}
      </p>
    );
  }

  return (
    <section aria-labelledby="current-sky-disclosure" className="nn-notice nn-notice--research flex-col">
      <div>
        <p className="nn-eyebrow nn-status--research" id="current-sky-disclosure">
          {chartUi(locale, 'sky.developmentStatus')}
        </p>
        <p className="nn-type-metadata mt-2">
          {chartCalculationStatus(locale, snapshot.calculationStatus)}
        </p>
      </div>
      {snapshot.warnings.length > 0 ? (
        <ul className="grid gap-1 nn-type-metadata">
          {snapshot.warnings.map((warning, index) => (
            <li key={`${warning.code}-${index}`}>{chartWarningMessage(locale, warning)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function SnapshotReadout({ snapshot, compact = false, locale }: { snapshot: SkySnapshotResult; compact?: boolean; locale?: SupportedLocale }) {
  return (
    <div>
      {!compact ? <p className="nn-eyebrow">{chartUi(locale, 'sky.instrumentReadout')}</p> : null}
      <time className={`nn-type-metadata block ${compact ? 'mt-1' : 'mt-2'}`} dateTime={snapshot.atUtc}>
        {formatSnapshotTimestamp(snapshot.atUtc, locale)}
      </time>
      <p className={`nn-type-metadata ${compact ? 'mt-0.5' : 'mt-1'}`}>{snapshot.referenceFrame} · {glossaryTerm('zodiac_model', snapshot.zodiacModel, locale)} · UTC</p>
    </div>
  );
}

function CompactSkyInstrument({ snapshot, locale }: { snapshot: SkySnapshotResult; locale?: SupportedLocale }) {
  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="min-w-0 rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/30 p-2 shadow-[var(--nn-shadow-low)] sm:p-3 lg:p-4">
        <SkyWheel locale={locale} snapshot={snapshot} />
      </div>
      <div className="space-y-2 sm:space-y-4">
        <SnapshotReadout compact locale={locale} snapshot={snapshot} />
        <SkyHighlights compact locale={locale} snapshot={snapshot} />
        <DevelopmentDisclosure compact locale={locale} snapshot={snapshot} />
      </div>
    </div>
  );
}

export interface CurrentSkyInstrumentProps {
  atUtc: string;
  client?: EngineClient;
  locale?: SupportedLocale;
  variant?: 'compact' | 'full';
}

export default function CurrentSkyInstrument({
  atUtc,
  client = engineClient,
  locale,
  variant = 'full'
}: CurrentSkyInstrumentProps) {
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

  if (error) return <p className="nn-notice nn-notice--error" role="alert">{chartUi(locale, 'sky.unavailable')}</p>;
  if (!snapshot) return <p className="nn-async-state nn-async-state--loading" role="status" aria-live="polite">{chartUi(locale, 'sky.loading')}</p>;

  if (variant === 'compact') {
    return <CompactSkyInstrument locale={locale} snapshot={snapshot} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
      <div className="min-w-0 rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/30 p-3 shadow-[var(--nn-shadow-low)] sm:p-6 lg:p-8"><SkyWheel locale={locale} snapshot={snapshot} /></div>
      <div className="space-y-6">
        <SnapshotReadout locale={locale} snapshot={snapshot} />
        <SkyHighlights locale={locale} snapshot={snapshot} />
        <section aria-labelledby="current-sky-positions"><h3 className="nn-type-card-title" id="current-sky-positions">{chartUi(locale, 'sky.bodyPositions')}</h3><ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.bodyPositions.map((body) => <PositionFact key={body.bodyId} body={body} locale={locale} />)}</ul></section>
        <section aria-labelledby="current-sky-aspects"><h3 className="nn-type-card-title" id="current-sky-aspects">{chartUi(locale, 'sky.currentAspects')}</h3>{snapshot.currentAspects.length ? <ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.currentAspects.map((aspect, index) => <AspectFact aspect={aspect} key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`} locale={locale} />)}</ul> : <p className="nn-type-body-small mt-3">{chartUi(locale, 'sky.noCurrentAspects')}</p>}</section>
        <p className="nn-notice nn-notice--trust">{chartUi(locale, 'sky.trustNotice')}</p>
        <DevelopmentDisclosure locale={locale} snapshot={snapshot} />
      </div>
    </div>
  );
}
