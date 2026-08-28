export const ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_SECONDS = 600;

const ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_MILLISECONDS =
  ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_SECONDS * 1_000;

/** Export-specific recent-auth policy using immutable server timestamps. */
export function isRecentAccountExportAuthentication(
  sessionCreatedAt: string,
  currentServerTime: string
): boolean {
  const sessionCreatedAtMs = Date.parse(sessionCreatedAt);
  const currentServerTimeMs = Date.parse(currentServerTime);

  if (
    !Number.isFinite(sessionCreatedAtMs) ||
    !Number.isFinite(currentServerTimeMs)
  ) {
    return false;
  }

  const ageMs = currentServerTimeMs - sessionCreatedAtMs;
  return (
    ageMs >= 0 && ageMs <= ACCOUNT_EXPORT_RECENT_AUTH_MAX_AGE_MILLISECONDS
  );
}
