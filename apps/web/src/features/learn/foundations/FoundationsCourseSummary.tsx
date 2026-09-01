import { useEffect, useState } from 'react';
import type { FoundationsProgressApiResponse } from '@natalnode/contracts';
import { getLocalizedPath, type SupportedLocale } from '../../../lib/localization.js';
import FoundationsAuthorityStatus from './FoundationsAuthorityStatus.js';
import {
  syncFoundationsProgress,
  type FoundationsAuthoritySyncStatus
} from './authoritative-progress.js';
import {
  FOUNDATIONS_COURSE,
  FOUNDATIONS_LESSONS
} from './registry.js';
import {
  getFoundationsCompletedLessonCount,
  getFoundationsResumeLessonId,
  readFoundationsProgress,
  type FoundationsProgress
} from './progress.js';
import type { FoundationsUiMessageKey, FoundationsUiMessages } from './ui.js';

interface FoundationsCourseSummaryProps {
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

export default function FoundationsCourseSummary({
  locale,
  ui
}: FoundationsCourseSummaryProps) {
  const [progress, setProgress] = useState<FoundationsProgress>(
    () => readFoundationsProgress(null)
  );
  const [authorityStatus, setAuthorityStatus] = useState<FoundationsAuthoritySyncStatus | null>(null);
  const [authoritativeProgress, setAuthoritativeProgress] = useState<FoundationsProgressApiResponse | null>(null);
  const completedCount = getFoundationsCompletedLessonCount(progress);
  const resumeLessonId = getFoundationsResumeLessonId(progress);
  const resumeLesson = resumeLessonId === null
    ? null
    : FOUNDATIONS_LESSONS.find((lesson) => lesson.lessonId === resumeLessonId) ?? null;
  const courseHref = getLocalizedPath(locale, '/learn/foundations/');
  const hasStarted = Object.values(progress.lessons).some(
    (state) => state !== 'NOT_STARTED'
  );
  const resumeHref = resumeLesson === null
    ? courseHref
    : getLocalizedPath(locale, `/learn/foundations/${resumeLesson.slug}/`);
  const progressText = formatMessage(message(ui, 'learn.foundations.progressCount'), {
    completed: completedCount,
    total: FOUNDATIONS_COURSE.lessonCount
  });
  const progressPercentage = Math.round(
    (completedCount / FOUNDATIONS_COURSE.lessonCount) * 100
  );

  useEffect(() => {
    let active = true;
    setProgress(readFoundationsProgress());

    void syncFoundationsProgress()
      .then((result) => {
        if (!active) return;
        setProgress(result.localProgress);
        setAuthorityStatus(result.status);
        setAuthoritativeProgress(result.authoritativeProgress);
      })
      .catch(() => {
        if (!active) return;
        setAuthorityStatus('unavailable');
        setAuthoritativeProgress(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      aria-labelledby="learn-foundations-summary-title"
      className="nn-surface mt-12 grid gap-6 p-5 sm:mt-16 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)] lg:items-end"
    >
      <div>
        <p className="nn-eyebrow">{message(ui, 'learn.foundations.course')}</p>
        <h2 className="nn-type-section-title mt-2" id="learn-foundations-summary-title">
          <a
            className="transition-colors hover:text-natal-accent"
            href={courseHref}
          >
            {message(ui, 'learn.foundations.title')}
          </a>
        </h2>
        <p className="nn-type-body-small mt-3 max-w-3xl">
          {message(ui, 'learn.foundations.description')}
        </p>
        <p className="nn-type-metadata mt-3">
          {message(ui, 'learn.foundations.browseNote')}
        </p>
      </div>

      <div className="grid gap-4 lg:min-w-64">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="nn-type-label">{message(ui, 'learn.foundations.courseProgress')}</p>
            <p className="nn-type-numeric">{progressText}</p>
          </div>
          <div
            aria-label={message(ui, 'learn.foundations.courseProgress')}
            aria-valuemax={FOUNDATIONS_COURSE.lessonCount}
            aria-valuemin={0}
            aria-valuenow={completedCount}
            className="mt-3 h-2 overflow-hidden rounded-full bg-natal-border/70"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-natal-accent transition-[width] duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <a className="nn-button nn-button--primary" href={resumeHref}>
          {resumeLesson === null
            ? message(ui, 'learn.foundations.courseComplete')
            : hasStarted
              ? message(ui, 'learn.foundations.resume')
              : message(ui, 'learn.foundations.start')}
        </a>
        <FoundationsAuthorityStatus
          authoritativeProgress={authoritativeProgress}
          status={authorityStatus}
          ui={ui}
        />
      </div>
    </section>
  );
}
