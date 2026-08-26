import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  createDeterministicInterpretation,
  type InterpretationItem
} from './deterministic-interpretation';
import type { ChartPresentationPolicy } from '@/features/chart-workspace/chart-presentation-policy';

export type InterpretationPanelProps = {
  chart: ChartResult;
  presentationPolicy: ChartPresentationPolicy;
};

type InterpretationSectionProps = {
  items: InterpretationItem[];
  title: string;
  titleId: string;
};

function InterpretationSection({
  items,
  title,
  titleId
}: InterpretationSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={titleId} className="mt-6 first:mt-5">
      <h4 className="nn-type-label uppercase tracking-[0.12em]" id={titleId}>
        {title}
      </h4>
      <div className="mt-3 grid min-w-0 gap-3">
        {items.map((item) => (
          <article
            className="nn-surface min-w-0 p-4"
            key={item.id}
          >
            <h5 className="nn-type-card-title">{item.title}</h5>
            <p className="nn-type-body-small mt-2">{item.text}</p>
            <p className="nn-type-metadata mt-3 break-words">
              <span className="font-semibold">Source fact</span>{' '}
              <span className="font-mono">{item.sourceContext ?? item.sourceFacts.join(' · ')}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function InterpretationPanel({ chart, presentationPolicy }: InterpretationPanelProps) {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const bigThreeTitleId = `${panelId}-big-three-title`;
  const planetsInSignsTitleId = `${panelId}-planets-in-signs-title`;
  const interpretation = createDeterministicInterpretation(chart, presentationPolicy);
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';
  const bigThreeTitle = presentationPolicy.showAngles ? 'Big Three' : 'Core placements';

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-7"
    >
      <p className="nn-eyebrow">Confirmed facts</p>
      <h3 className="nn-type-section-title mt-2" id={titleId}>
        Interpretation
      </h3>
      {isResearchConfiguration ? (
        <p
          className="nn-notice nn-notice--research mt-3"
          role="note"
        >
          Research configuration: deterministic UI-development copy based only on available Engine facts.
        </p>
      ) : null}

      <InterpretationSection
        items={interpretation.bigThree}
        title={bigThreeTitle}
        titleId={bigThreeTitleId}
      />
      <InterpretationSection
        items={interpretation.planetsInSigns}
        title="Planets in Signs"
        titleId={planetsInSignsTitleId}
      />
      <InterpretationSection
        items={interpretation.planetsInHouses}
        title="Planets in Houses"
        titleId={`${panelId}-planets-in-houses-title`}
      />
      <InterpretationSection
        items={interpretation.majorAspects}
        title="Major Aspects"
        titleId={`${panelId}-major-aspects-title`}
      />
    </section>
  );
}
