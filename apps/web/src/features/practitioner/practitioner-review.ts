import {
  PRACTITIONER_REVIEW_QUEUE_STATUSES,
  type PractitionerReviewAction,
  type PractitionerReviewReasonCode,
  type PractitionerReviewQueueStatus
} from '@natalnode/contracts';
import { getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';
import type { SupportedLocale } from '@/lib/localization';

const REASONS: readonly PractitionerReviewReasonCode[] = [
  'ELIGIBILITY',
  'INCOMPLETE',
  'EVIDENCE',
  'MISREPRESENTATION',
  'HIGH_STAKES_CLAIM',
  'POLICY',
  'OTHER'
];

const PRACTICE_AREAS = [
  'NATAL_ASTROLOGY',
  'CHART_INTERPRETATION',
  'ASTROLOGY_EDUCATION',
  'ASTROLOGY_RESEARCH',
  'RELATIONSHIP_ASTROLOGY',
  'TIMING_AND_CYCLES',
  'OTHER'
] as const;

const REPORT_CATEGORIES = [
  'IMPERSONATION',
  'MISLEADING_CLAIM',
  'PRIVACY',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'SPAM',
  'OTHER'
] as const;

const REVIEW_ACTIONS = [
  'APPROVE',
  'REQUEST_CHANGES',
  'REJECT',
  'REVOKE'
] as const;

interface ApiResult {
  readonly response: Response;
  readonly value: unknown;
}

interface ReviewApplication {
  readonly applicationId: string;
  readonly userId: string;
  readonly status: string;
  readonly version: number;
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: readonly string[];
  readonly reviewHistory: readonly ReviewHistory[];
}

interface ReviewHistory {
  readonly reviewEventId: string;
  readonly reviewerUserId: string | null;
  readonly action: PractitionerReviewAction;
  readonly reasonCode: PractitionerReviewReasonCode;
  readonly note: string | null;
  readonly applicationVersion: number;
  readonly createdAt: string;
}

interface ReviewRevision {
  readonly revisionId: string;
  readonly applicationId: string;
  readonly userId: string;
  readonly applicationVersion: number;
  readonly status: string;
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
}

interface ReviewReport {
  readonly reportId: string;
  readonly practitionerId: string;
  readonly category: string;
  readonly details: string;
  readonly createdAt: string;
}

interface ReviewQueue {
  readonly applications: readonly ReviewApplication[];
  readonly revisions: readonly ReviewRevision[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPracticeAreaList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((area) =>
    PRACTICE_AREAS.includes(area as typeof PRACTICE_AREAS[number])
  );
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isReviewHistory(value: unknown): value is readonly ReviewHistory[] {
  return Array.isArray(value) && value.every((entry) =>
    isRecord(entry) &&
    typeof entry.reviewEventId === 'string' &&
    (entry.reviewerUserId === null || typeof entry.reviewerUserId === 'string') &&
    REVIEW_ACTIONS.includes(entry.action as typeof REVIEW_ACTIONS[number]) &&
    REASONS.includes(entry.reasonCode as PractitionerReviewReasonCode) &&
    (entry.note === null || typeof entry.note === 'string') &&
    typeof entry.applicationVersion === 'number' &&
    Number.isSafeInteger(entry.applicationVersion) &&
    entry.applicationVersion >= 1 &&
    typeof entry.createdAt === 'string'
  );
}

function isApplication(value: unknown): value is ReviewApplication {
  return (
    isRecord(value) &&
    typeof value.applicationId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.status === 'string' &&
    PRACTITIONER_REVIEW_QUEUE_STATUSES.includes(value.status as PractitionerReviewQueueStatus) &&
    typeof value.version === 'number' &&
    typeof value.requestedDisplayName === 'string' &&
    typeof value.professionalHeadline === 'string' &&
    typeof value.bio === 'string' &&
    isPracticeAreaList(value.practiceAreas) &&
    isStringList(value.languages) &&
    typeof value.countryOrRegion === 'string' &&
    (value.websiteUrl === undefined || typeof value.websiteUrl === 'string') &&
    typeof value.practiceStatement === 'string' &&
    Array.isArray(value.evidenceUrls) &&
    value.evidenceUrls.every((url) => typeof url === 'string') &&
    isReviewHistory(value.reviewHistory)
  );
}

function isRevision(value: unknown): value is ReviewRevision {
  return (
    isRecord(value) &&
    typeof value.revisionId === 'string' &&
    typeof value.applicationId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.applicationVersion === 'number' &&
    typeof value.status === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.professionalHeadline === 'string' &&
    typeof value.bio === 'string'
    && isPracticeAreaList(value.practiceAreas)
    && isStringList(value.languages)
    && typeof value.countryOrRegion === 'string'
    && (value.websiteUrl === undefined || typeof value.websiteUrl === 'string')
  );
}

function isQueue(value: unknown): value is ReviewQueue {
  return (
    isRecord(value) &&
    Array.isArray(value.applications) &&
    value.applications.every(isApplication) &&
    Array.isArray(value.revisions) &&
    value.revisions.every(isRevision)
  );
}

function isReport(value: unknown): value is ReviewReport {
  return (
    isRecord(value) &&
    typeof value.reportId === 'string' &&
    typeof value.practitionerId === 'string' &&
    typeof value.category === 'string' &&
    typeof value.details === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isReportResponse(value: unknown): value is { readonly reports: readonly ReviewReport[] } {
  return isRecord(value) && Array.isArray(value.reports) && value.reports.every(isReport);
}

async function requestJson(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store'
  });
  let value: unknown = null;
  try {
    value = response.status === 204 ? null : await response.json();
  } catch (_error) {
    value = null;
  }
  return { response, value };
}

function message(locale: SupportedLocale, key: string): string {
  return getUiMessage(locale, key as UiMessageKey);
}

function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, className?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className !== undefined) {
    element.className = className;
  }
  return element;
}

function safeEvidenceLink(url: string): HTMLAnchorElement | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
      return null;
    }
    const link = createElement('a', 'break-all text-natal-accent underline underline-offset-4');
    link.href = parsed.href;
    link.textContent = parsed.href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    return link;
  } catch (_error) {
    return null;
  }
}

