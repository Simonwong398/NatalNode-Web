import type { CurrentSessionApiResponse } from '@natalnode/contracts';

const SESSION_ENDPOINT = '/api/auth/session';
const ACCOUNT_ENDPOINT = '/api/account';
const SIGN_IN_PATH = '/auth/sign-in';
const HOME_PATH = '/';
const CONFIRMATION_PHRASE = 'DELETE';
const INVALID_REQUEST_MESSAGE =
  "We couldn't process that confirmation. Close this section and try again.";
const DELETION_FAILURE_MESSAGE =
  "We couldn't confirm that account deletion completed. No successful deletion was confirmed. Check your session before trying again.";

export interface AccountDeletionElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly sessionError: HTMLElement;
  readonly accountContent: HTMLElement;
  readonly openButton: HTMLButtonElement;
  readonly confirmationRegion: HTMLElement;
  readonly form: HTMLFormElement;
  readonly confirmationInput: HTMLInputElement;
  readonly cancelButton: HTMLButtonElement;
  readonly submitButton: HTMLButtonElement;
  readonly pendingStatus: HTMLElement;
  readonly errorStatus: HTMLElement;
  readonly reauthStatus: HTMLElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrentSessionResponse(value: unknown): value is CurrentSessionApiResponse {
  return isRecord(value) && typeof value.authenticated === 'boolean';
}

function isRecentAuthenticationRequiredResponse(value: unknown): boolean {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    value.error.code === 'RECENT_AUTHENTICATION_REQUIRED'
  );
}

function setSessionError(elements: AccountDeletionElements): void {
  elements.root.setAttribute('aria-busy', 'false');
  elements.loading.hidden = true;
  elements.accountContent.hidden = true;
  elements.sessionError.hidden = false;
  elements.sessionError.focus();
}

function redirectToSignIn(elements: AccountDeletionElements): void {
  elements.accountContent.hidden = true;
  window.location.replace(SIGN_IN_PATH);
}

async function resolveSession(elements: AccountDeletionElements): Promise<void> {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status === 401) {
      redirectToSignIn(elements);
      return;
    }

    if (response.status !== 200) {
      setSessionError(elements);
      return;
    }

    const payload: unknown = await response.json();

    if (!isCurrentSessionResponse(payload)) {
      setSessionError(elements);
      return;
    }

    if (!payload.authenticated) {
      redirectToSignIn(elements);
      return;
    }

    elements.root.setAttribute('aria-busy', 'false');
    elements.loading.hidden = true;
    elements.sessionError.hidden = true;
    elements.accountContent.hidden = false;
  } catch (_error) {
    setSessionError(elements);
  }
}

function clearMessages(elements: AccountDeletionElements): void {
  elements.confirmationInput.removeAttribute('aria-invalid');
  elements.errorStatus.hidden = true;
  elements.errorStatus.textContent = '';
  elements.reauthStatus.hidden = true;
}

function updateSubmitAvailability(
  elements: AccountDeletionElements,
  blockedByReauthentication = false
): void {
  elements.submitButton.disabled =
    blockedByReauthentication || elements.confirmationInput.value !== CONFIRMATION_PHRASE;
}

function setPending(elements: AccountDeletionElements, pending: boolean): void {
  elements.form.setAttribute('aria-busy', String(pending));
  elements.openButton.disabled = pending;
  elements.confirmationInput.disabled = pending;
  elements.cancelButton.disabled = pending;
  elements.pendingStatus.hidden = !pending;
  elements.submitButton.textContent = pending
    ? 'Deleting account…'
    : 'Delete account permanently';

  if (pending) {
    elements.submitButton.disabled = true;
  } else {
    updateSubmitAvailability(elements);
  }
}

function openConfirmation(elements: AccountDeletionElements): void {
  clearMessages(elements);
  elements.form.reset();
  elements.confirmationInput.disabled = false;
  elements.cancelButton.disabled = false;
  elements.confirmationRegion.hidden = false;
  elements.openButton.setAttribute('aria-expanded', 'true');
  updateSubmitAvailability(elements);
  elements.confirmationInput.focus();
}

function closeConfirmation(elements: AccountDeletionElements): void {
  elements.form.reset();
  elements.form.setAttribute('aria-busy', 'false');
  elements.confirmationInput.disabled = false;
  elements.cancelButton.disabled = false;
  elements.openButton.disabled = false;
  elements.pendingStatus.hidden = true;
  clearMessages(elements);
  updateSubmitAvailability(elements);
  elements.confirmationRegion.hidden = true;
  elements.openButton.setAttribute('aria-expanded', 'false');
  elements.openButton.focus();
}

function showError(elements: AccountDeletionElements, message: string): void {
  elements.errorStatus.textContent = message;
  elements.errorStatus.hidden = false;
  elements.errorStatus.focus();
}

function showInvalidRequest(elements: AccountDeletionElements): void {
  elements.confirmationInput.setAttribute('aria-invalid', 'true');
  elements.submitButton.disabled = true;
  showError(elements, INVALID_REQUEST_MESSAGE);
}

function showReauthenticationRequired(elements: AccountDeletionElements): void {
  elements.confirmationInput.disabled = true;
  elements.submitButton.disabled = true;
  elements.reauthStatus.hidden = false;
  elements.reauthStatus.focus();
}

async function deleteAccount(elements: AccountDeletionElements): Promise<void> {
  if (elements.confirmationInput.value !== CONFIRMATION_PHRASE) {
    updateSubmitAvailability(elements);
    return;
  }

  clearMessages(elements);
  setPending(elements, true);

  try {
    const response = await fetch(ACCOUNT_ENDPOINT, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ confirmation: CONFIRMATION_PHRASE })
    });

    if (response.status === 204) {
      elements.accountContent.hidden = true;
      window.location.replace(HOME_PATH);
      return;
    }

    if (response.status === 401) {
      redirectToSignIn(elements);
      return;
    }

    if (response.status === 403) {
      let payload: unknown;

      try {
        payload = await response.json();
      } catch (_error) {
        setPending(elements, false);
        showError(elements, DELETION_FAILURE_MESSAGE);
        return;
      }

      setPending(elements, false);

      if (isRecentAuthenticationRequiredResponse(payload)) {
        showReauthenticationRequired(elements);
      } else {
        showError(elements, DELETION_FAILURE_MESSAGE);
      }
      return;
    }

    setPending(elements, false);

    if (response.status === 400) {
      showInvalidRequest(elements);
      return;
    }

    showError(elements, DELETION_FAILURE_MESSAGE);
  } catch (_error) {
    setPending(elements, false);
    showError(elements, DELETION_FAILURE_MESSAGE);
  }
}

/** Activates the authenticated, destructive account-lifecycle surface. */
export function initializeAccountDeletion(elements: AccountDeletionElements): void {
  elements.openButton.addEventListener('click', () => {
    openConfirmation(elements);
  });

  elements.confirmationInput.addEventListener('input', () => {
    clearMessages(elements);
    updateSubmitAvailability(elements);
  });

  elements.cancelButton.addEventListener('click', () => {
    closeConfirmation(elements);
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (elements.form.getAttribute('aria-busy') === 'true') {
      return;
    }

    void deleteAccount(elements);
  });

  void resolveSession(elements);
}
