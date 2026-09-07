import { useEffect, useState, type ReactElement } from 'react';
import { getLocalizedPath } from '../../lib/localization.js';
import type { AspectSignalPolicyRuleRecord } from '../interpretation/shared-root-relational-synthesis-poc.js';
import type { CompositionSignalPolicyRuleRecord } from '../interpretation/composition-signal-personal-synthesis-poc.js';
import type {
  MyChartRelationalProjection,
  MyChartRelationalReaderTheme,
  MyChartRelationalScenario
} from './my-chart-relational-content-poc.js';
import {
  MY_CHART_RELATIONAL_SCENARIOS,
  projectMyChartRelationalContent
} from './my-chart-relational-content-poc.js';

export interface MyChartRelationalPocProps {
  readonly initialScenario?: MyChartRelationalScenario;
  readonly placementRules: readonly CompositionSignalPolicyRuleRecord[];
  readonly aspectRules: readonly AspectSignalPolicyRuleRecord[];
}

function scenarioFromUrl(): MyChartRelationalScenario | null {
  if (typeof window === 'undefined') return null;

  const requested = new URLSearchParams(window.location.search).get('scenario');
  if (requested === 'relational-known-time' || requested === 'default') {
    return 'relational-known-time';
  }
  if (requested === 'placement-only') return 'placement-only';
  if (requested === 'unknown-time') return 'unknown-time';
  return null;
}