function setStatus(element: HTMLElement, text: string, error = false): void {
  element.textContent = text;
  element.hidden = text === '';
  element.className = error ? 'nn-status nn-status--error' : 'nn-status';
}

function actionLabel(locale: SupportedLocale, action: PractitionerReviewAction): string {
  return message(locale, {
    APPROVE: 'practitioner.reviewer.approve',
    REQUEST_CHANGES: 'practitioner.reviewer.requestChanges',
    REJECT: 'practitioner.reviewer.reject',
    REVOKE: 'practitioner.reviewer.revoke'
  }[action]);
}

function statusLabel(locale: SupportedLocale, status: PractitionerReviewQueueStatus): string {
  return message(locale, {
    SUBMITTED: 'practitioner.application.submitted',
    CHANGES_REQUESTED: 'practitioner.application.changesRequested',
    APPROVED: 'practitioner.application.approved',
    REJECTED: 'practitioner.application.rejected',
    REVOKED: 'practitioner.application.revoked'
  }[status]);
}

function areaLabel(locale: SupportedLocale, area: string): string {
  return message(locale, `practitioner.practiceArea.${area}`);
}

function reasonLabel(locale: SupportedLocale, reason: PractitionerReviewReasonCode): string {
  return message(locale, `practitioner.reviewReason.${reason}`);
}

function appendReviewHistory(
  card: HTMLElement,
  locale: SupportedLocale,
  history: readonly ReviewHistory[]
): void {
  if (history.length === 0) {
    return;
  }

  const details = createElement('details', 'mt-5 border-t border-natal-border/60 pt-4');
  const summary = createElement('summary', 'cursor-pointer font-semibold text-natal-text');
  summary.textContent = message(locale, 'practitioner.reviewer.reviewHistory');
  details.append(summary);

  const list = createElement('ul', 'mt-4 grid gap-3 text-sm leading-6 text-[var(--nn-text-secondary)]');
  for (const event of history) {
    const item = createElement('li', 'border-l-2 border-natal-border/70 pl-3');
    const eventSummary = `${actionLabel(locale, event.action)} · ${reasonLabel(locale, event.reasonCode)} · ${event.createdAt}`;
    item.textContent = event.note === null || event.note === ''
      ? eventSummary
      : `${eventSummary}\n${event.note}`;
    list.append(item);
  }
  details.append(list);
  card.append(details);
}

