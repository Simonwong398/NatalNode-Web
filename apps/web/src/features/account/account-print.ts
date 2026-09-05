import {
  getLocalizedPath,
  getLocalizedCurrentPath,
  getPresentationLocale,
  type SupportedLocale
} from '../../lib/localization.js';
import {
  formatUiMessage,
  getUiMessage,
  type UiMessageKey
} from '../../lib/ui-catalog.js';
import {
  prepareAccountExport,
  resolveAccountExportResponseCode,
  resolvePreparationErrorCode,
  type AccountExportErrorCode
} from './account-export.js';
import { SITE_ORIGIN } from '../../lib/seo.js';

const ACCOUNT_EXPORT_SCHEMA_VERSION = '1.2';
const SIGN_IN_PATH = '/auth/sign-in';
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

type AccountPrintTimeState =
  | 'resolved'
  | 'ambiguous'
  | 'nonexistent'
  | 'unknown'
  | 'unresolved';

type AccountPrintAuthority = 'authoritative' | 'input-only' | 'development-fixture';

export interface AccountPrintIdentity {
  readonly method: 'EMAIL_MAGIC_LINK' | 'GOOGLE';
  readonly email: string | null;
}

export interface AccountPrintNote {
  readonly content: string;
  readonly createdAt: string | null;
}

export interface AccountPrintChart {
  readonly displayName: string;
  readonly category: string;
  readonly birthDate: string | null;
  readonly birthTime: string | null;
  readonly timeState: AccountPrintTimeState;
  readonly locationLabel: string | null;
  readonly timezone: string | null;
  readonly houseSystem: string | null;
  readonly savedAt: string | null;
  readonly authority: AccountPrintAuthority;
  readonly notes: readonly AccountPrintNote[];
}

export interface AccountPrintNotificationChannelPreference {
  readonly enabled: boolean;
}

export interface AccountPrintNotificationCategoryPreference {
  readonly category: 'ACCOUNT' | 'SYSTEM' | 'ASTROLOGY_ALERT';
  readonly enabled: boolean;
}

export interface AccountPrintFeedback {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string | null;
}

export interface AccountPrintPractitionerApplication {
  readonly displayName: string;
  readonly headline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl: string | null;
  readonly practiceStatement: string;
  readonly submittedAt: string | null;
  readonly status: string;
}

export interface AccountPrintPractitionerProfile {
  readonly displayName: string;
  readonly headline: string;
  readonly bio: string;
  readonly practiceAreas: readonly string[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl: string | null;
  readonly approvedAt: string | null;
  readonly profileStatus: string;
}

export interface AccountPrintPractitionerRevision {
  readonly status: string;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
}

export interface AccountPrintModel {
  readonly exportedAt: string;
  readonly account: {
    readonly createdAt: string;
    readonly identities: readonly AccountPrintIdentity[];
  };
  readonly charts: readonly AccountPrintChart[];
  readonly notifications: {
    readonly channelPreferences: readonly AccountPrintNotificationChannelPreference[];
    readonly categoryPreferences: readonly AccountPrintNotificationCategoryPreference[];
  };
  readonly feedback: readonly AccountPrintFeedback[];
  readonly practitioner: {
    readonly application: AccountPrintPractitionerApplication | null;
    readonly profile: AccountPrintPractitionerProfile | null;
    readonly profileRevisions: readonly AccountPrintPractitionerRevision[];
  };
}

export interface AccountPrintElements {
  readonly accountPage: HTMLElement;
  readonly accountContent: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly view: HTMLElement;
  readonly status: HTMLElement;
  readonly error: HTMLElement;
  readonly reauthStatus: HTMLElement;
}

export class AccountExportPayloadError extends Error {
  readonly code: AccountExportErrorCode;

  constructor(code: AccountExportErrorCode) {
    super(`Account export failed with ${code}.`);
    this.name = 'AccountExportPayloadError';
    this.code = code;
  }
}

/** Reads the existing account export endpoint; it does not perform aggregation. */
export async function fetchAccountExportPayload(): Promise<unknown> {
  const response = await fetch('/api/account/export', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    throw new AccountExportPayloadError(
      resolveAccountExportResponseCode(response.status, payload) ?? 'INTERNAL_ERROR'
    );
  }

  return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function readText(value: unknown, maximumCharacters = 10_000): string | null {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    Array.from(value).length > maximumCharacters ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
}

function readNullableText(value: unknown, maximumCharacters = 10_000): string | null {
  return value === null || value === undefined
    ? null
    : readText(value, maximumCharacters);
}

function readSafeWebsiteUrl(value: unknown): string | null {
  const candidate = readNullableText(value, 2_000);
  if (candidate === null) {
    return null;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.replace(/^\[|\]$/gu, '');
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      return null;
    }
  } catch (_error) {
    return null;
  }

  return candidate;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readStringArray(value: unknown, maximumCharacters = 500): readonly string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map((item) => readText(item, maximumCharacters));

  return items.every((item): item is string => item !== null) ? items : null;
}

function timeStateFor(value: unknown): AccountPrintTimeState {
  switch (value) {
    case 'EXACT':
      return 'resolved';
    case 'AMBIGUOUS':
      return 'ambiguous';
    case 'NONEXISTENT':
      return 'nonexistent';
    case 'UNKNOWN_TIME':
      return 'unknown';
    default:
      return 'unresolved';
  }
}

function parseIdentity(value: unknown): AccountPrintIdentity | null {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return null;
  }

