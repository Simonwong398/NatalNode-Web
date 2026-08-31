import type {
  RequestEmailMagicLinkApiRequest,
  RequestEmailMagicLinkApiResponse
} from '@natalnode/contracts';
import { getDocumentUiMessage } from '../../lib/ui-catalog.js';
import type { UiMessageKey } from '../../lib/ui-catalog.js';

const REQUEST_ENDPOINT = '/api/auth/email/request';
const ACCEPTED_STATUS = 202;
const INVALID_REQUEST_STATUS = 400;

function ui(key: UiMessageKey): string {
  return getDocumentUiMessage(key);
}

export interface EmailMagicLinkRequestElements {
  readonly form: HTMLFormElement;
  readonly emailInput: HTMLInputElement;
  readonly submitButton: HTMLButtonElement;
  readonly statusElement: HTMLElement;
  readonly successElement: HTMLElement;
}

function isAcceptedResponse(
  value: unknown
): value is RequestEmailMagicLinkApiResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return (value as { accepted?: unknown }).accepted === true;
}

function setStatus(statusElement: HTMLElement, message: string): void {
  statusElement.textContent = message;
}

function setInvalidState(elements: EmailMagicLinkRequestElements): void {
  elements.emailInput.setAttribute('aria-invalid', 'true');
  setStatus(elements.statusElement, ui('auth.invalidEmail'));
}

function setFailureState(elements: EmailMagicLinkRequestElements): void {
  setStatus(elements.statusElement, ui('auth.startFailure'));
}

function restoreReadyState(elements: EmailMagicLinkRequestElements): void {
  elements.submitButton.disabled = false;
  elements.submitButton.textContent = ui('auth.sendSignInLink');
}

/** Connects the email sign-in form to the existing request endpoint. */
export function setupEmailMagicLinkRequest(
  elements: EmailMagicLinkRequestElements
): void {
  let isSubmitting = false;

  elements.emailInput.addEventListener('input', () => {
    elements.emailInput.removeAttribute('aria-invalid');
    setStatus(elements.statusElement, '');
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!elements.emailInput.checkValidity()) {
      setInvalidState(elements);
      elements.emailInput.reportValidity();
      return;
    }

    const request: RequestEmailMagicLinkApiRequest = {
      email: elements.emailInput.value
    };

    isSubmitting = true;
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = ui('auth.sendingSignInLink');
    setStatus(elements.statusElement, '');

    void (async () => {
      let succeeded = false;

      try {
        const response = await fetch(REQUEST_ENDPOINT, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request),
          credentials: 'same-origin',
          cache: 'no-store'
        });

        if (response.status === INVALID_REQUEST_STATUS) {
          setInvalidState(elements);
          return;
        }

        if (response.status !== ACCEPTED_STATUS) {
          setFailureState(elements);
          return;
        }

        let payload: unknown;

        try {
          payload = await response.json();
        } catch (_error) {
          setFailureState(elements);
          return;
        }

        if (!isAcceptedResponse(payload)) {
          setFailureState(elements);
          return;
        }

        elements.emailInput.value = '';
        elements.form.hidden = true;
        elements.successElement.hidden = false;
        elements.successElement.focus();
        succeeded = true;
      } catch (_error) {
        setFailureState(elements);
      } finally {
        isSubmitting = false;

        if (!succeeded) {
          restoreReadyState(elements);
        }
      }
    })();
  });
}
