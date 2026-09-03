import { useEffect, useId, useRef, useState } from 'react';
import type { ChartResult } from '@natalnode/contracts';
import {
  ChartRenderer,
  type ChartSemanticFocus
} from '@/core/chart';
import {
  withChartPresentationMode,
  type ChartPresentationPolicy
} from '@/core/chart/chart-presentation-policy';
import ChartFocusDialog from '@/features/chart-workspace/ChartFocusDialog';
import {
  getEducationalChartLayerDefinition,
  getEducationalChartLesson,
  EDUCATIONAL_CHART_LAYER_ORDER,
  type EducationalChartLayer
} from './educational-chart-model.js';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { formatUiMessage, getUiMessage } from '@/lib/ui-catalog';

const EDUCATIONAL_DETAIL_FOCUSES = [
  'none',
  ...EDUCATIONAL_CHART_LAYER_ORDER
] as const satisfies readonly ChartSemanticFocus[];

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
  const focusDialogId = `${instanceId}-focus-dialog`;
  const focusTriggerRef = useRef<HTMLButtonElement>(null);
  const focusCloseRef = useRef<HTMLButtonElement>(null);
  const [selectedFocus, setSelectedFocus] = useState<ChartSemanticFocus>('none');
  const [previewFocus, setPreviewFocus] = useState<EducationalChartLayer | null>(null);
  const [expandedSemanticFocus, setExpandedSemanticFocus] = useState<ChartSemanticFocus>('none');
  const [isChartFocusOpen, setIsChartFocusOpen] = useState(false);
  const activeFocus = previewFocus ?? selectedFocus;

  const toggleSelectedFocus = (layer: EducationalChartLayer) => {
    setSelectedFocus((current) => current === layer ? 'none' : layer);
  };

  const openChartFocus = () => {
    setExpandedSemanticFocus(activeFocus);
    setIsChartFocusOpen(true);
  };

  useEffect(() => {
    if (!isChartFocusOpen) return;

    const returnFocusTarget = focusTriggerRef.current ?? (
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    );
    document.body.classList.add('nn-chart-focus-lock');
    focusCloseRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsChartFocusOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('nn-chart-focus-lock');
      document.removeEventListener('keydown', handleEscape);
      returnFocusTarget?.focus();
    };
  }, [isChartFocusOpen]);

  return (
    <>
      <div
        aria-labelledby={chartLabelId}
        className="nn-educational-chart-instrument"
        data-educational-chart-instrument="true"
        role="group"
      >
        <div className="nn-educational-chart-instrument__chart-wrap">
          <div className="nn-educational-chart-instrument__chart-heading">
            <div className="min-w-0">
              <p className="nn-eyebrow" id={chartLabelId}>
                {getUiMessage(locale, 'learn.educationalChart.label')}
              </p>
              <p className="nn-educational-chart-instrument__chart-label">
                {getUiMessage(locale, 'learn.educationalChart.chartLabel')}
              </p>
            </div>
            <button
              aria-controls={focusDialogId}
              aria-expanded={isChartFocusOpen}
              className="nn-button nn-button--quiet nn-educational-chart-instrument__expand"
              onClick={openChartFocus}
              ref={focusTriggerRef}
              type="button"
            >
              {getUiMessage(locale, 'chart.expand')}
            </button>
          </div>
          <div id={chartId}>
            <ChartRenderer
              chart={chart}
              focusCardLayout="reserved"
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
          {EDUCATIONAL_DETAIL_FOCUSES.map((focus) => {
            const definition = getEducationalChartLayerDefinition(focus);
            const lesson = getEducationalChartLesson(focus);
            const label = definition === null
              ? getUiMessage(locale, 'learn.educationalChart.chartLabel')
              : getUiMessage(locale, definition.labelKey);
            const description = definition === null
              ? getUiMessage(locale, 'learn.educationalChart.overviewDescription')
              : getUiMessage(locale, definition.descriptionKey);
            const isActive = activeFocus === focus;

            return (
              <div
                aria-hidden={!isActive}
                className={`nn-educational-chart-instrument__details-panel${isActive ? ' nn-educational-chart-instrument__details-panel--active' : ''}`}
                data-focus={focus}
                key={focus}
              >
                <p className="nn-educational-chart-instrument__details-label">
                  {label}
                </p>
                <p className="nn-type-body-small">
                  {description}
                </p>
                {lesson !== null && definition !== null ? (
                  <a
                    className="nn-educational-chart-instrument__lesson-link"
                    href={getLocalizedPath(locale, `/learn/foundations/${lesson.slug}/`)}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {formatUiMessage(locale, 'learn.educationalChart.learnAbout', {
                      layer: label
                    })}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {isChartFocusOpen ? (
        <ChartFocusDialog
          chart={chart}
          closeButtonRef={focusCloseRef}
          dialogId={focusDialogId}
          locale={locale}
          onClose={() => setIsChartFocusOpen(false)}
          layoutVariant="educational"
          portal
          presentationPolicy={withChartPresentationMode(presentationPolicy, 'expanded')}
          semanticFocus={expandedSemanticFocus}
          focusCardLayout="reserved"
        />
      ) : null}
    </>
  );
}
