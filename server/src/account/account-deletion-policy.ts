export const RECENT_AUTH_MAX_AGE_SECONDS = 600;

const RECENT_AUTH_MAX_AGE_MILLISECONDS =
  RECENT_AUTH_MAX_AGE_SECONDS * 1_000;

/** Evaluates immutable server timestamps without consulting browser time. */
export function isRecentAuthentication(
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
  return ageMs >= 0 && ageMs <= RECENT_AUTH_MAX_AGE_MILLISECONDS;
}
