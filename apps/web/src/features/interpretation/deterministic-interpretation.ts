import type { AngleFact, BodyFact, ChartResult } from '@natalnode/contracts';
import {
  PLANET_MEANINGS,
  SIGN_STYLES,
  SUPPORTED_PLANETS,
  type SupportedPlanet
} from './interpretation-content';

export type InterpretationItem = {
  id: string;
  title: string;
  text: string;
  sourceFacts: string[];
};

export type InterpretationResult = {
  bigThree: InterpretationItem[];
  planetsInSigns: InterpretationItem[];
};

const BIG_THREE_PLANETS = ['Sun', 'Moon'] as const satisfies readonly SupportedPlanet[];

function findBody(chart: ChartResult, bodyId: SupportedPlanet): BodyFact | undefined {
  return chart.bodies.find((body) => body.bodyId === bodyId);
}

function findAngle(chart: ChartResult, angleId: string): AngleFact | undefined {
  return chart.angles.find((angle) => angle.angleId === angleId);
}

function composePlanetInSignText(planet: SupportedPlanet, sign: string): string | null {
  const meaning = PLANET_MEANINGS[planet];
  const style = SIGN_STYLES[sign];

  if (!style) {
    return null;
  }

  return `${meaning.focus} can take on a ${style.style} quality in ${sign}. This placement may show up as ${meaning.expression} while ${style.expression}.`;
}

function composeAscendantText(sign: string): string | null {
  const style = SIGN_STYLES[sign];

  if (!style) {
    return null;
  }

  return `The Ascendant can describe an outward approach rather than a fixed identity. In ${sign}, it may emphasize a ${style.style} way of entering situations, often ${style.expression}.`;
}

function createPlanetItem(
  body: BodyFact,
  planet: SupportedPlanet,
  idPrefix: string
): InterpretationItem | null {
  const text = composePlanetInSignText(planet, body.sign);

  if (!text) {
    return null;
  }

  return {
    id: `${idPrefix}-${planet.toLowerCase()}`,
    title: `${planet} in ${body.sign}`,
    text,
    sourceFacts: [body.bodyId]
  };
}

function createAscendantItem(angle: AngleFact): InterpretationItem | null {
  const text = composeAscendantText(angle.sign);

  if (!text) {
    return null;
  }

  return {
    id: 'big-three-ascendant',
    title: `Ascendant in ${angle.sign}`,
    text,
    sourceFacts: [angle.angleId]
  };
}

export function createDeterministicInterpretation(chart: ChartResult): InterpretationResult {
  const bigThree = BIG_THREE_PLANETS.flatMap((planet) => {
    const body = findBody(chart, planet);
    const item = body ? createPlanetItem(body, planet, 'big-three') : null;

    return item ? [item] : [];
  });

  const ascendant = findAngle(chart, 'ASC');
  const ascendantItem = ascendant ? createAscendantItem(ascendant) : null;

  if (ascendantItem) {
    bigThree.push(ascendantItem);
  }

  const planetsInSigns = SUPPORTED_PLANETS.flatMap((planet) => {
    const body = findBody(chart, planet);
    const item = body ? createPlanetItem(body, planet, 'planet-in-sign') : null;

    return item ? [item] : [];
  });

  return {
    bigThree,
    planetsInSigns
  };
}
