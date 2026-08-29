import type { CurrentSessionApiResponse } from '@natalnode/contracts';

const SESSION_ENDPOINT = '/api/auth/session';
const GOOGLE_AUTH_FAILURE_HASH = '#google-auth-failed';
const GOOGLE_AUTH_FAILURE_MESSAGE =
  'Google sign-in could not be completed. Try again or use email sign-in.';

export interface GoogleSignInElements {
  readonly emailForm: HTMLFormElement;
  readonly option: HTMLElement;
  readonly failureStatus: HTMLElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrentSessionResponse(
  value: unknown
): value is CurrentSessionApiResponse {
  return (
    isRecord(value) &&
    typeof value.authenticated === 'boolean' &&
    typeof value.googleSignInAvailable === 'boolean'
  );
}

function setGoogleOptionVisibility(
  option: HTMLElement,
  visible: boolean
): void {
  option.hidden = !visible;

  if (visible) {
    option.removeAttribute('aria-hidden');
  } else {
    option.setAttribute('aria-hidden', 'true');
  }
}

function clearFailureMessage(failureStatus: HTMLElement): void {
  failureStatus.hidden = true;
  failureStatus.textContent = '';
}

function initializeFailureMessage(elements: GoogleSignInElements): void {
  if (window.location.hash !== GOOGLE_AUTH_FAILURE_HASH) {
    return;
  }

  elements.failureStatus.textContent = GOOGLE_AUTH_FAILURE_MESSAGE;
  elements.failureStatus.hidden = false;

  const clearOnEmailInteraction = (): void => {
    clearFailureMessage(elements.failureStatus);
    elements.emailForm.removeEventListener('input', clearOnEmailInteraction);
  };

  elements.emailForm.addEventListener('input', clearOnEmailInteraction);
}

async function resolveGoogleSignInAvailability(
  elements: GoogleSignInElements
): Promise<void> {
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
      return;
    }

    const payload: unknown = await response.json();

    if (!isCurrentSessionResponse(payload)) {
      return;
    }

    setGoogleOptionVisibility(
      elements.option,
      !payload.authenticated && payload.googleSignInAvailable
    );
  } catch (_error) {
    // Fail closed: the Email Magic Link action remains available.
  }
}

/** Hydrates the minimal Google sign-in action from server-owned capability state. */
export function initializeGoogleSignIn(
  elements: GoogleSignInElements
): void {
  setGoogleOptionVisibility(elements.option, false);
  initializeFailureMessage(elements);
  void resolveGoogleSignInAvailability(elements);
}
