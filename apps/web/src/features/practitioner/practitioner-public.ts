import type {
  GetPractitionerProfileApiResponse,
  ListPractitionerProfilesApiResponse,
  PractitionerPublicProfile,
  PractitionerReportCategory
} from '@natalnode/contracts';
import { getLocalizedPath, type SupportedLocale } from '@/lib/localization';
import { getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';

const PRACTICE_AREAS = [
  'NATAL_ASTROLOGY',
  'CHART_INTERPRETATION',
  'ASTROLOGY_EDUCATION',
  'ASTROLOGY_RESEARCH',
  'RELATIONSHIP_ASTROLOGY',
  'TIMING_AND_CYCLES',
  'OTHER'
] as const;

const REPORT_CATEGORIES: readonly PractitionerReportCategory[] = [
  'IMPERSONATION',
  'MISLEADING_CLAIM',
  'PRIVACY',
  'DANGEROUS_OR_HIGH_STAKES_ADVICE',
  'SPAM',
  'OTHER'
];

interface ApiResult {
  readonly response: Response;
  readonly value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPublicProfile(value: unknown): value is PractitionerPublicProfile {
  return (
    isRecord(value) &&
    typeof value.practitionerId === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.professionalHeadline === 'string' &&
    typeof value.bio === 'string' &&
    Array.isArray(value.practiceAreas) &&
    value.practiceAreas.every((area) => PRACTICE_AREAS.includes(area as typeof PRACTICE_AREAS[number])) &&
    Array.isArray(value.languages) &&
    value.languages.every((language) => typeof language === 'string') &&
    typeof value.countryOrRegion === 'string' &&
    (value.websiteUrl === undefined || typeof value.websiteUrl === 'string') &&
    typeof value.foundingPractitioner === 'boolean' &&
    typeof value.approvedAt === 'string' &&
    Array.isArray(value.contributions) &&
    value.contributions.every((contribution) =>
      isRecord(contribution) &&
      (contribution.kind === 'QUESTION' || contribution.kind === 'ANSWER') &&
      typeof contribution.contributionId === 'string' &&
      typeof contribution.title === 'string' &&
      typeof contribution.href === 'string' &&
      typeof contribution.createdAt === 'string'
    )
  );
}

function isDirectoryResponse(value: unknown): value is ListPractitionerProfilesApiResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.profiles) &&
    value.profiles.every(isPublicProfile) &&
    (value.nextCursor === null || typeof value.nextCursor === 'string')
  );
}

function isProfileResponse(value: unknown): value is GetPractitionerProfileApiResponse {
  return (
    isRecord(value) &&
    isPublicProfile(value.profile) &&
    typeof value.disclosure === 'string'
  );
}

