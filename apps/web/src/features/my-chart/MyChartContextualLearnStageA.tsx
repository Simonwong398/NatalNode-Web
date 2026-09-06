import { useEffect, useState, type ReactElement } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import { AstrologyGlyph } from '../../core/astrology-taxonomy/AstrologyGlyph.js';
import { getLocalizedPath } from '../../lib/localization.js';
import {
  MY_CHART_CONTEXTUAL_LEARN_SCENARIOS,
  projectMyChartEvidence,
  type MyChartContextualLearnScenario,
  type MyChartEvidenceProjection
} from './my-chart-evidence-projection.js';

export interface MyChartContextualLearnStageAProps {
  readonly chart: ChartResult;
  readonly initialScenario?: MyChartContextualLearnScenario;
}

const HOUSE_LABELS = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
] as const;

function scenarioFromUrl(): MyChartContextualLearnScenario | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('scenario');
  return MY_CHART_CONTEXTUAL_LEARN_SCENARIOS.includes(
    requested as MyChartContextualLearnScenario
  )
    ? requested as MyChartContextualLearnScenario
    : null;
}

function formatLongitude(longitude: number | null): string {
  return longitude === null ? 'Not supplied' : `${longitude}°`;
}

function formatHouse(house: number | null): string {
  return house !== null && house >= 1 && house <= 12
    ? `House ${HOUSE_LABELS[house - 1]}`
    : 'Not shown in this scenario';
}

function TechnicalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="my-chart-contextual-learn__technical-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EvidenceFact({ projection }: { projection: MyChartEvidenceProjection }) {
  const evidence = projection.primaryEvidence;

  if (evidence === null) {
    return (
      <p className="my-chart-contextual-learn__empty">
        No stable body × sign fact was supplied by this development result.
      </p>
    );
  }

  return (
    <div className="my-chart-contextual-learn__fact" data-my-chart-primary-evidence>
      <div className="my-chart-contextual-learn__fact-symbol" aria-hidden="true">
        <AstrologyGlyph kind="body" value={evidence.bodyId} />
        <span className="my-chart-contextual-learn__fact-symbol-divider">×</span>
        <AstrologyGlyph kind="sign" value={evidence.sign} />
      </div>
      <div className="my-chart-contextual-learn__fact-copy">
        <p className="my-chart-contextual-learn__fact-label">Sample placement</p>
        <p className="my-chart-contextual-learn__fact-value">
          <span aria-label={evidence.bodyLabel} role="img">
            {evidence.bodyGlyph ?? evidence.bodyLabel}
          </span>{' '}
          {evidence.bodyLabel} in{' '}
          <span aria-label={evidence.signLabel} role="img">
            {evidence.signGlyph ?? evidence.signLabel}
          </span>{' '}
          {evidence.signLabel}
        </p>
        <p className="my-chart-contextual-learn__fact-note">
          A supplied chart fact for study. It is not presented as a real personal result.
        </p>
      </div>
    </div>
  );
}

function TechnicalInspection({ projection }: { projection: MyChartEvidenceProjection }) {
  const technical = projection.technical;
  const houseValue = formatHouse(technical.house);
  const configurationValue = technical.astronomyConfigurationId ?? 'Unavailable — incomplete research';
  const provenanceValue = technical.provenanceEnvelopeId ?? 'Unavailable — incomplete research';

  return (
    <details className="my-chart-contextual-learn__technical" data-my-chart-technical>
      <summary>
        <span>
          <span className="my-chart-contextual-learn__section-kicker">Technical</span>
          <span className="my-chart-contextual-learn__summary-label">Inspect supplied values</span>
        </span>
        <span aria-hidden="true" className="my-chart-contextual-learn__summary-mark">+</span>
      </summary>
      <div className="my-chart-contextual-learn__technical-body">
        <dl>
          <TechnicalRow label="Body" value={technical.bodyId ?? 'Not supplied'} />
          <TechnicalRow label="Sign" value={technical.sign ?? 'Not supplied'} />
          <TechnicalRow label="Longitude" value={formatLongitude(technical.longitude)} />
          <TechnicalRow label="House" value={houseValue} />
          <TechnicalRow
            label="Motion"
            value={technical.retrograde === null
              ? 'Not supplied'
              : technical.retrograde ? 'Retrograde' : 'Direct'}
          />
          <TechnicalRow label="Calculation status" value={technical.calculationStatus} />
          <TechnicalRow label="Chart schema" value={technical.schemaVersion} />
          <TechnicalRow label="Development source" value={technical.engineVersion} />
          <TechnicalRow label="Astronomy configuration identity" value={configurationValue} />
          <TechnicalRow label="Provenance envelope" value={provenanceValue} />
          <TechnicalRow label="Per-fact identity" value="Not supplied — no pseudo-ID created" />
        </dl>
        {technical.housesOmitted || technical.anglesOmitted ? (
          <p className="my-chart-contextual-learn__technical-note">
            Houses, angles, and house-based context are omitted from this unknown-time
            presentation scenario. The current development mock does not propagate
            request-level unknown-time authority into ChartResult.
          </p>
        ) : null}
      </div>
    </details>
  );
}