function appendReviewControls(
  card: HTMLElement,
  locale: SupportedLocale,
  options: {
    readonly actions: readonly PractitionerReviewAction[];
    readonly version: number;
    readonly applicationId: string;
    readonly path: string;
    readonly onComplete: () => Promise<void>;
  }
): void {
  const form = createElement('form', 'mt-6 grid gap-4 border-t border-natal-border/60 pt-5');
  const actionLabelElement = createElement('label', 'grid gap-2');
  const actionText = createElement('span', 'nn-type-label');
  actionText.textContent = message(locale, 'practitioner.reviewer.action');
  const actionSelect = createElement('select', 'nn-field');
  actionSelect.name = 'action';
  for (const action of options.actions) {
    const option = createElement('option');
    option.value = action;
    option.textContent = actionLabel(locale, action);
    actionSelect.append(option);
  }
  actionLabelElement.append(actionText, actionSelect);

  const reasonLabel = createElement('label', 'grid gap-2');
  const reasonText = createElement('span', 'nn-type-label');
  reasonText.textContent = message(locale, 'practitioner.reviewer.reason');
  const reasonSelect = createElement('select', 'nn-field');
  reasonSelect.name = 'reasonCode';
  for (const reason of REASONS) {
    const option = createElement('option');
    option.value = reason;
    option.textContent = message(locale, `practitioner.reviewReason.${reason}`);
    reasonSelect.append(option);
  }
  reasonLabel.append(reasonText, reasonSelect);

  const noteLabel = createElement('label', 'grid gap-2');
  const noteText = createElement('span', 'nn-type-label');
  noteText.textContent = message(locale, 'practitioner.reviewer.note');
  const note = createElement('textarea', 'nn-field min-h-24 resize-y');
  note.name = 'note';
  note.maxLength = 1000;
  noteLabel.append(noteText, note);

  const submit = createElement('button', 'nn-button nn-button--secondary justify-self-start');
  submit.type = 'submit';
  submit.textContent = actionLabel(locale, options.actions[0]!);
  actionSelect.addEventListener('change', () => {
    submit.textContent = actionLabel(locale, actionSelect.value as PractitionerReviewAction);
  });
  const status = createElement('p', 'nn-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    setStatus(status, '');
    try {
      const result = await requestJson(options.path, {
        method: 'PATCH',
        body: JSON.stringify({
          action: actionSelect.value,
          reasonCode: reasonSelect.value,
          version: options.version,
          ...(options.path.includes('/revisions/') ? { applicationId: options.applicationId } : {}),
          ...(note.value.trim() === '' ? {} : { note: note.value })
        })
      });
      if (result.response.status === 403) {
        throw new Error('forbidden');
      }
      if (result.response.status === 409) {
        throw new Error('stale');
      }
      if (!result.response.ok) {
        throw new Error('review');
      }
      setStatus(status, message(locale, 'practitioner.reviewer.success'));
      await options.onComplete();
    } catch (reviewError) {
      setStatus(status, reviewError instanceof Error && reviewError.message === 'forbidden'
        ? message(locale, 'practitioner.reviewer.forbidden')
        : message(locale, 'practitioner.reviewer.error'), true);
    } finally {
      submit.disabled = false;
    }
  });

  form.append(actionLabelElement, reasonLabel, noteLabel, submit, status);
  card.append(form);
}