function LearnBridge({
  theme
}: {
  readonly theme: MyChartRelationalReaderTheme;
}): ReactElement {
  return (
    <section className="my-chart-contextual-learn__theme-learn" data-theme-learn>
      <p className="my-chart-contextual-learn__section-kicker">Learn next</p>
      <h4>Put the pattern in context</h4>
      <p className="my-chart-contextual-learn__theme-copy">
        The reading comes first. These lessons open the astrology behind it
        without interrupting the personal thread.
      </p>
      <div className="my-chart-contextual-learn__learn-links">
        {theme.learn.map((bridge) => {
          const learnHref = bridge.slug === null || bridge.contentAvailability !== 'AVAILABLE'
            ? null
            : getLocalizedPath('en', `/learn/foundations/${bridge.slug}/`);

          return learnHref === null ? (
            <span
              className="my-chart-contextual-learn__learn-link my-chart-contextual-learn__learn-link--unavailable"
              key={bridge.objectId}
            >
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
  readonly projection: MyChartRelationalProjection;
  readonly theme: MyChartRelationalReaderTheme;
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
                  <li key={evidence}><strong>{evidence}</strong></li>
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
              <dt>Classification</dt>
              <dd>{theme.technical.classification}</dd>
            </div>
            <div>
              <dt>Source placement Signals</dt>
              <dd>{theme.technical.sourcePlacementSignalIds.join(' · ') || 'None'}</dd>
            </div>
            <div>
              <dt>Source Aspect Signal</dt>
              <dd>{theme.technical.sourceAspectSignalId ?? 'None'}</dd>
            </div>
            <div>
              <dt>Semantic units</dt>
              <dd>{theme.technical.semanticUnitCount} · {theme.technical.sourceSemanticUnitIds.join(' · ')}</dd>
            </div>
            <div>
              <dt>Unique roots</dt>
              <dd>{theme.technical.uniqueRootCount} · {theme.technical.uniqueRootKeys.join(' · ')}</dd>
            </div>
            <div>
              <dt>Compatibility rule</dt>
              <dd>{theme.technical.compatibilityRule ?? 'None'}</dd>
            </div>
            <div>
              <dt>Subsumed source themes</dt>
              <dd>{theme.technical.subsumedThemeIds.join(' · ') || 'None'}</dd>
            </div>
            <div>
              <dt>Direction / intensity / confidence</dt>
              <dd>{theme.technical.direction} · {theme.technical.intensity} · {theme.technical.confidence}</dd>
            </div>
            <div>
              <dt>Authority state</dt>
              <dd>{theme.technical.authorityState}</dd>
            </div>
            <div>
              <dt>Birth-time state</dt>
              <dd>{theme.technical.birthTimeState}</dd>
            </div>
            <div>
              <dt>Orb boundary</dt>
              <dd>{theme.technical.orbBoundary}</dd>
            </div>
            <div>
              <dt>Placement provenance</dt>
              <dd>{theme.technical.placementProvenance.join(' · ') || 'None'}</dd>
            </div>
            <div>
              <dt>Aspect provenance</dt>
              <dd>{theme.technical.aspectProvenance.join(' · ') || 'None'}</dd>
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
  readonly projection: MyChartRelationalProjection;
  readonly theme: MyChartRelationalReaderTheme;
}): ReactElement {
  return (
    <article
      className="my-chart-contextual-learn__theme-card"
      data-personal-theme
      data-relational-enriched-theme={theme.technical.classification === 'RELATIONAL_ENRICHMENT' ? 'true' : 'false'}
    >
      <header className="my-chart-contextual-learn__theme-header">
        <div>
          <p className="my-chart-contextual-learn__section-kicker">{theme.domain}</p>
          <h3>{theme.title}</h3>
          <div className="my-chart-contextual-learn__theme-chart-evidence">
            <p className="my-chart-contextual-learn__section-kicker">Your chart</p>
            <ul aria-label="Chart factors">
              {theme.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
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
          <h4>Constructive capacity</h4>
          <p>{theme.constructiveCapacity}</p>
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
          <h4>Useful lever</h4>
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
  readonly projection: MyChartRelationalProjection;
}): ReactElement {
  const technical = projection.technical;
  return (
    <details className="my-chart-contextual-learn__technical" data-my-chart-technical data-relational-technical>
      <summary>
        <span>
          <span className="my-chart-contextual-learn__section-kicker">Technical boundary</span>
          <span className="my-chart-contextual-learn__summary-label">Inspect the development result</span>
        </span>
        <span aria-hidden="true" className="my-chart-contextual-learn__summary-mark">+</span>
      </summary>
      <div className="my-chart-contextual-learn__technical-body">
        <dl>
          <div className="my-chart-contextual-learn__technical-row"><dt>Fixture</dt><dd>{projection.fixture.scenarioId}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Classification</dt><dd>{technical.classification}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Semantic units</dt><dd>{technical.semanticUnitCount} · {technical.sourceSemanticUnitIds.join(' · ')}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Unique roots</dt><dd>{technical.uniqueRootCount} · {technical.uniqueRootKeys.join(' · ')}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Placement Signal IDs</dt><dd>{technical.sourcePlacementSignalIds.join(' · ')}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Aspect Signal ID</dt><dd>{technical.sourceAspectSignalId ?? 'None'}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Compatibility rule</dt><dd>{technical.compatibilityRule ?? 'None'}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Subsumed source themes</dt><dd>{technical.subsumedThemeIds.join(' · ') || 'None'}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Birth-time state</dt><dd>{technical.birthTimeState}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Source authority</dt><dd>{technical.sourceAuthority}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Synthesis authority</dt><dd>{technical.synthesisAuthority}</dd></div>
          <div className="my-chart-contextual-learn__technical-row"><dt>Semantic basis status</dt><dd>{technical.semanticBasisStatus}</dd></div>
        </dl>
        <p className="my-chart-contextual-learn__technical-note">
          This is a development reading POC. It does not promote research
          Signals to production personal astrology or change Engine authority.
        </p>
      </div>
    </details>
  );
}

export default function MyChartRelationalPoc({
  initialScenario = 'relational-known-time',
  placementRules,
  aspectRules
}: MyChartRelationalPocProps): ReactElement {
  const [scenario, setScenario] = useState<MyChartRelationalScenario>(
    () => scenarioFromUrl() ?? initialScenario
  );

  useEffect(() => {
    const requested = scenarioFromUrl();
    if (requested !== null) setScenario(requested);
  }, []);

  const projection = projectMyChartRelationalContent(scenario, placementRules, aspectRules);

  return (
    <div
      className="my-chart-contextual-learn"
      data-my-chart-relational="reader-experience-poc"
      data-my-chart-scenario={scenario}
      data-my-chart-authority={projection.authority}
      data-my-chart-classification={projection.technical.classification}
    >
      <header className="my-chart-contextual-learn__harness">
        <div>
          <p className="my-chart-contextual-learn__harness-kicker">{projection.developmentDisclosure.label}</p>
          <p className="my-chart-contextual-learn__harness-title">{projection.reading.harnessTitle}</p>
        </div>
        <label className="my-chart-contextual-learn__scenario-label">
          <span>Reading fixture</span>
          <select
            data-my-chart-scenario-switcher
            value={scenario}
            onChange={(event) => setScenario(event.currentTarget.value as MyChartRelationalScenario)}
          >
            <option value="relational-known-time">Relationally enriched</option>
            <option value="placement-only">Placement only</option>
            <option value="unknown-time">Unknown time</option>
          </select>
        </label>
        <p className="my-chart-contextual-learn__harness-note">
          {projection.developmentDisclosure.evidence}. {projection.reading.harnessNote}
        </p>
      </header>

      <article aria-labelledby="my-chart-relational-title" className="my-chart-contextual-learn__surface">
        <nav aria-label="Personal reading sequence" className="my-chart-contextual-learn__sequence">
          {['READING', 'THEME', 'WHY', 'LEARN'].map((step, index) => (
            <span key={step}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {step}</span>
          ))}
        </nav>

        <header className="my-chart-contextual-learn__hero">
          <p className="my-chart-contextual-learn__eyebrow">Your chart in context</p>
          <h1 id="my-chart-relational-title">My Chart</h1>
          <p className="my-chart-contextual-learn__hero-title">{projection.reading.hook}</p>
          <p className="my-chart-contextual-learn__hero-copy">{projection.reading.introduction}</p>
        </header>

        {projection.unknownTime.message !== null ? (
          <aside className="my-chart-contextual-learn__unknown-time" data-unknown-time-presentation="true">
            <p className="my-chart-contextual-learn__section-kicker">Unknown-time reading</p>
            <p>{projection.unknownTime.message}</p>
          </aside>
        ) : null}

        <section aria-labelledby="my-chart-relational-reading-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--reading">
          <p className="my-chart-contextual-learn__section-kicker">{projection.reading.sectionKicker}</p>
          <h2 id="my-chart-relational-reading-title">{projection.reading.sectionTitle}</h2>
          <p className="my-chart-contextual-learn__body-copy">{projection.reading.sectionBody}</p>
          <div className="my-chart-contextual-learn__themes" data-core-personal-themes>
            {projection.reading.themes.map((theme) => (
              <ThemeCard key={theme.themeId} projection={projection} theme={theme} />
            ))}
          </div>
        </section>

        <section aria-labelledby="my-chart-relational-technical-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--technical">
          <h2 className="my-chart-contextual-learn__sr-only" id="my-chart-relational-technical-title">Technical inspection</h2>
          <TechnicalInspection projection={projection} />
        </section>
      </article>
    </div>
  );
}

export { MY_CHART_RELATIONAL_SCENARIOS };