export default function MyChartContextualLearnStageA({
  chart,
  initialScenario = 'default'
}: MyChartContextualLearnStageAProps): ReactElement {
  const [scenario, setScenario] = useState<MyChartContextualLearnScenario>(initialScenario);

  useEffect(() => {
    const requested = scenarioFromUrl();
    if (requested !== null) setScenario(requested);
  }, []);

  const projection = projectMyChartEvidence(chart, scenario);
  const learnHref = projection.learn.slug === null
    ? null
    : getLocalizedPath('en', `/learn/foundations/${projection.learn.slug}/`);

  return (
    <div
      className="my-chart-contextual-learn"
      data-my-chart-contextual-learn="stage-a"
      data-my-chart-scenario={scenario}
      data-my-chart-authority={projection.authority}
    >
      <header className="my-chart-contextual-learn__harness">
        <div>
          <p className="my-chart-contextual-learn__harness-kicker">{projection.developmentDisclosure.label}</p>
          <p className="my-chart-contextual-learn__harness-title">My Chart · Contextual Learn · Stage A</p>
        </div>
        <label className="my-chart-contextual-learn__scenario-label">
          <span>Presentation scenario</span>
          <select
            data-my-chart-scenario-switcher
            value={scenario}
            onChange={(event) => setScenario(event.currentTarget.value as MyChartContextualLearnScenario)}
          >
            <option value="default">Default sample</option>
            <option value="unknown-time">Unknown-time presentation</option>
          </select>
        </label>
        <p className="my-chart-contextual-learn__harness-note">
          {projection.developmentDisclosure.evidence}. This sibling preview is not a
          production personal chart and has no Provider authority.
        </p>
      </header>

      <article aria-labelledby="my-chart-contextual-learn-title" className="my-chart-contextual-learn__surface">
        <nav aria-label="Contextual learning sequence" className="my-chart-contextual-learn__sequence">
          {['FACT', 'MEANING', 'LEARN', 'TECHNICAL'].map((step, index) => (
            <span key={step}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {step}
            </span>
          ))}
        </nav>

        <header className="my-chart-contextual-learn__hero">
          <p className="my-chart-contextual-learn__eyebrow">Development sample chart</p>
          <h1 id="my-chart-contextual-learn-title">My Chart</h1>
          <p className="my-chart-contextual-learn__hero-title">Contextual learning from one supplied chart fact.</p>
          <p className="my-chart-contextual-learn__hero-copy">
            Start with a stable astrology anchor, then move through meaning, an admitted
            Foundations lesson, and the technical values behind the presentation.
          </p>
        </header>

        {projection.unknownTime.presentationStatus === 'UNKNOWN_TIME_PRESENTATION' ? (
          <aside className="my-chart-contextual-learn__unknown-time" data-unknown-time-presentation="true">
            <p className="my-chart-contextual-learn__section-kicker">Unknown-time presentation</p>
            <p>
              This research scenario keeps time-dependent facts out of the reading. It
              demonstrates presentation behavior only; request-level unknown-time runtime
              propagation is not available in the current mock boundary.
            </p>
          </aside>
        ) : null}

        <section aria-labelledby="my-chart-fact-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--fact">
          <p className="my-chart-contextual-learn__section-kicker">Chart fact</p>
          <h2 id="my-chart-fact-title">One supplied placement to study</h2>
          <EvidenceFact projection={projection} />
        </section>

        <section aria-labelledby="my-chart-meaning-title" className="my-chart-contextual-learn__section">
          <p className="my-chart-contextual-learn__section-kicker">Meaning</p>
          <h2 id="my-chart-meaning-title">What this combination is used to explore</h2>
          <p className="my-chart-contextual-learn__body-copy">{projection.meaning.text}</p>
          <p className="my-chart-contextual-learn__source-line">
            {projection.meaning.eligibility === 'BOUNDED_EXISTING_CONTENT'
              ? 'Bounded meaning · existing interpretation content'
              : 'Fact plus Learn · no admitted combined meaning'}
          </p>
        </section>

        <section aria-labelledby="my-chart-learn-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--learn">
          <p className="my-chart-contextual-learn__section-kicker">Learn the concept</p>
          <h2 id="my-chart-learn-title">Continue with Foundations</h2>
          <p className="my-chart-contextual-learn__body-copy">{projection.learn.description}</p>
          {learnHref !== null && projection.learn.contentAvailability === 'AVAILABLE' ? (
            <a className="my-chart-contextual-learn__learn-link" href={learnHref}>
              <span>{projection.learn.title}</span>
              <span aria-hidden="true">→</span>
            </a>
          ) : (
            <p className="my-chart-contextual-learn__source-line">No admitted lesson destination is available.</p>
          )}
          <p className="my-chart-contextual-learn__learn-note">
            The link teaches the concept; it does not turn this sample into a personal
            interpretation.
          </p>
        </section>

        <section aria-labelledby="my-chart-technical-title" className="my-chart-contextual-learn__section my-chart-contextual-learn__section--technical">
          <h2 className="my-chart-contextual-learn__sr-only" id="my-chart-technical-title">Technical inspection</h2>
          <TechnicalInspection projection={projection} />
        </section>

        <footer className="my-chart-contextual-learn__footer">
          <p className="my-chart-contextual-learn__section-kicker">Research boundary</p>
          <p>
            {projection.developmentDisclosure.evidence}. Configuration and provenance
            identities are unavailable, so this Stage A slice cannot assert production
            astronomy or a real personal chart.
          </p>
        </footer>
      </article>
    </div>
  );
}
