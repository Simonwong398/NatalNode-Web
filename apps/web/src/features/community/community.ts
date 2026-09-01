import type {
  CommunityModerationReport,
  CommunityPublicAnswer,
  CommunityPublicQuestion,
  CommunityReportCategory,
  CommunityReportState,
  CommunityReportTargetType,
  CommunityTopicId,
  CommunityViewerCapabilities,
  GetCommunityQuestionApiResponse,
  ListCommunityModerationReportsApiResponse,
  ListCommunityQuestionsApiResponse
} from '@natalnode/contracts';
import {
  getLocalizedPath,
  type SupportedLocale
} from '@/lib/localization';
import {
  getUiMessage,
  type UiMessageKey
} from '@/lib/ui-catalog';

const TOPIC_MESSAGE_KEYS: Readonly<Record<CommunityTopicId, UiMessageKey>> = {
  FOUNDATIONS: 'community.topic.foundations',
  CHART_READING: 'community.topic.chartReading',
  PLANETS_SIGNS_HOUSES: 'community.topic.planetsSignsHouses',
  ASPECTS: 'community.topic.aspects',
  BIRTH_TIME_AND_CALCULATION: 'community.topic.birthTimeAndCalculation',
  NATALNODE_PRODUCT: 'community.topic.natalnodeProduct',
  OTHER: 'community.topic.other'
};

const REPORT_MESSAGE_KEYS: Readonly<Record<CommunityReportCategory, UiMessageKey>> = {
  SPAM: 'community.report.spam',
  HARASSMENT: 'community.report.harassment',
  HATE_OR_ABUSE: 'community.report.hateOrAbuse',
  DANGEROUS_OR_HIGH_STAKES_ADVICE: 'community.report.dangerousAdvice',
  PRIVACY: 'community.report.privacy',
  COPYRIGHT_OR_IP: 'community.report.copyright',
  OTHER: 'community.report.other'
};

const REPORT_CATEGORIES: readonly CommunityReportCategory[] = [
  'SPAM',
  'HARASSMENT',
  'HATE_OR_ABUSE',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'PRIVACY',
  'COPYRIGHT_OR_IP',
  'OTHER'
];

const TOPICS: readonly CommunityTopicId[] = [
  'FOUNDATIONS',
  'CHART_READING',
  'PLANETS_SIGNS_HOUSES',
  'ASPECTS',
  'BIRTH_TIME_AND_CALCULATION',
  'NATALNODE_PRODUCT',
  'OTHER'
];

interface ApiResult {
  readonly response: Response;
  readonly value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTopic(value: unknown): value is CommunityTopicId {
  return typeof value === 'string' && TOPICS.includes(value as CommunityTopicId);
}

function isPublicAuthor(value: unknown): boolean {
  return isRecord(value) && typeof value.displayName === 'string';
}

function isPublicQuestion(value: unknown): value is CommunityPublicQuestion {
  return (
    isRecord(value) &&
    typeof value.questionId === 'string' &&
    isPublicAuthor(value.author) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isTopic(value.topicId) &&
    value.status === 'VISIBLE' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isPublicAnswer(value: unknown): value is CommunityPublicAnswer {
  return (
    isRecord(value) &&
    typeof value.answerId === 'string' &&
    typeof value.questionId === 'string' &&
    isPublicAuthor(value.author) &&
    typeof value.body === 'string' &&
    value.status === 'VISIBLE' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isListResponse(value: unknown): value is ListCommunityQuestionsApiResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.questions) &&
    value.questions.every(isPublicQuestion) &&
    (value.nextCursor === null || typeof value.nextCursor === 'string')
  );
}

function isReportTargetType(value: unknown): value is CommunityReportTargetType {
  return value === 'QUESTION' || value === 'ANSWER';
}

function isReportState(value: unknown): value is CommunityReportState {
  return value === 'OPEN' || value === 'RESOLVED' || value === 'DISMISSED';
}

function isReportCategory(value: unknown): value is CommunityReportCategory {
  return typeof value === 'string' && REPORT_CATEGORIES.includes(value as CommunityReportCategory);
}

function isModerationReport(value: unknown): value is CommunityModerationReport {
  return (
    isRecord(value) &&
    typeof value.reportId === 'string' &&
    isReportTargetType(value.targetType) &&
    typeof value.targetId === 'string' &&
    isReportCategory(value.category) &&
    typeof value.details === 'string' &&
    isReportState(value.state) &&
    typeof value.createdAt === 'string' &&
    (value.resolvedAt === null || typeof value.resolvedAt === 'string')
  );
}

function isModerationListResponse(
  value: unknown
): value is ListCommunityModerationReportsApiResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.reports) &&
    value.reports.every(isModerationReport)
  );
}

function isViewerCapabilities(value: unknown): value is CommunityViewerCapabilities {
  return (
    isRecord(value) &&
    typeof value.authenticated === 'boolean' &&
    typeof value.canEditQuestion === 'boolean' &&
    typeof value.canDeleteQuestion === 'boolean' &&
    typeof value.canAnswer === 'boolean' &&
    typeof value.canAcceptAnswer === 'boolean' &&
    typeof value.canReport === 'boolean' &&
    typeof value.isModerator === 'boolean' &&
    isRecord(value.answerCapabilities)
  );
}

