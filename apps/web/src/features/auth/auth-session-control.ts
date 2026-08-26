import type {
  CurrentSessionApiResponse,
  LogoutApiResponse
} from '@natalnode/contracts';

const SESSION_ENDPOINT = '/api/auth/session';
const LOGOUT_ENDPOINT = '/api/auth/logout';
const SIGNED_IN_STATUS = 'signedIn';
const SIGNED_OUT_STATUS = 'signedOut';
const LOGOUT_PENDING_STATUS = 'logoutPending';
const LOGOUT_ERROR_STATUS = 'logoutError';
const LOGOUT_LABEL = 'Sign out';
const LOGOUT_PENDING_LABEL = 'Signing out…';
const LOGOUT_FAILURE_MESSAGE = "Couldn't sign out. Please try again.";

type AuthSessionState =
  | 'loading'
  | typeof SIGNED_OUT_STATUS
  | typeof SIGNED_IN_STATUS
  | typeof LOGOUT_PENDING_STATUS
  | typeof LOGOUT_ERROR_STATUS;

export interface AuthSessionControlElements {
  readonly root: HTMLElement;
  readonly signedOutLink: HTMLAnchorElement;
  readonly feedbackLink: HTMLAnchorElement;
  readonly signedInButton: HTMLButtonElement;
  readonly statusElement: HTMLElement;
}

function isCurrentSessionResponse(
  value: unknown
): value is CurrentSessionApiResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return typeof (value as { authenticated?: unknown }).authenticated === 'boolean';
}

function isLogoutResponse(value: unknown): value is LogoutApiResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return (value as { signedOut?: unknown }).signedOut === true;
}

function render(
  elements: AuthSessionControlElements,
  state: AuthSessionState
): void {
  const isSignedOut = state === SIGNED_OUT_STATUS;
  const isSignedIn =
    state === SIGNED_IN_STATUS ||
    state === LOGOUT_PENDING_STATUS ||
    state === LOGOUT_ERROR_STATUS;
  const isLogoutPending = state === LOGOUT_PENDING_STATUS;
  const isLogoutError = state === LOGOUT_ERROR_STATUS;

  elements.root.hidden = state === 'loading';
  elements.root.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  elements.signedOutLink.hidden = !isSignedOut;
  elements.feedbackLink.hidden = !isSignedIn;
  elements.signedInButton.hidden = !isSignedIn;
  elements.signedInButton.disabled = isLogoutPending;
  elements.signedInButton.textContent = isLogoutPending
    ? LOGOUT_PENDING_LABEL
    : LOGOUT_LABEL;
  elements.statusElement.hidden = !isLogoutError;
  elements.statusElement.textContent = isLogoutError ? LOGOUT_FAILURE_MESSAGE : '';
}

async function resolveCurrentSession(
  elements: AuthSessionControlElements,
  setState: (state: AuthSessionState) => void
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

    setState(payload.authenticated ? SIGNED_IN_STATUS : SIGNED_OUT_STATUS);
  } catch (_error) {
    // Keep the control neutral when session status cannot be confirmed.
    render(elements, 'loading');
  }
}

async function requestLogout(
  setState: (state: AuthSessionState) => void
): Promise<void> {
  try {
    const response = await fetch(LOGOUT_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status !== 200) {
      setState(LOGOUT_ERROR_STATUS);
      return;
    }

    const payload: unknown = await response.json();

    if (!isLogoutResponse(payload)) {
      setState(LOGOUT_ERROR_STATUS);
      return;
    }

    window.location.replace('/');
  } catch (_error) {
    setState(LOGOUT_ERROR_STATUS);
  }
}

/** Hydrates the shared auth control from the server-owned session state. */
export function initializeAuthSessionControl(
  elements: AuthSessionControlElements
): void {
  let state: AuthSessionState = 'loading';
  const setState = (nextState: AuthSessionState): void => {
    state = nextState;
    render(elements, state);
  };

  render(elements, state);

  elements.signedInButton.addEventListener('click', () => {
    if (state !== SIGNED_IN_STATUS && state !== LOGOUT_ERROR_STATUS) {
      return;
    }

    setState(LOGOUT_PENDING_STATUS);
    void requestLogout(setState);
  });

  void resolveCurrentSession(elements, setState);
}
