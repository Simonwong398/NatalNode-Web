import type {
  CurrentSessionApiResponse,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';

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
const LOAD_FAILURE_MESSAGE = "We couldn't load your Vault. Please try again.";

type VaultChartListItem = Pick<
  VaultChartRecord,
  'chartId' | 'displayName' | 'category' | 'createdAt'
>;

interface VaultChartCollectionResponse {
  readonly charts: readonly VaultChartListItem[];
}

type VaultPageState = 'loading' | 'loaded' | 'empty' | 'error';

export interface VaultPageElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly error: HTMLElement;
  readonly empty: HTMLElement;
  readonly list: HTMLUListElement;
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
    typeof value.createdAt === 'string'
  );
}

function isVaultChartCollectionResponse(
  value: unknown
): value is VaultChartCollectionResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.charts) &&
    value.charts.every((chart) => isVaultChartListItem(chart))
  );
}

function setVisibility(element: HTMLElement, visible: boolean): void {
  element.hidden = !visible;
}

function isValidTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function renderChartList(
  list: HTMLUListElement,
  charts: readonly VaultChartListItem[]
): void {
  list.replaceChildren();

  for (const chart of charts) {
    const item = document.createElement('li');
    item.className = 'rounded-2xl border border-natal-border bg-natal-surface/75 p-5 sm:p-6';

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold text-white';
    title.textContent = chart.displayName;

    const category = document.createElement('p');
    category.className = 'mt-2 text-xs font-bold uppercase tracking-[0.14em] text-natal-accent';
    category.textContent = chart.category;

    const savedAt = document.createElement('time');
    savedAt.className = 'mt-4 block text-sm text-natal-muted';

    if (isValidTimestamp(chart.createdAt)) {
      savedAt.dateTime = chart.createdAt;
      savedAt.textContent = `Saved ${chart.createdAt}`;
    } else {
      savedAt.textContent = 'Saved date unavailable';
    }

    const openLink = document.createElement('a');
    openLink.className =
      'mt-5 inline-flex text-sm font-semibold text-natal-accent transition-colors hover:text-white';
    openLink.href = `/vault/chart?chartId=${encodeURIComponent(chart.chartId)}`;
    openLink.textContent = 'Open';

    item.append(title, category, savedAt, openLink);
    list.append(item);
  }
}

function render(
  elements: VaultPageElements,
  state: VaultPageState,
  charts: readonly VaultChartListItem[] = []
): void {
  elements.root.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  setVisibility(elements.loading, state === 'loading');
  setVisibility(elements.error, state === 'error');
  setVisibility(elements.empty, state === 'empty');
  setVisibility(elements.list, state === 'loaded');

  if (state === 'error') {
    elements.error.textContent = LOAD_FAILURE_MESSAGE;
  }

  if (state === 'loaded') {
    renderChartList(elements.list, charts);
  } else {
    elements.list.replaceChildren();
  }
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
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
      vaultPayload.charts
    );
  } catch (_error) {
    render(elements, 'error');
  }
}

/** Loads the authenticated Vault collection for the current page only. */
export function initializeVaultPage(elements: VaultPageElements): void {
  void loadVaultCharts(elements);
}
