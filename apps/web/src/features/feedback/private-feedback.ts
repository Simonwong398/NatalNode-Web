import type {
  CreateFeedbackApiRequest,
  CreateFeedbackApiResponse,
  CurrentSessionApiResponse,
  FeedbackCategory
} from '@natalnode/contracts';

const SESSION_ENDPOINT = '/api/auth/session';
const FEEDBACK_ENDPOINT = '/api/feedback';
const SIGN_IN_PATH = '/auth/sign-in';
const MESSAGE_MINIMUM_CHARACTERS = 10;
const MESSAGE_MAXIMUM_CHARACTERS = 5_000;
const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = [
  'BUG',
  'SUGGESTION',
  'CALCULATION_CONCERN',
  'OTHER'
];

const SESSION_FAILURE_MESSAGE =
  "We couldn't confirm your session. Refresh the page and try again.";
const SUBMISSION_FAILURE_MESSAGE =
  "We couldn't send your feedback. Your message is still here; please try again.";
const RATE_LIMIT_MESSAGE =
  'You have sent several feedback messages recently. Please wait and try again later.';

export interface PrivateFeedbackElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly sessionError: HTMLElement;
  readonly formContainer: HTMLElement;
  readonly form: HTMLFormElement;
  readonly category: HTMLSelectElement;
  readonly categoryError: HTMLElement;
  readonly message: HTMLTextAreaElement;
  readonly messageCount: HTMLElement;
  readonly messageError: HTMLElement;
  readonly submit: HTMLButtonElement;
  readonly submissionError: HTMLElement;
  readonly success: HTMLElement;
  readonly submitAnother: HTMLButtonElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrentSessionResponse(value: unknown): value is CurrentSessionApiResponse {
  return isRecord(value) && typeof value.authenticated === 'boolean';
}

function isCreateFeedbackResponse(value: unknown): value is CreateFeedbackApiResponse {
  return isRecord(value) && value.submitted === true;
}

function isFeedbackCategory(value: string): value is FeedbackCategory {
  return FEEDBACK_CATEGORIES.some((category) => category === value);
}

function normalizeMessageForCount(message: string): string {
  return message.replace(/\r\n?/gu, '\n').trim();
}

function getMessageCharacterCount(message: string): number {
  return Array.from(normalizeMessageForCount(message)).length;
}

function setFieldError(
  control: HTMLSelectElement | HTMLTextAreaElement,
  errorElement: HTMLElement,
  message: string | null
): void {
  if (message === null) {
    control.removeAttribute('aria-invalid');
    errorElement.hidden = true;
    errorElement.textContent = '';
    return;
  }

  control.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearSubmissionError(elements: PrivateFeedbackElements): void {
  elements.submissionError.hidden = true;
  elements.submissionError.textContent = '';
}

function clearValidationErrors(elements: PrivateFeedbackElements): void {
  setFieldError(elements.category, elements.categoryError, null);
  setFieldError(elements.message, elements.messageError, null);
}

function updateCharacterCount(elements: PrivateFeedbackElements): void {
  const count = getMessageCharacterCount(elements.message.value);
  elements.messageCount.textContent = `${count.toLocaleString()} / 5,000 characters`;
}

function validateForm(elements: PrivateFeedbackElements): CreateFeedbackApiRequest | null {
  clearValidationErrors(elements);

  const category = elements.category.value;
  const characterCount = getMessageCharacterCount(elements.message.value);
  let firstInvalidControl: HTMLSelectElement | HTMLTextAreaElement | null = null;

  if (!isFeedbackCategory(category)) {
    setFieldError(
      elements.category,
      elements.categoryError,
      'Choose a feedback category.'
    );
    firstInvalidControl = elements.category;
  }

  if (characterCount < MESSAGE_MINIMUM_CHARACTERS) {
    setFieldError(
      elements.message,
      elements.messageError,
      'Enter at least 10 characters.'
    );
    firstInvalidControl ??= elements.message;
  } else if (characterCount > MESSAGE_MAXIMUM_CHARACTERS) {
    setFieldError(
      elements.message,
      elements.messageError,
      'Keep your message to 5,000 characters or fewer.'
    );
    firstInvalidControl ??= elements.message;
  }

  if (firstInvalidControl !== null || !isFeedbackCategory(category)) {
    firstInvalidControl?.focus();
    return null;
  }

  return {
    category,
    message: elements.message.value
  };
}

function setSubmitting(elements: PrivateFeedbackElements, submitting: boolean): void {
  elements.form.setAttribute('aria-busy', String(submitting));
  elements.submit.disabled = submitting;
  elements.submit.textContent = submitting ? 'Sending…' : 'Send feedback';
}

function showSubmissionError(
  elements: PrivateFeedbackElements,
  message: string
): void {
  elements.submissionError.textContent = message;
  elements.submissionError.hidden = false;
  elements.submissionError.focus();
}

function showSessionError(elements: PrivateFeedbackElements): void {
  elements.root.setAttribute('aria-busy', 'false');
  elements.loading.hidden = true;
  elements.formContainer.hidden = true;
  elements.sessionError.textContent = SESSION_FAILURE_MESSAGE;
  elements.sessionError.hidden = false;
  elements.sessionError.focus();
}

function showAuthenticatedForm(elements: PrivateFeedbackElements): void {
  elements.root.setAttribute('aria-busy', 'false');
  elements.loading.hidden = true;
  elements.sessionError.hidden = true;
  elements.formContainer.hidden = false;
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

async function resolveSession(elements: PrivateFeedbackElements): Promise<void> {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status !== 200) {
      showSessionError(elements);
      return;
    }

    const payload: unknown = await response.json();

    if (!isCurrentSessionResponse(payload)) {
      showSessionError(elements);
      return;
    }

    if (!payload.authenticated) {
      redirectToSignIn();
      return;
    }

    showAuthenticatedForm(elements);
  } catch (_error) {
    showSessionError(elements);
  }
}

