import {
  SIGN_CLASSIFICATIONS,
  type SignId
} from '../../core/astrology-taxonomy/chart-taxonomy.js';

export interface SignMatchPair {
  readonly signA: SignId;
  readonly signB: SignId;
}

export const DEFAULT_SIGN_MATCH_PAIR: SignMatchPair = Object.freeze({
  signA: 'aries',
  signB: 'pisces'
});

export function parseSignId(value: unknown): SignId | null {
  if (typeof value !== 'string') {
    return null;
  }

  return SIGN_CLASSIFICATIONS.find((sign) => sign.id === value)?.id ?? null;
}

interface SearchParamsLike {
  get(name: string): string | null;
}

export type SignMatchSearchInput = SearchParamsLike | string | null | undefined;

/**
 * Parse only the two canonical query values. A malformed value falls back to
 * the corresponding neutral sample selection; it never creates a new sign.
 */
export function parseSignMatchSearch(input: SignMatchSearchInput): SignMatchPair {
  const params: SearchParamsLike =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input ?? { get: () => null };

  return Object.freeze({
    signA: parseSignId(params.get('a')) ?? DEFAULT_SIGN_MATCH_PAIR.signA,
    signB: parseSignId(params.get('b')) ?? DEFAULT_SIGN_MATCH_PAIR.signB
  });
}

export function serializeSignMatchSearch(pair: SignMatchPair): string {
  const params = new URLSearchParams();
  params.set('a', pair.signA);
  params.set('b', pair.signB);
  return `?${params.toString()}`;
}

export function getSignMatchPath(pathname: string, pair: SignMatchPair): string {
  return `${pathname}${serializeSignMatchSearch(pair)}`;
}
