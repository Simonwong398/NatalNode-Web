const SIGN_IN_PATH = '/auth/sign-in';
const READY_BUTTON_LABEL = 'Download your data';
const PENDING_BUTTON_LABEL = 'Preparing your download…';
const PREPARING_MESSAGE = 'Preparing your download…';
const STARTED_MESSAGE =
  "Download request sent. If the file doesn't appear, try again.";
const GENERIC_FAILURE_MESSAGE =
  "We couldn't start your download. Please try again.";
const INVALID_REQUEST_MESSAGE =
  "We couldn't prepare your download. Please try again.";
const RATE_LIMIT_MESSAGE =
  'Please wait a moment before trying your download again.';

type AccountExportErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'RECENT_AUTHENTICATION_REQUIRED'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR';

export interface AccountExportElements {
  readonly accountContent: HTMLElement;
  readonly form: HTMLFormElement;
  readonly submitButton: HTMLButtonElement;
  readonly statusElement: HTMLElement;
  readonly errorStatus: HTMLElement;
  readonly reauthStatus: HTMLElement;
  readonly responseFrame: HTMLIFrameElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAccountExportErrorCode(value: unknown): value is AccountExportErrorCode {
  return (
    value === 'INVALID_REQUEST' ||
    value === 'UNAUTHORIZED' ||
    value === 'RECENT_AUTHENTICATION_REQUIRED' ||
    value === 'RATE_LIMITED' ||
    value === 'FORBIDDEN' ||
    value === 'INTERNAL_ERROR'
  );
}

function clearMessages(elements: AccountExportElements): void {
  elements.statusElement.hidden = true;
  elements.statusElement.textContent = '';
  elements.errorStatus.hidden = true;
  elements.errorStatus.textContent = '';
  elements.reauthStatus.hidden = true;
}

function setPending(elements: AccountExportElements, pending: boolean): void {
  elements.form.setAttribute('aria-busy', String(pending));
  elements.submitButton.disabled = pending;
  elements.submitButton.textContent = pending
    ? PENDING_BUTTON_LABEL
    : READY_BUTTON_LABEL;
}

function showPending(elements: AccountExportElements): void {
  elements.statusElement.textContent = PREPARING_MESSAGE;
  elements.statusElement.hidden = false;
}

function showStarted(elements: AccountExportElements): void {
  elements.statusElement.textContent = STARTED_MESSAGE;
  elements.statusElement.hidden = false;
}

function showGenericFailure(
  elements: AccountExportElements,
  message = GENERIC_FAILURE_MESSAGE
): void {
  elements.statusElement.hidden = true;
  elements.statusElement.textContent = '';
  elements.errorStatus.textContent = message;
  elements.errorStatus.hidden = false;
  elements.errorStatus.focus();
}

function showReauthenticationRequired(elements: AccountExportElements): void {
  elements.statusElement.hidden = true;
  elements.statusElement.textContent = '';
  elements.reauthStatus.hidden = false;
  elements.reauthStatus.focus();
}

function handleErrorCode(
  elements: AccountExportElements,
  code: AccountExportErrorCode
): void {
  if (code === 'UNAUTHORIZED') {
    elements.accountContent.hidden = true;
    window.location.replace(SIGN_IN_PATH);
    return;
  }

  if (code === 'RECENT_AUTHENTICATION_REQUIRED') {
    showReauthenticationRequired(elements);
    return;
  }

  if (code === 'INVALID_REQUEST') {
    showGenericFailure(elements, INVALID_REQUEST_MESSAGE);
    return;
  }

  if (code === 'RATE_LIMITED') {
    showGenericFailure(elements, RATE_LIMIT_MESSAGE);
    return;
  }

  showGenericFailure(elements);
}

interface PreparationResponse {
  readonly status: number;
  readonly code: AccountExportErrorCode | null;
}

async function prepareAccountExport(): Promise<PreparationResponse> {
  const response = await fetch('/api/account/export/prepare', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/problem+json'
    }
  });

  if (response.status === 204) {
    return { status: response.status, code: null };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  return {
    status: response.status,
    code:
      isRecord(payload) && isAccountExportErrorCode(payload.code)
        ? payload.code
        : null
  };
}

function resolvePreparationErrorCode(
  response: PreparationResponse
): AccountExportErrorCode | null {
  if (
    response.code !== null &&
    ((response.code === 'INVALID_REQUEST' && response.status === 400) ||
      (response.code === 'UNAUTHORIZED' && response.status === 401) ||
      (response.code === 'RECENT_AUTHENTICATION_REQUIRED' &&
        response.status === 403) ||
      (response.code === 'FORBIDDEN' && response.status === 403) ||
      (response.code === 'RATE_LIMITED' && response.status === 429) ||
      (response.code === 'INTERNAL_ERROR' && response.status === 500))
  ) {
    return response.code;
  }

  if (response.status === 400) {
    return 'INVALID_REQUEST';
  }

  if (response.status === 401) {
    return 'UNAUTHORIZED';
  }

  if (response.status === 429) {
    return 'RATE_LIMITED';
  }

  return null;
}

/**
 * Performs a readable eligibility check before handing the empty native form to
 * the browser's attachment download machinery. The hidden frame is only the
 * native transfer target; its response is never read by this page.
 */
export function initializeAccountExport(elements: AccountExportElements): void {
  let isInitiating = false;

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (isInitiating) {
      return;
    }

    isInitiating = true;
    clearMessages(elements);
    setPending(elements, true);
    showPending(elements);

    void (async () => {
      try {
        const response = await prepareAccountExport();

        if (response.status === 204) {
          setPending(elements, false);
          isInitiating = false;

          try {
            elements.form.submit();
          } catch (_error) {
            showGenericFailure(elements);
            return;
          }

          showStarted(elements);
          return;
        }

        isInitiating = false;
        setPending(elements, false);
        const code = resolvePreparationErrorCode(response);

        if (code === null) {
          showGenericFailure(elements);
          return;
        }

        handleErrorCode(elements, code);
      } catch (_error) {
        isInitiating = false;
        setPending(elements, false);
        showGenericFailure(elements);
      }
    })();
  });
}
