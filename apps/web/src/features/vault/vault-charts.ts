import type {
  CurrentSessionApiResponse,
  VaultChartCategory,
  VaultChartRecord,
  VaultCapacity,
  VaultRecordOrigin,
  VaultScientificStatus
} from '@natalnode/contracts';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import {
  formatDocumentUiMessage,
  getDocumentUiMessage
} from '../../lib/ui-catalog.js';

const SESSION_ENDPOINT = '/api/auth/session';
const VAULT_CHARTS_ENDPOINT = '/api/vault/charts';
const SIGN_IN_PATH = '/auth/sign-in';
const VAULT_CHART_CATEGORIES: readonly VaultChartCategory[] = [
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'CLIENT'
];

type VaultChartListItem = Pick<
  VaultChartRecord,
  'chartId' | 'displayName' | 'category' | 'createdAt'
> & {
  readonly recordOrigin?: VaultRecordOrigin;
  readonly scientificStatus?: VaultScientificStatus;
};

interface VaultChartCollectionResponse {
  readonly charts: readonly VaultChartListItem[];
  readonly nextCursor: string | null;
  readonly capacity?: VaultCapacity;
}

type VaultPageState = 'loading' | 'loaded' | 'empty' | 'error';

export interface VaultPageElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly error: HTMLElement;
  readonly empty: HTMLElement;
  readonly list: HTMLUListElement;
  readonly capacity: HTMLElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrentSessionResponse(
  value: unknown
): value is CurrentSessionApiResponse {
  return (
    isRecord(value) &&
    typeof value.authenticated === 'boolean'
  );
}

function isVaultChartCategory(value: unknown): value is VaultChartCategory {
  return VAULT_CHART_CATEGORIES.some((category) => category === value);
}

function isVaultChartListItem(value: unknown): value is VaultChartListItem {
  return (
    isRecord(value) &&
    typeof value.chartId === 'string' &&
    value.chartId.length > 0 &&
      typeof value.displayName === 'string' &&
      isVaultChartCategory(value.category) &&
      typeof value.createdAt === 'string' &&
      (value.recordOrigin === undefined ||
        value.recordOrigin === 'USER_INPUT' ||
        value.recordOrigin === 'DEVELOPMENT_FIXTURE') &&
      (value.scientificStatus === undefined ||
      value.scientificStatus === 'INPUT_ONLY' ||
      value.scientificStatus === 'CHART_RESULT_AVAILABLE')
  );
}

function isVaultCapacity(value: unknown): value is VaultCapacity {
  return (
    isRecord(value) &&
    typeof value.used === 'number' &&
    Number.isSafeInteger(value.used) &&
    value.used >= 0 &&
    value.used <= 3 &&
    value.limit === 3 &&
    value.tier === 'FREE' &&
    value.proExpansionAvailable === false
  );
}

function isVaultChartCollectionResponse(
  value: unknown
): value is VaultChartCollectionResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.charts) &&
    value.charts.every((chart) => isVaultChartListItem(chart)) &&
    (typeof value.nextCursor === 'string' || value.nextCursor === null) &&
    (value.capacity === undefined || isVaultCapacity(value.capacity))
  );
}

function setVisibility(element: HTMLElement, visible: boolean): void {
  element.hidden = !visible;
}

function isValidTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function categoryLabel(category: VaultChartCategory): string {
  const key = category === 'SELF'
    ? 'vault.category.self'
    : category === 'PARTNER'
      ? 'vault.category.partner'
      : category === 'FAMILY'
        ? 'vault.category.family'
        : category === 'FRIEND'
          ? 'vault.category.friend'
          : 'vault.category.client';

  return getDocumentUiMessage(key);
}

