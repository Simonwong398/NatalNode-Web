import type { AngleFact, AspectFact, BodyFact, ChartResult } from '@natalnode/contracts';
import {
  ASPECT_DYNAMICS,
  HOUSE_DOMAINS,
  PLANET_MEANINGS,
  SIGN_STYLES,
  SUPPORTED_PLANETS,
  type SupportedAspectType,
  type SupportedPlanet
} from './interpretation-content';

export type InterpretationItem = {
  id: string;
  title: string;
  text: string;
  sourceFacts: string[];
  sourceContext?: string;
};

export type InterpretationResult = {
  bigThree: InterpretationItem[];
  planetsInSigns: InterpretationItem[];
  planetsInHouses: InterpretationItem[];
  majorAspects: InterpretationItem[];
};

const BIG_THREE_PLANETS = ['Sun', 'Moon'] as const satisfies readonly SupportedPlanet[];

function findBody(chart: ChartResult, bodyId: SupportedPlanet): BodyFact | undefined {
  return chart.bodies.find((body) => body.bodyId === bodyId);
}

function findAngle(chart: ChartResult, angleId: string): AngleFact | undefined {
  return chart.angles.find((angle) => angle.angleId === angleId);
}

function findSupportedBody(chart: ChartResult, bodyId: string) {
  const body = chart.bodies.find((candidate) => candidate.bodyId === bodyId);
  const planet = SUPPORTED_PLANETS.find((candidate) => candidate === body?.bodyId);

  return body && planet ? { body, planet } : null;
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

function createPlanetInHouseItem(
  body: BodyFact,
  planet: SupportedPlanet
): InterpretationItem | null {
  const house = body.house;

  if (typeof house !== 'number' || !Number.isInteger(house) || house < 1 || house > 12) {
    return null;
  }

  const domain = HOUSE_DOMAINS[house];
  const meaning = PLANET_MEANINGS[planet];

  if (!domain) {
    return null;
  }

  return {
    id: `planet-in-house-${planet.toLowerCase()}`,
    title: `${planet} in House ${house}`,
    text: `House ${house} brings attention to ${domain.focus}. In this area, ${planet}'s ${meaning.focus.toLowerCase()} may show up as ${meaning.expression}, especially while ${domain.expression}.`,
    sourceFacts: [body.bodyId],
    sourceContext: `${body.bodyId} — House ${house}`
  };
}

function composeAspectText(
  firstPlanet: SupportedPlanet,
  secondPlanet: SupportedPlanet,
  aspectType: SupportedAspectType
): string {
  const firstMeaning = PLANET_MEANINGS[firstPlanet];
  const secondMeaning = PLANET_MEANINGS[secondPlanet];
  const dynamic = ASPECT_DYNAMICS[aspectType];

  return `${firstPlanet}'s ${firstMeaning.focus.toLowerCase()} and ${secondPlanet}'s ${secondMeaning.focus.toLowerCase()} can meet through a ${dynamic.quality} ${aspectType} dynamic. This aspect may show up as ${dynamic.expression}, giving both themes a place in the same pattern of response.`;
}

function isSupportedAspectType(type: string): type is SupportedAspectType {
  return Object.prototype.hasOwnProperty.call(ASPECT_DYNAMICS, type);
}

function isSupportedPhaseState(phaseState: AspectFact['phaseState']): boolean {
  return (
    phaseState === null ||
    phaseState === 'APPLYING' ||
    phaseState === 'EXACT' ||
    phaseState === 'SEPARATING'
  );
}

function createAspectItem(chart: ChartResult, aspect: AspectFact): InterpretationItem | null {
  if (!isSupportedAspectType(aspect.type) || !Number.isFinite(aspect.orb) || aspect.orb < 0) {
    return null;
  }

  if (!isSupportedPhaseState(aspect.phaseState)) {
    return null;
  }

  const firstBody = findSupportedBody(chart, aspect.firstBodyId);
  const secondBody = findSupportedBody(chart, aspect.secondBodyId);

  if (!firstBody || !secondBody) {
    return null;
  }

  const phaseContext = aspect.phaseState ? ` — ${aspect.phaseState}` : '';

  return {
    id: `aspect-${aspect.firstBodyId.toLowerCase()}-${aspect.type}-${aspect.secondBodyId.toLowerCase()}`,
    title: `${aspect.firstBodyId} ${aspect.type} ${aspect.secondBodyId}`,
    text: composeAspectText(firstBody.planet, secondBody.planet, aspect.type),
    sourceFacts: [aspect.firstBodyId, aspect.secondBodyId],
    sourceContext: `${aspect.firstBodyId} ${aspect.type} ${aspect.secondBodyId} — orb ${aspect.orb}°${phaseContext}`
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

  const planetsInHouses = SUPPORTED_PLANETS.flatMap((planet) => {
    const body = findBody(chart, planet);
    const item = body ? createPlanetInHouseItem(body, planet) : null;

    return item ? [item] : [];
  });

  const majorAspects = chart.aspects.flatMap((aspect) => {
    const item = createAspectItem(chart, aspect);

    return item ? [item] : [];
  });

  return {
    bigThree,
    planetsInSigns,
    planetsInHouses,
    majorAspects
  };
}
