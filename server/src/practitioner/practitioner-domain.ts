import {
  PRACTITIONER_APPLICATION_STATUSES,
  PRACTITIONER_PRACTICE_AREA_IDS,
  PRACTITIONER_PROFILE_REVISION_STATUSES,
  PRACTITIONER_PROFILE_STATUSES,
  PRACTITIONER_REPORT_CATEGORIES,
  PRACTITIONER_REPORT_STATES,
  PRACTITIONER_REVIEW_ACTIONS,
  PRACTITIONER_REVIEW_QUEUE_STATUSES,
  PRACTITIONER_REVIEW_REASON_CODES,
  type PractitionerApplicationStatus,
  type PractitionerPracticeAreaId,
  type PractitionerProfileRevisionStatus,
  type PractitionerProfileStatus,
  type PractitionerReportCategory,
  type PractitionerReportState,
  type PractitionerReviewAction,
  type PractitionerReviewQueueStatus,
  type PractitionerReviewReasonCode
} from '@natalnode/contracts';
import {
  isSafeCommunityText,
  isValidCommunityDisplayName,
  normalizeCommunityDisplayName,
  normalizeCommunityText
} from '../community/community-domain.js';

export {
  PRACTITIONER_APPLICATION_STATUSES,
  PRACTITIONER_PRACTICE_AREA_IDS,
  PRACTITIONER_PROFILE_REVISION_STATUSES,
  PRACTITIONER_PROFILE_STATUSES,
  PRACTITIONER_REPORT_CATEGORIES,
  PRACTITIONER_REPORT_STATES,
  PRACTITIONER_REVIEW_ACTIONS,
  PRACTITIONER_REVIEW_QUEUE_STATUSES,
  PRACTITIONER_REVIEW_REASON_CODES
};

export type {
  PractitionerApplicationStatus,
  PractitionerPracticeAreaId,
  PractitionerProfileRevisionStatus,
  PractitionerProfileStatus,
  PractitionerReportCategory,
  PractitionerReportState,
  PractitionerReviewAction,
  PractitionerReviewQueueStatus,
  PractitionerReviewReasonCode
};

export const PRACTITIONER_SUPPORTED_LANGUAGE_CODES = [
  'en',
  'es',
  'fr',
  'de',
  'ja',
  'ko',
  'zh-Hant'
] as const;

export type PractitionerLanguageCode =
  (typeof PRACTITIONER_SUPPORTED_LANGUAGE_CODES)[number];

export const PRACTITIONER_HEADLINE_MINIMUM_CHARACTERS = 3;
export const PRACTITIONER_HEADLINE_MAXIMUM_CHARACTERS = 160;
export const PRACTITIONER_BIO_MINIMUM_CHARACTERS = 20;
export const PRACTITIONER_BIO_MAXIMUM_CHARACTERS = 2_000;
export const PRACTITIONER_PRACTICE_STATEMENT_MINIMUM_CHARACTERS = 20;
export const PRACTITIONER_PRACTICE_STATEMENT_MAXIMUM_CHARACTERS = 2_000;
export const PRACTITIONER_COUNTRY_MINIMUM_CHARACTERS = 2;
export const PRACTITIONER_COUNTRY_MAXIMUM_CHARACTERS = 100;
export const PRACTITIONER_URL_MAXIMUM_CHARACTERS = 2_048;
export const PRACTITIONER_PROFILE_REPORT_MAXIMUM_CHARACTERS = 1_000;
export const PRACTITIONER_REVIEW_NOTE_MAXIMUM_CHARACTERS = 1_000;
export const PRACTITIONER_REJECTED_REAPPLICATION_COOLDOWN_DAYS = 30;
export const PRACTITIONER_REVOKED_REAPPLICATION_COOLDOWN_DAYS = 90;
export const PRACTITIONER_FINAL_APPLICATION_RETENTION_DAYS = 365;
export const PRACTITIONER_PROFILE_HISTORY_RETENTION_DAYS = 90;
export const PRACTITIONER_REVIEW_AUDIT_RETENTION_DAYS = 365;
export const PRACTITIONER_ANONYMIZED_PROFILE_STATUS = 'DELETED' as const;

