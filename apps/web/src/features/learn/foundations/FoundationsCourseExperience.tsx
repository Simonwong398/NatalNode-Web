import { useEffect, useState } from 'react';
import { getLocalizedPath, type SupportedLocale } from '../../../lib/localization.js';
import {
  FOUNDATIONS_COURSE,
  FOUNDATIONS_LESSONS,
  getFoundationsContentAvailability,
  getFoundationsContentVariant
} from './registry.js';
import {
  getFoundationsCompletedLessonCount,
  getFoundationsLessonProgressState,
  getFoundationsResumeLessonId,
  readFoundationsProgress,
  type FoundationsProgress,
  type FoundationsProgressState
} from './progress.js';
import type { FoundationsUiMessageKey, FoundationsUiMessages } from './ui.js';

interface FoundationsCourseExperienceProps {
  readonly locale: SupportedLocale;
  readonly ui: FoundationsUiMessages;
}

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

function englishLessonHref(locale: SupportedLocale, slug: string): string {
  return `${lessonHref(locale, slug)}?contentLocale=en`;
}

export default function FoundationsCourseExperience({
  locale,
  ui
}: FoundationsCourseExperienceProps) {
  const [progress, setProgress] = useState<FoundationsProgress>(
    () => readFoundationsProgress(null)
  );
  const completedCount = getFoundationsCompletedLessonCount(progress);
  const resumeLessonId = getFoundationsResumeLessonId(progress);
  const resumeLesson = resumeLessonId === null
    ? null
    : FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === resumeLessonId) ?? null;
  const hasStarted = Object.values(progress.lessons).some(
    (state) => state !== 'NOT_STARTED'
  );
  const progressText = formatMessage(message(ui, 'learn.foundations.progressCount'), {
    completed: completedCount,
    total: FOUNDATIONS_COURSE.lessonCount
  });
  const progressPercentage = Math.round(
    (completedCount / FOUNDATIONS_COURSE.lessonCount) * 100
  );
  const localeHasAvailableScaffold = FOUNDATIONS_LESSONS.every((lesson) =>
    getFoundationsContentAvailability(
      getFoundationsContentVariant(lesson.lessonId, locale)
    ) === 'AVAILABLE'
  );

  useEffect(() => {
    setProgress(readFoundationsProgress());
  }, []);

  return (
    <section aria-labelledby="foundations-course-title" className="grid gap-10">
      <header className="grid gap-5 border-b border-natal-border/70 pb-10">
        <p className="nn-eyebrow">{message(ui, 'learn.foundations.course')}</p>
        <h1 className="nn-type-page-title" id="foundations-course-title">
          {message(ui, 'learn.foundations.title')}
        </h1>
        <p className="nn-type-body max-w-3xl">
          {message(ui, 'learn.foundations.description')}
        </p>
        <p className="nn-type-metadata max-w-3xl">
          {message(ui, 'learn.foundations.browseNote')}
        </p>
      </header>

      <section aria-labelledby="foundations-progress-title" className="nn-surface grid gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="nn-type-section-title" id="foundations-progress-title">
            {message(ui, 'learn.foundations.courseProgress')}
          </h2>
          <p className="nn-type-numeric" aria-live="polite">{progressText}</p>
        </div>
        <div
          aria-label={message(ui, 'learn.foundations.courseProgress')}
          aria-valuemax={FOUNDATIONS_COURSE.lessonCount}
          aria-valuemin={0}
          aria-valuenow={completedCount}
          className="h-2 overflow-hidden rounded-full bg-natal-border/70"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-natal-accent transition-[width] duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {resumeLesson === null ? (
            <span className="nn-button nn-button--secondary" aria-disabled="true">
              {message(ui, 'learn.foundations.courseComplete')}
            </span>
          ) : (
            <a className="nn-button nn-button--primary" href={lessonHref(locale, resumeLesson.slug)}>
              {hasStarted
                ? message(ui, 'learn.foundations.resume')
                : message(ui, 'learn.foundations.start')}
            </a>
          )}
          <span className="nn-badge">
            {localeHasAvailableScaffold
              ? message(ui, 'learn.foundations.available')
              : message(ui, 'learn.foundations.notAvailable')}
          </span>
        </div>
      </section>

      <section aria-labelledby="foundations-lessons-title" className="grid gap-5">
        <div className="grid gap-2">
          <p className="nn-eyebrow">{message(ui, 'learn.foundations.course')}</p>
          <h2 className="nn-type-section-title" id="foundations-lessons-title">
            {message(ui, 'learn.foundations.lessons')}
          </h2>
        </div>

        <ol className="grid gap-4">
          {FOUNDATIONS_LESSONS.map((lesson) => {
            const state = getFoundationsLessonProgressState(progress, lesson.lessonId);
            const variant = getFoundationsContentVariant(lesson.lessonId, locale);
            const contentAvailable = getFoundationsContentAvailability(variant) === 'AVAILABLE';

            return (
              <li key={lesson.lessonId}>
                <article className="nn-surface grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:p-6">
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-natal-border bg-natal-surface text-sm font-semibold text-natal-muted"
                  >
                    {lesson.order}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="nn-type-metadata">
                        {message(ui, 'learn.foundations.lesson')} {lesson.order}
                      </p>
                      <span className="nn-badge" aria-label={progressLabel(ui, state)}>
                        {progressLabel(ui, state)}
                      </span>
                    </div>
                    <h3 className="nn-type-card-title mt-3">
                      <a
                        className="underline decoration-natal-accent/50 underline-offset-4 transition-colors hover:text-natal-accent"
                        href={lessonHref(locale, lesson.slug)}
                      >
                        {lesson.title}
                      </a>
                    </h3>
                    <p className="nn-type-body-small mt-3">
                      {contentAvailable
                        ? lesson.shortDescription
                        : message(ui, 'learn.foundations.contentUnavailable')}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className={contentAvailable ? 'nn-status nn-status--success' : 'nn-status nn-status--research'}>
                        {contentAvailable
                          ? message(ui, 'learn.foundations.available')
                          : message(ui, 'learn.foundations.notAvailable')}
                      </p>
                      {!contentAvailable && locale !== 'en' ? (
                        <a
                          className="font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4 transition-colors hover:text-white"
                          href={englishLessonHref(locale, lesson.slug)}
                        >
                          {message(ui, 'learn.foundations.viewEnglish')}
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <a
                    className="nn-button nn-button--secondary w-full sm:w-auto"
                    href={lessonHref(locale, lesson.slug)}
                  >
                    {state === 'COMPLETED'
                      ? message(ui, 'learn.foundations.completed')
                      : state === 'IN_PROGRESS'
                        ? message(ui, 'learn.foundations.continue')
                        : message(ui, 'learn.foundations.start')}
                  </a>
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="foundations-final-assessment-title" className="nn-surface grid gap-4 p-5 sm:p-6">
        <div className="grid gap-2">
          <p className="nn-eyebrow">{message(ui, 'learn.foundations.finalAssessment')}</p>
          <h2 className="nn-type-section-title" id="foundations-final-assessment-title">
            {message(ui, 'learn.foundations.finalAssessment')}
          </h2>
          <p className="nn-type-body-small max-w-3xl">
            {message(ui, 'learn.foundations.finalAssessmentDescription')}
          </p>
        </div>
        <a
          className="nn-button nn-button--secondary w-fit"
          href={getLocalizedPath(locale, '/learn/foundations/check/')}
        >
          {message(ui, 'learn.foundations.openFinalAssessment')}
        </a>
      </section>
    </section>
  );
}