function isDetailResponse(value: unknown): value is GetCommunityQuestionApiResponse {
  if (
    !isRecord(value) ||
    !isPublicQuestion(value.question) ||
    !Array.isArray(value.answers) ||
    !isViewerCapabilities(value.viewer) ||
    (value.acceptedAnswerId !== null && typeof value.acceptedAnswerId !== 'string')
  ) {
    return false;
  }

  const question = value.question;
  const answers = value.answers;
  return (
    answers.every(
      (answer) => isPublicAnswer(answer) && answer.questionId === question.questionId
    ) &&
    (value.acceptedAnswerId === null ||
      answers.some((answer) => isPublicAnswer(answer) && answer.answerId === value.acceptedAnswerId))
  );
}

async function requestJson(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult> {
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
  if (response.status !== 204) {
    try {
      value = await response.json();
    } catch (_error) {
      value = null;
    }
  }

  return { response, value };
}

function message(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className !== undefined) {
    element.className = className;
  }
  return element;
}

function clearElement(element: HTMLElement): void {
  while (element.firstChild !== null) {
    element.removeChild(element.firstChild);
  }
}

function setMessage(
  element: HTMLElement,
  text: string,
  options: { readonly error?: boolean; readonly focus?: boolean } = {}
): void {
  element.textContent = text;
  element.hidden = text === '';
  element.classList.toggle('nn-async-state--error', options.error === true);
  element.classList.toggle('nn-notice--error', options.error === true);
  if (options.focus === true && !element.hidden) {
    element.focus();
  }
}

function formatDate(locale: SupportedLocale, value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(date);
}

function topicLabel(locale: SupportedLocale, topic: CommunityTopicId): string {
  return message(locale, TOPIC_MESSAGE_KEYS[topic]);
}

function responseMessage(
  locale: SupportedLocale,
  response: Response,
  fallback: UiMessageKey = 'community.serverError'
): string {
  if (response.status === 401) {
    return message(locale, 'community.authRequired');
  }
  if (response.status === 403) {
    return message(locale, 'community.forbidden');
  }
  if (response.status === 404) {
    return message(locale, 'community.notFound');
  }
  if (response.status === 409) {
    return message(
      locale,
      fallback === 'community.reportError'
        ? 'community.reportError'
        : 'community.displayNameRequired'
    );
  }
  if (response.status === 429) {
    return message(locale, 'community.rateLimited');
  }
  if (response.status === 400) {
    return message(locale, 'community.validationError');
  }
  return message(locale, fallback);
}

function localizedCommunityPath(
  locale: SupportedLocale,
  suffix: string
): string {
  return getLocalizedPath(locale, suffix);
}

function appendTime(
  parent: HTMLElement,
  locale: SupportedLocale,
  createdAt: string,
  updatedAt: string
): void {
  const time = createElement('time', 'nn-type-metadata');
  time.dateTime = updatedAt;
  time.textContent = formatDate(locale, updatedAt);
  parent.append(time);

  if (createdAt !== updatedAt) {
    const edited = createElement('span', 'nn-type-metadata ml-2');
    edited.textContent = message(locale, 'community.edited');
    parent.append(edited);
  }
}

export interface CommunityListElements {
  readonly root: HTMLElement;
  readonly list: HTMLElement;
  readonly loading: HTMLElement;
  readonly empty: HTMLElement;
  readonly error: HTMLElement;
  readonly pagination: HTMLElement;
  readonly previous: HTMLButtonElement;
  readonly next: HTMLButtonElement;
  readonly locale: SupportedLocale;
}

function renderQuestionCard(
  locale: SupportedLocale,
  question: CommunityPublicQuestion
): HTMLElement {
  const item = createElement('article', 'nn-surface nn-surface--elevated p-5 sm:p-6');
  const topic = createElement('p', 'nn-badge');
  topic.textContent = topicLabel(locale, question.topicId);
  item.append(topic);

  const heading = createElement('h2', 'nn-type-card-title mt-4');
  const link = createElement('a', 'font-semibold underline decoration-natal-accent/50 underline-offset-4 transition-colors hover:text-natal-accent');
  link.href = localizedCommunityPath(
    locale,
    `/community/question?id=${encodeURIComponent(question.questionId)}`
  );
  link.textContent = question.title;
  heading.append(link);
  item.append(heading);

  const body = createElement('p', 'nn-type-body-small mt-3 whitespace-pre-wrap');
  body.textContent = question.body.length > 260
    ? `${Array.from(question.body).slice(0, 257).join('')}…`
    : question.body;
  item.append(body);

  const metadata = createElement('p', 'mt-5 flex flex-wrap items-center gap-x-2 gap-y-1');
  const author = createElement('span', 'nn-type-metadata');
  author.textContent = `${message(locale, 'community.author')} ${question.author.displayName}`;
  metadata.append(author);
  const separator = createElement('span', 'nn-type-metadata',);
  separator.textContent = '·';
  metadata.append(separator);
  appendTime(metadata, locale, question.createdAt, question.updatedAt);
  item.append(metadata);

  return item;
}