const HIGH_STAKES_GUARANTEE_PATTERN =
  /\b(?:guarantee(?:d|s)?|will\s+(?:cure|heal|diagnose|treat)|(?:medical|legal|financial)\s+(?:advice|treatment|diagnosis)|investment\s+return|certain\s+outcome)\b/iu;

const CONTROL_OR_MARKUP_PATTERN = /[<>]/u;

export function isPractitionerApplicationStatus(
  value: unknown
): value is PractitionerApplicationStatus {
  return PRACTITIONER_APPLICATION_STATUSES.some((status) => status === value);
}

export function isPractitionerPracticeAreaId(
  value: unknown
): value is PractitionerPracticeAreaId {
  return PRACTITIONER_PRACTICE_AREA_IDS.some((area) => area === value);
}

export function isPractitionerLanguageCode(
  value: unknown
): value is PractitionerLanguageCode {
  return PRACTITIONER_SUPPORTED_LANGUAGE_CODES.some((language) => language === value);
}

export function isPractitionerProfileStatus(
  value: unknown
): value is PractitionerProfileStatus {
  return PRACTITIONER_PROFILE_STATUSES.some((status) => status === value);
}

export function isPractitionerProfileRevisionStatus(
  value: unknown
): value is PractitionerProfileRevisionStatus {
  return PRACTITIONER_PROFILE_REVISION_STATUSES.some((status) => status === value);
}

export function isPractitionerReviewAction(
  value: unknown
): value is PractitionerReviewAction {
  return PRACTITIONER_REVIEW_ACTIONS.some((action) => action === value);
}

export function isPractitionerReviewQueueStatus(
  value: unknown
): value is PractitionerReviewQueueStatus {
  return PRACTITIONER_REVIEW_QUEUE_STATUSES.some((status) => status === value);
}

export function isPractitionerReviewReasonCode(
  value: unknown
): value is PractitionerReviewReasonCode {
  return PRACTITIONER_REVIEW_REASON_CODES.some((reason) => reason === value);
}

export function isPractitionerReportCategory(
  value: unknown
): value is PractitionerReportCategory {
  return PRACTITIONER_REPORT_CATEGORIES.some((category) => category === value);
}

export function isPractitionerReportState(
  value: unknown
): value is PractitionerReportState {
  return PRACTITIONER_REPORT_STATES.some((state) => state === value);
}

export function isPractitionerOpaqueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 256 &&
    value === value.trim() &&
    !/[\u0000-\u001F\u007F-\u009F]/u.test(value)
  );
}

export function isValidPractitionerPlainText(
  value: unknown,
  minimum: number,
  maximum: number
): value is string {
  if (!isSafeCommunityText(value)) {
    return false;
  }

  const normalized = normalizeCommunityText(value);
  const characters = Array.from(normalized).length;

  return characters >= minimum && characters <= maximum;
}

export function isValidPractitionerCountryOrRegion(value: unknown): value is string {
  return isValidPractitionerPlainText(
    value,
    PRACTITIONER_COUNTRY_MINIMUM_CHARACTERS,
    PRACTITIONER_COUNTRY_MAXIMUM_CHARACTERS
  );
}

export function isValidPractitionerDisplayName(value: unknown): value is string {
  return isValidCommunityDisplayName(value);
}

export function normalizePractitionerDisplayName(value: string): string {
  return normalizeCommunityDisplayName(value);
}

export function normalizePractitionerText(value: string): string {
  return normalizeCommunityText(value);
}

export function containsDisallowedProfessionalClaim(value: string): boolean {
  return HIGH_STAKES_GUARANTEE_PATTERN.test(value);
}

