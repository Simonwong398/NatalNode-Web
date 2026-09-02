import type {
  PractitionerApplicationStatus,
  PractitionerPracticeAreaId,
  PractitionerProfileRevisionStatus,
  PractitionerProfileStatus
} from '@natalnode/contracts';

/** The versioned envelope used by the account-export boundary. */
export const ACCOUNT_DATA_EXPORT_SCHEMA_VERSION = '1.2' as const;

export type JsonPrimitive = null | boolean | number | string;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface AccountDataExportAccountMetadata {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportEmailMagicLinkIdentity {
  readonly type: 'EMAIL_MAGIC_LINK';
  readonly email: string;
  readonly linkedAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportGoogleIdentity {
  readonly type: 'GOOGLE';
  readonly linkedAt: string;
  readonly updatedAt: string;
}

export type AccountDataExportIdentity =
  | AccountDataExportEmailMagicLinkIdentity
  | AccountDataExportGoogleIdentity;

export interface AccountDataExportAccount
  extends AccountDataExportAccountMetadata {
  readonly identities: readonly AccountDataExportIdentity[];
}

export interface AccountDataExportChartCalculation {
  readonly engineVersion: string;
  readonly chartSchemaVersion: string;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
}

export interface AccountDataExportChartMetadata {
  readonly displayName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: JsonValue;
  readonly canonicalChartResult: JsonValue;
  readonly calculation: AccountDataExportChartCalculation;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportNote {
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportChart extends AccountDataExportChartMetadata {
  readonly notes: readonly AccountDataExportNote[];
}

export interface AccountDataExportFeedback {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface AccountDataExportNotificationChannelPreference {
  readonly channel: 'WEB_PUSH';
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportNotificationCategoryPreference {
  readonly category: 'ACCOUNT' | 'SYSTEM' | 'ASTROLOGY_ALERT';
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportNotificationPushSubscription {
  readonly subscriptionId: string;
  readonly channel: 'WEB_PUSH';
  readonly status: 'ACTIVE' | 'INVALIDATED';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSuccessAt: string | null;
  readonly invalidatedAt: string | null;
}

export interface AccountDataExportNotifications {
  readonly channelPreferences: readonly AccountDataExportNotificationChannelPreference[];
  readonly categoryPreferences: readonly AccountDataExportNotificationCategoryPreference[];
  readonly pushSubscriptions: readonly AccountDataExportNotificationPushSubscription[];
}

export interface AccountDataExportPractitionerApplicationHistory {
  readonly status: PractitionerApplicationStatus;
  readonly changedAt: string;
}

export interface AccountDataExportPractitionerApplication {
  readonly requestedDisplayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly practiceStatement: string;
  readonly evidenceUrls: readonly string[];
  readonly consentToPublicProfile: true;
  readonly submittedAt: string;
  readonly status: PractitionerApplicationStatus;
  readonly statusHistory: readonly AccountDataExportPractitionerApplicationHistory[];
  readonly finalizedAt: string | null;
  readonly purgeEligibleAt: string | null;
}

export interface AccountDataExportPractitionerProfile {
  readonly practitionerId: string;
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly foundingPractitioner: boolean;
  readonly approvedAt: string;
  readonly profileStatus: PractitionerProfileStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportPractitionerProfileRevision {
  readonly displayName: string;
  readonly professionalHeadline: string;
  readonly bio: string;
  readonly practiceAreas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly countryOrRegion: string;
  readonly websiteUrl?: string;
  readonly status: PractitionerProfileRevisionStatus;
  readonly submittedAt: string;
  readonly reviewedAt: string | null;
}

export interface AccountDataExportPractitioner {
  readonly application: AccountDataExportPractitionerApplication | null;
  readonly profile: AccountDataExportPractitionerProfile | null;
  readonly profileRevisions: readonly AccountDataExportPractitionerProfileRevision[];
}

export interface AccountDataExportV1 {
  readonly exportSchemaVersion: typeof ACCOUNT_DATA_EXPORT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly account: AccountDataExportAccount;
  readonly charts: readonly AccountDataExportChart[];
  readonly feedback: readonly AccountDataExportFeedback[];
  readonly notifications: AccountDataExportNotifications;
  readonly practitioner: AccountDataExportPractitioner;
}

/**
 * Explicit presentation input for the account root. It is deliberately not
 * a persistence-row type so the export shape cannot grow by raw spreading.
 */
export interface AccountDataExportAccountPresentationSource {
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for an identity read inside the snapshot. */
export interface AccountDataExportIdentityPresentationSource {
  readonly provider: string;
  readonly providerSubject: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for a persisted chart snapshot. */
export interface AccountDataExportChartPresentationSource {
  readonly displayName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: unknown;
  readonly canonicalChartResult: unknown;
  readonly engineVersion: string;
  readonly chartSchemaVersion: string;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly notes?: readonly AccountDataExportNotePresentationSource[];
}

/** Explicit presentation input for a nested chart note. */
export interface AccountDataExportNotePresentationSource {
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for private Feedback. */
export interface AccountDataExportFeedbackPresentationSource {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface AccountDataExportNotificationsPresentationSource {
  readonly channelPreferences: readonly AccountDataExportNotificationChannelPreference[];
  readonly categoryPreferences: readonly AccountDataExportNotificationCategoryPreference[];
  readonly pushSubscriptions: readonly AccountDataExportNotificationPushSubscription[];
}

export interface AccountDataExportPractitionerApplicationPresentationSource
  extends Omit<AccountDataExportPractitionerApplication, 'statusHistory'> {
  readonly statusHistory: readonly AccountDataExportPractitionerApplicationHistory[];
}

export interface AccountDataExportPractitionerProfilePresentationSource
  extends AccountDataExportPractitionerProfile {}

export interface AccountDataExportPractitionerProfileRevisionPresentationSource
  extends AccountDataExportPractitionerProfileRevision {}

export class UnsupportedAccountDataExportIdentityError extends Error {
  public readonly provider: string;

  public constructor(provider: string) {
    super('Account export cannot safely present this identity provider.');
    this.name = 'UnsupportedAccountDataExportIdentityError';
    this.provider = provider;
  }
}

export class UnsafeAccountDataExportValueError extends Error {
  public readonly fieldName: string;

  public constructor(fieldName: string) {
    super(`Account export contains an unsafe value in ${fieldName}.`);
    this.name = 'UnsafeAccountDataExportValueError';
    this.fieldName = fieldName;
  }
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneJsonValue(
  value: unknown,
  fieldName: string,
  ancestors: WeakSet<object>
): JsonValue {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case 'boolean':
    case 'string':
      return value;
    case 'number':
      if (Number.isFinite(value)) {
        return value;
      }
      throw new UnsafeAccountDataExportValueError(fieldName);
    case 'object':
      break;
    default:
      throw new UnsafeAccountDataExportValueError(fieldName);
  }

  if (ancestors.has(value)) {
    throw new UnsafeAccountDataExportValueError(fieldName);
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      const symbolKeys = Object.getOwnPropertySymbols(value);

      if (symbolKeys.length !== 0) {
        throw new UnsafeAccountDataExportValueError(fieldName);
      }

      const clone: JsonValue[] = [];

      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

        if (descriptor === undefined || !('value' in descriptor)) {
          throw new UnsafeAccountDataExportValueError(fieldName);
        }

        clone.push(cloneJsonValue(descriptor.value, fieldName, ancestors));
      }

      for (const key of Object.keys(value)) {
        if (!/^\d+$/u.test(key) || Number(key) >= value.length) {
          throw new UnsafeAccountDataExportValueError(fieldName);
        }
      }

      return clone;
    }

    if (!isPlainObject(value)) {
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    const clone: Record<string, JsonValue> = {};

    for (const symbolKey of Object.getOwnPropertySymbols(value)) {
      void symbolKey;
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor === undefined || !('value' in descriptor)) {
        throw new UnsafeAccountDataExportValueError(fieldName);
      }

      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneJsonValue(descriptor.value, fieldName, ancestors),
        writable: true
      });
    }

    return clone;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Validates and copies persisted JSONB-shaped data without applying current
 * scientific contracts, normalization, or recalculation.
 */
export function assertAccountDataExportJsonValue(
  value: unknown,
  fieldName: string
): JsonValue {
  return cloneJsonValue(value, fieldName, new WeakSet<object>());
}

export function presentAccountDataExportAccount(
  source: AccountDataExportAccountPresentationSource
): AccountDataExportAccountMetadata {
  return {
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportIdentity(
  source: AccountDataExportIdentityPresentationSource
): AccountDataExportIdentity {
  if (source.provider === 'GOOGLE') {
    return {
      type: 'GOOGLE',
      linkedAt: source.createdAt,
      updatedAt: source.updatedAt
    };
  }

  if (source.provider === 'EMAIL_MAGIC_LINK') {
    return {
      type: 'EMAIL_MAGIC_LINK',
      email: source.providerSubject,
      linkedAt: source.createdAt,
      updatedAt: source.updatedAt
    };
  }

  throw new UnsupportedAccountDataExportIdentityError(source.provider);
}

function assertStringArray(
  value: readonly string[],
  fieldName: string
): readonly string[] {
  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    return item;
  });
}

export function presentAccountDataExportChartMetadata(
  source: AccountDataExportChartPresentationSource
): AccountDataExportChartMetadata {
  return {
    displayName: source.displayName,
    category: source.category,
    tags: assertStringArray(source.tags, 'tags'),
    favorite: source.favorite,
    normalizedChartRequest: assertAccountDataExportJsonValue(
      source.normalizedChartRequest,
      'normalizedChartRequest'
    ),
    canonicalChartResult: assertAccountDataExportJsonValue(
      source.canonicalChartResult,
      'canonicalChartResult'
    ),
    calculation: {
      engineVersion: source.engineVersion,
      chartSchemaVersion: source.chartSchemaVersion,
      astronomyConfigurationId: source.astronomyConfigurationId,
      provenanceEnvelopeId: source.provenanceEnvelopeId
    },
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportNote(
  source: AccountDataExportNotePresentationSource
): AccountDataExportNote {
  return {
    content: source.content,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportChart(
  source: AccountDataExportChartPresentationSource
): AccountDataExportChart {
  return {
    ...presentAccountDataExportChartMetadata(source),
    notes: (source.notes ?? []).map(presentAccountDataExportNote)
  };
}

export function presentAccountDataExportFeedback(
  source: AccountDataExportFeedbackPresentationSource
): AccountDataExportFeedback {
  return {
    category: source.category,
    message: source.message,
    createdAt: source.createdAt
  };
}

export function presentAccountDataExportNotifications(
  source: AccountDataExportNotificationsPresentationSource
): AccountDataExportNotifications {
  return {
    channelPreferences: source.channelPreferences.map((preference) => ({
      channel: preference.channel,
      enabled: preference.enabled,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt
    })),
    categoryPreferences: source.categoryPreferences.map((preference) => ({
      category: preference.category,
      enabled: preference.enabled,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt
    })),
    pushSubscriptions: source.pushSubscriptions.map((subscription) => ({
      subscriptionId: subscription.subscriptionId,
      channel: subscription.channel,
      status: subscription.status,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      lastSuccessAt: subscription.lastSuccessAt,
      invalidatedAt: subscription.invalidatedAt
    }))
  };
}

export function presentAccountDataExportPractitioner(
  source: {
    readonly application: AccountDataExportPractitionerApplicationPresentationSource | null;
    readonly profile: AccountDataExportPractitionerProfilePresentationSource | null;
    readonly profileRevisions: readonly AccountDataExportPractitionerProfileRevisionPresentationSource[];
  }
): AccountDataExportPractitioner {
  const application = source.application;

  return {
    application:
      application === null
        ? null
        : {
            requestedDisplayName: application.requestedDisplayName,
            professionalHeadline: application.professionalHeadline,
            bio: application.bio,
            practiceAreas: [...application.practiceAreas],
            languages: [...application.languages],
            countryOrRegion: application.countryOrRegion,
            ...(application.websiteUrl === undefined
              ? {}
              : { websiteUrl: application.websiteUrl }),
            practiceStatement: application.practiceStatement,
            evidenceUrls: [...application.evidenceUrls],
            consentToPublicProfile: true,
            submittedAt: application.submittedAt,
            status: application.status,
            statusHistory: application.statusHistory.map((history) => ({
              status: history.status,
              changedAt: history.changedAt
            })),
            finalizedAt: application.finalizedAt,
            purgeEligibleAt: application.purgeEligibleAt
          },
    profile:
      source.profile === null
        ? null
        : {
            practitionerId: source.profile.practitionerId,
            displayName: source.profile.displayName,
            professionalHeadline: source.profile.professionalHeadline,
            bio: source.profile.bio,
            practiceAreas: [...source.profile.practiceAreas],
            languages: [...source.profile.languages],
            countryOrRegion: source.profile.countryOrRegion,
            ...(source.profile.websiteUrl === undefined
              ? {}
              : { websiteUrl: source.profile.websiteUrl }),
            foundingPractitioner: source.profile.foundingPractitioner,
            approvedAt: source.profile.approvedAt,
            profileStatus: source.profile.profileStatus,
            createdAt: source.profile.createdAt,
            updatedAt: source.profile.updatedAt
          },
    profileRevisions: source.profileRevisions.map((revision) => ({
      displayName: revision.displayName,
      professionalHeadline: revision.professionalHeadline,
      bio: revision.bio,
      practiceAreas: [...revision.practiceAreas],
      languages: [...revision.languages],
      countryOrRegion: revision.countryOrRegion,
      ...(revision.websiteUrl === undefined
        ? {}
        : { websiteUrl: revision.websiteUrl }),
      status: revision.status,
      submittedAt: revision.submittedAt,
      reviewedAt: revision.reviewedAt
    }))
  };
}

/** Names used by the product contract remain available at this boundary. */
export type NatalNodeAccountDataExportV1 = AccountDataExportV1;
export type EmailMagicLinkExportIdentityV1 = AccountDataExportEmailMagicLinkIdentity;
export type GoogleExportIdentityV1 = AccountDataExportGoogleIdentity;
export type AccountChartExportV1 = AccountDataExportChart;
export type ChartNoteExportV1 = AccountDataExportNote;
export type FeedbackExportV1 = AccountDataExportFeedback;
export type NotificationChannelPreferenceExportV1 =
  AccountDataExportNotificationChannelPreference;
export type NotificationCategoryPreferenceExportV1 =
  AccountDataExportNotificationCategoryPreference;
export type NotificationPushSubscriptionExportV1 =
  AccountDataExportNotificationPushSubscription;
export type NotificationsExportV1 = AccountDataExportNotifications;
export type PractitionerExportV1 = AccountDataExportPractitioner;
