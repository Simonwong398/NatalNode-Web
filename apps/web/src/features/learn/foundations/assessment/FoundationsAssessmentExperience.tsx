import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  scoreFoundationsAssessment,
  type AssessmentAnswerId,
  type FoundationsAssessment,
  type FoundationsAssessmentResult
} from './assessment-contract.js';

interface FoundationsAssessmentExperienceProps {
  readonly assessment: FoundationsAssessment;
}

const ASSESSMENT_UI = {
  answerPrompt: 'Choose one answer for each question.',
  answered: 'answered',
  correctAnswer: 'Correct answer',
  assessmentNotSaved: 'This browser-only result is not saved and does not establish reward or account status.',
  pass: 'PASS',
  notPassed: 'NOT PASSED',
  scorePrefix: 'You scored',
  threshold: 'Pass threshold',
  submit: 'Submit assessment',
  retry: 'Retry assessment',
  yourAnswer: 'Your answer'
} as const;

function createEmptyAnswers(assessment: FoundationsAssessment): Record<string, AssessmentAnswerId | null> {
  return Object.fromEntries(
    assessment.questions.map((question) => [question.id, null])
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
  assessment
}: FoundationsAssessmentExperienceProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswerId | null>>(
    () => createEmptyAnswers(assessment)
  );
  const [result, setResult] = useState<FoundationsAssessmentResult | null>(null);
  const submitted = result !== null;
  const answeredCount = Object.values(answers).filter((answer) => answer !== null).length;

  useEffect(() => {
    if (result !== null) {
      resultRef.current?.focus();
    }
  }, [result]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(scoreFoundationsAssessment(assessment, answers));
  };

  const handleRetry = () => {
    setAnswers(createEmptyAnswers(assessment));
    setResult(null);
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    });
  };

  return (
    <section
      aria-labelledby="foundations-final-assessment-title"
      className="grid gap-8"
      data-assessment-runtime="foundations.v1.final_check"
    >
      <header className="grid gap-4">
        <p className="nn-eyebrow">Foundations V1</p>
        <h1 className="nn-type-page-title" id="foundations-final-assessment-title">
          {assessment.title}
        </h1>
        <p className="nn-type-body max-w-3xl">{assessment.introduction}</p>
        <p className="nn-notice nn-notice--info max-w-3xl" id="assessment-boundary" role="note">
          {ASSESSMENT_UI.assessmentNotSaved}
        </p>
      </header>

      <form
        ref={formRef}
        aria-describedby="assessment-instructions assessment-boundary"
        className="grid gap-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-nn-border-subtle pb-4">
          <p className="nn-type-label" id="assessment-instructions">
            {ASSESSMENT_UI.answerPrompt}
          </p>
          <p aria-live="polite" className="nn-type-numeric">
            {answeredCount}/{assessment.questionCount} {ASSESSMENT_UI.answered}
          </p>
        </div>

        <ol className="grid gap-5">
          {assessment.questions.map((question) => {
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
                      Question {question.number} of {assessment.questionCount}
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
                              <span className="nn-type-metadata text-nn-status-success">{ASSESSMENT_UI.correctAnswer}</span>
                            ) : null}
                            {submitted && isSelected && !isCorrect ? (
                              <span className="nn-type-metadata text-nn-status-error">{ASSESSMENT_UI.yourAnswer}</span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {submitted ? (
                    <div className="rounded-nn-medium border border-nn-border-subtle bg-nn-surface-elevated p-4" role="note">
                      <p className="nn-type-label">Explanation</p>
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
            {ASSESSMENT_UI.submit}
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
            <h2 className="nn-type-section-title">{result.passed ? ASSESSMENT_UI.pass : ASSESSMENT_UI.notPassed}</h2>
            <p className="nn-type-numeric">
              {ASSESSMENT_UI.scorePrefix} {result.score} / {result.questionCount}
            </p>
          </div>
          <p className="nn-type-body-small">
            {ASSESSMENT_UI.threshold}: {result.passThreshold} / {result.questionCount}. {ASSESSMENT_UI.assessmentNotSaved}
          </p>
          <button className="nn-button nn-button--secondary w-fit" onClick={handleRetry} type="button">
            {ASSESSMENT_UI.retry}
          </button>
        </div>
      ) : null}
    </section>
  );
}
