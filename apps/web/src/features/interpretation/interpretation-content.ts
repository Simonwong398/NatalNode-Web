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
