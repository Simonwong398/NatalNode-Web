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
  return status === 'INCOMPLETE_RESEARCH'
    ? chartUi(locale, 'workspace.researchConfiguration')
    : status;
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
