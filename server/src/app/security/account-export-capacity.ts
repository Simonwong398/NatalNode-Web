import { createHmac, randomBytes } from 'node:crypto';

export const ACCOUNT_EXPORT_MAX_ACTIVE = 2;
export const ACCOUNT_EXPORT_MAX_ACTIVE_PER_ACCOUNT = 1;

export interface AccountExportCapacityLease {
  release(): void;
}

export type AccountExportCapacityDecision =
  | { readonly allowed: true; readonly lease: AccountExportCapacityLease }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

/** Process-local active-export gate; raw account identifiers never persist here. */
export class InMemoryAccountExportCapacity {
  private readonly activeAccounts = new Set<string>();
  private readonly keySalt = randomBytes(32);
  private activeCount = 0;

  public constructor(
    private readonly maximumActive = ACCOUNT_EXPORT_MAX_ACTIVE,
    private readonly maximumActivePerAccount =
      ACCOUNT_EXPORT_MAX_ACTIVE_PER_ACCOUNT
  ) {
    if (!Number.isSafeInteger(maximumActive) || maximumActive <= 0) {
      throw new Error('Account export active capacity must be positive.');
    }

    if (
      !Number.isSafeInteger(maximumActivePerAccount) ||
      maximumActivePerAccount !== 1
    ) {
      throw new Error('Account export per-account capacity must be one.');
    }
  }

  public tryAcquire(accountId: string): AccountExportCapacityDecision {
    const accountKey = this.deriveAccountKey(accountId);

    if (
      this.activeAccounts.has(accountKey) ||
      this.activeCount >= this.maximumActive
    ) {
      return { allowed: false, retryAfterSeconds: 1 };
    }

    this.activeAccounts.add(accountKey);
    this.activeCount += 1;
    let released = false;

    return {
      allowed: true,
      lease: {
        release: () => {
          if (released) {
            return;
          }

          released = true;
          this.activeAccounts.delete(accountKey);
          this.activeCount -= 1;
        }
      }
    };
  }

  private deriveAccountKey(accountId: string): string {
    return createHmac('sha256', this.keySalt)
      .update(accountId, 'utf8')
      .digest('hex');
  }
}
