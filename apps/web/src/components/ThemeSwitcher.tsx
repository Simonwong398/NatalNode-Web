import { useEffect, useState, type ChangeEvent } from 'react';
import type { SupportedLocale } from '@/lib/localization';
import { chartUi } from '@/features/chart-experience/chart-ui';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'natalnode.theme-mode';

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const resolvedTheme = mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : mode;

  root.dataset.nnThemeMode = mode;
  root.dataset.nnTheme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';

  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY) ?? undefined;
    return isThemeMode(storedMode) ? storedMode : 'auto';
  } catch {
    return 'auto';
  }
}

export default function ThemeSwitcher({ locale }: { locale: SupportedLocale }) {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const label = chartUi(locale, 'theme.label');

  useEffect(() => {
    const existingMode = document.documentElement.dataset.nnThemeMode;
    const initialMode = isThemeMode(existingMode)
      ? existingMode
      : readStoredThemeMode();

    setMode(initialMode);
    applyThemeMode(initialMode);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = () => {
      if (document.documentElement.dataset.nnThemeMode === 'auto') {
        applyThemeMode('auto');
      }
    };

    mediaQuery.addEventListener?.('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.currentTarget.value;
    if (!isThemeMode(nextMode)) return;

    setMode(nextMode);
    applyThemeMode(nextMode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      // Theme preference remains functional when storage is unavailable.
    }
  };

  return (
    <div className="nn-theme-switcher" data-theme-switcher>
      <label className="nn-theme-switcher__label" htmlFor="nn-theme-switcher">
        <span className="sr-only">{label}</span>
        <select
          aria-label={label}
          className="nn-theme-switcher__select"
          id="nn-theme-switcher"
          onChange={handleChange}
          value={mode}
        >
          <option value="light">{chartUi(locale, 'theme.light')}</option>
          <option value="dark">{chartUi(locale, 'theme.dark')}</option>
          <option value="auto">{chartUi(locale, 'theme.auto')}</option>
        </select>
      </label>
    </div>
  );
}
