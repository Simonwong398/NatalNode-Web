import {
  getLocalizedCurrentPath,
  getPresentationLocale,
  type SupportedLocale
} from '../../lib/localization.js';
import { SITE_ORIGIN } from '../../lib/seo.js';
import {
  formatUiMessage,
  getUiMessage,
  type UiMessageKey
} from '../../lib/ui-catalog.js';
import {
  prepareAccountExport,
  resolvePreparationErrorCode,
  type AccountExportErrorCode
} from './account-export.js';
import {
  AccountExportPayloadError,
  buildAccountPrintModel,
  fetchAccountExportPayload,
  type AccountPrintModel
} from './account-print.js';

const SIGN_IN_PATH = '/auth/sign-in';

export interface AccountShareElements {
  readonly accountPage: HTMLElement;
  readonly accountContent: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly view: HTMLElement;
  readonly status: HTMLElement;
  readonly error: HTMLElement;
  readonly reauthStatus: HTMLElement;
}

function ui(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className !== undefined) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function siteLabel(): string {
  return SITE_ORIGIN.replace(/^https?:\/\//u, '').replace(/\/$/u, '');
}

function categoryLabel(locale: SupportedLocale, category: string): string {
  const keyByCategory: Readonly<Record<string, UiMessageKey>> = {
    SELF: 'vault.category.self',
    PARTNER: 'vault.category.partner',
    FAMILY: 'vault.category.family',
    FRIEND: 'vault.category.friend',
    CLIENT: 'vault.category.client'
  };

  const key = keyByCategory[category];
  return key === undefined ? category : ui(locale, key);
}

function stateLabel(
  locale: SupportedLocale,
  authority: AccountPrintModel['charts'][number]['authority']
): string {
  if (authority === 'input-only') {
    return ui(locale, 'account.print.savedInput');
  }

  return ui(
    locale,
    authority === 'authoritative'
      ? 'vault.state.authoritative'
      : 'vault.state.developmentFixture'
  );
}

function appendSiteLink(
  document: Document,
  parent: HTMLElement,
  label: string
): void {
  const link = createElement(document, 'a', 'account-share-card-link', label);
  link.href = SITE_ORIGIN;
  parent.append(link);
}

/** Renders a privacy-minimized, client-only social preview from the export model. */
export function renderAccountShareSummary(
  view: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  const document = view.ownerDocument;
  view.replaceChildren();

  const card = createElement(document, 'article', 'account-share-card');
  const header = createElement(document, 'header', 'account-share-card-header');
  const logo = createElement(document, 'img', 'account-share-card-logo');
  logo.src = '/brand/natalnode-lockup-horizontal-dark.svg';
  logo.alt = 'NatalNode';
  logo.width = 180;
  logo.height = 40;
  logo.decoding = 'sync';
  header.append(
    logo,
    createElement(document, 'p', 'account-share-card-status', ui(locale, 'account.share.privatePreview'))
  );
  card.append(header);

  card.append(
    createElement(document, 'p', 'account-share-card-eyebrow', ui(locale, 'account.share.eyebrow')),
    createElement(
      document,
      'h2',
      'account-share-card-title',
      model.charts.length === 1
        ? model.charts[0].displayName
        : ui(locale, 'account.print.profileDescriptor')
    ),
    createElement(
      document,
      'p',
      'account-share-card-count',
      formatUiMessage(locale, 'account.share.profileCount', {
        count: new Intl.NumberFormat(locale).format(model.charts.length)
      })
    )
  );

  if (model.charts.length > 0) {
    const profiles = createElement(document, 'section', 'account-share-card-profiles');
    profiles.append(
      createElement(document, 'h3', 'account-share-card-section-title', ui(locale, 'account.print.savedProfiles'))
    );
    const list = createElement(document, 'ul', 'account-share-card-profile-list');
    for (const chart of model.charts) {
      const item = createElement(document, 'li', 'account-share-card-profile');
      item.append(
        createElement(document, 'strong', 'account-share-card-profile-name', chart.displayName),
        createElement(document, 'span', 'account-share-card-profile-category', categoryLabel(locale, chart.category)),
        createElement(document, 'span', 'account-share-card-profile-state', stateLabel(locale, chart.authority))
      );
      list.append(item);
    }
    profiles.append(list);
    card.append(profiles);
  }

  card.append(
    createElement(document, 'p', 'account-share-card-statement', ui(locale, 'account.share.statement'))
  );

  const cta = createElement(document, 'section', 'account-share-card-cta');
  cta.append(
    createElement(document, 'p', 'account-share-card-cta-label', ui(locale, 'account.share.cta'))
  );
  appendSiteLink(document, cta, siteLabel());
  card.append(cta);

  const closeButton = createElement(
    document,
    'button',
    'account-share-card-close',
    ui(locale, 'account.share.close')
  );
  closeButton.type = 'button';
  closeButton.setAttribute('data-account-share-close', 'true');
  card.append(closeButton);
  view.append(card);
}

function clearMessages(elements: AccountShareElements): void {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.error.hidden = true;
  elements.error.textContent = '';
  elements.reauthStatus.hidden = true;
}

function setPending(
  elements: AccountShareElements,
  pending: boolean,
  locale: SupportedLocale
): void {
  elements.button.disabled = pending;
  elements.button.textContent = pending
    ? ui(locale, 'account.data.sharePreparing')
    : ui(locale, 'account.data.shareSummary');
}

function showError(
  elements: AccountShareElements,
  locale: SupportedLocale
): void {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.error.textContent = ui(locale, 'account.data.shareError');
  elements.error.hidden = false;
  elements.error.focus();
}

function handleError(
  elements: AccountShareElements,
  locale: SupportedLocale,
  code: AccountExportErrorCode
): void {
  if (code === 'UNAUTHORIZED') {
    elements.accountContent.hidden = true;
    window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
    return;
  }

  if (code === 'RECENT_AUTHENTICATION_REQUIRED') {
    elements.status.hidden = true;
    elements.status.textContent = '';
    elements.reauthStatus.hidden = false;
    elements.reauthStatus.focus();
    return;
  }

  showError(elements, locale);
}

function clearShareView(elements: AccountShareElements): void {
  elements.accountPage.removeAttribute('data-account-share-active');
  document.body.removeAttribute('data-account-share-active');
  elements.view.hidden = true;
  elements.view.setAttribute('aria-hidden', 'true');
  elements.view.replaceChildren();
  elements.button.textContent = ui(
    getPresentationLocale(window.location.pathname, document.documentElement.lang),
    'account.data.shareSummary'
  );
}

/** Opens a private client-side preview; it never creates a public share endpoint. */
export function initializeAccountShare(elements: AccountShareElements): void {
  const locale = getPresentationLocale(
    window.location.pathname,
    document.documentElement.lang
  );
  let isPreparing = false;
  let isOpen = false;

  const closeShare = () => {
    isOpen = false;
    clearShareView(elements);
  };

  elements.view.addEventListener('click', (event) => {
    const target = event.target;
    if (
      target !== null &&
      typeof target === 'object' &&
      'closest' in target &&
      typeof target.closest === 'function' &&
      target.closest('[data-account-share-close]')
    ) {
      closeShare();
    }
  });

  elements.button.addEventListener('click', () => {
    if (isPreparing) {
      return;
    }

    if (isOpen) {
      closeShare();
      return;
    }

    isPreparing = true;
    clearMessages(elements);
    setPending(elements, true, locale);
    elements.status.textContent = ui(locale, 'account.data.sharePreparing');
    elements.status.hidden = false;

    void (async () => {
      try {
        const preparation = await prepareAccountExport();

        if (preparation.status !== 204) {
          const code = resolvePreparationErrorCode(preparation);
          if (code === null) {
            showError(elements, locale);
          } else {
            handleError(elements, locale, code);
          }
          return;
        }

        const payload = await fetchAccountExportPayload();
        const model = buildAccountPrintModel(payload);
        if (model === null) {
          showError(elements, locale);
          return;
        }

        renderAccountShareSummary(elements.view, model, locale);
        elements.accountPage.setAttribute('data-account-share-active', 'true');
        document.body.setAttribute('data-account-share-active', 'true');
        elements.view.hidden = false;
        elements.view.setAttribute('aria-hidden', 'false');
        elements.status.hidden = true;
        elements.status.textContent = '';
        elements.button.textContent = ui(locale, 'account.data.shareClose');
        isOpen = true;
      } catch (error) {
        clearShareView(elements);
        if (error instanceof AccountExportPayloadError) {
          handleError(elements, locale, error.code);
        } else {
          showError(elements, locale);
        }
      } finally {
        isPreparing = false;
        if (!isOpen) {
          setPending(elements, false, locale);
        } else {
          elements.button.disabled = false;
        }
      }
    })();
  });
}
