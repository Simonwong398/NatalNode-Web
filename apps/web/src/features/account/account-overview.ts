import type {
  AccountOverviewApiResponse,
  AuthProvider
} from '@natalnode/contracts';
import {
  getLocalizedCurrentPath,
  getPresentationLocale,
  type SupportedLocale
} from '../../lib/localization.js';
import { getDocumentUiMessage } from '../../lib/ui-catalog.js';
import type { UiMessageKey } from '../../lib/ui-catalog.js';

const ACCOUNT_ENDPOINT = '/api/account';
const SIGN_IN_PATH = '/auth/sign-in';

function ui(key: UiMessageKey): string {
  return getDocumentUiMessage(key);
}

export interface AccountOverviewElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly content: HTMLElement;
  readonly error: HTMLElement;
  readonly identity: HTMLElement;
  readonly methods: HTMLElement;
  readonly createdAt: HTMLElement;
  readonly vaultUsage: HTMLElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAuthProvider(value: unknown): value is AuthProvider {
  return value === 'EMAIL_MAGIC_LINK' || value === 'GOOGLE';
}

function isAccountOverviewResponse(value: unknown): value is AccountOverviewApiResponse {
  if (!isRecord(value) || !isRecord(value.account) || !isRecord(value.authentication)) {
    return false;
  }

  if (
    typeof value.account.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.account.createdAt)) ||
    !Array.isArray(value.authentication.methods) ||
    !value.authentication.methods.every(isAuthProvider) ||
    value.authentication.methods.length === 0 ||
    !Array.isArray(value.authentication.emailAddresses) ||
    !value.authentication.emailAddresses.every(
      (email) => typeof email === 'string' && email.length > 0
    ) ||
    !isRecord(value.vaultCapacity)
  ) {
    return false;
  }

  return (
    Number.isSafeInteger(value.vaultCapacity.used) &&
    (value.vaultCapacity.used as number) >= 0 &&
    Number.isSafeInteger(value.vaultCapacity.limit) &&
    (value.vaultCapacity.limit as number) > 0 &&
    value.vaultCapacity.tier === 'FREE' &&
    value.vaultCapacity.proExpansionAvailable === false
  );
}

function setError(elements: AccountOverviewElements): void {
  elements.root.setAttribute('aria-busy', 'false');
  elements.loading.hidden = true;
  elements.content.hidden = true;
  elements.error.hidden = false;
  elements.error.focus();
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

function providerLabel(provider: AuthProvider): string {
  return provider === 'EMAIL_MAGIC_LINK'
    ? ui('account.overview.method.emailMagicLink')
    : ui('account.overview.method.google');
}

function formatCreatedDate(value: string, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(new Date(value));
}

function renderOverview(
  elements: AccountOverviewElements,
  response: AccountOverviewApiResponse,
  locale: SupportedLocale
): void {
  const email = response.authentication.emailAddresses[0];
  const identity = email === undefined
    ? ui('account.overview.identity.google')
    : email;

  elements.identity.textContent = identity;
  elements.methods.textContent = response.authentication.methods
    .map(providerLabel)
    .join(', ');
  elements.createdAt.textContent = formatCreatedDate(response.account.createdAt, locale);
  elements.vaultUsage.textContent = `${response.vaultCapacity.used} / ${response.vaultCapacity.limit}`;
  elements.root.setAttribute('aria-busy', 'false');
  elements.loading.hidden = true;
  elements.error.hidden = true;
  elements.content.hidden = false;
}

async function loadOverview(elements: AccountOverviewElements): Promise<void> {
  try {
    const response = await fetch(ACCOUNT_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status === 401) {
      redirectToSignIn();
      return;
    }

    if (response.status !== 200) {
      setError(elements);
      return;
    }

    const payload: unknown = await response.json();

    if (!isAccountOverviewResponse(payload)) {
      setError(elements);
      return;
    }

    renderOverview(
      elements,
      payload,
      getPresentationLocale(document.documentElement.lang)
    );
  } catch (_error) {
    setError(elements);
  }
}

export function initializeAccountOverview(elements: AccountOverviewElements): void {
  void loadOverview(elements);
}
