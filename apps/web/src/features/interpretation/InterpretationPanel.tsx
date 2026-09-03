import { useId, useState } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import type { SupportedLocale } from '@/lib/localization';
import { chartUi, chartUiFormat } from '@/core/chart/chart-ui';
import {
  createDeterministicInterpretation,
  type InterpretationItem
} from './deterministic-interpretation';
import type { ChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';

export type InterpretationPanelProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
};

type InterpretationItemsProps = {
  locale?: SupportedLocale;
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

function InterpretationItems({ items, locale }: InterpretationItemsProps) {
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
            <span className="font-semibold">{chartUi(locale, 'interpretation.sourceFact')}</span>{' '}
            <span className="font-mono">{item.sourceContext ?? item.sourceFacts.join(' · ')}</span>
          </p>
        </article>
      ))}
    </div>
  );
}

function InterpretationOrientation({
  items,
  locale,
  title,
  titleId
}: InterpretationOrientationProps) {
  return (
    <section aria-labelledby={titleId} className="mt-6 first:mt-5">
      <h4 className="nn-type-label uppercase tracking-[0.12em]" id={titleId}>
        {title}
      </h4>
      {items.length > 0 ? (
        <InterpretationItems items={items} locale={locale} />
      ) : (
        <p className="nn-type-body-small mt-3">
          {chartUi(locale, 'interpretation.noCorePlacements')}
        </p>
      )}
    </section>
  );
}

function InterpretationDisclosure({
  countLabel,
  locale,
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
        <InterpretationItems items={items} locale={locale} />
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

function placementCount(locale: SupportedLocale | undefined, count: number) {
  return chartUiFormat(
    locale,
    count === 1 ? 'interpretation.placementCount.one' : 'interpretation.placementCount.many',
    { count }
  );
}

function aspectCount(locale: SupportedLocale | undefined, count: number) {
  return chartUiFormat(
    locale,
    count === 1 ? 'interpretation.aspectCount.one' : 'interpretation.aspectCount.many',
    { count }
  );
}

export default function InterpretationPanel({
  chart,
  locale,
  presentationPolicy
}: InterpretationPanelProps) {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const bigThreeTitleId = `${panelId}-big-three-title`;
  const planetsInHousesAvailabilityId = `${panelId}-planets-in-houses-availability-title`;
  const majorAspectsAvailabilityId = `${panelId}-major-aspects-availability-title`;
  const planetsInSignsAvailabilityId = `${panelId}-planets-in-signs-availability-title`;
  const interpretation = createDeterministicInterpretation(chart, presentationPolicy, locale);
  const isResearchConfiguration = chart.calculationStatus === 'INCOMPLETE_RESEARCH';
  const bigThreeTitle = presentationPolicy.showAngles
    ? chartUi(locale, 'interpretation.bigThree')
    : chartUi(locale, 'interpretation.corePlacements');

  return (
    <section
      aria-labelledby={titleId}
      className="nn-surface nn-surface--elevated min-w-0 p-5 sm:p-7"
    >
      <p className="nn-eyebrow">{chartUi(locale, 'interpretation.confirmedFacts')}</p>
      <h3 className="nn-type-section-title mt-2" id={titleId}>
        {chartUi(locale, 'interpretation.title')}
      </h3>
      {isResearchConfiguration ? (
        <p
          className="nn-notice nn-notice--research mt-3"
          role="note"
        >
          {chartUi(locale, 'interpretation.researchNotice')}
        </p>
      ) : null}

      <InterpretationOrientation
        items={interpretation.bigThree}
        locale={locale}
        title={bigThreeTitle}
        titleId={bigThreeTitleId}
      />
      {interpretation.planetsInSigns.length > 0 ? (
        <InterpretationDisclosure
          countLabel={placementCount(locale, interpretation.planetsInSigns.length)}
          items={interpretation.planetsInSigns}
          locale={locale}
          title={chartUi(locale, 'interpretation.planetsInSigns')}
        />
      ) : (
        <InterpretationAvailability
          message={chartUi(locale, 'interpretation.planetsInSignsUnavailable')}
          title={chartUi(locale, 'interpretation.planetsInSigns')}
          titleId={planetsInSignsAvailabilityId}
        />
      )}
      {presentationPolicy.showHouseInterpretation ? (
        interpretation.planetsInHouses.length > 0 ? (
          <InterpretationDisclosure
            countLabel={placementCount(locale, interpretation.planetsInHouses.length)}
            items={interpretation.planetsInHouses}
            locale={locale}
            title={chartUi(locale, 'interpretation.planetsInHouses')}
          />
        ) : (
          <InterpretationAvailability
            message={chartUi(locale, 'interpretation.planetsInHousesUnavailable')}
            title={chartUi(locale, 'interpretation.planetsInHouses')}
            titleId={planetsInHousesAvailabilityId}
          />
        )
      ) : (
        <InterpretationAvailability
          message={chartUi(locale, 'interpretation.unavailableWithoutExactTime')}
          title={chartUi(locale, 'interpretation.planetsInHouses')}
          titleId={planetsInHousesAvailabilityId}
        />
      )}
      {interpretation.majorAspects.length > 0 ? (
        <InterpretationDisclosure
          countLabel={aspectCount(locale, interpretation.majorAspects.length)}
          items={interpretation.majorAspects}
          locale={locale}
          title={chartUi(locale, 'interpretation.majorAspects')}
        />
      ) : (
        <InterpretationAvailability
          message={chartUi(locale, 'interpretation.majorAspectsUnavailable')}
          title={chartUi(locale, 'interpretation.majorAspects')}
          titleId={majorAspectsAvailabilityId}
        />
      )}
    </section>
  );
}
