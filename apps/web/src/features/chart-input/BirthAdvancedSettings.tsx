import { cn } from '@/lib/utils';
import type { SupportedLocale } from '../../lib/localization.js';
import { chartUi } from '../chart-experience/chart-ui.js';
import type { HouseSystemSelection } from './types';

interface BirthAdvancedSettingsProps {
  error?: string;
  houseSystem: HouseSystemSelection;
  isInteractionDisabled: boolean;
  isOpen: boolean;
  locale?: SupportedLocale;
  onHouseSystemChange: (houseSystem: HouseSystemSelection) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function BirthAdvancedSettings({
  error,
  houseSystem,
  isInteractionDisabled,
  isOpen,
  locale,
  onHouseSystemChange,
  onOpenChange
}: BirthAdvancedSettingsProps) {
  return (
    <details
      className="min-w-0 border-t border-[color:var(--nn-border-subtle)] pt-5"
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      open={isOpen}
    >
      <summary className="nn-type-label cursor-pointer">
        {chartUi(locale, 'birthInput.advancedSettings')}
      </summary>
      <div className="mt-4 max-w-sm">
        <label className="nn-type-label" htmlFor="house-system">
          House system
        </label>
        <select
          aria-describedby={error ? 'house-system-error' : undefined}
          aria-invalid={Boolean(error)}
          className={cn('nn-field', 'mt-2 appearance-auto')}
          disabled={isInteractionDisabled}
          id="house-system"
          name="houseSystem"
          onChange={(event) =>
            onHouseSystemChange(event.target.value as HouseSystemSelection)
          }
          required
          value={houseSystem}
        >
          <option disabled value="">
            Choose a house system
          </option>
          <option value="Placidus">Placidus</option>
          <option value="Whole Sign">Whole Sign</option>
          <option value="Equal">Equal</option>
        </select>
        {error ? (
          <p className="nn-status nn-status--error mt-2" id="house-system-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </details>
  );
}
