import {
  createWeeklyInterpretationDraft,
  WEEKLY_EDITORIAL_LOCALES,
  type WeeklyEditorialStyle,
  type WeeklyInterpretationDraft
} from './weekly-editorial.js';
import {
  createWeeklyPocScenarios,
  type WeeklyPocScenario,
  type WeeklyPocScenarioId
} from './weekly-interpretation-poc.js';
import {
  createWeeklyReadingModel,
  type WeeklyReadingModel
} from './weekly-reading-model.js';

export type WeeklyReadingPrototypeStyle = Extract<WeeklyEditorialStyle, 'CLEAR' | 'ASTROLOGER'>;

export interface WeeklyReadingPrototypeScenario {
  readonly id: WeeklyPocScenarioId;
  readonly label: string;
  readonly sourceTitle: string;
  readonly models: Readonly<Record<WeeklyReadingPrototypeStyle, WeeklyReadingModel>>;
}

const SCENARIO_LABELS: Readonly<Record<WeeklyPocScenarioId, string>> = Object.freeze({
  SCENARIO_A_SUPPORTIVE_COMMUNICATION: 'A — Supportive communication',
  SCENARIO_B_MIXED_RELATIONSHIP: 'B — Mixed relationship',
  SCENARIO_C_ACTION_EMOTIONAL_TENSION: 'C — Action vs emotional tension',
  SCENARIO_D_BACKGROUND_MOMENTARY: 'D — Background + momentary',
  SCENARIO_E_UNKNOWN_TIME: 'E — Unknown birth time'
});

const PROTOTYPE_STYLES: readonly WeeklyReadingPrototypeStyle[] = ['CLEAR', 'ASTROLOGER'];

function createScenarioModels(
  scenario: WeeklyPocScenario
): Readonly<Record<WeeklyReadingPrototypeStyle, WeeklyReadingModel>> {
  const models = Object.fromEntries(
    PROTOTYPE_STYLES.map((style) => {
      const draft: WeeklyInterpretationDraft = createWeeklyInterpretationDraft(
        scenario,
        style,
        WEEKLY_EDITORIAL_LOCALES[0]
      );
      return [style, createWeeklyReadingModel(draft)];
    })
  ) as Record<WeeklyReadingPrototypeStyle, WeeklyReadingModel>;

  return Object.freeze(models);
}

export function createWeeklyReadingPrototypeScenarios(): readonly WeeklyReadingPrototypeScenario[] {
  return Object.freeze(createWeeklyPocScenarios().map((scenario) => Object.freeze({
    id: scenario.scenarioId,
    label: SCENARIO_LABELS[scenario.scenarioId],
    sourceTitle: scenario.title,
    models: createScenarioModels(scenario)
  })));
}
