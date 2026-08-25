import { useId } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  createDeterministicInterpretation,
  type InterpretationItem
} from './deterministic-interpretation';

export type InterpretationPanelProps = {
  chart: ChartResult;
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
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-200" id={titleId}>
        {title}
      </h4>
      <div className="mt-3 grid min-w-0 gap-3">
        {items.map((item) => (
          <article
            className="min-w-0 rounded-lg border border-natal-border/70 bg-natal-night/30 p-4"
            key={item.id}
          >
            <h5 className="text-base font-semibold text-white">{item.title}</h5>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            <p className="mt-3 break-words text-xs leading-5 text-slate-400">
              <span className="font-semibold text-slate-300">Source fact</span>{' '}
              <span className="font-mono">{item.sourceContext ?? item.sourceFacts.join(' · ')}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function InterpretationPanel({ chart }: InterpretationPanelProps) {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const bigThreeTitleId = `${panelId}-big-three-title`;
  const planetsInSignsTitleId = `${panelId}-planets-in-signs-title`;
  const interpretation = createDeterministicInterpretation(chart);
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 border-t border-natal-border/70 p-5 sm:p-7"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-natal-accent">Confirmed facts</p>
      <h3 className="mt-2 text-lg font-semibold text-white" id={titleId}>
        Interpretation
      </h3>
      {isResearchConfiguration ? (
        <p
          className="mt-3 rounded-lg border border-amber-200/30 bg-amber-200/10 p-3 text-sm leading-6 text-amber-50/90"
          role="note"
        >
          Research configuration: deterministic UI-development copy based only on available Engine facts.
        </p>
      ) : null}

      <InterpretationSection items={interpretation.bigThree} title="Big Three" titleId={bigThreeTitleId} />
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
