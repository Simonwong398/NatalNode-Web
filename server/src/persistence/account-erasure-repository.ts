export type AccountErasureResult =
  | { readonly outcome: 'deleted' }
  | { readonly outcome: 'account-not-found' };

/** Owns the complete active-database erasure transaction for one account. */
export interface AccountErasureRepository {
  eraseAccount(userId: string): Promise<AccountErasureResult>;
}