export function initializeCommunityList(elements: CommunityListElements): void {
  let cursor: string | null = null;
  const previousCursors: string[] = [];
  let nextCursor: string | null = null;

  const setLoading = (isLoading: boolean): void => {
    elements.loading.hidden = !isLoading;
    elements.root.setAttribute('aria-busy', String(isLoading));
    if (isLoading) {
      elements.error.hidden = true;
    }
  };

  const render = (payload: ListCommunityQuestionsApiResponse): void => {
    clearElement(elements.list);
    elements.empty.hidden = payload.questions.length !== 0;

    for (const question of payload.questions) {
      elements.list.append(renderQuestionCard(elements.locale, question));
    }

    nextCursor = payload.nextCursor;
    elements.pagination.hidden =
      payload.questions.length === 0 && previousCursors.length === 0;
    elements.previous.hidden = previousCursors.length === 0;
    elements.next.hidden = nextCursor === null;
    elements.next.disabled = nextCursor === null;
  };

  const load = async (requestedCursor: string | null): Promise<void> => {
    setLoading(true);

    try {
      const query = new URLSearchParams({ limit: '20' });
      if (requestedCursor !== null) {
        query.set('cursor', requestedCursor);
      }

      const result = await requestJson(`/api/community/questions?${query.toString()}`);
      if (!result.response.ok || !isListResponse(result.value)) {
        setMessage(
          elements.error,
          responseMessage(elements.locale, result.response, 'community.loadError'),
          { error: true, focus: true }
        );
        return;
      }

      cursor = requestedCursor;
      render(result.value);
    } catch (_error) {
      setMessage(elements.error, message(elements.locale, 'community.loadError'), {
        error: true,
        focus: true
      });
    } finally {
      setLoading(false);
    }
  };

  elements.next.addEventListener('click', () => {
    if (nextCursor === null) {
      return;
    }
    previousCursors.push(cursor ?? '');
    void load(nextCursor);
  });

  elements.previous.addEventListener('click', () => {
    const previous = previousCursors.pop();
    if (previous === undefined) {
      return;
    }
    void load(previous === '' ? null : previous);
  });

  void load(null);
}

export interface CommunityProfileOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export async function loadCommunityProfile(): Promise<boolean | null> {
  try {
    const result = await requestJson('/api/account/community-profile');
    if (result.response.status === 401 || result.response.status === 403) {
      return false;
    }
    if (!result.response.ok || !isRecord(result.value)) {
      return null;
    }
    return typeof result.value.displayName === 'string' &&
      result.value.displayName.trim() !== '';
  } catch (_error) {
    return null;
  }
}

export function initializeCommunityProfile(options: CommunityProfileOptions): void {
  const profileRoot = options.root.querySelector<HTMLElement>('[data-community-profile]');
  if (profileRoot === null) {
    return;
  }

  const loading = profileRoot.querySelector<HTMLElement>('[data-community-profile-loading]');
  const content = profileRoot.querySelector<HTMLElement>('[data-community-profile-content]');
  const form = profileRoot.querySelector<HTMLFormElement>('[data-community-profile-form]');
  const input = profileRoot.querySelector<HTMLInputElement>('[data-community-display-name]');
  const save = profileRoot.querySelector<HTMLButtonElement>('[data-community-profile-save]');
  const status = profileRoot.querySelector<HTMLElement>('[data-community-profile-status]');

  if (loading === null || content === null || form === null || input === null || save === null || status === null) {
    return;
  }

  const announce = (hasProfile: boolean): void => {
    options.root.dispatchEvent(
      new CustomEvent('community-profile-updated', { detail: { hasProfile } })
    );
  };

  const load = async (): Promise<void> => {
    try {
      const result = await requestJson('/api/account/community-profile');
      if (result.response.status === 401 || result.response.status === 403) {
        loading.hidden = true;
        content.hidden = true;
        announce(false);
        return;
      }
      if (!result.response.ok || !isRecord(result.value)) {
        throw new Error('Profile response is invalid.');
      }

      const displayName = result.value.displayName;
      input.value = typeof displayName === 'string' ? displayName : '';
      loading.hidden = true;
      content.hidden = false;
      announce(typeof displayName === 'string' && displayName.trim() !== '');
    } catch (_error) {
      loading.hidden = true;
      content.hidden = false;
      setMessage(status, message(options.locale, 'community.profileError'), {
        error: true
      });
      announce(false);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setMessage(status, message(options.locale, 'community.saving'));
    save.disabled = true;

    void (async () => {
      try {
        const result = await requestJson('/api/account/community-profile', {
          method: 'PUT',
          body: JSON.stringify({ displayName: input.value })
        });
        if (!result.response.ok || !isRecord(result.value) || typeof result.value.displayName !== 'string') {
          setMessage(status, responseMessage(options.locale, result.response, 'community.profileError'), {
            error: true,
            focus: true
          });
          return;
        }

        input.value = result.value.displayName;
        setMessage(status, message(options.locale, 'community.displayNameSaved'));
        announce(true);
      } catch (_error) {
        setMessage(status, message(options.locale, 'community.profileError'), {
          error: true,
          focus: true
        });
      } finally {
        save.disabled = false;
      }
    })();
  });

  void load();
}

export interface CommunityAskOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export function initializeCommunityAsk(options: CommunityAskOptions): void {
  const loading = options.root.querySelector<HTMLElement>('[data-community-ask-loading]');
  const sessionNote = options.root.querySelector<HTMLElement>('[data-community-ask-session]');
  const content = options.root.querySelector<HTMLElement>('[data-community-ask-content]');
  const form = options.root.querySelector<HTMLFormElement>('[data-community-ask-form]');
  const status = options.root.querySelector<HTMLElement>('[data-community-ask-status]');

  if (loading === null || sessionNote === null || content === null || form === null || status === null) {
    return;
  }

  const profile = options.root.querySelector<HTMLElement>('[data-community-profile]');
  const questionFields = options.root.querySelector<HTMLElement>('[data-community-ask-fields]');
  const profileGate = options.root.querySelector<HTMLElement>('[data-community-profile-gate]');

