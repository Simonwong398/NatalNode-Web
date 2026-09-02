import {
  PRACTITIONER_APPLICATION_STATUSES,
  type PractitionerApplicationStatus,
  type PractitionerPracticeAreaId,
  type PractitionerProfileRevisionView
} from '@natalnode/contracts';
import { getUiMessage, type UiMessageKey } from '@/lib/ui-catalog';
import { type SupportedLocale } from '@/lib/localization';

interface ApiResult {
  readonly response: Response;
  readonly value: unknown;
}

interface ApplicationView {
  readonly applicationId: string;
  readonly status: PractitionerApplicationStatus;
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: readonly string[];
}

interface ApplicationEnvelope {
  readonly application: ApplicationView | null;
}

interface ProfileEnvelope {
  readonly profile: {
    readonly practitionerId: string;
    readonly displayName: string;
    readonly professionalHeadline: string;
    readonly bio: string;
    readonly practiceAreas: readonly string[];
    readonly languages: readonly string[];
    readonly countryOrRegion: string;
    readonly websiteUrl?: string;
  };
  readonly pendingRevision: PractitionerProfileRevisionView | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isApplication(value: unknown): value is ApplicationView {
  return (
    isRecord(value) &&
    typeof value.applicationId === 'string' &&
    PRACTITIONER_APPLICATION_STATUSES.includes(value.status as PractitionerApplicationStatus) &&
    typeof value.requestedDisplayName === 'string' &&
    typeof value.professionalHeadline === 'string' &&
    typeof value.bio === 'string' &&
    Array.isArray(value.practiceAreas) &&
    Array.isArray(value.languages) &&
    typeof value.countryOrRegion === 'string' &&
    (value.websiteUrl === undefined || typeof value.websiteUrl === 'string') &&
    typeof value.practiceStatement === 'string' &&
    Array.isArray(value.evidenceUrls)
  );
}

function isApplicationEnvelope(value: unknown): value is ApplicationEnvelope {
  return isRecord(value) && (value.application === null || isApplication(value.application));
}

function isProfileEnvelope(value: unknown): value is ProfileEnvelope {
  return (
    isRecord(value) &&
    isRecord(value.profile) &&
    typeof value.profile.practitionerId === 'string' &&
    typeof value.profile.displayName === 'string' &&
    typeof value.profile.professionalHeadline === 'string' &&
    typeof value.profile.bio === 'string' &&
    Array.isArray(value.profile.practiceAreas) &&
    Array.isArray(value.profile.languages) &&
    typeof value.profile.countryOrRegion === 'string' &&
    (value.profile.websiteUrl === undefined || typeof value.profile.websiteUrl === 'string') &&
    (value.pendingRevision === null || isRecord(value.pendingRevision))
  );
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

function setMessage(element: HTMLElement, text: string, kind: 'info' | 'success' | 'error' = 'info'): void {
  element.className = kind === 'error'
    ? 'nn-status nn-status--error'
    : kind === 'success'
      ? 'nn-status nn-status--success'
      : 'nn-status';
  element.textContent = text;
  element.hidden = text === '';
}

function fields(form: HTMLFormElement): {
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: PractitionerPracticeAreaId[];
  readonly languages: string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: string[];
  readonly consentToPublicProfile: true;
} {
  const value = (name: string): string => {
    const control = form.elements.namedItem(name);
    return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
      ? control.value.trim()
      : '';
  };
  const website = value('websiteUrl');
  const consent = form.elements.namedItem('consentToPublicProfile');
  if (!(consent instanceof HTMLInputElement) || !consent.checked) {
    throw new Error('validation');
  }
  return {
    requestedDisplayName: value('requestedDisplayName'),
    professionalHeadline: value('professionalHeadline'),
    bio: value('bio'),
    practiceAreas: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="practiceAreas"]:checked'))
      .map((input) => input.value as PractitionerPracticeAreaId),
    languages: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="languages"]:checked'))
      .map((input) => input.value),
    countryOrRegion: value('countryOrRegion'),
    ...(website === '' ? {} : { websiteUrl: website }),
    practiceStatement: value('practiceStatement'),
    evidenceUrls: value('evidenceUrls').split(/\r?\n/u).map((entry) => entry.trim()).filter(Boolean),
    consentToPublicProfile: true
  };
}

function revisionFields(form: HTMLFormElement): {
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: PractitionerPracticeAreaId[];
  readonly languages: string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
} {
  const value = (name: string): string => {
    const control = form.elements.namedItem(name);
    return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
      ? control.value.trim()
      : '';
  };
  const website = value('websiteUrl');
  return {
    displayName: value('displayName'),
    professionalHeadline: value('professionalHeadline'),
    bio: value('bio'),
    practiceAreas: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="practiceAreas"]:checked'))
      .map((input) => input.value as PractitionerPracticeAreaId),
    languages: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="languages"]:checked'))
      .map((input) => input.value),
    countryOrRegion: value('countryOrRegion'),
    ...(website === '' ? {} : { websiteUrl: website })
  };
}

