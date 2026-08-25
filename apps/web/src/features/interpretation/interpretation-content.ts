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

export type PlanetMeaning = {
  focus: string;
  expression: string;
};

export type SignStyle = {
  style: string;
  expression: string;
};

export type HouseDomain = {
  focus: string;
  expression: string;
};

export type SupportedAspectType =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile';

export type AspectDynamic = {
  quality: string;
  expression: string;
};

export const PLANET_MEANINGS: Record<SupportedPlanet, PlanetMeaning> = {
  Sun: {
    focus: 'Identity and vitality',
    expression: 'developing confidence through purposeful self-expression'
  },
  Moon: {
    focus: 'Emotional needs and felt security',
    expression: 'processing experience through moods, memory, and belonging'
  },
  Mercury: {
    focus: 'Thinking and communication',
    expression: 'choosing words and questions that help experience make sense'
  },
  Venus: {
    focus: 'Connection, pleasure, and values',
    expression: 'building closeness through affection, taste, and reciprocity'
  },
  Mars: {
    focus: 'Drive and assertion',
    expression: 'directing energy toward what feels worth pursuing'
  },
  Jupiter: {
    focus: 'Growth and meaning',
    expression: 'expanding perspective through learning and generous engagement'
  },
  Saturn: {
    focus: 'Boundaries and responsibility',
    expression: 'developing strength through patience, structure, and practice'
  },
  Uranus: {
    focus: 'Change and independence',
    expression: 'making room for new approaches when familiar patterns feel limiting'
  },
  Neptune: {
    focus: 'Imagination and sensitivity',
    expression: 'responding to subtle impressions through empathy and vision'
  },
  Pluto: {
    focus: 'Depth and transformation',
    expression: 'meeting change by examining what has become too small or outgrown'
  }
};

export const SIGN_STYLES: Record<string, SignStyle> = {
  Aries: {
    style: 'direct and initiating',
    expression: 'moving from instinct toward action'
  },
  Taurus: {
    style: 'steady and sensory',
    expression: 'prioritizing patience, consistency, and tangible values'
  },
  Gemini: {
    style: 'curious and adaptable',
    expression: 'following questions and exchanging ideas'
  },
  Cancer: {
    style: 'protective and emotionally attuned',
    expression: 'responding through care, memory, and belonging'
  },
  Leo: {
    style: 'warm and expressive',
    expression: 'letting creativity and wholehearted presence lead'
  },
  Virgo: {
    style: 'precise and improvement-oriented',
    expression: 'turning attention toward useful details'
  },
  Libra: {
    style: 'relational and balancing',
    expression: 'weighing perspectives and seeking mutuality'
  },
  Scorpio: {
    style: 'intense and discerning',
    expression: 'staying close to what is meaningful beneath the surface'
  },
  Sagittarius: {
    style: 'expansive and truth-seeking',
    expression: 'learning through exploration, candor, and wider context'
  },
  Capricorn: {
    style: 'structured and goal-aware',
    expression: 'building authority through patience and responsibility'
  },
  Aquarius: {
    style: 'independent and future-facing',
    expression: 'making room for original ideas and collective concerns'
  },
  Pisces: {
    style: 'imaginative and empathic',
    expression: 'allowing intuition and compassion to guide perception'
  }
};

export const HOUSE_DOMAINS: Record<number, HouseDomain> = {
  1: {
    focus: 'identity, initiative, and self-direction',
    expression: 'taking action from a personal starting point'
  },
  2: {
    focus: 'resources, values, and self-worth',
    expression: 'building stability around what feels genuinely worthwhile'
  },
  3: {
    focus: 'learning, communication, and the immediate environment',
    expression: 'making meaning through questions, conversation, and practice'
  },
  4: {
    focus: 'home, roots, and emotional foundations',
    expression: 'shaping a private base that supports inner steadiness'
  },
  5: {
    focus: 'creativity, play, romance, and self-expression',
    expression: 'making room for joy and wholehearted participation'
  },
  6: {
    focus: 'daily routines, service, and skill-building',
    expression: 'refining expression through useful habits and craft'
  },
  7: {
    focus: 'partnership, collaboration, and one-to-one encounter',
    expression: 'learning through reciprocity and clear agreements'
  },
  8: {
    focus: 'shared resources, trust, and emotional depth',
    expression: 'engaging meaningful change with care and honesty'
  },
  9: {
    focus: 'study, belief, travel, and wider meaning',
    expression: 'expanding perspective through exploration and reflection'
  },
  10: {
    focus: 'vocation, responsibility, and public contribution',
    expression: 'shaping a visible role through sustained effort'
  },
  11: {
    focus: 'friendship, community, and future aims',
    expression: 'contributing ideas and energy to a wider network'
  },
  12: {
    focus: 'inner life, retreat, and unseen experience',
    expression: 'making space for reflection, imagination, and release'
  }
};

export const ASPECT_DYNAMICS: Record<SupportedAspectType, AspectDynamic> = {
  conjunction: {
    quality: 'concentrated and merging',
    expression: 'bringing the two planetary themes into close dialogue'
  },
  opposition: {
    quality: 'polarizing and balancing',
    expression: 'highlighting a relationship between two complementary pulls'
  },
  trine: {
    quality: 'flowing and reinforcing',
    expression: 'making it easier for the two themes to support one another'
  },
  square: {
    quality: 'friction-producing and developmental',
    expression: 'bringing a challenge that can sharpen conscious choice'
  },
  sextile: {
    quality: 'cooperative and opportunity-oriented',
    expression: 'opening a constructive channel when both themes are engaged'
  }
};
