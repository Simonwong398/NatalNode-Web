export type {
  AccountErasureRepository,
  AccountErasureResult
} from './account-erasure-repository.js';
export type { AuthSessionRepository } from './auth-session-repository.js';
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
export type { PersistenceRepositories } from './persistence-repositories.js';
export type { VaultChartRepository } from './vault-chart-repository.js';
export type { UserRepository } from './user-repository.js';
export type { ChartNoteContentUpdate, VaultChartMetadataUpdate } from './types.js';
