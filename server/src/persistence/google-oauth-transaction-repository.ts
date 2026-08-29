import type {
  GoogleOAuthTransactionRecord,
  GoogleOAuthTransactionTerminalStatus
} from '../auth-runtime/google-oauth-transaction.js';

export interface GoogleOAuthTransactionClaimInput {
  readonly stateHash: string;
  readonly browserBindingHash: string;
  readonly now: string;
}

/** Server-only material needed after an atomic callback claim. */
export interface GoogleOAuthTransactionClaim {
  readonly transactionId: string;
  /** Recoverable only inside the server callback/provider boundary. */
  readonly pkceVerifier: string;
  readonly nonceHash: string;
  readonly postAuthRedirect: '/';
}

export interface GoogleOAuthTransactionTerminalizeInput {
  readonly transactionId: string;
  readonly status: GoogleOAuthTransactionTerminalStatus;
  readonly terminalAt: string;
}

/**
 * Narrow durable boundary for the pre-account-resolution Google flow. It has
 * no generic lookup, patch, list, or browser-facing operation.
 */
export interface GoogleOAuthTransactionRepository {
  create(record: GoogleOAuthTransactionRecord): Promise<void>;
  claimPending(
    input: GoogleOAuthTransactionClaimInput
  ): Promise<GoogleOAuthTransactionClaim | null>;
  terminalize(input: GoogleOAuthTransactionTerminalizeInput): Promise<boolean>;
}
