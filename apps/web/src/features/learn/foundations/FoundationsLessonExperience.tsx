import { useEffect, useState } from 'react';
import { resolveAstrologyTerm } from '../../../lib/astrology-glossary.js';
import { getLocalizedPath, type SupportedLocale } from '../../../lib/localization.js';
import {
  getFoundationsAdjacentLessons,
  getFoundationsContentAvailability,
  getFoundationsContentVariant,
  getFoundationsLessonById,
  FOUNDATIONS_COURSE,
  FOUNDATIONS_SECTION_IDS,
  type FoundationsLesson,
  type FoundationsSectionId
} from './registry.js';
import {
  getFoundationsCompletedLessonCount,
  getFoundationsLessonProgressState,
  markFoundationsLessonComplete,
  markFoundationsLessonIncomplete,
  markFoundationsLessonInProgress,
  readFoundationsProgress,
  writeFoundationsProgress,
  type FoundationsProgress,
  type FoundationsProgressState
} from './progress.js';
import type { FoundationsUiMessageKey, FoundationsUiMessages } from './ui.js';

interface FoundationsLessonExperienceProps {
  readonly locale: SupportedLocale;
  readonly lessonId: string;
  readonly showEnglishContent?: boolean;
  readonly ui: FoundationsUiMessages;
}

const SECTION_UI_KEYS: Readonly<Record<FoundationsSectionId, FoundationsUiMessageKey>> = {
  orientation: 'learn.foundations.orientation',
  core_concept: 'learn.foundations.coreConcept',
  professional_vocabulary: 'learn.foundations.professionalVocabulary',
  example: 'learn.foundations.example',
  my_chart: 'learn.foundations.myChartSection',
  practice: 'learn.foundations.practice',
  check_understanding: 'learn.foundations.checkUnderstanding',
  key_takeaway: 'learn.foundations.keyTakeaway'
};

function formatMessage(
  message: string,
  values: Readonly<Record<string, string | number>>
): string {
  return message.replace(
    /\{([A-Za-z0-9_.-]+)\}/gu,
    (token, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name)
        ? String(values[name])
        : token
  );
}

function message(ui: FoundationsUiMessages, key: FoundationsUiMessageKey): string {
  return ui[key];
}

function progressLabel(
  ui: FoundationsUiMessages,
  state: FoundationsProgressState
): string {
  if (state === 'COMPLETED') return message(ui, 'learn.foundations.completed');
  if (state === 'IN_PROGRESS') return message(ui, 'learn.foundations.inProgress');
  return message(ui, 'learn.foundations.notStarted');
}

function lessonHref(locale: SupportedLocale, slug: string): string {
  return getLocalizedPath(locale, `/learn/foundations/${slug}/`);
}

function ContentSection({
  lesson,
  locale,
  sectionId,
  ui
}: {
  readonly lesson: FoundationsLesson;
  readonly locale: SupportedLocale;
  readonly sectionId: FoundationsSectionId;
  readonly ui: FoundationsUiMessages;
}) {
  const content = getFoundationsContentVariant(lesson.lessonId, 'en');
  const objectives = content?.learningObjectives ?? [lesson.shortDescription];

  let body;

  switch (sectionId) {
    case 'orientation':
      body = <p className="nn-type-body-small">{lesson.shortDescription}</p>;
      break;
    case 'core_concept':
      body = <p className="nn-type-body-small">{objectives[0]}</p>;
      break;
    case 'professional_vocabulary':
      body = (
        <ul className="grid gap-2 sm:grid-cols-2">
          {lesson.glossaryConceptIds.map((conceptId) => {
            const term = resolveAstrologyTerm(conceptId, 'en');
            return (
              <li
                className="rounded-[var(--nn-radius-small)] border border-natal-border/70 bg-natal-surface/70 px-3 py-2 nn-type-body-small"
                key={conceptId}
              >
                {term.displayTerm}
                {term.shortForm ? ` (${term.shortForm})` : ''}
              </li>
            );
          })}
        </ul>
      );
      break;
    case 'example':
      body = <p className="nn-type-body-small">{message(ui, 'learn.foundations.scaffoldDescription')}</p>;
      break;
    case 'my_chart':
      body = (
        <div
          className="grid gap-3 rounded-[var(--nn-radius-medium)] border border-natal-border/70 bg-natal-surface/60 p-4"
          data-my-chart-hook={lesson.myChartHook.hookId}
        >
          <p className="nn-type-label">{message(ui, 'learn.foundations.myChart')}</p>
          <p className="nn-type-body-small">
            {message(ui, 'learn.foundations.createChart')}
          </p>
          {lesson.myChartHook.birthTimeRequirement === 'REQUIRED_FOR_TIME_DEPENDENT_FACTS' ? (
            <p className="nn-type-metadata">
              {message(ui, 'learn.foundations.timeLimitation')}
            </p>
          ) : null}
          <a
            className="font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4 transition-colors hover:text-white"
            href={getLocalizedPath(locale, lesson.myChartHook.targetPath)}
          >
            {lesson.myChartHook.targetPath === '/'
              ? message(ui, 'learn.foundations.createChart')
              : message(ui, 'learn.foundations.openContext')}
          </a>
        </div>
      );
      break;
    case 'practice':
      body = <p className="nn-type-body-small">{objectives[1] ?? objectives[0]}</p>;
      break;
    case 'check_understanding':
      body = <p className="nn-type-body-small">{message(ui, 'learn.foundations.finalCheckComingLater')}</p>;
      break;
    case 'key_takeaway':
      body = <p className="nn-type-body-small">{content?.keyTakeaway ?? lesson.shortDescription}</p>;
      break;
  }

  return (
    <section
      aria-labelledby={`foundations-${lesson.order}-${sectionId}`}
      className="grid gap-3 border-t border-natal-border/70 pt-6 first:border-t-0 first:pt-0"
    >
      <h2 className="nn-type-card-title" id={`foundations-${lesson.order}-${sectionId}`}>
        {message(ui, SECTION_UI_KEYS[sectionId])}
      </h2>
      {body}
    </section>
  );
}

