import { DEFAULT_LOCALE, type SupportedLocale } from '../../lib/localization.js';
import {
  formatUiMessage,
  getUiMessage,
  type UiMessageKey
} from '../../lib/ui-catalog.js';

/** Resolves Class A chart UI copy from the active URL locale. */
export function chartUi(
  locale: SupportedLocale | undefined,
  key: UiMessageKey
): string {
  return getUiMessage(locale ?? DEFAULT_LOCALE, key);
}

export function chartUiFormat(
  locale: SupportedLocale | undefined,
  key: UiMessageKey,
  values: Readonly<Record<string, string | number>>
): string {
  return formatUiMessage(locale ?? DEFAULT_LOCALE, key, values);
}

export function chartCalculationStatus(
  locale: SupportedLocale | undefined,
  status: string
): string {
  const keyByStatus: Partial<Record<string, UiMessageKey>> = {
    COMPLETE: 'calculation.complete',
    INCOMPLETE_RESEARCH: 'calculation.incompleteResearch'
  };
  const key = keyByStatus[status];

  return key ? chartUi(locale, key) : status;
}

export function chartWarningSeverity(
  locale: SupportedLocale | undefined,
  severity: string
): string {
  const keyBySeverity: Partial<Record<string, UiMessageKey>> = {
    INFO: 'calculation.severity.info',
    WARNING: 'calculation.severity.warning',
    ERROR: 'calculation.severity.error'
  };
  const key = keyBySeverity[severity];

  return key ? chartUi(locale, key) : severity;
}

export function chartWarningMessage(
  locale: SupportedLocale | undefined,
  warning: { code: string; message: string }
): string {
  const keyByCode: Record<string, UiMessageKey> = {
    UI_DEVELOPMENT_ONLY: 'calculate.provenance.uiDevelopment',
    NOT_SCIENTIFIC_EVIDENCE: 'calculate.provenance.notScientific',
    NOT_PRODUCTION_ASTRONOMY: 'calculate.provenance.notProductionAstronomy'
  };
  const key = keyByCode[warning.code];
  return key ? chartUi(locale, key) : warning.message;
}