function renderApplication(
  application: ReviewApplication,
  locale: SupportedLocale,
  onComplete: () => Promise<void>
): HTMLElement {
  const card = createElement('article', 'rounded-2xl border border-natal-border/70 bg-natal-surface/35 p-5 sm:p-6');
  const heading = createElement('h3', 'text-lg font-semibold text-natal-text');
  heading.textContent = application.requestedDisplayName;
  card.append(heading);
  const meta = createElement('p', 'mt-2 text-sm text-[var(--nn-text-secondary)]');
  meta.textContent = `${statusLabel(locale, application.status as PractitionerReviewQueueStatus)} · ${application.userId}`;
  card.append(meta);
  const headline = createElement('p', 'mt-4 font-semibold text-natal-text');
  headline.textContent = application.professionalHeadline;
  card.append(headline);
  const bio = createElement('p', 'mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--nn-text-secondary)]');
  bio.textContent = application.bio;
  card.append(bio);

  const profileDetails = createElement('dl', 'mt-5 grid gap-3 text-sm leading-6');
  const appendDetail = (label: string, value: string): void => {
    const item = createElement('div');
    const term = createElement('dt', 'font-semibold text-natal-text');
    term.textContent = label;
    const description = createElement('dd', 'mt-1 whitespace-pre-wrap text-[var(--nn-text-secondary)]');
    description.textContent = value;
    item.append(term, description);
    profileDetails.append(item);
  };
  appendDetail(message(locale, 'practitioner.application.practiceAreas'), application.practiceAreas.map((area) => areaLabel(locale, area)).join(' · '));
  appendDetail(message(locale, 'practitioner.application.languages'), application.languages.join(', '));
  appendDetail(message(locale, 'practitioner.application.countryOrRegion'), application.countryOrRegion);
  appendDetail(message(locale, 'practitioner.application.practiceStatement'), application.practiceStatement);
  card.append(profileDetails);

  if (application.websiteUrl !== undefined) {
    const website = safeEvidenceLink(application.websiteUrl);
    if (website !== null) {
      const websiteItem = createElement('p', 'mt-3 text-sm');
      const websiteLabel = createElement('span', 'mr-2 font-semibold text-natal-text');
      websiteLabel.textContent = `${message(locale, 'practitioner.application.website')}:`;
      websiteItem.append(websiteLabel, website);
      card.append(websiteItem);
    }
  }

  appendReviewHistory(card, locale, application.reviewHistory);

  if (application.evidenceUrls.length > 0) {
    const evidence = createElement('ul', 'mt-4 grid gap-2 text-sm');
    for (const url of application.evidenceUrls) {
      const link = safeEvidenceLink(url);
      if (link !== null) {
        const item = createElement('li');
        item.append(link);
        evidence.append(item);
      }
    }
    card.append(evidence);
  }
  const actions: readonly PractitionerReviewAction[] = application.status === 'APPROVED'
    ? ['REVOKE']
    : application.status === 'SUBMITTED' || application.status === 'CHANGES_REQUESTED'
      ? ['APPROVE', 'REQUEST_CHANGES', 'REJECT']
      : [];
  if (actions.length > 0) {
    appendReviewControls(card, locale, {
      actions,
      version: application.version,
      applicationId: application.applicationId,
      path: `/api/practitioner/review/applications/${encodeURIComponent(application.applicationId)}`,
      onComplete
    });
  }
  return card;
}

function renderRevision(
  revision: ReviewRevision,
  locale: SupportedLocale,
  onComplete: () => Promise<void>
): HTMLElement {
  const card = createElement('article', 'rounded-2xl border border-natal-border/70 bg-natal-surface/35 p-5 sm:p-6');
  const heading = createElement('h3', 'text-lg font-semibold text-natal-text');
  heading.textContent = revision.displayName;
  card.append(heading);
  const meta = createElement('p', 'mt-2 text-sm text-[var(--nn-text-secondary)]');
  meta.textContent = `${revision.userId} · ${revision.status}`;
  card.append(meta);
  const content = createElement('p', 'mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--nn-text-secondary)]');
  content.textContent = `${revision.professionalHeadline}\n\n${revision.bio}`;
  card.append(content);
  const profileDetails = createElement('p', 'mt-4 text-sm leading-6 text-[var(--nn-text-secondary)]');
  profileDetails.textContent = `${revision.practiceAreas.map((area) => areaLabel(locale, area)).join(' · ')} · ${revision.languages.join(', ')} · ${revision.countryOrRegion}`;
  card.append(profileDetails);
  if (revision.websiteUrl !== undefined) {
    const website = safeEvidenceLink(revision.websiteUrl);
    if (website !== null) {
      card.append(website);
    }
  }
  appendReviewControls(card, locale, {
    actions: ['APPROVE', 'REJECT'],
    version: revision.applicationVersion,
    applicationId: revision.applicationId,
    path: `/api/practitioner/review/revisions/${encodeURIComponent(revision.revisionId)}`,
    onComplete
  });
  return card;
}

