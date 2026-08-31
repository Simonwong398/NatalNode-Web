import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref
} from 'react';
import type { ChartResult } from '@natalnode/contracts';
import { CalculationDetails } from '@/features/calculation-details';
import { ChartRenderer } from '@/features/chart-renderer';
import { InterpretationPanel } from '@/features/interpretation';
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '../../lib/localization.js';
import { resolveAstrologyTerm } from '../../lib/astrology-glossary.js';
import type { ChartPresentationPolicy } from './chart-presentation-policy';
import { chartUi } from '../chart-experience/chart-ui.js';
import AstrologicalNotation from './AstrologicalNotation';

type ResultMode = 'chart' | 'interpretation' | 'details';

const RESULT_MODES: readonly ResultMode[] = [
  'chart',
  'interpretation',
  'details'
];

const RESULT_MODE_KEYS = {
  chart: 'workspace.chartTab',
  interpretation: 'workspace.interpretationTab',
  details: 'workspace.detailsTab'
} as const;

export type ChartWorkspaceViewProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
  requestedHouseSystem: string;
  resultTargetRef?: Ref<HTMLElement>;
  children?: ReactNode;
};

/** Displays a trusted chart result without adding any calculation or persistence behavior. */
export default function ChartWorkspaceView({
  chart,
  locale,
  presentationPolicy,
  requestedHouseSystem,
  resultTargetRef,
  children
}: ChartWorkspaceViewProps) {
  const workspaceId = useId();
  const titleId = `${workspaceId}-title`;
  const wheelTitleId = `${workspaceId}-wheel-title`;
  const savePanelId = `${workspaceId}-save-panel`;
  const tabRefs = useRef<Record<ResultMode, HTMLButtonElement | null>>({
    chart: null,
    interpretation: null,
    details: null
  });
  const [activeMode, setActiveMode] = useState<ResultMode>('chart');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';
  const natalChartResolution = resolveAstrologyTerm(
    'chart_type.natal',
    locale ?? DEFAULT_LOCALE
  );
  const natalChartLabel = natalChartResolution.displayTerm === 'Natal chart'
    ? 'Natal Chart'
    : natalChartResolution.displayTerm;

  const sectionIds = {
    chart: `${workspaceId}-chart-panel`,
    interpretation: `${workspaceId}-interpretation-panel`,
    details: `${workspaceId}-details-panel`
  } as const;

  const tabIds = {
    chart: `${workspaceId}-chart-tab`,
    interpretation: `${workspaceId}-interpretation-tab`,
    details: `${workspaceId}-details-tab`
  } as const;

  const handleModeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    mode: ResultMode
  ) => {
    const currentIndex = RESULT_MODES.indexOf(mode);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % RESULT_MODES.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + RESULT_MODES.length) % RESULT_MODES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = RESULT_MODES.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextMode = RESULT_MODES[nextIndex];
    setActiveMode(nextMode);
    tabRefs.current[nextMode]?.focus();
  };

  return (
    <section
      aria-labelledby={titleId}
      className="nn-chart-workspace nn-surface nn-surface--elevated mt-2 min-w-0 overflow-hidden"
      ref={resultTargetRef}
      tabIndex={resultTargetRef ? -1 : undefined}
    >
      <header className="nn-section-header border-b border-natal-border/70 p-5 sm:p-7 lg:flex lg:flex-row lg:items-end lg:justify-between">
        <div className="nn-section-header">
          <p className="nn-eyebrow">{chartUi(locale, 'workspace.eyebrow')}</p>
          <h2 className="nn-type-section-title" id={titleId}>
            {natalChartLabel}
          </h2>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div
            className="flex flex-wrap gap-2"
            aria-label={chartUi(locale, 'workspace.chartStatusLabel')}
          >
            <span className="nn-badge">
              Schema {chart.schemaVersion}
            </span>
            <span className="nn-badge">
              {chart.calculationStatus}
            </span>
            {isResearchConfiguration ? (
              <span className="nn-badge nn-status--research">
                Research configuration
              </span>
            ) : null}
          </div>
          {children ? (
            <button
              aria-controls={savePanelId}
              aria-expanded={isSaveOpen}
              className="nn-button nn-button--quiet self-start px-3 lg:self-auto"
              onClick={() => setIsSaveOpen((current) => !current)}
              type="button"
            >
              {chartUi(locale, 'workspace.saveChart')}
            </button>
          ) : null}
        </div>
      </header>

      {!presentationPolicy.showAngles ? (
        <p
          className="nn-notice nn-notice--trust mx-5 mt-5 sm:mx-7"
          role="note"
        >
          <span>
            <strong className="nn-status nn-status--trust">Trust limitation</strong>{' '}
            Birth time is unknown. Ascendant, Midheaven, houses, and house-based interpretation are unavailable.
          </span>
        </p>
      ) : null}

      {children ? (
        <div className="mx-5 mt-5 sm:mx-7" hidden={!isSaveOpen} id={savePanelId}>
          {children}
        </div>
      ) : null}

      <nav
        aria-label={chartUi(locale, 'workspace.sectionsLabel')}
        className="nn-surface mx-5 mt-5 p-1 sm:mx-7"
      >
        <div
          aria-label={chartUi(locale, 'workspace.sectionsLabel')}
          aria-orientation="horizontal"
          className="grid grid-cols-3 gap-1"
          role="tablist"
        >
          {RESULT_MODES.map((mode) => {
            const isActive = activeMode === mode;

            return (
              <button
                aria-controls={sectionIds[mode]}
                aria-selected={isActive}
                className={`nn-button min-h-11 px-3 text-center text-xs sm:text-sm ${
                  isActive ? 'nn-button--secondary' : 'nn-button--quiet'
                }`}
                id={tabIds[mode]}
                key={mode}
                onClick={() => setActiveMode(mode)}
                onKeyDown={(event) => handleModeKeyDown(event, mode)}
                ref={(element) => {
                  tabRefs.current[mode] = element;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {chartUi(locale, RESULT_MODE_KEYS[mode])}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="grid min-w-0 gap-4 p-5 sm:p-7 lg:gap-6">
        <div
          aria-labelledby={tabIds.chart}
          className="min-w-0"
          hidden={activeMode !== 'chart'}
          id={sectionIds.chart}
          role="tabpanel"
          tabIndex={activeMode === 'chart' ? 0 : undefined}
        >
          <section
            aria-labelledby={wheelTitleId}
            className="nn-surface nn-surface--instrument min-w-0 p-4 sm:p-6 lg:p-7"
          >
            <div className="nn-section-header">
              <p className="nn-eyebrow">Chart instrument</p>
              <h3 className="nn-type-section-title" id={wheelTitleId}>
                Engine-provided chart facts
              </h3>
            </div>
            <div className="mt-5 min-w-0">
              <ChartRenderer
                chart={chart}
                locale={locale}
                presentationPolicy={presentationPolicy}
              />
            </div>
            <AstrologicalNotation
              chart={chart}
              locale={locale}
              presentationPolicy={presentationPolicy}
            />
          </section>
        </div>

        <div
          aria-labelledby={tabIds.interpretation}
          className="min-w-0"
          hidden={activeMode !== 'interpretation'}
          id={sectionIds.interpretation}
          role="tabpanel"
          tabIndex={activeMode === 'interpretation' ? 0 : undefined}
        >
          <InterpretationPanel chart={chart} presentationPolicy={presentationPolicy} />
        </div>

        <div
          aria-labelledby={tabIds.details}
          className="min-w-0"
          hidden={activeMode !== 'details'}
          id={sectionIds.details}
          role="tabpanel"
          tabIndex={activeMode === 'details' ? 0 : undefined}
        >
          <CalculationDetails
            chart={chart}
            locale={locale}
            presentationPolicy={presentationPolicy}
            requestedHouseSystem={requestedHouseSystem}
          />
        </div>
      </div>
    </section>
  );
}