function setFieldValue(form: HTMLFormElement, name: string, value: string): void {
  const control = form.elements.namedItem(name);
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    control.value = value;
  }
}

function setCheckedValues(form: HTMLFormElement, name: string, values: readonly string[]): void {
  const selected = new Set(values);
  for (const input of form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
    input.checked = selected.has(input.value);
  }
}

function populateApplicationForm(form: HTMLFormElement, application: ApplicationView | null): void {
  setFieldValue(form, 'requestedDisplayName', application?.requestedDisplayName ?? '');
  setFieldValue(form, 'professionalHeadline', application?.professionalHeadline ?? '');
  setFieldValue(form, 'bio', application?.bio ?? '');
  setCheckedValues(form, 'practiceAreas', application?.practiceAreas ?? []);
  setCheckedValues(form, 'languages', application?.languages ?? []);
  setFieldValue(form, 'countryOrRegion', application?.countryOrRegion ?? '');
  setFieldValue(form, 'websiteUrl', application?.websiteUrl ?? '');
  setFieldValue(form, 'practiceStatement', application?.practiceStatement ?? '');
  setFieldValue(form, 'evidenceUrls', application?.evidenceUrls.join('\n') ?? '');
  const consent = form.elements.namedItem('consentToPublicProfile');
  if (consent instanceof HTMLInputElement) {
    consent.checked = true;
  }
}

function applicationStatusMessage(locale: SupportedLocale, status: PractitionerApplicationStatus): string {
  const key = {
    SUBMITTED: 'practitioner.application.submitted',
    CHANGES_REQUESTED: 'practitioner.application.changesRequested',
    APPROVED: 'practitioner.application.approved',
    REJECTED: 'practitioner.application.rejected',
    WITHDRAWN: 'practitioner.application.withdrawn',
    REVOKED: 'practitioner.application.revoked'
  }[status];
  return message(locale, key);
}

export interface PractitionerApplicationOptions {
  readonly root: HTMLElement;
  readonly locale: SupportedLocale;
}