  const setAuthenticated = (authenticated: boolean): void => {
    loading.hidden = true;
    sessionNote.hidden = authenticated;
    content.hidden = !authenticated;
    if (profile !== null) {
      profile.hidden = !authenticated;
    }
    if (!authenticated) {
      questionFields?.setAttribute('hidden', 'true');
      if (profileGate !== null) {
        profileGate.hidden = true;
      }
    }
  };

  const applyProfileState = (hasProfile: boolean): void => {
    if (profileGate !== null) {
      profileGate.hidden = hasProfile;
    }
    if (questionFields !== null) {
      questionFields.hidden = !hasProfile;
    }
  };

  options.root.addEventListener('community-profile-updated', (event) => {
    const detail = (event as CustomEvent<{ readonly hasProfile?: unknown }>).detail;
    applyProfileState(detail?.hasProfile === true);
  });

  void (async () => {
    try {
      const session = await requestJson('/api/auth/session');
      if (!session.response.ok || !isRecord(session.value) || session.value.authenticated !== true) {
        setAuthenticated(false);
        return;
      }

      setAuthenticated(true);
      const hasProfile = await loadCommunityProfile();
      applyProfileState(hasProfile === true);
      if (hasProfile === null) {
        setMessage(status, message(options.locale, 'community.profileError'), {
          error: true,
          focus: true
        });
      }
    } catch (_error) {
      loading.hidden = true;
      content.hidden = false;
      setMessage(status, message(options.locale, 'community.unavailable'), {
        error: true,
        focus: true
      });
    }
  })();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = form.elements.namedItem('title');
    const body = form.elements.namedItem('body');
    const topicId = form.elements.namedItem('topicId');
    if (!(title instanceof HTMLInputElement) || !(body instanceof HTMLTextAreaElement) || !(topicId instanceof HTMLSelectElement)) {
      return;
    }

    setMessage(status, message(options.locale, 'community.saving'));
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit !== null) {
      submit.disabled = true;
    }

    void (async () => {
      try {
        const result = await requestJson('/api/community/questions', {
          method: 'POST',
          body: JSON.stringify({
            title: title.value,
            body: body.value,
            topicId: topicId.value
          })
        });

        if (!result.response.ok || !isRecord(result.value) || !isPublicQuestion(result.value.question)) {
          setMessage(status, responseMessage(options.locale, result.response), {
            error: true,
            focus: true
          });
          if (result.response.status === 409) {
            applyProfileState(false);
          }
          return;
        }

        setMessage(status, message(options.locale, 'community.questionCreated'));
        window.location.assign(
          localizedCommunityPath(
            options.locale,
            `/community/question?id=${encodeURIComponent(result.value.question.questionId)}`
          )
        );
      } catch (_error) {
        setMessage(status, message(options.locale, 'community.unavailable'), {
          error: true,
          focus: true
        });
      } finally {
        if (submit !== null) {
          submit.disabled = false;
        }
      }
    })();
  });
}

export interface CommunityQuestionOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

function addButton(
  parent: HTMLElement,
  label: string,
  handler: () => void,
  variant: 'primary' | 'secondary' | 'quiet' = 'secondary'
): HTMLButtonElement {
  const button = createElement('button', `nn-button nn-button--${variant}`);
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', handler);
  parent.append(button);
  return button;
}

function appendTopicOptions(
  select: HTMLSelectElement,
  locale: SupportedLocale,
  selected: CommunityTopicId
): void {
  clearElement(select);
  for (const topic of TOPICS) {
    const option = createElement('option');
    option.value = topic;
    option.textContent = topicLabel(locale, topic);
    option.selected = topic === selected;
    select.append(option);
  }
}

function appendReportForm(
  parent: HTMLElement,
  locale: SupportedLocale,
  targetType: 'QUESTION' | 'ANSWER',
  targetId: string,
  onComplete: () => void
): void {
  const disclosure = createElement('details', 'mt-5 border-t border-[var(--nn-border-subtle)] pt-4');
  const summary = createElement('summary', 'cursor-pointer font-semibold text-natal-accent');
  summary.textContent = message(locale, 'community.report');
  disclosure.append(summary);

  const form = createElement('form', 'mt-4 grid gap-4');
  const categoryLabel = createElement('label', 'nn-type-label');
  categoryLabel.textContent = message(locale, 'community.reportCategory');
  const category = createElement('select', 'nn-field');
  category.required = true;
  for (const value of REPORT_CATEGORIES) {
    const option = createElement('option');
    option.value = value;
    option.textContent = message(locale, REPORT_MESSAGE_KEYS[value]);
    category.append(option);
  }
  categoryLabel.append(category);
  form.append(categoryLabel);

  const detailsLabel = createElement('label', 'nn-type-label');
  detailsLabel.textContent = message(locale, 'community.reportDetails');
  const details = createElement('textarea', 'nn-field min-h-28 resize-y');
  details.maxLength = 1_000;
  detailsLabel.append(details);
  form.append(detailsLabel);

  const submit = createElement('button', 'nn-button nn-button--secondary justify-self-start');
  submit.type = 'submit';
  submit.textContent = message(locale, 'community.reportSubmit');
  form.append(submit);
  const status = createElement('p', 'nn-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  form.append(status);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit.disabled = true;
    setMessage(status, message(locale, 'community.saving'));
    void (async () => {
      try {
        const result = await requestJson('/api/community/reports', {
          method: 'POST',
          body: JSON.stringify({
            targetType,
            targetId,
            category: category.value,
            details: details.value
          })
        });
        if (!result.response.ok) {
          setMessage(status, responseMessage(locale, result.response, 'community.reportError'), {
            error: true,
            focus: true
          });
          return;
        }
        setMessage(status, message(locale, 'community.reportSuccess'));
        form.hidden = true;
        onComplete();
      } catch (_error) {
        setMessage(status, message(locale, 'community.reportError'), {
          error: true,
          focus: true
        });
      } finally {
        submit.disabled = false;
      }
    })();
  });

  disclosure.append(form);
  parent.append(disclosure);
}

