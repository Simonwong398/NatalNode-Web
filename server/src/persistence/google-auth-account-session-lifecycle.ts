import type { AuthSessionRecord } from '../auth-runtime/types.js';

export interface GoogleAuthAccountSessionInput {
  readonly transactionId: string;
  readonly providerSubject: string;
  readonly emailNormalized: string;
  readonly proposedUserId: string;
  readonly proposedIdentityId: string;
  readonly session: AuthSessionRecord;
  readonly terminalAt: string;
}

export type GoogleAuthAccountSessionResult =
  | {
      readonly outcome: 'authenticated';
      readonly userId: string;
    }
  | {
      readonly outcome: 'email-collision';
    };

/**
 * Owns the local user/identity/session transaction after a Google callback
 * has already claimed its one-use OAuth transaction.
 */
export interface GoogleAuthAccountSessionLifecycle {
  resolveAndCreateSession(
    input: GoogleAuthAccountSessionInput
  ): Promise<GoogleAuthAccountSessionResult>;
}
