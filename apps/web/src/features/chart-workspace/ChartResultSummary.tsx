import type { ChartResult } from '@natalnode/contracts';
import { useId } from 'react';
import {
  DEFAULT_LOCALE,
  getLocalizedPath,
  type SupportedLocale
} from '../../lib/localization.js';
import { chartUi, chartUiFormat } from '@/core/chart/chart-ui';

type ElementName = 'Fire' | 'Earth' | 'Air' | 'Water';
type ModalityName = 'Cardinal' | 'Fixed' | 'Mutable';

type SignClassification = {
  element: ElementName;
  modality: ModalityName;
};

type DistributionItem = {
  key: string;
  label: string;
  count: number;
};

const SIGN_CLASSIFICATIONS: Readonly<Record<string, SignClassification>> = {
  Aries: { element: 'Fire', modality: 'Cardinal' },
  Taurus: { element: 'Earth', modality: 'Fixed' },
  Gemini: { element: 'Air', modality: 'Mutable' },
  Cancer: { element: 'Water', modality: 'Cardinal' },
  Leo: { element: 'Fire', modality: 'Fixed' },
  Virgo: { element: 'Earth', modality: 'Mutable' },
  Libra: { element: 'Air', modality: 'Cardinal' },
  Scorpio: { element: 'Water', modality: 'Fixed' },
  Sagittarius: { element: 'Fire', modality: 'Mutable' },
  Capricorn: { element: 'Earth', modality: 'Cardinal' },
  Aquarius: { element: 'Air', modality: 'Fixed' },
  Pisces: { element: 'Water', modality: 'Mutable' }
};

const ELEMENTS: readonly ElementName[] = ['Fire', 'Earth', 'Air', 'Water'];
const MODALITIES: readonly ModalityName[] = ['Cardinal', 'Fixed', 'Mutable'];

const ELEMENT_LABEL_KEYS = {
  Fire: 'chart.element.fire',
  Earth: 'chart.element.earth',
  Air: 'chart.element.air',
  Water: 'chart.element.water'
} as const;

const MODALITY_LABEL_KEYS = {
  Cardinal: 'chart.modality.cardinal',
  Fixed: 'chart.modality.fixed',
  Mutable: 'chart.modality.mutable'
} as const;

const LEARN_LINKS = [
  {
    key: 'chart.lesson02',
    path: '/learn/foundations/the-zodiac-polarity-elements-and-modes/'
  },
  {
    key: 'chart.lesson04',
    path: '/learn/foundations/the-sun-and-moon/'
  },
  {
    key: 'chart.lesson05',
    path: '/learn/foundations/mercury-venus-and-mars/'
  },
  {
    key: 'chart.lesson07',
    path: '/learn/foundations/the-twelve-houses-and-the-angles/'
  },
  {
    key: 'chart.lesson09',
    path: '/learn/foundations/aspects-relationships-between-planets/'
  }
] as const;

function countByClassification(
  chart: ChartResult
): { elements: Record<ElementName, number>; modalities: Record<ModalityName, number> } {
  const elements: Record<ElementName, number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0
  };
  const modalities: Record<ModalityName, number> = {
    Cardinal: 0,
    Fixed: 0,
    Mutable: 0
  };

  for (const body of chart.bodies) {
    const classification = SIGN_CLASSIFICATIONS[body.sign];
    if (!classification) continue;

    elements[classification.element] += 1;
    modalities[classification.modality] += 1;
  }

  return { elements, modalities };
}

function createDistributionItems(
  keys: readonly string[],
  counts: Readonly<Record<string, number>>,
  labelKeys: Readonly<Record<string, string>>,
  locale: SupportedLocale | undefined
): DistributionItem[] {
  return keys.map((key) => ({
    key,
    label: chartUi(locale, labelKeys[key] as Parameters<typeof chartUi>[1]),
    count: counts[key] ?? 0
  }));
}

