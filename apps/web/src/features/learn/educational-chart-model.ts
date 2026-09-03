import type { ChartSemanticFocus } from '../../core/chart/chart-semantic-focus.js';
import {
  FOUNDATIONS_LESSONS,
  getFoundationsLessonById,
  type FoundationsLesson,
  type FoundationsLessonId
} from './foundations/registry.js';
import type { UiMessageKey } from '../../lib/ui-catalog.js';

export type EducationalChartLayer = Exclude<ChartSemanticFocus, 'none'>;

export const EDUCATIONAL_CHART_LAYER_ORDER = [
  'planets',
  'signs',
  'houses',
  'aspects'
] as const satisfies readonly EducationalChartLayer[];

export type EducationalChartLayerDefinition = Readonly<{
  focus: EducationalChartLayer;
  labelKey: UiMessageKey;
  descriptionKey: UiMessageKey;
  lessonId: FoundationsLessonId;
}>;

type FoundationsHookCapability = FoundationsLesson['myChartHook']['capability'];

function lessonIdForCapability(
  capability: FoundationsHookCapability
): FoundationsLessonId {
  const lesson = FOUNDATIONS_LESSONS.find(
    (candidate) => candidate.myChartHook.capability === capability
  );

  if (lesson === undefined) {
    throw new Error(`Foundations lesson mapping is missing for ${capability}.`);
  }

  return lesson.lessonId;
}

export const EDUCATIONAL_CHART_LAYER_DEFINITIONS = Object.freeze({
  planets: Object.freeze({
    focus: 'planets',
    labelKey: 'learn.educationalChart.planets',
    descriptionKey: 'learn.educationalChart.planetsDescription',
    lessonId: lessonIdForCapability('PLANET_OVERVIEW')
  }),
  signs: Object.freeze({
    focus: 'signs',
    labelKey: 'learn.educationalChart.signs',
    descriptionKey: 'learn.educationalChart.signsDescription',
    lessonId: lessonIdForCapability('ZODIAC_STRUCTURE')
  }),
  houses: Object.freeze({
    focus: 'houses',
    labelKey: 'learn.educationalChart.houses',
    descriptionKey: 'learn.educationalChart.housesDescription',
    lessonId: lessonIdForCapability('HOUSES_AND_ANGLES')
  }),
  aspects: Object.freeze({
    focus: 'aspects',
    labelKey: 'learn.educationalChart.aspects',
    descriptionKey: 'learn.educationalChart.aspectsDescription',
    lessonId: lessonIdForCapability('MAJOR_ASPECTS')
  })
}) satisfies Readonly<Record<EducationalChartLayer, EducationalChartLayerDefinition>>;

export function getEducationalChartLayerDefinition(
  focus: ChartSemanticFocus
): EducationalChartLayerDefinition | null {
  return focus === 'none' ? null : EDUCATIONAL_CHART_LAYER_DEFINITIONS[focus];
}

export function getEducationalChartLesson(
  focus: ChartSemanticFocus
): FoundationsLesson | null {
  const definition = getEducationalChartLayerDefinition(focus);
  return definition === null
    ? null
    : getFoundationsLessonById(definition.lessonId);
}
