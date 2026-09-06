import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement
} from 'react';
import type {
  WeeklyReadingModel,
  WeeklyReadingScreenProjection,
  WeeklyReadingScreenSection,
  WeeklyReadingTimingCategory
} from './weekly-reading-model.js';
import type { WeeklyPocScenarioId } from './weekly-interpretation-poc.js';
import type { WeeklyReadingR2Scenario } from './weekly-reading-prototype-r2.js';

export interface WeeklyReadingPrototypeR2Props {
  readonly scenarios: readonly WeeklyReadingR2Scenario[];
  readonly initialScenarioId?: WeeklyPocScenarioId;
}

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
  if (category === 'MOMENTARY') return 'Short active window';
  return 'Core window';
}

function hasSection(
  screen: WeeklyReadingScreenProjection,
  section: WeeklyReadingScreenSection
): boolean {
  return screen.readingOrder.includes(section);
}

function initialScenarioFromUrl(
  scenarios: readonly WeeklyReadingR2Scenario[]
): WeeklyPocScenarioId | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('scenario');
  return scenarios.some((scenario) => scenario.id === requested)
    ? requested as WeeklyPocScenarioId
    : null;
}

function disclosureSummary(label: string, kicker: string): ReactElement {
  return (
    <summary className="weekly-r2__disclosure-summary">
      <span className="weekly-r2__disclosure-copy">
        <span className="weekly-r2__section-kicker">{kicker}</span>
        <span className="weekly-r2__disclosure-label">{label}</span>
      </span>
      <span aria-hidden="true" className="weekly-r2__disclosure-icon">+</span>
    </summary>
  );
}

function CelestialFrame(): ReactElement {
  return (
    <div
      aria-hidden="true"
      className="weekly-r2__celestial-frame"
      data-celestial-layer="B1"
    >
      <svg
        className="weekly-r2__celestial-svg"
        focusable="false"
        viewBox="0 0 440 360"
      >
        <ellipse
          className="weekly-r2__orbit weekly-r2__orbit--primary"
          cx="220"
          cy="180"
          rx="184"
          ry="72"
          transform="rotate(18 220 180)"
        />
        <ellipse
          className="weekly-r2__orbit weekly-r2__orbit--secondary"
          cx="220"
          cy="180"
          rx="154"
          ry="58"
          transform="rotate(-38 220 180)"
        />
        <circle
          className="weekly-r2__brand-outline"
          cx="220"
          cy="180"
          r="48"
        />
        <path
          className="weekly-r2__brand-line"
          d="M191 222V138l58 84v-84"
        />
        <circle className="weekly-r2__brand-node" cx="191" cy="138" r="4" />
        <circle className="weekly-r2__brand-node" cx="249" cy="222" r="4" />
        <circle className="weekly-r2__orbit-node weekly-r2__orbit-node--one" cx="72" cy="206" r="3" />
        <circle className="weekly-r2__orbit-node weekly-r2__orbit-node--two" cx="367" cy="146" r="3" />
      </svg>
    </div>
  );
}

