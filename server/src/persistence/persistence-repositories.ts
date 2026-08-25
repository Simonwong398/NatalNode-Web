import type { AuthSessionRepository } from './auth-session-repository.js';
import type { AuthIdentityRepository } from './auth-identity-repository.js';
import type { ChartNoteRepository } from './chart-note-repository.js';
import type { EmailMagicLinkChallengeRepository } from './email-magic-link-challenge-repository.js';
import type { UserRepository } from './user-repository.js';
import type { VaultChartRepository } from './vault-chart-repository.js';

export interface PersistenceRepositories {
  readonly users: UserRepository;
  readonly authIdentities: AuthIdentityRepository;
  readonly authSessions: AuthSessionRepository;
  readonly emailMagicLinkChallenges: EmailMagicLinkChallengeRepository;
  readonly vaultCharts: VaultChartRepository;
  readonly chartNotes: ChartNoteRepository;
}