  if (value.type === 'EMAIL_MAGIC_LINK') {
    const email = readText(value.email, 320);
    return email === null ? null : { method: value.type, email };
  }

  if (value.type === 'GOOGLE') {
    return { method: value.type, email: null };
  }

  return null;
}

function parseNotes(value: unknown): readonly AccountPrintNote[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const notes: AccountPrintNote[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const content = readText(item.content, 5_000);
    if (content === null) {
      return null;
    }

    notes.push({
      content,
      createdAt: readNullableText(item.createdAt, 100)
    });
  }

  return notes;
}

function isFixtureCalculation(calculation: Record<string, unknown> | null): boolean {
  const engineVersion = readText(calculation?.engineVersion, 200)?.toUpperCase() ?? '';
  return engineVersion.includes('FIXTURE') || engineVersion.includes('MOCK');
}

function parseChart(value: unknown): AccountPrintChart | null {
  if (!isRecord(value) || !hasOwn(value, 'canonicalChartResult')) {
    return null;
  }

  if (value.canonicalChartResult === undefined) {
    return null;
  }

  const displayName = readText(value.displayName, 120);
  const category = readText(value.category, 120);
  const notes = parseNotes(value.notes);

  if (displayName === null || category === null || notes === null) {
    return null;
  }

  const request = isRecord(value.normalizedChartRequest)
    ? value.normalizedChartRequest
    : null;
  const birth = isRecord(request?.birth) ? request.birth : null;
  const calculation = isRecord(value.calculation) ? value.calculation : null;
  const canonicalResultPresent = value.canonicalChartResult !== null;
  const astronomyConfigurationId = readText(
    calculation?.astronomyConfigurationId,
    200
  );
  const hasAuthoritativeResult =
    canonicalResultPresent &&
    astronomyConfigurationId !== null &&
    !isFixtureCalculation(calculation);

  return {
    displayName,
    category,
    birthDate: readText(birth?.localDate, 40),
    birthTime: readNullableText(birth?.localTime, 40),
    timeState: timeStateFor(birth?.ambiguityStatus),
    locationLabel: readText(birth?.locationLabel, 500),
    timezone: readText(birth?.ianaTimeZone, 200),
    houseSystem: readText(request?.houseSystem, 120),
    savedAt: readNullableText(value.createdAt, 100),
    authority: !canonicalResultPresent
      ? 'input-only'
      : hasAuthoritativeResult
        ? 'authoritative'
        : 'development-fixture',
    notes
  };
}

function parseFeedback(value: unknown): AccountPrintFeedback | null {
  if (!isRecord(value)) {
    return null;
  }

  const category = readText(value.category, 120);
  const message = readText(value.message, 5_000);

  return category === null || message === null
    ? null
    : {
        category,
        message,
        createdAt: readNullableText(value.createdAt, 100)
      };
}

function parseChannelPreferences(
  value: unknown
): readonly AccountPrintNotificationChannelPreference[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const preferences: AccountPrintNotificationChannelPreference[] = [];

  for (const item of value) {
    if (!isRecord(item) || item.channel !== 'WEB_PUSH') {
      return null;
    }

    const enabled = readBoolean(item.enabled);
    if (enabled === null) {
      return null;
    }

    preferences.push({ enabled });
  }

  return preferences;
}

function parseCategoryPreferences(
  value: unknown
): readonly AccountPrintNotificationCategoryPreference[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const preferences: AccountPrintNotificationCategoryPreference[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      (item.category !== 'ACCOUNT' &&
        item.category !== 'SYSTEM' &&
        item.category !== 'ASTROLOGY_ALERT')
    ) {
      return null;
    }

    const enabled = readBoolean(item.enabled);
    if (enabled === null) {
      return null;
    }

    preferences.push({ category: item.category, enabled });
  }

  return preferences;
}