function renderReport(
  report: ReviewReport,
  locale: SupportedLocale,
  onComplete: () => Promise<void>
): HTMLElement {
  const card = createElement('article', 'rounded-2xl border border-natal-border/70 bg-natal-surface/35 p-5 sm:p-6');
  const heading = createElement('h3', 'text-lg font-semibold text-natal-text');
  heading.textContent = `${REPORT_CATEGORIES.includes(report.category as typeof REPORT_CATEGORIES[number])
    ? message(locale, `practitioner.reportCategory.${report.category}`)
    : report.category} · ${report.practitionerId}`;
  card.append(heading);
  const detail = createElement('p', 'mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--nn-text-secondary)]');
  detail.textContent = report.details;
  card.append(detail);
  const controls = createElement('div', 'mt-5 flex flex-wrap gap-3');
  for (const state of ['RESOLVED', 'DISMISSED'] as const) {
    const button = createElement('button', 'nn-button nn-button--secondary');
    button.type = 'button';
    button.textContent = state === 'RESOLVED'
      ? message(locale, 'practitioner.reviewer.resolve')
      : message(locale, 'practitioner.reviewer.dismiss');
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const result = await requestJson(`/api/practitioner/review/reports/${encodeURIComponent(report.reportId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ state })
        });
        if (!result.response.ok) {
          throw new Error('report');
        }
        await onComplete();
      } catch (_error) {
        button.disabled = false;
      }
    });
    controls.append(button);
  }
  card.append(controls);
  return card;
}

export interface PractitionerReviewOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export function initializePractitionerReview({ root, locale }: PractitionerReviewOptions): void {
  const loading = root.querySelector<HTMLElement>('[data-practitioner-review-loading]');
  const error = root.querySelector<HTMLElement>('[data-practitioner-review-error]');
  const empty = root.querySelector<HTMLElement>('[data-practitioner-review-empty]');
  const list = root.querySelector<HTMLElement>('[data-practitioner-review-list]');
  const reports = root.querySelector<HTMLElement>('[data-practitioner-review-reports]');
  const statusFilter = root.querySelector<HTMLSelectElement>('[data-practitioner-review-status]');
  const foundingForm = root.querySelector<HTMLFormElement>('[data-practitioner-founding-form]');
  const foundingStatus = root.querySelector<HTMLElement>('[data-practitioner-founding-status]');
  if (!loading || !error || !empty || !list || !reports || !statusFilter || !foundingForm || !foundingStatus) {
    return;
  }

  const load = async (): Promise<void> => {
    loading.hidden = false;
    error.hidden = true;
    try {
      const query = statusFilter.value === ''
        ? ''
        : `?status=${encodeURIComponent(statusFilter.value)}`;
      const queueResult = await requestJson(`/api/practitioner/review/applications${query}`);
      if (queueResult.response.status === 403) {
        throw new Error('forbidden');
      }
      if (!queueResult.response.ok || !isQueue(queueResult.value)) {
        throw new Error('queue');
      }
      const reportResult = await requestJson('/api/practitioner/review/reports');
      if (!reportResult.response.ok || !isReportResponse(reportResult.value)) {
        throw new Error('reports');
      }
      while (list.firstChild !== null) list.removeChild(list.firstChild);
      while (reports.firstChild !== null) reports.removeChild(reports.firstChild);
      for (const application of queueResult.value.applications) {
        list.append(renderApplication(application, locale, load));
      }
      for (const revision of queueResult.value.revisions) {
        list.append(renderRevision(revision, locale, load));
      }
      for (const report of reportResult.value.reports) {
        reports.append(renderReport(report, locale, load));
      }
      empty.hidden = queueResult.value.applications.length + queueResult.value.revisions.length + reportResult.value.reports.length !== 0;
    } catch (loadError) {
      error.textContent = loadError instanceof Error && loadError.message === 'forbidden'
        ? message(locale, 'practitioner.reviewer.forbidden')
        : message(locale, 'practitioner.reviewer.error');
      error.hidden = false;
      error.focus();
    } finally {
      loading.hidden = true;
      root.setAttribute('aria-busy', 'false');
    }
  };

  statusFilter.addEventListener('change', () => {
    void load();
  });

  foundingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = foundingForm.elements.namedItem('practitionerId');
    if (!(input instanceof HTMLInputElement) || input.value.trim() === '') {
      setStatus(foundingStatus, message(locale, 'practitioner.reviewer.error'), true);
      return;
    }
    const button = foundingForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button !== null) button.disabled = true;
    try {
      const result = await requestJson(`/api/practitioner/review/profiles/${encodeURIComponent(input.value.trim())}/founding`, { method: 'POST' });
      if (!result.response.ok) throw new Error('founding');
      setStatus(foundingStatus, message(locale, 'practitioner.reviewer.foundingSet'));
      await load();
    } catch (_error) {
      setStatus(foundingStatus, message(locale, 'practitioner.reviewer.error'), true);
    } finally {
      if (button !== null) button.disabled = false;
    }
  });

  void load();
}
