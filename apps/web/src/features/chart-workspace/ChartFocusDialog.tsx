import { useId, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { chartUi } from '@/core/chart/chart-ui';
import type { SupportedLocale } from '../../lib/localization.js';
import {
  ChartRenderer,
  type ChartInstrumentData,
  type ChartInstrumentKind
} from '@/core/chart';
import type { ChartFocusCardLayout } from '@/core/chart/ChartRenderer';
import type { ChartPresentationPolicy } from '@/core/chart/chart-presentation-policy';
import type { ChartSemanticFocus } from '@/core/chart/chart-semantic-focus';

export type ChartFocusDialogLayoutVariant = 'default' | 'educational';

export type ChartFocusDialogProps = {
  chart: ChartInstrumentData;
  chartKind?: ChartInstrumentKind;
  closeButtonRef: Ref<HTMLButtonElement>;
  dialogId: string;
  focusCardLayout?: ChartFocusCardLayout;
  layoutVariant?: ChartFocusDialogLayoutVariant;
  locale?: SupportedLocale;
  onClose: () => void;
  portal?: boolean;
  presentationPolicy: ChartPresentationPolicy;
  semanticFocus?: ChartSemanticFocus;
};

/** Provides a larger, dismissible chart view without changing chart facts. */
export default function ChartFocusDialog({
  chart,
  chartKind = 'natal',
  closeButtonRef,
  dialogId,
  focusCardLayout = 'inline',
  layoutVariant = 'default',
  locale,
  onClose,
  portal = false,
  presentationPolicy,
  semanticFocus
}: ChartFocusDialogProps) {
  const focusId = useId().replace(/:/g, '');
  const titleId = `${focusId}-title`;
  const descriptionId = `${focusId}-description`;

  const dialog = (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={`nn-chart-focus-dialog${layoutVariant === 'educational' ? ' nn-chart-focus-dialog--educational' : ''}`}
      id={dialogId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="nn-chart-focus-dialog__backdrop"
        onClick={onClose}
      />
      <section className="nn-chart-focus-dialog__panel">
        <header className="nn-chart-focus-dialog__header">
          <div className="nn-section-header min-w-0">
            <p className="nn-eyebrow">{chartUi(locale, 'chart.focusTitle')}</p>
            <h2 className="nn-type-section-title" id={titleId}>
              {chartUi(locale, 'chart.focusTitle')}
            </h2>
            <p className="nn-type-body-small" id={descriptionId}>
              {chartUi(locale, 'chart.focusDescription')}
            </p>
          </div>
          <button
            aria-label={chartUi(locale, 'chart.closeFocus')}
            className="nn-button nn-button--quiet nn-chart-focus-dialog__close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            {chartUi(locale, 'chart.closeFocus')}
          </button>
        </header>
        <div className="nn-chart-focus-dialog__body">
          <ChartRenderer
            chart={chart}
            chartKind={chartKind}
            locale={locale}
            presentationPolicy={presentationPolicy}
            semanticFocus={semanticFocus}
            focusCardLayout={focusCardLayout}
          />
        </div>
      </section>
    </div>
  );

  return portal ? createPortal(dialog, document.body) : dialog;
}
