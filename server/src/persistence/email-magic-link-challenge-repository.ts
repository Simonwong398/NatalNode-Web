import type { EmailMagicLinkChallengeRecord } from '../auth-runtime/types.js';

export interface EmailMagicLinkChallengeRepository {
  create(record: EmailMagicLinkChallengeRecord): Promise<void>;
  consumeValidByTokenHash(
    tokenHash: string,
    now: string,
    consumedAt: string
  ): Promise<EmailMagicLinkChallengeRecord | null>;
}
