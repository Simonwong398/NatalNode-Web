/**
 * Stable Web presentation vocabulary for chart-facing domains.
 *
 * These curated sets identify the concepts the Web can present. They are not
 * astronomy calculations and do not replace facts supplied by the Engine.
 */
export const SUPPORTED_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto'
] as const;

export type SupportedPlanet = (typeof SUPPORTED_PLANETS)[number];

export const SUPPORTED_ASPECT_TYPES = [
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile'
] as const;

export type SupportedAspectType = (typeof SUPPORTED_ASPECT_TYPES)[number];

export const SIGN_CLASSIFICATIONS = Object.freeze([
  { id: 'aries', label: 'Aries', element: 'Fire', modality: 'Cardinal' },
  { id: 'taurus', label: 'Taurus', element: 'Earth', modality: 'Fixed' },
  { id: 'gemini', label: 'Gemini', element: 'Air', modality: 'Mutable' },
  { id: 'cancer', label: 'Cancer', element: 'Water', modality: 'Cardinal' },
  { id: 'leo', label: 'Leo', element: 'Fire', modality: 'Fixed' },
  { id: 'virgo', label: 'Virgo', element: 'Earth', modality: 'Mutable' },
  { id: 'libra', label: 'Libra', element: 'Air', modality: 'Cardinal' },
  { id: 'scorpio', label: 'Scorpio', element: 'Water', modality: 'Fixed' },
  { id: 'sagittarius', label: 'Sagittarius', element: 'Fire', modality: 'Mutable' },
  { id: 'capricorn', label: 'Capricorn', element: 'Earth', modality: 'Cardinal' },
  { id: 'aquarius', label: 'Aquarius', element: 'Air', modality: 'Fixed' },
  { id: 'pisces', label: 'Pisces', element: 'Water', modality: 'Mutable' }
] as const);

export type SignId = (typeof SIGN_CLASSIFICATIONS)[number]['id'];
export type SignElement = (typeof SIGN_CLASSIFICATIONS)[number]['element'];
export type SignModality = (typeof SIGN_CLASSIFICATIONS)[number]['modality'];

/** The canonical zodiac ordering used by the chart presentation layer. */
export const ZODIAC_SIGNS: readonly string[] = Object.freeze(
  SIGN_CLASSIFICATIONS.map(({ label }) => label)
);
