import type {
  CreatePractitionerReportApiRequest,
  PractitionerApplicationInput,
  PractitionerProfileRevisionInput,
  PractitionerReviewProfileRevisionApiRequest,
  PractitionerReviewQueueStatus,
  PractitionerReportResolutionApiRequest,
  PractitionerReviewApplicationApiRequest
} from '@natalnode/contracts';
import { isRecord } from './chart-request.js';
import {
  PRACTITIONER_BIO_MAXIMUM_CHARACTERS,
  PRACTITIONER_BIO_MINIMUM_CHARACTERS,
  PRACTITIONER_COUNTRY_MAXIMUM_CHARACTERS,
  PRACTITIONER_COUNTRY_MINIMUM_CHARACTERS,
  PRACTITIONER_HEADLINE_MAXIMUM_CHARACTERS,
  PRACTITIONER_HEADLINE_MINIMUM_CHARACTERS,
  PRACTITIONER_PRACTICE_STATEMENT_MAXIMUM_CHARACTERS,
  PRACTITIONER_PRACTICE_STATEMENT_MINIMUM_CHARACTERS,
  PRACTITIONER_PROFILE_REPORT_MAXIMUM_CHARACTERS,
  PRACTITIONER_REVIEW_NOTE_MAXIMUM_CHARACTERS,
  isPractitionerLanguageCode,
  isPractitionerOpaqueId,
  isPractitionerPracticeAreaId,
  isPractitionerReportCategory,
  isPractitionerReviewQueueStatus,
  isPractitionerReviewAction,
  isPractitionerReviewReasonCode,
  isValidPractitionerCountryOrRegion,
  isValidPractitionerDisplayName,
  isValidPractitionerEvidenceUrls,
  isValidPractitionerLanguages,
  isValidPractitionerPracticeAreas,
  isValidPractitionerProfessionalPresentation,
  isValidPractitionerPlainText,
  normalizeHttpsUrl,
  normalizePractitionerDisplayName,
  normalizePractitionerText
} from '../../practitioner/practitioner-domain.js';

export const PRACTITIONER_REQUEST_MAXIMUM_BYTES = 96 * 1_024;

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key));
}

function normalizeTextField(
  value: unknown,
  minimum: number,
  maximum: number
): string | null {
  return isValidPractitionerPlainText(value, minimum, maximum)
    ? normalizePractitionerText(value)
    : null;
}

function normalizeWebsite(value: unknown): string | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? normalizeHttpsUrl(value) : null;
}

function normalizeProfileFields(
  value: Record<string, unknown>
): PractitionerProfileRevisionInput | null {
  if (
    !hasOnlyKeys(
      value,
      ['displayName', 'professionalHeadline', 'bio', 'practiceAreas', 'languages', 'countryOrRegion'],
      ['websiteUrl']
    ) ||
    !isValidPractitionerDisplayName(value.displayName) ||
    !isValidPractitionerPracticeAreas(value.practiceAreas) ||
    !isValidPractitionerLanguages(value.languages) ||
    !isValidPractitionerCountryOrRegion(value.countryOrRegion)
  ) {
    return null;
  }

  const professionalHeadline = normalizeTextField(
    value.professionalHeadline,
    PRACTITIONER_HEADLINE_MINIMUM_CHARACTERS,
    PRACTITIONER_HEADLINE_MAXIMUM_CHARACTERS
  );
  const bio = normalizeTextField(
    value.bio,
    PRACTITIONER_BIO_MINIMUM_CHARACTERS,
    PRACTITIONER_BIO_MAXIMUM_CHARACTERS
  );
  const websiteUrl = normalizeWebsite(value.websiteUrl);

  if (
    professionalHeadline === null ||
    bio === null ||
    websiteUrl === null ||
    !isValidPractitionerProfessionalPresentation({
      professionalHeadline,
      bio,
      practiceStatement: 'This is a descriptive astrology practice statement.'
    })
  ) {
    return null;
  }

  return {
    displayName: normalizePractitionerDisplayName(value.displayName),
    professionalHeadline,
    bio,
    practiceAreas: [...value.practiceAreas],
    languages: [...value.languages],
    countryOrRegion: normalizePractitionerText(value.countryOrRegion),
    ...(websiteUrl === undefined ? {} : { websiteUrl })
  };
}

export function normalizePractitionerApplicationRequest(
  value: unknown
): PractitionerApplicationInput | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(
      value,
      [
        'requestedDisplayName',
        'professionalHeadline',
        'bio',
        'practiceAreas',
        'languages',
        'countryOrRegion',
        'practiceStatement',
        'evidenceUrls',
        'consentToPublicProfile'
      ],
      ['websiteUrl']
    ) ||
    !isValidPractitionerDisplayName(value.requestedDisplayName) ||
    !isValidPractitionerPracticeAreas(value.practiceAreas) ||
    !isValidPractitionerLanguages(value.languages) ||
    !isValidPractitionerCountryOrRegion(value.countryOrRegion) ||
    !isValidPractitionerEvidenceUrls(value.evidenceUrls) ||
    value.consentToPublicProfile !== true
  ) {
    return null;
  }

  const professionalHeadline = normalizeTextField(
    value.professionalHeadline,
    PRACTITIONER_HEADLINE_MINIMUM_CHARACTERS,
    PRACTITIONER_HEADLINE_MAXIMUM_CHARACTERS
  );
  const bio = normalizeTextField(
    value.bio,
    PRACTITIONER_BIO_MINIMUM_CHARACTERS,
    PRACTITIONER_BIO_MAXIMUM_CHARACTERS
  );
  const practiceStatement = normalizeTextField(
    value.practiceStatement,
    PRACTITIONER_PRACTICE_STATEMENT_MINIMUM_CHARACTERS,
    PRACTITIONER_PRACTICE_STATEMENT_MAXIMUM_CHARACTERS
  );
  const websiteUrl = normalizeWebsite(value.websiteUrl);

  if (
    professionalHeadline === null ||
    bio === null ||
    practiceStatement === null ||
    websiteUrl === null ||
    !isValidPractitionerProfessionalPresentation({
      professionalHeadline,
      bio,
      practiceStatement
    })
  ) {
    return null;
  }

  return {
    requestedDisplayName: normalizePractitionerDisplayName(value.requestedDisplayName),
    professionalHeadline,
    bio,
    practiceAreas: [...value.practiceAreas],
    languages: [...value.languages],
    countryOrRegion: normalizePractitionerText(value.countryOrRegion),
    ...(websiteUrl === undefined ? {} : { websiteUrl }),
    practiceStatement,
    evidenceUrls: [...value.evidenceUrls].map((url) => normalizeHttpsUrl(url) as string),
    consentToPublicProfile: true
  };
}

