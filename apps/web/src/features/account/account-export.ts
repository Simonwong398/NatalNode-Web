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

function clearResponseFrame(frame: HTMLIFrameElement): void {
  try {
    frame.contentDocument?.body?.replaceChildren();
  } catch (_error) {
    // The frame is same-origin by construction; stale content is non-authoritative.
  }
}

function readErrorCode(frame: HTMLIFrameElement): AccountExportErrorCode | null {
  try {
    const text = frame.contentDocument?.body?.textContent?.trim();

    if (!text) {
      return null;
    }

    const payload: unknown = JSON.parse(text);

    if (!isRecord(payload) || !isRecord(payload.error)) {
      return null;
    }

    return isAccountExportErrorCode(payload.error.code)
      ? payload.error.code
      : null;
  } catch (_error) {
    return null;
  }
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

/**
 * Connects the account export action to the server's native streamed attachment.
 * The form intentionally keeps the POST body empty; the hidden same-origin frame
 * lets bounded pre-stream JSON errors be handled without navigating the account page.
 */
export function initializeAccountExport(elements: AccountExportElements): void {
  let isInitiating = false;
  let awaitingResponse = false;

  const handleFrameFailure = (code: AccountExportErrorCode | null): void => {
    if (!awaitingResponse || code === null) {
      return;
    }

    awaitingResponse = false;
    isInitiating = false;
    setPending(elements, false);
    handleErrorCode(elements, code);
  };

  elements.responseFrame.addEventListener('load', () => {
    handleFrameFailure(readErrorCode(elements.responseFrame));
  });

  elements.responseFrame.addEventListener('error', () => {
    if (!awaitingResponse) {
      return;
    }

    awaitingResponse = false;
    isInitiating = false;
    setPending(elements, false);
    showGenericFailure(elements);
  });

  elements.form.addEventListener('submit', (event) => {
    if (isInitiating) {
      event.preventDefault();
      return;
    }

    isInitiating = true;
    awaitingResponse = true;
    clearMessages(elements);
    clearResponseFrame(elements.responseFrame);
    setPending(elements, true);
    showPending(elements);

    // Preserve the browser's native form submission, while blocking duplicate
    // submit events raised in the same turn before the browser takes the request.
    void Promise.resolve().then(() => {
      if (!isInitiating) {
        return;
      }

      isInitiating = false;
      setPending(elements, false);
      showStarted(elements);
    });
  });
}
