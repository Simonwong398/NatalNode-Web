import type {
  PractitionerApplicationView,
  PractitionerApplicationInput,
  PractitionerProfileRevisionView,
  PractitionerPublicProfile,
  PractitionerReviewHistoryEntry,
  PractitionerReviewApplicationView,
  PractitionerReviewProfileRevisionView,
  PractitionerReviewReportView
} from '@natalnode/contracts';
import type {
  PractitionerApplicationRecord,
  PractitionerProfileRecord,
  PractitionerProfileRevisionRecord,
  PractitionerReviewEventRecord,
  PractitionerReviewProfileRevisionRecord,
  PractitionerReportRecord
} from './practitioner-repository.js';

export const PRACTITIONER_PUBLIC_DISCLOSURE =
  "Practitioner status means this profile completed NatalNode's application review. It does not constitute professional certification, scientific validation, or endorsement of specific advice.";

function applicationInput(
  application: PractitionerApplicationRecord
): PractitionerApplicationInput {
  return {
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
    consentToPublicProfile: true
  };
}

export function presentPractitionerApplication(
  application: PractitionerApplicationRecord,
  contributor: boolean
): PractitionerApplicationView {
  return {
    ...applicationInput(application),
    applicationId: application.applicationId,
    submittedAt: application.submittedAt,
    status: application.status,
    version: application.version,
    finalizedAt: application.finalizedAt,
    purgeEligibleAt: application.purgeEligibleAt,
    contributor
  };
}

export function presentPractitionerReviewApplication(
  application: PractitionerApplicationRecord,
  contributor: boolean,
  history: readonly PractitionerReviewEventRecord[]
): PractitionerReviewApplicationView {
  return {
    ...presentPractitionerApplication(application, contributor),
    userId: application.userId ?? '',
    reviewHistory: history.map(
      (event): PractitionerReviewHistoryEntry => ({
        reviewEventId: event.reviewEventId,
        reviewerUserId: event.reviewerUserId,
        action: event.action,
        reasonCode: event.reasonCode,
        note: event.note,
        applicationVersion: event.applicationVersion,
        createdAt: event.createdAt
      })
    )
  };
}

export function presentPractitionerProfile(
  profile: PractitionerProfileRecord,
  contributions: PractitionerPublicProfile['contributions']
): PractitionerPublicProfile {
  return {
    practitionerId: profile.practitionerId,
    displayName: profile.displayName,
    professionalHeadline: profile.professionalHeadline,
    bio: profile.bio,
    practiceAreas: [...profile.practiceAreas],
    languages: [...profile.languages],
    countryOrRegion: profile.countryOrRegion,
    ...(profile.websiteUrl === undefined ? {} : { websiteUrl: profile.websiteUrl }),
    foundingPractitioner: profile.foundingPractitioner,
    approvedAt: profile.approvedAt,
    contributions
  };
}

export function presentPractitionerProfileRevision(
  revision: PractitionerProfileRevisionRecord
): PractitionerProfileRevisionView {
  return {
    revisionId: revision.revisionId,
    practitionerId: revision.practitionerId,
    displayName: revision.displayName,
    professionalHeadline: revision.professionalHeadline,
    bio: revision.bio,
    practiceAreas: [...revision.practiceAreas],
    languages: [...revision.languages],
    countryOrRegion: revision.countryOrRegion,
    ...(revision.websiteUrl === undefined ? {} : { websiteUrl: revision.websiteUrl }),
    status: revision.status,
    submittedAt: revision.submittedAt
  };
}

export function presentPractitionerReviewProfileRevision(
  revision: PractitionerReviewProfileRevisionRecord
): PractitionerReviewProfileRevisionView {
  return {
    ...presentPractitionerProfileRevision(revision),
    applicationId: revision.applicationId,
    userId: revision.userId ?? ''
  };
}

export function presentPractitionerReport(
  report: PractitionerReportRecord
): PractitionerReviewReportView {
  return {
    reportId: report.reportId,
    practitionerId: report.practitionerId,
    category: report.category,
    details: report.details,
    state: report.state,
    createdAt: report.createdAt
  };
}
