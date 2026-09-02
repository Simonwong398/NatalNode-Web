import type {
  PractitionerApplicationStatus,
  PractitionerPracticeAreaId,
  PractitionerProfileRevisionStatus,
  PractitionerProfileStatus,
  PractitionerReportCategory,
  PractitionerReportState,
  PractitionerReviewAction,
  PractitionerReviewReasonCode
} from '@natalnode/contracts';
import type {
  PractitionerApplicationRecord,
  PractitionerProfileRecord,
  PractitionerProfileRevisionRecord,
  PractitionerReportRecord,
  PractitionerReviewEventRecord,
  PractitionerRetentionHold
} from './practitioner-repository.js';
import { normalizePractitionerTimestamp } from './practitioner-domain.js';

export interface PractitionerApplicationRow {
  readonly application_id: string;
  readonly user_id: string | null;
  readonly requested_display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly practice_statement: string;
  readonly evidence_urls: readonly string[];
  readonly consent_to_public_profile: boolean;
  readonly submitted_at: Date | string;
  readonly status: PractitionerApplicationStatus;
  readonly version: number;
  readonly finalized_at: Date | string | null;
  readonly purge_eligible_at: Date | string | null;
  readonly retention_hold: PractitionerRetentionHold;
  readonly account_deleted_at: Date | string | null;
}

export interface PractitionerProfileRow {
  readonly practitioner_id: string;
  readonly application_id: string;
  readonly user_id: string | null;
  readonly display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly founding_practitioner: boolean;
  readonly approved_at: Date | string;
  readonly profile_status: PractitionerProfileStatus;
  readonly ended_at: Date | string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

export interface PractitionerProfileRevisionRow {
  readonly revision_id: string;
  readonly practitioner_id: string;
  readonly submitted_by_user_id: string | null;
  readonly display_name: string;
  readonly professional_headline: string;
  readonly bio: string;
  readonly practice_areas: readonly PractitionerPracticeAreaId[];
  readonly languages: readonly string[];
  readonly country_or_region: string;
  readonly website_url: string | null;
  readonly status: PractitionerProfileRevisionStatus;
  readonly submitted_at: Date | string;
  readonly reviewed_at: Date | string | null;
  readonly purge_eligible_at: Date | string;
  readonly retention_hold: PractitionerRetentionHold;
}

export interface PractitionerRevisionLockRow extends PractitionerProfileRevisionRow {
  readonly application_id: string;
  readonly profile_user_id: string | null;
  readonly profile_status: PractitionerProfileStatus;
  readonly application_version: number;
}

export interface PractitionerPendingRevisionRow extends PractitionerRevisionLockRow {}

export interface PractitionerReportRow {
  readonly report_id: string;
  readonly reporter_user_id: string | null;
  readonly practitioner_id: string;
  readonly category: PractitionerReportCategory;
  readonly details: string;
  readonly state: PractitionerReportState;
  readonly created_at: Date | string;
  readonly resolved_at: Date | string | null;
  readonly purge_eligible_at: Date | string | null;
  readonly retention_hold: PractitionerRetentionHold;
}

export interface PractitionerFinalApplicationRow {
  readonly status: 'REJECTED' | 'WITHDRAWN' | 'REVOKED';
  readonly finalized_at: Date | string;
  readonly purge_eligible_at: Date | string;
  readonly retention_hold: PractitionerRetentionHold;
}

export interface PractitionerReviewEventRow {
  readonly review_event_id: string;
  readonly reviewer_user_id: string | null;
  readonly application_id: string;
  readonly revision_id: string | null;
  readonly action: PractitionerReviewAction;
  readonly reason_code: PractitionerReviewReasonCode;
  readonly note: string | null;
  readonly application_version: number;
  readonly created_at: Date | string;
  readonly purge_eligible_at: Date | string | null;
  readonly retention_hold: PractitionerRetentionHold;
}

export interface PractitionerContributionRow {
  readonly kind: 'QUESTION' | 'ANSWER';
  readonly contribution_id: string;
  readonly title: string;
  readonly question_id: string;
  readonly created_at: Date | string;
}

function timestamp(value: Date | string): string {
  return normalizePractitionerTimestamp(value);
}

function nullableTimestamp(value: Date | string | null): string | null {
  return value === null ? null : timestamp(value);
}

export function mapPractitionerApplication(
  row: PractitionerApplicationRow
): PractitionerApplicationRecord {
  return {
    applicationId: row.application_id,
    userId: row.user_id,
    requestedDisplayName: row.requested_display_name,
    professionalHeadline: row.professional_headline,
    bio: row.bio,
    practiceAreas: [...row.practice_areas],
    languages: [...row.languages],
    countryOrRegion: row.country_or_region,
    ...(row.website_url === null ? {} : { websiteUrl: row.website_url }),
    practiceStatement: row.practice_statement,
    evidenceUrls: [...row.evidence_urls],
    consentToPublicProfile: true,
    submittedAt: timestamp(row.submitted_at),
    status: row.status,
    version: row.version,
    finalizedAt: nullableTimestamp(row.finalized_at),
    purgeEligibleAt: nullableTimestamp(row.purge_eligible_at),
    retentionHold: row.retention_hold,
    accountDeletedAt: nullableTimestamp(row.account_deleted_at)
  };
}

export function mapPractitionerProfile(
  row: PractitionerProfileRow
): PractitionerProfileRecord {
  return {
    practitionerId: row.practitioner_id,
    applicationId: row.application_id,
    userId: row.user_id,
    displayName: row.display_name,
    professionalHeadline: row.professional_headline,
    bio: row.bio,
    practiceAreas: [...row.practice_areas],
    languages: [...row.languages],
    countryOrRegion: row.country_or_region,
    ...(row.website_url === null ? {} : { websiteUrl: row.website_url }),
    foundingPractitioner: row.founding_practitioner,
    approvedAt: timestamp(row.approved_at),
    profileStatus: row.profile_status,
    endedAt: nullableTimestamp(row.ended_at),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at)
  };
}

