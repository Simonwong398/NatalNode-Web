import {
  SIGN_CLASSIFICATIONS,
  type SignElement,
  type SignId,
  type SignModality
} from '../core/astrology-taxonomy/chart-taxonomy.js';
import { getLocalizedPath, type SupportedLocale } from './localization.js';

/** Stable public route identities for the provider-independent Share V1 surface. */
export const SHARE_ROUTE_BASES = Object.freeze({
  sign: '/share/sign/',
  match: '/share/match/',
  elementsModes: '/share/elements-modes/'
});

export interface ShareSignMatchPair {
  readonly signA: SignId;
  readonly signB: SignId;
}

export type ShareElementModeConceptKind = 'element' | 'modality';

export interface ShareElementModeConcept {
  readonly kind: ShareElementModeConceptKind;
  readonly value: SignElement | SignModality;
  readonly slug: string;
}

const SIGN_ORDER = new Map<SignId, number>(
  SIGN_CLASSIFICATIONS.map((sign, index) => [sign.id, index])
);

/** Parses only the closed Core sign identity set. */
export function parseShareSignId(value: unknown): SignId | null {
  if (typeof value !== 'string') {
    return null;
  }

  return SIGN_CLASSIFICATIONS.find((sign) => sign.id === value)?.id ?? null;
}

/**
 * Canonicalize a pair in the Core zodiac order so the same comparison has one
 * share URL regardless of which sign was selected first in Discover.
 */
export function canonicalizeShareMatchPair(
  signA: unknown,
  signB: unknown
): ShareSignMatchPair | null {
  const first = parseShareSignId(signA);
  const second = parseShareSignId(signB);

  if (first === null || second === null) {
    return null;
  }

  const firstIndex = SIGN_ORDER.get(first);
  const secondIndex = SIGN_ORDER.get(second);

  if (firstIndex === undefined || secondIndex === undefined) {
    return null;
  }

  return firstIndex <= secondIndex
    ? Object.freeze({ signA: first, signB: second })
    : Object.freeze({ signA: second, signB: first });
}

export function getShareSignPath(locale: SupportedLocale, signId: SignId): string {
  const parsedSignId = parseShareSignId(signId);
  if (parsedSignId === null) {
    throw new TypeError('Unknown Share sign route identity');
  }

  return getLocalizedPath(locale, `${SHARE_ROUTE_BASES.sign}${parsedSignId}/`);
}

export function getShareMatchSlug(pair: ShareSignMatchPair): string {
  const canonicalPair = canonicalizeShareMatchPair(pair.signA, pair.signB);
  if (canonicalPair === null) {
    throw new TypeError('Unknown Share sign match route identity');
  }

  return `${canonicalPair.signA}--${canonicalPair.signB}`;
}

/** Rejects reversed/non-canonical slugs instead of silently redirecting them. */
export function parseShareMatchSlug(value: unknown): ShareSignMatchPair | null {
  if (typeof value !== 'string' || !/^[a-z]+--[a-z]+$/u.test(value)) {
    return null;
  }

  const [signA, signB] = value.split('--');
  const pair = canonicalizeShareMatchPair(signA, signB);

  return pair !== null && getShareMatchSlug(pair) === value ? pair : null;
}

export function getShareMatchPath(
  locale: SupportedLocale,
  pair: ShareSignMatchPair
): string {
  return getLocalizedPath(
    locale,
    `${SHARE_ROUTE_BASES.match}${getShareMatchSlug(pair)}/`
  );
}

/** Discover recipient path for a canonical pair; query state is not a share identity. */
export function getDiscoverMatchPathForShare(
  locale: SupportedLocale,
  pair: ShareSignMatchPair
): string {
  const canonicalPair = canonicalizeShareMatchPair(pair.signA, pair.signB);
  if (canonicalPair === null) {
    throw new TypeError('Unknown Discover sign match identity');
  }

  const search = new URLSearchParams({
    a: canonicalPair.signA,
    b: canonicalPair.signB
  });

  return `${getLocalizedPath(locale, '/discover/match/')}?${search.toString()}`;
}

/** Every unordered Core-defined pair, including same-sign comparisons. */
export const SHARE_MATCH_PAIRS = Object.freeze(
  SIGN_CLASSIFICATIONS.flatMap((first, firstIndex) =>
    SIGN_CLASSIFICATIONS.slice(firstIndex).map((second) =>
      Object.freeze({ signA: first.id, signB: second.id })
    )
  )
) as readonly ShareSignMatchPair[];

export const SHARE_ELEMENT_MODE_CONCEPTS: readonly ShareElementModeConcept[] = Object.freeze([
  Object.freeze({ kind: 'element', value: 'Fire', slug: 'element-fire' }),
  Object.freeze({ kind: 'element', value: 'Earth', slug: 'element-earth' }),
  Object.freeze({ kind: 'element', value: 'Air', slug: 'element-air' }),
  Object.freeze({ kind: 'element', value: 'Water', slug: 'element-water' }),
  Object.freeze({ kind: 'modality', value: 'Cardinal', slug: 'modality-cardinal' }),
  Object.freeze({ kind: 'modality', value: 'Fixed', slug: 'modality-fixed' }),
  Object.freeze({ kind: 'modality', value: 'Mutable', slug: 'modality-mutable' })
]);

export function parseShareElementModeConcept(
  value: unknown
): ShareElementModeConcept | null {
  if (typeof value !== 'string') {
    return null;
  }

  return SHARE_ELEMENT_MODE_CONCEPTS.find((concept) => concept.slug === value) ?? null;
}

export function getShareElementModeConcept(
  value: unknown
): ShareElementModeConcept | null {
  if (typeof value === 'string') {
    return parseShareElementModeConcept(value);
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<ShareElementModeConcept>;
  return SHARE_ELEMENT_MODE_CONCEPTS.find(
    (concept) => concept.kind === candidate.kind && concept.value === candidate.value
  ) ?? null;
}

export function getShareElementsModesPath(
  locale: SupportedLocale,
  concept: ShareElementModeConcept | string | { kind: ShareElementModeConceptKind; value: string }
): string {
  const resolvedConcept = getShareElementModeConcept(concept);
  if (resolvedConcept === null) {
    throw new TypeError('Unknown Share elements-and-modes route identity');
  }

  return getLocalizedPath(
    locale,
    `${SHARE_ROUTE_BASES.elementsModes}${resolvedConcept.slug}/`
  );
}
