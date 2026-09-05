import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
  type SyntheticEvent
} from 'react';
import type {
  WeeklyReadingModel,
  WeeklyReadingScreenProjection,
  WeeklyReadingScreenSection,
  WeeklyReadingTimingCategory
} from './weekly-reading-model';
import type {
  WeeklyReadingPrototypeScenario,
  WeeklyReadingPrototypeStyle
} from './weekly-reading-prototype';
import type { WeeklyPocScenarioId } from './weekly-interpretation-poc';

export interface WeeklyReadingPrototypeProps {
  readonly scenarios: readonly WeeklyReadingPrototypeScenario[];
  readonly initialScenarioId?: WeeklyPocScenarioId;
  readonly initialStyle?: WeeklyReadingPrototypeStyle;
}

type OpenDisclosure = 'why' | 'astrologer' | null;

const AVAILABLE_STYLES: readonly WeeklyReadingPrototypeStyle[] = ['CLEAR', 'ASTROLOGER'];

function formatPeriodRange(model: WeeklyReadingModel): string {
  const start = new Date(model.period.startsAt);
  const end = new Date(Date.parse(model.period.endsAt) - 1);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: model.period.canonicalTimezone,
    month: 'short',
    day: 'numeric'
  });
  const yearFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: model.period.canonicalTimezone,
    year: 'numeric'
  });

  return `${dateFormatter.format(start)}–${dateFormatter.format(end)}, ${yearFormatter.format(end)}`;
}

function timingRoleLabel(category: WeeklyReadingTimingCategory): string {
  if (category === 'BACKGROUND') return 'Background context';
  if (category === 'MOMENTARY') return 'Shorter active window';
  return 'Core window';
}

function styleLabel(style: WeeklyReadingPrototypeStyle): string {
  return style === 'ASTROLOGER' ? "Astrologer's view" : 'Clear reading';
}

function hasSection(
  screen: WeeklyReadingScreenProjection,
  section: WeeklyReadingScreenSection
): boolean {
  return screen.readingOrder.includes(section);
}

function initialDisclosureFromUrl(): OpenDisclosure {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('open');
  return value === 'why' || value === 'astrologer' ? value : null;
}

function initialScenarioFromUrl(
  scenarios: readonly WeeklyReadingPrototypeScenario[]
): WeeklyPocScenarioId | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('scenario');
  return scenarios.some((scenario) => scenario.id === requested)
    ? requested as WeeklyPocScenarioId
    : null;
}

function initialStyleFromUrl(): WeeklyReadingPrototypeStyle | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('style');
  return AVAILABLE_STYLES.includes(requested as WeeklyReadingPrototypeStyle)
    ? requested as WeeklyReadingPrototypeStyle
    : null;
}

function disclosureToggle(
  kind: Exclude<OpenDisclosure, null>,
  event: SyntheticEvent<HTMLDetailsElement>,
  setOpenDisclosure: (value: OpenDisclosure) => void
): void {
  setOpenDisclosure(event.currentTarget.open ? kind : null);
}

function disclosureSummary(label: string): ReactElement {
  return (
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-[var(--nn-radius-medium)] px-4 py-3 text-left text-base font-semibold text-nn-text-primary outline-none transition-colors hover:bg-nn-surface-interactive focus-visible:outline-2 focus-visible:outline-nn-accent-supporting focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
      <span>{label}</span>
      <span aria-hidden="true" className="text-lg font-normal text-nn-accent-supporting">+</span>
    </summary>
  );
}

