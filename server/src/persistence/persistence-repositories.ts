import type { AuthSessionRepository } from './auth-session-repository.js';
import type { AuthIdentityRepository } from './auth-identity-repository.js';
import type { AuthIdentityProvisioningRepository } from './auth-identity-provisioning-repository.js';
import type { ChartNoteRepository } from './chart-note-repository.js';
import type { EmailMagicLinkChallengeRepository } from './email-magic-link-challenge-repository.js';
import type { FeedbackSubmissionRepository } from './feedback-submission-repository.js';
import type { UserRepository } from './user-repository.js';
import type { VaultChartRepository } from './vault-chart-repository.js';
import type {
  NotificationPreferenceRepository,
  PushSubscriptionRepository
} from '../notification-platform/repositories.js';
import type { CommunityRepository } from '../community/community-repository.js';

export interface PersistenceRepositories {
  readonly users: UserRepository;
  readonly authIdentities: AuthIdentityRepository;
  readonly authIdentityProvisioning: AuthIdentityProvisioningRepository;
  readonly authSessions: AuthSessionRepository;
  readonly emailMagicLinkChallenges: EmailMagicLinkChallengeRepository;
  readonly feedbackSubmissions: FeedbackSubmissionRepository;
  readonly vaultCharts: VaultChartRepository;
  readonly chartNotes: ChartNoteRepository;
  readonly notificationPreferences: NotificationPreferenceRepository;
  readonly pushSubscriptions: PushSubscriptionRepository;
  readonly community: CommunityRepository;
}