export function initializePractitionerApplication({
  root,
  locale
}: PractitionerApplicationOptions): void {
  const loading = root.querySelector<HTMLElement>('[data-practitioner-application-loading]');
  const auth = root.querySelector<HTMLElement>('[data-practitioner-application-auth]');
  const error = root.querySelector<HTMLElement>('[data-practitioner-application-error]');
  const status = root.querySelector<HTMLElement>('[data-practitioner-application-status]');
  const form = root.querySelector<HTMLFormElement>('[data-practitioner-application-form]');
  const formTitle = root.querySelector<HTMLElement>('[data-practitioner-application-form-title]');
  const submit = root.querySelector<HTMLButtonElement>('[data-practitioner-application-submit]');
  const withdraw = root.querySelector<HTMLButtonElement>('[data-practitioner-application-withdraw]');
  const cooldown = root.querySelector<HTMLElement>('[data-practitioner-application-cooldown]');
  const revisionPanel = root.querySelector<HTMLElement>('[data-practitioner-revision-panel]');
  const revisionForm = root.querySelector<HTMLFormElement>('[data-practitioner-revision-form]');
  const revisionStatus = root.querySelector<HTMLElement>('[data-practitioner-revision-status]');
  const revisionPending = root.querySelector<HTMLElement>('[data-practitioner-revision-pending]');
  if (!loading || !auth || !error || !status || !form || !formTitle || !submit || !withdraw || !cooldown || !revisionPanel || !revisionForm || !revisionStatus || !revisionPending) {
    return;
  }

  let current: ApplicationView | null = null;

  const setApplicationState = (application: ApplicationView | null): void => {
    current = application;
    populateApplicationForm(form, application);
    const statusText = application === null
      ? message(locale, 'practitioner.application.notApplied')
      : applicationStatusMessage(locale, application.status);
    setMessage(status, statusText, application?.status === 'REJECTED' || application?.status === 'REVOKED' ? 'info' : 'info');
    const canEdit = application === null || application.status === 'CHANGES_REQUESTED' || application.status === 'WITHDRAWN' || application.status === 'REJECTED' || application.status === 'REVOKED';
    form.hidden = !canEdit;
    formTitle.textContent = application?.status === 'CHANGES_REQUESTED'
      ? message(locale, 'practitioner.application.resubmit')
      : message(locale, 'practitioner.application.form');
    submit.textContent = application?.status === 'CHANGES_REQUESTED'
      ? message(locale, 'practitioner.application.resubmit')
      : message(locale, 'practitioner.application.submit');
    withdraw.hidden = application === null || application.status !== 'SUBMITTED' && application.status !== 'CHANGES_REQUESTED';
    cooldown.hidden = application?.status !== 'REJECTED' && application?.status !== 'REVOKED';
    revisionPanel.hidden = application?.status !== 'APPROVED';
  };

  const loadRevision = async (): Promise<void> => {
    if (revisionPanel.hidden) {
      return;
    }
    const result = await requestJson('/api/practitioner/profile');
    if (!result.response.ok || !isProfileEnvelope(result.value)) {
      setMessage(revisionStatus, message(locale, 'practitioner.application.error'), 'error');
      return;
    }
    setFieldValue(revisionForm, 'displayName', result.value.profile.displayName);
    setFieldValue(revisionForm, 'professionalHeadline', result.value.profile.professionalHeadline);
    setFieldValue(revisionForm, 'bio', result.value.profile.bio);
    setCheckedValues(revisionForm, 'practiceAreas', result.value.profile.practiceAreas);
    setCheckedValues(revisionForm, 'languages', result.value.profile.languages);
    setFieldValue(revisionForm, 'countryOrRegion', result.value.profile.countryOrRegion);
    setFieldValue(revisionForm, 'websiteUrl', result.value.profile.websiteUrl ?? '');
    if (result.value.pendingRevision === null) {
      revisionPending.hidden = true;
    } else {
      revisionPending.textContent = `${message(locale, 'practitioner.application.status')}: ${result.value.pendingRevision.status}`;
      revisionPending.hidden = false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      setMessage(error, message(locale, 'practitioner.application.validation'), 'error');
      error.focus();
      return;
    }
    submit.disabled = true;
    setMessage(status, message(locale, 'practitioner.application.saving'));
    try {
      const payload = fields(form);
      const isResubmission = current?.status === 'CHANGES_REQUESTED';
      const result = await requestJson(
        isResubmission ? `/api/practitioner/application/${encodeURIComponent(current!.applicationId)}` : '/api/practitioner/application',
        { method: isResubmission ? 'PATCH' : 'POST', body: JSON.stringify(payload) }
      );
      if (result.response.status === 401) {
        throw new Error('auth');
      }
      if (result.response.status === 409) {
        throw new Error('conflict');
      }
      if (result.response.status === 429) {
        throw new Error('rate');
      }
      if (!result.response.ok || !isApplicationEnvelope(result.value) || result.value.application === null) {
        throw new Error('save');
      }
      setApplicationState(result.value.application);
      setMessage(status, message(locale, 'practitioner.application.saved'), 'success');
      await loadRevision();
    } catch (saveError) {
      const code = saveError instanceof Error ? saveError.message : '';
      setMessage(error, code === 'auth'
        ? message(locale, 'practitioner.application.noAccount')
        : code === 'rate'
          ? message(locale, 'practitioner.rateLimited')
          : code === 'conflict'
            ? message(locale, 'practitioner.application.cooldown')
            : message(locale, 'practitioner.application.error'), 'error');
      error.focus();
    } finally {
      submit.disabled = false;
    }
  });

  withdraw.addEventListener('click', async () => {
    if (current === null) {
      return;
    }
    withdraw.disabled = true;
    try {
      const result = await requestJson(`/api/practitioner/application/${encodeURIComponent(current.applicationId)}/withdraw`, { method: 'POST' });
      if (!result.response.ok || !isApplicationEnvelope(result.value) || result.value.application === null) {
        throw new Error('withdraw');
      }
      setApplicationState(result.value.application);
      setMessage(status, message(locale, 'practitioner.application.saved'), 'success');
    } catch (_withdrawError) {
      setMessage(error, message(locale, 'practitioner.application.error'), 'error');
      error.focus();
    } finally {
      withdraw.disabled = false;
    }
  });

  revisionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!revisionForm.checkValidity()) {
      setMessage(revisionStatus, message(locale, 'practitioner.application.validation'), 'error');
      revisionStatus.focus();
      return;
    }
    const revisionSubmit = revisionForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (revisionSubmit !== null) {
      revisionSubmit.disabled = true;
    }
    try {
      const result = await requestJson('/api/practitioner/profile/revision', {
        method: 'POST',
        body: JSON.stringify(revisionFields(revisionForm))
      });
      if (result.response.status === 409) {
        throw new Error('conflict');
      }
      if (!result.response.ok) {
        throw new Error('revision');
      }
      setMessage(revisionStatus, result.response.status === 201
        ? message(locale, 'practitioner.application.saved')
        : message(locale, 'practitioner.application.error'), 'success');
      await loadRevision();
    } catch (revisionError) {
      setMessage(revisionStatus, revisionError instanceof Error && revisionError.message === 'conflict'
        ? message(locale, 'practitioner.application.changesRequested')
        : message(locale, 'practitioner.application.error'), 'error');
    } finally {
      if (revisionSubmit !== null) {
        revisionSubmit.disabled = false;
      }
    }
  });

  void requestJson('/api/practitioner/application').then((result) => {
    if (result.response.status === 401) {
      auth.hidden = false;
      form.hidden = true;
      status.hidden = true;
      return;
    }
    if (!result.response.ok || !isApplicationEnvelope(result.value)) {
      throw new Error('load');
    }
    auth.hidden = true;
    setApplicationState(result.value.application);
    void loadRevision();
  }).catch(() => {
    setMessage(error, message(locale, 'practitioner.application.error'), 'error');
    error.focus();
  }).finally(() => {
    loading.hidden = true;
    root.setAttribute('aria-busy', 'false');
  });

}
