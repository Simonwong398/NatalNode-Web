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
  themes: readonly string[];
  expression: string;
  tension: string;
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
  guidance: string;
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
    themes: ['approach and self-presentation', 'personal agency', 'first impressions'],
    expression: 'taking action from a personal starting point',
    tension: 'A strong focus on self-direction can become overidentification with presentation or reacting before considering context.'
  },
  2: {
    focus: 'resources, values, and self-worth',
    themes: ['material resources', 'personal values', 'stability and self-worth'],
    expression: 'building stability around what feels genuinely worthwhile',
    tension: 'A wish for stability can become attachment to familiar comfort or treating worth as something that must be proven materially.'
  },
  3: {
    focus: 'learning, communication, and the immediate environment',
    themes: ['conversation and language', 'learning and skills', 'nearby connections'],
    expression: 'making meaning through questions, conversation, and practice',
    tension: 'Curiosity can become scattered attention or an urge to respond before listening closely.'
  },
  4: {
    focus: 'home, roots, and emotional foundations',
    themes: ['home and belonging', 'roots and memory', 'private foundations'],
    expression: 'shaping a private base that supports inner steadiness',
    tension: 'Protecting a private base can become holding too tightly to old patterns or avoiding needed change.'
  },
  5: {
    focus: 'creativity, play, romance, and self-expression',
    themes: ['creativity and play', 'romance and pleasure', 'wholehearted self-expression'],
    expression: 'making room for joy and wholehearted participation',
    tension: 'A desire for meaningful expression can become dependence on recognition or difficulty sharing the stage.'
  },
  6: {
    focus: 'daily routines, service, and skill-building',
    themes: ['daily routines', 'service and practical work', 'maintenance and skill-building'],
    expression: 'refining expression through useful habits and craft',
    tension: 'Attention to improvement can become overwork or treating everyday worth as a checklist.'
  },
  7: {
    focus: 'partnership, collaboration, and one-to-one encounter',
    themes: ['partnership', 'one-to-one encounter', 'reciprocity and agreements'],
    expression: 'learning through reciprocity and clear agreements',
    tension: 'A strong focus on partnership can become over-accommodation or expecting others to create balance alone.'
  },
  8: {
    focus: 'shared resources, trust, and emotional depth',
    themes: ['shared resources', 'trust and intimacy', 'transition and psychological depth'],
    expression: 'engaging meaningful change with care and honesty',
    tension: 'Depth can become pressure to control an uncertain process or assume meanings that need conversation.'
  },
  9: {
    focus: 'study, belief, travel, and wider meaning',
    themes: ['study and worldview', 'exploration and travel', 'belief and wider meaning'],
    expression: 'expanding perspective through exploration and reflection',
    tension: 'A search for wider meaning can become overconfidence or overlooking the details of immediate life.'
  },
  10: {
    focus: 'vocation, responsibility, and public contribution',
    themes: ['vocation and public role', 'responsibility and direction', 'visible contribution'],
    expression: 'shaping a visible role through sustained effort',
    tension: 'Ambition can become overidentification with status or measuring contribution only by recognition.'
  },
  11: {
    focus: 'friendship, community, and future aims',
    themes: ['friendship and networks', 'community and collaboration', 'future aims'],
    expression: 'contributing ideas and energy to a wider network',
    tension: 'Group ideals can become distance from individual needs or staying loyal to a future plan after it has changed.'
  },
  12: {
    focus: 'inner life, retreat, and unseen experience',
    themes: ['retreat and reflection', 'privacy and release', 'less-visible processes'],
    expression: 'making space for reflection, imagination, and release',
    tension: 'A need for retreat can become avoidance or make personal boundaries difficult to name.'
  }
};

export const ASPECT_DYNAMICS: Record<SupportedAspectType, AspectDynamic> = {
  conjunction: {
    quality: 'concentrated and merging',
    expression: 'bringing the two planetary themes into close dialogue',
    guidance: 'letting both themes inform one another without allowing either one to disappear'
  },
  opposition: {
    quality: 'polarizing and balancing',
    expression: 'highlighting a relationship between two complementary pulls',
    guidance: 'holding both perspectives long enough to find a workable balance'
  },
  trine: {
    quality: 'flowing and reinforcing',
    expression: 'making it easier for the two themes to support one another',
    guidance: 'using the natural ease intentionally rather than taking it for granted'
  },
  square: {
    quality: 'friction-producing and developmental',
    expression: 'bringing a challenge that can sharpen conscious choice',
    guidance: 'turning friction into feedback and giving the pressure a place for deliberate practice'
  },
  sextile: {
    quality: 'cooperative and opportunity-oriented',
    expression: 'opening a constructive channel when both themes are engaged',
    guidance: 'making a small, conscious choice to activate the available connection'
  }
};