function Distribution({
  items,
  locale,
  title
}: {
  items: readonly DistributionItem[];
  locale: SupportedLocale | undefined;
  title: string;
}) {
  const maximum = Math.max(...items.map((item) => item.count), 0);
  const numberLocale = locale ?? DEFAULT_LOCALE;

  return (
    <section aria-label={title} className="nn-chart-distribution">
      <h4 className="nn-type-label">{title}</h4>
      <ul className="nn-chart-distribution__list">
        {items.map((item) => {
          const width = maximum === 0 ? 0 : (item.count / maximum) * 100;

          return (
            <li className="nn-chart-distribution__row" key={item.key}>
              <span className="nn-chart-distribution__label">
                <span>{item.label}</span>
                <span aria-hidden="true" className="nn-chart-distribution__track">
                  <span
                    className="nn-chart-distribution__bar"
                    style={{ width: `${width}%` }}
                  />
                </span>
              </span>
              <span className="nn-chart-distribution__count">
                {new Intl.NumberFormat(numberLocale).format(item.count)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getLargestLabels(items: readonly DistributionItem[]): string[] {
  const maximum = Math.max(...items.map((item) => item.count), 0);
  return maximum === 0
    ? []
    : items.filter((item) => item.count === maximum).map((item) => item.label);
}

export type ChartResultSummaryProps = {
  chart: ChartResult;
  locale?: SupportedLocale;
};

/** Presents bounded aggregates without deriving new chart facts from geometry. */
export default function ChartResultSummary({ chart, locale }: ChartResultSummaryProps) {
  const summaryId = useId().replace(/:/g, '');
  const summaryTitleId = `${summaryId}-title`;
  const emphasisTitleId = `${summaryId}-emphasis-title`;
  const learningLinksTitleId = `${summaryId}-learning-links-title`;
  const { elements, modalities } = countByClassification(chart);
  const elementItems = createDistributionItems(ELEMENTS, elements, ELEMENT_LABEL_KEYS, locale);
  const modalityItems = createDistributionItems(MODALITIES, modalities, MODALITY_LABEL_KEYS, locale);
  const emphasisLabels = [...getLargestLabels(elementItems), ...getLargestLabels(modalityItems)];
  const linksLocale = locale ?? DEFAULT_LOCALE;

  return (
    <section
      aria-labelledby={summaryTitleId}
      className="nn-chart-result-summary nn-surface mt-5"
    >
      <div className="nn-section-header">
        <p className="nn-eyebrow">{chartUi(locale, 'chart.suppliedPlacements')}</p>
        <h3 className="nn-type-section-title" id={summaryTitleId}>
          {chartUi(locale, 'chart.summaryTitle')}
        </h3>
        <p className="nn-type-body-small">{chartUi(locale, 'chart.summaryDescription')}</p>
      </div>

      <p className="nn-type-metadata">
        {chartUiFormat(locale, chart.bodies.length === 1 ? 'chart.bodyCount.one' : 'chart.bodyCount.many', {
          count: chart.bodies.length
        })}{' · '}
        {chartUiFormat(locale, chart.aspects.length === 1 ? 'chart.aspectCount.one' : 'chart.aspectCount.many', {
          count: chart.aspects.length
        })}
      </p>

      <div className="nn-chart-result-summary__grid sm:grid-cols-2">
        <Distribution
          items={elementItems}
          locale={locale}
          title={chartUi(locale, 'chart.elementDistribution')}
        />
        <Distribution
          items={modalityItems}
          locale={locale}
          title={chartUi(locale, 'chart.modalityDistribution')}
        />
      </div>

      <section aria-labelledby={emphasisTitleId} className="nn-chart-emphasis">
        <h4 className="nn-type-label" id={emphasisTitleId}>
          {chartUi(locale, 'chart.chartEmphasis')}
        </h4>
        <p className="nn-type-body-small mt-2">
          {chartUi(locale, 'chart.chartEmphasisDescription')}
        </p>
        {emphasisLabels.length > 0 ? (
          <ul className="nn-chart-emphasis__list">
            {emphasisLabels.map((label) => (
              <li className="nn-chart-emphasis__item" key={label}>
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="nn-type-metadata mt-3">{chartUi(locale, 'chart.summaryUnavailable')}</p>
        )}
      </section>

      <section aria-labelledby={learningLinksTitleId} className="nn-chart-learning-links">
        <h4 className="nn-type-label" id={learningLinksTitleId}>
          {chartUi(locale, 'chart.learningLinks')}
        </h4>
        <ul className="nn-chart-learning-links__list">
          {LEARN_LINKS.map(({ key, path }) => (
            <li key={path}>
              <a href={getLocalizedPath(linksLocale, path)}>
                <span>{chartUi(locale, key)}</span>
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
