export interface Point {
  x: number;
  y: number;
}

export const CHART_VIEWBOX_SIZE = 640;
export const CHART_CENTER = CHART_VIEWBOX_SIZE / 2;
export const ZODIAC_OUTER_RADIUS = 292;
export const ZODIAC_INNER_RADIUS = 232;
export const HOUSE_INNER_RADIUS = 62;
export const HOUSE_LABEL_RADIUS = 214;
export const BODY_MARKER_RADIUS = 150;
export const BODY_LABEL_RADIUS = 182;
export const ASPECT_ENDPOINT_RADIUS = 138;
export const ANGLE_OUTER_RADIUS = 248;

/**
 * Presentation-only wheel convention: 0° is placed at 12 o'clock and
 * increasing supplied longitudes travel clockwise. Source values are never
 * changed; this rotation only determines SVG placement.
 */
export function longitudeToRadians(longitude: number): number {
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  return (normalizedLongitude * Math.PI) / 180 - Math.PI / 2;
}

export function longitudeToPoint(
  longitude: number,
  radius: number,
  center: number = CHART_CENTER
): Point {
  const angle = longitudeToRadians(longitude);

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  };
}

export function radialLine(
  longitude: number,
  innerRadius: number,
  outerRadius: number,
  center: number = CHART_CENTER
): { start: Point; end: Point } {
  return {
    start: longitudeToPoint(longitude, innerRadius, center),
    end: longitudeToPoint(longitude, outerRadius, center)
  };
}

export function annularSectorPath(
  startLongitude: number,
  endLongitude: number,
  outerRadius: number,
  innerRadius: number,
  center: number = CHART_CENTER
): string {
  const outerStart = longitudeToPoint(startLongitude, outerRadius, center);
  const outerEnd = longitudeToPoint(endLongitude, outerRadius, center);
  const innerEnd = longitudeToPoint(endLongitude, innerRadius, center);
  const innerStart = longitudeToPoint(startLongitude, innerRadius, center);
  const sweep = ((endLongitude - startLongitude) % 360 + 360) % 360;
  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}
