import type { AuthProvider } from '../auth.js';
import type { VaultCapacity } from './vault.js';

/**
 * Private, owner-scoped account information intended for the Account page.
 * Provider subjects and internal account identifiers are deliberately absent.
 */
export interface AccountOverviewApiResponse {
  readonly authentication: {
    readonly methods: readonly AuthProvider[];
    /** Normalized Email Magic Link identities only; Google subjects are never exposed. */
    readonly emailAddresses: readonly string[];
  };
  readonly account: {
    /** ISO 8601 timestamp for the authenticated account's creation. */
    readonly createdAt: string;
  };
  readonly vaultCapacity: VaultCapacity;
}
