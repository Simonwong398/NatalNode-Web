export type {
  AccountErasureRepository,
  AccountErasureResult
} from './account-erasure-repository.js';
export type {
  AccountDataExportChartPageItem,
  AccountDataExportCursor,
  AccountDataExportPage,
  AccountDataExportNotificationsPage,
  AccountDataExportRepository,
  AccountDataExportSnapshot,
  AccountDataExportSnapshotOpenOptions,
  AccountDataExportSnapshotOpenResult
} from './account-data-export-repository.js';
export type { AuthSessionRepository } from './auth-session-repository.js';
export type {
  GoogleAuthAccountSessionInput,
  GoogleAuthAccountSessionLifecycle,
  GoogleAuthAccountSessionResult
} from './google-auth-account-session-lifecycle.js';
export type {
  GoogleOAuthTransactionClaim,
  GoogleOAuthTransactionClaimInput,
  GoogleOAuthTransactionRepository,
  GoogleOAuthTransactionTerminalizeInput
} from './google-oauth-transaction-repository.js';
export {
  assertAuthLifecycleCleanupBatchSize,
  AUTH_LIFECYCLE_CLEANUP_DEFAULT_BATCH_SIZE,
  AUTH_LIFECYCLE_CLEANUP_MAX_BATCH_SIZE
} from './auth-lifecycle-cleanup-repository.js';
export type {
  AuthLifecycleCleanupBatchInput,
  AuthLifecycleCleanupRepository,
  AuthLifecycleCleanupResult
} from './auth-lifecycle-cleanup-repository.js';
export type { AuthIdentityRepository } from './auth-identity-repository.js';
export type {
  AuthIdentityProvisioningInput,
  AuthIdentityProvisioningRepository
} from './auth-identity-provisioning-repository.js';
export type { ChartNoteRepository } from './chart-note-repository.js';
export type { EmailMagicLinkChallengeRepository } from './email-magic-link-challenge-repository.js';
export type {
  ConsumeEmailMagicLinkChallengeInput,
  ConsumedEmailMagicLinkTransactionContext,
  EmailMagicLinkAuthLifecycle
} from './email-magic-link-auth-lifecycle.js';
export type {
  FeedbackSubmissionRecord,
  FeedbackSubmissionRepository
} from './feedback-submission-repository.js';
export type {
  FeedbackRetentionPurgeResult,
  FeedbackRetentionRepository
} from './feedback-retention-repository.js';
export type {
  PrivacyAccessAuditAccountResourceCategory,
  PrivacyAccessAuditAction,
  PrivacyAccessAuditActorType,
  PrivacyAccessAuditEvent,
  PrivacyAccessAuditOutcome,
  PrivacyAccessAuditRepository,
  PrivacyAccessAuditResourceCategory
} from './privacy-access-audit-repository.js';
export type { PersistenceRepositories } from './persistence-repositories.js';
export type {
  NotificationPreferenceRepository,
  PushSubscriptionRepository,
  RegisterPushSubscriptionResult
} from '../notification-platform/repositories.js';
export type { VaultChartRepository } from './vault-chart-repository.js';
export type { UserRepository } from './user-repository.js';
export type { ChartNoteContentUpdate, VaultChartMetadataUpdate } from './types.js';
export type {
  CommunityAnswerRecord,
  CommunityModerationEventRecord,
  CommunityModerationOutcome,
  CommunityOwnershipOutcome,
  CommunityProfileRecord,
  CommunityQuestionDetailRecord,
  CommunityQuestionPage,
  CommunityQuestionRecord,
  CommunityReportCreateOutcome,
  CommunityReportRecord,
  CommunityRepository,
  CommunityRetentionPurgeResult
} from '../community/community-repository.js';
export type {
  PractitionerApplicationCreateOutcome,
  PractitionerApplicationMutationOutcome,
  PractitionerApplicationRecord,
  PractitionerFoundingOutcome,
  PractitionerProfilePage,
  PractitionerProfileRecord,
  PractitionerProfileRevisionOutcome,
  PractitionerProfileRevisionRecord,
  PractitionerProfileRevisionReviewOutcome,
  PractitionerReportCreateOutcome,
  PractitionerReportRecord,
  PractitionerReportResolutionOutcome,
  PractitionerRepository,
  PractitionerRetentionPurgeResult,
  PractitionerReviewEventRecord,
  PractitionerReviewProfileRevisionRecord,
  PractitionerReviewOutcome
} from '../practitioner/practitioner-repository.js';