function renderChartList(
  list: HTMLUListElement,
  charts: readonly VaultChartListItem[]
): void {
  list.replaceChildren();

  for (const chart of charts) {
    const item = document.createElement('li');
    item.className = 'nn-surface nn-surface--elevated flex min-w-0 flex-col p-5 sm:p-6';

    const title = document.createElement('h3');
    title.className = 'nn-type-card-title break-words';
    title.textContent = chart.displayName;

    const category = document.createElement('p');
    category.className = 'nn-badge mt-4 self-start';
    category.textContent = categoryLabel(chart.category);

    const state = document.createElement('p');
    state.className = 'nn-type-metadata mt-3';
    state.textContent = getDocumentUiMessage(
      chart.recordOrigin === 'DEVELOPMENT_FIXTURE'
        ? 'vault.state.developmentFixture'
        : chart.scientificStatus === 'CHART_RESULT_AVAILABLE'
          ? 'vault.state.authoritative'
          : 'vault.state.inputOnly'
    );

    const savedAt = document.createElement('time');
    savedAt.className = 'nn-type-metadata mt-5 block';

    if (isValidTimestamp(chart.createdAt)) {
      savedAt.dateTime = chart.createdAt;
      savedAt.textContent = formatDocumentUiMessage(
        'vault.savedPrefix',
        { date: chart.createdAt }
      );
    } else {
      savedAt.textContent = getDocumentUiMessage('vault.savedDateUnavailable');
    }

    const openLink = document.createElement('a');
    openLink.className =
      'nn-button nn-button--secondary mt-6 self-start';
    openLink.href = getLocalizedCurrentPath(
      window.location.pathname,
      `/vault/chart?chartId=${encodeURIComponent(chart.chartId)}`
    );
    openLink.textContent = getDocumentUiMessage('vault.open');

    item.append(title, category, state, savedAt, openLink);
    list.append(item);
  }
}

function render(
  elements: VaultPageElements,
  state: VaultPageState,
  charts: readonly VaultChartListItem[] = [],
  capacity?: VaultCapacity
): void {
  elements.root.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  setVisibility(elements.loading, state === 'loading');
  setVisibility(elements.error, state === 'error');
  setVisibility(elements.empty, state === 'empty');
  setVisibility(elements.list, state === 'loaded');

  if (state === 'error') {
    elements.error.textContent = getDocumentUiMessage('vault.loadError');
  }

  if (state === 'loaded') {
    renderChartList(elements.list, charts);
  } else {
    elements.list.replaceChildren();
  }

  if (capacity === undefined) {
    elements.capacity.textContent = '';
    elements.capacity.hidden = true;
  } else {
    elements.capacity.hidden = false;
    elements.capacity.textContent =
      capacity.used >= capacity.limit
        ? formatDocumentUiMessage('vault.capacityReached', {
            used: capacity.used,
            limit: capacity.limit
          })
        : formatDocumentUiMessage('vault.capacity', {
            used: capacity.used,
            limit: capacity.limit
          });
  }
}

function redirectToSignIn(): void {
  window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
}

async function loadVaultCharts(elements: VaultPageElements): Promise<void> {
  render(elements, 'loading');

  try {
    const sessionResponse = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (sessionResponse.status !== 200) {
      render(elements, 'error');
      return;
    }

    const sessionPayload: unknown = await sessionResponse.json();

    if (!isCurrentSessionResponse(sessionPayload)) {
      render(elements, 'error');
      return;
    }

    if (!sessionPayload.authenticated) {
      redirectToSignIn();
      return;
    }

    const vaultResponse = await fetch(VAULT_CHARTS_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (vaultResponse.status === 401) {
      redirectToSignIn();
      return;
    }

    if (vaultResponse.status !== 200) {
      render(elements, 'error');
      return;
    }

    const vaultPayload: unknown = await vaultResponse.json();

    if (!isVaultChartCollectionResponse(vaultPayload)) {
      render(elements, 'error');
      return;
    }

    render(
      elements,
      vaultPayload.charts.length === 0 ? 'empty' : 'loaded',
      vaultPayload.charts,
      vaultPayload.capacity
    );
  } catch (_error) {
    render(elements, 'error');
  }
}

/** Loads the authenticated Vault collection for the current page only. */
export function initializeVaultPage(elements: VaultPageElements): void {
  void loadVaultCharts(elements);
}
