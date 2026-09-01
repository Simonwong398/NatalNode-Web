import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  scoreFoundationsAssessment,
  type AssessmentAnswerId,
  type FoundationsAssessment,
  type FoundationsAssessmentResult
} from './assessment-contract.js';
import {
  type FoundationsUiMessageKey,
  type FoundationsUiMessages
} from '../ui.js';
import { type SupportedLocale } from '../../../../lib/localization.js';

interface FoundationsAssessmentExperienceProps {
  readonly assessment: FoundationsAssessment | null;
  readonly englishAssessment: FoundationsAssessment | null;
  readonly locale: SupportedLocale;
  readonly showEnglishContent?: boolean;
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

function createEmptyAnswers(
  assessment: FoundationsAssessment | null
): Record<string, AssessmentAnswerId | null> {
  return Object.fromEntries(
    assessment?.questions.map((question) => [question.id, null]) ?? []
  ) as Record<string, AssessmentAnswerId | null>;
}

function optionClassName(
  submitted: boolean,
  selected: boolean,
  correct: boolean
): string {
  if (submitted && correct) {
    return 'border-nn-status-success bg-nn-status-success/10';
  }

  if (submitted && selected) {
    return 'border-nn-status-error bg-nn-status-error/10';
  }

  if (selected) {
    return 'border-nn-accent-primary bg-nn-accent-primary/10';
  }

  return 'border-nn-border-default bg-nn-surface-base hover:border-nn-accent-supporting';
}

export default function FoundationsAssessmentExperience({
  assessment,
  englishAssessment,
  locale,
  showEnglishContent = false,
  ui
}: FoundationsAssessmentExperienceProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isEnglishView, setIsEnglishView] = useState(
    showEnglishContent || locale === 'en'
  );
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswerId | null>>(
    () => createEmptyAnswers(assessment)
  );
  const [result, setResult] = useState<FoundationsAssessmentResult | null>(null);
  const selectedAssessment = isEnglishView ? englishAssessment : assessment;
  const submitted = result !== null;
  const answeredCount = Object.values(answers).filter((answer) => answer !== null).length;

  useEffect(() => {
    if (locale === 'en') return;

    const requestedContentLocale = new URLSearchParams(window.location.search).get(
      'contentLocale'
    );
    setIsEnglishView(showEnglishContent || requestedContentLocale === 'en');
  }, [locale, showEnglishContent]);

  useEffect(() => {
    setAnswers(createEmptyAnswers(selectedAssessment));
    setResult(null);
  }, [selectedAssessment]);

  useEffect(() => {
    if (result !== null) {
      resultRef.current?.focus();
    }
  }, [result]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedAssessment === null) return;

