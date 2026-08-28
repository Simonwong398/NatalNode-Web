import { useId, useState } from 'react';
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

type InterpretationItemsProps = {
  items: InterpretationItem[];
};

type InterpretationOrientationProps = InterpretationItemsProps & {
  title: string;
  titleId: string;
};

type InterpretationDisclosureProps = InterpretationItemsProps & {
  countLabel: string;
  title: string;
};

type InterpretationAvailabilityProps = {
  message: string;
  title: string;
  titleId: string;
};

function InterpretationItems({ items }: InterpretationItemsProps) {
  return (
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
  );
}

function InterpretationOrientation({
  items,
  title,
  titleId
}: InterpretationOrientationProps) {
  return (
    <section aria-labelledby={titleId} className="mt-6 first:mt-5">
      <h4 className="nn-type-label uppercase tracking-[0.12em]" id={titleId}>
        {title}
      </h4>
      {items.length > 0 ? (
        <InterpretationItems items={items} />
      ) : (
        <p className="nn-type-body-small mt-3">No supported core placements are available for this chart.</p>
      )}
    </section>
  );
}

function InterpretationDisclosure({
  countLabel,
  items,
  title
}: InterpretationDisclosureProps) {
  const disclosureId = useId();
  const controlId = `${disclosureId}-control`;
  const contentId = `${disclosureId}-content`;
  const titleId = `${disclosureId}-title`;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section aria-labelledby={titleId} className="mt-6">
      <h4>
        <button
          aria-controls={contentId}
          aria-expanded={isOpen}
          className="nn-button nn-button--quiet w-full justify-between px-4 text-left"
          id={controlId}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span>
            <span className="nn-type-label block" id={titleId}>{title}</span>
            <span className="nn-type-metadata mt-1 block font-normal">{countLabel}</span>
          </span>
          <span aria-hidden="true" className="text-lg">{isOpen ? '−' : '+'}</span>
        </button>
      </h4>
      <div aria-labelledby={controlId} hidden={!isOpen} id={contentId}>
        <InterpretationItems items={items} />
      </div>
    </section>
  );
}

function InterpretationAvailability({
  message,
  title,
  titleId
}: InterpretationAvailabilityProps) {
  return (
    <section aria-labelledby={titleId} className="nn-surface mt-6 p-4">
      <h4 className="nn-type-label" id={titleId}>{title}</h4>
      <p className="nn-type-body-small mt-2">{message}</p>
    </section>
  );
}

function placementCount(count: number) {
  return `${count} ${count === 1 ? 'placement' : 'placements'}`;
}

function aspectCount(count: number) {
  return `${count} ${count === 1 ? 'major aspect' : 'major aspects'}`;
}

export default function InterpretationPanel({ chart, presentationPolicy }: InterpretationPanelProps) {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const bigThreeTitleId = `${panelId}-big-three-title`;
  const planetsInHousesAvailabilityId = `${panelId}-planets-in-houses-availability-title`;
  const majorAspectsAvailabilityId = `${panelId}-major-aspects-availability-title`;
  const planetsInSignsAvailabilityId = `${panelId}-planets-in-signs-availability-title`;
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

      <InterpretationOrientation
        items={interpretation.bigThree}
        title={bigThreeTitle}
        titleId={bigThreeTitleId}
      />
      {interpretation.planetsInSigns.length > 0 ? (
        <InterpretationDisclosure
          countLabel={placementCount(interpretation.planetsInSigns.length)}
          items={interpretation.planetsInSigns}
          title="Planets in Signs"
        />
      ) : (
        <InterpretationAvailability
          message="No supported planet-in-sign placements are available for this chart."
          title="Planets in Signs"
          titleId={planetsInSignsAvailabilityId}
        />
      )}
      {presentationPolicy.showHouseInterpretation ? (
        interpretation.planetsInHouses.length > 0 ? (
          <InterpretationDisclosure
            countLabel={placementCount(interpretation.planetsInHouses.length)}
            items={interpretation.planetsInHouses}
            title="Planets in Houses"
          />
        ) : (
          <InterpretationAvailability
            message="No supported planet-in-house placements are available for this chart."
            title="Planets in Houses"
            titleId={planetsInHousesAvailabilityId}
          />
        )
      ) : (
        <InterpretationAvailability
          message="Unavailable without an exact birth time."
          title="Planets in Houses"
          titleId={planetsInHousesAvailabilityId}
        />
      )}
      {interpretation.majorAspects.length > 0 ? (
        <InterpretationDisclosure
          countLabel={aspectCount(interpretation.majorAspects.length)}
          items={interpretation.majorAspects}
          title="Major Aspects"
        />
      ) : (
        <InterpretationAvailability
          message="No supported major-aspect interpretations are available for this chart."
          title="Major Aspects"
          titleId={majorAspectsAvailabilityId}
        />
      )}
    </section>
  );
}
