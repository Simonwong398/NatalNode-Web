import type { AuthSessionRecord } from '../auth-runtime/types.js';

export interface AuthSessionRepository {
  create(record: AuthSessionRecord): Promise<void>;
  findActiveByTokenHash(
    sessionTokenHash: string,
    now: string
  ): Promise<AuthSessionRecord | null>;
  deleteByTokenHash(sessionTokenHash: string): Promise<boolean>;
}