    setResult(scoreFoundationsAssessment(selectedAssessment, answers));
  };

  const handleRetry = () => {
    setAnswers(createEmptyAnswers(selectedAssessment));
    setResult(null);
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    });
  };

  if (selectedAssessment === null) {
    return (
      <section
        aria-labelledby="foundations-final-assessment-title"
        className="grid gap-8"
        data-assessment-content-locale={locale}
      >
        <header className="grid gap-4">
          <p className="nn-eyebrow">{message(ui, 'learn.foundations.finalAssessment')}</p>
          <h1 className="nn-type-page-title" id="foundations-final-assessment-title">
            {message(ui, 'learn.foundations.finalAssessment')}
          </h1>
          <p className="nn-type-body max-w-3xl">
            {message(ui, 'learn.foundations.finalAssessmentDescription')}
          </p>
          <p className="nn-notice nn-notice--research max-w-3xl" role="status">
            {message(ui, 'learn.foundations.finalAssessmentUnavailable')}
            {locale !== 'en' ? (
              <>
                {' '}
                <a
                  className="font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4"
                  href="?contentLocale=en"
                >
                  {message(ui, 'learn.foundations.viewEnglish')}
                </a>
              </>
            ) : null}
          </p>
        </header>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="foundations-final-assessment-title"
      className="grid gap-8"
      data-assessment-content-locale={selectedAssessment.locale}
      data-assessment-runtime={selectedAssessment.checkId}
    >
      <header className="grid gap-4">
        <p className="nn-eyebrow">{message(ui, 'learn.foundations.finalAssessment')}</p>
        <h1 className="nn-type-page-title" id="foundations-final-assessment-title">
          {selectedAssessment.title}
        </h1>
        <p className="nn-type-body max-w-3xl">{selectedAssessment.introduction}</p>
        <p className="nn-notice nn-notice--info max-w-3xl" id="assessment-boundary" role="note">
          {message(ui, 'learn.foundations.assessment.assessmentNotSaved')}
        </p>
        {isEnglishView && locale !== 'en' ? (
          <p className="nn-notice nn-notice--info max-w-3xl" role="note">
            {message(ui, 'learn.foundations.viewingEnglish')}
          </p>
        ) : null}
      </header>

      <form
        ref={formRef}
        aria-describedby="assessment-instructions assessment-boundary"
        className="grid gap-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-nn-border-subtle pb-4">
          <p className="nn-type-label" id="assessment-instructions">
            {message(ui, 'learn.foundations.assessment.answerPrompt')}
          </p>
          <p aria-live="polite" className="nn-type-numeric">
            {answeredCount}/{selectedAssessment.questionCount} {message(ui, 'learn.foundations.assessment.answered')}
          </p>
        </div>

        <ol className="grid gap-5">
          {selectedAssessment.questions.map((question) => {
            const selectedAnswer = answers[question.id];
            const resultAnswer = result?.answers[question.id] ?? selectedAnswer;

            return (
              <li key={question.id}>
                <fieldset
                  className="grid gap-4 rounded-nn-large border border-nn-border-subtle bg-nn-surface-base p-5 sm:p-6"
                  disabled={submitted}
                >
                  <legend className="grid gap-2 text-left">
                    <span className="nn-type-metadata">
                      {formatMessage(message(ui, 'learn.foundations.assessment.questionProgress'), {
                        current: question.number,
                        total: selectedAssessment.questionCount
                      })}
                    </span>
                    <span className="nn-type-card-title">{question.prompt}</span>
                  </legend>

                  <div className="grid gap-3">
                    {question.options.map((option) => {
                      const isSelected = resultAnswer === option.id;
                      const isCorrect = option.id === question.correctAnswerId;

                      return (
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-nn-medium border p-4 transition-colors ${optionClassName(submitted, isSelected, isCorrect)}`}
                          key={option.id}
                        >
                          <input
                            checked={selectedAnswer === option.id}
                            className="mt-1 h-4 w-4 shrink-0 accent-[var(--nn-accent-primary)]"
                            name={question.id}
                            onChange={() => {
                              setAnswers((current) => ({ ...current, [question.id]: option.id }));
                            }}
                            required
                            type="radio"
                            value={option.id}
                          />
                          <span className="grid gap-1">
                            <span className="font-semibold">{option.id}.</span>
                            <span className="nn-type-body-small">{option.text}</span>
                            {submitted && isCorrect ? (
                              <span className="nn-type-metadata text-nn-status-success">
                                {message(ui, 'learn.foundations.assessment.correctAnswer')}
                              </span>
                            ) : null}
                            {submitted && isSelected && !isCorrect ? (
                              <span className="nn-type-metadata text-nn-status-error">
                                {message(ui, 'learn.foundations.assessment.yourAnswer')}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {submitted ? (
                    <div className="rounded-nn-medium border border-nn-border-subtle bg-nn-surface-elevated p-4" role="note">
                      <p className="nn-type-label">
                        {message(ui, 'learn.foundations.assessment.explanation')}
                      </p>
                      <p className="nn-type-body-small mt-2">{question.rationale}</p>
                    </div>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {!submitted ? (
          <button className="nn-button nn-button--primary w-fit" type="submit">
            {message(ui, 'learn.foundations.assessment.submit')}
          </button>
        ) : null}
      </form>

      {result ? (
        <div
          ref={resultRef}
          aria-live="polite"
          className={`grid gap-4 rounded-nn-large border p-5 sm:p-6 ${result.passed ? 'border-nn-status-success bg-nn-status-success/10' : 'border-nn-status-warning bg-nn-status-warning/10'}`}
          tabIndex={-1}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="nn-type-section-title">
              {result.passed
                ? message(ui, 'learn.foundations.assessment.pass')
                : message(ui, 'learn.foundations.assessment.notPassed')}
            </h2>
            <p className="nn-type-numeric">
              {message(ui, 'learn.foundations.assessment.scorePrefix')} {result.score} / {result.questionCount}
            </p>
          </div>
          <p className="nn-type-body-small">
            {message(ui, 'learn.foundations.assessment.threshold')}: {result.passThreshold} / {result.questionCount}.{' '}
            {message(ui, 'learn.foundations.assessment.assessmentNotSaved')}
          </p>
          <button className="nn-button nn-button--secondary w-fit" onClick={handleRetry} type="button">
            {message(ui, 'learn.foundations.assessment.retry')}
          </button>
        </div>
      ) : null}
    </section>
  );
}