function appendModerationButtons(
  parent: HTMLElement,
  locale: SupportedLocale,
  targetType: 'QUESTION' | 'ANSWER',
  targetId: string,
  reload: () => Promise<void>
): void {
  const moderation = createElement('div', 'mt-5 flex flex-wrap gap-2 border-t border-[var(--nn-border-subtle)] pt-4');
  const label = createElement('span', 'nn-type-metadata self-center');
  label.textContent = message(locale, 'community.moderationTitle');
  moderation.append(label);

  for (const action of ['HIDE', 'DELETE'] as const) {
    const labelKey = action === 'HIDE'
      ? 'community.moderationHide'
      : 'community.moderationDelete';
    addButton(moderation, message(locale, labelKey), () => {
      void (async () => {
        const result = await requestJson(
          `/api/community/moderation/${targetType}/${encodeURIComponent(targetId)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ action, reasonCode: 'OTHER' })
          }
        );
        if (result.response.ok) {
          await reload();
        }
      })();
    }, 'quiet');
  }
  parent.append(moderation);
}

export interface CommunityModerationOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

function renderModerationReport(
  options: CommunityModerationOptions,
  report: CommunityModerationReport,
  reload: () => Promise<void>
): HTMLElement {
  const item = createElement('li');
  const card = createElement('article', 'nn-surface nn-surface--elevated p-5 sm:p-6');

  const category = createElement('p', 'nn-badge');
  category.textContent = message(options.locale, REPORT_MESSAGE_KEYS[report.category]);
  card.append(category);

  const heading = createElement('h2', 'nn-type-card-title mt-4');
  heading.textContent = message(options.locale, 'community.reportTitle');
  card.append(heading);

  const target = createElement('p', 'nn-type-metadata mt-3');
  target.append(document.createTextNode(`${message(options.locale, 'community.moderationTarget')}: `));
  const targetLabel = report.targetType === 'QUESTION'
    ? message(options.locale, 'community.questionTitle')
    : message(options.locale, 'community.answer');
  if (report.targetType === 'QUESTION') {
    const link = createElement(
      'a',
      'font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4'
    );
    link.href = localizedCommunityPath(
      options.locale,
      `/community/question?id=${encodeURIComponent(report.targetId)}`
    );
    link.textContent = `${targetLabel} · ${report.targetId}`;
    target.append(link);
  } else {
    target.append(document.createTextNode(`${targetLabel} · ${report.targetId}`));
  }
  card.append(target);

  const details = createElement('p', 'mt-4 whitespace-pre-wrap text-[var(--nn-text-secondary)]');
  details.textContent = report.details;
  card.append(details);

  const metadata = createElement('p', 'mt-5');
  appendTime(metadata, options.locale, report.createdAt, report.createdAt);
  card.append(metadata);

  const controls = createElement('div', 'mt-5 flex flex-wrap gap-3 border-t border-[var(--nn-border-subtle)] pt-4');
  const status = createElement('p', 'nn-status basis-full');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;

  const buttons: HTMLButtonElement[] = [];
  const run = (action: 'HIDE' | 'DELETE' | 'DISMISS_REPORT'): void => {
    if (action === 'DELETE' && !window.confirm(message(options.locale, 'community.deleteConfirm'))) {
      return;
    }

    for (const button of buttons) {
      button.disabled = true;
    }
    setMessage(status, message(options.locale, 'community.saving'));

    void (async () => {
      try {
        const result = action === 'DISMISS_REPORT'
          ? await requestJson(
              `/api/community/moderation/reports/${encodeURIComponent(report.reportId)}/dismiss`,
              {
                method: 'POST',
                body: JSON.stringify({
                  action,
                  reasonCode: 'OTHER',
                  reportId: report.reportId
                })
              }
            )
          : await requestJson(
              `/api/community/moderation/${report.targetType}/${encodeURIComponent(report.targetId)}`,
              {
                method: 'PATCH',
                body: JSON.stringify({ action, reasonCode: 'OTHER' })
              }
            );

        if (!result.response.ok) {
          setMessage(
            status,
            responseMessage(options.locale, result.response, 'community.moderationError'),
            { error: true, focus: true }
          );
          return;
        }

        await reload();
      } catch (_error) {
        setMessage(status, message(options.locale, 'community.moderationError'), {
          error: true,
          focus: true
        });
      } finally {
        for (const button of buttons) {
          button.disabled = false;
        }
      }
    })();
  };

  buttons.push(addButton(controls, message(options.locale, 'community.moderationHide'), () => run('HIDE'), 'quiet'));
  buttons.push(addButton(controls, message(options.locale, 'community.moderationDelete'), () => run('DELETE'), 'quiet'));
  buttons.push(addButton(controls, message(options.locale, 'community.moderationDismiss'), () => run('DISMISS_REPORT'), 'quiet'));
  card.append(controls, status);
  item.append(card);
  return item;
}

export function initializeCommunityModeration(options: CommunityModerationOptions): void {
  const loading = options.root.querySelector<HTMLElement>('[data-community-moderation-loading]');
  const error = options.root.querySelector<HTMLElement>('[data-community-moderation-error]');
  const empty = options.root.querySelector<HTMLElement>('[data-community-moderation-empty]');
  const list = options.root.querySelector<HTMLElement>('[data-community-moderation-list]');

  if (loading === null || error === null || empty === null || list === null) {
    return;
  }

  const load = async (): Promise<void> => {
    loading.hidden = false;
    options.root.setAttribute('aria-busy', 'true');

    try {
      const result = await requestJson('/api/community/moderation/reports');
      if (!result.response.ok || !isModerationListResponse(result.value)) {
        setMessage(
          error,
          responseMessage(options.locale, result.response, 'community.moderationError'),
          { error: true, focus: true }
        );
        return;
      }

      clearElement(list);
      empty.hidden = result.value.reports.length !== 0;
      list.hidden = result.value.reports.length === 0;
      error.hidden = true;
      for (const report of result.value.reports) {
        list.append(renderModerationReport(options, report, load));
      }
    } catch (_error) {
      setMessage(error, message(options.locale, 'community.moderationError'), {
        error: true,
        focus: true
      });
    } finally {
      loading.hidden = true;
      options.root.setAttribute('aria-busy', 'false');
    }
  };

  void load();
}

export function initializeCommunityQuestion(options: CommunityQuestionOptions): void {
  const loading = options.root.querySelector<HTMLElement>('[data-community-question-loading]');
  const error = options.root.querySelector<HTMLElement>('[data-community-question-error]');
  const content = options.root.querySelector<HTMLElement>('[data-community-question-content]');
  const title = options.root.querySelector<HTMLElement>('[data-community-question-title]');
  const body = options.root.querySelector<HTMLElement>('[data-community-question-body]');
  const metadata = options.root.querySelector<HTMLElement>('[data-community-question-meta]');
  const actions = options.root.querySelector<HTMLElement>('[data-community-question-actions]');
  const acceptance = options.root.querySelector<HTMLElement>('[data-community-question-acceptance]');
  const answersHeading = options.root.querySelector<HTMLElement>('[data-community-answers-heading]');
  const answers = options.root.querySelector<HTMLElement>('[data-community-answers]');
  const answerForm = options.root.querySelector<HTMLFormElement>('[data-community-answer-form]');
  const answerStatus = options.root.querySelector<HTMLElement>('[data-community-answer-status]');
  const answerFields = options.root.querySelector<HTMLElement>('[data-community-answer-fields]');
  const authNote = options.root.querySelector<HTMLElement>('[data-community-question-auth]');
  const profileGate = options.root.querySelector<HTMLElement>('[data-community-question-profile-gate]');

  if (
    loading === null || error === null || content === null || title === null || body === null ||
    metadata === null || actions === null || acceptance === null || answersHeading === null ||
    answers === null || answerForm === null || answerStatus === null || answerFields === null ||
    authNote === null || profileGate === null
  ) {
    return;
  }

  const questionId = new URL(window.location.href).searchParams.get('id');
  if (
    questionId === null ||
    questionId.length === 0 ||
    questionId.length > 256 ||
    /[\u0000-\u001F\u007F-\u009F\u002F]/u.test(questionId)
  ) {
    loading.hidden = true;
    setMessage(error, message(options.locale, 'community.notFound'), { error: true });
    return;
  }

  let currentDetail: GetCommunityQuestionApiResponse | null = null;

  const setSeoForVisibility = (visible: boolean, detail?: GetCommunityQuestionApiResponse): void => {
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots !== null) {
      robots.content = visible ? 'index,follow' : 'noindex,nofollow';
    }

    let jsonLd = document.querySelector<HTMLScriptElement>('script[data-community-jsonld]');
    if (!visible || detail === undefined || detail.answers.length === 0) {
      jsonLd?.remove();
      return;
    }

    if (jsonLd === null) {
      jsonLd = createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.communityJsonld = 'true';
      document.head.append(jsonLd);
    }

    const accepted = detail.answers.find(
      (answer) => answer.answerId === detail.acceptedAnswerId
    );
    const entity: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: detail.question.title,
        text: detail.question.body,
        dateCreated: detail.question.createdAt,
        dateModified: detail.question.updatedAt,
        answerCount: detail.answers.length,
        author: { '@type': 'Person', name: detail.question.author.displayName },
        suggestedAnswer: detail.answers.map((answer) => ({
          '@type': 'Answer',
          text: answer.body,
          dateCreated: answer.createdAt,
          dateModified: answer.updatedAt,
          author: { '@type': 'Person', name: answer.author.displayName }
        }))
      }
    };

    if (accepted !== undefined && isRecord(entity.mainEntity)) {
      entity.mainEntity.acceptedAnswer = {
        '@type': 'Answer',
        text: accepted.body,
        dateCreated: accepted.createdAt,
        dateModified: accepted.updatedAt,
        author: { '@type': 'Person', name: accepted.author.displayName }
      };
    }

    jsonLd.textContent = JSON.stringify(entity)
      .replace(/</gu, '\\u003c')
      .replace(/>/gu, '\\u003e')
      .replace(/&/gu, '\\u0026');
  };

  const reload = async (): Promise<void> => {
    loading.hidden = false;
    content.hidden = true;
    options.root.setAttribute('aria-busy', 'true');

    try {
      const result = await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}`);
      if (!result.response.ok || !isDetailResponse(result.value)) {
        setSeoForVisibility(false);
        setMessage(error, responseMessage(options.locale, result.response, 'community.notFound'), {
          error: true,
          focus: true
        });
        return;
      }

      currentDetail = result.value;
      setSeoForVisibility(true, result.value);
      renderDetail(result.value);
      error.hidden = true;
      content.hidden = false;
    } catch (_error) {
      setSeoForVisibility(false);
      setMessage(error, message(options.locale, 'community.unavailable'), {
        error: true,
        focus: true
      });
    } finally {
      loading.hidden = true;
      options.root.setAttribute('aria-busy', 'false');
    }
  };

  const renderQuestionEdit = (detail: GetCommunityQuestionApiResponse): void => {
    const form = createElement('form', 'mt-5 grid gap-4');
    const titleLabel = createElement('label', 'nn-type-label');
    titleLabel.textContent = message(options.locale, 'community.questionTitle');
    const titleInput = createElement('input', 'nn-field mt-2');
    titleInput.name = 'title';
    titleInput.required = true;
    titleInput.value = detail.question.title;
    titleLabel.append(titleInput);
    form.append(titleLabel);

    const bodyLabel = createElement('label', 'nn-type-label');
    bodyLabel.textContent = message(options.locale, 'community.questionBody');
    const bodyInput = createElement('textarea', 'nn-field mt-2 min-h-40 resize-y');
    bodyInput.name = 'body';
    bodyInput.required = true;
    bodyInput.value = detail.question.body;
    bodyLabel.append(bodyInput);
    form.append(bodyLabel);

    const topicLabelElement = createElement('label', 'nn-type-label');
    topicLabelElement.textContent = message(options.locale, 'community.topic');
    const topic = createElement('select', 'nn-field mt-2');
    topic.name = 'topicId';
    appendTopicOptions(topic, options.locale, detail.question.topicId);
    topicLabelElement.append(topic);
    form.append(topicLabelElement);

    const controls = createElement('div', 'flex flex-wrap gap-3');
    const save = createElement('button', 'nn-button nn-button--primary');
    save.type = 'submit';
    save.textContent = message(options.locale, 'community.save');
    controls.append(save);
    const cancel = createElement('button', 'nn-button nn-button--secondary');
    cancel.type = 'button';
    cancel.textContent = message(options.locale, 'community.cancel');
    cancel.addEventListener('click', () => renderQuestionActions(currentDetail as GetCommunityQuestionApiResponse));
    controls.append(cancel);
    form.append(controls);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      save.disabled = true;
      void (async () => {
        const result = await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: titleInput.value, body: bodyInput.value, topicId: topic.value })
        });
        if (result.response.ok) {
          await reload();
        } else {
          setMessage(error, responseMessage(options.locale, result.response), { error: true, focus: true });
          save.disabled = false;
        }
      })();
    });

    clearElement(actions);
    actions.append(form);
  };

  const renderQuestionActions = (detail: GetCommunityQuestionApiResponse): void => {
    clearElement(actions);
    const viewer = detail.viewer;
    const controls = createElement('div', 'flex flex-wrap gap-3');

    if (viewer.canEditQuestion) {
      addButton(controls, message(options.locale, 'community.edit'), () => renderQuestionEdit(detail));
    }
    if (viewer.canDeleteQuestion) {
      addButton(controls, message(options.locale, 'community.delete'), () => {
        if (!window.confirm(message(options.locale, 'community.deleteConfirm'))) {
          return;
        }
        void (async () => {
          const result = await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}`, {
            method: 'DELETE'
          });
          if (result.response.ok) {
            window.location.assign(localizedCommunityPath(options.locale, '/community/'));
          } else {
            setMessage(error, responseMessage(options.locale, result.response), { error: true, focus: true });
          }
        })();
      }, 'quiet');
    }
    if (controls.childElementCount > 0) {
      actions.append(controls);
    }
    if (viewer.isModerator) {
      appendModerationButtons(actions, options.locale, 'QUESTION', detail.question.questionId, reload);
    }
    if (viewer.canReport) {
      appendReportForm(actions, options.locale, 'QUESTION', detail.question.questionId, () => undefined);
    }
  };

  const renderAnswer = (
    detail: GetCommunityQuestionApiResponse,
    answer: CommunityPublicAnswer
  ): HTMLElement => {
    const item = createElement('li');
    const card = createElement('article', 'nn-surface nn-surface--base p-5 sm:p-6');
    const header = createElement('div', 'flex flex-wrap items-center justify-between gap-2');
    const author = createElement('p', 'nn-type-metadata');
    author.textContent = `${message(options.locale, 'community.author')} ${answer.author.displayName}`;
    header.append(author);
    appendTime(header, options.locale, answer.createdAt, answer.updatedAt);
    card.append(header);

    if (detail.acceptedAnswerId === answer.answerId) {
      const accepted = createElement('p', 'mt-4 inline-flex flex-wrap gap-x-2 gap-y-1 nn-badge');
      accepted.textContent = `${message(options.locale, 'community.accepted')} · ${message(options.locale, 'community.acceptedByAuthor')}`;
      card.append(accepted);
    }

    const answerBody = createElement('div', 'mt-4 whitespace-pre-wrap text-[var(--nn-text-secondary)]');
    answerBody.textContent = answer.body;
    card.append(answerBody);

    const answerActions = createElement('div', 'mt-5 flex flex-wrap gap-3');
    const capabilities = detail.viewer.answerCapabilities[answer.answerId];
    if (capabilities?.canEdit === true) {
      addButton(answerActions, message(options.locale, 'community.edit'), () => {
        const editForm = createElement('form', 'mt-5 grid w-full gap-4');
        const label = createElement('label', 'nn-type-label');
        label.textContent = message(options.locale, 'community.answer');
        const input = createElement('textarea', 'nn-field mt-2 min-h-32 resize-y');
        input.value = answer.body;
        label.append(input);
        editForm.append(label);
        const save = createElement('button', 'nn-button nn-button--primary justify-self-start');
        save.type = 'submit';
        save.textContent = message(options.locale, 'community.save');
        editForm.append(save);
        editForm.addEventListener('submit', (event) => {
          event.preventDefault();
          save.disabled = true;
          void (async () => {
            const result = await requestJson(`/api/community/answers/${encodeURIComponent(answer.answerId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ body: input.value })
            });
            if (result.response.ok) {
              await reload();
            } else {
              setMessage(error, responseMessage(options.locale, result.response), { error: true, focus: true });
              save.disabled = false;
            }
          })();
        });
        card.append(editForm);
      });
    }
    if (capabilities?.canDelete === true) {
      addButton(answerActions, message(options.locale, 'community.delete'), () => {
        if (!window.confirm(message(options.locale, 'community.deleteConfirm'))) {
          return;
        }
        void (async () => {
          const result = await requestJson(`/api/community/answers/${encodeURIComponent(answer.answerId)}`, {
            method: 'DELETE'
          });
          if (result.response.ok) {
            await reload();
          } else {
            setMessage(error, responseMessage(options.locale, result.response), { error: true, focus: true });
          }
        })();
      }, 'quiet');
    }
    if (detail.viewer.canAcceptAnswer) {
      const isAccepted = detail.acceptedAnswerId === answer.answerId;
      addButton(answerActions, message(options.locale, isAccepted ? 'community.removeAccepted' : 'community.accept'), () => {
        void (async () => {
          const result = isAccepted
            ? await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}/accepted-answer`, { method: 'DELETE' })
            : await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}/accepted-answer`, {
                method: 'PUT',
                body: JSON.stringify({ answerId: answer.answerId })
              });
          if (result.response.ok) {
            await reload();
          } else {
            setMessage(error, responseMessage(options.locale, result.response), { error: true, focus: true });
          }
        })();
      });
    }
    card.append(answerActions);

    if (detail.viewer.isModerator) {
      appendModerationButtons(card, options.locale, 'ANSWER', answer.answerId, reload);
    }
    if (detail.viewer.canReport) {
      appendReportForm(card, options.locale, 'ANSWER', answer.answerId, () => undefined);
    }

    item.append(card);
    return item;
  };

  const renderAnswerForm = (detail: GetCommunityQuestionApiResponse): void => {
    answerForm.hidden = !detail.viewer.canAnswer;
    authNote.hidden = detail.viewer.canAnswer;
    answerFields.hidden = !detail.viewer.canAnswer;
    if (!detail.viewer.canAnswer) {
      profileGate.hidden = true;
      return;
    }

    const answerInput = answerForm.elements.namedItem('body');
    if (answerInput instanceof HTMLTextAreaElement) {
      answerInput.value = '';
    }
  };

  const renderDetail = (detail: GetCommunityQuestionApiResponse): void => {
    title.textContent = detail.question.title;
    body.textContent = detail.question.body;
    metadata.textContent = `${topicLabel(options.locale, detail.question.topicId)} · ${message(options.locale, 'community.author')} ${detail.question.author.displayName} · ${formatDate(options.locale, detail.question.updatedAt)}`;
    if (detail.question.createdAt !== detail.question.updatedAt) {
      const edited = createElement('span', 'nn-type-metadata ml-2');
      edited.textContent = message(options.locale, 'community.edited');
      metadata.append(edited);
    }
    acceptance.hidden = detail.acceptedAnswerId === null;
    acceptance.textContent = detail.acceptedAnswerId === null
      ? ''
      : message(options.locale, 'community.acceptedByAuthor');
    answersHeading.textContent = `${message(options.locale, 'community.answers')} (${new Intl.NumberFormat(options.locale).format(detail.answers.length)})`;
    clearElement(answers);
    if (detail.answers.length === 0) {
      const empty = createElement('li', 'nn-async-state nn-async-state--empty');
      empty.textContent = message(options.locale, 'community.empty');
      answers.append(empty);
    } else {
      for (const answer of detail.answers) {
        answers.append(renderAnswer(detail, answer));
      }
    }
    renderQuestionActions(detail);
    renderAnswerForm(detail);
  };

  answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = answerForm.elements.namedItem('body');
    const submit = answerForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!(input instanceof HTMLTextAreaElement) || submit === null || currentDetail === null) {
      return;
    }
    submit.disabled = true;
    setMessage(answerStatus, message(options.locale, 'community.saving'));
    void (async () => {
      try {
        const result = await requestJson(`/api/community/questions/${encodeURIComponent(questionId)}/answers`, {
          method: 'POST',
          body: JSON.stringify({ body: input.value })
        });
        if (!result.response.ok) {
          setMessage(answerStatus, responseMessage(options.locale, result.response), { error: true, focus: true });
          if (result.response.status === 409) {
            profileGate.hidden = false;
            answerFields.hidden = true;
          }
          return;
        }
        setMessage(answerStatus, message(options.locale, 'community.answerCreated'));
        await reload();
      } catch (_error) {
        setMessage(answerStatus, message(options.locale, 'community.serverError'), { error: true, focus: true });
      } finally {
        submit.disabled = false;
      }
    })();
  });

  void reload();
}
