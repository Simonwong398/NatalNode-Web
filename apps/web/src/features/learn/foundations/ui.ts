import { getUiMessage, type UiMessageKey } from '../../../lib/ui-catalog.js';
import { type SupportedLocale } from '../../../lib/localization.js';

export const FOUNDATIONS_UI_MESSAGE_KEYS = [
  'nav.learn',
  'learn.foundations.title',
  'learn.foundations.description',
  'learn.foundations.course',
  'learn.foundations.lessons',
  'learn.foundations.lesson',
  'learn.foundations.continue',
  'learn.foundations.start',
  'learn.foundations.completed',
  'learn.foundations.inProgress',
  'learn.foundations.notStarted',
  'learn.foundations.markComplete',
  'learn.foundations.markIncomplete',
  'learn.foundations.previousLesson',
  'learn.foundations.nextLesson',
  'learn.foundations.courseProgress',
  'learn.foundations.progressCount',
  'learn.foundations.resume',
  'learn.foundations.contentUnavailable',
  'learn.foundations.viewEnglish',
  'learn.foundations.viewingEnglish',
  'learn.foundations.backToCourse',
  'learn.foundations.estimatedTime',
  'learn.foundations.myChart',
  'learn.foundations.createChart',
  'learn.foundations.openContext',
  'learn.foundations.timeLimitation',
  'learn.foundations.finalCheckComingLater',
  'learn.foundations.finalAssessment',
  'learn.foundations.finalAssessmentDescription',
  'learn.foundations.openFinalAssessment',
  'learn.foundations.finalAssessmentUnavailable',
  'learn.foundations.assessment.answerPrompt',
  'learn.foundations.assessment.answered',
  'learn.foundations.assessment.correctAnswer',
  'learn.foundations.assessment.assessmentNotSaved',
  'learn.foundations.assessment.pass',
  'learn.foundations.assessment.notPassed',
  'learn.foundations.assessment.scorePrefix',
  'learn.foundations.assessment.threshold',
  'learn.foundations.assessment.submit',
  'learn.foundations.assessment.retry',
  'learn.foundations.assessment.yourAnswer',
  'learn.foundations.assessment.explanation',
  'learn.foundations.assessment.questionProgress',
  'learn.foundations.scaffold',
  'learn.foundations.scaffoldDescription',
  'learn.foundations.orientation',
  'learn.foundations.coreConcept',
  'learn.foundations.professionalVocabulary',
  'learn.foundations.example',
  'learn.foundations.myChartSection',
  'learn.foundations.practice',
  'learn.foundations.checkUnderstanding',
  'learn.foundations.keyTakeaway',
  'learn.foundations.lessonPosition',
  'learn.foundations.browseNote',
  'learn.foundations.available',
  'learn.foundations.notAvailable',
  'learn.foundations.courseComplete'
] as const satisfies readonly UiMessageKey[];

export type FoundationsUiMessageKey = (typeof FOUNDATIONS_UI_MESSAGE_KEYS)[number];

export type FoundationsUiMessages = Readonly<
  Record<FoundationsUiMessageKey, string>
>;

export function getFoundationsUiMessages(
  locale: SupportedLocale
): FoundationsUiMessages {
  return Object.freeze(
    Object.fromEntries(
      FOUNDATIONS_UI_MESSAGE_KEYS.map((key) => [key, getUiMessage(locale, key)])
    ) as FoundationsUiMessages
  );
}