export function isValidPractitionerProfessionalPresentation(input: {
  readonly professionalHeadline: unknown;
  readonly bio: unknown;
  readonly practiceStatement: unknown;
}): boolean {
  if (
    !isValidPractitionerPlainText(
      input.professionalHeadline,
      PRACTITIONER_HEADLINE_MINIMUM_CHARACTERS,
      PRACTITIONER_HEADLINE_MAXIMUM_CHARACTERS
    ) ||
    !isValidPractitionerPlainText(
      input.bio,
      PRACTITIONER_BIO_MINIMUM_CHARACTERS,
      PRACTITIONER_BIO_MAXIMUM_CHARACTERS
    ) ||
    !isValidPractitionerPlainText(
      input.practiceStatement,
      PRACTITIONER_PRACTICE_STATEMENT_MINIMUM_CHARACTERS,
      PRACTITIONER_PRACTICE_STATEMENT_MAXIMUM_CHARACTERS
    )
  ) {
    return false;
  }

  return ![
    input.professionalHeadline,
    input.bio,
    input.practiceStatement
  ].some(
    (value) =>
      typeof value === 'string' && containsDisallowedProfessionalClaim(value)
  );
}

export function normalizeHttpsUrl(value: string): string | null {
  if (
    value.length === 0 ||
    value.length > PRACTITIONER_URL_MAXIMUM_CHARACTERS ||
    CONTROL_OR_MARKUP_PATTERN.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname.length === 0 ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.href.length > PRACTITIONER_URL_MAXIMUM_CHARACTERS
    ) {
      return null;
    }

    return parsed.href;
  } catch (_error) {
    return null;
  }
}

export function isValidPractitionerEvidenceUrls(value: unknown): value is readonly string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    return false;
  }

  const normalized = value.map((url) =>
    typeof url === 'string' ? normalizeHttpsUrl(url) : null
  );

  return (
    normalized.every((url): url is string => url !== null) &&
    new Set(normalized).size === normalized.length
  );
}

export function isValidPractitionerWebsiteUrl(value: unknown): value is string {
  return typeof value === 'string' && normalizeHttpsUrl(value) !== null;
}

export function isValidPractitionerPracticeAreas(
  value: unknown
): value is readonly PractitionerPracticeAreaId[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= PRACTITIONER_PRACTICE_AREA_IDS.length &&
    value.every(isPractitionerPracticeAreaId) &&
    new Set(value).size === value.length
  );
}

export function isValidPractitionerLanguages(value: unknown): value is readonly PractitionerLanguageCode[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= PRACTITIONER_SUPPORTED_LANGUAGE_CODES.length &&
    value.every(isPractitionerLanguageCode) &&
    new Set(value).size === value.length
  );
}

export function addPractitionerRetentionDays(timestamp: string, days: number): string {
  const milliseconds = Date.parse(timestamp);
  if (!Number.isFinite(milliseconds)) {
    throw new Error('Practitioner retention timestamp is invalid.');
  }

  return new Date(milliseconds + days * 24 * 60 * 60 * 1_000).toISOString();
}

export function normalizePractitionerTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function practitionerApplicationTransitionIsAllowed(
  from: PractitionerApplicationStatus,
  to: PractitionerApplicationStatus
): boolean {
  if (from === 'SUBMITTED') {
    return to === 'APPROVED' || to === 'CHANGES_REQUESTED' || to === 'REJECTED' || to === 'WITHDRAWN';
  }
  if (from === 'CHANGES_REQUESTED') {
    return to === 'SUBMITTED' || to === 'WITHDRAWN';
  }
  return from === 'APPROVED' ? to === 'REVOKED' : false;
}

export function isPractitionerFinalApplicationStatus(
  status: PractitionerApplicationStatus
): boolean {
  return status === 'REJECTED' || status === 'WITHDRAWN' || status === 'REVOKED';
}

export function reapplicationCooldownDays(
  status: PractitionerApplicationStatus
): number {
  return status === 'REJECTED'
    ? PRACTITIONER_REJECTED_REAPPLICATION_COOLDOWN_DAYS
    : status === 'REVOKED'
      ? PRACTITIONER_REVOKED_REAPPLICATION_COOLDOWN_DAYS
      : 0;
}
