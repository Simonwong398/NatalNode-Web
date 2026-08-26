import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import { CalculationDetails } from '@/features/calculation-details';
import { ChartRenderer } from '@/features/chart-renderer';
import { InterpretationPanel } from '@/features/interpretation';
import type { ChartPresentationPolicy } from './chart-presentation-policy';

type WorkspaceSection = 'chart' | 'interpretation' | 'details';

const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  'chart',
  'interpretation',
  'details'
];

const WORKSPACE_SECTION_LABELS: Record<WorkspaceSection, string> = {
  chart: 'Chart',
  interpretation: 'Interpretation',
  details: 'Details'
};

export type ChartWorkspaceViewProps = {
  chart: ChartResult;
  presentationPolicy: ChartPresentationPolicy;
  requestedHouseSystem: string;
  children?: ReactNode;
};

/** Displays a trusted chart result without adding any calculation or persistence behavior. */
export default function ChartWorkspaceView({
  chart,
  presentationPolicy,
  requestedHouseSystem,
  children
}: ChartWorkspaceViewProps) {
  const workspaceId = useId();
  const titleId = `${workspaceId}-title`;
  const wheelTitleId = `${workspaceId}-wheel-title`;
  const tabRefs = useRef<Record<WorkspaceSection, HTMLButtonElement | null>>({
    chart: null,
    interpretation: null,
    details: null
  });
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('chart');
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';

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

  const handleSectionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    section: WorkspaceSection
  ) => {
    const currentIndex = WORKSPACE_SECTIONS.indexOf(section);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % WORKSPACE_SECTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + WORKSPACE_SECTIONS.length) % WORKSPACE_SECTIONS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = WORKSPACE_SECTIONS.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextSection = WORKSPACE_SECTIONS[nextIndex];
    setActiveSection(nextSection);
    tabRefs.current[nextSection]?.focus();
  };

  const panelVisibility = (section: WorkspaceSection) =>
    activeSection === section ? 'block' : 'hidden lg:block';

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated mt-2 min-w-0 overflow-hidden"
    >
      <header className="nn-section-header border-b border-natal-border/70 p-5 sm:p-7 lg:flex lg:flex-row lg:items-end lg:justify-between">
        <div className="nn-section-header">
          <p className="nn-eyebrow">Chart Workspace</p>
          <h2 className="nn-type-section-title" id={titleId}>
            Natal Chart
          </h2>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Chart status">
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

      <nav
        aria-label="Chart workspace sections"
        className="nn-surface mx-5 mt-5 p-1 sm:mx-7 lg:hidden"
      >
        <div aria-label="Chart workspace sections" role="tablist" className="grid grid-cols-3 gap-1">
          {WORKSPACE_SECTIONS.map((section) => {
            const isActive = activeSection === section;

            return (
              <button
                aria-controls={sectionIds[section]}
                aria-selected={isActive}
                className={`nn-button min-h-11 px-3 text-center text-xs sm:text-sm ${
                  isActive ? 'nn-button--secondary' : 'nn-button--quiet'
                }`}
                id={tabIds[section]}
                key={section}
                onClick={() => setActiveSection(section)}
                onKeyDown={(event) => handleSectionKeyDown(event, section)}
                ref={(element) => {
                  tabRefs.current[section] = element;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {WORKSPACE_SECTION_LABELS[section]}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="grid min-w-0 gap-4 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)] lg:gap-6">
        <div
          aria-labelledby={tabIds.chart}
          className={`min-w-0 lg:col-start-1 lg:row-start-1 ${panelVisibility('chart')}`}
          id={sectionIds.chart}
          role="tabpanel"
          tabIndex={0}
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
              <ChartRenderer chart={chart} presentationPolicy={presentationPolicy} />
            </div>
          </section>
        </div>

        {children ? (
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            {children}
          </div>
        ) : null}

        <div
          aria-labelledby={tabIds.interpretation}
          className={`min-w-0 lg:col-start-2 lg:row-start-1 ${panelVisibility('interpretation')}`}
          id={sectionIds.interpretation}
          role="tabpanel"
          tabIndex={0}
        >
          <InterpretationPanel chart={chart} presentationPolicy={presentationPolicy} />
        </div>

        <div
          aria-labelledby={tabIds.details}
          className={`min-w-0 lg:col-span-2 lg:col-start-1 ${panelVisibility('details')}`}
          id={sectionIds.details}
          role="tabpanel"
          tabIndex={0}
        >
          <CalculationDetails
            chart={chart}
            presentationPolicy={presentationPolicy}
            requestedHouseSystem={requestedHouseSystem}
          />
        </div>
      </div>
    </section>
  );
}
