import {
  createWeeklyReadingPrototypeScenarios,
  type WeeklyReadingPrototypeScenario
} from './weekly-reading-prototype.js';
import type { WeeklyPocScenarioId } from './weekly-interpretation-poc.js';
import type { WeeklyReadingModel } from './weekly-reading-model.js';

export interface WeeklyReadingR2Scenario {
  readonly id: WeeklyPocScenarioId;
  readonly label: string;
  readonly model: WeeklyReadingModel;
}

/**
 * R2 chooses one model projection once so the visual study has one coherent
 * presentation. The model-owned Astrologer's View remains available as
 * progressive depth; it is not exposed as a runtime style switch.
 */
const R2_DEFAULT_MODEL_STYLE = 'ASTROLOGER' as const;

function toR2Scenario(
  scenario: WeeklyReadingPrototypeScenario
): WeeklyReadingR2Scenario {
  return Object.freeze({
    id: scenario.id,
    label: scenario.label,
    model: scenario.models[R2_DEFAULT_MODEL_STYLE]
  });
}

export function createWeeklyReadingR2Scenarios(): readonly WeeklyReadingR2Scenario[] {
  return Object.freeze(
    createWeeklyReadingPrototypeScenarios().map(toR2Scenario)
  );
}