export default function FoundationsLessonExperience({
  locale,
  lessonId,
  showEnglishContent = false,
  ui
}: FoundationsLessonExperienceProps) {
  const lesson = getFoundationsLessonById(lessonId);
  const [progress, setProgress] = useState<FoundationsProgress>(
    () => readFoundationsProgress(null)
  );
  const [isEnglishView, setIsEnglishView] = useState(
    showEnglishContent || locale === 'en'
  );

  useEffect(() => {
    if (lesson === null) return;

    const storedProgress = readFoundationsProgress();
    const openedProgress = markFoundationsLessonInProgress(
      storedProgress,
      lesson.lessonId
    );

    if (openedProgress !== storedProgress) {
      writeFoundationsProgress(openedProgress);
    }

    setProgress(openedProgress);
  }, [lesson]);

  useEffect(() => {
    if (locale === 'en') return;

    const requestedContentLocale = new URLSearchParams(window.location.search).get(
      'contentLocale'
    );
    setIsEnglishView(showEnglishContent || requestedContentLocale === 'en');
  }, [locale, showEnglishContent]);

  if (lesson === null) {
    return null;
  }

  const contentLocale: SupportedLocale = isEnglishView ? 'en' : locale;
  const content = getFoundationsContentVariant(lesson.lessonId, contentLocale);
  const contentAvailable = getFoundationsContentAvailability(content) === 'AVAILABLE';
  const state = getFoundationsLessonProgressState(progress, lesson.lessonId);
  const completedCount = getFoundationsCompletedLessonCount(progress);
  const progressText = formatMessage(message(ui, 'learn.foundations.progressCount'), {
    completed: completedCount,
    total: FOUNDATIONS_COURSE.lessonCount
  });
  const positionText = formatMessage(message(ui, 'learn.foundations.lessonPosition'), {
    current: lesson.order,
    total: FOUNDATIONS_COURSE.lessonCount
  });
  const { previous, next } = getFoundationsAdjacentLessons(lesson.lessonId);
  const baseHref = lessonHref(locale, lesson.slug);

  const updateProgress = (nextProgress: FoundationsProgress) => {
    setProgress(nextProgress);
    writeFoundationsProgress(nextProgress);
  };

  const handleCompletionToggle = () => {
    updateProgress(
      state === 'COMPLETED'
        ? markFoundationsLessonIncomplete(progress, lesson.lessonId)
        : markFoundationsLessonComplete(progress, lesson.lessonId)
    );
  };

  return (
    <article className="grid gap-8">
      <header className="grid gap-5 border-b border-natal-border/70 pb-8">
        <a className="nn-button nn-button--quiet -ml-3 w-fit" href={getLocalizedPath(locale, '/learn/foundations/')}>
          ← {message(ui, 'learn.foundations.backToCourse')}
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <span className="nn-badge">{message(ui, 'learn.foundations.lesson')}</span>
          <span className="nn-type-metadata">{positionText}</span>
          <span className="nn-badge" aria-label={progressLabel(ui, state)}>
            {progressLabel(ui, state)}
          </span>
        </div>
        <h1 className="nn-type-page-title">{lesson.title}</h1>

        {contentAvailable && content?.shortDescription ? (
          <p className="nn-type-body max-w-3xl">{content.shortDescription}</p>
        ) : (
          <div className="nn-notice nn-notice--research max-w-3xl" role="status">
            <span>{message(ui, 'learn.foundations.contentUnavailable')}</span>
            {!isEnglishView && locale !== 'en' ? (
              <a
                className="font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4"
                href={`${baseHref}?contentLocale=en`}
              >
                {message(ui, 'learn.foundations.viewEnglish')}
              </a>
            ) : null}
          </div>
        )}

        {isEnglishView && locale !== 'en' ? (
          <p className="nn-notice nn-notice--info max-w-3xl" role="note">
            {message(ui, 'learn.foundations.viewingEnglish')}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <div className="grid gap-6">
          {contentAvailable ? (
            <div className="grid gap-6 rounded-[var(--nn-radius-large)] border border-natal-border/70 bg-natal-surface/40 p-5 sm:p-7">
              <div className="grid gap-2">
                <p className="nn-eyebrow">{message(ui, 'learn.foundations.scaffold')}</p>
                <p className="nn-type-body-small">
                  {message(ui, 'learn.foundations.scaffoldDescription')}
                </p>
              </div>
              {FOUNDATIONS_SECTION_IDS.map((sectionId) => (
                <ContentSection
                  key={sectionId}
                  lesson={lesson}
                  locale={locale}
                  sectionId={sectionId}
                  ui={ui}
                />
              ))}
            </div>
          ) : null}

          <section aria-labelledby="foundations-completion-title" className="nn-surface grid gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="nn-type-card-title" id="foundations-completion-title">
                {message(ui, 'learn.foundations.lesson')}
              </h2>
              <p className="nn-type-numeric" aria-live="polite">{progressText}</p>
            </div>
            <p
              aria-live="polite"
              className={state === 'COMPLETED' ? 'nn-status nn-status--success' : 'nn-status'}
              role="status"
            >
              {progressLabel(ui, state)}
            </p>
            <button className="nn-button nn-button--primary w-fit" onClick={handleCompletionToggle} type="button">
              {state === 'COMPLETED'
                ? message(ui, 'learn.foundations.markIncomplete')
                : message(ui, 'learn.foundations.markComplete')}
            </button>
          </section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-6">
          <section aria-labelledby="foundations-context-title" className="nn-surface grid gap-3 p-5">
            <h2 className="nn-type-card-title" id="foundations-context-title">
              {message(ui, 'learn.foundations.courseProgress')}
            </h2>
            <p className="nn-type-numeric">{progressText}</p>
            <div
              aria-label={message(ui, 'learn.foundations.courseProgress')}
              aria-valuemax={FOUNDATIONS_COURSE.lessonCount}
              aria-valuemin={0}
              aria-valuenow={completedCount}
              className="h-2 overflow-hidden rounded-full bg-natal-border/70"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-natal-accent"
                style={{ width: `${Math.round((completedCount / FOUNDATIONS_COURSE.lessonCount) * 100)}%` }}
              />
            </div>
          </section>
          <p className="nn-notice nn-notice--info" role="note">
            {message(ui, 'learn.foundations.finalCheckComingLater')}
          </p>
        </aside>
      </div>

      <nav aria-label={message(ui, 'learn.foundations.lesson')} className="grid gap-4 border-t border-natal-border/70 pt-8 sm:grid-cols-2">
        {previous ? (
          <a className="nn-surface p-5 transition-colors hover:border-natal-accent" href={lessonHref(locale, previous.slug)}>
            <p className="nn-type-metadata">{message(ui, 'learn.foundations.previousLesson')}</p>
            <p className="nn-type-label mt-2">{previous.title}</p>
          </a>
        ) : <span />}
        {next ? (
          <a className="nn-surface p-5 text-left transition-colors hover:border-natal-accent sm:text-right" href={lessonHref(locale, next.slug)}>
            <p className="nn-type-metadata">{message(ui, 'learn.foundations.nextLesson')}</p>
            <p className="nn-type-label mt-2">{next.title}</p>
          </a>
        ) : null}
      </nav>
    </article>
  );
}
