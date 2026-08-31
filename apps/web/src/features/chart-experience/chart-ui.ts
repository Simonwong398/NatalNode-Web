import { DEFAULT_LOCALE, type SupportedLocale } from '../../lib/localization.js';
import { getUiMessage, type UiMessageKey } from '../../lib/ui-catalog.js';

/** Resolves Class A chart UI copy from the active URL locale. */
export function chartUi(
  locale: SupportedLocale | undefined,
  key: UiMessageKey
): string {
  return getUiMessage(locale ?? DEFAULT_LOCALE, key);
}
