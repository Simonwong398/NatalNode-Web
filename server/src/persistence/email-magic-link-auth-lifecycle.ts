import type {
  EmailMagicLinkChallengeRecord
} from '../auth-runtime/types.js';
import type {
  AuthIdentityProvisioningRepository
} from './auth-identity-provisioning-repository.js';
import type { AuthSessionRepository } from './auth-session-repository.js';

export interface ConsumeEmailMagicLinkChallengeInput {
  readonly tokenHash: string;
  readonly now: string;
  readonly consumedAt: string;
}

export interface ConsumedEmailMagicLinkTransactionContext {
  readonly challenge: EmailMagicLinkChallengeRecord;
  readonly authIdentityProvisioning: AuthIdentityProvisioningRepository;
  readonly authSessions: AuthSessionRepository;
}

/**
 * Serializes Email Magic Link persistence by normalized email and keeps
 * challenge consumption, identity provisioning, and session creation in one
 * PostgreSQL transaction.
 */
export interface EmailMagicLinkAuthLifecycle {
  createChallenge(record: EmailMagicLinkChallengeRecord): Promise<void>;

  withConsumedChallenge<Result>(
    input: ConsumeEmailMagicLinkChallengeInput,
    complete: (
      context: ConsumedEmailMagicLinkTransactionContext
    ) => Promise<Result>
  ): Promise<Result | null>;
}
