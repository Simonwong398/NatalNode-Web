export const LEARN_CATEGORY_KEYS = [
  'FOUNDATIONS',
  'PLANETS',
  'SIGNS',
  'HOUSES',
  'ASPECTS',
  'CHART_READING'
] as const;

export type LearnCategory = (typeof LEARN_CATEGORY_KEYS)[number];

export const LEARN_CATEGORIES = [
  {
    key: 'FOUNDATIONS',
    label: 'Foundations',
    description: 'Start with the vocabulary and structure used to read a natal chart.'
  },
  {
    key: 'PLANETS',
    label: 'Planets',
    description: 'Learn what each planet represents in an astrological chart.'
  },
  {
    key: 'SIGNS',
    label: 'Signs',
    description: 'Understand the twelve signs as styles of expression and attention.'
  },
  {
    key: 'HOUSES',
    label: 'Houses',
    description: 'Explore the life areas represented by the twelve houses.'
  },
  {
    key: 'ASPECTS',
    label: 'Aspects',
    description: 'See how angular relationships connect themes within a chart.'
  },
  {
    key: 'CHART_READING',
    label: 'Chart Reading',
    description: 'Bring individual chart elements together into a clear reading process.'
  }
] as const satisfies readonly {
  key: LearnCategory;
  label: string;
  description: string;
}[];

/**
 * Internal roadmap taxonomy only. These entries do not create routes or
 * public links until their underlying utilities exist.
 */
export const SEO_TOOL_TAXONOMY = [
  {
    intendedPath: '/tools/sign-lookup',
    label: 'Sign Lookup',
    purpose: 'Select a zodiac sign to explore its element, modality, and interpretive themes.',
    requiresEngine: false,
    status: 'AVAILABLE'
  },
  {
    intendedPath: '/tools/house-lookup',
    label: 'House Lookup',
    purpose: 'Select one of the twelve houses to explore its core domain and interpretive themes.',
    requiresEngine: false,
    status: 'AVAILABLE'
  },
  {
    intendedPath: '/tools/aspect-lookup',
    label: 'Aspect Lookup',
    purpose: 'Choose two planets and a major aspect to explore a deterministic educational interpretation.',
    requiresEngine: false,
    status: 'AVAILABLE'
  }
] as const;
