import { createHash } from 'node:crypto';
import type { SqlExecutor } from '../../db/index.js';

const AUTH_LIFECYCLE_LOCK_DOMAIN = 'natalnode:auth-lifecycle:v1\0';

const ACQUIRE_AUTH_LIFECYCLE_LOCK_SQL = `
  SELECT pg_advisory_xact_lock($1::bigint)
`;

/** Produces one stable signed 64-bit PostgreSQL advisory-lock key. */
export function deriveAuthLifecycleLockKey(emailNormalized: string): string {
  if (emailNormalized.length === 0) {
    throw new Error('Normalized email must not be empty.');
  }

  const digest = createHash('sha256')
    .update(AUTH_LIFECYCLE_LOCK_DOMAIN, 'utf8')
    .update(emailNormalized, 'utf8')
    .digest();

  return digest.readBigInt64BE(0).toString();
}

/** Deduplicates and orders identities before any advisory locks are acquired. */
export function sortNormalizedEmailsForAuthLifecycle(
  emailsNormalized: readonly string[]
): readonly string[] {
  const uniqueEmails = new Set(emailsNormalized);

  if ([...uniqueEmails].some((email) => email.length === 0)) {
    throw new Error('Normalized email must not be empty.');
  }

  return [...uniqueEmails].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0
  );
}

export async function acquireAuthLifecycleLocks(
  executor: SqlExecutor,
  emailsNormalized: readonly string[]
): Promise<readonly string[]> {
  const orderedEmails = sortNormalizedEmailsForAuthLifecycle(emailsNormalized);

  for (const emailNormalized of orderedEmails) {
    await executor.query<never>(ACQUIRE_AUTH_LIFECYCLE_LOCK_SQL, [
      deriveAuthLifecycleLockKey(emailNormalized)
    ]);
  }

  return orderedEmails;
}