async function submitFeedback(elements: PrivateFeedbackElements): Promise<void> {
  clearSubmissionError(elements);
  const request = validateForm(elements);

  if (request === null) {
    return;
  }

  setSubmitting(elements, true);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(request)
    });

    if (response.status === 401) {
      redirectToSignIn();
      return;
    }

    if (response.status === 400) {
      setFieldError(
        elements.message,
        elements.messageError,
        'Review your message and try again.'
      );
      elements.message.focus();
      return;
    }

    if (response.status === 429) {
      showSubmissionError(elements, RATE_LIMIT_MESSAGE);
      return;
    }

    if (response.status !== 201) {
      showSubmissionError(elements, SUBMISSION_FAILURE_MESSAGE);
      return;
    }

    const payload: unknown = await response.json();

    if (!isCreateFeedbackResponse(payload)) {
      showSubmissionError(elements, SUBMISSION_FAILURE_MESSAGE);
      return;
    }

    elements.message.value = '';
    updateCharacterCount(elements);
    elements.formContainer.hidden = true;
    elements.success.hidden = false;
    elements.success.focus();
  } catch (_error) {
    showSubmissionError(elements, SUBMISSION_FAILURE_MESSAGE);
  } finally {
    setSubmitting(elements, false);
  }
}

function resetForAnotherSubmission(elements: PrivateFeedbackElements): void {
  elements.form.reset();
  clearValidationErrors(elements);
  clearSubmissionError(elements);
  updateCharacterCount(elements);
  elements.success.hidden = true;
  elements.formContainer.hidden = false;
  elements.category.focus();
}

/** Activates the authenticated, create-only private Feedback page. */
export function initializePrivateFeedback(elements: PrivateFeedbackElements): void {
  updateCharacterCount(elements);

  elements.message.addEventListener('input', () => {
    updateCharacterCount(elements);

    if (elements.message.hasAttribute('aria-invalid')) {
      setFieldError(elements.message, elements.messageError, null);
    }
  });

  elements.category.addEventListener('change', () => {
    if (elements.category.hasAttribute('aria-invalid')) {
      setFieldError(elements.category, elements.categoryError, null);
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitFeedback(elements);
  });

  elements.submitAnother.addEventListener('click', () => {
    resetForAnotherSubmission(elements);
  });

  void resolveSession(elements);
}
