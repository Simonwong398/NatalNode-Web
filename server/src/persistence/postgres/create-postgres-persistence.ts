import type { SqlExecutor, TransactionRunner } from '../../db/index.js';
import type { PersistenceRepositories } from '../persistence-repositories.js';
import { PostgresAuthSessionRepository } from './postgres-auth-session-repository.js';
import { PostgresAuthIdentityRepository } from './postgres-auth-identity-repository.js';
import { PostgresAuthIdentityProvisioningRepository } from './postgres-auth-identity-provisioning-repository.js';
import { PostgresChartNoteRepository } from './postgres-chart-note-repository.js';
import { PostgresEmailMagicLinkChallengeRepository } from './postgres-email-magic-link-challenge-repository.js';
import { PostgresFeedbackSubmissionRepository } from './postgres-feedback-submission-repository.js';
import { PostgresUserRepository } from './postgres-user-repository.js';
import { PostgresVaultChartRepository } from './postgres-vault-chart-repository.js';
import { PostgresNotificationPreferenceRepository } from '../../notification-platform/postgres/postgres-notification-preference-repository.js';
import { PostgresPushSubscriptionRepository } from '../../notification-platform/postgres/postgres-push-subscription-repository.js';
import { PostgresCommunityRepository } from '../../community/postgres-community-repository.js';
import { PostgresPractitionerRepository } from '../../practitioner/postgres-practitioner-repository.js';

export function createPostgresPersistence(
  executor: SqlExecutor,
  transactionRunner: TransactionRunner
): PersistenceRepositories {
  return {
    users: new PostgresUserRepository(executor),
    authIdentities: new PostgresAuthIdentityRepository(executor),
    authIdentityProvisioning: new PostgresAuthIdentityProvisioningRepository(executor),
    authSessions: new PostgresAuthSessionRepository(executor),
    emailMagicLinkChallenges: new PostgresEmailMagicLinkChallengeRepository(executor),
    feedbackSubmissions: new PostgresFeedbackSubmissionRepository(executor),
    vaultCharts: new PostgresVaultChartRepository(executor),
    chartNotes: new PostgresChartNoteRepository(executor),
    notificationPreferences: new PostgresNotificationPreferenceRepository(
      executor
    ),
    pushSubscriptions: new PostgresPushSubscriptionRepository(executor),
    community: new PostgresCommunityRepository(executor, transactionRunner),
    practitioner: new PostgresPractitionerRepository(executor, transactionRunner)
  };
}
