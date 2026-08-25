/** Canonicalizes email identity input without provider-specific rewriting. */
export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}