function parsePractitionerApplication(
  value: unknown
): AccountPrintPractitionerApplication | null | undefined {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const displayName = readText(value.requestedDisplayName, 160);
  const headline = readText(value.professionalHeadline, 200);
  const bio = readText(value.bio, 5_000);
  const practiceAreas = readStringArray(value.practiceAreas);
  const languages = readStringArray(value.languages);
  const countryOrRegion = readText(value.countryOrRegion, 160);
  const practiceStatement = readText(value.practiceStatement, 5_000);
  const status = readText(value.status, 80);

  if (
    displayName === null ||
    headline === null ||
    bio === null ||
    practiceAreas === null ||
    languages === null ||
    countryOrRegion === null ||
    practiceStatement === null ||
    status === null
  ) {
    return undefined;
  }

  return {
    displayName,
    headline,
    bio,
    practiceAreas,
    languages,
    countryOrRegion,
    websiteUrl: readSafeWebsiteUrl(value.websiteUrl),
    practiceStatement,
    submittedAt: readNullableText(value.submittedAt, 100),
    status
  };
}

function parsePractitionerProfile(
  value: unknown
): AccountPrintPractitionerProfile | null | undefined {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const displayName = readText(value.displayName, 160);
  const headline = readText(value.professionalHeadline, 200);
  const bio = readText(value.bio, 5_000);
  const practiceAreas = readStringArray(value.practiceAreas);
  const languages = readStringArray(value.languages);
  const countryOrRegion = readText(value.countryOrRegion, 160);
  const profileStatus = readText(value.profileStatus, 80);

  if (
    displayName === null ||
    headline === null ||
    bio === null ||
    practiceAreas === null ||
    languages === null ||
    countryOrRegion === null ||
    profileStatus === null
  ) {
    return undefined;
  }

  return {
    displayName,
    headline,
    bio,
    practiceAreas,
    languages,
    countryOrRegion,
    websiteUrl: readSafeWebsiteUrl(value.websiteUrl),
    approvedAt: readNullableText(value.approvedAt, 100),
    profileStatus
  };
}

function parsePractitionerRevisions(
  value: unknown
): readonly AccountPrintPractitionerRevision[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const revisions: AccountPrintPractitionerRevision[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const status = readText(item.status, 80);
    if (status === null) {
      return null;
    }

    revisions.push({
      status,
      submittedAt: readNullableText(item.submittedAt, 100),
      reviewedAt: readNullableText(item.reviewedAt, 100)
    });
  }

  return revisions;
}

function parsePractitioner(
  value: unknown
): AccountPrintModel['practitioner'] | null {
  if (
    !isRecord(value) ||
    !hasOwn(value, 'application') ||
    !hasOwn(value, 'profile') ||
    !hasOwn(value, 'profileRevisions')
  ) {
    return null;
  }

  const application = parsePractitionerApplication(value.application);
  const profile = parsePractitionerProfile(value.profile);
  const profileRevisions = parsePractitionerRevisions(value.profileRevisions);

  if (application === undefined || profile === undefined || profileRevisions === null) {
    return null;
  }

  return { application, profile, profileRevisions };
}

/** Builds a safe, non-authoritative projection from the existing export payload. */
export function buildAccountPrintModel(value: unknown): AccountPrintModel | null {
  if (
    !isRecord(value) ||
    value.exportSchemaVersion !== ACCOUNT_EXPORT_SCHEMA_VERSION
  ) {
    return null;
  }

  const exportedAt = readText(value.exportedAt, 100);
  const accountValue = value.account;
  const chartsValue = value.charts;
  const feedbackValue = value.feedback;
  const notificationsValue = value.notifications;

  if (
    exportedAt === null ||
    !isRecord(accountValue) ||
    !Array.isArray(accountValue.identities) ||
    !Array.isArray(chartsValue) ||
    !Array.isArray(feedbackValue) ||
    !isRecord(notificationsValue)
  ) {
    return null;
  }

  const createdAt = readText(accountValue.createdAt, 100);
  const parsedIdentities = accountValue.identities.map(parseIdentity);
  const parsedCharts = chartsValue.map(parseChart);
  const parsedFeedback = feedbackValue.map(parseFeedback);
  const channelPreferences = parseChannelPreferences(
    notificationsValue.channelPreferences
  );
  const categoryPreferences = parseCategoryPreferences(
    notificationsValue.categoryPreferences
  );
  const practitioner = parsePractitioner(value.practitioner);

  if (
    createdAt === null ||
    parsedIdentities.some((identity) => identity === null) ||
    parsedCharts.some((chart) => chart === null) ||
    parsedFeedback.some((item) => item === null) ||
    channelPreferences === null ||
    categoryPreferences === null ||
    practitioner === null
  ) {
    return null;
  }

  const identities = parsedIdentities.filter(isDefined);
  const charts = parsedCharts.filter(isDefined);
  const feedback = parsedFeedback.filter(isDefined);

  return {
    exportedAt,
    account: { createdAt, identities },
    charts,
    notifications: { channelPreferences, categoryPreferences },
    feedback,
    practitioner
  };
}

function ui(locale: SupportedLocale, key: UiMessageKey): string {
  return getUiMessage(locale, key);
}