export default function WeeklyReadingPrototype({
  scenarios,
  initialScenarioId,
  initialStyle = 'CLEAR'
}: WeeklyReadingPrototypeProps): ReactElement | null {
  const firstScenario = scenarios[0];
  const [selectedScenarioId, setSelectedScenarioId] = useState<WeeklyPocScenarioId | undefined>(
    initialScenarioId ?? firstScenario?.id
  );
  const [selectedStyle, setSelectedStyle] = useState<WeeklyReadingPrototypeStyle>(initialStyle);
  const [openDisclosure, setOpenDisclosure] = useState<OpenDisclosure>(null);

  useEffect(() => {
    const urlScenario = initialScenarioFromUrl(scenarios);
    const urlStyle = initialStyleFromUrl();
    const urlDisclosure = initialDisclosureFromUrl();

    if (urlScenario !== null) setSelectedScenarioId(urlScenario);
    if (urlStyle !== null) setSelectedStyle(urlStyle);
    if (urlDisclosure !== null) setOpenDisclosure(urlDisclosure);
  }, [scenarios]);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstScenario,
    [firstScenario, scenarios, selectedScenarioId]
  );

  if (selectedScenario === undefined) return null;

  const model = selectedScenario.models[selectedStyle];
  const screen = model.screen;
  const timingCue = screen.hero.timingCue;
  const periodRange = formatPeriodRange(model);
  const availableActions = screen.actions.filter(
    (action) => action.status === 'AVAILABLE' && action.kind !== 'COLLECT'
  );

  const selectScenario = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextScenario = scenarios.find((scenario) => scenario.id === event.currentTarget.value);
    if (nextScenario === undefined) return;
    setSelectedScenarioId(nextScenario.id);
    setOpenDisclosure(null);
  };

  const selectStyle = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextStyle = event.currentTarget.value as WeeklyReadingPrototypeStyle;
    if (!AVAILABLE_STYLES.includes(nextStyle)) return;
    setSelectedStyle(nextStyle);
    setOpenDisclosure(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5" data-weekly-prototype-root>
      <header
        className="rounded-[var(--nn-radius-medium)] border border-nn-border-default bg-nn-surface-interactive px-4 py-4 sm:px-5"
        data-weekly-prototype-harness
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-nn-status-research">Development only</p>
            <p className="mt-1 text-sm font-semibold text-nn-text-primary">Weekly Sky Portrait review harness</p>
          </div>
          <span className="rounded-full border border-nn-border-default px-3 py-1 text-xs font-semibold text-nn-text-muted">
            Static reading prototype
          </span>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.8fr)]">
          <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-nn-text-muted">
            Scenario
            <select
              className="min-h-11 min-w-0 rounded-[var(--nn-radius-small)] border border-nn-border-default bg-nn-surface-base px-3 text-sm font-medium normal-case tracking-normal text-nn-text-primary outline-none transition-colors hover:border-nn-border-strong focus-visible:border-nn-accent-supporting focus-visible:outline-2 focus-visible:outline-nn-accent-supporting focus-visible:outline-offset-2"
              data-weekly-scenario
              value={selectedScenario.id}
              onChange={selectScenario}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.label}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-nn-text-muted">
            Reading voice
            <select
              className="min-h-11 min-w-0 rounded-[var(--nn-radius-small)] border border-nn-border-default bg-nn-surface-base px-3 text-sm font-medium normal-case tracking-normal text-nn-text-primary outline-none transition-colors hover:border-nn-border-strong focus-visible:border-nn-accent-supporting focus-visible:outline-2 focus-visible:outline-nn-accent-supporting focus-visible:outline-offset-2"
              data-weekly-style
              value={selectedStyle}
              onChange={selectStyle}
            >
              {AVAILABLE_STYLES.map((style) => (
                <option key={style} value={style}>{styleLabel(style)}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-5 text-nn-text-muted">
          Review controls only. Save, Share, and Print are represented below but are inactive in this prototype.
        </p>
      </header>

      <article
        aria-labelledby="weekly-reading-title"
        className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[var(--nn-radius-large)] border border-nn-border-default bg-nn-surface-base shadow-nn-low"
        data-weekly-reading
        data-weekly-scenario={selectedScenario.id}
        data-weekly-style={model.style}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--nn-accent-primary)_12%,transparent),transparent_42%)]" aria-hidden="true" />

        <div className="relative">
          <header className="border-b border-nn-border-subtle px-5 pb-9 pt-7 sm:px-10 sm:pb-12 sm:pt-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">{model.period.label}</p>
                <p className="mt-2 text-sm font-medium tabular-nums text-nn-text-muted">Week of {periodRange}</p>
              </div>
              <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-nn-accent-supporting shadow-[0_0_0_6px_color-mix(in_srgb,var(--nn-accent-supporting)_12%,transparent)]" />
            </div>

            <h1 id="weekly-reading-title" className="mt-10 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-nn-text-primary sm:text-6xl">
              {periodRange}
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-[1.45] text-nn-text-primary sm:text-2xl sm:leading-[1.4]">
              {screen.hero.text}
            </p>

            {timingCue !== null && (
              <div className="mt-8 max-w-xl border-l-2 border-nn-accent-supporting pl-4" data-weekly-hero-timing>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-nn-accent-supporting">In focus</p>
                <p className="mt-2 text-sm font-semibold text-nn-text-primary">{timingCue.label}</p>
                <p className="mt-1 text-sm leading-6 text-nn-text-secondary">{timingCue.meaning}</p>
              </div>
            )}
          </header>

          {hasSection(screen, 'AT_A_GLANCE') && screen.atAGlance.length > 0 && (
            <section className="border-b border-nn-border-subtle px-5 py-8 sm:px-10 sm:py-10" aria-labelledby="weekly-at-a-glance-title">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">At a glance</p>
              <h2 id="weekly-at-a-glance-title" className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-nn-text-primary">What to carry</h2>
              <ol className="mt-6 divide-y divide-nn-border-subtle">
                {screen.atAGlance.map((theme, index) => (
                  <li key={theme.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
                    <span className="pt-0.5 text-sm font-semibold tabular-nums text-nn-accent-supporting">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-nn-text-primary">{theme.label}</h3>
                      <p className="mt-2 text-base leading-7 text-nn-text-secondary">{theme.meaning}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {hasSection(screen, 'DOMAINS') && screen.domains.length > 0 && (
            <section className="border-b border-nn-border-subtle px-5 py-8 sm:px-10 sm:py-10" aria-labelledby="weekly-domains-title">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">In your life</p>
              <h2 id="weekly-domains-title" className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-nn-text-primary">Where it may show up</h2>
              <div className="mt-6 space-y-3">
                {screen.domains.map((domain) => (
                  <details key={domain.id} className="overflow-hidden rounded-[var(--nn-radius-medium)] border border-nn-border-subtle bg-nn-surface-elevated" data-weekly-domain={domain.id}>
                    {disclosureSummary(domain.label)}
                    <div className="border-t border-nn-border-subtle px-4 pb-4 pt-3">
                      <p className="text-base leading-7 text-nn-text-secondary">{domain.meaning}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {hasSection(screen, 'TIMELINE') && screen.timeline !== null && (
            <section className="border-b border-nn-border-subtle px-5 py-8 sm:px-10 sm:py-10" aria-labelledby="weekly-timeline-title">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">Timeline</p>
              <h2 id="weekly-timeline-title" className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-nn-text-primary">When it matters</h2>
              <ol className="mt-6 space-y-3" data-weekly-timeline>
                {screen.timeline.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-[var(--nn-radius-medium)] border px-4 py-4 sm:px-5 ${entry.category === 'BACKGROUND'
                      ? 'border-nn-border-subtle bg-nn-surface-elevated'
                      : entry.category === 'MOMENTARY'
                        ? 'border-nn-accent-supporting/60 bg-nn-surface-interactive'
                        : 'border-nn-border-default bg-nn-surface-base'}`}
                    data-timing-category={entry.category}
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-nn-text-primary">{entry.label}</span>
                      <span className="rounded-full border border-nn-border-default px-2 py-0.5 text-xs font-semibold text-nn-text-muted">{timingRoleLabel(entry.category)}</span>
                      {entry.emphasis === 'BEST_WINDOW' && (
                        <span className="rounded-full border border-nn-accent-supporting/70 px-2 py-0.5 text-xs font-semibold text-nn-accent-supporting">Best window</span>
                      )}
                    </div>
                    <p className="mt-3 text-base leading-7 text-nn-text-secondary">{entry.meaning}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {hasSection(screen, 'WATCH_OUT') && screen.watchOut !== null && (
            <aside className="border-b border-nn-border-subtle px-5 py-7 sm:px-10 sm:py-8" aria-labelledby="weekly-watch-out-title">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">Watch out</p>
              <h2 id="weekly-watch-out-title" className="sr-only">A useful caution</h2>
              <p className="mt-3 max-w-2xl border-l-2 border-nn-status-warning pl-4 text-base leading-7 text-nn-text-secondary">{screen.watchOut.text}</p>
            </aside>
          )}

          {hasSection(screen, 'WHY') && (
            <section className="border-b border-nn-border-subtle px-5 py-5 sm:px-10 sm:py-6" aria-labelledby="weekly-why-title">
              <details
                id="weekly-why-disclosure"
                open={openDisclosure === 'why'}
                onToggle={(event) => disclosureToggle('why', event, setOpenDisclosure)}
                data-weekly-disclosure="why"
              >
                {disclosureSummary('Why this week?')}
                <div className="border-t border-nn-border-subtle px-4 pb-4 pt-4 sm:px-4">
                  <p id="weekly-why-title" className="max-w-2xl text-base leading-7 text-nn-text-secondary">{screen.why.text}</p>
                </div>
              </details>
            </section>
          )}

          {model.disclosures.map((disclosure) => (
            <section key={disclosure.kind} className="border-b border-nn-border-subtle px-5 py-5 sm:px-10 sm:py-6" aria-label="About this reading">
              <details data-weekly-disclosure="unknown-time">
                {disclosureSummary('About this reading')}
                <div className="border-t border-nn-border-subtle px-4 pb-4 pt-4 sm:px-4">
                  <p className="max-w-2xl text-base leading-7 text-nn-text-secondary">{disclosure.text}</p>
                </div>
              </details>
            </section>
          ))}

          {hasSection(screen, 'ASTROLOGER_VIEW') && screen.astrologerView.available && screen.astrologerView.text !== null && (
            <section className="border-b border-nn-border-subtle px-5 py-5 sm:px-10 sm:py-6" aria-labelledby="weekly-astrologer-title">
              <details
                id="weekly-astrologer-disclosure"
                open={openDisclosure === 'astrologer'}
                onToggle={(event) => disclosureToggle('astrologer', event, setOpenDisclosure)}
                data-weekly-disclosure="astrologer"
              >
                {disclosureSummary("Astrologer's view")}
                <div className="border-t border-nn-border-subtle px-4 pb-4 pt-4 sm:px-4">
                  <p id="weekly-astrologer-title" className="max-w-2xl text-base leading-7 text-nn-text-secondary">{screen.astrologerView.text}</p>
                </div>
              </details>
            </section>
          )}

          {hasSection(screen, 'ACTIONS') && (
            <section className="border-b border-nn-border-subtle px-5 py-8 sm:px-10 sm:py-10" aria-labelledby="weekly-actions-title">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-nn-accent-supporting">After the reading</p>
              <h2 id="weekly-actions-title" className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-nn-text-primary">Keep this reading</h2>
              <div className="mt-5 flex flex-wrap gap-3" role="group" aria-describedby="weekly-actions-note">
                {availableActions.map((action) => (
                  <button
                    key={action.kind}
                    className="min-h-11 rounded-[var(--nn-radius-medium)] border border-nn-border-default bg-nn-surface-interactive px-5 text-sm font-semibold text-nn-text-secondary opacity-75"
                    type="button"
                    disabled
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p id="weekly-actions-note" className="sr-only">These actions are shown for prototype review only and are not active.</p>
            </section>
          )}

          {hasSection(screen, 'SIGNATURE') && (
            <footer className="px-5 py-8 sm:px-10 sm:py-10">
              <p className="max-w-xl text-lg leading-7 text-nn-text-primary">{screen.signature.text}</p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-nn-text-muted">
                {model.share.identity} <span aria-hidden="true" className="px-1 text-nn-accent-supporting">·</span> {model.share.site}
              </p>
            </footer>
          )}
        </div>
      </article>
    </div>
  );
}
