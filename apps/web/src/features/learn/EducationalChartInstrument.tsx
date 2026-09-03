import { useId, useState } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  ChartRenderer,
  type ChartSemanticFocus
} from '@/core/chart';
import type { ChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';
import {
  getEducationalChartLayerDefinition,
  getEducationalChartLesson,
  EDUCATIONAL_CHART_LAYER_ORDER,
  type EducationalChartLayer
} from './educational-chart-model.js';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { formatUiMessage, getUiMessage } from '@/lib/ui-catalog';

type EducationalChartInstrumentProps = {
  chart: ChartResult;
  locale: SupportedLocale;
  presentationPolicy: ChartPresentationPolicy;
};

export default function EducationalChartInstrument({
  chart,
  locale,
  presentationPolicy
}: EducationalChartInstrumentProps) {
  const instanceId = useId().replace(/:/gu, '');
  const chartLabelId = `${instanceId}-chart-label`;
  const chartId = `${instanceId}-chart`;
  const detailsId = `${instanceId}-details`;
  const [selectedFocus, setSelectedFocus] = useState<ChartSemanticFocus>('none');
  const [previewFocus, setPreviewFocus] = useState<EducationalChartLayer | null>(null);
  const activeFocus = previewFocus ?? selectedFocus;
  const activeDefinition = getEducationalChartLayerDefinition(activeFocus);
  const activeLesson = getEducationalChartLesson(activeFocus);
  const activeLabel = activeDefinition === null
    ? getUiMessage(locale, 'learn.educationalChart.chartLabel')
    : getUiMessage(locale, activeDefinition.labelKey);
  const activeDescription = activeDefinition === null
    ? getUiMessage(locale, 'learn.educationalChart.overviewDescription')
    : getUiMessage(locale, activeDefinition.descriptionKey);

  const toggleSelectedFocus = (layer: EducationalChartLayer) => {
    setSelectedFocus((current) => current === layer ? 'none' : layer);
  };

  return (
    <div
      aria-labelledby={chartLabelId}
      className="nn-educational-chart-instrument"
      data-educational-chart-instrument="true"
      role="group"
    >
      <div className="nn-educational-chart-instrument__chart-wrap">
        <p className="nn-eyebrow" id={chartLabelId}>
          {getUiMessage(locale, 'learn.educationalChart.label')}
        </p>
        <p className="nn-educational-chart-instrument__chart-label">
          {getUiMessage(locale, 'learn.educationalChart.chartLabel')}
        </p>
        <div id={chartId}>
          <ChartRenderer
            chart={chart}
            locale={locale}
            presentationPolicy={presentationPolicy}
            semanticFocus={activeFocus}
          />
        </div>
      </div>

      <div
        aria-label={getUiMessage(locale, 'learn.educationalChart.controlsLabel')}
        className="nn-educational-chart-instrument__controls"
        role="group"
      >
        {EDUCATIONAL_CHART_LAYER_ORDER.map((layer) => {
          const definition = getEducationalChartLayerDefinition(layer);
          const label = definition === null
            ? layer
            : getUiMessage(locale, definition.labelKey);
          const selected = selectedFocus === layer;
          const previewing = previewFocus === layer;

          return (
            <button
              aria-controls={chartId}
              aria-describedby={detailsId}
              aria-label={formatUiMessage(locale, 'learn.educationalChart.selectLayer', { layer: label })}
              aria-pressed={selected}
              className={`nn-educational-chart-instrument__control${selected ? ' nn-educational-chart-instrument__control--selected' : ''}${previewing ? ' nn-educational-chart-instrument__control--preview' : ''}`}
              data-layer={layer}
              data-preview-active={previewing ? 'true' : 'false'}
              data-selected={selected ? 'true' : 'false'}
              key={layer}
              onBlur={() => setPreviewFocus(null)}
              onClick={() => toggleSelectedFocus(layer)}
              onFocus={() => setPreviewFocus(layer)}
              onMouseEnter={() => setPreviewFocus(layer)}
              onMouseLeave={() => setPreviewFocus(null)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        aria-atomic="true"
        aria-live="polite"
        className="nn-educational-chart-instrument__details"
        id={detailsId}
      >
        <p className="nn-educational-chart-instrument__details-label">
          {activeLabel}
        </p>
        <p className="nn-type-body-small">
          {activeDescription}
        </p>
        {activeLesson !== null && activeDefinition !== null ? (
          <a
            className="nn-educational-chart-instrument__lesson-link"
            href={getLocalizedPath(locale, `/learn/foundations/${activeLesson.slug}/`)}
          >
            {formatUiMessage(locale, 'learn.educationalChart.learnAbout', {
              layer: activeLabel
            })}
          </a>
        ) : null}
      </div>
    </div>
  );
}