export default function WeeklyReadingPrototypeR2({
  scenarios,
  initialScenarioId
}: WeeklyReadingPrototypeR2Props): ReactElement | null {
  const firstScenario = scenarios[0];
  const [selectedScenarioId, setSelectedScenarioId] = useState<WeeklyPocScenarioId | undefined>(
    initialScenarioId ?? firstScenario?.id
  );

  useEffect(() => {
    const urlScenario = initialScenarioFromUrl(scenarios);
    if (urlScenario !== null) setSelectedScenarioId(urlScenario);
  }, [scenarios]);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? firstScenario,
    [firstScenario, scenarios, selectedScenarioId]
  );

  if (selectedScenario === undefined) return null;

  const model = selectedScenario.model;
  const screen = model.screen;
  const periodRange = formatPeriodRange(model);
  const timingCue = screen.hero.timingCue;
  const availableActions = screen.actions.filter(
    (action) => action.status === 'AVAILABLE' && action.kind !== 'COLLECT'
  );

  const selectScenario = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextScenario = scenarios.find((scenario) => scenario.id === event.currentTarget.value);
    if (nextScenario === undefined) return;
    setSelectedScenarioId(nextScenario.id);
  };

  return (
    <div
      className="weekly-r2"
      data-weekly-r2
      data-weekly-r2-scenario={selectedScenario.id}
    >
      <header className="weekly-r2__harness" data-weekly-r2-harness>
        <div className="weekly-r2__harness-intro">
          <p className="weekly-r2__harness-kicker">Development only</p>
          <p className="weekly-r2__harness-title">Weekly Sky Portrait · R2 visual study</p>
        </div>
        <label className="weekly-r2__scenario-label">
          <span>Scenario</span>
          <select
            className="weekly-r2__scenario-select"
            data-weekly-r2-scenario-switcher
            value={selectedScenario.id}
            onChange={selectScenario}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.label}</option>
            ))}
          </select>
        </label>
        <p className="weekly-r2__harness-note">
          One editorial presentation; choose a scenario to inspect the model-owned reading.
        </p>
      </header>

      <article
        aria-labelledby="weekly-r2-title"
        className="weekly-r2__reading"
        data-weekly-r2-reading
      >
        <section className="weekly-r2__hero" data-weekly-r2-depth="notice">
          <div className="weekly-r2__hero-copy">
            <p className="weekly-r2__hero-identity">Weekly astrology reading</p>
            <div className="weekly-r2__period-row">
              <p className="weekly-r2__hero-kicker">{model.period.label}</p>
              <p className="weekly-r2__period">{periodRange}</p>
            </div>
            <h1 id="weekly-r2-title" className="weekly-r2__hero-title">{screen.hero.text}</h1>

            {timingCue !== null && (
              <div className="weekly-r2__timing-cue" data-weekly-r2-hero-timing>
                <p className="weekly-r2__section-kicker">In focus</p>
                <p className="weekly-r2__timing-label">{timingCue.label}</p>
                <p className="weekly-r2__timing-meaning">{timingCue.meaning}</p>
              </div>
            )}
          </div>
          <CelestialFrame />
        </section>

        <div className="weekly-r2__body">
          {hasSection(screen, 'AT_A_GLANCE') && screen.atAGlance.length > 0 && (
            <section
              aria-labelledby="weekly-r2-at-a-glance-title"
              className="weekly-r2__section weekly-r2__section--overview"
              data-weekly-r2-depth="use"
            >
              <div className="weekly-r2__section-heading">
                <p className="weekly-r2__section-kicker">At a glance</p>
                <h2 id="weekly-r2-at-a-glance-title">What to carry</h2>
              </div>
              <ol className="weekly-r2__theme-list">
                {screen.atAGlance.map((theme, index) => (
                  <li key={theme.id} className="weekly-r2__theme">
                    <span aria-hidden="true" className="weekly-r2__theme-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="weekly-r2__theme-copy">
                      <h3>{theme.label}</h3>
                      <p>{theme.meaning}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {hasSection(screen, 'DOMAINS') && screen.domains.length > 0 && (
            <section
              aria-labelledby="weekly-r2-domains-title"
              className="weekly-r2__section"
              data-weekly-r2-depth="explore"
            >
              <div className="weekly-r2__section-heading">
                <p className="weekly-r2__section-kicker">In your life</p>
                <h2 id="weekly-r2-domains-title">Where it may show up</h2>
              </div>
              <div className="weekly-r2__domain-list">
                {screen.domains.map((domain) => (
                  <details
                    key={domain.id}
                    className="weekly-r2__domain"
                    data-weekly-r2-domain={domain.id}
                  >
                    <summary className="weekly-r2__domain-summary">
                      <span>{domain.label}</span>
                      <span aria-hidden="true" className="weekly-r2__domain-action">Explore</span>
                    </summary>
                    <div className="weekly-r2__domain-copy">
                      <p>{domain.meaning}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {hasSection(screen, 'TIMELINE') && screen.timeline !== null && (
            <section
              aria-labelledby="weekly-r2-timeline-title"
              className="weekly-r2__section weekly-r2__section--timeline"
              data-weekly-r2-depth="explore"
            >
              <div className="weekly-r2__section-heading weekly-r2__section-heading--timeline">
                <div>
                  <p className="weekly-r2__section-kicker">Timeline</p>
                  <h2 id="weekly-r2-timeline-title">When it matters</h2>
                </div>
                <p className="weekly-r2__section-note">
                  Background sets the tone; shorter windows show where attention narrows.
                </p>
              </div>
              <ol className="weekly-r2__timeline" data-weekly-r2-timeline>
                {screen.timeline.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="weekly-r2__timeline-entry"
                    data-timing-category={entry.category}
                  >
                    <span aria-hidden="true" className="weekly-r2__timeline-marker" />
                    <div className="weekly-r2__timeline-copy">
                      <div className="weekly-r2__timeline-meta">
                        <p className="weekly-r2__timeline-label">{entry.label}</p>
                        <p className="weekly-r2__timeline-category">{timingRoleLabel(entry.category)}</p>
                        {entry.emphasis === 'BEST_WINDOW' && (
                          <p className="weekly-r2__timeline-emphasis">Best window</p>
                        )}
                      </div>
                      <p className="weekly-r2__timeline-meaning">{entry.meaning}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {hasSection(screen, 'WATCH_OUT') && screen.watchOut !== null && (
            <aside
              aria-labelledby="weekly-r2-watch-out-title"
              className="weekly-r2__watch-out"
              data-weekly-r2-depth="explore"
            >
              <div>
                <p className="weekly-r2__section-kicker">A gentle note</p>
                <h2 id="weekly-r2-watch-out-title">Watch out</h2>
              </div>
              <p>{screen.watchOut.text}</p>
            </aside>
          )}

          {hasSection(screen, 'WHY') && (
            <section className="weekly-r2__disclosure-section" data-weekly-r2-depth="understand">
              <details
                id="weekly-r2-why-disclosure"
                data-weekly-r2-disclosure="why"
              >
                {disclosureSummary('Why this week?', 'Understand')}
                <div className="weekly-r2__disclosure-content">
                  <p>{screen.why.text}</p>
                </div>
              </details>
            </section>
          )}

          {model.disclosures.map((disclosure) => (
            <section
              key={disclosure.kind}
              className="weekly-r2__disclosure-section"
              data-weekly-r2-depth="understand"
              data-weekly-r2-unknown-time={disclosure.kind === 'UNKNOWN_BIRTH_TIME' ? 'true' : undefined}
            >
              <details data-weekly-r2-disclosure="authority">
                {disclosureSummary('About this reading', 'Context')}
                <div className="weekly-r2__disclosure-content">
                  <p>{disclosure.text}</p>
                </div>
              </details>
            </section>
          ))}

          {hasSection(screen, 'ASTROLOGER_VIEW') &&
            screen.astrologerView.available &&
            screen.astrologerView.text !== null && (
              <section className="weekly-r2__disclosure-section" data-weekly-r2-depth="go-deeper">
                <details
                  id="weekly-r2-astrologer-disclosure"
                  data-weekly-r2-disclosure="astrologer"
                >
                  {disclosureSummary("Astrologer's View", 'Go deeper')}
                  <div className="weekly-r2__disclosure-content">
                    <p>{screen.astrologerView.text}</p>
                  </div>
                </details>
              </section>
            )}

          {hasSection(screen, 'ACTIONS') && (
            <section
              aria-labelledby="weekly-r2-actions-title"
              className="weekly-r2__section weekly-r2__section--actions"
              data-weekly-r2-depth="go-deeper"
            >
              <div className="weekly-r2__section-heading">
                <p className="weekly-r2__section-kicker">After the reading</p>
                <h2 id="weekly-r2-actions-title">Keep this reading</h2>
              </div>
              <div className="weekly-r2__actions" role="group" aria-describedby="weekly-r2-actions-note">
                {availableActions.map((action) => (
                  <button
                    key={action.kind}
                    className="weekly-r2__action"
                    data-weekly-r2-action={action.kind}
                    disabled
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p id="weekly-r2-actions-note" className="weekly-r2__sr-only">
                These actions are shown for prototype review only and are not active.
              </p>
            </section>
          )}

          {hasSection(screen, 'SIGNATURE') && (
            <footer className="weekly-r2__signature">
              <p>{screen.signature.text}</p>
              <p className="weekly-r2__signature-meta">
                {model.share.identity}
                <span aria-hidden="true">·</span>
                {model.share.site}
              </p>
            </footer>
          )}
        </div>
      </article>
    </div>
  );
}
