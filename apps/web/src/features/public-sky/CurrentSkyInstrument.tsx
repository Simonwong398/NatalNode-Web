import { useEffect, useId, useRef, useState, type Ref } from 'react';
import type { EngineClient } from '@natalnode/engine-client';
import type {
  SkyBodyPosition,
  SkyCurrentAspect,
  SkySnapshotResult
} from '@natalnode/contracts';
import { ChartRenderer } from '@/features/chart-renderer';
import ChartFocusDialog from '@/features/chart-workspace/ChartFocusDialog';
import {
  createSkyPresentationPolicy,
  withChartPresentationMode
} from '@/features/chart-workspace/chart-presentation-policy';
import { getAstrologyGlyph } from '@/components/astrology/AstrologyGlyph';
import { engineClient } from '@/lib/engine-client';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '@/lib/localization';
import {
  resolveAstrologyDomainTerm,
  type AstrologyGlossaryDomainKind
} from '@/lib/astrology-glossary';
import {
  chartCalculationStatus,
  chartUi,
  chartUiFormat,
  chartWarningMessage
} from '../chart-experience/chart-ui.js';

const UNKNOWN_GLYPH = '·';

function getBodyGlyph(bodyId: string): string {
  return getAstrologyGlyph('body', bodyId) ?? UNKNOWN_GLYPH;
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

function formatPositionFact(body: SkyBodyPosition, locale: SupportedLocale | undefined): string {
  const motion = body.motionState ? ` · ${glossaryTerm('motion', body.motionState, locale).toLowerCase()}` : '';
  return chartUiFormat(locale, 'sky.positionFact', {
    body: glossaryTerm('body', body.bodyId, locale),
    degree: formatDegrees(body.longitude),
    sign: glossaryTerm('sign', body.sign, locale),
    motion
  });
}

function PositionFact({ body, locale }: { body: SkyBodyPosition; locale?: SupportedLocale }) {
  return (
    <li>
      <span aria-hidden="true">{getBodyGlyph(body.bodyId)}</span>{' '}
      {formatPositionFact(body, locale)}
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
    <section aria-labelledby="current-sky-highlights" className={`nn-sky-highlights rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/25 ${compact ? 'p-2 sm:p-3' : 'p-4'}`} data-sky-highlights={compact ? 'compact' : 'full'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="nn-type-card-title" id="current-sky-highlights">
          {chartUi(locale, 'sky.highlights')}
        </h3>
        <span className="nn-type-metadata">{chartUi(locale, 'sky.suppliedFacts')}</span>
      </div>
      {compact ? (
        <div className="nn-sky-symbolic-groups mt-3">
          <div className="nn-sky-symbolic-group">
            <p className="nn-type-label">{chartUi(locale, 'sky.bodyPositions')}</p>
            <ul aria-label={chartUi(locale, 'sky.bodyPositions')} className="nn-sky-symbolic-row nn-sky-symbolic-row--bodies">
              {snapshot.bodyPositions.map((body) => {
                const description = formatPositionFact(body, locale);

                return (
                  <li key={body.bodyId}>
                    <span aria-label={description} className="nn-sky-symbolic-glyph nn-sky-symbolic-glyph--body" role="img" title={description}>
                      {getBodyGlyph(body.bodyId)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="nn-sky-symbolic-group">
            <p className="nn-type-label">{chartUi(locale, 'sky.currentAspects')}</p>
            {snapshot.currentAspects.length > 0 ? (
              <ul aria-label={chartUi(locale, 'sky.currentAspects')} className="nn-sky-symbolic-row nn-sky-symbolic-row--aspects">
                {snapshot.currentAspects.map((aspect, index) => {
                  const description = formatAspect(aspect, locale);

                  return (
                    <li key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`}>
                      <span aria-label={description} className="nn-sky-symbolic-aspect" role="img" title={description}>
                        <span aria-hidden="true" className="nn-astrology-glyph">{getBodyGlyph(aspect.firstBodyId)}</span>
                        <span aria-hidden="true" className="nn-astrology-glyph nn-sky-symbolic-aspect__relation">{getAspectGlyph(aspect.aspectType)}</span>
                        <span aria-hidden="true" className="nn-astrology-glyph">{getBodyGlyph(aspect.secondBodyId)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="nn-type-body-small">{chartUi(locale, 'sky.noCurrentAspects')}</p>
            )}
          </div>
          {retrogradeBodies.length > 0 ? (
            <p className="nn-sky-symbolic-note nn-type-metadata">
              <span aria-hidden="true" className="nn-astrology-glyph mr-1">{RETROGRADE_GLYPH}</span>
              {chartUiFormat(
                locale,
                retrogradeBodies.length === 1
                  ? 'sky.retrogradeCount.one'
                  : 'sky.retrogradeCount.many',
                { count: retrogradeBodies.length, motion: retrogradeTerm }
              )}
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-3 space-y-2 nn-type-body-small">
          {highlightedAspects.map((aspect, index) => (
            <li className="flex items-start gap-2" key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`}>
              <span aria-hidden="true" className="shrink-0 text-natal-accent">{getBodyGlyph(aspect.firstBodyId)} {getAspectGlyph(aspect.aspectType)} {getBodyGlyph(aspect.secondBodyId)}</span>
              <span>{formatAspect(aspect, locale)}</span>
            </li>
          ))}
          {retrogradeBodies.length > 0 ? (
            <li className="flex items-start gap-2">
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
      )}
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

function SkyChartPanel({
  compact,
  expandButtonRef,
  locale,
  onExpand,
  snapshot
}: {
  compact: boolean;
  expandButtonRef: Ref<HTMLButtonElement>;
  locale?: SupportedLocale;
  onExpand: () => void;
  snapshot: SkySnapshotResult;
}) {
  const presentationPolicy = compact
    ? createSkyPresentationPolicy()
    : withChartPresentationMode(createSkyPresentationPolicy(), 'expanded');

  return (
    <div
      className={`nn-sky-chart-panel min-w-0 rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-night/30 shadow-[var(--nn-shadow-low)] ${compact ? 'nn-sky-chart-panel--compact p-2 sm:p-3 lg:p-4' : 'p-3 sm:p-6 lg:p-8'}`}
      data-sky-interactive="true"
    >
      <ChartRenderer
        chart={snapshot}
        chartKind="sky"
        locale={locale}
        presentationPolicy={presentationPolicy}
      />
      <button
        aria-label={chartUi(locale, 'chart.expand')}
        className={`nn-button nn-sky-expand-action mt-3 w-full sm:w-auto ${compact ? 'nn-button--secondary' : 'nn-button--quiet'}`}
        onClick={onExpand}
        ref={expandButtonRef}
        type="button"
      >
        {chartUi(locale, 'chart.expand')}
      </button>
    </div>
  );
}

function SkyFocusSurface({
  compact,
  expandButtonRef,
  locale,
  onExpand,
  snapshot
}: {
  compact: boolean;
  expandButtonRef: Ref<HTMLButtonElement>;
  locale?: SupportedLocale;
  onExpand: () => void;
  snapshot: SkySnapshotResult;
}) {
  return (
    <div className="grid gap-3 sm:gap-4">
      <SkyChartPanel
        compact={compact}
        expandButtonRef={expandButtonRef}
        locale={locale}
        onExpand={onExpand}
        snapshot={snapshot}
      />
      <div className="space-y-2 sm:space-y-4">
        <SnapshotReadout compact={compact} locale={locale} snapshot={snapshot} />
        <SkyHighlights compact={compact} locale={locale} snapshot={snapshot} />
        {compact ? <DevelopmentDisclosure compact locale={locale} snapshot={snapshot} /> : null}
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
  const instrumentId = useId().replace(/:/g, '');
  const focusDialogId = `${instrumentId}-focus-dialog`;
  const focusTriggerRef = useRef<HTMLButtonElement>(null);
  const focusCloseRef = useRef<HTMLButtonElement>(null);
  const [snapshot, setSnapshot] = useState<SkySnapshotResult | null>(null);
  const [error, setError] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

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

  useEffect(() => {
    if (!isFocusOpen) return;

    const returnFocusTarget = focusTriggerRef.current ?? (
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    );
    document.body.classList.add('nn-chart-focus-lock');
    focusCloseRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsFocusOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('nn-chart-focus-lock');
      document.removeEventListener('keydown', handleEscape);
      returnFocusTarget?.focus();
    };
  }, [isFocusOpen]);

  if (error) return <p className="nn-notice nn-notice--error" role="alert">{chartUi(locale, 'sky.unavailable')}</p>;
  if (!snapshot) return <p className="nn-async-state nn-async-state--loading" role="status" aria-live="polite">{chartUi(locale, 'sky.loading')}</p>;

  if (variant === 'compact') {
    return (
      <>
        <SkyFocusSurface
          compact
          expandButtonRef={focusTriggerRef}
          locale={locale}
          onExpand={() => setIsFocusOpen(true)}
          snapshot={snapshot}
        />
        {isFocusOpen ? (
          <ChartFocusDialog
            chart={snapshot}
            chartKind="sky"
            closeButtonRef={focusCloseRef}
            dialogId={focusDialogId}
            locale={locale}
            onClose={() => setIsFocusOpen(false)}
            presentationPolicy={withChartPresentationMode(createSkyPresentationPolicy(), 'expanded')}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
      <SkyChartPanel
        compact={false}
        expandButtonRef={focusTriggerRef}
        locale={locale}
        onExpand={() => setIsFocusOpen(true)}
        snapshot={snapshot}
      />
      <div className="space-y-6">
        <SnapshotReadout locale={locale} snapshot={snapshot} />
        <SkyHighlights locale={locale} snapshot={snapshot} />
        <section aria-labelledby="current-sky-positions"><h3 className="nn-type-card-title" id="current-sky-positions">{chartUi(locale, 'sky.bodyPositions')}</h3><ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.bodyPositions.map((body) => <PositionFact key={body.bodyId} body={body} locale={locale} />)}</ul></section>
        <section aria-labelledby="current-sky-aspects"><h3 className="nn-type-card-title" id="current-sky-aspects">{chartUi(locale, 'sky.currentAspects')}</h3>{snapshot.currentAspects.length ? <ul className="mt-3 space-y-2 nn-type-body-small">{snapshot.currentAspects.map((aspect, index) => <AspectFact aspect={aspect} key={`${aspect.firstBodyId}-${aspect.secondBodyId}-${index}`} locale={locale} />)}</ul> : <p className="nn-type-body-small mt-3">{chartUi(locale, 'sky.noCurrentAspects')}</p>}</section>
        <p className="nn-notice nn-notice--trust">{chartUi(locale, 'sky.trustNotice')}</p>
        <DevelopmentDisclosure locale={locale} snapshot={snapshot} />
      </div>
      {isFocusOpen ? (
        <ChartFocusDialog
          chart={snapshot}
          chartKind="sky"
          closeButtonRef={focusCloseRef}
          dialogId={focusDialogId}
          locale={locale}
          onClose={() => setIsFocusOpen(false)}
          presentationPolicy={withChartPresentationMode(createSkyPresentationPolicy(), 'expanded')}
        />
      ) : null}
    </div>
  );
}