export function mapPractitionerRevision(
  row: PractitionerProfileRevisionRow
): PractitionerProfileRevisionRecord {
  return {
    revisionId: row.revision_id,
    practitionerId: row.practitioner_id,
    submittedByUserId: row.submitted_by_user_id,
    displayName: row.display_name,
    professionalHeadline: row.professional_headline,
    bio: row.bio,
    practiceAreas: [...row.practice_areas],
    languages: [...row.languages],
    countryOrRegion: row.country_or_region,
    ...(row.website_url === null ? {} : { websiteUrl: row.website_url }),
    status: row.status,
    submittedAt: timestamp(row.submitted_at),
    reviewedAt: nullableTimestamp(row.reviewed_at),
    purgeEligibleAt: timestamp(row.purge_eligible_at),
    retentionHold: row.retention_hold
  };
}

export function mapPractitionerReport(
  row: PractitionerReportRow
): PractitionerReportRecord {
  return {
    reportId: row.report_id,
    reporterUserId: row.reporter_user_id,
    practitionerId: row.practitioner_id,
    category: row.category,
    details: row.details,
    state: row.state,
    createdAt: timestamp(row.created_at),
    resolvedAt: nullableTimestamp(row.resolved_at),
    purgeEligibleAt: nullableTimestamp(row.purge_eligible_at),
    retentionHold: row.retention_hold
  };
}

export function mapPractitionerReviewEvent(
  row: PractitionerReviewEventRow
): PractitionerReviewEventRecord {
  return {
    reviewEventId: row.review_event_id,
    reviewerUserId: row.reviewer_user_id,
    applicationId: row.application_id,
    revisionId: row.revision_id,
    action: row.action,
    reasonCode: row.reason_code,
    note: row.note,
    applicationVersion: row.application_version,
    createdAt: timestamp(row.created_at),
    purgeEligibleAt: nullableTimestamp(row.purge_eligible_at),
    retentionHold: row.retention_hold
  };
}

export interface PractitionerProfileCursor {
  readonly displayName: string;
  readonly practitionerId: string;
}

export function encodePractitionerProfileCursor(
  cursor: PractitionerProfileCursor
): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodePractitionerProfileCursor(
  cursor: string | null
): PractitionerProfileCursor | null {
  if (cursor === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    );
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      typeof (parsed as { displayName?: unknown }).displayName !== 'string' ||
      typeof (parsed as { practitionerId?: unknown }).practitionerId !== 'string' ||
      (parsed as { displayName: string }).displayName.length > 200 ||
      (parsed as { practitionerId: string }).practitionerId.length > 256
    ) {
      throw new Error('Invalid Practitioner cursor shape.');
    }

    return parsed as PractitionerProfileCursor;
  } catch (_error) {
    throw new Error('Practitioner cursor is invalid.');
  }
}