function formatInstant(
  locale: SupportedLocale,
  value: string | null
): string {
  if (value === null) {
    return ui(locale, 'account.print.notAvailable');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return ui(locale, 'account.print.notAvailable');
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatLocalDate(
  locale: SupportedLocale,
  value: string | null
): string {
  if (value === null) {
    return ui(locale, 'account.print.notAvailable');
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (match === null) {
    return ui(locale, 'account.print.notAvailable');
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    return ui(locale, 'account.print.notAvailable');
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(date);
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

interface PrintEntry {
  readonly label: string;
  readonly value: string;
}

function appendDefinitionList(
  document: Document,
  parent: HTMLElement,
  entries: readonly PrintEntry[]
): void {
  const list = createElement(document, 'dl', 'account-print-definition-list');

  for (const entry of entries) {
    const item = createElement(document, 'div', 'account-print-definition-item');
    item.append(
      createElement(document, 'dt', 'account-print-label', entry.label),
      createElement(document, 'dd', 'account-print-value', entry.value)
    );
    list.append(item);
  }

  parent.append(list);
}

function appendSection(
  document: Document,
  parent: HTMLElement,
  title: string
): HTMLElement {
  const section = createElement(document, 'section', 'account-print-section');
  section.append(createElement(document, 'h3', 'account-print-section-title', title));
  parent.append(section);
  return section;
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

function timeStateLabel(locale: SupportedLocale, state: AccountPrintTimeState): string {
  const keyByState: Readonly<Record<AccountPrintTimeState, UiMessageKey>> = {
    resolved: 'vault.timeState.resolved',
    ambiguous: 'vault.timeState.ambiguous',
    nonexistent: 'vault.timeState.nonexistent',
    unknown: 'vault.timeState.unknown',
    unresolved: 'vault.timeState.unresolved'
  };

  return ui(locale, keyByState[state]);
}

function authorityLabel(locale: SupportedLocale, authority: AccountPrintAuthority): string {
  const keyByAuthority: Readonly<Record<AccountPrintAuthority, UiMessageKey>> = {
    authoritative: 'vault.state.authoritative',
    'input-only': 'vault.state.inputOnly',
    'development-fixture': 'vault.state.developmentFixture'
  };

  return ui(locale, keyByAuthority[authority]);
}

function authorityDescription(
  locale: SupportedLocale,
  authority: AccountPrintAuthority
): string {
  const keyByAuthority: Readonly<Record<AccountPrintAuthority, UiMessageKey>> = {
    authoritative: 'vault.provenanceAuthoritative',
    'input-only': 'vault.provenanceInputOnly',
    'development-fixture': 'vault.provenanceDevelopmentFixture'
  };

  return ui(locale, keyByAuthority[authority]);
}

function notificationCategoryLabel(
  locale: SupportedLocale,
  category: AccountPrintNotificationCategoryPreference['category']
): string {
  const keyByCategory: Readonly<
    Record<AccountPrintNotificationCategoryPreference['category'], UiMessageKey>
  > = {
    ACCOUNT: 'account.notifications.category.account',
    SYSTEM: 'account.notifications.category.system',
    ASTROLOGY_ALERT: 'account.notifications.category.astrologyAlerts'
  };

  return ui(locale, keyByCategory[category]);
}

function enabledLabel(locale: SupportedLocale, enabled: boolean): string {
  return ui(locale, enabled ? 'account.notifications.category.on' : 'account.notifications.category.off');
}

function practitionerStatusLabel(locale: SupportedLocale, status: string): string {
  const keyByStatus: Readonly<Record<string, UiMessageKey>> = {
    SUBMITTED: 'practitioner.application.submitted',
    CHANGES_REQUESTED: 'practitioner.application.changesRequested',
    APPROVED: 'practitioner.application.approved',
    REJECTED: 'practitioner.application.rejected',
    WITHDRAWN: 'practitioner.application.withdrawn',
    REVOKED: 'practitioner.application.revoked'
  };

  const key = keyByStatus[status];
  if (key !== undefined) {
    return ui(locale, key);
  }

  return status.replace(/_/gu, ' ').toLowerCase();
}

function appendPractitionerDetails(
  document: Document,
  parent: HTMLElement,
  locale: SupportedLocale,
  model: AccountPrintModel['practitioner']
): void {
  if (model.application !== null) {
    const subsection = createElement(
      document,
      'article',
      'account-print-subsection'
    );
    subsection.append(
      createElement(
        document,
        'h4',
        'account-print-subsection-title',
        ui(locale, 'practitioner.application.form')
      )
    );
    appendDefinitionList(document, subsection, [
      {
        label: ui(locale, 'practitioner.application.displayName'),
        value: model.application.displayName
      },
      {
        label: ui(locale, 'practitioner.application.headline'),
        value: model.application.headline
      },
      {
        label: ui(locale, 'practitioner.application.bio'),
        value: model.application.bio
      },
      {
        label: ui(locale, 'practitioner.application.practiceAreas'),
        value: model.application.practiceAreas.join(', ')
      },
      {
        label: ui(locale, 'practitioner.application.languages'),
        value: model.application.languages.join(', ')
      },
      {
        label: ui(locale, 'practitioner.application.countryOrRegion'),
        value: model.application.countryOrRegion
      },
      ...(model.application.websiteUrl === null
        ? []
        : [
            {
              label: ui(locale, 'practitioner.application.website'),
              value: model.application.websiteUrl
            }
          ]),
      {
        label: ui(locale, 'practitioner.application.practiceStatement'),
        value: model.application.practiceStatement
      },
      {
        label: ui(locale, 'practitioner.application.status'),
        value: practitionerStatusLabel(locale, model.application.status)
      },
      {
        label: ui(locale, 'practitioner.application.submitted'),
        value: formatInstant(locale, model.application.submittedAt)
      }
    ]);
    parent.append(subsection);
  }

  if (model.profile !== null) {
    const subsection = createElement(
      document,
      'article',
      'account-print-subsection'
    );
    subsection.append(
      createElement(
        document,
        'h4',
        'account-print-subsection-title',
        ui(locale, 'practitioner.directory')
      )
    );
    appendDefinitionList(document, subsection, [
      {
        label: ui(locale, 'practitioner.application.displayName'),
        value: model.profile.displayName
      },
      {
        label: ui(locale, 'practitioner.application.headline'),
        value: model.profile.headline
      },
      {
        label: ui(locale, 'practitioner.application.bio'),
        value: model.profile.bio
      },
      {
        label: ui(locale, 'practitioner.application.practiceAreas'),
        value: model.profile.practiceAreas.join(', ')
      },
      {
        label: ui(locale, 'practitioner.application.languages'),
        value: model.profile.languages.join(', ')
      },
      {
        label: ui(locale, 'practitioner.application.countryOrRegion'),
        value: model.profile.countryOrRegion
      },
      ...(model.profile.websiteUrl === null
        ? []
        : [
            {
              label: ui(locale, 'practitioner.application.website'),
              value: model.profile.websiteUrl
            }
          ]),
      {
        label: ui(locale, 'practitioner.application.status'),
        value: practitionerStatusLabel(locale, model.profile.profileStatus)
      },
      {
        label: ui(locale, 'practitioner.application.approved'),
        value: formatInstant(locale, model.profile.approvedAt)
      }
    ]);
    parent.append(subsection);
  }

  if (model.profileRevisions.length > 0) {
    const subsection = createElement(
      document,
      'article',
      'account-print-subsection'
    );
    subsection.append(
      createElement(
        document,
        'h4',
        'account-print-subsection-title',
        ui(locale, 'practitioner.reviewer.reviewHistory')
      )
    );

    for (const revision of model.profileRevisions) {
      const revisionItem = createElement(
        document,
        'div',
        'account-print-revision'
      );
      appendDefinitionList(document, revisionItem, [
        {
          label: ui(locale, 'practitioner.reviewer.revision'),
          value: practitionerStatusLabel(locale, revision.status)
        },
        {
          label: ui(locale, 'practitioner.application.submitted'),
          value: formatInstant(locale, revision.submittedAt)
        },
        ...(revision.reviewedAt === null
          ? []
          : [
              {
                label: ui(locale, 'practitioner.reviewer.reviewHistory'),
                value: formatInstant(locale, revision.reviewedAt)
              }
            ])
      ]);
      subsection.append(revisionItem);
    }

    parent.append(subsection);
  }
}

function siteUrl(locale: SupportedLocale, path = '/'): string {
  return `${SITE_ORIGIN}${getLocalizedPath(locale, path)}`;
}

function siteLabel(): string {
  return SITE_ORIGIN.replace(/^https?:\/\//u, '').replace(/\/$/u, '');
}

function appendBrandLogo(document: Document, parent: HTMLElement): void {
  const logo = createElement(document, 'img', 'account-print-logo');
  logo.src = '/brand/natalnode-lockup-horizontal-light.svg';
  logo.alt = 'NatalNode';
  logo.width = 180;
  logo.height = 40;
  logo.decoding = 'sync';
  parent.append(logo);
}

function appendSiteLink(
  document: Document,
  parent: HTMLElement,
  locale: SupportedLocale,
  path: string,
  label: string,
  className = 'account-print-link'
): void {
  const link = createElement(document, 'a', className, label);
  link.href = siteUrl(locale, path);
  parent.append(link);
}

function appendMetric(
  document: Document,
  parent: HTMLElement,
  label: string,
  value: string
): void {
  const metric = createElement(document, 'div', 'account-print-metric');
  metric.append(
    createElement(document, 'dt', 'account-print-label', label),
    createElement(document, 'dd', 'account-print-metric-value', value)
  );
  parent.append(metric);
}

function formatCount(locale: SupportedLocale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

function recordStateLabel(
  locale: SupportedLocale,
  authority: AccountPrintAuthority
): string {
  if (authority === 'input-only') {
    return ui(locale, 'account.print.savedInput');
  }

  return authorityLabel(locale, authority);
}

function recordStateDescription(
  locale: SupportedLocale,
  authority: AccountPrintAuthority
): string {
  if (authority === 'input-only') {
    return ui(locale, 'account.print.awaitingCalculation');
  }

  return authorityDescription(locale, authority);
}

function appendStory(
  document: Document,
  parent: HTMLElement,
  locale: SupportedLocale
): void {
  const story = createElement(document, 'section', 'account-print-story');
  story.append(
    createElement(document, 'p', 'account-print-story-lead', ui(locale, 'account.print.storyLead')),
    createElement(document, 'p', 'account-print-story-body', ui(locale, 'account.print.storyBody'))
  );
  parent.append(story);
}

function appendDiscoverability(
  document: Document,
  parent: HTMLElement,
  locale: SupportedLocale
): void {
  const cta = createElement(document, 'section', 'account-print-cta');
  cta.append(
    createElement(document, 'p', 'account-print-eyebrow', ui(locale, 'account.print.buildProfile')),
    createElement(document, 'h3', 'account-print-cta-title', ui(locale, 'account.share.cta')),
    createElement(document, 'p', 'account-print-cta-url', siteLabel())
  );
  appendSiteLink(document, cta, locale, '/', siteLabel(), 'account-print-cta-link');

  const destinations = createElement(document, 'nav', 'account-print-destinations');
  destinations.setAttribute('aria-label', ui(locale, 'account.print.buildProfile'));
  appendSiteLink(document, destinations, locale, '/learn/', ui(locale, 'nav.learn'));
  appendSiteLink(document, destinations, locale, '/tools/', ui(locale, 'nav.tools'));
  appendSiteLink(document, destinations, locale, '/', ui(locale, 'nav.calculate'));
  cta.append(destinations);
  parent.append(cta);
}

function appendAccountDetails(
  document: Document,
  parent: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  const accountSection = appendSection(document, parent, ui(locale, 'account.overview.title'));
  const identityValues = model.account.identities.map((identity) =>
    identity.email ?? ui(locale, 'account.overview.identity.google')
  );
  const methodValues = model.account.identities.map((identity) =>
    ui(
      locale,
      identity.method === 'EMAIL_MAGIC_LINK'
        ? 'account.overview.method.emailMagicLink'
        : 'account.overview.method.google'
    )
  );
  appendDefinitionList(document, accountSection, [
    {
      label: ui(locale, 'account.overview.identity'),
      value: identityValues.join(' · ') || ui(locale, 'account.print.notAvailable')
    },
    {
      label: ui(locale, 'account.overview.method'),
      value: methodValues.join(' · ') || ui(locale, 'account.print.notAvailable')
    },
    {
      label: ui(locale, 'account.overview.created'),
      value: formatInstant(locale, model.account.createdAt)
    }
  ]);
}

function appendSavedProfiles(
  document: Document,
  parent: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  if (model.charts.length === 0) {
    return;
  }

  const profilesSection = appendSection(document, parent, ui(locale, 'account.print.savedProfiles'));

  for (const chart of model.charts) {
    const profile = createElement(document, 'article', 'account-print-profile');
    const profileHeader = createElement(document, 'header', 'account-print-profile-header');
    profileHeader.append(
      createElement(document, 'h4', 'account-print-profile-title', chart.displayName),
      createElement(document, 'p', 'account-print-profile-category', categoryLabel(locale, chart.category))
    );
    profile.append(profileHeader);

    const timeValue = chart.timeState === 'unknown'
      ? timeStateLabel(locale, chart.timeState)
      : `${timeStateLabel(locale, chart.timeState)}${chart.birthTime === null ? '' : ` · ${chart.birthTime}`}`;
    appendDefinitionList(document, profile, [
      { label: ui(locale, 'vault.birthDate'), value: formatLocalDate(locale, chart.birthDate) },
      { label: ui(locale, 'vault.birthTimeState'), value: timeValue },
      {
        label: ui(locale, 'vault.canonicalPlace'),
        value: chart.locationLabel ?? ui(locale, 'account.print.notAvailable')
      },
      {
        label: ui(locale, 'vault.timezone'),
        value: chart.timezone ?? ui(locale, 'account.print.notAvailable')
      },
      {
        label: ui(locale, 'birthInput.advancedSettings'),
        value: chart.houseSystem ?? ui(locale, 'account.print.notAvailable')
      },
      { label: ui(locale, 'vault.savedAt'), value: formatInstant(locale, chart.savedAt) }
    ]);

    const state = createElement(document, 'div', 'account-print-state');
    state.append(
      createElement(document, 'p', 'account-print-label', ui(locale, 'account.print.recordState')),
      createElement(document, 'p', 'account-print-state-value', recordStateLabel(locale, chart.authority)),
      createElement(document, 'p', 'account-print-state-description', recordStateDescription(locale, chart.authority))
    );
    profile.append(state);

    if (chart.notes.length > 0) {
      profile.append(
        createElement(document, 'h5', 'account-print-label account-print-notes-title', ui(locale, 'vault.notesTitle'))
      );
      for (const note of chart.notes) {
        const noteItem = createElement(document, 'div', 'account-print-note');
        noteItem.append(createElement(document, 'p', 'account-print-user-content', note.content));
        if (note.createdAt !== null) {
          noteItem.append(
            createElement(
              document,
              'p',
              'account-print-meta',
              formatUiMessage(locale, 'vault.noteCreated', {
                date: formatInstant(locale, note.createdAt)
              })
            )
          );
        }
        profile.append(noteItem);
      }
    }

    profilesSection.append(profile);
  }
}

function appendNotifications(
  document: Document,
  parent: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  if (
    model.notifications.channelPreferences.length === 0 &&
    model.notifications.categoryPreferences.length === 0
  ) {
    return;
  }

  const notificationsSection = appendSection(
    document,
    parent,
    ui(locale, 'account.notifications.title')
  );
  const entries: PrintEntry[] = model.notifications.channelPreferences.map((preference) => ({
    label: ui(locale, 'account.print.notificationChannel'),
    value: enabledLabel(locale, preference.enabled)
  }));
  entries.push(
    ...model.notifications.categoryPreferences.map((preference) => ({
      label: notificationCategoryLabel(locale, preference.category),
      value: enabledLabel(locale, preference.enabled)
    }))
  );
  appendDefinitionList(document, notificationsSection, entries);
}

function appendFeedback(
  document: Document,
  parent: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  if (model.feedback.length === 0) {
    return;
  }

  const feedbackSection = appendSection(document, parent, ui(locale, 'auth.feedback'));
  for (const feedback of model.feedback) {
    const feedbackItem = createElement(document, 'article', 'account-print-feedback');
    appendDefinitionList(document, feedbackItem, [
      { label: ui(locale, 'feedback.category'), value: feedback.category },
      { label: ui(locale, 'feedback.message'), value: feedback.message },
      { label: ui(locale, 'vault.savedAt'), value: formatInstant(locale, feedback.createdAt) }
    ]);
    feedbackSection.append(feedbackItem);
  }
}

function appendPrintFooter(
  document: Document,
  parent: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  const footer = createElement(document, 'footer', 'account-print-footer');
  const footerBrand = createElement(document, 'div', 'account-print-footer-brand');
  footerBrand.append(
    createElement(document, 'span', 'account-print-footer-wordmark', 'NATALNODE'),
    createElement(document, 'span', 'account-print-footer-site', siteLabel())
  );
  footer.append(
    footerBrand,
    createElement(
      document,
      'p',
      'account-print-meta',
      `${ui(locale, 'account.print.footerPrivate')} · ${ui(locale, 'account.print.exportedAt').toLowerCase()} ${formatInstant(locale, model.exportedAt)}`
    )
  );
  parent.append(footer);
}

/** Renders a premium, user-meaningful, non-secret projection from the export model. */
export function renderAccountPrintView(
  view: HTMLElement,
  model: AccountPrintModel,
  locale: SupportedLocale
): void {
  const document = view.ownerDocument;
  view.replaceChildren();

  const article = createElement(document, 'article', 'account-print-document');
  const cover = createElement(document, 'section', 'account-print-cover');
  const brandHeader = createElement(document, 'header', 'account-print-header');
  appendBrandLogo(document, brandHeader);
  brandHeader.append(
    createElement(document, 'p', 'account-print-eyebrow', ui(locale, 'account.print.dossierLabel')),
    createElement(document, 'h2', 'account-print-title', ui(locale, 'account.print.title')),
    createElement(
      document,
      'p',
      'account-print-display-name',
      model.charts[0]?.displayName ?? ui(locale, 'account.print.profileDescriptor')
    ),
    createElement(document, 'p', 'account-print-meta', ui(locale, 'account.print.profileDescriptor')),
    createElement(
      document,
      'p',
      'account-print-export-meta',
      `${ui(locale, 'account.print.exportedAt')}: ${formatInstant(locale, model.exportedAt)}`
    )
  );
  cover.append(brandHeader);

  const summary = createElement(document, 'dl', 'account-print-summary');
  const savedInputCount = model.charts.filter((chart) => chart.authority === 'input-only').length;
  appendMetric(document, summary, ui(locale, 'account.print.savedProfiles'), formatCount(locale, model.charts.length));
  appendMetric(
    document,
    summary,
    ui(locale, 'account.print.privateRecord'),
    formatUiMessage(locale, 'account.print.savedInputCount', { count: savedInputCount })
  );
  appendMetric(
    document,
    summary,
    ui(locale, 'account.overview.method'),
    model.account.identities
      .map((identity) => ui(locale, identity.method === 'EMAIL_MAGIC_LINK'
        ? 'account.overview.method.emailMagicLink'
        : 'account.overview.method.google'))
      .join(' · ') || ui(locale, 'account.print.notAvailable')
  );
  cover.append(summary);
  appendStory(document, cover, locale);
  appendDiscoverability(document, cover, locale);
  article.append(cover);

  const detailPage = createElement(document, 'section', 'account-print-detail-page');
  const detailHeader = createElement(document, 'header', 'account-print-detail-header');
  detailHeader.append(
    createElement(document, 'p', 'account-print-eyebrow', ui(locale, 'account.print.privateRecord')),
    createElement(document, 'h3', 'account-print-detail-title', ui(locale, 'account.print.detailAppendix'))
  );
  detailPage.append(detailHeader);
  appendAccountDetails(document, detailPage, model, locale);
  appendSavedProfiles(document, detailPage, model, locale);
  appendNotifications(document, detailPage, model, locale);
  appendFeedback(document, detailPage, model, locale);

  if (
    model.practitioner.application !== null ||
    model.practitioner.profile !== null ||
    model.practitioner.profileRevisions.length > 0
  ) {
    const practitionerSection = appendSection(
      document,
      detailPage,
      ui(locale, 'account.print.practitioner')
    );
    appendPractitionerDetails(document, practitionerSection, locale, model.practitioner);
  }

  article.append(detailPage);
  appendPrintFooter(document, article, model, locale);
  view.append(article);
}

function clearPrintMessages(elements: AccountPrintElements): void {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.error.hidden = true;
  elements.error.textContent = '';
  elements.reauthStatus.hidden = true;
}

function setPrintPending(
  elements: AccountPrintElements,
  pending: boolean,
  locale: SupportedLocale
): void {
  elements.button.disabled = pending;
  elements.button.textContent = pending
    ? ui(locale, 'account.data.printPreparing')
    : ui(locale, 'account.data.print');
}

function showPrintError(
  elements: AccountPrintElements,
  locale: SupportedLocale
): void {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.error.textContent = ui(locale, 'account.data.printError');
  elements.error.hidden = false;
  elements.error.focus();
}

function handlePrintError(
  elements: AccountPrintElements,
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

  showPrintError(elements, locale);
}

function clearPrintView(elements: AccountPrintElements): void {
  elements.accountPage.removeAttribute('data-account-print-active');
  document.body.removeAttribute('data-account-print-active');
  elements.view.setAttribute('aria-hidden', 'true');
  elements.view.replaceChildren();
}

/** Uses the existing private export protocol and opens the browser print dialog. */
export function initializeAccountPrint(elements: AccountPrintElements): void {
  const locale = getPresentationLocale(
    window.location.pathname,
    document.documentElement.lang
  );
  let isPreparing = false;
  let isPrintActive = false;

  const finishPrint = () => {
    if (!isPrintActive) {
      return;
    }

    isPrintActive = false;
    clearPrintView(elements);
  };

  window.addEventListener('afterprint', finishPrint);

  elements.button.addEventListener('click', () => {
    if (isPreparing || isPrintActive) {
      return;
    }

    isPreparing = true;
    clearPrintMessages(elements);
    setPrintPending(elements, true, locale);
    elements.status.textContent = ui(locale, 'account.data.printPreparing');
    elements.status.hidden = false;

    void (async () => {
      try {
        const preparation = await prepareAccountExport();

        if (preparation.status !== 204) {
          const code = resolvePreparationErrorCode(preparation);
          if (code === null) {
            showPrintError(elements, locale);
          } else {
            handlePrintError(elements, locale, code);
          }
          return;
        }

        const payload = await fetchAccountExportPayload();
        const model = buildAccountPrintModel(payload);
        if (model === null) {
          showPrintError(elements, locale);
          return;
        }

        renderAccountPrintView(elements.view, model, locale);
        elements.accountPage.setAttribute('data-account-print-active', 'true');
        document.body.setAttribute('data-account-print-active', 'true');
        elements.view.setAttribute('aria-hidden', 'false');
        elements.status.hidden = true;
        elements.status.textContent = '';
        isPrintActive = true;
        window.print();
      } catch (error) {
        isPrintActive = false;
        clearPrintView(elements);
        if (error instanceof AccountExportPayloadError) {
          handlePrintError(elements, locale, error.code);
        } else {
          showPrintError(elements, locale);
        }
      } finally {
        isPreparing = false;
        setPrintPending(elements, false, locale);

        if (!isPrintActive) {
          clearPrintView(elements);
        }
      }
    })();
  });
}
