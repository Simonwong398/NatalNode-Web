import type { VaultChartCategory } from '@natalnode/contracts';
import { DEFAULT_LOCALE, type SupportedLocale } from '../../lib/localization.js';
import {
  formatUiMessage,
  getUiMessage,
  type UiMessageKey
} from '../../lib/ui-catalog.js';

export function vaultUi(
  locale: SupportedLocale | undefined,
  key: UiMessageKey
): string {
  return getUiMessage(locale ?? DEFAULT_LOCALE, key);
}

export function formatVaultUi(
  locale: SupportedLocale | undefined,
  key: UiMessageKey,
  values: Readonly<Record<string, string | number>>
): string {
  return formatUiMessage(locale ?? DEFAULT_LOCALE, key, values);
}

export function vaultCategoryLabel(
  locale: SupportedLocale | undefined,
  category: VaultChartCategory
): string {
  const key = category === 'SELF'
    ? 'vault.category.self'
    : category === 'PARTNER'
      ? 'vault.category.partner'
      : category === 'FAMILY'
        ? 'vault.category.family'
        : category === 'FRIEND'
          ? 'vault.category.friend'
          : 'vault.category.client';

  return vaultUi(locale, key);
}