export function normalizePractitionerProfileRevisionRequest(
  value: unknown
): PractitionerProfileRevisionInput | null {
  return isRecord(value) ? normalizeProfileFields(value) : null;
}

export function normalizePractitionerReviewApplicationRequest(
  value: unknown
): PractitionerReviewApplicationApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['action', 'reasonCode', 'version'], ['note']) ||
    !isPractitionerReviewAction(value.action) ||
    !isPractitionerReviewReasonCode(value.reasonCode) ||
    typeof value.version !== 'number' ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1
  ) {
    return null;
  }

  if (value.note !== undefined) {
    const note = normalizeTextField(
      value.note,
      0,
      PRACTITIONER_REVIEW_NOTE_MAXIMUM_CHARACTERS
    );
    if (note === null) {
      return null;
    }
    return {
      action: value.action,
      reasonCode: value.reasonCode,
      version: value.version,
      note
    };
  }

  return {
    action: value.action,
    reasonCode: value.reasonCode,
    version: value.version
  };
}

export function normalizePractitionerProfileRevisionReviewRequest(
  value: unknown
): PractitionerReviewProfileRevisionApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['applicationId', 'action', 'reasonCode', 'version'], ['note']) ||
    !isPractitionerOpaqueId(value.applicationId)
  ) {
    return null;
  }
  const review = normalizePractitionerReviewApplicationRequest({
    action: value.action,
    reasonCode: value.reasonCode,
    version: value.version,
    ...(value.note === undefined ? {} : { note: value.note })
  });
  if (review === null || (review.action !== 'APPROVE' && review.action !== 'REJECT')) {
    return null;
  }
  return {
    applicationId: value.applicationId,
    action: review.action,
    reasonCode: review.reasonCode,
    version: review.version,
    ...(review.note === undefined ? {} : { note: review.note })
  };
}

export function parsePractitionerReviewQueueStatus(
  value: string | undefined
): PractitionerReviewQueueStatus | null {
  return value === undefined || value.length === 0
    ? null
    : isPractitionerReviewQueueStatus(value)
      ? value
      : null;
}

export function normalizePractitionerReportResolutionRequest(
  value: unknown
): PractitionerReportResolutionApiRequest | null {
  return isRecord(value) &&
    hasOnlyKeys(value, ['state']) &&
    (value.state === 'RESOLVED' || value.state === 'DISMISSED')
    ? { state: value.state }
    : null;
}

export function normalizeCreatePractitionerReportRequest(
  value: unknown
): CreatePractitionerReportApiRequest | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['practitionerId', 'category'], ['details']) ||
    !isPractitionerOpaqueId(value.practitionerId) ||
    !isPractitionerReportCategory(value.category)
  ) {
    return null;
  }

  if (value.details === undefined) {
    return {
      practitionerId: value.practitionerId,
      category: value.category
    };
  }

  if (
    !isValidPractitionerPlainText(
      value.details,
      0,
      PRACTITIONER_PROFILE_REPORT_MAXIMUM_CHARACTERS
    )
  ) {
    return null;
  }

  return {
    practitionerId: value.practitionerId,
    category: value.category,
    details: normalizePractitionerText(value.details)
  };
}

export function parsePractitionerPageQuery(
  limitValue: string | undefined,
  cursorValue: string | undefined
): { readonly limit: number; readonly cursor: string | null } | null {
  const limit =
    limitValue === undefined
      ? 20
      : /^\d+$/u.test(limitValue)
        ? Number(limitValue)
        : Number.NaN;

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    return null;
  }

  if (cursorValue === undefined || cursorValue.length === 0) {
    return { limit, cursor: null };
  }

  return cursorValue.length <= 512 && /^[A-Za-z0-9_-]+$/u.test(cursorValue)
    ? { limit, cursor: cursorValue }
    : null;
}

export function parsePractitionerOpaqueId(value: string | undefined): string | null {
  return isPractitionerOpaqueId(value) ? value : null;
}

export function isPractitionerReviewerAction(value: unknown): boolean {
  return value === 'APPROVE' || value === 'REJECT';
}

export function isSafePractitionerText(value: unknown): value is string {
  return isValidPractitionerPlainText(value, 0, PRACTITIONER_PROFILE_REPORT_MAXIMUM_CHARACTERS);
}

export function isSupportedPractitionerLanguage(value: unknown): boolean {
  return isPractitionerLanguageCode(value);
}
