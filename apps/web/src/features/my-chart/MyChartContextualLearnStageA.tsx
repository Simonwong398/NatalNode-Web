import { useEffect, useState, type ReactElement } from 'react';
import { getLocalizedPath } from '../../lib/localization.js';
import {
  projectMyChartPersonalContent,
  type MyChartPersonalContentProjection,
  type MyChartPersonalContentScenario,
  type MyChartPersonalContentTheme
} from './my-chart-personal-content-poc.js';

export interface MyChartContextualLearnStageAProps {
  readonly initialScenario?: MyChartPersonalContentScenario;
}

function scenarioFromUrl(): MyChartPersonalContentScenario | null {
  if (typeof window === 'undefined') return null;

  const requested = new URLSearchParams(window.location.search).get('scenario');
  if (requested === 'unknown-time') return 'unknown-time';
  if (requested === 'known-time' || requested === 'default') return 'known-time';
  return null;
}

function LearnBridge({
  theme
}: {
  readonly theme: MyChartPersonalContentTheme;
}): ReactElement {
  return (
    <section className="my-chart-contextual-learn__theme-learn" data-theme-learn>
      <p className="my-chart-contextual-learn__section-kicker">Learn next</p>
      <h4>Put the concept in context</h4>
      <p className="my-chart-contextual-learn__theme-copy">
        The reading comes first. These lessons open the astrology behind it
        without asking you to leave the personal thread.
      </p>
      <div className="my-chart-contextual-learn__learn-links">
        {theme.learn.map((bridge) => {
          const learnHref = bridge.slug === null || bridge.contentAvailability !== 'AVAILABLE'
            ? null
            : getLocalizedPath('en', `/learn/foundations/${bridge.slug}/`);

          return learnHref === null ? (
            <span className="my-chart-contextual-learn__learn-link my-chart-contextual-learn__learn-link--unavailable" key={bridge.objectId}>
              {bridge.label}
            </span>
          ) : (
            <a className="my-chart-contextual-learn__learn-link" href={learnHref} key={bridge.objectId}>
              <span>{bridge.title ?? bridge.label}</span>
              <span aria-hidden="true">→</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function WhyThisShowsUp({
  projection,
  theme
}: {
  readonly projection: MyChartPersonalContentProjection;
  readonly theme: MyChartPersonalContentTheme;
}): ReactElement {
  return (
    <details className="my-chart-contextual-learn__theme-details" data-theme-why>
      <summary>
        <span>
          <span className="my-chart-contextual-learn__section-kicker">Why this shows up</span>
          <span className="my-chart-contextual-learn__summary-label">See the astrology behind it</span>
        </span>
        <span aria-hidden="true" className="my-chart-contextual-learn__summary-mark">+</span>
      </summary>
      <div className="my-chart-contextual-learn__theme-details-body">
        <p className="my-chart-contextual-learn__theme-copy">{theme.why.summary}</p>

        <dl className="my-chart-contextual-learn__why-grid">
          <div>
            <dt>Your chart</dt>
            <dd>
              <ul className="my-chart-contextual-learn__why-factors">
                {theme.evidence.map((evidence) => (
                  <li key={`${evidence.factKind}|${evidence.canonicalPath}`}>
                    <strong>{evidence.label}</strong>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>What each factor brings</dt>
            <dd>
              <ul className="my-chart-contextual-learn__why-factors">
                {theme.why.factors.map((factor) => (
                  <li key={factor.label}>
                    <strong>{factor.label}</strong>
                    <span>{factor.contribution}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Why they matter together</dt>
            <dd>{theme.why.synthesis}</dd>
          </div>
        </dl>

        <LearnBridge theme={theme} />

        <details className="my-chart-contextual-learn__theme-technical" data-theme-technical>
          <summary>Astrologer's view</summary>
          <dl>
            <div>
              <dt>Evidence convergence</dt>
              <dd>{theme.technical.convergence}</dd>
            </div>
            <div>
              <dt>Direction retained</dt>
              <dd>{theme.technical.tension}</dd>
            </div>
            <div>
              <dt>Birth-time boundary</dt>
              <dd>{theme.technical.birthTime}</dd>
            </div>
            <div>
              <dt>Selection trace</dt>
              <dd>{theme.technical.selection}</dd>
            </div>
            <div>
              <dt>Source fact references</dt>
              <dd>{theme.technical.sourceFactRefs.join(' · ')}</dd>
            </div>
            <div>
              <dt>Semantic basis</dt>
              <dd>{theme.technical.semanticBasisIds.join(' · ')}</dd>
            </div>
            <div>
              <dt>Composition rules</dt>
              <dd>{theme.technical.compositionRuleRefs.join(' · ')}</dd>
            </div>
            <div>
              <dt>Suppressed alternatives</dt>
              <dd>{theme.technical.suppressedThemeKeys.join(' · ') || 'None'}</dd>
            </div>
            <div>
              <dt>Presentation authority</dt>
              <dd>{projection.authority}</dd>
            </div>
          </dl>
        </details>
      </div>
    </details>
  );
}

function ThemeCard({
  projection,
  theme
}: {
  readonly projection: MyChartPersonalContentProjection;
  readonly theme: MyChartPersonalContentTheme;
}): ReactElement {
  return (
    <article className="my-chart-contextual-learn__theme-card" data-personal-theme>
      <header className="my-chart-contextual-learn__theme-header">
        <div>
          <p className="my-chart-contextual-learn__section-kicker">{theme.domain}</p>
          <h3>{theme.title}</h3>
          <div className="my-chart-contextual-learn__theme-chart-evidence">
            <p className="my-chart-contextual-learn__section-kicker">Your chart</p>
            <ul aria-label="Chart factors">
              {theme.evidence.map((evidence) => (
                <li key={`${evidence.factKind}|${evidence.canonicalPath}`}>{evidence.label}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="my-chart-contextual-learn__theme-direction">{theme.directionLabel}</p>
      </header>

      <div className="my-chart-contextual-learn__theme-reading">
        <div>
          <h4>Recognition</h4>
          <p>{theme.recognition}</p>
        </div>
        <div>
          <h4>Strength</h4>
          <p>{theme.strength}</p>
        </div>
        <div>
          <h4>Pattern</h4>
          <p>{theme.pattern}</p>
        </div>
        <div className="my-chart-contextual-learn__theme-tradeoff">
          <h4>Tension</h4>
          <p>{theme.tension}</p>
        </div>
        <div className="my-chart-contextual-learn__theme-lever">
          <h4>Lever</h4>
          <p>{theme.lever}</p>
        </div>
      </div>

      <WhyThisShowsUp projection={projection} theme={theme} />
    </article>
  );
}

function TechnicalInspection({
  projection
}: {
  readonly projection: MyChartPersonalContentProjection;
}): ReactElement {
  const technical = projection.technical;

  return (
    <details className="my-chart-contextual-learn__technical" data-my-chart-technical>
      <summary>
        <span>
          <span className="my-chart-contextual-learn__section-kicker">Technical boundary</span>
          <span className="my-chart-contextual-learn__summary-label">Inspect the development result</span>
        </span>
        <span aria-hidden="true" className="my-chart-contextual-learn__summary-mark">+</span>
      </summary>
      <div className="my-chart-contextual-learn__technical-body">
        <dl>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Fixture</dt>
            <dd>{projection.fixture.scenarioId}</dd>
          </div>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Birth-time authority</dt>
            <dd>{projection.fixture.birthTimeAuthority}</dd>
          </div>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Signals evaluated</dt>
            <dd>{technical.evaluatedSignalCount}</dd>
          </div>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Candidate merges</dt>
            <dd>{technical.mergedCandidateCount}</dd>
          </div>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Redundant candidates suppressed</dt>
            <dd>{technical.suppressedCandidateCount}</dd>
          </div>
          <div className="my-chart-contextual-learn__technical-row">
            <dt>Semantic basis status</dt>
            <dd>{technical.semanticBasisStatus}</dd>
          </div>
        </dl>
        <p className="my-chart-contextual-learn__technical-note">
          This page is a development reading POC. It does not promote fixture
          content to production personal astrology or change Engine authority.
        </p>
      </div>
    </details>
  );
}

export default function MyChartContextualLearnStageA({
  initialScenario = 'known-time'
}: MyChartContextualLearnStageAProps): ReactElement {
  const [scenario, setScenario] = useState<MyChartPersonalContentScenario>(initialScenario);

  useEffect(() => {
    const requested = scenarioFromUrl();
    if (requested !== null) setScenario(requested);
  }, []);

  const projection = projectMyChartPersonalContent(scenario);

  return (
    <div
      className="my-chart-contextual-learn"
      data-my-chart-contextual-learn="personal-content-poc"
      data-my-chart-scenario={scenario}
      data-my-chart-authority={projection.authority}
    >
      <header className="my-chart-contextual-learn__harness">
        <div>
          <p className="my-chart-contextual-learn__harness-kicker">{projection.developmentDisclosure.label}</p>
          <p className="my-chart-contextual-learn__harness-title">My Chart · Personal Reading POC</p>
        </div>
        <label className="my-chart-contextual-learn__scenario-label">
          <span>Reading fixture</span>
          <select
            data-my-chart-scenario-switcher
            value={scenario}
            onChange={(event) => setScenario(event.currentTarget.value as MyChartPersonalContentScenario)}
          >
            <option value="known-time">Known-time personal reading</option>
            <option value="unknown-time">Unknown-time personal reading</option>
          </select>
        </label>
        <p className="my-chart-contextual-learn__harness-note">
          {projection.developmentDisclosure.evidence}. The reading uses selected
          Personal Synthesis themes rather than a primitive fact dump.
        </p>
      </header>

      <article aria-labelledby="my-chart-contextual-learn-title" className="my-chart-contextual-learn__surface">
        <nav aria-label="Personal reading sequence" className="my-chart-contextual-learn__sequence">
          {['READING', 'THEMES', 'WHY', 'LEARN'].map((step, index) => (
            <span key={step}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {step}
            </span>
          ))}
        </nav>

        <header className="my-chart-contextual-learn__hero">
          <p className="my-chart-contextual-learn__eyebrow">Development personal reading</p>
          <h1 id="my-chart-contextual-learn-title">My Chart</h1>
          <p className="my-chart-contextual-learn__hero-title">{projection.reading.hook}</p>
          <p className="my-chart-contextual-learn__hero-copy">
            {projection.reading.introduction}
          </p>
        </header>

        {projection.unknownTime.message !== null ? (
          <aside className="my-chart-contextual-learn__unknown-time" data-unknown-time-presentation="true">
            <p className="my-chart-contextual-learn__section-kicker">Unknown-time reading</p>
            <p>{projection.unknownTime.message}</p>
          </aside>
        ) : null}

        <section aria-labelledby="my-chart-reading-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--reading">
          <p className="my-chart-contextual-learn__section-kicker">Core personal themes</p>
          <h2 id="my-chart-reading-title">What keeps showing up</h2>
          <p className="my-chart-contextual-learn__body-copy">
            These themes are the reading. Each one gives you a pattern to
            recognize, a strength to use, and a choice to notice in real life.
          </p>
          <div className="my-chart-contextual-learn__themes" data-core-personal-themes>
            {projection.reading.themes.map((theme) => (
              <ThemeCard key={theme.themeId} projection={projection} theme={theme} />
            ))}
          </div>
        </section>

        <section aria-labelledby="my-chart-technical-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--technical">
          <h2 className="my-chart-contextual-learn__sr-only" id="my-chart-technical-title">Technical inspection</h2>
          <TechnicalInspection projection={projection} />
        </section>

        <footer className="my-chart-contextual-learn__footer">
          <p className="my-chart-contextual-learn__section-kicker">Research boundary</p>
          <p>
            {projection.developmentDisclosure.evidence}. This route is isolated
            from production My Chart, Vault, BFF, Engine, and provider semantics.
          </p>
        </footer>
      </article>
    </div>
  );
}
