import type {
  CompleteEmailMagicLinkApiRequest,
  CompleteEmailMagicLinkApiResponse
} from '@natalnode/contracts';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import { getDocumentUiMessage } from '../../lib/ui-catalog.js';

const COMPLETE_ENDPOINT = '/api/auth/email/complete';
const SUCCESS_REDIRECT_PATH = '/';

/** Extracts one non-empty token from the URL fragment without trimming it. */
export function extractMagicLinkToken(hash: string): string | null {
  const fragment = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const tokens = fragment.getAll('token');

  if (tokens.length !== 1 || tokens[0] === '') {
    return null;
  }

  return tokens[0];
}

function setFailure(statusElement: HTMLElement): void {
  statusElement.textContent = getDocumentUiMessage('auth.invalidMagicLink');
}

function isSuccessfulCompletion(
  payload: unknown
): payload is CompleteEmailMagicLinkApiResponse {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return false;
  }

  return (payload as { authenticated?: unknown }).authenticated === true;
}

/** Performs the one-shot browser handoff after removing the fragment. */
export async function completeEmailMagicLink(statusElement: HTMLElement): Promise<void> {
  let token: string | null;

  try {
    token = extractMagicLinkToken(window.location.hash);
  } catch (_error) {
    token = null;
  }

  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch (_error) {
    setFailure(statusElement);
    return;
  }

  if (token === null) {
    setFailure(statusElement);
    return;
  }

  const request: CompleteEmailMagicLinkApiRequest = { token };

  try {
    const response = await fetch(COMPLETE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status !== 200) {
      setFailure(statusElement);
      return;
    }

    const payload: unknown = await response.json();

    if (!isSuccessfulCompletion(payload)) {
      setFailure(statusElement);
      return;
    }

    window.location.replace(
      getLocalizedCurrentPath(window.location.pathname, SUCCESS_REDIRECT_PATH)
    );
  } catch (_error) {
    setFailure(statusElement);
  }
}