function message(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function practitionerMessage(locale: SupportedLocale, key: string): string {
  return getUiMessage(locale, key as UiMessageKey);
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

function clearElement(element: HTMLElement): void {
  while (element.firstChild !== null) {
    element.removeChild(element.firstChild);
  }
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

function isSafeWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch (_error) {
    return false;
  }
}

function localizedContributionHref(
  locale: SupportedLocale,
  href: string
): string | null {
  try {
    const parsed = new URL(href, window.location.origin);
    if (
      parsed.origin !== window.location.origin ||
      parsed.pathname !== '/community/question'
    ) {
      return null;
    }
    return getLocalizedPath(locale, `${parsed.pathname}${parsed.search}`);
  } catch (_error) {
    return null;
  }
}

function formatDate(locale: SupportedLocale, value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

function areaMessageKey(area: string): UiMessageKey {
  return `practitioner.practiceArea.${area}` as UiMessageKey;
}

function renderList(items: HTMLElement, profiles: readonly PractitionerPublicProfile[], locale: SupportedLocale): void {
  for (const profile of profiles) {
    const card = createElement('article', 'rounded-2xl border border-natal-border/70 bg-natal-surface/35 p-5 sm:p-6');
    const heading = createElement('h2', 'text-xl font-semibold text-natal-text');
    heading.textContent = profile.displayName;
    card.append(heading);

    const headline = createElement('p', 'mt-2 text-base text-[var(--nn-text-secondary)]');
    headline.textContent = profile.professionalHeadline;
    card.append(headline);

    if (profile.foundingPractitioner) {
      const label = createElement('p', 'nn-badge mt-4 inline-flex');
      label.textContent = practitionerMessage(locale, 'practitioner.founding');
      card.append(label);
    }

    const metadata = createElement('p', 'mt-4 text-sm leading-6 text-[var(--nn-text-secondary)]');
    metadata.textContent = `${profile.countryOrRegion} · ${profile.languages.join(', ')}`;
    card.append(metadata);

    const areas = createElement('p', 'mt-2 text-sm leading-6 text-[var(--nn-text-secondary)]');
    areas.textContent = profile.practiceAreas.map((area) => message(locale, areaMessageKey(area))).join(' · ');
    card.append(areas);

    const link = createElement('a', 'mt-5 inline-flex font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4');
    link.href = getLocalizedPath(locale, `/practitioners/profile?id=${encodeURIComponent(profile.practitionerId)}`);
    link.textContent = practitionerMessage(locale, 'practitioner.viewProfile');
    card.append(link);
    items.append(card);
  }
}

function setMessage(element: HTMLElement, text: string, error = false): void {
  element.textContent = text;
  element.hidden = text === '';
  element.classList.toggle('nn-async-state--error', error);
}

export interface PractitionerDirectoryOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export function initializePractitionerDirectory({
  root,
  locale
}: PractitionerDirectoryOptions): void {
  const list = root.querySelector<HTMLElement>('[data-practitioner-directory]');
  const loading = root.querySelector<HTMLElement>('[data-practitioner-directory-loading]');
  const error = root.querySelector<HTMLElement>('[data-practitioner-directory-error]');
  const empty = root.querySelector<HTMLElement>('[data-practitioner-directory-empty]');
  const more = root.querySelector<HTMLButtonElement>('[data-practitioner-directory-more]');
  if (!list || !loading || !error || !empty || !more) {
    return;
  }

  let cursor: string | null = null;
  let busy = false;

  const load = async (append: boolean): Promise<void> => {
    if (busy || (append && cursor === null)) {
      return;
    }
    busy = true;
    root.setAttribute('aria-busy', 'true');
    loading.hidden = false;
    error.hidden = true;
    more.disabled = true;
    try {
      const query = new URLSearchParams({ limit: '20' });
      if (append && cursor !== null) {
        query.set('cursor', cursor);
      }
      const result = await requestJson(`/api/practitioners?${query.toString()}`);
      if (!result.response.ok || !isDirectoryResponse(result.value)) {
        throw new Error('directory');
      }
      if (!append) {
        clearElement(list);
      }
      renderList(list, result.value.profiles, locale);
      cursor = result.value.nextCursor;
      empty.hidden = list.childElementCount !== 0;
      more.hidden = cursor === null;
    } catch (_error) {
      setMessage(error, message(locale, 'practitioner.loadError'), true);
      error.focus();
      if (!append) {
        empty.hidden = true;
      }
    } finally {
      loading.hidden = true;
      more.disabled = false;
      busy = false;
      root.setAttribute('aria-busy', 'false');
    }
  };

  more.addEventListener('click', () => {
    void load(true);
  });
  void load(false);
}

export interface PractitionerProfileOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export function initializePractitionerProfile({
  root,
  locale
}: PractitionerProfileOptions): void {
  const loading = root.querySelector<HTMLElement>('[data-practitioner-profile-loading]');
  const error = root.querySelector<HTMLElement>('[data-practitioner-profile-error]');
  const content = root.querySelector<HTMLElement>('[data-practitioner-profile-content]');
  const name = root.querySelector<HTMLElement>('[data-practitioner-profile-name]');
  const headline = root.querySelector<HTMLElement>('[data-practitioner-profile-headline]');
  const bio = root.querySelector<HTMLElement>('[data-practitioner-profile-bio]');
  const areas = root.querySelector<HTMLElement>('[data-practitioner-profile-areas]');
  const languages = root.querySelector<HTMLElement>('[data-practitioner-profile-languages]');
  const country = root.querySelector<HTMLElement>('[data-practitioner-profile-country]');
  const founding = root.querySelector<HTMLElement>('[data-practitioner-profile-founding]');
  const approved = root.querySelector<HTMLElement>('[data-practitioner-profile-approved]');
  const disclosure = root.querySelector<HTMLElement>('[data-practitioner-profile-disclosure]');
  const contributions = root.querySelector<HTMLElement>('[data-practitioner-profile-contributions]');
  const contributionsEmpty = root.querySelector<HTMLElement>('[data-practitioner-profile-contributions-empty]');
  const website = root.querySelector<HTMLAnchorElement>('[data-practitioner-profile-website]');
  const reportForm = root.querySelector<HTMLFormElement>('[data-practitioner-report-form]');
  const reportCategory = root.querySelector<HTMLSelectElement>('[data-practitioner-report-category]');
  const reportDetails = root.querySelector<HTMLTextAreaElement>('[data-practitioner-report-details]');
  const reportStatus = root.querySelector<HTMLElement>('[data-practitioner-report-status]');
  if (!loading || !error || !content || !name || !headline || !bio || !areas || !languages || !country || !founding || !approved || !disclosure || !contributions || !contributionsEmpty || !website || !reportForm || !reportCategory || !reportDetails || !reportStatus) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get('id');
  if (id === null || id.trim() === '' || id.length > 256) {
    loading.hidden = true;
    setMessage(error, message(locale, 'practitioner.unavailable'), true);
    error.focus();
    return;
  }

  const reportOptions = REPORT_CATEGORIES.map((category) => {
    const option = createElement('option');
    option.value = category;
    option.textContent = practitionerMessage(locale, `practitioner.reportCategory.${category}`);
    return option;
  });
  reportCategory.append(...reportOptions);

  const render = (profile: PractitionerPublicProfile): void => {
    name.textContent = profile.displayName;
    headline.textContent = profile.professionalHeadline;
    bio.textContent = profile.bio;
    areas.textContent = profile.practiceAreas.map((area) => message(locale, areaMessageKey(area))).join(' · ');
    languages.textContent = profile.languages.join(', ');
    country.textContent = profile.countryOrRegion;
    founding.textContent = profile.foundingPractitioner ? message(locale, 'practitioner.founding') : '';
    founding.hidden = !profile.foundingPractitioner;
    approved.textContent = formatDate(locale, profile.approvedAt);
    disclosure.textContent = message(locale, 'practitioner.disclosure');
    if (profile.websiteUrl !== undefined && isSafeWebsite(profile.websiteUrl)) {
      website.href = profile.websiteUrl;
      website.textContent = profile.websiteUrl;
      website.hidden = false;
    } else {
      website.hidden = true;
    }

    clearElement(contributions);
    for (const contribution of profile.contributions) {
      const href = localizedContributionHref(locale, contribution.href);
      if (href === null) {
        continue;
      }
      const item = createElement('li', 'border-b border-natal-border/60 pb-3 last:border-b-0');
      const link = createElement('a', 'font-semibold text-natal-accent underline decoration-natal-accent/50 underline-offset-4');
      link.href = href;
      link.textContent = contribution.title;
      item.append(link);
      contributions.append(item);
    }
    contributionsEmpty.hidden = contributions.childElementCount !== 0;
    content.hidden = false;
  };

  reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    reportStatus.hidden = true;
    const submit = reportForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit !== null) {
      submit.disabled = true;
    }
    try {
      const result = await requestJson('/api/practitioner/reports', {
        method: 'POST',
        body: JSON.stringify({
          practitionerId: id,
          category: reportCategory.value,
          ...(reportDetails.value.trim() === '' ? {} : { details: reportDetails.value })
        })
      });
      if (result.response.status === 401) {
        throw new Error('auth');
      }
      if (result.response.status === 409) {
        throw new Error('duplicate');
      }
      if (result.response.status === 429) {
        throw new Error('rate');
      }
      if (!result.response.ok) {
        throw new Error('report');
      }
      reportStatus.className = 'nn-status nn-status--success';
      reportStatus.textContent = message(locale, 'practitioner.reportSuccess');
      reportStatus.hidden = false;
      reportDetails.value = '';
    } catch (reportError) {
      reportStatus.className = 'nn-status nn-status--error';
      reportStatus.textContent = reportError instanceof Error && reportError.message === 'auth'
        ? message(locale, 'practitioner.authRequired')
        : reportError instanceof Error && reportError.message === 'rate'
          ? message(locale, 'practitioner.rateLimited')
          : message(locale, 'practitioner.reportError');
      reportStatus.hidden = false;
    } finally {
      if (submit !== null) {
        submit.disabled = false;
      }
    }
  });

  void requestJson(`/api/practitioners/${encodeURIComponent(id)}`).then((result) => {
    if (!result.response.ok || !isProfileResponse(result.value)) {
      throw new Error('profile');
    }
    render(result.value.profile);
  }).catch(() => {
    setMessage(error, message(locale, 'practitioner.unavailable'), true);
    error.focus();
  }).finally(() => {
    loading.hidden = true;
    root.setAttribute('aria-busy', 'false');
  });
}
